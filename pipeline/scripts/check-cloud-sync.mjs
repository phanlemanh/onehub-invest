// check-cloud-sync.mjs — thước của cloud-sync-atomic (_acceptance/cloud-sync-atomic).
// Mỗi lượt chạy dựng MỘT container Postgres tạm riêng (cùng image với one-invest-db, cổng ngẫu
// nhiên trên 127.0.0.1) và xoá nó khi xong — role anon/authenticated (đối tượng cấp cluster)
// không lọt sang DB local dùng chung. Từ one-invest-db chỉ ĐỌC (pg_dump). KHÔNG gọi cloud.
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
const CT_SRC = "one-invest-db"; // nguồn dữ liệu — chỉ đọc
const IMAGE = "kartoza/postgis:17-3.5";
let CT = null; // container tạm của lượt này
let PORT = null;
// Chuỗi kết nối DB local dùng chung (đúng dạng đã có trong sync-cloud.mjs); DB tạm thay tên cuối.
const LOCAL_URL = "postgres://oneinvest:oneinvest@localhost:5433/oneinvest";
const urlOf = (db) => LOCAL_URL.replace(/:5433\/oneinvest$/, `:${PORT}/${db}`);

function startTemp(tag) {
  const name = `acc-cloudsync-${tag}-${process.pid}`;
  execFileSync("docker", ["run", "-d", "--rm", "--name", name, "-e", "POSTGRES_USER=oneinvest", "-e", "POSTGRES_PASS=oneinvest",
    "-e", "POSTGRES_DB=oneinvest", "-e", "ALLOW_IP_RANGE=0.0.0.0/0", "-p", "127.0.0.1::5432", IMAGE], { stdio: "pipe" });
  CT = name;
  PORT = execFileSync("docker", ["port", name, "5432/tcp"], { encoding: "utf8" }).trim().split("\n")[0].split(":").pop();
  // image kartoza khởi động postgres, dừng, rồi khởi động lại khi dựng xong — đòi 5 lần
  // liên tiếp (cách nhau 1s) mới coi là sẵn sàng.
  let ok = 0;
  for (let i = 0; i < 240; i++) {
    try {
      psql("oneinvest", "SELECT 1;");
      if (++ok >= 5) return;
    } catch {
      ok = 0;
    }
    execFileSync("sleep", ["1"]);
  }
  throw new Error(`container tạm ${name} không sẵn sàng sau 180s`);
}
function stopTemp() {
  if (!CT) return;
  try {
    execFileSync("docker", ["rm", "-f", CT], { stdio: "pipe" });
  } catch (e) {
    console.log(`note: không xoá được container ${CT}: ${e.message}`);
  }
  CT = null;
}
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
  const args = ["exec", "-e", "PGPASSWORD=oneinvest", CT_SRC, "pg_dump", "-U", "oneinvest", "-h", "localhost", "-d", "oneinvest", "--no-owner", "--no-acl"];
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
  // chỉ đổi TÊN BẢNG như cloud thật (cột airdna_id… giữ nguyên tên, đo 23/10)
  ddl = ddl.replace(/\bairdna_(markets|scores|market_metrics|sub_monthly|future_daily|listings|submarket_metrics)\b/g, "ref_calib_$1");
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
  created.clear();
  stopTemp();
}
for (const sig of ["SIGINT", "SIGTERM"]) process.on(sig, () => (stopTemp(), process.exit(130)));

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
  // DB KHÔNG có role anon/authenticated — chạy TRƯỚC mọi bước tạo role trong container tạm
  const bare = makeDb("stage_bare");
  const pre = psql(bare, "SELECT count(*) FROM pg_roles WHERE rolname IN ('anon','authenticated');").trim();
  if (pre === "0") pass("tiền điều kiện: container tạm chưa có role anon/authenticated");
  else fail(`tiền điều kiện sai: đã có ${pre} role anon/authenticated trước ca «không role»`);
  for (const i of [1, 2]) {
    try {
      psql(bare, readFileSync(MIGRATION, "utf8"));
      pass(`migration 038 lần ${i} exit 0 (DB không có anon/authenticated)`);
    } catch (e) {
      fail(`migration 038 lần ${i} lỗi trên DB không role: ${e.stderr || e.message}`);
    }
  }
  dropDb(bare);

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
  // đối chứng của phép so catalog: một thay đổi ngoài sync_stage phải bị thấy
  psql(db, "CREATE TABLE public.zz_catalog_probe (x int);");
  const probe = psql(db, CATALOG_SQL);
  psql(db, "DROP TABLE public.zz_catalog_probe;");
  if (probe !== after) pass("đối chứng: một bảng mới ngoài sync_stage làm catalog khác — phép so có răng");
  else fail("phép so catalog không thấy một bảng mới ngoài sync_stage");
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

// ─── hạ tầng chung cho các ca sync ───────────────────────────────────────
const CLOUD = FILL.map(sync.RENAME);
const VIEWS = ["v_ruler_p2", "v_ruler_p2_area"];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const isDdl = (sql) => /^\s*(CREATE|ALTER|DROP|TRUNCATE)\b/im.test(sql);

/** exec giống Management API: MỘT kết nối mỗi lời gọi (lỗi giữa giao dịch → đóng kết nối =
 * rollback), trả dòng của câu cuối có dòng. `hook(sql)` chạy trước mỗi lời gọi (ném = lỗi). */
