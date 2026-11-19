"use client";

import type { CheckResult } from "@/lib/check";

export type BlockProps<I, R> = {
  item: I;
  value: R;
  onChange: (r: R) => void;
  /** Set once the answer has been checked; the block is then read-only. */
  result: CheckResult | null;
  seed: number;
};

export function stateClass(result: CheckResult | null, ok: boolean | undefined) {
  if (!result || ok === undefined) return "";
  return ok ? "border-good bg-good-soft" : "border-bad bg-bad-soft";
}

export function hashSeed(s: string, n = 0): number {
  let h = 2166136261 ^ n;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}
