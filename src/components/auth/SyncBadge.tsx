"use client";

import { useAuth } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import { getSyncStatus, SYNC_EVENT, syncNow, type SyncStatus } from "@/lib/sync";
import { SignInNudge, useClerkStuck } from "./AccountButton";

export function useSyncStatus() {
  const [s, setS] = useState<SyncStatus>(getSyncStatus);
  useEffect(() => {
    const on = (e: Event) => setS((e as CustomEvent<SyncStatus>).detail);
    window.addEventListener(SYNC_EVENT, on);
    return () => window.removeEventListener(SYNC_EVENT, on);
  }, []);
  return s;
}

function label(s: SyncStatus): string {
  switch (s.state) {
    case "syncing":
      return "Syncing…";
    case "synced":
      return `Synced ${new Date(s.at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
    case "offline":
      return s.pending ? `Offline · ${s.pending} change(s) waiting` : "Offline";
    case "error":
      return s.message;
    default:
      return "";
  }
}

/** Sync panel for the "Your data" page. */
export function SyncPanel() {
  const { isLoaded, isSignedIn, userId } = useAuth();
  const s = useSyncStatus();
  const stuck = useClerkStuck();
  if (!isLoaded)
    return (
      <section className="space-y-2 rounded-2xl border border-line bg-card p-5">
        <h2 className="font-medium">Sync</h2>
        {stuck ? <SignInNudge /> : <p className="text-sm text-muted">Connecting to sign-in…</p>}
      </section>
    );
  return (
    <section className="space-y-3 rounded-2xl border border-line bg-card p-5">
      <h2 className="font-medium">Sync</h2>
      {isSignedIn && userId ? (
        <>
          <p className="text-sm text-muted">
            Your progress syncs automatically to your account after each answer, so it follows you to any device
            where you sign in.
          </p>
          <div className="flex items-center justify-between gap-3">
            <span className={`text-sm ${s.state === "error" ? "text-bad" : "text-ink"}`}>{label(s) || "Waiting…"}</span>
            <button
              type="button"
              onClick={() => void syncNow(userId)}
              disabled={s.state === "syncing"}
              className="h-9 rounded-md border border-line px-3 text-sm disabled:opacity-40"
            >
              Sync now
            </button>
          </div>
        </>
      ) : (
        <SignInNudge />
      )}
    </section>
  );
}

/** Tiny status dot for the header. */
export function SyncDot() {
  const s = useSyncStatus();
  const color =
    s.state === "synced"
      ? "bg-good"
      : s.state === "syncing"
        ? "bg-accent animate-pulse"
        : s.state === "offline"
          ? "bg-muted"
          : s.state === "error"
            ? "bg-bad"
            : "";
  if (!color) return null;
  return <span title={label(s)} aria-label={label(s)} className={`inline-block h-2 w-2 rounded-full ${color}`} />;
}
