// so-moc-s03.itest.mjs — hồ sơ _acceptance/so-so-tren-man-theo-ngay (SM1, AC-1…AC-5): số mốc S03 theo ngày do 600_data_flow.sql ghi.
// Chỉ chạy trên DB của riêng lượt (bash db/db-thu.sh oneinvest_suite_<tên> --chay …). Mọi ca dùng lược đồ tạm `sm1_<pid>`: bảng LIKE
// public, view `sale_offers` dựng từ đúng định nghĩa của public (tin đã nghỉ rời view như thật), `offer_project` là bảng tám cột để ô
// viết trước đếm được chính xác. Lượt làm tươi là `chayLamTuoi` thật. Đột biến áp lên chính văn bản SQL của 600 rồi đi qua cùng hàm kiểm
// với bản thật, nên chiều đỏ đo đúng phép kiểm của chiều xanh. Hai lượt đồng thời dùng hai kết nối thật, lược đồ tạm thay cho ROLLBACK.
import { strict as assert } from "node:assert";
import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { after, before, test } from "node:test";
import { pathToFileURL } from "node:url";

import pg from "pg";

import { chayLamTuoi } from "../refresh-data-flow.mjs";

const DB_URL = process.env.DATABASE_URL ?? "";
if (!/\/oneinvest_suite_[a-z0-9_]+$/.test(DB_URL)) {
  throw new Error("so-moc-s03.itest: cần DATABASE_URL trỏ DB của riêng lượt oneinvest_suite_*, không chạy trên oneinvest");
}

const GOC = join(import.meta.dirname, "..", "..");
const APP = join(GOC, "app");
const SQL600 = readFileSync(join(GOC, "pipeline/sql/600_data_flow.sql"), "utf8");
const KIEM = "s03-moc-ngay";
const S = `sm1_${process.pid}`;
const TEN_UNG_DUNG = `sm1-dong-thoi-${process.pid}`;

const NGAY_D = "2026-11-18";
const NGAY_D1 = "2026-11-19";
const LUC_D = "2026-11-18T05:00:00Z"; // 12:00 giờ VN ngày 18/11
const LUC_D1 = "2026-11-19T05:00:00Z";
const COT = ["offers_total", "project_linked", "building_linked", "project_ranked", "building_ranked"];
const SAU_KHOA = ["building_linked", "building_ranked", "ngay", "offers_total", "project_linked", "project_ranked"];
const BANG_LIKE = ["stg_zalo_posts", "stg_chotot_ads", "stg_abnb_listings", "listings", "areas", "property_offers", "enrichment_proposals"];

/** Đột biến văn bản; khuôn lệch mã nguồn thì ném để phép đo không xanh oan. */
function doi(sql, tu, thanh) {
  const moi = sql.replace(tu, thanh);
  assert.notEqual(moi, sql, `khuôn đột biến không khớp 600: ${tu}`);
  return moi;
}

const urlLuocDo = () => {
  const u = new URL(DB_URL);
  u.searchParams.set("options", `-c search_path=${S}`);
  return u.toString();
};
async function noi(tenUngDung) {
  const c = new pg.Client({ connectionString: urlLuocDo(), application_name: tenUngDung });
  await c.connect();
  return c;
}

let admin;
before(async () => {
  admin = new pg.Client({ connectionString: DB_URL });
  await admin.connect();
  const { rows: [v] } = await admin.query(`SELECT pg_get_viewdef('public.sale_offers'::regclass, true) AS def`);
  await admin.query(`DROP SCHEMA IF EXISTS ${S} CASCADE`);
  await admin.query(`CREATE SCHEMA ${S}`);
  for (const t of BANG_LIKE) await admin.query(`CREATE TABLE ${S}.${t} (LIKE public.${t} INCLUDING DEFAULTS)`);
  await admin.query(`CREATE TABLE ${S}.sale_offer_records (LIKE public.sale_offer_records INCLUDING DEFAULTS)`);
  await admin.query(`CREATE TABLE ${S}.offer_price_rank (LIKE public.offer_price_rank INCLUDING DEFAULTS INCLUDING CONSTRAINTS INCLUDING INDEXES)`);
  await admin.query(`CREATE TABLE ${S}.dq_check_results (LIKE public.dq_check_results INCLUDING ALL)`);
  await admin.query(`CREATE TABLE ${S}.data_flow_snapshot (LIKE public.data_flow_snapshot INCLUDING ALL)`);
  await admin.query(`CREATE TABLE ${S}.offer_project (offer_id text PRIMARY KEY, source text, project_node_id bigint, status text,
    evidence text, catalog_tier text, n_posts int, n_posts_with_project int)`);
  // ON25: «Khớp toà» đọc bộ ghép toà offer_building (view của 117) — ở đây là bảng bốn cột để ô viết trước đếm được chính xác.
  await admin.query(`CREATE TABLE ${S}.offer_building (offer_id text PRIMARY KEY, status text, muc text, building_key text)`);
  await admin.query(`SET search_path = ${S}`);
  await admin.query(`CREATE VIEW ${S}.sale_offers AS ${v.def}`);
});
after(async () => {
  await admin?.query(`DROP SCHEMA IF EXISTS ${S} CASCADE`).catch(() => {});
  await admin?.end();
});

