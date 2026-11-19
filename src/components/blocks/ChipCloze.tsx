"use client";

import { useMemo, useState } from "react";
import { parseTemplate, type ChipClozeItem } from "@/lib/items";
import type { ChipClozeResponse } from "@/lib/check";
import { rng, shuffle } from "@/lib/schedule";
import { Rich } from "../Rich";
import { type BlockProps, stateClass } from "./shared";

export function ChipCloze({ item, value, onChange, result, seed }: BlockProps<ChipClozeItem, ChipClozeResponse>) {
  const parts = parseTemplate(item.template);
  const bank = useMemo(() => shuffle(item.chips, rng(seed)), [item.chips, seed]);
  const firstEmpty = value.findIndex((v) => v == null);
  const [selected, setSelected] = useState<number | null>(null);
  const target = selected ?? (firstEmpty >= 0 ? firstEmpty : null);

  // chips are consumed: a bank chip is available if not all copies are placed
  const used = new Map<string, number>();
  value.forEach((v) => v != null && used.set(v, (used.get(v) ?? 0) + 1));
  const seen = new Map<string, number>();
  const available = bank.map((c) => {
    const k = (seen.get(c) ?? 0) + 1;
    seen.set(c, k);
    return k > (used.get(c) ?? 0);
  });

  const place = (chip: string) => {
    if (result || target == null) return;
    const next = [...value];
    next[target] = chip;
    onChange(next);
    setSelected(null);
  };

  return (
    <div className="space-y-5">
      <p className="text-[1.05rem] leading-[2.8rem]">
        {parts.map((p, i) => {
          if (typeof p === "string") return <Rich key={i} text={p} className="sym" />;
          const gi = p - 1;
          const v = value[gi];
          const isTarget = !result && target === gi;
          return (
            <button
              key={i}
              type="button"
              disabled={!!result}
              aria-label={v ? `Gap ${p}: ${v}. Tap to remove` : `Gap ${p}, empty`}
              onClick={() => {
                if (v != null) {
                  const next = [...value];
                  next[gi] = null;
                  onChange(next);
                  setSelected(gi);
                } else setSelected(gi);
              }}
              className={`mx-1 inline-flex min-h-9 min-w-14 items-center justify-center rounded-md border px-2 align-middle ${
                v ? "border-line bg-card" : "border-dashed border-muted/60 bg-transparent"
              } ${isTarget ? "ring-2 ring-accent" : ""} ${stateClass(result, result?.parts[gi])}`}
            >
              {v ? <Rich text={v} className="sym" /> : <span className="text-sm text-muted">{p}</span>}
            </button>
          );
        })}
      </p>
      {!result && (
        <div>
          <div className="mb-2 text-xs font-medium uppercase tracking-wide text-muted">Symbols</div>
          <div className="flex flex-wrap gap-2">
            {bank.map((c, i) => (
              <button
                key={i}
                type="button"
                disabled={!available[i]}
                onClick={() => place(c)}
                className="min-h-10 rounded-full border border-line bg-card px-4 text-base shadow-sm transition active:scale-95 disabled:opacity-30 disabled:shadow-none"
              >
                <Rich text={c} className="sym" />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
