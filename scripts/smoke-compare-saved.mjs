#!/usr/bin/env node
// smoke-compare-saved.mjs — _acceptance/compare-saved-trang-thai (UI4): /compare (301 từ /so-sanh) và /saved qua HTTP.
// Đo HTML server trả về: redirect 301 giữ query, PageHeader (một <h1>, breadcrumb, stat, nút), mã lạ bị bỏ, Đã lưu có
// dữ liệu / trống (c-empty-11), 307 khi chưa đăng nhập. Người dùng thử + session ghi thẳng DB local (không mật khẩu, tiền
// tố riêng mỗi lượt) như smoke-review-photos.mjs, xoá ở finally.
// Cần app chạy TỪ worktree đang kiểm (BASE_URL, mặc định :3460 — cổng riêng của dãy U1) + DB local :5433.
// Dùng: BASE_URL=http://localhost:3460 node scripts/smoke-compare-saved.mjs  (exit 0 = đạt)
import { randomBytes } from "node:crypto";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { assertLocalDatabaseUrl, DEFAULT_DATABASE_URL } from "./dev-ops-account.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const pg = createRequire(path.join(root, "app/package.json"))("pg");
const BASE = process.env.BASE_URL ?? "http://localhost:3460";
const db = new pg.Client({ connectionString: String(assertLocalDatabaseUrl(process.env.DATABASE_URL ?? DEFAULT_DATABASE_URL)) });

const nonce = `cssmoke${randomBytes(4).toString("hex")}`;
const fails = [];
const check = (ok, msg) => {
  console.log(`${ok ? "ok  " : "FAIL"} ${msg}`);
  if (!ok) fails.push(msg);
};

async function get(pathname, token) {
  const res = await fetch(`${BASE}${pathname}`, {
    headers: token ? { cookie: `oi_session=${token}` } : {},
    redirect: "manual",
  });
  return { status: res.status, location: res.headers.get("location"), html: await res.text() };
}

/** Chữ của HTML (bỏ thẻ, gộp khoảng trắng, giải &amp;…) — để so cụm chữ người đọc thấy. */
const text = (html) =>
  html
    .replace(/<script[\s\S]*?<\/script>/g, " ")
    .replace(/<style[\s\S]*?<\/style>/g, " ")
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<[^>]*>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/\s+/g, " ");
/** Chữ của badge đầu tiên đứng sau <h1> — stat của PageHeader (không lẫn chữ của nút hay bảng). */
const headerStat = (html) => {
  const h = html.search(/<h1[\s>]/);
  const m = h < 0 ? null : html.slice(h).match(/data-slot="badge"[^>]*>([\s\S]*?)<\/span>/);
  return m ? text(m[1]).trim() : null;
};
/** Khối Empty đầu tiên: từ data-slot="empty" tới hết khối empty-content (nút hành động nằm trong đó). */
const emptyBlock = (html) => {
  const from = html.indexOf('data-slot="empty"');
  const content = html.indexOf('data-slot="empty-content"', from);
  return from < 0 || content < 0 ? "" : html.slice(from, html.indexOf("</div>", content) + 6);
};
const h1s = (html) => [...html.matchAll(/<h1[^>]*>([\s\S]*?)<\/h1>/g)].map((m) => text(m[1]).trim());
/** Đường dẫn tương đối của Location (Next trả URL tuyệt đối). */
const rel = (loc) => (loc ? decodeURIComponent(loc.replace(/^https?:\/\/[^/]+/, "")) : loc);
const decode = (s) => s.replace(/&amp;/g, "&");

async function pickAreas() {
  // Thị trường nhiều listing nhất + 2 phường con nhiều listing nhất — đều có số Finder (market_metrics).
  const m = await db.query(`
    SELECT a.id, a.name FROM areas a JOIN market_metrics mm ON mm.area_id = a.id
    WHERE a.region_type = 'market' GROUP BY a.id, a.name ORDER BY max(mm.listing_count) DESC LIMIT 1`);
  const s = await db.query(
    `SELECT a.id, a.name FROM areas a JOIN market_metrics mm ON mm.area_id = a.id
     WHERE a.region_type = 'submarket' AND a.parent_id = $1 GROUP BY a.id, a.name ORDER BY max(mm.listing_count) DESC LIMIT 2`,
    [m.rows[0]?.id],
  );
  if (m.rows.length === 0 || s.rows.length < 2) {
    console.error("DB local không có thị trường + 2 phường có số Finder — không đo được");
    process.exit(2);
  }
  return { market: m.rows[0], subs: s.rows };
}

