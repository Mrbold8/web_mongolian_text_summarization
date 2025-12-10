import { NextRequest, NextResponse } from 'next/server';
import {
  DEFAULT_SUMMARIZER_MODEL_ID,
  getSummarizerModelById,
} from '@/config/summarizerModels';
import {
  DEFAULT_SUMMARY_TONE_ID,
  getSummaryToneById,
} from '@/config/summaryTones';
import {
  DEFAULT_SUMMARY_LENGTH_ID,
  getSummaryLengthById,
} from '@/config/summaryLengths';

const HF_API_TOKEN = process.env.HF_API_TOKEN;

type TaskConfig = {
  prefix?: string;
  prompt?: string;
  parameters: {
    max_length: number;
    min_length: number;
  };
};

const TASK_CONFIG = {
  summary: {
    parameters: {
      max_length: 180,
      min_length: 90,
    },
  },
  title: {
    prefix: 'title:',
    prompt:
      'Generate a concise Mongolian title that captures the main idea of the following text.',
    parameters: {
      max_length: 60,
      min_length: 42,
    },
  },
  keywords: {
    prefix: 'keywords:',
    prompt:
      'Extract 5-10 concise Mongolian keywords from the following text. Each keyword should be 3 words. Return only the keywords, comma-separated.',
    parameters: {
      max_length: 80,
      min_length: 16,
    },
  },
} satisfies Record<'summary' | 'title' | 'keywords', TaskConfig>;

type TaskType = keyof typeof TASK_CONFIG;

const DEFAULT_TASK: TaskType = 'summary';

type SummarizeRequest = {
  text?: unknown;
  modelId?: string;
  taskType?: string;
  toneId?: string;
  lengthId?: string;
};

export async function POST(request: NextRequest) {
  const { text, modelId, taskType, toneId, lengthId }: SummarizeRequest =
    (await request.json().catch(() => null)) ?? {};

  if (!text || typeof text !== 'string' || !text.trim()) {
    return NextResponse.json(
      { error: 'Оролтын текст илгээгээгүй байна.' },
      { status: 400 }
    );
  }

  const selectedModel =
    getSummarizerModelById(modelId) ??
    getSummarizerModelById(DEFAULT_SUMMARIZER_MODEL_ID);

  if (!selectedModel) {
    return NextResponse.json(
      { error: 'Ашиглах model олдсонгүй. Серверийн тохиргоог шалгана уу.' },
      { status: 500 }
    );
  }

  const hfEndpoint = process.env[selectedModel.envVar];

  if (!hfEndpoint) {
    return NextResponse.json(
      {
        error: 'Model -ийн endpoint тохируулсангүй.',
        details: `Environment variable ${selectedModel.envVar} is missing.`,
      },
      { status: 500 }
    );
  }

  const selectedTask: TaskType = isTaskType(taskType) ? taskType : DEFAULT_TASK;
  const selectedTone =
    selectedTask === 'summary'
      ? getSummaryToneById(toneId) ??
        getSummaryToneById(DEFAULT_SUMMARY_TONE_ID)
      : null;
  const selectedLength =
    selectedTask === 'summary'
      ? getSummaryLengthById(lengthId) ??
        getSummaryLengthById(DEFAULT_SUMMARY_LENGTH_ID)
      : null;
  const useNewTokenLength =
    selectedModel.label === 'facebook/mBART-50-large';

  try {
    const hfResponse = await fetch(hfEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(HF_API_TOKEN ? { Authorization: `Bearer ${HF_API_TOKEN}` } : {}),
      },
      body: JSON.stringify(
        buildInferencePayload(text, selectedTask, {
          toneInstruction: selectedTone?.instruction,
          lengthParameters: selectedLength?.parameters,
          useNewTokenLength,
        })
      ),
    });

    const isJson = hfResponse.headers.get('content-type')?.includes('application/json');
    const payload = isJson ? await hfResponse.json() : await hfResponse.text();

    if (!hfResponse.ok) {
      const description =
        typeof payload === 'string'
          ? payload
          : payload?.error || payload?.errors || 'Unknown error from inference endpoint.';

      console.error('HF inference returned an error', {
        status: hfResponse.status,
        description,
      });

      return NextResponse.json(
        { error: 'Service алдаа өглөө.', details: description },
        { status: hfResponse.status }
      );
    }

    const rawSummary =
      Array.isArray(payload)
        ? payload[0]?.summary_text || payload[0]?.generated_text
        : payload?.summary_text || payload?.generated_text;

    const summary = sanitizeSummary(rawSummary);

    if (!summary) {
      return NextResponse.json(
        { error: 'Model -оос хураангуй хүлээн авсангүй.' },
        { status: 502 }
      );
    }

    return NextResponse.json({
      summary,
      taskType: selectedTask,
      toneId: selectedTone?.id ?? null,
      lengthId: selectedLength?.id ?? null,
    });
  } catch (error) {
    console.error('Hugging Face inference error:', error);

    return NextResponse.json(
      { error: 'Хураангуй үүсгэхэд алдаа гарлаа. Дахин оролдоно уу.' },
      { status: 500 }
    );
  }
}

function buildInferencePayload(
  text: string,
  taskType: TaskType,
  options?: {
    toneInstruction?: string;
    lengthParameters?: TaskConfig['parameters'];
    useNewTokenLength?: boolean;
  }
) {
  const taskConfig = TASK_CONFIG[taskType];
  const baseParameters = {
    do_sample: false,
    num_beams: 6,
    no_repeat_ngram_size: 3,
    length_penalty: 1.0,
    early_stopping: true,
  };
  const trimmedText = text.trim();

  if (taskType === 'summary') {
    const toneInstruction = options?.toneInstruction?.trim();
    const inputs = toneInstruction
      ? `${toneInstruction}\n\n===\n${trimmedText}`
      : trimmedText;
    const mergedLengths = {
      ...taskConfig.parameters,
      ...(options?.lengthParameters ?? {}),
    };

    if (options?.useNewTokenLength) {
      const parameters: Record<string, unknown> = { ...baseParameters };

      if (typeof mergedLengths.max_length === 'number') {
        parameters.max_new_tokens = mergedLengths.max_length;
      }

      return { inputs, parameters };
    }

    return {
      inputs,
      parameters: {
        ...baseParameters,
        ...mergedLengths,
      },
    };
  }

  const prefix = taskConfig.prefix?.trim();
  const instruction = taskConfig.prompt?.trim();

  let inputs = trimmedText;

  if (instruction) {
    const body = prefix ? `${prefix} ${trimmedText}` : trimmedText;
    inputs = `${instruction}\n\n===\n${body}`;
  } else if (prefix) {
    inputs = `${prefix} ${trimmedText}`;
  }

//   <instruction>
// ===
// <prefix + text or text>

  return {
    inputs,
    parameters: {
      ...baseParameters,
      ...taskConfig.parameters,
    },
  };
}

function sanitizeSummary(value: unknown): string {
  if (typeof value !== 'string') {
    return '';
  }

  const cleaned = value
    .replace(/<extra_id_\d+>/gi, '')
    .replace(/<\/?s>/gi, '')
    .replace(/\s+/g, ' ')
    .trim();

  return cleaned;
}

function isTaskType(value: unknown): value is TaskType {
  return typeof value === 'string' && value in TASK_CONFIG;
}