const donSach = () => admin.query(`TRUNCATE sale_offer_records, offer_project, offer_building, offer_price_rank, dq_check_results, data_flow_snapshot`);

let dem = 0;
/** Một tin của ma trận: `duAn` true = một dự án, chuỗi = trạng thái khác; `cap`/`diem` là dòng hạng; `toa` = "status/muc" của dòng
 * offer_building (vd "gan/toa", "xung_dot/"); `blockRaw`/`unitNumber` là chữ toà, mã căn trên tin (ON25). */
async function tin({ nguon = "S03", kind = "sale", duAn = false, cap, diem = 50, nghi = false, ngayDau = LUC_D, toa, blockRaw = null,
  unitNumber = null } = {}) {
  const id = `sm1fx-${++dem}`;
  await admin.query(`INSERT INTO sale_offer_records (offer_id, kind, property_type, confidence, first_seen, last_seen, n_reposts, post_ids,
      source, field_provenance, offer_status, retired_at)
    VALUES ($1, $5, 'apartment', 'medium', $2, $2, 1, '{}', $3, '{}', 'active', $4)`, [id, ngayDau, nguon, nghi ? LUC_D : null, kind]);
  if (blockRaw !== null || unitNumber !== null) {
    await admin.query(`UPDATE sale_offer_records SET block_raw = $2, unit_number = $3 WHERE offer_id = $1`, [id, blockRaw, unitNumber]);
  }
  if (toa !== undefined) {
    const [st, muc] = toa.split("/");
    await admin.query(`INSERT INTO offer_building (offer_id, status, muc, building_key) VALUES ($1, $2, $3, 'bld_on25')`, [id, st, muc || null]);
  }
  if (duAn) {
    await admin.query(`INSERT INTO offer_project (offer_id, source, project_node_id, status, evidence, n_posts, n_posts_with_project)
      VALUES ($1, $2, 1, $3, 'bai', 1, 1)`, [id, nguon, duAn === true ? "mot_du_an" : duAn]);
  }
  if (cap !== undefined) {
    await admin.query(`INSERT INTO offer_price_rank (offer_id, kind, cap, hang_pct, run_id) VALUES ($1, $4, $2, $3, 'sm1')`, [id, cap, diem, kind]);
  }
  return id;
}

/** Lượt làm tươi thật trên kết nối riêng, ngày ghim qua `oneinvest.flow_now`. */
async function lamTuoi({ sql = SQL600, luc = LUC_D, tenUngDung = "sm1-lam-tuoi" } = {}) {
  const c = await noi(tenUngDung);
  try {
    await c.query(`SELECT set_config('oneinvest.flow_now', $1, false)`, [luc]);
    await chayLamTuoi(c, sql);
  } finally {
    await c.end().catch(() => {});
  }
}

const dongMoc = async () => (await admin.query(
  `SELECT id, check_name, entity, status, detail, checked_at FROM dq_check_results WHERE check_name = $1 ORDER BY id`, [KIEM])).rows;
const dongNgay = async (ngay) => (await dongMoc()).filter((r) => JSON.parse(r.detail).ngay === ngay);
const factsCua = async (w) => (await admin.query(`SELECT facts FROM data_flow_snapshot WHERE time_window = $1`, [w])).rows[0].facts;
async function chenMoc(ngay, so = {}) {
  const detail = JSON.stringify({ ngay, offers_total: 10, project_linked: 9, building_linked: 0, project_ranked: 8, building_ranked: 0, ...so });
  return (await admin.query(`INSERT INTO dq_check_results (check_name, entity, status, detail) VALUES ($1, 'S03', 'pass', $2) RETURNING id`,
    [KIEM, detail])).rows[0].id;
}
const lui = (ngay, n) => new Date(Date.parse(`${ngay}T00:00:00Z`) - n * 86400000).toISOString().slice(0, 10);

// ---------- AC-1: dòng ghi, bảng chung, nhãn, không migration ----------

async function kiemDongMoc(sql) {
  await donSach();
  await tin({ duAn: true, cap: "du_an" });
  await lamTuoi({ sql });
  const r = await dongMoc();
  assert.equal(r.length, 1, `${KIEM}: phải đúng một dòng, thấy ${r.length}`);
  assert.equal(r[0].entity, "S03", `${KIEM}: entity lệch`);
  assert.equal(r[0].status, "pass", `${KIEM}: status lệch`);
  const d = JSON.parse(r[0].detail);
  assert.deepEqual(Object.keys(d).sort(), SAU_KHOA, `${KIEM}: detail phải đúng sáu khoá`);
  assert.equal(d.ngay, NGAY_D, `${KIEM}: ngay lệch`);
  for (const k of COT) assert.equal(typeof d[k], "number", `${KIEM}: ${k} phải là số`);
}

/** Đọc hàm của app qua tsx ở tiến trình con: pipeline không có bộ nạp TypeScript cho import không đuôi của dq-labels. */
function docApp(tepNhan, tepKiem) {
  const ma = `const [n, k] = await Promise.all([import(${JSON.stringify(pathToFileURL(tepNhan).href)}), import(${JSON.stringify(pathToFileURL(tepKiem).href)})]);
    console.log(JSON.stringify({ nhan: n.dqCheckName(${JSON.stringify(KIEM)}, "S03"), sql: k.dqLatestSql() }));`;
  const r = spawnSync(process.execPath, ["--import", "tsx", "--input-type=module", "-e", ma], { cwd: APP, encoding: "utf8" });
  assert.equal(r.status, 0, `không đọc được hàm của app: ${r.stderr.slice(0, 400)}`);
  return JSON.parse(r.stdout.trim().split("\n").at(-1));
}
const TEP_NHAN = join(APP, "src/lib/dq-labels.ts");
const TEP_KIEM = join(APP, "src/lib/dq-checks.ts");

