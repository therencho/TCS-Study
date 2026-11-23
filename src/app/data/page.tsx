import type { Metadata } from "next";
import { DataPanel } from "@/components/DataPanel";
import { SyncPanel } from "@/components/auth/SyncBadge";
import { authEnabledClient } from "@/lib/authConfig";

export const metadata: Metadata = { title: "Your data" };

export default function DataPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl">Your data</h1>
        <p className="mt-1 text-[0.95rem] leading-relaxed text-muted">
          {authEnabledClient()
            ? "Progress is saved on this device first, so practice works offline. When you are signed in, it also syncs to your account."
            : "Your progress is saved on this device. Install the app and keep a backup file if you want to be safe."}
        </p>
      </div>
      {authEnabledClient() && <SyncPanel />}
      <DataPanel auth={authEnabledClient()} />
    </div>
  );
}
