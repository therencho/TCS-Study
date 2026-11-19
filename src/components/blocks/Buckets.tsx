"use client";

import { useMemo } from "react";
import type { BucketsItem } from "@/lib/items";
import type { BucketsResponse } from "@/lib/check";
import { rng, shuffle } from "@/lib/schedule";
import { Rich } from "../Rich";
import { type BlockProps, stateClass } from "./shared";

export function Buckets({ item, value, onChange, result, seed }: BlockProps<BucketsItem, BucketsResponse>) {
  // show items in a shuffled order, but responses stay indexed by the original position
  const order = useMemo(() => shuffle(item.items.map((_, i) => i), rng(seed)), [item, seed]);
  return (
    <ul className="space-y-2">
      {order.map((i) => {
        const it = item.items[i];
        return (
          <li key={i} className={`rounded-lg border border-line bg-card px-3 py-2.5 ${stateClass(result, result?.parts[i])}`}>
            <Rich text={it.text} className="sym block pb-2" />
            <div role="radiogroup" aria-label={it.text} className="flex flex-wrap gap-1.5">
              {item.buckets.map((b) => {
                const on = value[i] === b;
                return (
                  <button
                    key={b}
                    type="button"
                    role="radio"
                    aria-checked={on}
                    disabled={!!result}
                    onClick={() => {
                      const next = [...value];
                      next[i] = b;
                      onChange(next);
                    }}
                    className={`min-h-9 rounded-full border px-3 text-sm transition active:scale-95 ${
                      on ? "border-accent bg-accent text-accent-ink" : "border-line bg-paper text-ink"
                    } disabled:active:scale-100`}
                  >
                    <Rich text={b} className="sym" />
                  </button>
                );
              })}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