export function cloudExec(db, { log, hook } = {}) {
  return async (sql) => {
    log?.push(sql);
    if (hook) await hook(sql);
    const c = await client(db);
    try {
      const res = await c.query(sql);
      const list = Array.isArray(res) ? res : [res];
      const last = [...list].reverse().find((r) => r.rows?.length) ?? list[list.length - 1];
      return last?.rows ?? [];
    } finally {
      await c.end().catch(() => {});
    }
  };
}

async function runSync(localDb, cloudDb, opts = {}) {
  const local = await client(localDb, { types: opts.rawTypes ? undefined : sync.localTypes });
  try {
    return await sync.syncOnce({ local, exec: opts.exec ?? cloudExec(cloudDb), log: opts.log ?? (() => {}), ...opts.sync });
  } finally {
    await local.end();
  }
}

async function md5Map(db) {
  const c = await client(db);
  try {
    const out = {};
    for (const t of [...CLOUD, "saved_markets"]) {
      const { rows } = await c.query(
        `SELECT count(*)::int AS n, md5(coalesce(string_agg(x::text, '|' ORDER BY x::text), '')) AS h FROM ${t} x`,
      );
      out[t] = `${rows[0].n}:${rows[0].h}`;
    }
    return out;
  } finally {
    await c.end();
  }
}
const sameMap = (a, b) => Object.keys(a).every((k) => a[k] === b[k]);

async function stagingCount(db, runId) {
  const c = await client(db);
  try {
    const { rows } = await c.query(
      runId ? "SELECT count(*)::int AS n FROM sync_stage.rows WHERE run_id = $1" : "SELECT count(*)::int AS n FROM sync_stage.rows",
      runId ? [runId] : [],
    );
    return rows[0].n;
  } finally {
    await c.end();
  }
}

async function countsOf(db) {
  const c = await client(db);
  try {
    const sql = [...CLOUD, ...VIEWS].map((t) => `SELECT '${t}' AS t, count(*)::int AS n FROM ${t}`).join(" UNION ALL ");
    const { rows } = await c.query(sql);
    return Object.fromEntries(rows.map((r) => [r.t, r.n]));
  } finally {
    await c.end();
  }
}

/** Luồng đọc: mỗi `everyMs` một snapshot REPEATABLE READ đếm mọi bảng + view; gắn pha
 * «tráo-mở» khi có phiên đang giữ khoá advisory của lượt tráo. */
function startReader(db, everyMs = 50) {
  const reads = [];
  let stop = false;
  const done = (async () => {
    const c = await client(db);
    const sql = [...CLOUD, ...VIEWS].map((t) => `SELECT '${t}' AS t, count(*)::int AS n FROM ${t}`).join(" UNION ALL ");
    try {
      while (!stop) {
        await c.query("BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY");
        const { rows: lk } = await c.query(
          `SELECT EXISTS (SELECT 1 FROM pg_locks WHERE locktype = 'advisory' AND objid = ${sync.ADVISORY_KEY} AND granted
            AND database = (SELECT oid FROM pg_database WHERE datname = current_database())) AS open`,
        );
        const { rows } = await c.query(sql);
        await c.query("COMMIT");
        reads.push({ open: lk[0].open, counts: Object.fromEntries(rows.map((r) => [r.t, r.n])) });
        await sleep(everyMs);
      }
    } finally {
      await c.end();
    }
  })();
  return { reads, stop: async () => ((stop = true), await done) };
}

/** Xếp một lần đọc: old / new / zero / mixed so với hai trạng thái đã biết. */
function classify(read, oldC, newC) {
  let o = 0;
  let n = 0;
  for (const t of Object.keys(oldC)) {
    const v = read.counts[t];
    if (v === 0 && (oldC[t] > 0 || newC[t] > 0)) return "zero";
    if (oldC[t] === newC[t]) continue;
    if (v === oldC[t]) o++;
    else if (v === newC[t]) n++;
    else return "mixed";
  }
  if (o && n) return "mixed";
  return n ? "new" : "old";
}

/** Tách SQL tráo thành câu cấp cao nhất (câu bắt đầu ở cột 0; thân DO thụt lề). */
const splitSwap = (sql) =>
  sql.split(/;\n(?=(?:BEGIN|SET|SELECT|DO|DELETE|INSERT|COMMIT)\b)/).map((s) => (s.endsWith(";") ? s : `${s};`));

/** exec giả lập bộ nạp KIỂU CŨ: gặp SQL tráo thì TRUNCATE … CASCADE rồi INSERT từng bảng
 * có nghỉ (đúng hình dạng cửa sổ trống của sync-cloud cũ). */
function legacyExec(db) {
  const base = cloudExec(db);
  return async (sql, opts) => {
    if (!sql.startsWith("BEGIN;")) return base(sql, opts);
    await base(`TRUNCATE ${CLOUD.join(", ")} RESTART IDENTITY CASCADE`);
    for (const st of splitSwap(sql)) {
      if (!st.startsWith("INSERT INTO public.")) continue;
      await base(st);
      await base("SELECT pg_sleep(0.3)");
    }
    return [];
  };
}

/** exec giả lập tráo KHÔNG nguyên tử: chính các câu của SQL tráo, mỗi câu tự COMMIT. */
function splitExec(db) {
  const base = cloudExec(db);
  return async (sql, opts) => {
    if (!sql.startsWith("BEGIN;")) return base(sql, opts);
    for (const st of splitSwap(sql)) {
      if (st === "BEGIN;" || st === "COMMIT;" || st.startsWith("SET LOCAL") || st.startsWith("SELECT pg_advisory")) continue;
      await base(st);
    }
    return [];
  };
}

async function q1(db, sql, params) {
  const c = await client(db);
  try {
    return (await c.query(sql, params)).rows;
  } finally {
    await c.end();
  }
}