async function kiemBangChung(sqlBang) {
  await donSach();
  await admin.query(`INSERT INTO dq_check_results (check_name, entity, status, detail) VALUES ('dq-doi-chung', 'x', 'pass', 'chữ thường')`);
  await tin();
  await lamTuoi();
  const ten = (await admin.query(sqlBang)).rows.map((r) => r.check_name);
  assert.ok(ten.includes("dq-doi-chung"), "bảng chung phải còn dòng của kiểm khác");
  assert.ok(!ten.includes(KIEM), `${KIEM}: bảng chung của /ops/quality không được hiện dòng này`);
}
function kiemNhan(nhan) {
  assert.equal(nhan.known, true, `${KIEM}: dqCheckName chưa có nhãn`);
  assert.equal(nhan.text, "Số mốc S03 theo ngày", `${KIEM}: nhãn lệch`);
}

test("SM1-AC-1 lượt làm tươi ghi đúng một dòng, entity S03, status pass, detail đúng sáu khoá", { timeout: 120_000 }, async () => {
  await kiemDongMoc(SQL600);
});
test("SM1-AC-1 đột biến thêm khoá lạ vào detail thì đỏ, thông điệp nêu s03-moc-ngay", { timeout: 120_000 }, async () => {
  const pha = doi(SQL600, `'ngay', (SELECT d FROM today)::text,`, `'ngay', (SELECT d FROM today)::text, 'khoa_la', 1,`);
  await assert.rejects(() => kiemDongMoc(pha), /s03-moc-ngay: detail phải đúng sáu khoá/);
});
test("SM1-AC-1 bảng chung /ops/quality không hiện dòng số mốc", { timeout: 120_000 }, async () => {
  await kiemBangChung(docApp(TEP_NHAN, TEP_KIEM).sql);
});
test("SM1-AC-1 đột biến bỏ lọc ở dqLatestSql thì đỏ, thông điệp nêu s03-moc-ngay", { timeout: 120_000 }, async () => {
  const pha = doi(docApp(TEP_NHAN, TEP_KIEM).sql, ` AND check_name <> 's03-moc-ngay'`, "");
  await assert.rejects(() => kiemBangChung(pha), /s03-moc-ngay: bảng chung/);
});
test("SM1-AC-1 dqCheckName trả nhãn tiếng Việt", { timeout: 60_000 }, () => {
  kiemNhan(docApp(TEP_NHAN, TEP_KIEM).nhan);
});
test("SM1-AC-1 đột biến bỏ nhãn thì đỏ, thông điệp nêu s03-moc-ngay", { timeout: 60_000 }, () => {
  const tam = mkdtempSync(join(tmpdir(), "sm1-nhan-"));
  try {
    const nguon = readFileSync(TEP_NHAN, "utf8");
    const bo = doi(nguon, /^\s*"s03-moc-ngay":.*\n/m, "").replace(/from "\.\/([^"]+)"/g, (_, t) => `from ${JSON.stringify(join(APP, "src/lib", t))}`);
    const tep = join(tam, "dq-labels.ts");
    writeFileSync(tep, bo);
    assert.throws(() => kiemNhan(docApp(tep, TEP_KIEM).nhan), /s03-moc-ngay: dqCheckName chưa có nhãn/);
  } finally {
    rmSync(tam, { recursive: true, force: true });
  }
});
test("SM1-AC-1 nhánh không thêm tệp nào dưới db/migrations", () => {
  const git = (...a) => spawnSync("git", a, { cwd: GOC, encoding: "utf8" });
  const goc = git("merge-base", "origin/main", "HEAD");
  assert.equal(goc.status, 0, goc.stderr);
  const doiTep = git("diff", "--name-only", goc.stdout.trim(), "--", "db/migrations").stdout.trim();
  const chuaGhi = git("status", "--porcelain", "--", "db/migrations").stdout.trim();
  assert.equal(`${doiTep}${chuaGhi}`, "", `${KIEM}: nhánh đụng db/migrations`);
});

// ---------- AC-2: ma trận mỗi ô một tin ----------

