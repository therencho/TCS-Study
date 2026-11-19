import { items } from "@/lib/content";

const REASONS = new Set([
  "The answer key is wrong",
  "The checker rejects a correct answer",
  "The wording is unclear",
  "Typo or formatting",
  "Something else",
]);
const IDS = new Set(items.map((i) => i.id));

/**
 * Receives a mistake report. Storage (Neon) is connected in a later step;
 * until DATABASE_URL is set, valid reports are answered with 503 "not configured".
 */
export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ ok: false, error: "invalid-json" }, { status: 400 });
  }
  const { itemId, reason, note } = (body ?? {}) as Record<string, unknown>;
  if (typeof itemId !== "string" || !IDS.has(itemId))
    return Response.json({ ok: false, error: "unknown-item" }, { status: 400 });
  if (typeof reason !== "string" || !REASONS.has(reason))
    return Response.json({ ok: false, error: "unknown-reason" }, { status: 400 });
  if (note !== undefined && (typeof note !== "string" || note.length > 1000))
    return Response.json({ ok: false, error: "invalid-note" }, { status: 400 });

  if (!process.env.DATABASE_URL) {
    return Response.json({ ok: false, error: "not-configured" }, { status: 503 });
  }
  // TODO(M0 Neon step): insert into reports (item_id, reason, note, created_at)
  return Response.json({ ok: false, error: "not-configured" }, { status: 503 });
}