/** Làm lượt cũ khác lượt mới ở mọi bảng có ≥2 dòng: xoá một dòng mỗi bảng trên cloud
 * (bỏ qua FK bằng session_replication_role — trạng thái cũ chỉ để so số). */
async function makeOldDiffer(cloudDb) {
  const c = await client(cloudDb);
  try {
    await c.query("SET session_replication_role = replica");
    for (const t of CLOUD) {
      await c.query(`DELETE FROM ${t} WHERE ctid = (SELECT ctid FROM ${t} LIMIT 1) AND (SELECT count(*) FROM ${t}) >= 2`);
    }
    // view ruler đổi theo: bỏ ~30% property_offers
    await c.query("DELETE FROM property_offers WHERE ctid IN (SELECT ctid FROM property_offers TABLESAMPLE BERNOULLI (30))");
  } finally {
    await c.end();
  }
}

// ─── ca atomic (AC-1 / E1) ───────────────────────────────────────────────
async function phaseTable(reads, oldC, newC) {
  const tbl = {};
  for (const r of reads) {
    const k = `${r.open ? "tráo-mở" : "ngoài"}×${classify(r, oldC, newC)}`;
    tbl[k] = (tbl[k] ?? 0) + 1;
  }
  return tbl;
}

async function caseAtomic() {
  const L = buildLocalSim("atomic_local");
  const C = buildCloudSim("atomic_cloud");
  await runSync(L, C);
  const newC = await countsOf(C);
  await makeOldDiffer(C);
  const oldC = await countsOf(C);
  const differ = [...CLOUD, ...VIEWS].filter((t) => oldC[t] !== newC[t]);
  const same = [...CLOUD, ...VIEWS].filter((t) => oldC[t] === newC[t] && newC[t] >= 2);
  if (!same.length) pass(`fixture: số dòng cũ ≠ mới ở ${differ.length} bảng/view (mọi bảng ≥2 dòng + 2 view)`);
  else fail(`fixture: cũ = mới ở ${same.join(", ")} — thước không phân biệt được ở các bảng này`);
  const rd = startReader(C);
  await runSync(L, C, { sync: { swapPause: 2 } });
  await sleep(300);
  await rd.stop();
  const tbl = await phaseTable(rd.reads, oldC, newC);
  console.log(`  bảng đọc (pha × trạng thái): ${JSON.stringify(tbl)}`);
  const openOld = tbl["tráo-mở×old"] ?? 0;
  const bad = rd.reads.filter((r) => ["zero", "mixed"].includes(classify(r, oldC, newC))).length;
  const openNew = tbl["tráo-mở×new"] ?? 0;
  if (rd.reads.length >= 20) pass(`luồng đọc ${rd.reads.length} lần`);
  else fail(`luồng đọc chỉ ${rd.reads.length} lần (< 20)`);
  if (openOld >= 5 && openNew === 0) pass(`${openOld} lần đọc trong lúc giao dịch tráo mở — tất cả thấy bản cũ`);
  else fail(`đọc trong lúc tráo mở: cũ ${openOld}, mới ${openNew} (cần ≥5 cũ, 0 mới)`);
  if (bad === 0) pass("0 lần thấy 0, 0 lần lẫn cũ/mới");
  else fail(`${bad} lần đọc thấy 0 hoặc lẫn`);
  if ((tbl["ngoài×new"] ?? 0) > 0) pass("sau COMMIT luồng đọc thấy bản mới");
  else fail("luồng đọc không bao giờ thấy bản mới");

  // chiều đỏ (i): bộ nạp kiểu cũ trên cùng fixture
  await makeOldDiffer(C);
  const oldC2 = await countsOf(C);
  const r1 = startReader(C);
  await runSync(L, C, { exec: legacyExec(C) });
  await r1.stop();
  const z1 = r1.reads.filter((r) => ["zero", "mixed"].includes(classify(r, oldC2, newC))).length;
  if (z1 > 0) pass(`ĐỎ-ĐÚNG truncate: bộ nạp kiểu cũ — luồng đọc thấy 0/lẫn ${z1} lần`);
  else fail("thước không bắt được bộ nạp TRUNCATE kiểu cũ");

  // chiều đỏ (ii): chính SQL tráo, gửi từng câu tự COMMIT, cùng móc thử
  await makeOldDiffer(C);
  const oldC3 = await countsOf(C);
  const r2 = startReader(C);
  await runSync(L, C, { exec: splitExec(C), sync: { swapPause: 2 } });
  await r2.stop();
  const z2 = r2.reads.filter((r) => ["zero", "mixed"].includes(classify(r, oldC3, newC))).length;
  if (z2 > 0) pass(`ĐỎ-ĐÚNG non-atomic: tráo từng câu tự COMMIT — luồng đọc thấy 0/lẫn ${z2} lần`);
  else fail("thước không bắt được tráo không nguyên tử");
}

// ─── ca fail (AC-2 / E2) ─────────────────────────────────────────────────
async function expectFail(promise, phase) {
  try {
    await promise;
    return { ok: false, msg: "lượt KHÔNG gãy" };
  } catch (e) {
    return { ok: e.phase === phase, msg: `[${e.phase}] ${e.message}` };
  }
}

