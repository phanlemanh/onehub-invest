#!/usr/bin/env node
// smoke-review-photos.mjs — AC-7 của _acceptance/review-card-photos: ảnh tin trên /ops/review chỉ tới tay admin.
// Tạo một tài khoản admin thử + một ops thử (tiền tố riêng mỗi lần chạy, session ghi thẳng vào DB local,
// không mật khẩu), tải /ops/review bằng từng phiên, so HTML với ảnh lấy thẳng từ DB, rồi xoá cả hai.
// Cần app đang chạy TỪ worktree đang kiểm (BASE_URL, mặc định :3456) + DB local :5433.
// Dùng: BASE_URL=http://localhost:3456 node scripts/smoke-review-photos.mjs  (exit 0 = đạt)
import { randomBytes } from "node:crypto";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { assertLocalDatabaseUrl, DEFAULT_DATABASE_URL } from "./dev-ops-account.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const pg = createRequire(path.join(root, "app/package.json"))("pg");
const BASE = process.env.BASE_URL ?? "http://localhost:3456";
const db = new pg.Client({ connectionString: String(assertLocalDatabaseUrl(process.env.DATABASE_URL ?? DEFAULT_DATABASE_URL)) });

const nonce = `rpsmoke${randomBytes(4).toString("hex")}`;
const fails = [];
const check = (ok, msg) => {
  console.log(`${ok ? "ok  " : "FAIL"} ${msg}`);
  if (!ok) fails.push(msg);
};
// HTML do React render: & trong thuộc tính thành &amp;
const inHtml = (html, url) => html.includes(url) || html.includes(url.replaceAll("&", "&amp;"));

async function page(token) {
  const res = await fetch(`${BASE}/ops/review`, { headers: { cookie: `oi_session=${token}` }, redirect: "manual" });
  return { status: res.status, html: await res.text() };
}

async function main() {
  await db.connect();
  // Ảnh mong đợi lấy thẳng từ DB, không qua loader: thẻ Cùng căn? đầu tiên có ảnh cả hai bên.
  const { rows } = await db.query(`
    SELECT q.id, q.evidence->'offer_b'->>'image_url' AS b_url, first_media.url AS a_url
    FROM review_queue q
    JOIN sale_offers o ON o.offer_id = q.evidence->'offer_a'->>'offer_id'
    CROSS JOIN LATERAL (
      SELECT m->>'url' AS url
      FROM unnest(o.post_ids) WITH ORDINALITY u(pid, ord)
      JOIN stg_zalo_posts p ON p.post_id = u.pid
      CROSS JOIN LATERAL jsonb_array_elements(CASE WHEN jsonb_typeof(p.media) = 'array' THEN p.media ELSE '[]' END) m
      WHERE m->>'url' LIKE 'http%'
      ORDER BY u.ord LIMIT 1
    ) first_media
    WHERE q.item_type = 'entity_match' AND q.evidence->'offer_b'->>'image_url' LIKE 'http%'
    ORDER BY q.id LIMIT 1`);
  if (rows.length === 0) {
    console.error("DB local không có thẻ Cùng căn? nào có ảnh cả hai bên — không đo được");
    process.exit(2);
  }
  const { a_url: aUrl, b_url: bUrl } = rows[0];
  console.log(`thẻ mẫu #${rows[0].id}: Tin A ${new URL(aUrl).hostname} · Tin B ${new URL(bUrl).hostname}`);

  const tokens = { admin: randomBytes(32).toString("hex"), ops: randomBytes(32).toString("hex") };
  try {
    for (const role of ["admin", "ops"]) {
      await db.query(`INSERT INTO users (id, email, password_hash, role) VALUES ($1, $2, 'x', $3)`, [
        `${nonce}-${role}`,
        `${nonce}-${role}@local.test`,
        role,
      ]);
      await db.query(`INSERT INTO sessions (token, user_id, expires_at) VALUES ($1, $2, now() + interval '10 minutes')`, [
        tokens[role],
        `${nonce}-${role}`,
      ]);
    }

    const admin = await page(tokens.admin);
    check(admin.status === 200, `admin tải /ops/review (HTTP ${admin.status})`);
    check(inHtml(admin.html, aUrl), "HTML admin có ảnh Tin A (URL gốc từ stg_zalo_posts.media)");
    check(inHtml(admin.html, bUrl), "HTML admin có ảnh Tin B (image_url Chợ Tốt)");
    check(/referrerpolicy="no-referrer"/i.test(admin.html), "ảnh ngoài trong HTML admin mang referrerpolicy=no-referrer");

    const ops = await page(tokens.ops);
    check(ops.status === 200, `ops tải /ops/review (HTTP ${ops.status})`);
    check(/Cùng căn|Review Queue/.test(ops.html), "HTML ops vẫn có hàng duyệt");
    check(!inHtml(ops.html, aUrl) && !inHtml(ops.html, bUrl), "should-NOT-fire: HTML ops không có URL ảnh của thẻ mẫu");
    check(
      !/fbcdn\.net|zdn\.vn|cdn\.chotot\.com|\/api\/zalo-media/.test(ops.html),
      "should-NOT-fire: HTML ops không có URL ảnh tin nào (fbcdn/zdn/chotot/zalo-media)",
    );
  } finally {
    await db.query(`DELETE FROM sessions WHERE user_id LIKE $1`, [`${nonce}-%`]);
    await db.query(`DELETE FROM users WHERE id LIKE $1`, [`${nonce}-%`]);
    const left = await db.query(`SELECT count(*)::int AS n FROM users WHERE id LIKE $1`, [`${nonce}-%`]);
    console.log(`dọn: còn ${left.rows[0].n} tài khoản thử`);
    if (left.rows[0].n !== 0) fails.push("dọn tài khoản thử");
    await db.end();
  }

  if (fails.length) {
    console.log(`\nreview-photos smoke: ${fails.length} vi phạm`);
    process.exit(1);
  }
  console.log(`\nSMOKE PASS (${nonce})`);
}

main().catch(async (err) => {
  console.error(err);
  process.exit(1);
});
