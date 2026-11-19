import {
  type Accept,
  type BucketsItem,
  type ChipClozeItem,
  type ClozeItem,
  type GridItem,
  type Item,
  type MatchItem,
  type OrderItem,
  type TfItem,
  parseTemplate,
} from "./items";

/* ---------- responses ---------- */

export type ClozeResponse = string[];
export type ChipClozeResponse = (string | null)[];
/** For each left item (by index): the chosen right text. */
export type MatchResponse = (string | null)[];
/** Chosen steps, in order. */
export type OrderResponse = string[];
/** For each item (by index): the chosen bucket. */
export type BucketsResponse = (string | null)[];
/** Same shape as cells; given cells are ignored. */
export type GridResponse = string[][];
export type TfResponse = { verdict: boolean | null; reason: number | null };

export type Response =
  | ClozeResponse
  | ChipClozeResponse
  | MatchResponse
  | OrderResponse
  | BucketsResponse
  | GridResponse
  | TfResponse;

export type CheckResult = {
  correct: boolean;
  /** Per-part verdicts (gap, pair, item, cell …) for highlighting. Order block: per chosen position. */
  parts: boolean[];
  note?: string;
};

/* ---------- normalisation ---------- */

const alts = (a: Accept): string[] => (Array.isArray(a) ? a : [a]);

export function normText(s: string, caseSensitive = false): string {
  let t = s.normalize("NFC").trim().replace(/\s+/g, " ");
  t = t.replace(/\s*([,;:{}()])\s*/g, "$1");
  return caseSensitive ? t : t.toLowerCase();
}

/** Order-insensitive set notation: "{q1, q0}" == "{q0,q1}", "∅" == "{}". */
export function normSet(s: string): string {
  const t = s.trim();
  if (t === "∅" || t === "" || /^\{\s*\}$/.test(t)) return "{}";
  const inner = t.replace(/^\{/, "").replace(/\}$/, "");
  const parts = inner
    .split(",")
    .map((p) => p.trim().toLowerCase())
    .filter(Boolean);
  return "{" + Array.from(new Set(parts)).sort().join(",") + "}";
}

const matches = (given: string, accept: Accept, norm: (x: string) => string) =>
  alts(accept).some((a) => norm(a) === norm(given));

/* ---------- checkers ---------- */

function checkCloze(item: ClozeItem, r: ClozeResponse): CheckResult {
  const parts = item.answers.map((acc, i) =>
    matches(r[i] ?? "", acc, (x) => normText(x, item.caseSensitive)),
  );
  return { correct: parts.every(Boolean), parts };
}

function checkChipCloze(item: ChipClozeItem, r: ChipClozeResponse): CheckResult {
  const parts = item.answer.map((acc, i) => r[i] != null && alts(acc).includes(r[i]!));
  return { correct: parts.every(Boolean), parts };
}

function checkMatch(item: MatchItem, r: MatchResponse): CheckResult {
  const parts = item.pairs.map((p, i) => r[i] === p.right);
  return { correct: parts.every(Boolean), parts };
}

function checkOrder(item: OrderItem, r: OrderResponse): CheckResult {
  const idx = (s: string) => item.steps.indexOf(s);
  const parts = r.map((s) => idx(s) >= 0); // distractors are wrong wherever they are
  const usedAll = item.steps.every((s) => r.includes(s));
  const noDistractor = parts.every(Boolean);
  let ordered = true;
  if (usedAll && noDistractor) {
    const pos = (i: number) => r.indexOf(item.steps[i]);
    const constraints =
      item.before ?? item.steps.slice(1).map((_, i) => [i, i + 1] as [number, number]);
    // mark positions that violate a constraint
    for (const [a, b] of constraints) {
      if (pos(a) > pos(b)) {
        ordered = false;
        parts[pos(a)] = false;
        parts[pos(b)] = false;
      }
    }
  }
  const correct = usedAll && noDistractor && ordered;
  let note: string | undefined;
  if (!noDistractor) note = "At least one chosen step does not belong in this proof.";
  else if (!usedAll) note = "Some steps are still missing.";
  else if (!ordered) note = "All the right steps, but not in a valid order.";
  return { correct, parts, note };
}

function checkBuckets(item: BucketsItem, r: BucketsResponse): CheckResult {
  const parts = item.items.map((it, i) => r[i] === it.bucket);
  return { correct: parts.every(Boolean), parts };
}

export type GridCellSpec =
  | { kind: "given"; text: string }
  | { kind: "answer"; accept: Accept; options?: string[] };

export function gridCell(item: GridItem, row: number, col: number): GridCellSpec {
  const c = item.cells[row]?.[col];
  if (c === undefined) return { kind: "given", text: "" };
  if (typeof c === "string") return { kind: "answer", accept: c, options: item.options };
  if ("given" in c) return { kind: "given", text: c.given };
  return { kind: "answer", accept: c.answer, options: c.options ?? item.options };
}

