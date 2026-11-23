"use client";

import { loadMeta, loadPending, loadProgress, mergeRemote, saveMeta, savePending, type ProgressMap } from "./progress";

export type SyncStatus =
  | { state: "off" } // sign-in not configured
  | { state: "signed-out" }
  | { state: "syncing" }
  | { state: "synced"; at: string }
  | { state: "offline"; pending: number }
  | { state: "error"; message: string };

export const SYNC_EVENT = "tcs-sync-status";
let status: SyncStatus = { state: "off" };

export const getSyncStatus = () => status;
export function setSyncStatus(s: SyncStatus) {
  status = s;
  if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent(SYNC_EVENT, { detail: s }));
}

let running: Promise<void> | null = null;
let again = false;

/**
 * Sends pending local changes and merges the server's records back in.
 * Calls made while a sync is running are coalesced into one follow-up sync.
 */
export function syncNow(userId: string): Promise<void> {
  if (running) {
    again = true;
    return running;
  }
  running = (async () => {
    try {
      do {
        again = false;
        await syncOnce(userId);
      } while (again);
    } finally {
      running = null;
    }
  })();
  return running;
}

async function syncOnce(userId: string) {
  if (typeof navigator !== "undefined" && !navigator.onLine) {
    const p = await loadPending();
    setSyncStatus({ state: "offline", pending: p.dirty.length });
    return;
  }
  setSyncStatus({ state: "syncing" });

  const meta = await loadMeta();
  const progress = await loadProgress();
  const pending = await loadPending();

  // First sync of this account on this device: upload everything already practised here.
  const firstForUser = meta.syncedUser !== userId;
  const ids = firstForUser ? Object.keys(progress) : pending.dirty.filter((id) => progress[id]);
  const records: ProgressMap = {};
  for (const id of ids) records[id] = progress[id];
  const attempts = pending.attempts.slice(0, 2000);

  let res: Response;
  try {
    res = await fetch("/api/sync", {
      method: "POST",
      headers: { "content-type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({ records, attempts }),
    });
  } catch {
    setSyncStatus({ state: "offline", pending: pending.dirty.length });
    return;
  }
  if (res.status === 401) {
    setSyncStatus({ state: "signed-out" });
    return;
  }
  if (!res.ok) {
    setSyncStatus({ state: "error", message: res.status === 503 ? "Sync is not switched on yet." : `Server error (${res.status}).` });
    return;
  }
  const body = (await res.json()) as { records: ProgressMap };

  // Drop what was sent, unless it changed again while the request was in flight.
  const now = await loadPending();
  const latest = await loadProgress();
  now.dirty = now.dirty.filter((id) => !records[id] || latest[id]?.last !== records[id].last);
  now.attempts = now.attempts.slice(attempts.length);
  await savePending(now);

  await mergeRemote(body.records);
  const at = new Date().toISOString();
  await saveMeta({ syncedUser: userId, lastSync: at });
  setSyncStatus({ state: "synced", at });
}
