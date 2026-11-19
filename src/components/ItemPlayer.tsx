"use client";

import { useState } from "react";
import { BLOCK_LABEL, type Item } from "@/lib/items";
import { check, gridCell, type CheckResult, type Response } from "@/lib/check";
import { Rich } from "./Rich";
import { KeyView } from "./KeyView";
import { ReportButton } from "./ReportDialog";
import { Cloze } from "./blocks/Cloze";
import { ChipCloze } from "./blocks/ChipCloze";
import { Match } from "./blocks/Match";
import { Order } from "./blocks/Order";
import { Buckets } from "./blocks/Buckets";
import { Grid } from "./blocks/Grid";
import { TrueFalse } from "./blocks/TrueFalse";

export function emptyResponse(item: Item): Response {
  switch (item.block) {
    case "cloze":
      return item.answers.map(() => "");
    case "chip-cloze":
      return item.answer.map(() => null);
    case "match":
      return item.pairs.map(() => null);
    case "order":
      return [];
    case "buckets":
      return item.items.map(() => null);
    case "grid":
      return item.rows.map(() => item.columns.map(() => ""));
    case "tf":
      return { verdict: null, reason: null };
  }
}

/** True once the student has entered something everywhere it is needed. */
function isComplete(item: Item, r: Response): boolean {
  switch (item.block) {
    case "cloze":
      return (r as string[]).every((x) => x.trim() !== "");
    case "chip-cloze":
    case "match":
    case "buckets":
      return (r as (string | null)[]).every((x) => x != null);
    case "order":
      return (r as string[]).length > 0;
    case "grid":
      return item.rows.every((_, ri) =>
        item.columns.every((_, ci) => gridCell(item, ri, ci).kind === "given" || (r as string[][])[ri][ci] !== ""),
      );
    case "tf": {
      const t = r as { verdict: boolean | null; reason: number | null };
      return t.verdict != null && t.reason != null;
    }
  }
}

/** YAML block text: single line breaks become spaces, blank lines stay paragraph breaks. */
const prose = (t: string) => t.trim().replace(/([^\n])\n(?!\n)/g, "$1 ");

export function ItemPlayer({
  item,
  seed,
  moduleTitle,
  onChecked,
  onNext,
  nextLabel = "Next",
}: {
  item: Item;
  seed: number;
  moduleTitle?: string;
  onChecked: (correct: boolean) => void;
  onNext: () => void;
  nextLabel?: string;
}) {
  const [response, setResponse] = useState<Response>(() => emptyResponse(item));
  const [result, setResult] = useState<CheckResult | null>(null);
  const complete = isComplete(item, response);

  const doCheck = () => {
    const r = check(item, response);
    setResult(r);
    onChecked(r.correct);
  };

  const props = { value: response as never, onChange: setResponse as never, result, seed };

  return (
    <article className="space-y-6">
      <header className="space-y-2">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted">
          <span className="rounded-full bg-accent-soft px-2 py-0.5 font-medium text-accent">{BLOCK_LABEL[item.block]}</span>
          {item.refs.length > 0 && <span>{item.refs.join(" · ")}</span>}
          {item.category && <span>· Category {item.category}</span>}
          {moduleTitle && <span className="hidden sm:inline">· {moduleTitle}</span>}
        </div>
        <h2 className="font-serif text-xl leading-snug">
          <Rich text={item.prompt} />
        </h2>
      </header>

      <div>
        {item.block === "cloze" && <Cloze item={item} {...props} />}
        {item.block === "chip-cloze" && <ChipCloze item={item} {...props} />}
        {item.block === "match" && <Match item={item} {...props} />}
        {item.block === "order" && <Order item={item} {...props} />}
        {item.block === "buckets" && <Buckets item={item} {...props} />}
        {item.block === "grid" && <Grid item={item} {...props} />}
        {item.block === "tf" && <TrueFalse item={item} {...props} />}
      </div>

      {result && (
        <section
          aria-live="polite"
          className={`space-y-3 rounded-xl border p-4 ${result.correct ? "border-good/40 bg-good-soft" : "border-bad/40 bg-bad-soft"}`}
        >
          <div className={`font-semibold ${result.correct ? "text-good" : "text-bad"}`}>
            {result.correct ? "Correct" : "Not quite"}
          </div>
          {result.note && <p className="text-sm">{result.note}</p>}
          {!result.correct && (
            <div className="space-y-1">
              <div className="text-xs font-medium uppercase tracking-wide text-muted">Model answer</div>
              <div className="text-[0.95rem]">
                <KeyView item={item} />
              </div>
            </div>
          )}
          <div className="space-y-1">
            <div className="text-xs font-medium uppercase tracking-wide text-muted">Why</div>
            <Rich text={prose(item.explain)} className="block text-[0.95rem] leading-relaxed" />
          </div>
        </section>
      )}

      <footer className="sticky bottom-0 -mx-4 space-y-3 border-t border-line bg-paper/95 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur">
        {result ? (
          <button
            type="button"
            onClick={onNext}
            autoFocus
            className="h-12 w-full rounded-xl bg-ink text-base font-semibold text-paper transition active:scale-[0.99]"
          >
            {nextLabel}
          </button>
        ) : (
          <button
            type="button"
            onClick={doCheck}
            disabled={!complete}
            className="h-12 w-full rounded-xl bg-accent text-base font-semibold text-accent-ink transition active:scale-[0.99] disabled:opacity-40"
          >
            Check
          </button>
        )}
        <div className="flex justify-center">
          <ReportButton key={item.id} itemId={item.id} />
        </div>
      </footer>
    </article>
  );
}
