"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { Item } from "@/lib/items";
import { items as allItems, modules, moduleById, itemsOf } from "@/lib/content";
import { askPersist, loadMistakes, loadProgress, recordAnswer, today, type ProgressMap } from "@/lib/progress";
import { dailyMix, extraPractice, moduleRound } from "@/lib/schedule";
import { ItemPlayer } from "./ItemPlayer";
import { hashSeed } from "./blocks/shared";

export type SessionMode = { kind: "daily" } | { kind: "extra" } | { kind: "mistakes" } | { kind: "module"; id: string };

type Answer = { id: string; correct: boolean };

export function Session({ mode }: { mode: SessionMode }) {
  const [queue, setQueue] = useState<Item[] | null>(null);
  const [pos, setPos] = useState(0);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [retried, setRetried] = useState<Set<string>>(new Set());
  const [round, setRound] = useState(0);
  /** Progress as it was when the session started (for the "review" label). */
  const [progress, setProgress] = useState<ProgressMap>({});
  const modeKey = JSON.stringify(mode);

  useEffect(() => {
    const mode = JSON.parse(modeKey) as SessionMode;
    let cancelled = false;
    (async () => {
      const p = await loadProgress();
      const seed = Date.now() % 2147483647;
      let q: Item[] = [];
      if (mode.kind === "daily") q = dailyMix(allItems, modules, p, today(), seed);
      else if (mode.kind === "extra") q = extraPractice(allItems, p, seed);
      else if (mode.kind === "module") q = moduleRound(itemsOf(mode.id), p, today(), seed);
      else {
        const m = await loadMistakes();
        q = m
          .map((x) => allItems.find((i) => i.id === x.id))
          .filter((i): i is Item => !!i)
          .slice(0, 20);
      }
      if (cancelled) return;
      setProgress(p);
      setQueue(q);
      setPos(0);
      setAnswers([]);
      setRetried(new Set());
      void askPersist();
    })();
    return () => {
      cancelled = true;
    };
  }, [modeKey, round]);

  const current = queue?.[pos];
  const title = mode.kind === "module" ? moduleById(mode.id)?.title : undefined;

  const onChecked = async (correct: boolean) => {
    if (!current) return;
    // only the first attempt in a session moves the item between boxes
    const isRetry = answers.some((a) => a.id === current.id);
    setAnswers((a) => [...a, { id: current.id, correct }]);
    if (!isRetry) await recordAnswer(current.id, correct);
    if (!correct && !retried.has(current.id) && queue) {
      // one more try at the end of this session
      setRetried((s) => new Set(s).add(current.id));
      setQueue([...queue, current]);
    }
  };

  const firstTries = useMemo(() => {
    const seen = new Set<string>();
    return answers.filter((a) => (seen.has(a.id) ? false : (seen.add(a.id), true)));
  }, [answers]);

  if (!queue) return <p className="py-16 text-center text-muted">Loading…</p>;

  if (queue.length === 0)
    return (
      <Empty
        title={mode.kind === "mistakes" ? "No mistakes to redo" : "All caught up"}
        text={
          mode.kind === "mistakes"
            ? "Items you get wrong appear here."
            : "Nothing is due and there are no new items right now."
        }
        extra={mode.kind === "daily"}
      />
    );

  if (pos >= queue.length) {
    const right = firstTries.filter((a) => a.correct).length;
    return (
      <div className="space-y-6 py-8 text-center">
        <div className="font-serif text-5xl">
          {right}
          <span className="text-muted">/{firstTries.length}</span>
        </div>
        <p className="text-muted">correct on the first try</p>
        <div className="mx-auto flex max-w-xs flex-col gap-2">
          <button
            type="button"
            onClick={() => setRound((r) => r + 1)}
            className="h-12 rounded-xl bg-accent font-semibold text-accent-ink"
          >
            {mode.kind === "module" ? "Another round" : "Practice more"}
          </button>
          <Link href="/" className="grid h-12 place-items-center rounded-xl border border-line">
            Back to overview
          </Link>
        </div>
      </div>
    );
  }

  const isRetry = queue.slice(0, pos).some((i) => i.id === current!.id);
  const box = progress[current!.id]?.box;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Link href="/" aria-label="Close session" className="grid h-9 w-9 place-items-center rounded-md text-xl text-muted">
          ×
        </Link>
        <div
          className="h-1.5 flex-1 overflow-hidden rounded-full bg-line"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={queue.length}
          aria-valuenow={pos}
        >
          <div className="h-full rounded-full bg-accent transition-all" style={{ width: `${(pos / queue.length) * 100}%` }} />
        </div>
        <span className="w-12 text-right text-sm text-muted tabular-nums">
          {pos + 1}/{queue.length}
        </span>
      </div>
      {(isRetry || box) && (
        <p className="text-xs text-muted">
          {isRetry ? "Second try" : `Review · box ${box} of 5`}
        </p>
      )}
      <ItemPlayer
        key={`${current!.id}-${pos}`}
        item={current!}
        seed={hashSeed(current!.id, pos + round * 101)}
        moduleTitle={title ?? moduleById(current!.module)?.title}
        onChecked={(c) => void onChecked(c)}
        onNext={() => {
          setPos((p) => p + 1);
          window.scrollTo({ top: 0 });
        }}
        nextLabel={pos + 1 >= queue.length ? "Finish" : "Next"}
      />
    </div>
  );
}

function Empty({ title, text, extra }: { title: string; text: string; extra: boolean }) {
  return (
    <div className="space-y-4 py-16 text-center">
      <h2 className="font-serif text-2xl">{title}</h2>
      <p className="text-muted">{text}</p>
      <div className="mx-auto flex max-w-xs flex-col gap-2">
        {extra && (
          <Link href="/practice/extra" className="grid h-12 place-items-center rounded-xl bg-accent font-semibold text-accent-ink">
            Practice anyway
          </Link>
        )}
        <Link href="/" className="grid h-12 place-items-center rounded-xl border border-line">
          Back to overview
        </Link>
      </div>
    </div>
  );
}
