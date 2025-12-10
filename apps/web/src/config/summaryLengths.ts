export type SummaryLengthOption = {
  id: string;
  label: string;
  description: string;
  parameters: {
    max_length: number;
    min_length: number;
  };
};

export const SUMMARY_LENGTHS: SummaryLengthOption[] = [
  {
    id: 'short',
    label: 'Богино',
    description: '1 -ээс 2 өгүүлбэртэй хураангуй.',
    parameters: {
      max_length: 60,
      min_length: 40,
    },
  },
  {
    id: 'medium',
    label: 'Дунд',
    description: 'Дунд зэрэг, 3 -аас 4 өгүүлбэртэй хураангуй.',
    parameters: {
      max_length: 180,
      min_length: 120,
    },
  },
  {
    id: 'detailed',
    label: 'Урт',
    description: 'Илүү дэлгэрэнгүй, 200+ үгтэй хураангуй.',
    parameters: {
      max_length: 260,
      min_length: 210,
    },
  },
];

export const DEFAULT_SUMMARY_LENGTH_ID =
  SUMMARY_LENGTHS[1]?.id ?? 'medium';

export function getSummaryLengthById(id?: string) {
  return SUMMARY_LENGTHS.find((length) => length.id === id);
}
