#!/usr/bin/env node
// dev-ops-account.mjs — tài khoản ops THỬ, CHỈ trên Postgres local (:5433), để máy
// (Claude, tác tử chấm S4 của acceptance-gate) tự đăng nhập app dev và chụp /ops/**.
//
//   node scripts/dev-ops-account.mjs            # đảm bảo có tài khoản; mật khẩu trong tệp còn đúng → giữ nguyên
//   node scripts/dev-ops-account.mjs --rotate   # ép xoay mật khẩu mới (xoá luôn session cũ)
//
// Thông tin đăng nhập ghi vào .claude/ops-test-account.json (gitignored, chmod 600) của
// checkout đang chạy — KHÔNG in mật khẩu ra stdout. DB :5433 dùng chung giữa các worktree:
// worktree khác xoay thì tệp ở đây hết đúng, lần chạy sau tự xoay lại.
//
// Rào: chỉ chạy khi DATABASE_URL trỏ localhost/127.0.0.1/::1 (không thì từ chối, exit 2), và DB
// phải có bảng users/sessions đúng dạng 002_auth (chặn nhầm sang Postgres khác trên máy).
// `users` không nằm trong FILL của pipeline/sync-cloud.mjs → tài khoản này không lên cloud.
import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { execFileSync } from "node:child_process";
import { chmodSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

export const DEFAULT_EMAIL = "ops-test@local.test";
export const DEFAULT_DATABASE_URL = "postgres://oneinvest:oneinvest@localhost:5433/oneinvest";
const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "[::1]", "::1"]);
const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export const CRED_FILE = path.join(REPO, ".claude/ops-test-account.json");

/** Ném lỗi khi connection string không trỏ máy local. Trả URL đã kiểm. */
export function assertLocalDatabaseUrl(raw) {
  let url;
  try {
    url = new URL(raw);
  } catch {
    throw new Error(`DATABASE_URL không đọc được — chỉ nhận postgres trên localhost:5433`);
  }
  if (!/^postgres(ql)?:$/.test(url.protocol)) {
    throw new Error(`DATABASE_URL phải là postgres:// (nhận: ${url.protocol})`);
  }
  // pg cho tham số ?host=/?hostaddr= ghi đè host trong URL — không chấp.
  const override = ["host", "hostaddr"].find((k) => url.searchParams.has(k));
  if (override) throw new Error(`DATABASE_URL có ?${override}= ghi đè host — từ chối (chỉ chạy trên DB local)`);
  if (!LOCAL_HOSTS.has(url.hostname)) {
    throw new Error(
      `DATABASE_URL trỏ "${url.hostname}" — script chỉ chạy trên Postgres local (localhost/127.0.0.1). ` +
        `Tài khoản thử KHÔNG được tạo trên DB cloud/production.`,
    );
  }
  return url;
}

// Cùng định dạng hashPassword/verifyPassword ở app/src/lib/auth.ts: '<salt-hex>$<key-hex>'.
export function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  return `${salt}$${scryptSync(password, salt, 64).toString("hex")}`;
}

