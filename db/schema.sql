-- TCS Study database schema (Neon / Postgres). Idempotent: safe to run on every build.

-- One row per (user, item): the spaced-repetition state. The newest `last_at` wins on sync.
CREATE TABLE IF NOT EXISTS progress (
  user_id      text        NOT NULL,
  item_id      text        NOT NULL,
  box          smallint    NOT NULL CHECK (box BETWEEN 1 AND 5),
  due          date        NOT NULL,
  right_count  integer     NOT NULL DEFAULT 0,
  wrong_count  integer     NOT NULL DEFAULT 0,
  last_at      timestamptz NOT NULL,
  updated_at   timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, item_id)
);

-- Every first try in a session from a signed-in user: feeds per-item statistics.
CREATE TABLE IF NOT EXISTS attempts (
  id        bigserial   PRIMARY KEY,
  user_id   text        NOT NULL,
  item_id   text        NOT NULL,
  correct   boolean     NOT NULL,
  at        timestamptz NOT NULL,
  UNIQUE (user_id, item_id, at)
);
CREATE INDEX IF NOT EXISTS attempts_item_idx ON attempts (item_id);

-- Mistake reports from the "Report a mistake" button (signed in or not).
CREATE TABLE IF NOT EXISTS reports (
  id          bigserial   PRIMARY KEY,
  item_id     text        NOT NULL,
  reason      text        NOT NULL,
  note        text,
  user_id     text,
  status      text        NOT NULL DEFAULT 'open',
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS reports_status_idx ON reports (status, created_at DESC);

-- Per-item difficulty: share of first tries that were wrong (signed-in users only).
CREATE OR REPLACE VIEW item_stats AS
  SELECT item_id,
         count(*)                                    AS attempts,
         round(avg(CASE WHEN correct THEN 0 ELSE 1 END)::numeric, 3) AS wrong_rate,
         count(DISTINCT user_id)                     AS users
  FROM attempts
  GROUP BY item_id;
