"use client";

import { useState } from "react";

export const REPORT_REASONS = [
  "The answer key is wrong",
  "The checker rejects a correct answer",
  "The wording is unclear",
  "Typo or formatting",
  "Something else",
] as const;

type State = "idle" | "sending" | "sent" | "unavailable" | "error";

export function ReportButton({ itemId }: { itemId: string }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<string>(REPORT_REASONS[0]);
  const [note, setNote] = useState("");
  const [state, setState] = useState<State>("idle");

  const send = async () => {
    setState("sending");
    try {
      const res = await fetch("/api/report", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ itemId, reason, note: note.slice(0, 1000) }),
      });
      if (res.ok) setState("sent");
      else if (res.status === 503) setState("unavailable");
      else setState("error");
    } catch {
      setState("error");
    }
  };

  if (!open)
    return (
      <button type="button" onClick={() => setOpen(true)} className="text-sm text-muted underline underline-offset-4">
        Report a mistake
      </button>
    );

  return (
    <div className="w-full rounded-lg border border-line bg-card p-4">
      {state === "sent" ? (
        <p className="text-sm">Thanks, the report was sent. Fixes go live with the next update.</p>
      ) : state === "unavailable" ? (
        <p className="text-sm">
          Reporting isn&apos;t connected yet. Please tell the maintainer the item id: <code className="font-mono">{itemId}</code>
        </p>
      ) : (
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            void send();
          }}
        >
          <div className="text-sm font-medium">Report a mistake</div>
          <select
            aria-label="Reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="h-10 w-full rounded-md border border-line bg-paper px-2 text-sm"
          >
            {REPORT_REASONS.map((r) => (
              <option key={r}>{r}</option>
            ))}
          </select>
          <textarea
            aria-label="Note (optional)"
            placeholder="What's wrong? (optional)"
            value={note}
            maxLength={1000}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
            className="w-full rounded-md border border-line bg-paper p-2 text-sm"
          />
          {state === "error" && <p className="text-sm text-bad">Sending failed. Check your connection and try again.</p>}
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setOpen(false)} className="h-9 rounded-md px-3 text-sm text-muted">
              Cancel
            </button>
            <button
              type="submit"
              disabled={state === "sending"}
              className="h-9 rounded-md bg-ink px-4 text-sm font-medium text-paper disabled:opacity-50"
            >
              {state === "sending" ? "Sending…" : "Send report"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