export function verifyPassword(password, stored) {
  const [salt, key] = String(stored ?? "").split("$");
  if (!salt || !key) return false;
  const expected = Buffer.from(key, "hex");
  const actual = scryptSync(password, salt, 64);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

/** Kiểm DB đúng là schema onehub (users + sessions của 002_auth, role của 012). */
async function assertAuthSchema(client) {
  const { rows } = await client.query(
    `SELECT table_name, column_name FROM information_schema.columns
     WHERE table_schema = 'public' AND table_name IN ('users', 'sessions')`,
  );
  const have = new Set(rows.map((r) => `${r.table_name}.${r.column_name}`));
  const need = ["users.id", "users.email", "users.password_hash", "users.role", "sessions.user_id"];
  const missing = need.filter((c) => !have.has(c));
  if (missing.length) {
    throw new Error(`DB không có schema auth của onehub (thiếu ${missing.join(", ")}) — sai DB? cổng :5433 là one-invest-db`);
  }
}

/**
 * Tạo/xoay tài khoản. `currentPassword` = mật khẩu đang lưu ở tệp (nếu có): còn verify được
 * với hash trong DB và không ép `rotate` → giữ nguyên. Trả { action, email, userId, password }.
 */
export async function ensureAccount(client, { email = DEFAULT_EMAIL, currentPassword, rotate = false, role = "admin" } = {}) {
  await assertAuthSchema(client);
  const { rows } = await client.query(`SELECT id, password_hash, role FROM users WHERE email = $1`, [email]);
  const existing = rows[0];
  if (existing && !rotate && currentPassword && verifyPassword(currentPassword, existing.password_hash)) {
    if (existing.role !== role) await client.query(`UPDATE users SET role = $2 WHERE id = $1`, [existing.id, role]);
    return { action: "unchanged", email, userId: existing.id, password: currentPassword };
  }
  const password = randomBytes(18).toString("base64url");
  if (existing) {
    await client.query(`UPDATE users SET password_hash = $2, role = $3 WHERE id = $1`, [
      existing.id,
      hashPassword(password),
      role,
    ]);
    // Xoay = cookie cũ hết hiệu lực.
    await client.query(`DELETE FROM sessions WHERE user_id = $1`, [existing.id]);
    return { action: "rotated", email, userId: existing.id, password };
  }
  const userId = `usr_${randomBytes(8).toString("hex")}`;
  await client.query(`INSERT INTO users (id, email, password_hash, role) VALUES ($1, $2, $3, $4)`, [
    userId,
    email,
    hashPassword(password),
    role,
  ]);
  return { action: "created", email, userId, password };
}

/** true khi git bỏ qua tệp này (không bao giờ lỡ commit mật khẩu). */
export function isGitIgnored(file) {
  try {
    execFileSync("git", ["check-ignore", "-q", file], { cwd: path.dirname(file), stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

function readCredFile(file) {
  try {
    return JSON.parse(readFileSync(file, "utf8"));
  } catch {
    return null;
  }
}

function writeCredFile(file, data) {
  mkdirSync(path.dirname(file), { recursive: true });
  writeFileSync(file, JSON.stringify(data, null, 2) + "\n", { mode: 0o600 });
  chmodSync(file, 0o600);
}

// Root repo không có node_modules — mượn pg từ app/; worktree mới chưa cài thì mượn app/ của checkout chính.
function loadPg() {
  const candidates = [path.join(REPO, "app/package.json")];
  try {
    const common = execFileSync("git", ["rev-parse", "--path-format=absolute", "--git-common-dir"], {
      cwd: REPO,
      encoding: "utf8",
    }).trim();
    candidates.push(path.join(path.dirname(common), "app/package.json"));
  } catch {
    /* không phải git checkout — chỉ thử app/ cạnh script */
  }
  for (const pkg of candidates) {
    try {
      return createRequire(pkg)("pg");
    } catch {
      /* thử ứng viên kế */
    }
  }
  throw new Error("không tìm thấy module pg — chạy `cd app && npm install` trước");
}

async function main() {
  const rotate = process.argv.includes("--rotate");
  const url = assertLocalDatabaseUrl(process.env.DATABASE_URL ?? DEFAULT_DATABASE_URL);
  if (!isGitIgnored(CRED_FILE)) {
    throw new Error(`${path.relative(REPO, CRED_FILE)} chưa bị .gitignore — từ chối ghi mật khẩu vào đó`);
  }
  const saved = readCredFile(CRED_FILE);
  const pg = loadPg();
  const client = new pg.Client({ connectionString: url.toString() });
  await client.connect();
  let result;
  try {
    await client.query("BEGIN");
    result = await ensureAccount(client, {
      currentPassword: saved?.email === DEFAULT_EMAIL ? saved.password : undefined,
      rotate,
    });
    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK").catch(() => {});
    throw err;
  } finally {
    await client.end();
  }
  if (result.action !== "unchanged" || !saved) {
    writeCredFile(CRED_FILE, {
      email: result.email,
      password: result.password,
      role: "admin",
      database: `${url.hostname}:${url.port || 5432}${url.pathname}`,
      loginUrl: "http://localhost:3456/login",
      updatedAt: new Date().toISOString(),
    });
  }
  console.log(`tài khoản ops thử: ${result.email} — ${result.action}`);
  console.log(`thông tin đăng nhập: ${path.relative(process.cwd(), CRED_FILE) || CRED_FILE} (gitignored, không in mật khẩu)`);
  console.log(`role admin → vào được mọi trang /ops (cổng Ops mở cho role admin/ops, không cần OPS_EMAILS).`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((err) => {
    console.error(`dev-ops-account: ${err.message}`);
    process.exit(2);
  });
}
