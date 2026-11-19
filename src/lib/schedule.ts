import type { Item, Module } from "./items";
import type { ProgressMap } from "./progress";

export const MIX_SIZE = 10;

export type Counts = { due: number; fresh: number; learned: number; total: number };

export function counts(items: Item[], progress: ProgressMap, todayStr: string): Counts {
  let due = 0,
    fresh = 0,
    learned = 0;
  for (const it of items) {
    const r = progress[it.id];
    if (!r) fresh++;
    else {
      if (r.due <= todayStr) due++;
      if (r.box >= 3) learned++;
    }
  }
  return { due, fresh, learned, total: items.length };
}

/** Small deterministic PRNG so a session order is stable while it runs. */
export function rng(seed: number) {
  let s = seed >>> 0 || 1;
  return () => {
    s ^= s << 13;
    s ^= s >>> 17;
    s ^= s << 5;
    return ((s >>> 0) % 1_000_000) / 1_000_000;
  };
}

export function shuffle<T>(xs: T[], rand: () => number): T[] {
  const a = [...xs];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Due reviews first (oldest due first), then new items weighted by module exam weight. */
export function dailyMix(
  items: Item[],
  modules: Module[],
  progress: ProgressMap,
  todayStr: string,
  seed: number,
): Item[] {
  const rand = rng(seed);
  const due = items
    .filter((i) => progress[i.id] && progress[i.id].due <= todayStr)
    .sort((a, b) => progress[a.id].due.localeCompare(progress[b.id].due));
  const picked = due.slice(0, MIX_SIZE);
  if (picked.length < MIX_SIZE) {
    const weight = new Map(modules.map((m) => [m.id, m.weight]));
    // weighted shuffle: key = rand^(1/w) (Efraimidis–Spirakis)
    const fresh = items
      .filter((i) => i.phase === 1 && !progress[i.id])
      .map((i) => ({ i, k: Math.pow(rand(), 1 / (weight.get(i.module) ?? 1)) }))
      .sort((a, b) => b.k - a.k)
      .map((x) => x.i);
    picked.push(...fresh.slice(0, MIX_SIZE - picked.length));
  }
  return shuffle(picked, rand);
}

/** "Practice anyway": the items with the lowest boxes, then the oldest. */
export function extraPractice(items: Item[], progress: ProgressMap, seed: number): Item[] {
  const rand = rng(seed);
  return shuffle(
    [...items]
      .filter((i) => i.phase === 1)
      .sort((a, b) => {
        const ra = progress[a.id],
          rb = progress[b.id];
        return (ra?.box ?? 0) - (rb?.box ?? 0) || (ra?.last ?? "").localeCompare(rb?.last ?? "");
      })
      .slice(0, MIX_SIZE),
    rand,
  );
}

/** One round of a module: due, then new, then lowest boxes. */
export function moduleRound(items: Item[], progress: ProgressMap, todayStr: string, seed: number): Item[] {
  const rank = (i: Item) => {
    const r = progress[i.id];
    if (r && r.due <= todayStr) return 0;
    if (!r) return 1;
    return 2 + r.box;
  };
  const rand = rng(seed);
  const ordered = shuffle(items, rand).sort((a, b) => rank(a) - rank(b));
  return ordered.slice(0, MIX_SIZE);
}
