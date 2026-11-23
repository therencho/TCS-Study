"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { items, itemsOf } from "@/lib/content";
import { loadProgress, PROGRESS_EVENT, today, type ProgressMap } from "@/lib/progress";
import { counts, MIX_SIZE } from "@/lib/schedule";

function useProgress() {
  const [p, setP] = useState<ProgressMap | null>(null);
  useEffect(() => {
    const load = () => void loadProgress().then((x) => setP({ ...x }));
    load();
    window.addEventListener(PROGRESS_EVENT, load);
    return () => window.removeEventListener(PROGRESS_EVENT, load);
  }, []);
  return p;
}

export function DailyCard() {
  const p = useProgress();
  const c = p ? counts(items.filter((i) => i.phase === 1), p, today()) : null;
  const size = c ? Math.min(MIX_SIZE, c.due + c.fresh) : null;
  return (
    <section className="rounded-2xl border border-line bg-card p-5">
      <div className="flex items-baseline justify-between">
        <h2 className="font-serif text-2xl">Daily mix</h2>
        <span className="text-sm text-muted tabular-nums">{size === null ? "…" : `${size} items`}</span>
      </div>
      <p className="mt-1 text-sm text-muted">
        {c === null
          ? "Loading your progress…"
          : c.due + c.fresh === 0
            ? "You're up to date. Practise more or come back tomorrow."
            : `${c.due} due for review · ${c.fresh} new available · ${c.learned} of ${c.total} learned`}
      </p>
      <Link
        href={c && c.due + c.fresh === 0 ? "/practice/extra" : "/practice/daily"}
        className="mt-4 grid h-12 place-items-center rounded-xl bg-accent font-semibold text-accent-ink transition active:scale-[0.99]"
      >
        {c && c.due + c.fresh === 0 ? "Practice anyway" : "Start"}
      </Link>
    </section>
  );
}

/** Thin bar: share of a module's items in box 3 or higher, plus a due badge. */
export function ModuleProgress({ moduleId }: { moduleId: string }) {
  const p = useProgress();
  const list = itemsOf(moduleId);
  if (list.length === 0) return null;
  const c = p ? counts(list, p, today()) : null;
  const pct = c ? Math.round((c.learned / c.total) * 100) : 0;
  return (
    <div className="mt-2 flex items-center gap-2">
      <div className="h-1 flex-1 overflow-hidden rounded-full bg-line">
        <div className="h-full rounded-full bg-good" style={{ width: `${pct}%` }} />
      </div>
      <span className="w-20 text-right text-xs text-muted tabular-nums">
        {c ? (c.due > 0 ? `${c.due} due` : `${c.learned}/${c.total}`) : ""}
      </span>
    </div>
  );
}
