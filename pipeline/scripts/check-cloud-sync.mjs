// check-cloud-sync.mjs — thước của cloud-sync-atomic (_acceptance/cloud-sync-atomic).
// Chỉ chạm DB tạm trên :5433 (container one-invest-db, tiền tố acc_cloudsync_),
// tự xoá khi xong. KHÔNG gọi cloud.
//
//   node scripts/check-cloud-sync.mjs <ca>
//   stage     migration 038 — quyền anon/authenticated, catalog ngoài sync_stage không đổi
//   atomic    nhát tráo nguyên tử — luồng đọc không bao giờ thấy 0 / lẫn
//   fail      lượt gãy giữ dữ liệu cũ, staging được dọn
//   fidelity  cloud khớp local (md5, ngày), lệch schema vẫn chạy
//   keep      saved_markets giữ nguyên, chặn tụt
//   pii       payload không mang cột loại
//   overlap   hai lượt chồng nhau
//   allow     cột cho phép, chuẩn hoá seller_ref, soát tên nguồn
import { execFileSync, spawn } from "node:child_process";
import { copyFileSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import pg from "pg";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const PIPE = path.join(HERE, "..");
const ROOT = path.join(PIPE, "..");
const MIGRATION = path.join(ROOT, "db/migrations/038_sync_stage.sql");
const CT = "one-invest-db";
// Chuỗi kết nối DB local dùng chung (đúng dạng đã có trong sync-cloud.mjs); DB tạm thay tên cuối.
const LOCAL_URL = "postgres://oneinvest:oneinvest@localhost:5433/oneinvest";
const urlOf = (db) => LOCAL_URL.replace(/\/oneinvest$/, `/${db}`);
const PREFIX = "acc_cloudsync_";

let FAILED = false;
export const pass = (m) => console.log(`PASS ${m}`);
export const fail = (m) => {
  console.log(`FAIL ${m}`);
  FAILED = true;
};
const note = (m) => console.log(`note: ${m}`);

function psql(db, sql) {
  return execFileSync(
    "docker",
    ["exec", "-i", "-e", "PGPASSWORD=oneinvest", CT, "psql", "-U", "oneinvest", "-h", "localhost", "-d", db, "-X", "-q", "-At", "-v", "ON_ERROR_STOP=1"],
    { input: sql, encoding: "utf8", stdio: ["pipe", "pipe", "pipe"] },
  );
}

const created = new Set();
export function makeDb(name) {
  const full = PREFIX + name;
  psql("oneinvest", `DROP DATABASE IF EXISTS ${full};\nCREATE DATABASE ${full};`);
  created.add(full);
  return full;
}
export function dropDb(full) {
  psql("oneinvest", `DROP DATABASE IF EXISTS ${full} WITH (FORCE);`);
  created.delete(full);
}
export async function client(db, opts = {}) {
  const c = new pg.Client({ connectionString: urlOf(db), ...opts });
  await c.connect();
  return c;
}

// Bảng FILL đọc từ sync-cloud.mjs (import không chạy main — khối realpath).
const sync = await import(pathToFileURL(path.join(PIPE, "sync-cloud.mjs")).href);
const FILL = sync.FILL;

function dump(tables, { schemaOnly }) {
  const args = ["exec", "-e", "PGPASSWORD=oneinvest", CT, "pg_dump", "-U", "oneinvest", "-h", "localhost", "-d", "oneinvest", "--no-owner", "--no-acl"];
  if (schemaOnly) args.push("-s");
  for (const t of tables) args.push("-t", `public.${t}`);
  return execFileSync("docker", args, { encoding: "utf8", maxBuffer: 1 << 30 });
}

/** DB «local mô phỏng»: bảng FILL + source_registry chép nguyên từ local (được sửa thoải mái). */
export function buildLocalSim(name = "local") {
  const db = makeDb(name);
  psql(db, "CREATE EXTENSION IF NOT EXISTS postgis;");
  psql(db, dump([...FILL, "source_registry"], { schemaOnly: false }));
  return db;
}

/** DB «cloud mô phỏng»: schema FILL theo tên cloud (RENAME), không cột properties.seller_name,
 * thêm users/saved_markets (FK ON DELETE CASCADE như 002_auth), role anon/authenticated +
 * default ACL như Supabase (đo 23/10: pg_default_acl cấp arwdDxtm cho anon/authenticated),
 * hai view ruler, rồi áp migration 038 (trừ khi migrate=false). */
export function buildCloudSim(name = "cloud", { roles = true, defaultAcl = true, migrate = true, migration = MIGRATION } = {}) {
  const db = makeDb(name);
  psql(db, "CREATE EXTENSION IF NOT EXISTS postgis;");
  if (roles) {
    psql(db, `DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname='anon') THEN CREATE ROLE anon NOLOGIN; END IF;
      IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname='authenticated') THEN CREATE ROLE authenticated NOLOGIN; END IF;
    END $$;`);
    if (defaultAcl) {
      psql(db, `ALTER DEFAULT PRIVILEGES GRANT ALL ON TABLES TO anon, authenticated;
        ALTER DEFAULT PRIVILEGES GRANT ALL ON SCHEMAS TO anon, authenticated;
        GRANT USAGE ON SCHEMA public TO anon, authenticated;`);
    }
  }
  let ddl = dump(FILL, { schemaOnly: true });
  ddl = ddl.replace(/\bairdna_/g, "ref_calib_");
  psql(db, ddl);
  psql(db, `ALTER TABLE properties DROP COLUMN IF EXISTS seller_name;
    CREATE TABLE users (id bigserial PRIMARY KEY, email text);
    CREATE TABLE saved_markets (user_id bigint REFERENCES users(id) ON DELETE CASCADE,
      area_id text REFERENCES areas(id) ON DELETE CASCADE, PRIMARY KEY (user_id, area_id));`);
  const views = readFileSync(path.join(ROOT, "db/migrations/034_ruler_p2_views.sql"), "utf8");
  psql(db, views);
  if (migrate) psql(db, readFileSync(migration, "utf8"));
  return db;
}

async function cleanup() {
  for (const db of [...created]) {
    try {
      dropDb(db);
    } catch (e) {
      note(`không xoá được ${db}: ${e.message}`);
    }
  }
}

// ─── ca stage (AC-6 / E6) ────────────────────────────────────────────────
const CATALOG_SQL = `SELECT n.nspname || '.' || c.relname || ':' || c.relkind::text || ':' || coalesce(c.relacl::text, '')
  FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname NOT IN ('pg_catalog','information_schema','sync_stage','pg_toast')
  UNION ALL SELECT 'schema:' || nspname || ':' || coalesce(nspacl::text, '') FROM pg_namespace WHERE nspname <> 'sync_stage'
  ORDER BY 1`;

async function privs(db) {
  const c = await client(db);
  try {
    const { rows } = await c.query(`SELECT r.rolname,
        has_schema_privilege(r.rolname, 'sync_stage', 'USAGE') AS usage,
        has_table_privilege(r.rolname, 'sync_stage.rows', 'SELECT') AS sel_rows,
        has_table_privilege(r.rolname, 'sync_stage.swaps', 'SELECT') AS sel_swaps
      FROM pg_roles r WHERE r.rolname IN ('anon','authenticated') ORDER BY 1`);
    return rows;
  } finally {
    await c.end();
  }
}

async function caseStage() {
  // DB có role + default ACL như cloud
  const db = buildCloudSim("stage", { migrate: false });
  const before = psql(db, CATALOG_SQL);
  for (const i of [1, 2]) {
    try {
      psql(db, readFileSync(MIGRATION, "utf8"));
      pass(`migration 038 lần ${i} exit 0 (DB có anon/authenticated + default ACL)`);
    } catch (e) {
      fail(`migration 038 lần ${i} lỗi: ${e.stderr || e.message}`);
    }
  }
  const after = psql(db, CATALOG_SQL);
  if (before === after) pass("catalog ngoài sync_stage (quan hệ, schema, ACL) trước = sau");
  else fail("migration đổi catalog ngoài sync_stage");
  const p = await privs(db);
  if (p.length !== 2) fail(`thiếu role trong DB mô phỏng: ${JSON.stringify(p)}`);
  for (const r of p) {
    if (!r.usage && !r.sel_rows && !r.sel_swaps) pass(`${r.rolname} không USAGE sync_stage, không SELECT rows/swaps`);
    else fail(`${r.rolname} có quyền trên sync_stage: ${JSON.stringify(r)}`);
  }
  // đối chứng dương: role chủ ghi được
  const c = await client(db);
  try {
    await c.query(`INSERT INTO sync_stage.rows (run_id, tbl, payload) VALUES ('probe', 't', '{}')`);
    await c.query(`DELETE FROM sync_stage.rows WHERE run_id = 'probe'`);
    pass("đối chứng dương: role chủ ghi được sync_stage.rows");
  } catch (e) {
    fail(`role chủ không ghi được sync_stage.rows: ${e.message}`);
  } finally {
    await c.end();
  }
  dropDb(db);

  // DB không có role anon/authenticated (như local)
  const bare = makeDb("stage_bare");
  for (const i of [1, 2]) {
    try {
      psql(bare, readFileSync(MIGRATION, "utf8"));
      pass(`migration 038 lần ${i} exit 0 (DB không có anon/authenticated)`);
    } catch (e) {
      fail(`migration 038 lần ${i} lỗi trên DB không role: ${e.stderr || e.message}`);
    }
  }
  dropDb(bare);

  // chiều đỏ: bỏ mọi câu REVOKE → anon đọc được
  const dir = mkdtempSync(path.join(tmpdir(), "cloudsync-acl-"));
  try {
    const src = readFileSync(MIGRATION, "utf8");
    const mutated = src
      .split("\n")
      .filter((l) => !/\bREVOKE\b/i.test(l))
      .join("\n");
    if (mutated === src) {
      fail("không cấy được đột biến — migration không có câu REVOKE nào");
    } else {
      const mp = path.join(dir, "038_mut.sql");
      writeFileSync(mp, mutated);
      const red = buildCloudSim("stage_red", { migration: mp });
      const rp = await privs(red);
      if (rp.some((r) => r.sel_rows)) pass("ĐỎ-ĐÚNG acl: bỏ REVOKE thì anon/authenticated SELECT được sync_stage.rows");
      else fail("thước không bắt được migration thiếu REVOKE (anon vẫn không đọc được dù đã bỏ REVOKE)");
      dropDb(red);
    }
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

const CASES = { stage: caseStage };

const which = process.argv[2];
if (!CASES[which]) {
  console.log(`usage: node scripts/check-cloud-sync.mjs <${Object.keys(CASES).join("|")}>`);
  process.exit(2);
}
try {
  await CASES[which]();
} catch (e) {
  fail(`ca ${which} ném lỗi: ${e.stack || e.message}`);
} finally {
  await cleanup();
}
console.log(`check-cloud-sync ${which}: ${FAILED ? "CÓ LỖI" : "OK"}`);
process.exit(FAILED ? 1 : 0);