async function caseFail() {
  const L = buildLocalSim("fail_local");
  const C = buildCloudSim("fail_cloud");
  await runSync(L, C);
  // local đổi sau lượt seed → lượt lành cuối phải đổi md5 (thước không hằng-đúng)
  await q1(L, "DELETE FROM nights WHERE ctid IN (SELECT ctid FROM nights LIMIT 50)");
  const base = await md5Map(C);

  // (a) gãy lúc nạp staging
  let n = 0;
  const ra = await expectFail(
    runSync(L, C, {
      exec: cloudExec(C, {
        hook: (sql) => {
          if (sql.startsWith("INSERT INTO sync_stage.rows") && ++n === 3) throw new Error("mạng đứt (cấy)");
        },
      }),
      sync: { runId: "failstage" },
    }),
    "stage",
  );
  const sa = await stagingCount(C, "failstage");
  if (ra.ok && sameMap(base, await md5Map(C)) && sa === 0) pass(`(a) gãy-staging: md5 không đổi, 0 dòng staging, ${ra.msg}`);
  else fail(`(a) gãy-staging: ${ra.msg}; staging ${sa}`);

  // (b) gãy trong tráo — cột NOT NULL không mặc định mà local không gửi
  await q1(C, "ALTER TABLE listings ADD COLUMN must_have int NOT NULL DEFAULT 0; ALTER TABLE listings ALTER COLUMN must_have DROP DEFAULT");
  const before = await md5Map(C);
  const rb = await expectFail(runSync(L, C, { sync: { runId: "failswap" } }), "swap");
  const sb = await stagingCount(C, "failswap");
  if (rb.ok && sameMap(before, await md5Map(C)) && sb === 0) pass(`(b) gãy-tráo: md5 không đổi, 0 dòng staging, ${rb.msg.slice(0, 120)}`);
  else fail(`(b) gãy-tráo: ${rb.msg}; staging ${sb}`);
  await q1(C, "ALTER TABLE listings DROP COLUMN must_have");

  // (c) cloud chưa có sync_stage
  await q1(C, "DROP SCHEMA sync_stage CASCADE");
  const sent = [];
  const before2 = await md5Map(C);
  const rc = await expectFail(runSync(L, C, { exec: cloudExec(C, { log: sent }) }), "catalog");
  const ddl = sent.filter(isDdl);
  if (rc.ok && sameMap(before2, await md5Map(C)) && ddl.length === 0)
    pass(`(c) chưa có sync_stage: dừng pha catalog, md5 không đổi, ${sent.length} câu gửi đi không câu nào là DDL`);
  else fail(`(c) chưa có sync_stage: ${rc.msg}; DDL gửi: ${ddl.length}`);
  psql(C, readFileSync(MIGRATION, "utf8"));

  // (d) kill -9 giữa pha nạp → lượt sau dọn khi quá 2 giờ; staging trẻ của lượt khác còn nguyên
  const child = spawn(process.execPath, [fileURLToPath(import.meta.url), "__child", L, C, "killed", CT, PORT], { stdio: "ignore" });
  for (let i = 0; i < 600; i++) {
    if ((await stagingCount(C, "killed")) > 0) break;
    await sleep(100);
  }
  child.kill("SIGKILL");
  await new Promise((r) => child.on("exit", r));
  const left = await stagingCount(C, "killed");
  await q1(C, "UPDATE sync_stage.rows SET staged_at = now() - interval '3 hours' WHERE run_id = 'killed'");
  await q1(C, "INSERT INTO sync_stage.rows (run_id, tbl, payload, staged_at) VALUES ('young', 'x', '{}', now() - interval '10 minutes')");
  await runSync(L, C);
  const killedAfter = await stagingCount(C, "killed");
  const youngAfter = await stagingCount(C, "young");
  if (left > 0 && killedAfter === 0 && youngAfter === 1)
    pass(`(d) kill -9: ${left} dòng staging bỏ dở bị lượt sau dọn (quá 2 giờ); staging 10 phút của lượt khác còn nguyên`);
  else fail(`(d) kill -9: bỏ dở ${left}, sau dọn ${killedAfter}, lượt khác ${youngAfter}`);

  // đối chứng: lượt lành sau cùng đổi md5
  if (!sameMap(base, await md5Map(C))) pass("đối chứng: lượt lành sau cùng đổi md5 (thước không hằng-đúng)");
  else fail("lượt lành không đổi md5 — fixture không phân biệt được");
}

// ─── ca fidelity (AC-3 / E3) ─────────────────────────────────────────────
async function compareToLocal(L, C) {
  const lc = await client(L);
  const cc = await client(C);
  const bad = [];
  try {
    const { rows: cols } = await lc.query(
      `SELECT table_name AS t, column_name AS c, data_type AS d FROM information_schema.columns
       WHERE table_schema = 'public' AND table_name = ANY($1) ORDER BY table_name, ordinal_position`,
      [FILL],
    );
    const { rows: ccols } = await cc.query(
      `SELECT table_name AS t, column_name AS c FROM information_schema.columns WHERE table_schema = 'public'`,
    );
    const cloudSet = new Set(ccols.map((r) => `${r.t}.${r.c}`));
    for (const t of FILL) {
      const ct = sync.RENAME(t);
      const local = cols.filter((r) => r.t === t).map((r) => r.c);
      const send = sync.selectList(t, local).cols.filter((c) => cloudSet.has(`${ct}.${c}`));
      const lsel = sync.selectList(t, send).sql;
      const csel = send.map((c) => `"${c}"`).join(", ");
      const h = `SELECT count(*)::int AS n, md5(coalesce(string_agg(row_to_json(x)::text, '|' ORDER BY row_to_json(x)::text), '')) AS h FROM`;
      const a = (await lc.query(`${h} (SELECT ${lsel} FROM ${t}) x`)).rows[0];
      const b = (await cc.query(`${h} (SELECT ${csel} FROM ${ct}) x`)).rows[0];
      if (a.n !== b.n || a.h !== b.h) bad.push(`${ct} (local ${a.n}, cloud ${b.n})`);
      for (const { c } of cols.filter((r) => r.t === t && r.d === "date" && send.includes(r.c))) {
        const x = (await lc.query(`SELECT min("${c}")::text||'..'||max("${c}")::text AS r FROM ${t}`)).rows[0].r;
        const y = (await cc.query(`SELECT min("${c}")::text||'..'||max("${c}")::text AS r FROM ${ct}`)).rows[0].r;
        if (x !== y) bad.push(`date ${ct}.${c}: local ${x} ≠ cloud ${y}`);
      }
    }
  } finally {
    await lc.end();
    await cc.end();
  }
  return bad;
}

