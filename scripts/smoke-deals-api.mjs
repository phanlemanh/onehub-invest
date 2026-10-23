#!/usr/bin/env node
// Smoke HTTP cho GET /api/v1/deals đang tạm đóng (hồ sơ deals-api-tam-dong, AC-1…AC-4) trên app ĐANG
// CHẠY (mặc định http://localhost:3456, đổi bằng BASE_URL). Cần DB local (DATABASE_URL, mặc định :5433).
//
// Tự tạo 1 user thường + 1 user role=ops tạm (email *.verify.test) và 3 phiên tạm (một phiên đã hết hạn);
// xoá sạch trong finally — không đụng dữ liệu khác. Token ops lấy từ env OPS_API_TOKEN, thiếu thì đọc
// dòng OPS_API_TOKEN= trong app/.env.local (đúng tệp app dev đọc); vẫn thiếu → TRƯỢT có tên.
// Ca "user thường bị chặn" giả định email user tạm KHÔNG nằm trong OPS_EMAILS.
//
// --chi-doc: chỉ ca khách + bearer, không mở DB, không ghi gì — đo prod sau deploy:
//   BASE_URL=https://onehub-invest.vercel.app OPS_API_TOKEN=… node scripts/smoke-deals-api.mjs --chi-doc
// Dùng: BASE_URL=http://localhost:3456 node scripts/smoke-deals-api.mjs
import { randomBytes } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const BASE = (process.env.BASE_URL ?? "http://localhost:3456").replace(/\/$/, "");
const DB = process.env.DATABASE_URL ?? "postgres://oneinvest:oneinvest@localhost:5433/oneinvest";
const CHI_DOC = process.argv.includes("--chi-doc");
const nonce = randomBytes(6).toString("hex");

const fails = [];
const check = (ok, msg) => {
  console.log(`${ok ? "ok  " : "FAIL"} ${msg}`);
  if (!ok) fails.push(msg);
};

function opsToken() {
  if (process.env.OPS_API_TOKEN) return process.env.OPS_API_TOKEN;
  const f = path.join(root, "app/.env.local");
  if (!existsSync(f)) return "";
  const line = readFileSync(f, "utf8")
    .split("\n")
    .find((l) => /^\s*OPS_API_TOKEN\s*=/.test(l));
  return line ? line.replace(/^\s*OPS_API_TOKEN\s*=\s*/, "").trim().replace(/^(["'])(.*)\1$/, "$2") : "";
}

const deals = async ({ bearer, session, qs = "" } = {}) => {
  const headers = {};
  if (bearer !== undefined) headers.authorization = `Bearer ${bearer}`;
  if (session) headers.cookie = `oi_session=${session}`;
  const res = await fetch(`${BASE}/api/v1/deals${qs}`, { redirect: "manual", headers });
  const text = await res.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch {
    // thân không phải JSON — các ca bên dưới tự báo
  }
  return { status: res.status, json };
};
const isDenied = (r) =>
  r.status === 401 && r.json !== null && JSON.stringify(Object.keys(r.json)) === '["error"]' && r.json.error === "unauthorized";

const token = opsToken();

// ---- khách + bearer (không cần DB) ----
let r = await deals();
check(isDenied(r), `khách: 401 {"error":"unauthorized"}, không khoá data/meta (${r.status} ${JSON.stringify(r.json)?.slice(0, 80)})`);
r = await deals({ qs: "?limit=5&min_discount=0" });
check(isDenied(r), `khách có query (?limit=5&min_discount=0): 401 (${r.status})`);
r = await deals({ bearer: `sai-${nonce}` });
check(isDenied(r), `bearer sai: 401 (${r.status})`);
if (!token) {
  check(false, "thiếu OPS_API_TOKEN (env hoặc app/.env.local) — ca bearer đúng không thử được");
} else {
  r = await deals({ bearer: token });
  const meta = r.json?.meta ?? {};
  check(
    r.status === 200 && Array.isArray(r.json?.data) && ["total", "minDiscount", "ruler"].every((k) => k in meta),
    `bearer đúng: 200, data là mảng, meta có total/minDiscount/ruler (${r.status}, ${Array.isArray(r.json?.data) ? r.json.data.length : "?"} dòng)`,
  );
}

// ---- phiên (cần DB local) ----
if (!CHI_DOC) {
  const pg = createRequire(path.join(root, "app/package.json"))("pg");
  const db = new pg.Client({ connectionString: DB });
  await db.connect();
  const ids = [`verify-dealsu-${nonce}`, `verify-dealso-${nonce}`];
  const tokens = [];
  const mkSession = async (userId, tag, live = true) => {
    const tok = `verify-deals-${nonce}-${tag}`;
    tokens.push(tok);
    await db.query(
      `INSERT INTO sessions (token, user_id, expires_at) VALUES ($1, $2, now() + ($3 || ' minutes')::interval)`,
      [tok, userId, live ? "10" : "-1"],
    );
    return tok;
  };
  try {
    for (const [id, role, tag] of [
      [ids[0], "user", "u"],
      [ids[1], "ops", "o"],
    ]) {
      await db.query(
        `INSERT INTO users (id, email, password_hash, plan, role) VALUES ($1, $2, 'verify-no-login', 'free', $3)`,
        [id, `${nonce}-deals-${tag}@smoke.verify.test`, role],
      );
    }
    r = await deals({ session: await mkSession(ids[0], "u") });
    check(isDenied(r), `phiên role=user: 401 (${r.status})`);
    r = await deals({ session: await mkSession(ids[1], "x", false) });
    check(isDenied(r), `phiên hết hạn: 401 (${r.status})`);
    r = await deals({ session: await mkSession(ids[1], "o") });
    check(r.status === 200 && Array.isArray(r.json?.data), `phiên role=ops: 200 (${r.status})`);
  } finally {
    await db.query(`DELETE FROM sessions WHERE token = ANY($1::text[])`, [tokens]);
    await db.query(`DELETE FROM users WHERE id = ANY($1::text[])`, [ids]);
    await db.end();
  }
}

console.log(fails.length === 0 ? "\ndeals-api-smoke: ĐẠT" : `\ndeals-api-smoke: ${fails.length} lỗi`);
process.exit(fails.length === 0 ? 0 : 1);
