"use client";

import { useAuth } from "@clerk/nextjs";
import { useEffect } from "react";
import { PROGRESS_EVENT } from "@/lib/progress";
import { setSyncStatus, syncNow } from "@/lib/sync";

/**
 * Runs inside ClerkProvider. While signed in, it syncs:
 * on sign-in / page load, shortly after each answer, when the device comes back online,
 * and when the app returns to the foreground.
 */
export function SyncManager() {
  const { isLoaded, isSignedIn, userId } = useAuth();

  useEffect(() => {
    if (!isLoaded) return;
    if (!isSignedIn || !userId) {
      setSyncStatus({ state: "signed-out" });
      return;
    }
    let timer: ReturnType<typeof setTimeout> | undefined;
    const soon = (ms = 1500) => {
      clearTimeout(timer);
      timer = setTimeout(() => void syncNow(userId), ms);
    };
    const onProgress = (e: Event) => {
      // a merge from the server is the result of a sync, not a reason for another one
      if ((e as CustomEvent).detail !== "merge") soon();
    };
    const onVisible = () => document.visibilityState === "visible" && soon(300);
    const onOnline = () => soon(300);

    void syncNow(userId);
    window.addEventListener(PROGRESS_EVENT, onProgress);
    window.addEventListener("online", onOnline);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearTimeout(timer);
      window.removeEventListener(PROGRESS_EVENT, onProgress);
      window.removeEventListener("online", onOnline);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [isLoaded, isSignedIn, userId]);

  return null;
}