async function caseFidelity() {
  const L = buildLocalSim("fid_local");
  await q1(L, "DELETE FROM dq_check_results"); // một bảng rỗng ở cả hai phía
  const C = buildCloudSim("fid_cloud");
  await runSync(L, C);
  const bad = await compareToLocal(L, C);
  if (!bad.length) pass(`${CLOUD.length}/${CLOUD.length} bảng cùng số dòng + md5 cột gửi, mọi cột date khớp local (gồm một bảng rỗng)`);
  else fail(`lệch local: ${bad.join("; ")}`);

  // chiều đỏ cùng fixture: phá vật thật trên bản sao cloud — lùi một ngày (đúng lỗi cũ của
  // node-pg) và cắt độ chính xác số trong jsonb (đúng lỗi JSON.parse) → thước phải đỏ
  const C2 = buildCloudSim("fid_red");
  await runSync(L, C2);
  await q1(C2, "ALTER TABLE nights DROP CONSTRAINT nights_pkey; UPDATE nights SET night = night - 1");
  await q1(C2, `UPDATE area_breakdowns SET payload = jsonb_set(payload, '{adr}', to_jsonb(round((payload->>'adr')::numeric, 2)))
    WHERE payload ? 'adr' AND (payload->>'adr') ~ '\\.[0-9]{3,}'`);
  const red = await compareToLocal(L, C2);
  if (red.some((b) => b.startsWith("date nights.night"))) pass(`ĐỎ-ĐÚNG date: ngày lùi một ngày trên bản sao → thước bắt (${red.find((b) => b.startsWith("date nights"))})`);
  else fail("thước không bắt được ngày lùi một ngày");
  if (red.some((b) => b.startsWith("area_breakdowns"))) pass("ĐỎ-ĐÚNG số: số jsonb bị cắt độ chính xác trên bản sao → md5 area_breakdowns lệch");
  else fail("thước không bắt được số jsonb bị cắt");
  dropDb(C2);

  // lệch schema (i): cloud thiếu một cột local có
  await q1(C, "ALTER TABLE listings DROP COLUMN last_seen");
  const w = [];
  await runSync(L, C, { log: (m) => w.push(m) });
  if (w.some((m) => m.includes("lệch schema") && m.includes("listings.last_seen"))) pass("(i) cloud thiếu cột: lượt lành + WARN 'lệch schema' nêu listings.last_seen");
  else fail(`(i) không có WARN lệch schema: ${w.join(" | ")}`);
  // (ii) cột generated + cột có mặc định chỉ cloud có
  await q1(C, "ALTER TABLE listings ADD COLUMN gen int GENERATED ALWAYS AS (1) STORED, ADD COLUMN extra text DEFAULT 'cloud'");
  try {
    await runSync(L, C);
    const r = await q1(C, "SELECT count(*)::int AS n, count(*) FILTER (WHERE extra = 'cloud' AND gen = 1)::int AS k FROM listings");
    if (r[0].n > 0 && r[0].n === r[0].k) pass(`(ii) cloud thêm cột generated + cột mặc định: lượt lành, ${r[0].k}/${r[0].n} dòng giữ giá trị cloud`);
    else fail(`(ii) giá trị cột chỉ-cloud sai: ${JSON.stringify(r[0])}`);
  } catch (e) {
    fail(`(ii) lượt gãy khi cloud có cột generated/mặc định: [${e.phase}] ${e.message}`);
  }
}

// ─── ca keep (AC-4 / E4) ─────────────────────────────────────────────────
async function freeArea(L) {
  const fks = await q1(L, `SELECT conrelid::regclass::text AS t, a.attname AS c FROM pg_constraint k
    JOIN pg_attribute a ON a.attrelid = k.conrelid AND a.attnum = k.conkey[1]
    WHERE k.contype = 'f' AND k.confrelid = 'areas'::regclass`);
  const conds = fks.map((f) => `NOT EXISTS (SELECT 1 FROM ${f.t} x WHERE x.${f.c} = a.id)`).join(" AND ");
  return (await q1(L, `SELECT id FROM areas a WHERE ${conds || "true"} LIMIT 1`))[0]?.id;
}

