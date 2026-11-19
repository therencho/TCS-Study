"use client";

import { useMemo, useState } from "react";
import type { MatchItem } from "@/lib/items";
import type { MatchResponse } from "@/lib/check";
import { rng, shuffle } from "@/lib/schedule";
import { Rich } from "../Rich";
import { type BlockProps, stateClass } from "./shared";

export function Match({ item, value, onChange, result, seed }: BlockProps<MatchItem, MatchResponse>) {
  const rights = useMemo(
    () => shuffle([...item.pairs.map((p) => p.right), ...item.extra_right], rng(seed)),
    [item, seed],
  );
  const [open, setOpen] = useState<number | null>(0);

  const assign = (row: number, right: string) => {
    const next = value.map((v) => (v === right ? null : v));
    next[row] = right;
    onChange(next);
    const nextEmpty = next.findIndex((v, i) => v == null && i !== row);
    setOpen(nextEmpty >= 0 ? nextEmpty : null);
  };

  return (
    <ul className="space-y-2">
      {item.pairs.map((p, row) => {
        const v = value[row];
        const isOpen = !result && open === row;
        return (
          <li key={row} className={`rounded-lg border border-line bg-card ${stateClass(result, result?.parts[row])}`}>
            <button
              type="button"
              disabled={!!result}
              onClick={() => setOpen(isOpen ? null : row)}
              aria-expanded={isOpen}
              className="flex w-full items-center gap-3 px-3 py-3 text-left"
            >
              <Rich text={p.left} className="sym min-w-0 flex-1" />
              <span aria-hidden className="text-muted">→</span>
              <span className={`min-w-0 flex-1 text-right ${v ? "" : "text-sm text-muted"}`}>
                {v ? <Rich text={v} className="sym" /> : "choose"}
              </span>
            </button>
            {isOpen && (
              <div className="flex flex-wrap gap-2 border-t border-line px-3 py-3">
                {rights.map((r) => {
                  const usedBy = value.indexOf(r);
                  return (
                    <button
                      key={r}
                      type="button"
                      onClick={() => assign(row, r)}
                      className={`min-h-10 rounded-full border px-3 text-[0.95rem] transition active:scale-95 ${
                        usedBy === row
                          ? "border-accent bg-accent-soft"
                          : usedBy >= 0
                            ? "border-line text-muted"
                            : "border-line bg-paper"
                      }`}
                    >
                      <Rich text={r} className="sym" />
                    </button>
                  );
                })}
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
