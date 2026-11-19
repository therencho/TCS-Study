import { z } from "zod";

/** Accepted answer: one string or a list of alternatives. */
const Accept = z.union([z.string(), z.array(z.string()).min(1)]);
export type Accept = z.infer<typeof Accept>;

const Base = z.object({
  id: z.string().regex(/^[A-Z][0-9]{1,2}-[a-z0-9-]+$/, "id must look like B1-some-name"),
  module: z.string(),
  phase: z.union([z.literal(1), z.literal(2)]),
  refs: z.array(z.string()).default([]),
  category: z.enum(["I", "II", "III", "IV"]).optional(),
  exam_seen: z.array(z.string()).optional(),
  difficulty: z.union([z.literal(1), z.literal(2), z.literal(3)]).default(1),
  prompt: z.string(),
  explain: z.string(),
});

export const ClozeItem = Base.extend({
  block: z.literal("cloze"),
  template: z.string(),
  answers: z.array(Accept).min(1),
  caseSensitive: z.boolean().default(false),
});

export const ChipClozeItem = Base.extend({
  block: z.literal("chip-cloze"),
  template: z.string(),
  chips: z.array(z.string()).min(2),
  answer: z.array(Accept).min(1),
});

export const MatchItem = Base.extend({
  block: z.literal("match"),
  pairs: z.array(z.object({ left: z.string(), right: z.string() })).min(2),
  extra_right: z.array(z.string()).default([]),
});

export const OrderItem = Base.extend({
  block: z.literal("order"),
  /** Steps in a correct order. */
  steps: z.array(z.string()).min(2),
  /** Steps that do not belong in the proof. */
  distractors: z.array(z.string()).default([]),
  /**
   * Optional partial order as pairs [i, j] of step indices: step i must come before step j.
   * When omitted, the order of `steps` is the only accepted order.
   */
  before: z.array(z.tuple([z.number().int(), z.number().int()])).optional(),
});

export const BucketsItem = Base.extend({
  block: z.literal("buckets"),
  buckets: z.array(z.string()).min(2),
  items: z.array(z.object({ text: z.string(), bucket: z.string() })).min(2),
});

const GridCell = z.union([
  z.string(), // shorthand: the answer
  z.object({ given: z.string() }),
  z.object({ answer: Accept, options: z.array(z.string()).optional() }),
]);

export const GridItem = Base.extend({
  block: z.literal("grid"),
  columns: z.array(z.string()).min(1),
  rows: z.array(z.string()).min(1),
  cells: z.array(z.array(GridCell)),
  /** Default dropdown options for every answer cell (omit for typed cells). */
  options: z.array(z.string()).optional(),
  normalize: z.enum(["text", "set"]).default("text"),
});

export const TfItem = Base.extend({
  block: z.literal("tf"),
  statement: z.string(),
  answer: z.boolean(),
  reasons: z.array(z.object({ text: z.string(), correct: z.boolean().default(false) })).min(2),
});

export const Item = z.discriminatedUnion("block", [
  ClozeItem,
  ChipClozeItem,
  MatchItem,
  OrderItem,
  BucketsItem,
  GridItem,
  TfItem,
]);

export type Item = z.infer<typeof Item>;
export type ClozeItem = z.infer<typeof ClozeItem>;
export type ChipClozeItem = z.infer<typeof ChipClozeItem>;
export type MatchItem = z.infer<typeof MatchItem>;
export type OrderItem = z.infer<typeof OrderItem>;
export type BucketsItem = z.infer<typeof BucketsItem>;
export type GridItem = z.infer<typeof GridItem>;
export type TfItem = z.infer<typeof TfItem>;
export type BlockType = Item["block"];

export const Module = z.object({
  id: z.string(),
  code: z.string(),
  title: z.string(),
  phase: z.union([z.literal(1), z.literal(2)]),
  refs: z.string().default(""),
  /** Relative exam weight, used by the Daily mix. */
  weight: z.number().positive().default(1),
  blurb: z.string().default(""),
});
export type Module = z.infer<typeof Module>;

export type Content = { modules: Module[]; items: Item[]; builtAt: string };

export const BLOCK_LABEL: Record<BlockType, string> = {
  cloze: "Fill the blanks",
  "chip-cloze": "Place the symbols",
  match: "Match",
  order: "Put in order",
  buckets: "Sort",
  grid: "Fill the table",
  tf: "True or false, and why",
};

/** Split a template into text parts and gap numbers: "a {1} b" -> ["a ", 1, " b"]. */
export function parseTemplate(template: string): (string | number)[] {
  const out: (string | number)[] = [];
  const re = /\{(\d+)\}/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(template))) {
    if (m.index > last) out.push(template.slice(last, m.index));
    out.push(Number(m[1]));
    last = m.index + m[0].length;
  }
  if (last < template.length) out.push(template.slice(last));
  return out;
}