/** [tên ô, tin, số viết trước theo COT]. */
const MA_TRAN = [
  ["S03 có một dự án, chưa hạng", { duAn: true }, [1, 1, 0, 0, 0]],
  ["S03 không dự án", {}, [1, 0, 0, 0, 0]],
  ["S03 dự án xung đột", { duAn: "xung_dot" }, [1, 0, 0, 0, 0]],
  ["S05 có dự án, hạng du_an", { nguon: "S05", duAn: true, cap: "du_an" }, [0, 0, 0, 0, 0]],
  ["S06 có dự án, hạng du_an", { nguon: "S06", duAn: true, cap: "du_an" }, [0, 0, 0, 0, 0]],
  ["hạng du_an có điểm", { duAn: true, cap: "du_an" }, [1, 1, 0, 1, 0]],
  ["hạng phan_khu có điểm", { duAn: true, cap: "phan_khu" }, [1, 1, 0, 1, 0]],
  ["hạng toa có điểm", { duAn: true, cap: "toa" }, [1, 1, 0, 1, 1]],
  ["hạng du_an không điểm", { duAn: true, cap: "du_an", diem: null }, [1, 1, 0, 0, 0]],
  ["hạng toa không điểm", { duAn: true, cap: "toa", diem: null }, [1, 1, 0, 0, 0]],
  ["hạng phuong có điểm, có dự án", { duAn: true, cap: "phuong" }, [1, 1, 0, 0, 0]],
  ["hạng phuong có điểm, không dự án", { cap: "phuong" }, [1, 0, 0, 0, 0]],
  ["không cấp hạng, không điểm", { duAn: true, cap: null, diem: null }, [1, 1, 0, 0, 0]],
  ["S03 đã nghỉ có dự án và hạng", { duAn: true, cap: "du_an", nghi: true }, [0, 0, 0, 0, 0]],
  ["tin bán có dự án, hạng du_an", { kind: "sale", duAn: true, cap: "du_an" }, [1, 1, 0, 1, 0]],
  ["tin thuê dài hạn có dự án, hạng du_an", { kind: "rent_lt", duAn: true, cap: "du_an" }, [1, 1, 0, 1, 0]],
];
const TONG_MA_TRAN = [13, 10, 0, 5, 1];

const soCua = (d) => COT.map((k) => d[k]);
async function soCuaO(sql, dsTin) {
  await donSach();
  for (const t of dsTin) await tin(t);
  await lamTuoi({ sql });
  const r = await dongNgay(NGAY_D);
  assert.equal(r.length, 1, `${KIEM}: phải đúng một dòng`);
  return soCua(JSON.parse(r[0].detail));
}
/** Chạy cả ma trận, gom mọi ô lệch vào một thông điệp nêu tên cột. */
async function kiemMaTran(sql) {
  const lech = [];
  for (const [ten, t, mong] of MA_TRAN) {
    const so = await soCuaO(sql, [t]);
    COT.forEach((k, i) => { if (so[i] !== mong[i]) lech.push(`cột ${k} ô «${ten}»: mong ${mong[i]}, thấy ${so[i]}`); });
  }
  assert.deepEqual(lech, [], `SM1-AC-2 lệch: ${lech.join("; ")}`);
}

for (const [ten, t, mong] of MA_TRAN) {
  test(`SM1-AC-2 ô «${ten}»`, { timeout: 60_000 }, async () => {
    assert.deepEqual(await soCuaO(SQL600, [t]), mong, `ô «${ten}» lệch theo thứ tự ${COT.join(", ")}`);
  });
}
test("SM1-AC-2 cả ma trận trong một lượt cộng đúng số viết trước", { timeout: 60_000 }, async () => {
  assert.deepEqual(await soCuaO(SQL600, MA_TRAN.map(([, t]) => t)), TONG_MA_TRAN);
});
const DOT_BIEN_AC2 = [
  ["bỏ lọc nguồn", (s) => doi(s, /(LEFT JOIN offer_price_rank r ON r\.offer_id = o\.offer_id\n)\s*WHERE o\.source = 'S03'\n/, "$1"), /cột offers_total/],
  ["chỉ đếm cap = 'du_an'", (s) => doi(s, `r.cap IN ('du_an', 'phan_khu', 'toa')`, `r.cap = 'du_an'`), /cột project_ranked ô «hạng phan_khu có điểm»/],
  ["đếm cả hạng không điểm", (s) => doi(s, `'project_ranked', count(*) FILTER (WHERE r.hang_pct IS NOT NULL AND r.cap IN`, `'project_ranked', count(*) FILTER (WHERE r.cap IN`), /cột project_ranked ô «hạng du_an không điểm»/],
  ["chỉ đếm tin bán", (s) => doi(s, `'project_ranked', count(*) FILTER (WHERE r.hang_pct IS NOT NULL AND r.cap IN`, `'project_ranked', count(*) FILTER (WHERE o.kind = 'sale' AND r.hang_pct IS NOT NULL AND r.cap IN`), /cột project_ranked ô «tin thuê dài hạn có dự án, hạng du_an»/],
];
for (const [ten, pha, mau] of DOT_BIEN_AC2) {
  test(`SM1-AC-2 đột biến ${ten} thì đỏ, thông điệp nêu tên cột`, { timeout: 180_000 }, async () => {
    await assert.rejects(() => kiemMaTran(pha(SQL600)), mau);
  });
}