function checkGrid(item: GridItem, r: GridResponse): CheckResult {
  const norm = item.normalize === "set" ? normSet : (x: string) => normText(x);
  const parts: boolean[] = [];
  item.rows.forEach((_, ri) =>
    item.columns.forEach((_, ci) => {
      const cell = gridCell(item, ri, ci);
      if (cell.kind === "answer") parts.push(matches(r[ri]?.[ci] ?? "", cell.accept, norm));
    }),
  );
  return { correct: parts.every(Boolean), parts };
}

function checkTf(item: TfItem, r: TfResponse): CheckResult {
  const verdictOk = r.verdict === item.answer;
  const reasonOk = r.reason != null && item.reasons[r.reason]?.correct === true;
  return {
    correct: verdictOk && reasonOk,
    parts: [verdictOk, reasonOk],
    note: verdictOk && !reasonOk ? "Right verdict, but the justification is what earns the points." : undefined,
  };
}

export function check(item: Item, r: Response): CheckResult {
  switch (item.block) {
    case "cloze":
      return checkCloze(item, r as ClozeResponse);
    case "chip-cloze":
      return checkChipCloze(item, r as ChipClozeResponse);
    case "match":
      return checkMatch(item, r as MatchResponse);
    case "order":
      return checkOrder(item, r as OrderResponse);
    case "buckets":
      return checkBuckets(item, r as BucketsResponse);
    case "grid":
      return checkGrid(item, r as GridResponse);
    case "tf":
      return checkTf(item, r as TfResponse);
  }
}

/* ---------- the key as a response, and build-time validation ---------- */

const first = (a: Accept) => alts(a)[0];

export function keyResponse(item: Item): Response {
  switch (item.block) {
    case "cloze":
      return item.answers.map(first);
    case "chip-cloze":
      return item.answer.map(first);
    case "match":
      return item.pairs.map((p) => p.right);
    case "order":
      return [...item.steps];
    case "buckets":
      return item.items.map((i) => i.bucket);
    case "grid":
      return item.rows.map((_, ri) =>
        item.columns.map((_, ci) => {
          const c = gridCell(item, ri, ci);
          return c.kind === "answer" ? first(c.accept) : "";
        }),
      );
    case "tf":
      return { verdict: item.answer, reason: item.reasons.findIndex((x) => x.correct) };
  }
}

/** Structural problems that a schema cannot express. Empty array = fine. */
export function validate(item: Item): string[] {
  const errs: string[] = [];
  const gaps = (t: string) => parseTemplate(t).filter((p): p is number => typeof p === "number");
  const gapCheck = (t: string, n: number) => {
    const g = gaps(t);
    const want = Array.from({ length: n }, (_, i) => i + 1);
    if (g.length !== n || !want.every((x) => g.includes(x)))
      errs.push(`template gaps ${JSON.stringify(g)} do not match ${n} answers numbered 1..${n}`);
  };
  switch (item.block) {
    case "cloze":
      gapCheck(item.template, item.answers.length);
      break;
    case "chip-cloze": {
      gapCheck(item.template, item.answer.length);
      for (const a of item.answer)
        if (!alts(a).some((x) => item.chips.includes(x))) errs.push(`answer "${first(a)}" is not among the chips`);
      // the bank must hold enough copies of each chip
      const need = new Map<string, number>();
      for (const a of item.answer) need.set(first(a), (need.get(first(a)) ?? 0) + 1);
      for (const [chip, n] of need) {
        const have = item.chips.filter((c) => c === chip).length;
        if (have < n) errs.push(`chip "${chip}" is needed ${n}x but the bank has ${have}`);
      }
      break;
    }
    case "match": {
      const rights = item.pairs.map((p) => p.right);
      if (new Set(rights).size !== rights.length) errs.push("right-hand sides must be distinct");
      break;
    }
    case "order": {
      const all = [...item.steps, ...item.distractors];
      if (new Set(all).size !== all.length) errs.push("steps and distractors must be distinct");
      for (const [a, b] of item.before ?? [])
        if (!(a in item.steps) || !(b in item.steps) || a >= b)
          errs.push(`constraint [${a}, ${b}] must reference steps i < j`);
      break;
    }
    case "buckets":
      for (const it of item.items)
        if (!item.buckets.includes(it.bucket)) errs.push(`"${it.text}" uses unknown bucket "${it.bucket}"`);
      break;
    case "grid":
      if (item.cells.length !== item.rows.length) errs.push("cells must have one row per entry in rows");
      item.cells.forEach((row, i) => {
        if (row.length !== item.columns.length) errs.push(`row ${i + 1} must have ${item.columns.length} cells`);
      });
      item.rows.forEach((_, ri) =>
        item.columns.forEach((_, ci) => {
          const c = gridCell(item, ri, ci);
          if (c.kind === "answer" && c.options && !alts(c.accept).some((a) => c.options!.includes(a)))
            errs.push(`cell (${ri + 1},${ci + 1}) answer is not among its options`);
        }),
      );
      break;
    case "tf":
      if (item.reasons.filter((r) => r.correct).length !== 1) errs.push("exactly one reason must be correct");
      break;
  }
  if (errs.length === 0 && !check(item, keyResponse(item)).correct)
    errs.push("the answer key does not pass its own checker");
  return errs;
}
