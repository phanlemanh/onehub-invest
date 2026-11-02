// AC-4, AC-5: item chế độ region qua importer THẬT, lược đồ tạm (không CREATE DATABASE, không gọi nguồn).
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { basename, join, resolve } from "node:path";
import { gzipSync } from "node:zlib";

const ROOT = resolve(import.meta.dirname, "../../..");
const pg = createRequire(join(ROOT, "pipeline/"))("pg");
const DB_Q = process.env.DATABASE_URL ?? "postgres://oneinvest:oneinvest@localhost:5433/oneinvest";
const SCHEMA = `acc_s06r_${process.pid}`;
const DB = `${DB_Q}?options=-csearch_path%3D${SCHEMA}`;
const tam = mkdtempSync(join(tmpdir(), "s06r-"));

function snap(id, payload) {
  const dir = join(tam, `hai-phong__chotot-ads__${id}`);
  mkdirSync(dir, { recursive: true });
  const gz = gzipSync(Buffer.from(JSON.stringify([{ source: "chotot-ads", sourceId: `s-${id}`, kind: "ad", fetchedAt: "2026-11-02T10:00:00Z",
    payload, meta: { city: "vn-hai-phong", region: 2, cg: 1000, st: "s", page: 1 } }])));
  writeFileSync(join(dir, "items-0001.json.gz"), gz);
  writeFileSync(join(dir, "manifest.json"), JSON.stringify({ schemaVersion: 1, snapshotId: basename(dir), city: "hai-phong", source: "chotot-ads",
    startedAt: "2026-11-02T10:00:00Z", finishedAt: "2026-11-02T10:01:00Z", itemCount: 1,
    files: [{ name: "items-0001.json.gz", sha256: createHash("sha256").update(gz).digest("hex"), itemCount: 1 }] }));
  return dir;
}
const nap = (dir) => spawnSync("node", [join(ROOT, "pipeline/import-chotot.mjs"), dir], { encoding: "utf8", timeout: 60_000,
  cwd: join(ROOT, "pipeline"), env: { ...process.env, DATABASE_URL: DB } });

const c = new pg.Client({ connectionString: DB_Q });
await c.connect();
let loi = 0;
try {
  await c.query(`CREATE SCHEMA "${SCHEMA}"`);
  for (const t of ["airbnb_snapshots", "stg_chotot_ads"]) await c.query(`CREATE TABLE "${SCHEMA}".${t} (LIKE public.${t} INCLUDING ALL)`);
  const co = nap(snap("2026-11-02T100000111", { list_id: "9001", region_v2: 2010, category: 1000, type: "s", subject: "g", price: 1 }));
  const r1 = (await c.query(`SELECT region_v2, city_code FROM "${SCHEMA}".stg_chotot_ads WHERE list_id = 9001`)).rows;
  console.log(`có mã: exit ${co.status} · dòng ${JSON.stringify(r1)}`);
  if (co.status === 0 && r1.length === 1 && Number(r1[0].region_v2) === 2010 && r1[0].city_code === "vn-hai-phong") console.log("CO MA OK");
  else { loi = 1; console.log("có mã: SAI"); }
  const thieu = nap(snap("2026-11-02T100000222", { list_id: "9002", category: 1000, type: "s", subject: "g", price: 1 }));
  const r2 = (await c.query(`SELECT count(*)::int n FROM "${SCHEMA}".stg_chotot_ads WHERE list_id = 9002`)).rows[0].n;
  console.log(`thiếu mã: exit ${thieu.status} · dòng ${r2}`);
  if (thieu.status !== 0 && r2 === 0) console.log("THIEU MA OK");
  else { loi = 1; console.log("thiếu mã: SAI"); }
} finally {
  await c.query(`DROP SCHEMA IF EXISTS "${SCHEMA}" CASCADE`);
  await c.end();
  rmSync(tam, { recursive: true, force: true });
}
process.exit(loi);
