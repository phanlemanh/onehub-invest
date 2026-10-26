#!/usr/bin/env node
// dev-register-check.mjs [base_url] — kiểm đầu-cuối ĐĂNG KÝ trên app dev ĐANG CHẠY
// (mặc định http://ui1.localhost:3460): POST form server action thật của /register bằng một
// email dùng một lần, kiểm phiên oi_session + vai `user` (không vào được /ops), kiểm email trùng
// bị từ chối, rồi XOÁ tài khoản thử trong finally — kể cả khi một bước đỏ.
//
// Rào: chỉ chạy trên Postgres local (assertLocalDatabaseUrl của dev-ops-account.mjs, sai → exit 2).
// `users`/`sessions` là hồ sơ người dùng app (tầng A) — không lên cloud. Không in mật khẩu.
// Mọi email tiền tố `register-smoke-` là rác của smoke này: mỗi lượt dọn rác sót trước khi chạy.
import { randomBytes } from "node:crypto";
import { realpathSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { DEFAULT_DATABASE_URL, assertLocalDatabaseUrl, loadPg } from "./dev-ops-account.mjs";

export const SMOKE_EMAIL_PREFIX = "register-smoke-";
const SMOKE_EMAIL_LIKE = `${SMOKE_EMAIL_PREFIX}%@local.test`;
const NEXT = "/saved";

export function smokeEmail() {
  return `${SMOKE_EMAIL_PREFIX}${randomBytes(8).toString("hex")}@local.test`;
}

/** Tên trường ẩn `$ACTION_ID_<hex>` mà React gắn vào form có server action; không có → null. */
export function parseActionId(html) {
  return html.match(/name="(\$ACTION_ID_[0-9a-f]+)"/)?.[1] ?? null;
}

export function checkRegisterResponse({ status, location, setCookie }, next) {
  const errors = [];
  if (status !== 303) errors.push(`POST /register trả ${status}, cần 303`);
  if (location !== next) errors.push(`POST /register chuyển tới ${location}, cần ${next}`);
  if (!/^oi_session=[0-9a-f]{64};.*httponly/i.test(setCookie ?? "")) {
    errors.push("POST /register không trả cookie oi_session HttpOnly");
  }
  return errors;
}

export function checkDuplicateResponse({ status, location }) {
  const errors = [];
  if (status !== 303) errors.push(`POST /register lần hai trả ${status}, cần 303`);
  if (!(location ?? "").startsWith("/register?error=")) {
    errors.push(`email trùng không bị từ chối: chuyển tới ${location}, cần /register?error=…`);
  }
  return errors;
}

/** Xoá mọi tài khoản smoke (sessions/saved_markets/user_events/user_profile theo ON DELETE CASCADE). */
export async function cleanupSmokeUsers(client) {
  const { rowCount } = await client.query(`DELETE FROM users WHERE email LIKE $1`, [SMOKE_EMAIL_LIKE]);
  return rowCount ?? 0;
}

async function postRegister(base, aid, fields) {
  const form = new FormData();
  form.set(aid, "");
  for (const [k, v] of Object.entries(fields)) form.set(k, v);
  const res = await fetch(`${base}/register`, { method: "POST", body: form, redirect: "manual" });
  return {
    status: res.status,
    location: res.headers.get("location"),
    setCookie: res.headers.getSetCookie().find((c) => c.startsWith("oi_session=")) ?? null,
  };
}

async function main(base) {
  const url = assertLocalDatabaseUrl(process.env.DATABASE_URL ?? DEFAULT_DATABASE_URL);
  const pg = loadPg();
  const client = new pg.Client({ connectionString: url.toString() });
  await client.connect();
  const email = smokeEmail();
  let failed = null;
  try {
    const stale = await cleanupSmokeUsers(client);
    if (stale) console.log(`dọn trước: xoá ${stale} tài khoản thử sót từ lượt trước`);

    const page = await fetch(`${base}/register`).catch(() => null);
    if (!page?.ok) throw new Error(`không GET được ${base}/register — dev server chưa chạy?`);
    const aid = parseActionId(await page.text());
    if (!aid) throw new Error("không thấy trường $ACTION_ID_ trong form /register");

    const password = randomBytes(16).toString("hex");
    const first = await postRegister(base, aid, { email, password, next: NEXT });
    const errors = checkRegisterResponse(first, NEXT);
    if (errors.length) throw new Error(errors.join("; "));
    console.log(`POST /register: 303 về ${NEXT}, có cookie oi_session HttpOnly`);

    const { rows } = await client.query(
      `SELECT u.role, (SELECT count(*)::int FROM sessions s WHERE s.user_id = u.id) AS sessions
         FROM users u WHERE u.email = $1`,
      [email],
    );
    if (rows.length !== 1) throw new Error(`users có ${rows.length} dòng cho email thử, cần 1`);
    if (rows[0].role !== "user") throw new Error(`tài khoản tự đăng ký mang role ${rows[0].role}, cần user`);
    if (rows[0].sessions < 1) throw new Error("không có dòng sessions cho tài khoản vừa đăng ký");
    console.log("DB: 1 tài khoản role user, có phiên");

    const cookie = first.setCookie.split(";")[0];
    const ops = await fetch(`${base}/ops/sources`, { headers: { cookie }, redirect: "manual" });
    if (ops.status === 200) throw new Error("tài khoản tự đăng ký mở được /ops/sources (200)");
    console.log(`/ops/sources với phiên vừa đăng ký: ${ops.status}, không vào được Ops`);

    const again = await postRegister(base, aid, { email, password, next: NEXT });
    const dupErrors = checkDuplicateResponse(again);
    if (dupErrors.length) throw new Error(dupErrors.join("; "));
    console.log("POST /register lần hai cùng email: về /register?error=, không tạo phiên");
    console.log(`OK: đăng ký đầu-cuối qua form /register được ${base}`);
  } catch (err) {
    failed = err;
  } finally {
    try {
      await client.query(`DELETE FROM users WHERE email = $1`, [email]);
      const { rows } = await client.query(
        `SELECT (SELECT count(*)::int FROM users WHERE email LIKE $1) AS users,
                (SELECT count(*)::int FROM sessions s JOIN users u ON u.id = s.user_id WHERE u.email LIKE $1) AS sessions`,
        [SMOKE_EMAIL_LIKE],
      );
      if (rows[0].users || rows[0].sessions) throw new Error(`còn ${rows[0].users} tài khoản thử, ${rows[0].sessions} phiên`);
      console.log("dọn: đã xoá tài khoản thử");
    } catch (err) {
      failed ??= new Error(`dọn tài khoản thử lỗi: ${err.message}`);
    }
    await client.end();
  }
  if (failed) throw failed;
}

if (process.argv[1] && realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const base = (process.argv[2] ?? "http://ui1.localhost:3460").replace(/\/$/, "");
  main(base).catch((err) => {
    console.error(`FAIL: ${err.message}`);
    process.exit(/DATABASE_URL/.test(err.message) ? 2 : 1);
  });
}
