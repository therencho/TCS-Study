"use client";

import { get, set, del } from "idb-keyval";

export type Box = 1 | 2 | 3 | 4 | 5;
export type Rec = {
  box: Box;
  /** YYYY-MM-DD, local date */
  due: string;
  right: number;
  wrong: number;
  last: string;
};
export type ProgressMap = Record<string, Rec>;
export type Mistake = { id: string; at: string };

/** Days until the next review, per box. */
export const INTERVAL: Record<Box, number> = { 1: 1, 2: 2, 3: 4, 4: 8, 5: 16 };

const KEY = "tcs-progress-v1";
const MISTAKES = "tcs-mistakes-v1";
const META = "tcs-meta-v1";

export function today(d = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function addDays(ymd: string, n: number): string {
  const [y, m, d] = ymd.split("-").map(Number);
  return today(new Date(y, m - 1, d + n));
}

/** IndexedDB may be unavailable (private mode, blocked storage): fall back to memory. */
let memory: { progress: ProgressMap; mistakes: Mistake[]; meta: Meta } | null = null;
type Meta = { lastExport?: string; persistAsked?: boolean };

async function safeGet<T>(key: string, fallback: T): Promise<T> {
  try {
    return ((await get(key)) as T | undefined) ?? fallback;
  } catch {
    memory ??= { progress: {}, mistakes: [], meta: {} };
    return fallback;
  }
}
async function safeSet(key: string, value: unknown) {
  try {
    await set(key, value);
  } catch {
    /* storage blocked: keep in memory for this session only */
  }
}

export async function loadProgress(): Promise<ProgressMap> {
  return memory?.progress ?? safeGet<ProgressMap>(KEY, {});
}
export async function loadMistakes(): Promise<Mistake[]> {
  return memory?.mistakes ?? safeGet<Mistake[]>(MISTAKES, []);
}
export async function loadMeta(): Promise<Meta> {
  return memory?.meta ?? safeGet<Meta>(META, {});
}

export function nextRec(prev: Rec | undefined, correct: boolean, now = new Date()): Rec {
  const box: Box = !prev ? (correct ? 2 : 1) : correct ? (Math.min(prev.box + 1, 5) as Box) : 1;
  const t = today(now);
  return {
    box,
    due: addDays(t, INTERVAL[box]),
    right: (prev?.right ?? 0) + (correct ? 1 : 0),
    wrong: (prev?.wrong ?? 0) + (correct ? 0 : 1),
    last: now.toISOString(),
  };
}

export async function recordAnswer(id: string, correct: boolean): Promise<ProgressMap> {
  const progress = await loadProgress();
  progress[id] = nextRec(progress[id], correct);
  if (memory) memory.progress = progress;
  await safeSet(KEY, progress);
  if (!correct) {
    const m = await loadMistakes();
    const next = [{ id, at: new Date().toISOString() }, ...m.filter((x) => x.id !== id)].slice(0, 50);
    if (memory) memory.mistakes = next;
    await safeSet(MISTAKES, next);
  }
  return progress;
}

/** Ask the browser not to evict our storage. Asked once. */
export async function askPersist(): Promise<boolean | undefined> {
  const meta = await loadMeta();
  if (meta.persistAsked) return undefined;
  let granted: boolean | undefined;
  try {
    granted = await navigator.storage?.persist?.();
  } catch {
    granted = undefined;
  }
  await safeSet(META, { ...meta, persistAsked: true });
  return granted;
}

/* ---------- export / import ---------- */

export type Backup = { app: "tcs-study"; version: 1; exportedAt: string; progress: ProgressMap; mistakes: Mistake[] };

export async function makeBackup(): Promise<Backup> {
  const backup: Backup = {
    app: "tcs-study",
    version: 1,
    exportedAt: new Date().toISOString(),
    progress: await loadProgress(),
    mistakes: await loadMistakes(),
  };
  const meta = await loadMeta();
  await safeSet(META, { ...meta, lastExport: backup.exportedAt });
  return backup;
}

export function backupToCode(b: Backup): string {
  const json = JSON.stringify(b);
  return btoa(unescape(encodeURIComponent(json)));
}

export function parseBackup(text: string): Backup {
  const t = text.trim();
  const json = t.startsWith("{") ? t : decodeURIComponent(escape(atob(t)));
  const b = JSON.parse(json);
  if (b?.app !== "tcs-study" || b?.version !== 1 || typeof b.progress !== "object")
    throw new Error("This is not a TCS Study backup.");
  for (const [id, r] of Object.entries(b.progress as ProgressMap)) {
    if (typeof id !== "string" || ![1, 2, 3, 4, 5].includes(r.box) || !/^\d{4}-\d{2}-\d{2}$/.test(r.due))
      throw new Error("The backup contains an invalid entry.");
  }
  return b as Backup;
}

/** Merge: for each item keep the record that was answered most recently. */
export async function importBackup(b: Backup): Promise<number> {
  const current = await loadProgress();
  let changed = 0;
  for (const [id, r] of Object.entries(b.progress)) {
    if (!current[id] || current[id].last < r.last) {
      current[id] = r;
      changed++;
    }
  }
  await safeSet(KEY, current);
  const mistakes = [...(b.mistakes ?? []), ...(await loadMistakes())]
    .sort((a, z) => z.at.localeCompare(a.at))
    .filter((m, i, all) => all.findIndex((x) => x.id === m.id) === i)
    .slice(0, 50);
  await safeSet(MISTAKES, mistakes);
  return changed;
}

export async function resetAll() {
  try {
    await del(KEY);
    await del(MISTAKES);
  } catch {
    /* ignore */
  }
  if (memory) memory = { progress: {}, mistakes: [], meta: memory.meta };
}
