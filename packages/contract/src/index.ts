import { z } from "zod";

/** Client → Server payload for summarization */
export const SummarizeRequestSchema = z.object({
  text: z
    .string()
    .min(1, "Өгүүлбэр эсвэл догол мөрөө оруулна уу.")
    .max(20000, "Дээд тал нь 20,000 тэмдэгт."),
  maxWords: z.number().int().min(10).max(400).optional(), // precise cap (optional)
  language: z.enum(["mn"]).default("mn")
});
export type SummarizeRequest = z.infer<typeof SummarizeRequestSchema>;

/** Server → Client success shape */
export const SummarySchema = z.object({
  summary: z.string(),
  model: z.string().optional(),
  promptTokens: z.number().optional(),
  completionTokens: z.number().optional(),
  latencyMs: z.number().optional(),
  traceId: z.string().optional()
});
export type Summary = z.infer<typeof SummarySchema>;

/** Server → Client error shape */
export const ErrorResponseSchema = z.object({
  error: z.string(),
  traceId: z.string().optional()
});
export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;
