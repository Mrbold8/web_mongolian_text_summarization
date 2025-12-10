"use client";

import React, { useState } from 'react';
import { FileText, Loader2, Copy, Check, Info } from 'lucide-react';
import {
  SUMMARIZER_MODELS,
  DEFAULT_SUMMARIZER_MODEL_ID,
} from '@/config/summarizerModels';
import {
  SUMMARY_TONES,
  DEFAULT_SUMMARY_TONE_ID,
} from '@/config/summaryTones';
import {
  SUMMARY_LENGTHS,
  DEFAULT_SUMMARY_LENGTH_ID,
} from '@/config/summaryLengths';

const TASK_OPTIONS = [
  {
    id: 'summary',
    label: 'Хураангуй үүсгэх',
    actionLabel: 'Хураангуйлах',
    loadingLabel: 'Хураангуйлж байна...',
    outputLabel: 'Хураангуй',
    emptyState: 'Таны хураангуй энд гарч ирнэ...',
    description: 'Гол агуулгыг багтаасан товч хураангуй үүсгэнэ.',
  },
  {
    id: 'title',
    label: 'Гарчиг үүсгэх',
    actionLabel: 'Гарчиг үүсгэх',
    loadingLabel: 'Гарчиг үүсгэж байна...',
    outputLabel: 'Гарчиг',
    emptyState: 'Гарчиг энд гарч ирнэ...',
    description: 'Текстийн гол санааг илэрхийлэх гарчиг санал болгоно.',
  },
  {
    id: 'keywords',
    label: 'Түлхүүр үг үүсгэх',
    actionLabel: 'Түлхүүр үг үүсгэх',
    loadingLabel: 'Түлхүүр үг үүсгэж байна...',
    outputLabel: 'Түлхүүр үгс',
    emptyState: 'Үүсгэсэн түлхүүр үгс энд харагдана...',
    description: 'Текстээс хамгийн чухал түлхүүр үгсийг ялгана.',
  },
] as const;

type TaskOption = (typeof TASK_OPTIONS)[number];
const GENERIC_ERROR_MESSAGE =
  'Үр дүн үүсгэхэд алдаа гарлаа. Дахин оролдоно уу.';

type ApiErrorResponse = {
  error?: string;
  details?: unknown;
};

function buildErrorMessage(payload: ApiErrorResponse | null | undefined) {
  if (!payload) {
    return undefined;
  }

  const detailText =
    typeof payload.details === 'string'
      ? payload.details
      : payload.details
      ? JSON.stringify(payload.details)
      : '';

  if (!payload.error && !detailText) {
    return undefined;
  }

  return detailText
    ? `${payload.error || GENERIC_ERROR_MESSAGE}: ${detailText}`
    : payload.error;
}

