import { auth } from "@clerk/nextjs/server";
import { items } from "@/lib/content";
import { db, dbEnabled } from "@/lib/db";
import { authEnabled } from "@/lib/authConfig";
import { REPORT_REASONS } from "@/lib/reportReasons";

const REASONS = new Set<string>(REPORT_REASONS);
const IDS = new Set(items.map((i) => i.id));

/** Stores a mistake report in Neon. Works signed in or not; 503 until DATABASE_URL is set. */
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

  if (!dbEnabled()) return Response.json({ ok: false, error: "not-configured" }, { status: 503 });

  let userId: string | null = null;
  if (authEnabled()) {
    try {
      userId = (await auth()).userId;
    } catch {
      userId = null;
    }
  }

  await db().query(`INSERT INTO reports (item_id, reason, note, user_id) VALUES ($1, $2, $3, $4)`, [
    itemId,
    reason,
    typeof note === "string" && note.trim() ? note.trim() : null,
    userId,
  ]);
  return Response.json({ ok: true });
}
