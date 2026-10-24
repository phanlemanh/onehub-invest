#!/usr/bin/env node
// Smoke HTTP sổ bề mặt API (hồ sơ so-be-mat-api, AC-4…AC-6) trên app ĐANG CHẠY (mặc định http://localhost:3456,
// đổi bằng BASE_URL). Cần DB local (rào assertLocalDatabaseUrl — không bao giờ tạo tài khoản thử trên DB cloud).
//
// Tự tạo 1 user thường + 1 user role=ops + 1 user role=admin tạm (email *.verify.test) với phiên tạm, vài ảnh thử trong
// /tmp/openclaw; xoá sạch trong finally. Ảnh QR thử đặt tên bằng tiền tố của chính bên viết (zalo-admin.ts).
// Token ops lấy từ env OPS_API_TOKEN, thiếu thì đọc dòng OPS_API_TOKEN= trong app/.env.local; vẫn thiếu → TRƯỢT có tên.
// Ca "user thường bị chặn" giả định email user tạm KHÔNG nằm trong OPS_EMAILS.
//
// --chi-doc: chỉ ca tin rao khách + bearer, không DB, không ghi gì — đo prod sau deploy:
//   BASE_URL=https://onehub-invest.vercel.app OPS_API_TOKEN=… node scripts/smoke-api-surface.mjs --chi-doc
// Dùng: BASE_URL=http://localhost:3456 node scripts/smoke-api-surface.mjs
import { randomBytes } from "node:crypto";
import { existsSync, readFileSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { assertLocalDatabaseUrl, DEFAULT_DATABASE_URL } from "./dev-ops-account.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const BASE = (process.env.BASE_URL ?? "http://localhost:3456").replace(/\/$/, "");
const CHI_DOC = process.argv.includes("--chi-doc");
const nonce = randomBytes(6).toString("hex");

const fails = [];
const check = (ok, msg) => {
  console.log(`${ok ? "ok  " : "FAIL"} ${msg}`);
  if (!ok) fails.push(msg);
};

let DB = "";
if (!CHI_DOC) {
  try {
    DB = String(assertLocalDatabaseUrl(process.env.DATABASE_URL ?? DEFAULT_DATABASE_URL));
  } catch (e) {
    console.error(`FAIL rào DB local: ${e.message}`);
    process.exit(2);
  }
}

function opsToken() {
  if (process.env.OPS_API_TOKEN) return process.env.OPS_API_TOKEN;
  const f = path.join(root, "app/.env.local");
  if (!existsSync(f)) return "";
  const line = readFileSync(f, "utf8")
    .split("\n")
    .find((l) => /^\s*OPS_API_TOKEN\s*=/.test(l));
  return line ? line.replace(/^\s*OPS_API_TOKEN\s*=\s*/, "").trim().replace(/^(["'])(.*)\1$/, "$2") : "";
}

const call = async (p, { bearer, session, method = "GET", body } = {}) => {
  const headers = {};
  if (bearer !== undefined) headers.authorization = `Bearer ${bearer}`;
  if (session) headers.cookie = `oi_session=${session}`;
  if (body !== undefined) headers["content-type"] = "application/json";
  const res = await fetch(BASE + p, { method, redirect: "manual", headers, body: body === undefined ? undefined : JSON.stringify(body) });
  const buf = Buffer.from(await res.arrayBuffer());
  let json = null;
  try {
    json = JSON.parse(buf.toString("utf8"));
  } catch {
    // thân không phải JSON (204, ảnh) — các ca tự báo
  }
  return { status: res.status, json, len: buf.length, type: res.headers.get("content-type") ?? "" };
};
const denied = (r) => r.status === 401 && JSON.stringify(r.json) === '{"error":"unauthorized"}';
const offersShape = (r) =>
  r.status === 200 && r.json && Array.isArray(r.json.rows) && ["generatedAt", "kind", "count"].every((k) => k in r.json);
const OFFERS = "/api/v1/offers?kind=sale&limit=5";

// ---- tin rao: khách + bearer (không cần DB) ----
const token = opsToken();
let r = await call(OFFERS);
check(denied(r), `offers khách: 401 {"error":"unauthorized"} (${r.status} ${JSON.stringify(r.json)?.slice(0, 60)})`);
r = await call(OFFERS, { bearer: `sai-${nonce}` });
check(denied(r), `offers bearer sai: 401 (${r.status})`);
if (!token) check(false, "thiếu OPS_API_TOKEN (env hoặc app/.env.local) — ca bearer đúng không thử được");
else {
  r = await call(OFFERS, { bearer: token });
  check(offersShape(r), `offers bearer đúng: 200, khuôn generatedAt/kind/count/rows (${r.status}, ${r.json?.count ?? "?"} dòng)`);
}

if (!CHI_DOC) {
  const pg = createRequire(path.join(root, "app/package.json"))("pg");
  const { LOGIN_QR_PREFIX } = await import(path.join(root, "app/src/lib/zalo-admin.ts"));
  const db = new pg.Client({ connectionString: DB });
  await db.connect();
  const ids = { user: `verify-surf-u-${nonce}`, ops: `verify-surf-o-${nonce}`, admin: `verify-surf-a-${nonce}` };
  const tokens = [];
  const tmpFiles = [];
  const session = async (userId, tag) => {
    const tok = `verify-surf-${nonce}-${tag}`;
    tokens.push(tok);
    await db.query(`INSERT INTO sessions (token, user_id, expires_at) VALUES ($1, $2, now() + interval '10 minutes')`, [tok, userId]);
    return tok;
  };
  try {
    for (const [role, id] of Object.entries(ids)) {
      await db.query(`INSERT INTO users (id, email, password_hash, plan, role) VALUES ($1, $2, 'verify-no-login', 'free', $3)`, [
        id,
        `${nonce}-surf-${role}@smoke.verify.test`,
        role,
      ]);
    }
    const userTok = await session(ids.user, "u");
    const opsTok = await session(ids.ops, "o");
    const adminTok = await session(ids.admin, "a");

    r = await call(OFFERS, { session: userTok });
    check(denied(r), `offers phiên role=user: 401 (${r.status})`);
    r = await call(OFFERS, { session: opsTok });
    check(offersShape(r), `offers phiên role=ops: 200 (${r.status})`);

    // ---- beacon ----
    r = await call("/api/v1/user-events", { method: "POST", body: { kind: "view_market", payload: { smoke: nonce } } });
    check(r.status === 204 && r.len === 0, `beacon khách: 204, thân rỗng (${r.status}, ${r.len} byte)`);
    r = await call("/api/v1/user-events", { method: "POST", session: userTok, body: { kind: "view_market", payload: { smoke: nonce } } });
    const { rows } = await db.query(`SELECT count(*)::int n FROM user_events WHERE user_id = $1`, [ids.user]);
    check(r.status === 200 && rows[0].n === 1, `beacon có phiên: 200, đúng 1 dòng user_events của user tạm (${r.status}, ${rows[0].n} dòng)`);

    // ---- zalo-media: ảnh QR đăng nhập ----
    if (!existsSync("/tmp/openclaw")) check(false, "zalo-media: /tmp/openclaw chưa có trên máy — không thử được");
    else {
      const PNG = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=", "base64");
      const qr = `/tmp/openclaw/${LOGIN_QR_PREFIX}verify-${nonce}.png`;
      const plain = `/tmp/openclaw/verify-surf-${nonce}.png`;
      const link = `/tmp/openclaw/verify-surf-${nonce}-link.png`;
      tmpFiles.push(qr, plain, link);
      writeFileSync(qr, PNG);
      writeFileSync(plain, PNG);
      symlinkSync(qr, link);
      const media = (p) => call(`/api/zalo-media?path=${encodeURIComponent(p)}`, { session: adminTok });
      r = await media(qr);
      check(r.status === 403, `zalo-media admin: ảnh thử tên QR → 403 (${r.status})`);
      r = await media(link);
      check(r.status === 403, `zalo-media admin: symlink tên thường trỏ QR → 403 (${r.status})`);
      r = await media(plain);
      check(r.status === 200 && r.type === "image/png", `zalo-media admin: ảnh thử tên thường → 200 (${r.status} ${r.type})`);
    }
  } finally {
    await db.query(`DELETE FROM user_events WHERE user_id = ANY($1::text[])`, [Object.values(ids)]);
    await db.query(`DELETE FROM sessions WHERE token = ANY($1::text[])`, [tokens]);
    await db.query(`DELETE FROM users WHERE id = ANY($1::text[])`, [Object.values(ids)]);
    for (const f of tmpFiles) rmSync(f, { force: true });
    await db.end();
  }
}

console.log(fails.length === 0 ? "\napi-surface-smoke: ĐẠT" : `\napi-surface-smoke: ${fails.length} lỗi`);
process.exit(fails.length === 0 ? 0 : 1);
