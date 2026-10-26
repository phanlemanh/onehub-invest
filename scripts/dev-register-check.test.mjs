// node --test scripts/dev-register-check.test.mjs
// Phần thuần (bóc trường server action, kiểm phản hồi) chạy không cần app/DB; ca dọn rác chạy trong
// BEGIN…ROLLBACK trên Postgres local (:5433) — DB không lên → skip ca đó.
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import path from "node:path";
import { after, before, describe, test } from "node:test";

import { DEFAULT_DATABASE_URL, assertLocalDatabaseUrl } from "./dev-ops-account.mjs";
import {
  NEXT_CASES,
  SMOKE_EMAIL_PREFIX,
  checkDuplicateResponse,
  checkRegisterResponse,
  cleanupSmokeUsers,
  parseActionId,
  parseHiddenNext,
  smokeEmail,
} from "./dev-register-check.mjs";

test("parseActionId: form có server action → tên trường; form trần → null", () => {
  assert.equal(parseActionId('<form><input type="hidden" name="$ACTION_ID_7f3a09"/></form>'), "$ACTION_ID_7f3a09");
  assert.equal(parseActionId('<form><input name="email"/></form>'), null);
});

test("parseHiddenNext: đọc value của trường ẩn next; form không có next → null", () => {
  assert.equal(parseHiddenNext('<form><input type="hidden" name="next" value="/ops/review"/></form>'), "/ops/review");
  assert.equal(parseHiddenNext('<input name="email"/><input type="hidden" name="next" value="/"/>'), "/");
  assert.equal(parseHiddenNext('<form><input name="email"/></form>'), null);
});

test("NEXT_CASES có cả đối chứng dương (giữ đường trong site) lẫn đường ra ngoài bị đổi thành /", () => {
  assert.ok(NEXT_CASES.some((c) => c.want === c.raw), "phải có ca giữ nguyên next trong site");
  assert.ok(NEXT_CASES.filter((c) => c.want === "/" && c.raw !== "/").length >= 2, "phải có ca chặn đường ra ngoài");
  assert.deepEqual([...new Set(NEXT_CASES.map((c) => c.path))].sort(), ["/login", "/register"]);
});

describe("checkRegisterResponse", () => {
  const ok = { status: 303, location: "/saved", setCookie: `oi_session=${"a".repeat(64)}; Path=/; HttpOnly; SameSite=lax` };

  test("303 về đúng next + cookie HttpOnly → không lỗi", () => {
    assert.deepEqual(checkRegisterResponse(ok, "/saved"), []);
  });
  test("thiếu cookie → lỗi ghim", () => {
    assert.match(checkRegisterResponse({ ...ok, setCookie: null }, "/saved").join("\n"), /không trả cookie oi_session HttpOnly/);
  });
  test("cookie không HttpOnly → lỗi ghim", () => {
    const res = { ...ok, setCookie: `oi_session=${"a".repeat(64)}; Path=/` };
    assert.match(checkRegisterResponse(res, "/saved").join("\n"), /không trả cookie oi_session HttpOnly/);
  });
  test("trả 200 → lỗi ghim mã", () => {
    assert.match(checkRegisterResponse({ ...ok, status: 200 }, "/saved").join("\n"), /POST \/register trả 200, cần 303/);
  });
  test("chuyển về chỗ khác next → lỗi ghim", () => {
    const res = { ...ok, location: "/register?error=x" };
    assert.match(checkRegisterResponse(res, "/saved").join("\n"), /chuyển tới \/register\?error=x, cần \/saved/);
  });
});

describe("checkDuplicateResponse", () => {
  test("email trùng về /register?error= → không lỗi", () => {
    assert.deepEqual(checkDuplicateResponse({ status: 303, location: "/register?error=x&next=%2Fsaved" }), []);
  });
  test("email trùng mà vẫn vào trang đích → lỗi ghim", () => {
    assert.match(checkDuplicateResponse({ status: 303, location: "/saved" }).join("\n"), /email trùng không bị từ chối/);
  });
});

test("smokeEmail mang tiền tố dọn, mỗi lần một địa chỉ", () => {
  const a = smokeEmail();
  assert.match(a, /^register-smoke-[0-9a-f]{16}@local\.test$/);
  assert.ok(a.startsWith(SMOKE_EMAIL_PREFIX));
  assert.notEqual(a, smokeEmail());
});

describe("cleanupSmokeUsers (DB local, ROLLBACK)", () => {
  let client;
  let skip = false;

  before(async () => {
    const pg = createRequire(path.join(import.meta.dirname, "../app/package.json"))("pg");
    client = new pg.Client({ connectionString: process.env.DATABASE_URL ?? DEFAULT_DATABASE_URL });
    try {
      assertLocalDatabaseUrl(process.env.DATABASE_URL ?? DEFAULT_DATABASE_URL);
      await client.connect();
      await client.query("BEGIN");
    } catch {
      skip = true;
    }
  });

  after(async () => {
    if (!skip) {
      await client.query("ROLLBACK");
      await client.end();
    }
  });

  test("dọn rác sót: xoá mọi email tiền tố smoke, giữ tài khoản khác", async (t) => {
    if (skip) return t.skip("DB local :5433 không lên");
    const keep = "keep+unit@local.test";
    for (const [id, email] of [
      ["usr_unit_smoke_a", "register-smoke-aaaaaaaaaaaaaaaa@local.test"],
      ["usr_unit_smoke_b", "register-smoke-bbbbbbbbbbbbbbbb@local.test"],
      ["usr_unit_keep", keep],
    ]) {
      await client.query(`INSERT INTO users (id, email, password_hash) VALUES ($1, $2, 'x')`, [id, email]);
    }
    await client.query(
      `INSERT INTO sessions (token, user_id, expires_at) VALUES ($1, 'usr_unit_smoke_a', now() + interval '1 day')`,
      ["f".repeat(64)],
    );
    // Rác thật có thể đã nằm sẵn trong DB local; đếm trước để so đúng phần chèn.
    const { rows: before } = await client.query(`SELECT count(*)::int n FROM users WHERE email LIKE 'register-smoke-%@local.test'`);
    assert.equal(await cleanupSmokeUsers(client), before[0].n);
    const { rows } = await client.query(
      `SELECT (SELECT count(*)::int FROM users WHERE email LIKE 'register-smoke-%') smoke,
              (SELECT count(*)::int FROM users WHERE email = $1) kept,
              (SELECT count(*)::int FROM sessions WHERE user_id = 'usr_unit_smoke_a') sess`,
      [keep],
    );
    assert.deepEqual(rows[0], { smoke: 0, kept: 1, sess: 0 });
  });
});
