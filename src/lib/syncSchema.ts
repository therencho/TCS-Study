import { z } from "zod";

const ymd = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const iso = z.string().datetime({ offset: true });

export const RecSchema = z.object({
  box: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5)]),
  due: ymd,
  right: z.number().int().min(0).max(100_000),
  wrong: z.number().int().min(0).max(100_000),
  last: iso,
});

export const AttemptSchema = z.object({
  itemId: z.string().max(100),
  correct: z.boolean(),
  at: iso,
});
export type Attempt = z.infer<typeof AttemptSchema>;

export const SyncRequest = z.object({
  records: z.record(z.string().max(100), RecSchema).default({}),
  attempts: z.array(AttemptSchema).max(2000).default([]),
});
export type SyncRequest = z.infer<typeof SyncRequest>;