/** ON25: 600 nối `toa_link` vào bộ ghép toà offer_building; chiều dương của `building_linked` đi qua bảng thật của lược đồ tạm. */
const TOA_RONG = "toa_link AS (SELECT NULL::text AS offer_id WHERE false),";
const DONG_TOA = "toa_link AS MATERIALIZED (SELECT offer_id FROM offer_building WHERE status = 'gan' AND muc = 'toa'),";
async function kiemKhopToa(pha = (s) => s) {
  await donSach();
  await tin({ duAn: true, toa: "gan/toa" });
  await tin({ nguon: "S05", duAn: true, toa: "gan/toa" });
  await tin({ duAn: true, nghi: true, toa: "gan/toa" });
  await lamTuoi({ sql: pha(SQL600) });
  const d = JSON.parse((await dongNgay(NGAY_D))[0].detail);
  assert.equal(d.building_linked, 1, `cột building_linked: ba tin khớp toà (S03 đang rao, S05, S03 đã nghỉ) phải đếm 1, thấy ${d.building_linked}`);
}
test("SM1-AC-2 đối chứng dương: ba tin có dòng gan/toa thì building_linked = 1", { timeout: 60_000 }, async () => {
  await kiemKhopToa();
});
test("SM1-AC-2 đột biến đặt cứng 0 cho building_linked thì đỏ, thông điệp nêu tên cột", { timeout: 60_000 }, async () => {
  const pha = (s) => doi(s, `'building_linked', count(*) FILTER (WHERE m.toa_khop)`, `'building_linked', 0`);
  await assert.rejects(() => kiemKhopToa(pha), /cột building_linked/);
});

// ---------- ON25 (ops-hien-dung-chang-s03): «Khớp toà» và «chờ khớp» đọc bộ ghép toà ----------

/** Ma trận viết trước AC-1: mỗi ô một tin, đo bằng một lượt làm tươi chỉ chứa tin của ô; giá trị là building_linked mong đợi. */
const O_KHOP_TOA = [
  ["S03 sống gan/toa", { toa: "gan/toa" }, 1],
  ["S03 sống gan/vung", { toa: "gan/vung" }, 0],
  ["S03 sống xung_dot", { toa: "xung_dot/" }, 0],
  ["S03 sống không dòng", {}, 0],
  ["S03 đã nghỉ gan/toa", { nghi: true, toa: "gan/toa" }, 0],
  ["S06 gan/toa", { nguon: "S06", toa: "gan/toa" }, 0],
];
async function kiemOKhopToa(sql = SQL600) {
  const loi = [];
  for (const [ten, o, mong] of O_KHOP_TOA) {
    await donSach();
    await tin({ duAn: true, ...o });
    await lamTuoi({ sql });
    const thay = JSON.parse((await dongNgay(NGAY_D))[0].detail).building_linked;
    if (thay !== mong) loi.push(`building_linked ô «${ten}»: mong ${mong}, thấy ${thay}`);
  }
  assert.deepEqual(loi, [], loi.join(" | "));
}
test("ON25-AC-1 building_linked đếm đúng tin S03 đang rao có dòng gan/toa, sáu ô viết trước", { timeout: 180_000 }, async () => {
  assert.ok(SQL600.includes(DONG_TOA), "ON25-AC-1: 600 không còn đúng dòng nối toa_link vào offer_building");
  await kiemOKhopToa();
});
test("ON25-AC-1 đột biến đặt toa_link về CTE rỗng thì đỏ, thông điệp nêu building_linked và ô gan/toa", { timeout: 180_000 }, async () => {
  await assert.rejects(() => kiemOKhopToa(doi(SQL600, DONG_TOA, TOA_RONG)), /building_linked ô «S03 sống gan\/toa»: mong 1, thấy 0/);
});
test("ON25-AC-1 đột biến bỏ điều kiện muc = 'toa' thì ô gan/vung đỏ", { timeout: 180_000 }, async () => {
  await assert.rejects(() => kiemOKhopToa(doi(SQL600, "WHERE status = 'gan' AND muc = 'toa'", "WHERE status = 'gan'")),
    /building_linked ô «S03 sống gan\/vung»: mong 0, thấy 1/);
});
test("ON25-AC-1 DB chưa có offer_building: bộ chạy thay dòng bằng CTE rỗng, lượt làm tươi không lỗi", { timeout: 60_000 }, async () => {
  const { toaKhiCoView, DONG_KHOP_TOA } = await import("../lib/than-600.mjs");
  assert.ok(DONG_KHOP_TOA.test(SQL600), "ON25-AC-1: bộ chạy không còn dò được dòng nối Khớp toà");
  const c = await noi("on25-khong-view");
  try {
    assert.equal(await toaKhiCoView(c, SQL600), SQL600, "ON25-AC-1: có bảng offer_building mà bộ chạy vẫn thay dòng");
    await donSach();
    await tin({ duAn: true });
    await admin.query(`ALTER TABLE offer_building RENAME TO offer_building_an`);
    try {
      const doiDong = await toaKhiCoView(c, SQL600);
      assert.ok(!DONG_KHOP_TOA.test(doiDong) && doiDong.includes(TOA_RONG), "ON25-AC-1: không có offer_building mà dòng nối không về CTE rỗng");
      await lamTuoi();
      assert.equal(JSON.parse((await dongNgay(NGAY_D))[0].detail).building_linked, 0, "ON25-AC-1: không có view thì building_linked = 0");
    } finally {
      await admin.query(`ALTER TABLE offer_building_an RENAME TO offer_building`);
    }
  } finally {
    await c.end().catch(() => {});
  }
});

