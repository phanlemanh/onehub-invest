// do-phu.mjs — E8 (AC-8): độ phủ thật của bước gắn trên bản chép DB máy thu, đối chiếu phép đếm độc lập probes/dem-doc-lap.mjs.
// --go-khu: gỡ phát biểu của một khu trên bản sao; lệnh phải thoát 1 và nêu lệch bao nhiêu tin (chiều đỏ).
import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const URL_DB = process.env.DATABASE_URL ?? "";
if (!/\/oneinvest_pl20_dophu$/.test(URL_DB)) { console.error("do-phu: chỉ chạy trên DB oneinvest_pl20_dophu"); process.exit(2); }

const pg = createRequire(`${ROOT}/pipeline/package.json`)("pg");
const nap = (t) => import(pathToFileURL(`${ROOT}/pipeline/lib/${t}`).href);
const { buocGhepToa } = await nap("ghep-tin-danh-muc-ghi.mjs");
const { docDauVao, tinhGan } = await nap("ghep-tin-danh-muc-doc.mjs");
const DEM = `${ROOT}/_acceptance/ghep-tin-vao-danh-muc/probes/dem-doc-lap.mjs`;
const RULE_IDS = ["ghep-toa-cot", "ghep-toa-cot-chuan", "ghep-toa-chu-model", "ghep-toa-model"];
const NGUONG_PHU = 0.5, NGUONG_LECH = 0.005, NGUONG_XUNG_DOT = 0.01;

const do_ = (ten, them = "") => { console.error(`ĐỎ: ${ten} ${them}`); process.exit(1); };
const dat = (ten, dk, them = "") => { if (!dk) do_(ten, them); console.log(`đạt: ${ten}${them ? ` · ${them}` : ""}`); };
const pt = (a, b) => `${a.toLocaleString("vi-VN")}/${b.toLocaleString("vi-VN")} = ${((a / b) * 100).toFixed(2)}%`;
const c = new pg.Client({ connectionString: URL_DB });
await c.connect();
// Áp một lần: áp lại 113 sau 117 sẽ lỗi vì CHECK của 113 không có trường universal_property_id đã có dòng.
const { rows: [{ chua }] } = await c.query(`SELECT to_regclass('public.offer_building') IS NULL AS chua`);
if (chua) for (const t of ["113_thuoc_tinh_can_s16.sql", "118_v_s16_gia_cdt_loai_mo_ho.sql", "117_ghep_toa_tren_tin.sql"]) await c.query(readFileSync(`${ROOT}/db/migrations/${t}`, "utf8"));

const canhBao = [];
await buocGhepToa(c, { log: (s) => canhBao.push(s) });
dat("bước gắn chạy không cảnh báo", canhBao.length === 0, canhBao.join(" | "));

/** Tin căn hộ S03 đã gắn theo view offer_building. */
const docView = async () => (await c.query(
  `SELECT o.offer_id, b.status, b.muc, p.project_node_id::text AS du_an FROM sale_offers o JOIN offer_building b USING (offer_id) LEFT JOIN offer_project p USING (offer_id)
    WHERE o.source = 'S03' AND o.property_type = 'apartment'`)).rows;
const mauSo = async () => Number((await c.query(`SELECT count(*) n FROM sale_offers WHERE source = 'S03' AND property_type = 'apartment'`)).rows[0].n);
const tuSo = (ds) => ds.filter((x) => x.status === "gan").length;

/** Phép đếm độc lập trên đúng DB này; trả tử số và tập tin đã gắn. */
function demDocLap() {
  const tam = mkdtempSync(path.join(tmpdir(), "pl20-dem-"));
  try {
    const ra = path.join(tam, "ra.tsv");
    const r = spawnSync(process.execPath, [DEM, "--ra", ra], { encoding: "utf8", env: process.env, maxBuffer: 32 * 1024 * 1024 });
    if (r.status !== 0) do_("phép đếm độc lập lỗi", r.stderr.slice(-400));
    return { ...JSON.parse(r.stdout.trim().split("\n").pop()), tin: new Set(readFileSync(ra, "utf8").trim().split("\n").map((l) => l.split("\t")[0])) };
  } finally { rmSync(tam, { recursive: true, force: true }); }
}
const soSanh = (ds, dem) => {
  const may = new Set(ds.filter((x) => x.status === "gan").map((x) => x.offer_id));
  const chiMay = [...may].filter((o) => !dem.tin.has(o)).length, chiDem = [...dem.tin].filter((o) => !may.has(o)).length;
  return { a: may.size, b: dem.tu_so, chiMay, chiDem, lech: Math.abs(may.size - dem.tu_so) };
};

