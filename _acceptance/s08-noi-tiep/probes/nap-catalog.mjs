// AC-4: snapshot giả có căn + detail + catalog qua importer THẬT, lược đồ tạm (không ghi bảng thật, không gọi nguồn).
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
const SCHEMA = `acc_s08n_${process.pid}`;
const DB = `${DB_Q}?options=-csearch_path%3D${SCHEMA}`;
const tam = mkdtempSync(join(tmpdir(), "s08n-"));

const item = (ma, state, kind = "inventory_unit") => ({
  source: "s08-danh-muc", sourceId: createHash("sha256").update(`${state}|${ma}`).digest("hex").slice(0, 32), kind, fetchedAt: "2026-11-02T00:00:00.000Z",
  payload: { product_code: ma, land_area: "100,5", number_of_room: "2", apartment_price: "1000" },
  meta: { city: "vn", source: "S08", projectId: "900001", projectType: "low_rise", state, productCode: ma },
});
function snap(moc, items) {
  const dir = join(tam, `vn__s08-danh-muc__${moc}`);
  mkdirSync(dir, { recursive: true });
  const gz = gzipSync(Buffer.from(JSON.stringify(items)));
  writeFileSync(join(dir, "items-0001.json.gz"), gz);
  writeFileSync(join(dir, "manifest.json"), JSON.stringify({ schemaVersion: 4, snapshotId: basename(dir), city: "vn", source: "s08-danh-muc",
    startedAt: "2026-11-02T00:00:00Z", finishedAt: "2026-11-02T00:00:01Z", itemCount: items.length,
    files: [{ name: "items-0001.json.gz", sha256: createHash("sha256").update(gz).digest("hex"), itemCount: items.length }] }));
  return dir;
}
const nap = (dir) => {
  const r = spawnSync("node", [join(ROOT, "pipeline/import-airbnb.mjs"), dir], { encoding: "utf8", timeout: 60_000, cwd: join(ROOT, "pipeline"), env: { ...process.env, DATABASE_URL: DB } });
  return { status: r.status, log: `${r.stdout}\n${r.stderr}` };
};
let loi = 0;
const kiem = (ok, dong) => { console.log(`${ok ? "ok  " : "FAIL"} ${dong}`); if (!ok) loi = 1; };

const c = new pg.Client({ connectionString: DB_Q });
await c.connect();
try {
  await c.query(`CREATE SCHEMA "${SCHEMA}"`);
  for (const t of ["airbnb_snapshots", "stg_s08_inventory"]) await c.query(`CREATE TABLE "${SCHEMA}".${t} (LIKE public.${t} INCLUDING ALL)`);
  const dem = async () => (await c.query(`SELECT count(*)::int n FROM "${SCHEMA}".stg_s08_inventory`)).rows[0].n;

  const dir = snap("2026-11-02T000000111", [item("GIA-1", "notSold"), item("GIA-2", "sold"), item("project-900001", "detail"), item("project-900001", "catalog", "project_catalog")]);
  const l1 = nap(dir);
  const n1 = await dem();
  console.log(`lượt 1: exit ${l1.status} · ${n1} dòng`);
  kiem(l1.status === 0 && n1 === 2, "lượt 1 nạp đúng 2 căn");
  kiem(/2 S08 căn \(\+1 detail, \+1 catalog bỏ/.test(l1.log), "log đếm +1 detail, +1 catalog bỏ");
  kiem(!/state lạ/.test(l1.log), "should-NOT-fire: catalog và detail không gây cảnh báo state lạ");

  const l2 = nap(dir);
  const n2 = await dem();
  console.log(`lượt 2: exit ${l2.status} · ${n2} dòng`);
  kiem(l2.status === 0 && n2 === n1, "nạp lại không nhân dòng");
  kiem(/\b0 S08 căn/.test(l2.log), "lượt 2 log 0 căn mới");

  // đối chứng: cảnh báo còn sống với state lạ thật, nên vế «không có state lạ» ở trên có răng
  const l3 = nap(snap("2026-11-02T000000222", [item("GIA-LA", "weird")]));
  kiem(l3.status === 0 && /state lạ/.test(l3.log), "đối chứng: item state lạ thật vẫn bị cảnh báo");
  if (!loi) console.log("NAP OK");
} finally {
  await c.query(`DROP SCHEMA IF EXISTS "${SCHEMA}" CASCADE`);
  await c.end();
  rmSync(tam, { recursive: true, force: true });
}
process.exit(loi);
