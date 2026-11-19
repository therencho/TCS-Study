"use client";

import { useMemo } from "react";
import type { OrderItem } from "@/lib/items";
import type { OrderResponse } from "@/lib/check";
import { rng, shuffle } from "@/lib/schedule";
import { Rich } from "../Rich";
import { type BlockProps, stateClass } from "./shared";

export function Order({ item, value, onChange, result, seed }: BlockProps<OrderItem, OrderResponse>) {
  const pool = useMemo(() => shuffle([...item.steps, ...item.distractors], rng(seed)), [item, seed]);
  const remaining = pool.filter((s) => !value.includes(s));

  const move = (i: number, d: -1 | 1) => {
    const j = i + d;
    if (j < 0 || j >= value.length) return;
    const next = [...value];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };

  return (
    <div className="space-y-5">
      <div>
        <div className="mb-2 text-xs font-medium uppercase tracking-wide text-muted">Your proof</div>
        {value.length === 0 ? (
          <p className="rounded-lg border border-dashed border-line px-3 py-4 text-sm text-muted">
            Tap steps below to add them here, in order.
          </p>
        ) : (
          <ol className="space-y-2">
            {value.map((s, i) => (
              <li
                key={s}
                className={`flex items-start gap-2 rounded-lg border border-line bg-card px-3 py-2 ${stateClass(result, result?.parts[i])}`}
              >
                <span className="mt-0.5 w-5 shrink-0 text-sm font-semibold text-muted">{i + 1}</span>
                <Rich text={s} className="min-w-0 flex-1 text-[0.95rem] leading-snug" />
                {!result && (
                  <span className="flex shrink-0 gap-1">
                    <IconBtn label="Move up" onClick={() => move(i, -1)} disabled={i === 0}>↑</IconBtn>
                    <IconBtn label="Move down" onClick={() => move(i, 1)} disabled={i === value.length - 1}>↓</IconBtn>
                    <IconBtn label="Remove" onClick={() => onChange(value.filter((x) => x !== s))}>✕</IconBtn>
                  </span>
                )}
              </li>
            ))}
          </ol>
        )}
      </div>
      {!result && remaining.length > 0 && (
        <div>
          <div className="mb-2 text-xs font-medium uppercase tracking-wide text-muted">Available steps</div>
          <ul className="space-y-2">
            {remaining.map((s) => (
              <li key={s}>
                <button
                  type="button"
                  onClick={() => onChange([...value, s])}
                  className="w-full rounded-lg border border-line bg-paper px-3 py-2 text-left text-[0.95rem] leading-snug transition active:scale-[0.99]"
                >
                  <Rich text={s} />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function IconBtn(props: { label: string; onClick: () => void; disabled?: boolean; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-label={props.label}
      onClick={props.onClick}
      disabled={props.disabled}
      className="grid h-8 w-8 place-items-center rounded-md border border-line text-sm text-muted disabled:opacity-30"
    >
      {props.children}
    </button>
  );
}