async function main() {
  await db.connect();
  const { market, subs } = await pickAreas();
  const [a, b] = [market, subs[0]];

  // AC-1 — 301 giữ query.
  const r1 = await get(`/so-sanh?areas=${a.id},${b.id}`);
  check(r1.status === 301 && rel(r1.location) === `/compare?areas=${a.id},${b.id}`,
    `/so-sanh?areas=${a.id},${b.id} → 301 /compare?areas=${a.id},${b.id} (nhận ${r1.status} ${rel(r1.location)})`);
  const r2 = await get(`/so-sanh`);
  check(r2.status === 301 && rel(r2.location) === "/compare", `/so-sanh → 301 /compare (nhận ${r2.status} ${rel(r2.location)})`);

  // AC-3 — PageHeader + bảng.
  const c = await get(`/compare?areas=${a.id},${b.id}`);
  check(c.status === 200, `/compare?areas=… 200 (nhận ${c.status})`);
  const ct = text(c.html);
  const ch = h1s(c.html);
  check(ch.length === 1 && ch[0] === "So sánh khu vực", `đúng một <h1> «So sánh khu vực» (thấy ${JSON.stringify(ch)})`);
  check(/data-slot="breadcrumb"/.test(c.html) && /Việt Nam\s*(?:›|>)?\s*So sánh/.test(ct), "breadcrumb Việt Nam › So sánh");
  check(headerStat(c.html) === "2/4 khu vực", `stat PageHeader = 2/4 khu vực (thấy ${JSON.stringify(headerStat(c.html))})`);
  check(ct.includes("Thêm khu vực"), "nút Thêm khu vực");
  check(ct.includes(a.name) && ct.includes(b.name), `tên hai khu vực trong bảng (${a.name}, ${b.name})`);
  check(
    ct.includes("Lợi suất (căn 60 m²)") && ct.includes("Lợi suất ngắn hạn") && ct.includes("Lợi suất dài hạn"),
    "nhóm lợi suất có hàng Lợi suất ngắn hạn VÀ Lợi suất dài hạn (thị trường mẫu phải có số lợi suất)",
  );
  check(!ct.includes("Yield ngắn hạn") && !ct.includes("Yield dài hạn"), "không còn «Yield ngắn hạn/dài hạn»");
  check(ct.includes("Ô xanh"), "đối chứng: có cột thì có chú thích Ô xanh");
  const bad = await get(`/compare?areas=khong-co-ma-nay`);
  check(text(bad.html).includes("0/4 khu vực"), "mã lạ bị bỏ: 0/4 khu vực");

  // AC-7 — So sánh trống.
  const e = await get(`/compare`);
  const et = text(e.html);
  const eb = emptyBlock(e.html);
  const ebActions = [...eb.matchAll(/<(a|button)\b[^>]*>/g)].map((m) => m[0]);
  check(
    text(eb).includes("Chưa chọn khu vực nào") && ebActions.length === 1 && /href="\/vn"/.test(ebActions[0]),
    `Empty Chưa chọn khu vực nào + đúng một link /vn TRONG khối trống (thấy ${ebActions.length} nút/link)`,
  );
  check(!et.includes("Ô xanh"), "không chú thích Ô xanh khi trống");

  // AC-4 — chưa đăng nhập vẫn 307.
  const anon = await get(`/saved`);
  check(anon.status === 307 && rel(anon.location) === "/login?next=/saved",
    `/saved chưa đăng nhập → 307 /login?next=/saved (nhận ${anon.status} ${rel(anon.location)})`);

  const token = randomBytes(32).toString("hex");
  const uid = `${nonce}-user`;
  try {
    await db.query(`INSERT INTO users (id, email, password_hash, role) VALUES ($1, $2, 'x', 'user')`, [uid, `${uid}@local.test`]);
    await db.query(`INSERT INTO sessions (token, user_id, expires_at) VALUES ($1, $2, now() + interval '10 minutes')`, [token, uid]);

    // AC-7 — Đã lưu trống: c-empty-11.
    const s0 = await get(`/saved`, token);
    const s0t = text(s0.html);
    check(s0.status === 200 && s0t.includes("Chưa lưu khu vực nào"), `/saved trống: Chưa lưu khu vực nào (HTTP ${s0.status})`);
    const sb = emptyBlock(s0.html);
    const actions = [...sb.matchAll(/<(a|button)\b[^>]*>/g)].map((m) => m[0]);
    check(
      actions.length === 1 && /href="\/vn"/.test(actions[0]) && text(sb).includes("Tìm thị trường"),
      `đúng một nút/link trong vùng trống, trỏ /vn, chữ Tìm thị trường (thấy ${actions.length})`,
    );
    check(!/role="tab"/.test(s0.html), "không có role=tab khi trống");

    // AC-4 — 3 khu vực lưu, created_at tăng dần: thị trường trước, rồi 2 phường.
    const order = [market, subs[0], subs[1]];
    for (const [i, ar] of order.entries())
      await db.query(`INSERT INTO saved_markets (user_id, area_id, created_at) VALUES ($1, $2, now() - ($3 || ' minutes')::interval)`, [
        uid,
        ar.id,
        String(10 - i),
      ]);
    const expectIds = (
      await db.query(`SELECT area_id FROM saved_markets WHERE user_id = $1 ORDER BY created_at DESC`, [uid])
    ).rows.map((r) => r.area_id);
    const s3 = await get(`/saved`, token);
    const s3t = text(s3.html);
    const sh = h1s(s3.html);
    check(sh.length === 1 && sh[0] === "Đã lưu", `đúng một <h1> «Đã lưu» (thấy ${JSON.stringify(sh)})`);
    check(/Việt Nam\s*(?:›|>)?\s*Đã lưu/.test(s3t), "breadcrumb Việt Nam › Đã lưu");
    check(headerStat(s3.html) === "3 khu vực", `stat PageHeader = 3 khu vực (thấy ${JSON.stringify(headerStat(s3.html))})`);
    const cmp = decode(s3.html.match(/href="(\/compare\?areas=[^"]*)"/)?.[1] ?? "");
    check(
      cmp === `/compare?areas=${expectIds.join(",")}` && s3t.includes("So sánh 3 khu vực"),
      `So sánh 3 khu vực → /compare?areas=${expectIds.join(",")} (thấy ${cmp || "không có"})`,
    );
    const tabs = [...s3.html.matchAll(/role="tab"[^>]*aria-label="([^"]+)"/g)].map((m) => m[1]);
    check(
      JSON.stringify(tabs) === JSON.stringify(["Tất cả, 3 khu vực", "Thị trường, 1 khu vực", "Phường, 2 khu vực"]),
      `tab Tất cả 3 · Thị trường 1 · Phường 2 (thấy ${JSON.stringify(tabs)})`,
    );
    const cards = (s3.html.match(/aria-label="Bỏ lưu [^"]+"/g) ?? []).length;
    check(cards === 3, `3 thẻ khu vực (thấy ${cards})`);
    check(!s3.html.includes("/so-sanh"), "HTML Đã lưu không còn /so-sanh");
  } finally {
    await db.query(`DELETE FROM saved_markets WHERE user_id = $1`, [uid]);
    await db.query(`DELETE FROM sessions WHERE user_id = $1`, [uid]);
    await db.query(`DELETE FROM users WHERE id = $1`, [uid]);
    await db.end();
  }

  console.log(fails.length === 0 ? "compare-saved smoke: ĐẠT" : `compare-saved smoke: ${fails.length} chỗ hỏng`);
  process.exit(fails.length === 0 ? 0 : 1);
}

main().catch(async (err) => {
  console.error(err);
  process.exit(1);
});
