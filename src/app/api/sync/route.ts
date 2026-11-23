import { auth } from "@clerk/nextjs/server";
import { items } from "@/lib/content";
import { db, dbEnabled } from "@/lib/db";
import { authEnabled } from "@/lib/authConfig";
import { SyncRequest } from "@/lib/syncSchema";
import type { ProgressMap } from "@/lib/progress";

const IDS = new Set(items.map((i) => i.id));
const MAX_RECORDS = 2000;

type Row = { item_id: string; box: number; due: string; right_count: number; wrong_count: number; last_at: string };

/**
 * Two-way sync for a signed-in user.
 * - Upserts the sent records; a record only replaces the stored one if its `last` is newer.
 * - Stores first-try attempts for item statistics.
 * - Returns the full stored progress so the device can merge it in.
 */
export async function POST(req: Request) {
  if (!authEnabled() || !dbEnabled()) return Response.json({ error: "not-configured" }, { status: 503 });
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "signed-out" }, { status: 401 });

  let parsed;
  try {
    parsed = SyncRequest.safeParse(await req.json());
  } catch {
    return Response.json({ error: "invalid-json" }, { status: 400 });
  }
  if (!parsed.success) return Response.json({ error: "invalid-body" }, { status: 400 });

  const now = Date.now() + 24 * 3600 * 1000; // allow for clock skew, reject far-future data
  const records = Object.entries(parsed.data.records)
    .filter(([id, r]) => IDS.has(id) && Date.parse(r.last) < now)
    .slice(0, MAX_RECORDS);
  const attempts = parsed.data.attempts.filter((a) => IDS.has(a.itemId) && Date.parse(a.at) < now);

  const sql = db();
  if (records.length) {
    await sql.query(
      `INSERT INTO progress (user_id, item_id, box, due, right_count, wrong_count, last_at)
       SELECT $1, * FROM unnest($2::text[], $3::smallint[], $4::date[], $5::int[], $6::int[], $7::timestamptz[])
       ON CONFLICT (user_id, item_id) DO UPDATE SET
         box = EXCLUDED.box, due = EXCLUDED.due, right_count = EXCLUDED.right_count,
         wrong_count = EXCLUDED.wrong_count, last_at = EXCLUDED.last_at, updated_at = now()
       WHERE progress.last_at < EXCLUDED.last_at`,
      [
        userId,
        records.map(([id]) => id),
        records.map(([, r]) => r.box),
        records.map(([, r]) => r.due),
        records.map(([, r]) => r.right),
        records.map(([, r]) => r.wrong),
        records.map(([, r]) => r.last),
      ],
    );
  }
  if (attempts.length) {
    await sql.query(
      `INSERT INTO attempts (user_id, item_id, correct, at)
       SELECT $1, * FROM unnest($2::text[], $3::boolean[], $4::timestamptz[])
       ON CONFLICT DO NOTHING`,
      [userId, attempts.map((a) => a.itemId), attempts.map((a) => a.correct), attempts.map((a) => a.at)],
    );
  }

  const rows = (await sql.query(
    `SELECT item_id, box, to_char(due, 'YYYY-MM-DD') AS due, right_count, wrong_count,
            to_char(last_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') AS last_at
     FROM progress WHERE user_id = $1`,
    [userId],
  )) as Row[];

  const progress: ProgressMap = {};
  for (const r of rows) {
    if (!IDS.has(r.item_id)) continue;
    progress[r.item_id] = {
      box: r.box as 1 | 2 | 3 | 4 | 5,
      due: r.due,
      right: r.right_count,
      wrong: r.wrong_count,
      last: r.last_at,
    };
  }
  return Response.json({ records: progress });
}
