"use client";

import { useMemo } from "react";
import type { TfItem } from "@/lib/items";
import type { TfResponse } from "@/lib/check";
import { rng, shuffle } from "@/lib/schedule";
import { Rich } from "../Rich";
import { type BlockProps, stateClass } from "./shared";

export function TrueFalse({ item, value, onChange, result, seed }: BlockProps<TfItem, TfResponse>) {
  const order = useMemo(() => shuffle(item.reasons.map((_, i) => i), rng(seed)), [item, seed]);
  return (
    <div className="space-y-5">
      <blockquote className="rounded-lg border-l-4 border-accent bg-card px-4 py-3 text-lg">
        <Rich text={item.statement} className="sym" />
      </blockquote>
      <div>
        <div className="mb-2 text-xs font-medium uppercase tracking-wide text-muted">1 · Verdict</div>
        <div role="radiogroup" aria-label="Verdict" className="grid grid-cols-2 gap-2">
          {[true, false].map((v) => {
            const on = value.verdict === v;
            return (
              <button
                key={String(v)}
                type="button"
                role="radio"
                aria-checked={on}
                disabled={!!result}
                onClick={() => onChange({ ...value, verdict: v })}
                className={`h-11 rounded-lg border font-medium transition ${
                  on && result
                    ? `text-ink ${stateClass(result, result.parts[0])}`
                    : on
                      ? "border-accent bg-accent text-accent-ink"
                      : "border-line bg-card"
                }`}
              >
                {v ? "True" : "False"}
              </button>
            );
          })}
        </div>
      </div>
      <div>
        <div className="mb-2 text-xs font-medium uppercase tracking-wide text-muted">2 · Justification</div>
        <div role="radiogroup" aria-label="Justification" className="space-y-2">
          {order.map((i) => {
            const on = value.reason === i;
            return (
              <button
                key={i}
                type="button"
                role="radio"
                aria-checked={on}
                disabled={!!result}
                onClick={() => onChange({ ...value, reason: i })}
                className={`flex w-full items-start gap-3 rounded-lg border px-3 py-2.5 text-left text-[0.95rem] leading-snug ${
                  on ? "border-accent bg-accent-soft" : "border-line bg-card"
                } ${on ? stateClass(result, result?.parts[1]) : ""}`}
              >
                <span
                  aria-hidden
                  className={`mt-1 h-3.5 w-3.5 shrink-0 rounded-full border ${on ? "border-accent bg-accent" : "border-muted"}`}
                />
                <Rich text={item.reasons[i].text} />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