if (process.argv.includes("--go-khu")) {
  const dem = demDocLap();
  const { rowCount } = await c.query(
    `UPDATE field_assertions f SET retracted_at = now(), retract_reason = 'thu-pl20' FROM sale_offers o JOIN offer_project p USING (offer_id)
      CROSS JOIN LATERAL unnest(o.post_ids) AS x(post_id)
      WHERE p.project_node_id = 1 AND o.source = 'S03' AND f.subject_key = 'S03:' || x.post_id AND f.retracted_at IS NULL AND f.rule_id = ANY ($1::text[])`, [RULE_IDS]);
  const s = soSanh(await docView(), dem);
  await c.end();
  if (s.lech / Math.max(s.b, 1) > NGUONG_LECH) do_(`gỡ ${rowCount} phát biểu của một khu: lệch ${s.lech} tin so với phép đếm độc lập`, `(máy ${s.a}, đếm ${s.b})`);
  console.log("phép so không phát hiện việc gỡ"); process.exit(0);
}

const ds = await docView(), ms = await mauSo(), ts = tuSo(ds);
console.log(`Tử số, mẫu số: ${pt(ts, ms)}`);
const dem1 = (f) => Object.entries(ds.filter((x) => x.status === "gan").reduce((o, x) => { o[f(x)] = (o[f(x)] ?? 0) + 1; return o; }, {})).map(([k, n]) => `${k} ${n}`).join(" · ");
console.log(`Theo khu (id nút dự án): ${dem1((x) => x.du_an)}`);
console.log(`Theo mức gắn: ${dem1((x) => x.muc)}`);
const vao = await docDauVao(c), kq = tinhGan(vao);
console.log(`Theo nguồn: ${Object.entries(kq.dem.theo_nguon).map(([k, n]) => `${k} ${n}`).join(" · ")}`);

/** Độ phủ khi bỏ các bản đọc của một số lượt đọc bù. */
async function phuKhiBo(dieuKien) {
  await c.query("BEGIN");
  try {
    await c.query(`DELETE FROM silver_labels WHERE ${dieuKien}`);
    const k = tinhGan(await docDauVao(c));
    return k.dem;
  } finally { await c.query("ROLLBACK"); }
}
const truoc = await phuKhiBo(`run_id LIKE 'pl20-doc-bu%'`), sau1 = await phuKhiBo(`run_id = 'pl20-doc-bu-2'`);
console.log(`Trước đọc bù: ${pt(truoc.gan, truoc.tong)} · sau lượt 1: ${pt(sau1.gan, sau1.tong)} · sau lượt 2: ${pt(kq.dem.gan, kq.dem.tong)}`);

dat("tỉ lệ từ 50%", ts / ms >= NGUONG_PHU, pt(ts, ms));
const xd = ds.filter((x) => x.status === "xung_dot").length;
dat("xung đột không vượt 1% số tin đã gắn", xd / ts <= NGUONG_XUNG_DOT, `${xd} tin = ${((xd / ts) * 100).toFixed(2)}%`);
dat("view khớp tử số của hàm gắn", ts === kq.dem.gan, `view ${ts}, hàm ${kq.dem.gan}`);

const nguon = readFileSync(DEM, "utf8");
dat("phép đếm độc lập không nhập hàm gắn", !/(from\s+["'][^"']*ghep-tin-danh-muc|import\([^)]*ghep-tin-danh-muc|require\([^)]*ghep-tin-danh-muc)/.test(nguon));
const dem = demDocLap(), s = soSanh(ds, dem);
dat("lệch không quá 0,5% tử số so với phép đếm độc lập", s.lech / s.b <= NGUONG_LECH, `máy ${s.a}, đếm ${s.b}, lệch ${s.lech} = ${((s.lech / s.b) * 100).toFixed(2)}%; chỉ máy gắn ${s.chiMay}, chỉ phép đếm gắn ${s.chiDem}`);

// Dòng của rule_id khác không được làm đổi tử số.
await c.query("BEGIN");
try {
  const { rows: [t] } = await c.query(
    `SELECT x.post_id FROM sale_offers o CROSS JOIN LATERAL unnest(o.post_ids) AS x(post_id) LEFT JOIN offer_building b USING (offer_id)
      WHERE o.source = 'S03' AND o.property_type = 'apartment' AND b.offer_id IS NULL LIMIT 1`);
  const { rows: [n] } = await c.query(`SELECT id::text FROM asset_nodes WHERE node_type = 'subzone' ORDER BY id LIMIT 1`);
  await c.query(`INSERT INTO field_assertions (subject_key, field, value, evidence_tier, method, method_version, rule_id, observed_at)
                 VALUES ($1, 'subzone_node_id', $2, 'inferred', 'e1_rule', 'thu-pl20', 'luat-khac', now())`, [`S03:${t.post_id}`, n.id]);
  dat("cấy dòng của rule_id khác thì tử số không đổi", tuSo(await docView()) === ts);
} finally { await c.query("ROLLBACK"); }
await c.end();
console.log("XANH: độ phủ đạt và khớp phép đếm độc lập");
