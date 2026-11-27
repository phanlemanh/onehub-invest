// tran.mjs — phép đo PL41 trên bản chép DB máy thu (chạy qua tran.sh → db/db-thu.sh --chay). KHÔNG in giá trị ô nào.
// Trần 50 của transform S06 đếm cái lượt thật sự đổi (phát biểu sống trúng + giá trị trúng ở tin mới), không đếm trên toàn stg.
//   Ca 1 «51 giá trị cũ đã xử»: 51 tin S06 đã có bản ghi nhận đường mang tên nguồn trong stg, không phát biểu sống nào trúng
//        (trạng thái sau các đêm trước đã bỏ ghi). Bản PL39 (đếm trên stg) phải dừng; bản PL41 phải chạy trọn.
//   Ca 2 «51 giá trị mới trong một lượt»: thêm 51 tin mới có quận mang tên nguồn → bản PL41 dừng trước mọi lần ghi.
import { execFileSync } from "node:child_process";
import { readdirSync, writeFileSync, rmSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { createRequire } from "node:module";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const P = join(ROOT, "pipeline");
const pg = createRequire(join(P, "package.json"))("pg");
const imp = (f) => import(pathToFileURL(join(P, f)));
const { docSourceNameEntries } = await imp("lib/source-name-entries.mjs");
const { findSourceNames } = await imp("lib/mask-source-names.mjs");
// Bản PL39 của transform (đếm trần trên toàn stg) — đầu nhánh PL39 mà PL41 xếp chồng (PR #544).
const SHA_PL39 = process.env.PL41_SHA_PL39 ?? "5d3e5ee4d192a4fbfbd4a9e3a47392cbe329630d";

const URL_DB = process.env.DATABASE_URL ?? "";
if (!/\/oneinvest_suite_[a-z0-9_]+$/.test(new URL(URL_DB).pathname)) throw new Error("chỉ chạy trên DB của riêng lượt oneinvest_suite_*");
for (const f of readdirSync(P)) {
  const m = /^\.pl41-ban-pl39-(\d+)\.mjs$/.exec(f);
  if (m) { try { process.kill(Number(m[1]), 0); } catch { rmSync(join(P, f), { force: true }); } }
}
const TEP_CU = join(P, `.pl41-ban-pl39-${process.pid}.mjs`);
writeFileSync(TEP_CU, execFileSync("git", ["-C", ROOT, "show", `${SHA_PL39}:pipeline/transform-chotot.mjs`], { encoding: "utf8" }));

const c = new pg.Client({ connectionString: URL_DB });
await c.connect();
const loi = [];
const bao = (ok, msg) => { console.log(`${ok ? "✔" : "✖"} ${msg}`); if (!ok) loi.push(msg); };
const trung = (v, e) => typeof v === "string" && findSourceNames(v, e).length > 0;
async function chay(tep) {
  const { runTransformChotot } = await import(pathToFileURL(tep) + `?l=${Date.now()}`);
  const dong = [], log = console.log;
  console.log = (...a) => dong.push(a.join(" "));
  const t0 = performance.now();
  try { await runTransformChotot(c); return { ok: true, dong, ms: performance.now() - t0 }; }
  catch (er) { return { ok: false, loi: er.message, dong, ms: performance.now() - t0 }; }
  finally { console.log = log; }
}
const dau = async () => (await c.query(`SELECT (SELECT count(*) FROM sale_offer_records)::int AS tin, (SELECT max(id) FROM field_assertions)::text AS pb,
    (SELECT count(*) FROM field_assertions WHERE retracted_at IS NOT NULL)::int AS rut`)).rows[0];

try {
  const e = await docSourceNameEntries(c);
  bao(e.length > 0, `sổ nguồn của bản chép có ${e.length} mục`);
  const tk = e.map((x) => x.realName.trim()).filter((v) => v.length >= 4).sort((a, b) => b.length - a.length)[0];
  const duong = `Đường ${tk} 7`, quan = `Quận ${tk}`;
  bao(trung(duong, e) && trung(quan, e), "chuỗi cấy trúng bộ dò");

  // Ca 1: 51 tin S06 đã có bản ghi, đường sạch đang sống → stg nhận đường mang tên nguồn.
  const { rows: cu } = await c.query(`SELECT s.list_id FROM stg_chotot_ads s
      JOIN sale_offer_records o ON o.source = 'S06' AND o.originating_system_key = s.list_id::text
     WHERE s.price > 0 AND s.size_m2 > 0 AND s.ad_type IN ('s', 'u') ORDER BY s.list_id LIMIT 51`);
  bao(cu.length === 51, `chọn được ${cu.length} tin đã có bản ghi`);
  await c.query(`UPDATE stg_chotot_ads SET payload = payload || jsonb_build_object('street_name', $2::text) WHERE list_id = ANY($1::bigint[])`,
    [cu.map((r) => r.list_id), duong]);
  const { rows: [song] } = await c.query(`SELECT count(*)::int n FROM field_assertions WHERE retracted_at IS NULL AND field IN ('street_raw','block_raw')
      AND subject_key LIKE 'S06:%' AND value = $1`, [duong]);
  bao(song.n === 0, `ca 1: không phát biểu sống nào mang giá trị cấy (${song.n}) — giống trạng thái sau các đêm đã bỏ ghi`);

  const t1 = await dau();
  const cuR = await chay(TEP_CU);
  bao(!cuR.ok && /vượt trần 50/.test(cuR.loi), `ca 1, bản PL39 (đếm trên stg) dừng: ${cuR.ok ? "(không dừng)" : cuR.loi.slice(0, 50)}`);
  bao(JSON.stringify(await dau()) === JSON.stringify(t1), "ca 1, bản PL39: dừng trước mọi lần ghi");

  const moiR = await chay(join(P, "transform-chotot.mjs"));
  const dong = moiR.dong.find((d) => d.startsWith("ô chữ mang tên nguồn:")) ?? "";
  bao(moiR.ok, `ca 1, bản PL41 chạy trọn: ${moiR.ok ? `${(moiR.ms / 1000).toFixed(0)} s` : moiR.loi.slice(0, 80)}`);
  const boGhi = Number(/street_raw (\d+)/.exec(dong)?.[1] ?? NaN);
  bao(boGhi >= 51, `ca 1: log bỏ ghi street_raw ${boGhi} ≥ 51 (51 giá trị cũ vẫn bị bỏ ghi, chỉ không vào trần)`);

  // Ca 2: 51 tin mới (khoá gốc chưa có bản ghi) có quận mang tên nguồn → dừng trước mọi lần ghi.
  const { rows: [m] } = await c.query(`SELECT max(list_id) AS id FROM stg_chotot_ads`);
  const { rows: [nguon] } = await c.query(`SELECT s.list_id FROM stg_chotot_ads s WHERE s.price > 0 AND s.size_m2 > 0 AND s.ad_type IN ('s','u')
      AND NOT (s.list_id = ANY($1::bigint[])) ORDER BY s.list_id LIMIT 1`, [cu.map((r) => r.list_id)]);
  await c.query(`INSERT INTO stg_chotot_ads SELECT (jsonb_populate_record(NULL::stg_chotot_ads, to_jsonb(s) || jsonb_build_object(
      'list_id', $2::bigint + k, 'area_name', $3::text))).* FROM stg_chotot_ads s, generate_series(1, 51) k WHERE s.list_id = $1`,
    [nguon.list_id, m.id, quan]);
  const t2 = await dau();
  const moi2 = await chay(join(P, "transform-chotot.mjs"));
  bao(!moi2.ok && /vượt trần 50 — dừng, không rút, không ghi/.test(moi2.loi), `ca 2, bản PL41 dừng: ${moi2.ok ? "(không dừng)" : moi2.loi.slice(0, 70)}`);
  bao(JSON.stringify(await dau()) === JSON.stringify(t2), "ca 2: không thêm tin, không thêm hay rút phát biểu nào");
} finally {
  rmSync(TEP_CU, { force: true });
  await c.end();
}
console.log(loi.length ? `KẾT QUẢ: đỏ ${loi.length} ca` : "KẾT QUẢ: xanh");
process.exit(loi.length ? 1 : 0);