export default function TextSummarizer() {
  const [inputText, setInputText] = useState('');
  const [summary, setSummary] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [uploadedFileName, setUploadedFileName] = useState('');
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');
  const [modelId, setModelId] = useState(DEFAULT_SUMMARIZER_MODEL_ID);
  const [taskType, setTaskType] = useState<TaskOption['id']>('summary');
  const [summaryToneId, setSummaryToneId] = useState(
    DEFAULT_SUMMARY_TONE_ID
  );
  const [summaryLengthId, setSummaryLengthId] = useState(
    DEFAULT_SUMMARY_LENGTH_ID
  );

  const selectedModel =
    SUMMARIZER_MODELS.find((model) => model.id === modelId) ??
    SUMMARIZER_MODELS[0];
  const selectedTask =
    TASK_OPTIONS.find((task) => task.id === taskType) ?? TASK_OPTIONS[0];
  const selectedTone =
    SUMMARY_TONES.find((tone) => tone.id === summaryToneId) ??
    SUMMARY_TONES[0];
  const selectedLength =
    SUMMARY_LENGTHS.find((length) => length.id === summaryLengthId) ??
    SUMMARY_LENGTHS[0];

  const handleSummarize = async () => {
    if (!inputText.trim()) {
      setError('Боловсруулах текстээ оруулна уу.');
      return;
    }

    setLoading(true);
    setError('');
    setSummary('');

    try {
      const response = await fetch('/api/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: inputText,
          modelId,
          taskType,
          toneId: summaryToneId,
          lengthId: summaryLengthId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(buildErrorMessage(data) || GENERIC_ERROR_MESSAGE);
        return;
      }

      setSummary(data.summary);
    } catch (error) {
      console.error('Summarization request failed:', error);
      setError(GENERIC_ERROR_MESSAGE);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(summary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClear = () => {
    setInputText('');
    setSummary('');
    setError('');
    setUploadError('');
    setUploadedFileName('');
  };

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadError('');
    setError('');
    setSummary('');

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/pdf-extract', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        setUploadError(
          buildErrorMessage(data) || 'PDF уншихад алдаа гарлаа.'
        );
        return;
      }

      setInputText(data.text || '');
      setUploadedFileName(file.name || '');
    } catch (uploadErr) {
      console.error('PDF upload failed:', uploadErr);
      setUploadError('PDF уншихад алдаа гарлаа.');
    } finally {
      setUploading(false);
      event.target.value = '';
    }
  };

  return (
    <div className="relative min-h-screen bg-[#f8fafc]">
      <div className="absolute inset-0 opacity-60 bg-[radial-gradient(circle_at_top,_rgba(148,163,184,0.35),_transparent_50%)] pointer-events-none" />
      <div className="absolute inset-x-0 top-[-5rem] mx-auto h-72 w-[32rem] bg-gradient-to-r from-sky-200 via-indigo-200 to-transparent blur-[110px] opacity-50 pointer-events-none" />

      <div className="relative max-w-5xl mx-auto px-6 py-10">
        {/* Header */}
        <div className="text-center mb-10">
        <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white shadow-sm border border-slate-200 text-[11px] uppercase tracking-[0.3em] text-slate-500">
            <FileText className="w-4 h-4 text-sky-500" />
            Summarizer
          </span>
          <h1 className="text-3xl md:text-4xl font-semibold text-slate-900 mt-4">
            Бичвэр Хураангуйлах Хэрэгсэл
          </h1>
          <p className="text-slate-600 text-sm mt-2">
            Текстээ оруулаад товч хураангуй авах
          </p>
        </div>

        {/* Main Content */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Input Section */}
          <div className="bg-white/90 rounded-2xl border border-white shadow-xl shadow-slate-200/50 p-6 backdrop-blur">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Оролтын Текст
            </label>
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Текстээ энд хуулж бичнэ үү..."
              className="w-full h-64 p-4 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-200 resize-none text-sm text-slate-700"
            />
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mt-4 mb-3">
              <div>
                <p className="text-xs font-medium text-slate-600">
                  PDF-ээс текст унших
                </p>
                <p className="text-[11px] text-slate-500">
                  PDF оруулбал текстийг автоматаар оруулна.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <label
                  htmlFor="pdf-upload"
                  className={`inline-flex items-center gap-2 px-3 py-2 text-sm rounded-lg border transition-all cursor-pointer ${
                    uploading
                      ? 'bg-slate-200 border-slate-200 text-slate-500 cursor-not-allowed'
                      : 'bg-white border-slate-200 hover:border-sky-300 hover:text-sky-700'
                  }`}
                >
                  {uploading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Уншиж байна...
                    </>
                  ) : (
                    <>
                      <FileText className="w-4 h-4 text-sky-500" />
                      PDF оруулах
                    </>
                  )}
                </label>
                <input
                  id="pdf-upload"
                  type="file"
                  accept="application/pdf"
                  className="hidden"
                  onChange={handleFileChange}
                  disabled={uploading}
                />
              </div>
            </div>
            {uploadedFileName && !uploading && (
              <p className="text-xs text-slate-500 mb-2">
                Илгээсэн файл: <span className="font-semibold">{uploadedFileName}</span>
              </p>
            )}
            {uploadError && (
              <div className="mb-2 p-2 rounded-lg border border-red-200 bg-red-50 text-xs text-red-600">
                {uploadError}
              </div>
            )}
            <div className="mt-4">
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Аль model сонгох вэ?
              </label>
              <select
                value={modelId}
                onChange={(event) => setModelId(event.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-200 bg-white"
              >
                {SUMMARIZER_MODELS.map((model) => (
                  <option key={model.id} value={model.id}>
                    {model.label}
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-slate-500 mt-1">
                Сонгосон model -ийн Hugging Face endpoint руу хүсэлт илгээнэ.
              </p>
            </div>

            <div className="mt-4">
              <label className="block text-xs font-medium text-slate-600 mb-2">
                Ямар даалгавар гүйцэтгэх вэ?
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {TASK_OPTIONS.map((task) => {
                  const isActive = task.id === taskType;
                  return (
                    <button
                      key={task.id}
                      type="button"
                      onClick={() => setTaskType(task.id)}
                      className={`text-left p-3 rounded-xl border transition-all ${
                        isActive
                          ? 'border-sky-400 bg-sky-50 shadow-sm'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <p className="text-sm font-semibold text-slate-800">
                        {task.label}
                      </p>
                      <p className="text-[11px] text-slate-500 mt-1">
                        {task.description}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>
            {taskType === 'summary' && (
              <>
                <div className="mt-4">
                  <label className="block text-xs font-medium text-slate-600 mb-2">
                    Хураангуйн өнгө аяс
                  </label>
                  <select
                    value={summaryToneId}
                    onChange={(event) => setSummaryToneId(event.target.value)}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-200 bg-white"
                  >
                    {SUMMARY_TONES.map((tone) => (
                      <option key={tone.id} value={tone.id}>
                        {tone.label}
                      </option>
                    ))}
                  </select>
                  <p className="text-[11px] text-slate-500 mt-1">
                    {selectedTone?.description}
                  </p>
                </div>
                <div className="mt-4">
                  <label className="block text-xs font-medium text-slate-600 mb-2">
                    Хураангуйн урт
                  </label>
                  <select
                    value={summaryLengthId}
                    onChange={(event) => setSummaryLengthId(event.target.value)}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-200 bg-white"
                  >
                    {SUMMARY_LENGTHS.map((length) => (
                      <option key={length.id} value={length.id}>
                        {length.label}
                      </option>
                    ))}
                  </select>
                  <p className="text-[11px] text-slate-500 mt-1">
                    {selectedLength?.description}
                  </p>
                </div>
              </>
            )}
            <div className="flex items-center justify-between mt-4">
              <span className="text-xs text-slate-500">
                {inputText.length} тэмдэгт
              </span>
              <div className="flex gap-2">
                <button
                  onClick={handleClear}
                  className="px-4 py-2 text-sm text-slate-600 hover:text-slate-900 transition-colors rounded-lg border border-transparent hover:border-slate-200"
                >
                  Цэвэрлэх
                </button>
                <button
                  onClick={handleSummarize}
                  disabled={loading || !inputText.trim()}
                  className="px-6 py-2 bg-gradient-to-r from-sky-500 to-indigo-500 text-white rounded-lg hover:from-sky-600 hover:to-indigo-600 disabled:bg-slate-300 disabled:cursor-not-allowed transition-all text-sm font-semibold flex items-center gap-2 shadow-lg shadow-sky-200/60 disabled:shadow-none"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      {selectedTask.loadingLabel}
                    </>
                  ) : (
                    selectedTask.actionLabel
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Output Section */}
          <div className="bg-white/95 rounded-2xl border border-white shadow-lg shadow-slate-200/60 p-6 backdrop-blur">
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-slate-700">
                {selectedTask.outputLabel}
              </label>
              {summary && (
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1 text-xs text-slate-600 hover:text-slate-900 transition-colors"
                >
                  {copied ? (
                    <>
                      <Check className="w-3 h-3" />
                      Хуулсан
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      Хуулах
                    </>
                  )}
                </button>
              )}
            </div>
            <div className="w-full h-64 p-4 border border-slate-200 rounded-xl bg-gradient-to-br from-slate-50 to-white overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
                </div>
              ) : summary ? (
                <p className="text-sm text-slate-700 leading-relaxed">{summary}</p>
              ) : (
                <p className="text-sm text-slate-400 italic">
                  {selectedTask.emptyState}
                </p>
              )}
            </div>
            {error && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <div className="mt-4 flex items-start gap-3 rounded-xl border border-slate-100 bg-gradient-to-br from-white via-slate-50 to-slate-100 p-3 text-xs text-slate-600 shadow-sm">
              <Info className="w-4 h-4 text-slate-500 mt-0.5" />
              <div>
                <p className="text-[11px] uppercase tracking-[0.2em] text-slate-400">
                  Ашигласан Model
                </p>
                <p className="text-sm font-semibold text-slate-800">
                  {selectedModel?.label}
                </p>
                <p className="text-[12px] text-slate-600">
                  {selectedModel?.description || 'Model-ийн тайлбар оруулаагүй байна.'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* API Integration Note */}
        <div className="mt-10 rounded-2xl border border-slate-200 bg-white/90 p-5 shadow-md shadow-slate-200/50">
          <h3 className="text-sm font-semibold text-slate-800 mb-2 flex items-center gap-2">
            🔌 API Холболтод Бэлэн
            <span className="text-[11px] uppercase tracking-[0.2em] text-slate-400">
              Hugging Face
            </span>
          </h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Inference endpoint -оор хүссэн model -тойгоо холбож ашиглахад бэлэн. Санал болгох
            загварууд: <code className="bg-slate-100 px-1 rounded">amaraaa/mt5-small-summarization-mn-v1</code>
            эсвэл <code className="bg-slate-100 px-1 rounded">google/mt5-small</code>
          </p>
        </div>

      </div>
    </div>
  );
}
