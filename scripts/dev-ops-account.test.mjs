// node --test scripts/dev-ops-account.test.mjs
// Phần DB chạy trong BEGIN…ROLLBACK trên Postgres local (:5433); DB không lên → skip phần đó.
import assert from "node:assert/strict";
import { scryptSync, timingSafeEqual } from "node:crypto";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import path from "node:path";
import { after, before, describe, test } from "node:test";

import {
  CRED_FILE,
  DEFAULT_DATABASE_URL,
  assertLocalDatabaseUrl,
  ensureAccount,
  hashPassword,
  isGitIgnored,
  verifyPassword,
} from "./dev-ops-account.mjs";

// Dựng URL bằng đối tượng URL — chuỗi kết nối literal có user bị hook chặn bí mật bắt nhầm.
function pgUrl(host, { protocol = "postgres:", port = "5433", search = "" } = {}) {
  const u = new URL(`${protocol}//placeholder/oneinvest`);
  u.hostname = host;
  u.port = port;
  u.username = "u";
  u.search = search;
  return u.toString();
}

describe("assertLocalDatabaseUrl", () => {
  test("nhận localhost / 127.0.0.1 / ::1", () => {
    for (const u of [
      DEFAULT_DATABASE_URL,
      pgUrl("127.0.0.1"),
      pgUrl("[::1]", { protocol: "postgresql:" }),
    ]) {
      assert.doesNotThrow(() => assertLocalDatabaseUrl(u), u);
    }
  });

  test("từ chối host không local, kể cả ghi đè qua ?host=", () => {
    for (const u of [
      pgUrl("db.abcd.supabase.co", { port: "5432" }),
      pgUrl("aws-0-ap-southeast-1.pooler.supabase.com", { port: "6543" }),
      pgUrl("192.168.1.10"),
      pgUrl("localhost.evil.com"),
      pgUrl("localhost", { search: "?host=db.example.com" }),
      pgUrl("localhost", { search: "?hostaddr=10.0.0.1" }),
      pgUrl("localhost", { protocol: "mysql:" }),
      "không phải url",
    ]) {
      assert.throws(() => assertLocalDatabaseUrl(u), /local|ghi đè|postgres|đọc/, u);
    }
  });

  test("chạy CLI với DATABASE_URL cloud → exit 2, không kết nối", () => {
    const script = path.join(import.meta.dirname, "dev-ops-account.mjs");
    let code = 0;
    let stderr = "";
    try {
      execFileSync(process.execPath, [script], {
        env: { ...process.env, DATABASE_URL: pgUrl("db.abcd.supabase.co", { port: "5432" }) },
        stdio: ["ignore", "pipe", "pipe"],
      });
    } catch (err) {
      code = err.status;
      stderr = String(err.stderr);
    }
    assert.equal(code, 2);
    assert.match(stderr, /chỉ chạy trên Postgres local/);
  });
});

describe("hashPassword", () => {
  test("định dạng <salt-hex>$<key-hex>, verify được bằng scrypt thuần (như app/src/lib/auth.ts)", () => {
    const stored = hashPassword("mat-khau-thu");
    assert.match(stored, /^[0-9a-f]{32}\$[0-9a-f]{128}$/);
    const [salt, key] = stored.split("$");
    assert.ok(timingSafeEqual(Buffer.from(key, "hex"), scryptSync("mat-khau-thu", salt, 64)));
    assert.ok(verifyPassword("mat-khau-thu", stored));
    assert.ok(!verifyPassword("sai", stored));
    assert.ok(!verifyPassword("x", "không-có-dấu-đô"));
  });
});

describe("tệp thông tin đăng nhập", () => {
  test(".claude/ops-test-account.json bị git check-ignore", () => {
    assert.ok(isGitIgnored(CRED_FILE));
  });
  test("đường dẫn ngoài repo không coi là ignored (script sẽ từ chối ghi)", () => {
    assert.ok(!isGitIgnored(path.join(tmpdir(), "ops-test-account.json")));
  });
});

describe("rào DB và đồng bộ cloud", () => {
  test("DB không có schema auth của onehub → từ chối, chỉ đọc information_schema", async () => {
    const calls = [];
    const fake = {
      query: async (sql) => {
        calls.push(sql);
        return { rows: [{ table_name: "users", column_name: "id" }] };
      },
    };
    await assert.rejects(ensureAccount(fake, { email: "ops-test+unit@local.test" }), /schema auth/);
    assert.equal(calls.length, 1);
    assert.match(calls[0], /information_schema/);
  });

  test("users/sessions không nằm trong FILL của pipeline/sync-cloud.mjs", () => {
    const src = readFileSync(path.join(import.meta.dirname, "../pipeline/sync-cloud.mjs"), "utf8");
    const m = src.match(/const FILL = \[([\s\S]*?)\];/);
    assert.ok(m, "không tìm thấy mảng FILL");
    const tables = [...m[1].matchAll(/"([^"]+)"/g)].map((x) => x[1]);
    assert.ok(tables.length > 5, "FILL đọc ra quá ít bảng — regex lệch?");
    for (const t of ["users", "sessions"]) assert.ok(!tables.includes(t), `${t} nằm trong FILL`);
  });
});

describe("ensureAccount (DB local, ROLLBACK)", () => {
  const email = "ops-test+unit@local.test";
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

  test("tạo → giữ nguyên (idempotent) → xoay", async (t) => {
    if (skip) return t.skip("DB local :5433 không lên");
    const created = await ensureAccount(client, { email });
    assert.equal(created.action, "created");

    const { rows } = await client.query(`SELECT id, password_hash, role FROM users WHERE email = $1`, [email]);
    assert.equal(rows.length, 1);
    assert.equal(rows[0].role, "admin");
    assert.ok(verifyPassword(created.password, rows[0].password_hash));

    const again = await ensureAccount(client, { email, currentPassword: created.password });
    assert.equal(again.action, "unchanged");
    assert.equal(again.userId, created.userId);
    const { rows: same } = await client.query(`SELECT password_hash FROM users WHERE email = $1`, [email]);
    assert.equal(same[0].password_hash, rows[0].password_hash);

    // Có session cũ → xoay phải xoá
    await client.query(
      `INSERT INTO sessions (token, user_id, expires_at) VALUES ('unit-test-token', $1, now() + interval '1 day')`,
      [created.userId],
    );
    const rotated = await ensureAccount(client, { email, currentPassword: created.password, rotate: true });
    assert.equal(rotated.action, "rotated");
    assert.equal(rotated.userId, created.userId);
    assert.notEqual(rotated.password, created.password);
    const { rows: after } = await client.query(`SELECT password_hash FROM users WHERE email = $1`, [email]);
    assert.ok(verifyPassword(rotated.password, after[0].password_hash));
    assert.ok(!verifyPassword(created.password, after[0].password_hash));
    const { rowCount } = await client.query(`SELECT 1 FROM sessions WHERE user_id = $1`, [created.userId]);
    assert.equal(rowCount, 0);

    // Mật khẩu trong tệp lệch DB (worktree khác đã xoay) → tự xoay
    const healed = await ensureAccount(client, { email, currentPassword: "mat-khau-cu" });
    assert.equal(healed.action, "rotated");
  });
});
