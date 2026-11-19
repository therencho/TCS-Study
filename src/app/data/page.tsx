import type { Metadata } from "next";
import { DataPanel } from "@/components/DataPanel";

export const metadata: Metadata = { title: "Your data" };

export default function DataPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl">Your data</h1>
        <p className="mt-1 text-[0.95rem] leading-relaxed text-muted">
          Your progress is stored only in this browser. Nothing is sent anywhere unless you report a mistake.
          Export a backup to move it to another device or to keep it safe.
        </p>
      </div>
      <DataPanel />
    </div>
  );
}
