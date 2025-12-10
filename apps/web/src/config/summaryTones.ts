export type SummaryToneOption = {
  id: string;
  label: string;
  description: string;
  instruction: string;
};

export const SUMMARY_TONES: SummaryToneOption[] = [
  {
    id: 'neutral',
    label: 'Энгийн',
    description: 'Энгийн, товч хураангуй.',
    instruction:
      '',
  },
  {
    id: 'formal',
    label: 'Албан ёсны',
    description: 'Мэргэжлийн, шийдэмгий хэв маяг.',
    instruction:
      'Summarize the following Mongolian text in a professional, formal tone.',
  },
];

export const DEFAULT_SUMMARY_TONE_ID =
  SUMMARY_TONES[0]?.id ?? 'neutral';

export function getSummaryToneById(id?: string) {
  return SUMMARY_TONES.find((tone) => tone.id === id);
}
