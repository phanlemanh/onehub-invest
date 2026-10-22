#!/usr/bin/env node
// Smoke HTTP ranh giới cổng trên app ĐANG CHẠY (mặc định http://localhost:3456,
// đổi bằng BASE_URL). Cần DB local (DATABASE_URL, mặc định :5433).
//
// Tự tạo phiên tạm cho 1 admin có sẵn + 1 user thường tạm (email *.verify.test),
// xoá sạch trong finally — không đụng dữ liệu khác.
// Dùng: BASE_URL=http://localhost:3456 node scripts/smoke-portal-compliance.mjs
import { randomBytes } from "node:crypto";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

// Root repo không có node_modules — mượn pg từ app/ (AGENTS.md bẫy 6).
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const pg = createRequire(path.join(root, "app/package.json"))("pg");

const BASE = (process.env.BASE_URL ?? "http://localhost:3456").replace(/\/$/, "");
const DB = process.env.DATABASE_URL ?? "postgres://oneinvest:oneinvest@localhost:5433/oneinvest";
const nonce = randomBytes(6).toString("hex");

const fails = [];
const check = (ok, msg) => {
  console.log(`${ok ? "ok  " : "FAIL"} ${msg}`);
  if (!ok) fails.push(msg);
};
const get = async (p, token) => {
  const res = await fetch(BASE + p, {
    redirect: "manual",
    headers: token ? { cookie: `oi_session=${token}` } : {},
  });
  return { status: res.status, location: res.headers.get("location") ?? "", body: await res.text() };
};
const count = (s, re) => (s.match(re) ?? []).length;

const db = new pg.Client({ connectionString: DB });
await db.connect();
const userId = `verify-user-${nonce}`;
const tokens = [];
try {
  // ---- khách (không phiên) ----
  let r = await get("/deals");
  check(r.status >= 300 && r.status < 400 && r.location.endsWith("/ops/deals"), "khách: /deals chuyển sang /ops/deals");
  r = await get("/ops/deals");
  check(r.status >= 300 && r.status < 400 && r.location.includes("/login"), "khách: /ops/deals bị đưa về /login");
  r = await get("/api/zalo-media?path=/etc/hosts");
  check(r.status === 404, "khách: /api/zalo-media trả 404 (không lộ có/không có file)");

  r = await get("/vn/hanoi/dau-tu");
  check(r.status === 200, "khách: /vn/hanoi/dau-tu trả 200");
  check(count(r.body, /airdna/gi) === 0, `khách: /dau-tu không chứa chữ AirDNA (${count(r.body, /airdna/gi)})`);
  check(/tự thu/.test(r.body), "khách: /dau-tu ghi nguồn mặc định là dữ liệu tự thu");
  r = await get("/vn");
  check(r.status === 200 && count(r.body, /href="\/deals"/g) === 0, "khách: nav Invest (/vn) không có link /deals");

  // ---- user thường (tạm) ----
  await db.query(
    `INSERT INTO users (id, email, password_hash, plan, role) VALUES ($1, $2, 'verify-no-login', 'free', 'user')`,
    [userId, `${nonce}@smoke.verify.test`],
  );
  const userTok = `verify-${nonce}-u`;
  tokens.push(userTok);
  await db.query(`INSERT INTO sessions (token, user_id, expires_at) VALUES ($1, $2, now() + interval '10 minutes')`, [userTok, userId]);
  r = await get("/ops/deals", userTok);
  // OPS_EMAILS đặt → user lạ bị 404; để trống → vào được nhưng KHÔNG thấy liên hệ.
  check(r.status === 200 || r.status === 404, `user thường: /ops/deals trả 200 hoặc 404 (${r.status === 200 ? "vào được" : "bị chặn"})`);
  check(count(r.body, /href="tel:/g) === 0, `user thường: không có SĐT (${count(r.body, /href="tel:/g)} link tel:)`);
  r = await get("/api/zalo-media?path=/etc/hosts", userTok);
  check(r.status === 404, "user thường: /api/zalo-media bị chặn (404, chưa tới kiểm path)");

  // ---- admin có sẵn (phiên tạm) ----
  const { rows: admins } = await db.query(`SELECT id FROM users WHERE role = 'admin' ORDER BY created_at LIMIT 1`);
  if (admins.length === 0) {
    check(false, "admin: DB local không có user role=admin để thử");
  } else {
    const adminTok = `verify-${nonce}-a`;
    tokens.push(adminTok);
    await db.query(`INSERT INTO sessions (token, user_id, expires_at) VALUES ($1, $2, now() + interval '10 minutes')`, [adminTok, admins[0].id]);
    r = await get("/ops/deals", adminTok);
    if (r.status === 404) {
      check(false, "admin: /ops/deals 404 — admin đầu tiên không nằm trong OPS_EMAILS");
    } else {
      check(r.status === 200, "admin: /ops/deals trả 200");
      const { rows: withPhone } = await db.query(
        `SELECT count(*)::int n FROM sale_offers WHERE price_tier = 'P1' AND seller_phone IS NOT NULL AND last_seen >= now() - interval '45 days'`,
      );
      const tel = count(r.body, /href="tel:/g);
      // Có tin P1 kèm SĐT trong DB local → admin phải thấy ít nhất một (khối liên hệ không bị gate nhầm).
      check(withPhone[0].n === 0 || tel > 0, `admin: thấy SĐT người bán (${tel} link tel:, DB có ${withPhone[0].n} tin P1 kèm SĐT)`);
      const leaks = count(r.body, />[^<]*\b(Zalo|Facebook|Chợ Tốt)\b[^<]*</g);
      check(leaks === 0, `admin: chữ hiển thị chỉ dùng mã nguồn S0x (${leaks} nút chữ có tên nguồn thật)`);
    }
    r = await get("/api/zalo-media?path=/etc/hosts", adminTok);
    check(r.status === 403, "admin: /api/zalo-media qua cổng quyền, chặn ở kiểm path (403)");
  }
} finally {
  await db.query(`DELETE FROM sessions WHERE token = ANY($1::text[])`, [tokens]);
  await db.query(`DELETE FROM users WHERE id = $1`, [userId]);
  await db.end();
}

console.log(fails.length === 0 ? "\nportal-smoke: ĐẠT" : `\nportal-smoke: ${fails.length} lỗi`);
process.exit(fails.length === 0 ? 0 : 1);
