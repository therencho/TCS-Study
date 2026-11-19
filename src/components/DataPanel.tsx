"use client";

import { useEffect, useState } from "react";
import { items } from "@/lib/content";
import {
  backupToCode,
  importBackup,
  loadMeta,
  loadProgress,
  makeBackup,
  parseBackup,
  resetAll,
  today,
  type ProgressMap,
} from "@/lib/progress";
import { counts } from "@/lib/schedule";

export function DataPanel() {
  const [progress, setProgress] = useState<ProgressMap | null>(null);
  const [lastExport, setLastExport] = useState<string | undefined>();
  const [code, setCode] = useState("");
  const [input, setInput] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);

  const refresh = async () => {
    setProgress(await loadProgress());
    setLastExport((await loadMeta()).lastExport);
  };
  useEffect(() => {
    loadProgress().then(setProgress);
    loadMeta().then((m) => setLastExport(m.lastExport));
  }, []);

  const c = progress ? counts(items, progress, today()) : null;

  const download = async () => {
    const b = await makeBackup();
    const blob = new Blob([JSON.stringify(b, null, 1)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `tcs-study-backup-${today()}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
    void refresh();
  };

  const showCode = async () => {
    setCode(backupToCode(await makeBackup()));
    void refresh();
  };

  const doImport = async (text: string) => {
    try {
      const n = await importBackup(parseBackup(text));
      setMsg({ ok: true, text: `Imported. ${n} item record(s) updated.` });
      setInput("");
      void refresh();
    } catch (e) {
      setMsg({ ok: false, text: (e as Error).message || "That backup could not be read." });
    }
  };

  return (
    <div className="space-y-6">
      <section className="grid grid-cols-3 gap-2 text-center">
        <Stat label="practised" value={progress ? Object.keys(progress).length : "…"} />
        <Stat label="learned" value={c?.learned ?? "…"} />
        <Stat label="due today" value={c?.due ?? "…"} />
      </section>

      <section className="space-y-3 rounded-2xl border border-line bg-card p-5">
        <h2 className="font-medium">Export</h2>
        <p className="text-sm text-muted">
          {lastExport ? `Last export: ${new Date(lastExport).toLocaleDateString()}` : "Not exported yet."}
        </p>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={download} className="h-10 rounded-lg bg-ink px-4 text-sm font-medium text-paper">
            Download file
          </button>
          <button type="button" onClick={showCode} className="h-10 rounded-lg border border-line px-4 text-sm">
            Show code
          </button>
        </div>
        {code && (
          <div className="space-y-2">
            <textarea
              readOnly
              aria-label="Backup code"
              value={code}
              rows={4}
              onFocus={(e) => e.currentTarget.select()}
              className="w-full rounded-md border border-line bg-paper p-2 font-mono text-xs break-all"
            />
            <button
              type="button"
              onClick={() => navigator.clipboard?.writeText(code).then(() => setMsg({ ok: true, text: "Code copied." }))}
              className="h-9 rounded-md border border-line px-3 text-sm"
            >
              Copy code
            </button>
          </div>
        )}
      </section>

      <section className="space-y-3 rounded-2xl border border-line bg-card p-5">
        <h2 className="font-medium">Import</h2>
        <p className="text-sm text-muted">
          Paste a code or choose a backup file. For each item, the more recent answer wins.
        </p>
        <textarea
          aria-label="Paste backup code"
          placeholder="Paste backup code"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          rows={3}
          className="w-full rounded-md border border-line bg-paper p-2 font-mono text-xs"
        />
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            disabled={!input.trim()}
            onClick={() => doImport(input)}
            className="h-10 rounded-lg bg-ink px-4 text-sm font-medium text-paper disabled:opacity-40"
          >
            Import code
          </button>
          <label className="grid h-10 cursor-pointer place-items-center rounded-lg border border-line px-4 text-sm">
            Choose file
            <input
              type="file"
              accept="application/json,.json"
              className="sr-only"
              onChange={async (e) => {
                const f = e.target.files?.[0];
                if (f) await doImport(await f.text());
                e.target.value = "";
              }}
            />
          </label>
        </div>
        {msg && <p className={`text-sm ${msg.ok ? "text-good" : "text-bad"}`}>{msg.text}</p>}
      </section>

      <section className="space-y-3 rounded-2xl border border-line p-5">
        <h2 className="font-medium">Start over</h2>
        <p className="text-sm text-muted">Deletes all progress on this device. Export first if you want to keep it.</p>
        {confirmReset ? (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={async () => {
                await resetAll();
                setConfirmReset(false);
                setMsg({ ok: true, text: "Progress deleted." });
                void refresh();
              }}
              className="h-10 rounded-lg bg-bad px-4 text-sm font-medium text-paper"
            >
              Delete everything
            </button>
            <button type="button" onClick={() => setConfirmReset(false)} className="h-10 rounded-lg border border-line px-4 text-sm">
              Cancel
            </button>
          </div>
        ) : (
          <button type="button" onClick={() => setConfirmReset(true)} className="h-10 rounded-lg border border-line px-4 text-sm text-bad">
            Delete progress…
          </button>
        )}
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-xl border border-line bg-card py-3">
      <div className="font-serif text-2xl tabular-nums">{value}</div>
      <div className="text-xs text-muted">{label}</div>
    </div>
  );
}
