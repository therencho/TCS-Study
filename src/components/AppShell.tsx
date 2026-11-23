"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { itemsOf, modules } from "@/lib/content";

type InstallEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };

const DISMISS_KEY = "tcs-install-dismissed";
const DISMISS_DAYS = 30;

function dismissedRecently(): boolean {
  try {
    const t = Number(localStorage.getItem(DISMISS_KEY) ?? 0);
    return Date.now() - t < DISMISS_DAYS * 864e5;
  } catch {
    return false;
  }
}

/** Registers the service worker and offers installation (Android/desktop prompt, iOS instructions). */
export function AppShell() {
  const pathname = usePathname();
  const [installEvent, setInstallEvent] = useState<InstallEvent | null>(null);
  const [iosHint, setIosHint] = useState(false);
  const [hidden, setHidden] = useState(true);

  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker
      .register("/sw.js", { scope: "/", updateViaCache: "none" })
      .then(() => navigator.serviceWorker.ready)
      .then((reg) => {
        const urls = modules.filter((m) => itemsOf(m.id).length > 0).map((m) => `/practice/${m.id}`);
        reg.active?.postMessage({ type: "warm", urls });
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as Navigator & { standalone?: boolean }).standalone === true;
    if (standalone || dismissedRecently()) return;

    const ua = navigator.userAgent;
    const isIos = /iPhone|iPad|iPod/.test(ua) || (ua.includes("Mac") && navigator.maxTouchPoints > 1);
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setInstallEvent(e as InstallEvent);
      setHidden(false);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    const t = isIos
      ? setTimeout(() => {
          setIosHint(true);
          setHidden(false);
        }, 0)
      : undefined;
    return () => {
      clearTimeout(t);
      window.removeEventListener("beforeinstallprompt", onPrompt);
    };
  }, []);

  const dismiss = () => {
    try {
      localStorage.setItem(DISMISS_KEY, String(Date.now()));
    } catch {
      /* storage blocked */
    }
    setHidden(true);
  };

  if (hidden || pathname !== "/" || (!installEvent && !iosHint)) return null;

  return (
    <div
      role="dialog"
      aria-label="Install TCS Study"
      className="fixed inset-x-0 bottom-0 z-20 mx-auto max-w-xl px-4 pb-[max(1rem,env(safe-area-inset-bottom))]"
    >
      <div className="flex items-start gap-3 rounded-2xl border border-line bg-card p-4 shadow-lg">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/icon-192.png" alt="" width={40} height={40} className="rounded-lg" />
        <div className="min-w-0 flex-1 text-sm">
          <div className="font-medium">Install TCS Study</div>
          {installEvent ? (
            <p className="text-muted">Add it to your home screen: it opens like an app and works offline.</p>
          ) : (
            <p className="text-muted">
              Tap <span aria-label="Share">Share</span> <span aria-hidden>⎋</span> in Safari, then{" "}
              <span className="font-medium text-ink">Add to Home Screen</span>. This also keeps your progress safe on iPhone.
            </p>
          )}
          <div className="mt-3 flex gap-2">
            {installEvent && (
              <button
                type="button"
                onClick={async () => {
                  await installEvent.prompt();
                  await installEvent.userChoice;
                  setInstallEvent(null);
                  setHidden(true);
                }}
                className="h-9 rounded-lg bg-accent px-4 font-medium text-accent-ink"
              >
                Install
              </button>
            )}
            <button type="button" onClick={dismiss} className="h-9 rounded-lg px-3 text-muted">
              Not now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
