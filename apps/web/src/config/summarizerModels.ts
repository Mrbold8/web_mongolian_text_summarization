export type SummarizerModelOption = {
  id: string;
  label: string;
  description?: string;
  envVar: string;
};

export const SUMMARIZER_MODELS: SummarizerModelOption[] = [
  {
    id: 'default',
    label: 'google/mT5-small',
    description: 'Parameter -ийн хэмжээ: 300 сая',
    envVar: 'HF_SUMMARIZER_ENDPOINT',
  },
  {
    id: 'alt-1',
    label: 'google/mT5-Base',
    description: 'Parameter -ийн хэмжээ: 580 сая.',
    envVar: 'HF_SUMMARIZER_ENDPOINT_2',
  },
  {
    id: 'alt-2',
    label: 'facebook/mBART-50-large',
    description: 'Parameter -ийн хэмжээ: 611 сая.',
    envVar: 'HF_SUMMARIZER_ENDPOINT_3',
  },
  {
    id: 'alt-3',
    label: 'mT5-base-Multi-Task',
    description: 'Parameter -ийн хэмжээ: 580 сая.',
    envVar: 'HF_SUMMARIZER_ENDPOINT_4',
  },
  {
    id: 'alt-4',
    label: 'gpt2-mongolian',
    description: 'Parameter -ийн хэмжээ: 124 сая.',
    envVar: 'HF_SUMMARIZER_ENDPOINT_5',
  },
];

export const DEFAULT_SUMMARIZER_MODEL_ID =
  SUMMARIZER_MODELS[0]?.id ?? 'default';

export function getSummarizerModelById(id?: string) {
  return SUMMARIZER_MODELS.find((model) => model.id === id);
}
