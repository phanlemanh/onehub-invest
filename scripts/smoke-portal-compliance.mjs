#!/usr/bin/env node
// Smoke HTTP ranh giới cổng trên app ĐANG CHẠY (mặc định http://localhost:3456,
// đổi bằng BASE_URL). Cần DB local (DATABASE_URL, mặc định :5433).
//
// Tự tạo phiên tạm cho 1 admin có sẵn + 1 user thường tạm + 1 user role=ops tạm
// (email *.verify.test) và vài file thử trong /tmp/openclaw, /tmp/openclaw-evil-*;
// xoá sạch trong finally — không đụng dữ liệu khác.
// Ca "user thường bị chặn khỏi /ops" giả định email user tạm KHÔNG nằm trong OPS_EMAILS.
// Dùng: BASE_URL=http://localhost:3456 node scripts/smoke-portal-compliance.mjs
import { randomBytes } from "node:crypto";
import { existsSync, mkdirSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import os from "node:os";
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
  return {
    status: res.status,
    location: res.headers.get("location") ?? "",
    type: res.headers.get("content-type") ?? "",
    body: await res.text(),
  };
};
const count = (s, re) => (s.match(re) ?? []).length;

const db = new pg.Client({ connectionString: DB });
await db.connect();
const userId = `verify-user-${nonce}`;
const opsId = `verify-ops-${nonce}`;
const tokens = [];
const tmpFiles = [];
// PNG 1×1 hợp lệ — ca dương tính của /api/zalo-media.
const PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=",
  "base64",
);
const mkTemp = async (role, id, tag) => {
  await db.query(
    `INSERT INTO users (id, email, password_hash, plan, role) VALUES ($1, $2, 'verify-no-login', 'free', $3)`,
    [id, `${nonce}-${tag}@smoke.verify.test`, role],
  );
  const tok = `verify-${nonce}-${tag}`;
  tokens.push(tok);
  await db.query(`INSERT INTO sessions (token, user_id, expires_at) VALUES ($1, $2, now() + interval '10 minutes')`, [tok, id]);
  return tok;
};
const media = (p, tok) => get(`/api/zalo-media?path=${encodeURIComponent(p)}`, tok);
try {
  // ---- khách (không phiên) ----
  let r = await get("/deals");
  check(r.status >= 300 && r.status < 400 && r.location.endsWith("/ops/deals"), "khách: /deals chuyển sang /ops/deals");
  r = await get("/ops/deals");
  check(r.status >= 300 && r.status < 400 && r.location.includes("/login"), "khách: /ops/deals bị đưa về /login");
  r = await get("/api/zalo-media?path=/etc/hosts");
  check(r.status === 404, "khách: /api/zalo-media trả 404 (không lộ có/không có file)");

  r = await get("/vn/hanoi/dau-tu");
  check(r.status === 301 && /\/yield\?area=vn-hanoi#financing$/.test(r.location), "khách: /vn/hanoi/dau-tu chuyển 301 về /yield?area=vn-hanoi#financing");
  r = await get("/yield?area=vn-hanoi");
  check(r.status === 200, "khách: /yield trả 200");
  check(count(r.body, /airdna/gi) === 0, `khách: /yield không chứa chữ AirDNA (${count(r.body, /airdna/gi)})`);
  r = await get("/vn");
  check(r.status === 200 && count(r.body, /href="\/deals"/g) === 0, "khách: nav Invest (/vn) không có link /deals");

  // ---- user thường (tạm) ----
  // Cổng Ops đóng mặc định: tự đăng ký (/register → role=user) KHÔNG đủ để vào /ops.
  const userTok = await mkTemp("user", userId, "u");
  r = await get("/ops/deals", userTok);
  check(r.status === 404, `user thường: /ops/deals bị chặn 404 (${r.status})`);
  check(count(r.body, /href="tel:/g) === 0, `user thường: không có SĐT (${count(r.body, /href="tel:/g)} link tel:)`);
  r = await get("/ops", userTok);
  check(r.status === 404, `user thường: /ops bị chặn 404 (${r.status})`);
  r = await get("/api/v1/ops/coverage", userTok);
  check(r.status === 401, `user thường: API /api/v1/ops/coverage trả 401 (${r.status})`);
  r = await get("/api/zalo-media?path=/etc/hosts", userTok);
  check(r.status === 404, "user thường: /api/zalo-media bị chặn (404, chưa tới kiểm path)");

  // ---- user role=ops (tạm): vào Ops nhưng KHÔNG thấy tầng A ----
  const opsTok = await mkTemp("ops", opsId, "o");
  r = await get("/ops/deals", opsTok);
  check(r.status === 200, `role=ops: /ops/deals trả 200 (${r.status})`);
  check(count(r.body, /href="tel:/g) === 0, `role=ops: không có SĐT (${count(r.body, /href="tel:/g)} link tel:)`);
  r = await get("/api/v1/ops/coverage", opsTok);
  check(r.status === 200, `role=ops: API /api/v1/ops/coverage trả 200 (${r.status})`);
  r = await get("/ops/sources", opsTok);
  check(r.status === 404, `role=ops: /ops/sources (admin-class) vẫn 404 (${r.status})`);
  r = await get("/api/zalo-media?path=/etc/hosts", opsTok);
  check(r.status === 404, "role=ops: /api/zalo-media bị chặn (404 — ảnh tin là tầng A, chỉ admin)");

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

    // ---- /api/zalo-media: chỉ ảnh trong ~/.openclaw/media + /tmp/openclaw ----
    const oc = path.join(os.homedir(), ".openclaw");
    for (const [p, label] of [
      [path.join(oc, "openclaw.json"), "~/.openclaw/openclaw.json (cấu hình)"],
      [path.join(oc, "media", "..", "openclaw.json"), "~/.openclaw/media/../openclaw.json (leo thư mục)"],
      [path.join(oc, "credentials"), "~/.openclaw/credentials"],
    ]) {
      r = await media(p, adminTok);
      check(r.status === 403, `admin: ${label} → 403 (${r.status})`);
    }
    const evilDir = `/tmp/openclaw-evil-${nonce}`;
    mkdirSync(evilDir, { recursive: true });
    tmpFiles.push(evilDir);
    writeFileSync(path.join(evilDir, "x.png"), PNG);
    r = await media(path.join(evilDir, "x.png"), adminTok);
    check(r.status === 403, `admin: /tmp/openclaw-evil-*/x.png (khớp tiền tố chuỗi) → 403 (${r.status})`);
    if (!existsSync("/tmp/openclaw")) {
      check(false, "admin: /tmp/openclaw chưa có trên máy — không thử được ca trong gốc");
    } else {
      const okPng = `/tmp/openclaw/verify-${nonce}.png`;
      const txt = `/tmp/openclaw/verify-${nonce}.txt`;
      const link = `/tmp/openclaw/verify-${nonce}-link.png`;
      tmpFiles.push(okPng, txt, link);
      writeFileSync(okPng, PNG);
      writeFileSync(txt, "khong-phai-anh");
      symlinkSync(path.join(evilDir, "x.png"), link);
      r = await media(okPng, adminTok);
      check(r.status === 200 && r.type === "image/png", `admin: ảnh trong /tmp/openclaw → 200 image/png (${r.status} ${r.type})`);
      r = await media(txt, adminTok);
      check(r.status === 403, `admin: file không phải ảnh trong /tmp/openclaw → 403 (${r.status})`);
      r = await media(link, adminTok);
      check(r.status === 403, `admin: symlink .png trong /tmp/openclaw trỏ ra ngoài → 403 (${r.status})`);
      r = await media(`/tmp/openclaw/verify-${nonce}-khong-co.png`, adminTok);
      check(r.status === 404, `admin: ảnh không tồn tại trong gốc → 404 (${r.status})`);
    }
  }
} finally {
  await db.query(`DELETE FROM sessions WHERE token = ANY($1::text[])`, [tokens]);
  await db.query(`DELETE FROM users WHERE id = ANY($1::text[])`, [[userId, opsId]]);
  for (const f of tmpFiles) rmSync(f, { recursive: true, force: true });
  await db.end();
}

console.log(fails.length === 0 ? "\nportal-smoke: ĐẠT" : `\nportal-smoke: ${fails.length} lỗi`);
process.exit(fails.length === 0 ? 0 : 1);
