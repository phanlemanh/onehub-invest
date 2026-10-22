// store.ts — M2: memory tool cho agent (đọc/ghi 3 lớp Postgres-first)
// Usage: import { observe, getActiveProfile, recentEvents } from "./store.js"
import pg from "pg";

const DB_URL =
  process.env.DATABASE_URL ?? "postgres://oneinvest:oneinvest@localhost:5433/oneinvest";

export type EventKind =
  | "view_market" | "view_listing" | "saved_market" | "saved_listing"
  | "compare" | "dau_tu_input" | "advisor_msg" | "deal_click" | "feedback";

export async function observe(
  userId: string,
  kind: EventKind,
  payload: Record<string, unknown>,
  source: "app" | "advisor" = "app",
): Promise<void> {
  const c = new pg.Client({ connectionString: DB_URL });
  await c.connect();
  try {
    await c.query(
      `INSERT INTO user_events (user_id, kind, payload, source) VALUES ($1, $2, $3::jsonb, $4)`,
      [userId, kind, JSON.stringify(payload), source],
    );
  } finally {
    await c.end();
  }
}

export type ProfileEntry = {
  key: string;
  value: Record<string, unknown>;
  source: string;
  valid_from: string;
  valid_to: string | null;
};

export async function getActiveProfile(userId: string): Promise<ProfileEntry[]> {
  const c = new pg.Client({ connectionString: DB_URL });
  await c.connect();
  try {
    const { rows } = await c.query(
      `SELECT key, value, source, valid_from::text, valid_to::text
       FROM user_profile WHERE user_id = $1 AND valid_to IS NULL`,
      [userId],
    );
    return rows.map((r: { key: string; value: Record<string, unknown>; source: string; valid_from: string; valid_to: string | null }) => ({
      key: r.key,
      value: r.value,
      source: r.source,
      valid_from: r.valid_from,
      valid_to: r.valid_to,
    }));
  } finally {
    await c.end();
  }
}

export async function recentEvents(userId: string, n = 20): Promise<
  { kind: string; payload: Record<string, unknown>; at: string }[]
> {
  const c = new pg.Client({ connectionString: DB_URL });
  await c.connect();
  try {
    const { rows } = await c.query(
      `SELECT kind, payload, at::text FROM user_events
       WHERE user_id = $1 ORDER BY at DESC LIMIT $2`,
      [userId, n],
    );
    return rows;
  } finally {
    await c.end();
  }
}

/** Ghi fact mới vào profile; đóng fact cũ (bi-temporal). */
export async function upsertProfile(
  userId: string,
  key: string,
  value: Record<string, unknown>,
  source: "declared" | "behavior" | "feedback",
  evidenceEventIds: number[] = [],
): Promise<void> {
  const c = new pg.Client({ connectionString: DB_URL });
  await c.connect();
  try {
    await c.query("BEGIN");
    // đóng fact cũ
    await c.query(
      `UPDATE user_profile SET valid_to = now()
       WHERE user_id = $1 AND key = $2 AND valid_to IS NULL`,
      [userId, key],
    );
    // ghi fact mới
    await c.query(
      `INSERT INTO user_profile (user_id, key, value, source, evidence_event_ids)
       VALUES ($1, $2, $3::jsonb, $4, $5)`,
      [userId, key, JSON.stringify(value), source, evidenceEventIds],
    );
    await c.query("COMMIT");
  } catch (e) {
    await c.query("ROLLBACK");
    throw e;
  } finally {
    await c.end();
  }
}
