// danh-ba-vat-the-xa-that.itest.mjs — hồ sơ nut-du-an-tro-xa-moi (DV1) E7: đo trên dữ liệu máy thu. Chạy dưới
// db/db-thu.sh --chay (DB của riêng lượt chép từ máy thu); mở máy thu bằng phiên CHỈ ĐỌC để đếm độc lập và chứng không ghi.
// Chỉ in số và slug. Ngoài CI. Chạy:
//   bash db/db-thu.sh oneinvest_suite_dv1t --chay node --test --test-concurrency=1 pipeline/scripts/danh-ba-vat-the-xa-that.itest.mjs
import { after, before, test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import pg from "pg";
import { MAY_CHU } from "./db-thu-dbv.mjs";
import { TEP_XA, napBangXa } from "../danh-ba-vat-the.mjs";
import { xaMoiCuaNut } from "../lib/danh-ba-vat-the.mjs";

const GOC = join(import.meta.dirname, "../..");
const URL_LUOT = process.env.DATABASE_URL;
const TEP = JSON.parse(readFileSync(TEP_XA, "utf8"));

let c; // DB của lượt
let may; // máy thu, chỉ đọc
before(async () => {
  assert.ok(URL_LUOT, "cần DATABASE_URL của DB riêng lượt (db/db-thu.sh --chay)");
  c = new pg.Client({ connectionString: URL_LUOT });
  await c.connect();
  if ((await c.query("SELECT current_database() AS db")).rows[0].db === "oneinvest") throw new Error("DV1-AC-7: từ chối ghi DB dùng chung");
  may = new pg.Client({ connectionString: `${MAY_CHU}/oneinvest`, options: "-c default_transaction_read_only=on" });
  await may.connect();
});
after(async () => { await c?.end(); await may?.end(); });

// Số mã của nút dự án không có trong areas — cùng một câu cho cả hai DB.
const DEM_LAC = `SELECT count(*)::int AS n FROM asset_nodes n, unnest(n.area_ids) a(id)
                  WHERE n.node_type = 'project' AND NOT EXISTS (SELECT 1 FROM areas x WHERE x.id = a.id)`;
const chup = async (k) => (await k.query("SELECT slug, area_ids FROM asset_nodes WHERE node_type = 'project' ORDER BY slug")).rows;

test("DV1-AC-7 trên dữ liệu máy thu: trước có mã lạc bằng số đếm độc lập, sau 0 và 20/20 bằng tệp; máy thu không bị ghi", async () => {
  const mayTruoc = await chup(may);
  const truocLuot = (await c.query(DEM_LAC)).rows[0].n;
  const truocMay = (await may.query(DEM_LAC)).rows[0].n;
  assert.equal(truocLuot, truocMay, "DV1-AC-7 bản chép lệch máy thu trước khi sửa");
  assert.ok(truocLuot > 0, "DV1-AC-7 còn mã ngoài areas — đối chứng: ảnh trước khi sửa phải có mã lạc");
  const r = spawnSync(process.execPath, [join(GOC, "pipeline/danh-ba-vat-the.mjs"), "--sua-xa", "--db", URL_LUOT],
    { encoding: "utf8", cwd: join(GOC, "pipeline") });
  assert.equal(r.status, 0, `DV1-AC-7 lệnh: ${r.stderr}`);
  const sauLuot = (await c.query(DEM_LAC)).rows[0].n;
  assert.equal(sauLuot, 0, "DV1-AC-7 còn mã ngoài areas");
  const bang = await napBangXa(c, TEP.nut);
  const sau = await chup(c);
  assert.equal(sau.length, 20, "DV1-AC-7 số nút dự án");
  for (const n of sau) assert.deepEqual([...n.area_ids].sort(), xaMoiCuaNut(TEP.nut[n.slug], bang).area_ids, `DV1-AC-7 ${n.slug} lệch tệp`);
  assert.deepEqual(await chup(may), mayTruoc, "DV1-AC-7 máy thu bị ghi");
  console.log(`DV1-AC-7 mã lạc trước=${truocLuot} (máy thu ${truocMay}) sau=${sauLuot}; nút đổi: ${r.stdout.split("\n").filter((l) => l.includes(" → ")).map((l) => l.split(" · ")[0]).join(", ")}`);
});