/** Ma trận viết trước AC-2: ghi toà × khớp toà; giá trị là locatedPending (cửa sổ all, S03) mong đợi của ô. */
const O_CHO_KHOP = [
  ["block_raw + gan/toa", { blockRaw: "A1", toa: "gan/toa" }, 0],
  ["block_raw + không dòng", { blockRaw: "A1" }, 1],
  ["mã căn xx + gan/toa", { unitNumber: "A1-xx05", toa: "gan/toa" }, 0],
  ["mã căn xx + không dòng", { unitNumber: "A1-xx05" }, 1],
  ["không ghi + gan/toa", { toa: "gan/toa" }, 0],
  ["không ghi + không dòng", {}, 0],
];
async function kiemOChoKhop(sql = SQL600) {
  const loi = [];
  for (const [ten, o, mong] of O_CHO_KHOP) {
    await donSach();
    await tin({ duAn: true, ...o });
    await lamTuoi({ sql });
    const thay = (await factsCua("all")).sources.find((x) => x.source === "S03").locatedPending;
    if (thay !== mong) loi.push(`locatedPending ô «${ten}»: mong ${mong}, thấy ${thay}`);
  }
  assert.deepEqual(loi, [], loi.join(" | "));
}
test("ON25-AC-2 locatedPending chỉ đếm tin ghi toà hay mã căn xx chưa có dòng gan/toa, sáu ô viết trước", { timeout: 180_000 }, async () => {
  await kiemOChoKhop();
});
test("ON25-AC-2 đột biến bỏ «AND NOT m.toa_khop» thì đỏ, thông điệp nêu locatedPending và ô đã khớp", { timeout: 180_000 }, async () => {
  await assert.rejects(() => kiemOChoKhop(doi(SQL600, "FILTER (WHERE m.ghi_toa AND NOT m.toa_khop)", "FILTER (WHERE m.ghi_toa)")),
    /locatedPending ô «block_raw \+ gan\/toa»: mong 0, thấy 1/);
});

// ---------- AC-3: chạy lại cùng ngày, ngày kế, một giao dịch ----------

async function kiemChayLai(sql) {
  await donSach();
  await tin({ duAn: true });
  await lamTuoi({ sql });
  await tin({ duAn: true });
  await lamTuoi({ sql });
  const r = await dongNgay(NGAY_D);
  assert.equal(r.length, 1, `${KIEM}: chạy lại cùng ngày phải giữ một dòng, thấy ${r.length}`);
  assert.equal(JSON.parse(r[0].detail).offers_total, 2, `${KIEM}: chạy lại cùng ngày phải mang số mới`);
}
test("SM1-AC-3 làm tươi lại cùng ngày giữ một dòng, số là số mới", { timeout: 60_000 }, async () => {
  await kiemChayLai(SQL600);
});
test("SM1-AC-3 đột biến không xoá dòng hôm nay thì đỏ", { timeout: 60_000 }, async () => {
  const pha = doi(SQL600, `WHERE x.id = c.id AND c.j ->> 'ngay' = (SELECT d FROM today)::text`, `WHERE x.id = c.id AND false`);
  await assert.rejects(() => kiemChayLai(pha), /giữ một dòng, thấy 2/);
});
test("SM1-AC-3 làm tươi ngày kế thêm dòng, dòng ngày trước không đổi", { timeout: 60_000 }, async () => {
  await donSach();
  await tin({ duAn: true });
  await lamTuoi();
  const [truoc] = await dongNgay(NGAY_D);
  await tin({ duAn: true });
  await lamTuoi({ luc: LUC_D1 });
  assert.equal((await dongMoc()).length, 2, "ngày kế phải có hai dòng");
  assert.deepEqual((await dongNgay(NGAY_D))[0], truoc, "dòng ngày D phải giữ nguyên");
  assert.equal(JSON.parse((await dongNgay(NGAY_D1))[0].detail).offers_total, 2, "dòng ngày kế phải mang số mới");
});
test("SM1-AC-3 ngày lấy theo giờ VN: 00:30 VN thuộc ngày mới dù giờ UTC còn ngày cũ", { timeout: 60_000 }, async () => {
  await donSach();
  await tin();
  await lamTuoi({ luc: "2026-11-18T17:30:00Z" });
  assert.equal(JSON.parse((await dongMoc())[0].detail).ngay, NGAY_D1);
});

async function kiemNuaDem(sql) {
  await donSach();
  await tin({ duAn: true });
  await lamTuoi({ sql, luc: "2026-11-18T16:59:00Z" }); // 23:59 giờ VN ngày 18/11
  const [truoc] = await dongMoc();
  await tin({ duAn: true });
  await lamTuoi({ sql, luc: "2026-11-18T17:01:00Z" }); // 00:01 giờ VN ngày 19/11
  const ngay = (await dongMoc()).map((r) => JSON.parse(r.detail).ngay).sort();
  assert.deepEqual(ngay, [NGAY_D, NGAY_D1], `ranh nửa đêm giờ VN: 23:59 và 00:01 phải ra hai ngày, thấy ${ngay.join(", ")}`);
  assert.deepEqual((await dongNgay(NGAY_D))[0], truoc, "ranh nửa đêm giờ VN: dòng trước nửa đêm phải giữ nguyên");
}
test("SM1-AC-3 ranh nửa đêm giờ VN: 23:59 và 00:01 ra hai dòng khác ngày, dòng trước không đổi", { timeout: 60_000 }, async () => {
  await kiemNuaDem(SQL600);
});
test("SM1-AC-3 đột biến lấy ngày theo UTC thì đỏ", { timeout: 60_000 }, async () => {
  const pha = doi(SQL600, /AT TIME ZONE 'Asia\/Ho_Chi_Minh'\)::date AS d\n\)/, "AT TIME ZONE 'UTC')::date AS d\n)");
  await assert.rejects(() => kiemNuaDem(pha), /ranh nửa đêm giờ VN: 23:59 và 00:01 phải ra hai ngày/);
});