async function caseKeep() {
  const L = buildLocalSim("keep_local");
  const C = buildCloudSim("keep_cloud");
  await runSync(L, C);
  const gone = await freeArea(L);
  const two = (await q1(L, "SELECT id FROM areas WHERE id <> $1 ORDER BY id LIMIT 2", [gone])).map((r) => r.id);
  await q1(C, "INSERT INTO users (id, email) VALUES (1, 'u@test')");
  for (const a of [...two, gone]) await q1(C, "INSERT INTO saved_markets (user_id, area_id) VALUES (1, $1)", [a]);
  await runSync(L, C);
  const n1 = (await q1(C, "SELECT count(*)::int AS n FROM saved_markets"))[0].n;
  if (n1 === 3) pass("saved_markets 3 dòng trỏ area còn ở local — còn nguyên, tổng không đổi sau lượt sync");
  else fail(`saved_markets sau sync: ${n1} (mong 3)`);

  if (gone) {
    await q1(L, "DELETE FROM areas WHERE id = $1", [gone]);
    await runSync(L, C);
    const left = (await q1(C, "SELECT area_id FROM saved_markets ORDER BY area_id")).map((r) => r.area_id);
    if (left.length === 2 && !left.includes(gone)) pass(`area biến mất khỏi local → saved_markets trỏ nó bị xoá theo FK (Hỏi-2 = a), 2 dòng còn lại`);
    else fail(`area biến mất: saved_markets còn ${JSON.stringify(left)}`);
  } else {
    fail("fixture: không tìm được area nào không bị bảng local tham chiếu");
  }

  // chặn tụt: local areas còn 30%
  const before = await md5Map(C);
  const lc = await client(L);
  await lc.query("SET session_replication_role = replica");
  await lc.query("DELETE FROM areas WHERE ctid IN (SELECT ctid FROM areas TABLESAMPLE BERNOULLI (70))");
  await lc.end();
  const r = await expectFail(runSync(L, C), "shrink");
  if (r.ok && sameMap(before, await md5Map(C))) pass(`chặn tụt: dừng trước tráo, md5 cloud + saved_markets không đổi — ${r.msg.slice(0, 90)}`);
  else fail(`chặn tụt: ${r.msg}`);

  // chiều đỏ: bộ nạp kiểu cũ (TRUNCATE CASCADE) trên cùng fixture
  const L2 = buildLocalSim("keep_local2");
  await runSync(L2, C, { exec: legacyExec(C) }).catch(() => {});
  const n2 = (await q1(C, "SELECT count(*)::int AS n FROM saved_markets"))[0].n;
  if (n2 === 0) pass("ĐỎ-ĐÚNG cascade: bộ nạp TRUNCATE CASCADE kiểu cũ xoá sạch saved_markets còn hợp lệ");
  else fail(`thước không bắt được TRUNCATE CASCADE: saved_markets còn ${n2}`);
}

// ─── ca pii (AC-5 / E5) ──────────────────────────────────────────────────
const PEOPLE = ["sale_offers", "sellers", "properties"];
function captureExec(db, sink) {
  return cloudExec(db, {
    hook: (sql) => {
      const m = sql.match(/^INSERT INTO sync_stage\.rows[\s\S]*?SELECT '[^']+', '([a-z_]+)', x FROM jsonb_array_elements\((\$sync_[A-Za-z0-9]+\$)([\s\S]*)\2::jsonb\) x$/);
      if (m && PEOPLE.includes(m[1])) for (const row of JSON.parse(m[3])) sink.push([m[1], Object.keys(row)]);
    },
  });
}