const CHEN_LOI = /^COMMIT;$/m;
async function kiemMotGiaoDich(sqlLoi) {
  await donSach();
  await tin({ duAn: true });
  await lamTuoi();
  const dongTruoc = await dongMoc();
  const snapTruoc = (await admin.query(`SELECT time_window, computed_at, facts FROM data_flow_snapshot ORDER BY 1`)).rows;
  await tin({ duAn: true });
  await assert.rejects(() => lamTuoi({ sql: sqlLoi }), /division by zero/);
  const dongSau = await dongMoc();
  const snapSau = (await admin.query(`SELECT time_window, computed_at, facts FROM data_flow_snapshot ORDER BY 1`)).rows;
  assert.deepEqual(dongSau, dongTruoc, `một giao dịch: lỗi sau bước ghi mà dòng ${KIEM} đã đổi`);
  assert.deepEqual(snapSau, snapTruoc, "một giao dịch: lỗi sau bước ghi mà data_flow_snapshot đã đổi");
}
test("SM1-AC-3 lỗi sau bước ghi: dòng số mốc và data_flow_snapshot cùng giữ số cũ", { timeout: 60_000 }, async () => {
  await kiemMotGiaoDich(doi(SQL600, CHEN_LOI, "SELECT 1/0;\n\nCOMMIT;"));
});
test("SM1-AC-3 đột biến chốt giao dịch trước chỗ lỗi thì đỏ, thông điệp nêu giao dịch", { timeout: 60_000 }, async () => {
  const pha = doi(SQL600, CHEN_LOI, "COMMIT;\nBEGIN;\nSELECT 1/0;\nCOMMIT;");
  await assert.rejects(() => kiemMotGiaoDich(pha), /một giao dịch: lỗi sau bước ghi/);
});

// ---------- AC-4: khớp màn chặng, chuỗi 30 ngày ----------

async function kiemKhopMan(sql) {
  await donSach();
  await tin({ duAn: true, ngayDau: "2026-10-20T05:00:00Z" }); // ngoài cửa sổ 7d và 30d
  await tin({ duAn: true });
  await tin();
  await tin({ nguon: "S05", duAn: true });
  await lamTuoi({ sql });
  const [r] = await dongNgay(NGAY_D);
  const d = JSON.parse(r.detail);
  const s03 = (await factsCua("all")).sources.find((x) => x.source === "S03");
  assert.equal(d.project_linked, s03.located, `project_linked ${d.project_linked} phải bằng located ${s03.located} của S03 cửa sổ all`);
  assert.equal(d.offers_total, s03.offers, `offers_total ${d.offers_total} phải bằng offers ${s03.offers} của S03 cửa sổ all`);
  for (const w of ["7d", "30d", "all"]) {
    assert.deepEqual((await factsCua(w)).milestones.at(-1), d, `phần tử cuối facts.milestones cửa sổ ${w} phải bằng dòng hôm nay`);
  }
}
test("SM1-AC-4 số mốc khớp ô S03 cửa sổ all, phần tử cuối bằng dòng hôm nay ở cả ba cửa sổ", { timeout: 60_000 }, async () => {
  await kiemKhopMan(SQL600);
});
test("SM1-AC-4 đột biến lấy located từ cửa sổ 7d thì đỏ", { timeout: 60_000 }, async () => {
  const pha = doi(SQL600, `'project_linked', count(*) FILTER (WHERE m.located)`,
    `'project_linked', count(*) FILTER (WHERE m.located AND (o.first_seen AT TIME ZONE 'Asia/Ho_Chi_Minh')::date >= (SELECT d FROM today) - 6)`);
  await assert.rejects(() => kiemKhopMan(pha), /project_linked 1 phải bằng located 2/);
});

async function kiemChuoi(sql) {
  await donSach();
  await tin();
  for (let n = 34; n >= 1; n--) await chenMoc(lui(NGAY_D, n));
  await lamTuoi({ sql });
  const mong = Array.from({ length: 30 }, (_, i) => lui(NGAY_D, 29 - i));
  for (const w of ["7d", "30d", "all"]) {
    assert.deepEqual((await factsCua(w)).milestones.map((x) => x.ngay), mong, `chuỗi cửa sổ ${w} phải là 30 ngày gần nhất, tăng dần`);
  }
}
test("SM1-AC-4 đã có 35 ngày thì chuỗi đúng 30 phần tử, tăng dần theo ngày", { timeout: 60_000 }, async () => {
  await kiemChuoi(SQL600);
});
test("SM1-AC-4 đột biến chở quá 30 ngày thì đỏ", { timeout: 60_000 }, async () => {
  await assert.rejects(() => kiemChuoi(doi(SQL600, "DESC LIMIT 29)", "DESC LIMIT 34)")), /30 ngày gần nhất/);
});
test("SM1-AC-4 đột biến đảo thứ tự chuỗi thì đỏ", { timeout: 60_000 }, async () => {
  await assert.rejects(() => kiemChuoi(doi(SQL600, "jsonb_agg(x.j ORDER BY x.j ->> 'ngay')", "jsonb_agg(x.j ORDER BY x.j ->> 'ngay' DESC)")), /tăng dần/);
});

// ---------- AC-5: không đụng dòng khác, hai lượt đồng thời ----------

async function kiemGiuDong(sql) {
  await donSach();
  await tin();
  const homTruoc = lui(NGAY_D, 1);
  const khac = [
    ["dq-kiem-khac", "x", "pass", "chữ không phải JSON"],
    ["do1-giu-nhap", "S03", "warn", JSON.stringify({ ngay: NGAY_D })],
  ];
  for (const k of khac) await admin.query(`INSERT INTO dq_check_results (check_name, entity, status, detail) VALUES ($1, $2, $3, $4)`, k);
  await chenMoc(homTruoc);
  await chenMoc(lui(NGAY_D, 2));
  // Mọi dòng trừ dòng số mốc của hôm nay; lọc ở JS vì `detail` của kiểm khác không phải JSON.
  const doc = async () => (await admin.query(`SELECT id, check_name, entity, status, detail, checked_at FROM dq_check_results ORDER BY id`)).rows
    .filter((r) => r.check_name !== KIEM || JSON.parse(r.detail).ngay !== NGAY_D);
  const truoc = await doc();
  assert.equal(truoc.length, 4, "fixture phải có bốn dòng cần giữ");
  await lamTuoi({ sql });
  assert.deepEqual(await doc(), truoc, `dòng của kiểm khác và dòng ${KIEM} ngày khác phải giữ nguyên id và nội dung`);
}
test("SM1-AC-5 dòng của kiểm khác cùng ngày và dòng số mốc ngày khác giữ nguyên id, nội dung", { timeout: 60_000 }, async () => {
  await kiemGiuDong(SQL600);
});
test("SM1-AC-5 đột biến bỏ điều kiện ngày ở bước xoá thì đỏ", { timeout: 60_000 }, async () => {
  const pha = doi(SQL600, `WHERE x.id = c.id AND c.j ->> 'ngay' = (SELECT d FROM today)::text`, `WHERE x.id = c.id`);
  await assert.rejects(() => kiemGiuDong(pha), /phải giữ nguyên id và nội dung/);
});

/** Chờ tới khi cả hai lượt cùng đứng chờ khoá, để hai câu ghi chắc chắn chạy chồng lên nhau chứ không nhờ may. */
async function choHaiLuotKet() {
  const han = Date.now() + 30_000;
  for (;;) {
    const { rows: [r] } = await admin.query(`SELECT count(*)::int AS n FROM pg_stat_activity WHERE application_name = $1 AND wait_event_type = 'Lock'`, [TEN_UNG_DUNG]);
    if (r.n === 2) return;
    assert.ok(Date.now() < han, `hai lượt không cùng đứng chờ khoá trong 30 giây (thấy ${r.n})`);
    await new Promise((x) => setTimeout(x, 50));
  }
}
async function kiemDongThoi(sql, { snapshotRong }) {
  await donSach();
  await tin({ duAn: true });
  if (!snapshotRong) {
    await lamTuoi();
    await admin.query(`DELETE FROM dq_check_results`);
  }
  // Giữ khoá trên bảng hạng: câu ghi của mỗi lượt dừng ở đây, nhả ra thì hai lượt cùng đi tiếp.
  const chan = await noi("sm1-chan");
  let kq;
  try {
    await chan.query(`BEGIN`);
    await chan.query(`LOCK TABLE offer_price_rank IN ACCESS EXCLUSIVE MODE`);
    const hai = [lamTuoi({ sql, tenUngDung: TEN_UNG_DUNG }), lamTuoi({ sql, tenUngDung: TEN_UNG_DUNG })];
    const xong = Promise.allSettled(hai);
    try {
      await choHaiLuotKet();
    } finally {
      await chan.query(`COMMIT`);
    }
    kq = await xong;
  } finally {
    await chan.end().catch(() => {});
  }
  const loi = kq.filter((x) => x.status === "rejected").map((x) => x.reason.message);
  assert.deepEqual(loi, [], `khoá advisory: hai lượt đồng thời phải cùng xong, lượt lỗi: ${loi.join("; ")}`);
  assert.equal((await dongNgay(NGAY_D)).length, 1, `khoá advisory: hai lượt đồng thời phải để lại đúng một dòng ${KIEM} hôm nay`);
}
test("SM1-AC-5 hai lượt đồng thời trên bảng snapshot rỗng: cùng xong, đúng một dòng hôm nay", { timeout: 90_000 }, async () => {
  await kiemDongThoi(SQL600, { snapshotRong: true });
});
test("SM1-AC-5 hai lượt đồng thời khi đã có snapshot: cùng xong, đúng một dòng hôm nay", { timeout: 90_000 }, async () => {
  await kiemDongThoi(SQL600, { snapshotRong: false });
});
test("SM1-AC-5 đột biến bỏ khoá advisory thì đỏ", { timeout: 90_000 }, async () => {
  const pha = doi(SQL600, `SELECT pg_advisory_xact_lock(hashtext('s03-moc-ngay'));\n`, "");
  await assert.rejects(() => kiemDongThoi(pha, { snapshotRong: true }), /khoá advisory/);
});