async function casePii() {
  const L = buildLocalSim("pii_local");
  const C = buildCloudSim("pii_cloud");
  const seen = [];
  await runSync(L, C, { exec: captureExec(C, seen) });
  const forbidden = { sale_offers: ["seller_phone", "seller_name"], sellers: ["name"], properties: ["seller_name"] };
  const hits = seen.filter(([t, keys]) => keys.some((k) => forbidden[t].includes(k)));
  const KEYCOL = { sale_offers: "offer_id", sellers: "phone_hash", properties: "id" };
  for (const [t, k] of Object.entries(KEYCOL)) {
    const rows = seen.filter(([x]) => x === t);
    if (rows.length && rows.every(([, keys]) => keys.includes(k))) pass(`đối chứng dương: bắt được ${rows.length} payload ${t}, mang ${k}`);
    else fail(`không bắt được payload ${t} (hoặc thiếu ${k}) — thước mù với bảng này`);
  }
  if (!hits.length) pass("không payload nào mang seller_phone / seller_name / sellers.name / properties.seller_name");
  else fail(`${hits.length} payload mang cột loại`);
  const leaks = await sync.leakGate(cloudExec(C));
  if (!leaks.length) pass("leak gate sau tráo PASS (vế cũ + seller_ref + quyền sync_stage)");
  else fail(`leak gate: ${leaks.join(", ")}`);

  // chiều đỏ: bản sao sync-cloud bỏ seller_phone khỏi cả hai lớp chặn
  const dir = mkdtempSync(path.join(tmpdir(), "cloudsync-pii-"));
  try {
    copyFileSync(path.join(PIPE, "sync-cloud.mjs"), path.join(dir, "sync-cloud.mjs"));
    symlinkSync(path.join(PIPE, "node_modules"), path.join(dir, "node_modules"));
    const p = path.join(dir, "sync-cloud.mjs");
    const src = readFileSync(p, "utf8");
    // bỏ cả hai lớp chặn cho đủ ba cột của ba bảng
    const mut = src
      .replace('sale_offers: ["seller_phone", "seller_name"]', 'sale_offers: ["seller_name"]')
      .replace('sellers: ["name"],', "sellers: [],")
      .replace('properties: ["seller_name"],', "properties: [],")
      .replace('"offer_id", "area_id",', '"offer_id", "seller_phone", "area_id",')
      .replace('sellers: ["phone_hash",', 'sellers: ["name", "phone_hash",')
      .replace('"id", "geo", "area_id",', '"id", "seller_name", "geo", "area_id",');
    const changed = ['sale_offers: ["seller_name"]', "sellers: [],", "properties: [],", '"seller_phone", "area_id"', '"name", "phone_hash"', '"seller_name", "geo"'].every((x) => mut.includes(x));
    if (!changed) throw new Error("không cấy được đủ đột biến PII — khuôn sync-cloud.mjs đổi?");
    writeFileSync(p, mut);
    const m = await import(pathToFileURL(p).href);
    const C2 = buildCloudSim("pii_red");
    // cloud thật không có properties.seller_name (cố ý) — bản sao đỏ thêm cột để đột biến gửi được
    await q1(C2, "ALTER TABLE properties ADD COLUMN seller_name text");
    const red = [];
    const local = await client(L, { types: m.localTypes });
    try {
      await m.syncOnce({ local, exec: captureExec(C2, red), log: () => {} });
    } finally {
      await local.end();
    }
    for (const [t, c] of [["sale_offers", "seller_phone"], ["sellers", "name"], ["properties", "seller_name"]]) {
      if (red.some(([x, k]) => x === t && k.includes(c))) pass(`ĐỎ-ĐÚNG pii: bỏ ${t}.${c} khỏi danh sách loại + thêm vào cho phép → thước bắt được trong payload`);
      else fail(`thước không bắt được ${t}.${c} lọt vào payload`);
    }
    dropDb(C2);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

// ─── ca overlap (AC-7 / E7) ──────────────────────────────────────────────
async function caseOverlap() {
  const L = buildLocalSim("ov_local");
  const C = buildCloudSim("ov_cloud");
  await runSync(L, C);
  const rd = startReader(C, 50);
  let aStaged = false;
  const slowA = cloudExec(C, {
    hook: async (sql) => {
      if (sql.startsWith("INSERT INTO sync_stage.rows")) {
        aStaged = true;
        await sleep(150);
      }
    },
  });
  const A = runSync(L, C, { exec: slowA, sync: { runId: "lane_a" } }).then(
    () => ({ ok: true }),
    (e) => ({ ok: false, e }),
  );
  while (!aStaged) await sleep(20);
  await q1(L, "DELETE FROM nights WHERE ctid IN (SELECT ctid FROM nights LIMIT 77)");
  const B = await runSync(L, C, { sync: { runId: "lane_b" } }).then(
    () => ({ ok: true }),
    (e) => ({ ok: false, e }),
  );
  const a = await A;
  await rd.stop();
  if (B.ok) pass("lượt B (đọc muộn) tráo xong");
  else fail(`lượt B gãy: [${B.e.phase}] ${B.e.message}`);
  if (!a.ok && a.e.phase === "swap" && /cũ hơn lượt đã tráo/.test(a.e.message)) pass("lượt A (đọc sớm, tráo sau) bị từ chối: 'cũ hơn lượt đã tráo'");
  else fail(`lượt A: ${a.ok ? "tráo được — bản cũ đè bản mới" : `[${a.e.phase}] ${a.e.message}`}`);
  const zero = rd.reads.filter((r) => Object.entries(r.counts).some(([t, n]) => n === 0 && t !== "dq_check_results")).length;
  if (zero === 0 && rd.reads.length > 0) pass(`luồng đọc ${rd.reads.length} lần, 0 lần thấy bảng rỗng`);
  else fail(`luồng đọc thấy bảng rỗng ${zero} lần`);
  const bad = await compareToLocal(L, C);
  if (!bad.length) pass("cloud cuối cùng khớp lần đọc muộn (local hiện tại)");
  else fail(`cloud lệch local: ${bad.join("; ")}`);
  const st = await stagingCount(C);
  if (st === 0) pass("0 dòng staging còn lại");
  else fail(`còn ${st} dòng staging`);
}

// ─── ca allow (AC-11 / E11) ──────────────────────────────────────────────
async function caseAllow() {
  const L = buildLocalSim("allow_local");
  const C = buildCloudSim("allow_cloud");
  await q1(L, "ALTER TABLE sale_offers ADD COLUMN fake text DEFAULT 'x'");
  const seen = [];
  const w = [];
  await runSync(L, C, { exec: captureExec(C, seen), log: (m) => w.push(m) });
  for (const t of PEOPLE) {
    const rows = seen.filter(([x]) => x === t);
    const outside = rows.filter(([, keys]) => keys.some((k) => !sync.CLOUD_ALLOW[t].includes(k)));
    if (rows.length && !outside.length) pass(`payload ${rows.length} dòng ${t} chỉ gồm cột cho phép`);
    else fail(`${t}: ${rows.length} payload, ${outside.length} mang cột ngoài danh sách cho phép`);
  }
  if (!seen.some(([, k]) => k.includes("fake"))) pass("cột giả sale_offers.fake vắng trong payload");
  else fail("cột giả sale_offers.fake lọt vào payload");
  if (w.some((m) => m.includes("cột chưa duyệt") && m.includes("sale_offers.fake"))) pass("WARN 'cột chưa duyệt' nêu sale_offers.fake");
  else fail("không có WARN cột chưa duyệt cho sale_offers.fake");
  const bad = await q1(C, `SELECT count(*)::int AS n FROM sale_offers WHERE seller_ref IS NOT NULL
    AND (seller_ref !~ '${sync.SELLER_REF_RE}' OR split_part(seller_ref, ':', 1) <> source)`);
  const nn = await q1(C, "SELECT count(*)::int AS n FROM sale_offers WHERE seller_ref IS NOT NULL");
  if (bad[0].n === 0 && nn[0].n > 0) pass(`seller_ref trên cloud: ${nn[0].n} giá trị đều dạng S0x:số, mã khớp cột source`);
  else fail(`seller_ref sai dạng ${bad[0].n} dòng (khác rỗng ${nn[0].n})`);
  const pair = await q1(L, "SELECT offer_id, seller_ref FROM sale_offers WHERE source = 'S06' AND seller_ref ~ '[0-9]+$' LIMIT 1");
  if (pair[0]) {
    const cloud = await q1(C, "SELECT seller_ref FROM sale_offers WHERE offer_id = $1", [pair[0].offer_id]);
    const digits = pair[0].seller_ref.match(/([0-9]+)$/)[1];
    if (cloud[0]?.seller_ref === `S06:${digits}`) pass("đối chứng dương: dòng S06 local mang số tài khoản → cloud 'S06:<cùng số>'");
    else fail(`S06 chuẩn hoá sai: ${cloud[0]?.seller_ref}`);
  } else fail("fixture không có dòng S06 có số");

  // chiều đỏ: định danh nguồn lẫn trong giá trị (mỗi bảng người bán một ô) → dừng trước khi gửi
  const C2 = buildCloudSim("allow_red");
  const reg = await q1(L, "SELECT code, real_name, source_ids FROM source_registry");
  const longTok = reg.flatMap((r) => r.source_ids ?? []).find((x) => x.length >= 4);
  const shortTok = reg.map((r) => r.real_name).find((x) => x && x.length < 4);
  const plants = [
    ["sale_offers", "offer_id", "street_raw", "text", longTok],
    ["properties", "id", "street", "text", longTok],
    ["sellers", "phone_hash", "flags", "jsonb", longTok],
  ];
  if (shortTok) plants.push(["properties", "id", "street", "text", shortTok]);
  else note("source_registry local không có tên nguồn < 4 ký tự — bỏ ca token ngắn");
  for (const [t, pk, col, kind, tok] of plants) {
    const [row] = await q1(L, `SELECT ${pk}::text AS id, ${col}::text AS v FROM ${t} ORDER BY ${pk} LIMIT 1`);
    const val = kind === "jsonb" ? `jsonb_build_object('ghi_chu', $1::text)` : `'ngõ ' || $1::text || ' 3'`;
    await q1(L, `UPDATE ${t} SET ${col} = ${val} WHERE ${pk}::text = $2`, [tok, row.id]);
    const r = await expectFail(runSync(L, C2), "scan");
    const st = await stagingCount(C2);
    const label = tok.length < 4 ? "token ngắn" : "token dài";
    if (r.ok && st === 0 && r.msg.includes(`${t}.${col}`)) pass(`ĐỎ-ĐÚNG ten-nguon (${label}) ở ${t}.${col}: dừng trước khi nạp, 0 dòng staging`);
    else fail(`soát tên nguồn ${t}.${col} (${label}): ${r.msg}; staging ${st}`);
    await q1(L, `UPDATE ${t} SET ${col} = ${kind === "jsonb" ? "$1::jsonb" : "$1"} WHERE ${pk}::text = $2`, [row.v, row.id]);
  }
  // fail-closed: source_registry rỗng → không soát được → dừng, không gửi
  await q1(L, "CREATE TABLE sr_backup AS SELECT * FROM source_registry; DELETE FROM source_registry");
  const re = await expectFail(runSync(L, C2), "scan");
  if (re.ok && (await stagingCount(C2)) === 0) pass("ĐỎ-ĐÚNG fail-closed: source_registry rỗng → dừng pha scan, không gửi");
  else fail(`source_registry rỗng mà lượt không dừng: ${re.msg}`);
  await q1(L, "INSERT INTO source_registry SELECT * FROM sr_backup; DROP TABLE sr_backup");
  dropDb(C2);

  // chiều đỏ: seller_ref thô trên cloud → leak gate đỏ
  await q1(C, "UPDATE sale_offers SET seller_ref = 'ct:1' WHERE ctid = (SELECT ctid FROM sale_offers LIMIT 1)");
  const leaks = await sync.leakGate(cloudExec(C));
  if (leaks.some((l) => l.includes("seller_ref"))) pass("ĐỎ-ĐÚNG seller_ref: seller_ref thô trên cloud → leak gate đỏ");
  else fail(`leak gate không bắt seller_ref thô: ${JSON.stringify(leaks)}`);
}

// tiến trình con cho ca fail (d): chạy một lượt có nạp chậm để bị kill -9 giữa chừng
if (process.argv[2] === "__child") {
  const [, , , L, C, runId, ct, port] = process.argv;
  CT = ct;
  PORT = port;
  const slow = cloudExec(C, { hook: (sql) => (sql.startsWith("INSERT INTO sync_stage.rows") ? sleep(400) : undefined) });
  await runSync(L, C, { exec: slow, sync: { runId } }).catch(() => {});
  process.exit(0);
}

const CASES = {
  stage: caseStage,
  atomic: caseAtomic,
  fail: caseFail,
  fidelity: caseFidelity,
  keep: caseKeep,
  pii: casePii,
  overlap: caseOverlap,
  allow: caseAllow,
};

const which = process.argv[2];
if (!CASES[which]) {
  console.log(`usage: node scripts/check-cloud-sync.mjs <${Object.keys(CASES).join("|")}>`);
  process.exit(2);
}
try {
  startTemp(which);
  await CASES[which]();
} catch (e) {
  fail(`ca ${which} ném lỗi: ${e.stack || e.message}`);
} finally {
  await cleanup();
}
console.log(`check-cloud-sync ${which}: ${FAILED ? "CÓ LỖI" : "OK"}`);
process.exit(FAILED ? 1 : 0);
