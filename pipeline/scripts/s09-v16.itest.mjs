// s09-v16.itest.mjs — DA56 nap-s09-quy-can-va-can-cao-tang: itest trên DB thử oneinvest_dbv_s56_<pid> dựng từ db/migrations
// (taoDbThu, đủ tới 130); xoá khi xong. Không bao giờ đụng DB `oneinvest`.
// Chạy: node --test --test-concurrency=1 pipeline/scripts/s09-v16.itest.mjs
//   AC-3 ma trận sáu ô quỹ căn · AC-4 ma trận năm ô căn cao tầng (dòng stg viết trước, mã tiền tố q56) ·
//   AC-1 nạp hai lần + sai băm · AC-2/AC-9 chuỗi cấy (tên miền giả lập, toạ độ giả lập) không vào stg, log, danh sách sync.
// Chiều đỏ của view: DBV_MIG_THAY=<bản chép 130 đã đột biến> node --test … (khung db-thu-dbv.mjs thay tệp cùng tên).
import { after, before, test } from "node:test";
import assert from "node:assert/strict";
import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { gunzipSync } from "node:zlib";
import pg from "pg";
import { GOC, taoDbThu, xoaDbThu } from "./db-thu-dbv.mjs";
import { napDanhBaThuMuc } from "../import-s09-danh-ba.mjs";
import { FILL } from "../sync-cloud.mjs";

const TEN = `oneinvest_dbv_s56_${process.pid}`;
const FIX = join(GOC, "pipeline/tests/fixtures/s09-v16");
const CHUOI_CAY = ["cdn.gia-lap.test", "7.654321", "1.234567"];
let db, URL_THU;

const S1 = "q56__s09-danh-ba__1", S2 = "q56__s09-danh-ba__2";
const T1 = "2026-11-24T03:00:00Z", T2 = "2026-11-24T05:00:00Z"; // S2 MỚI hơn S1
let dongSo = 0;
const can = (id, gia = 100) => ({ id, property_code: `Q.${id}`, property_type: ["Chung cư"], number_of_bedrooms: 2, number_of_bathrooms: [1],
  min_area: 70, max_area: 70, min_selling_price: gia, max_selling_price: gia, min_unit_price: 1, max_unit_price: 1, status: "ON_STOCK",
  available_for_sale_status: "AVAILABLE", block_id: "q56-toa" });
const qc = (snap, duAn, trang, cans, tong, { code = "200", fetched = snap === S1 ? T1 : T2 } = {}) => db.query(
  `INSERT INTO stg_s09_danh_ba (snapshot_id, dong, kind, source_id, payload, meta, fetched_at) VALUES ($1,$2,'quy-can',$3,$4::jsonb,$5::jsonb,$6)`,
  [snap, ++dongSo, duAn, JSON.stringify({ data: cans, meta: { code, page: trang, size: 200, total: tong } }),
    JSON.stringify({ duAnId: duAn, trang, size: 200, soCanNhan: cans.length, tongNguon: tong, status: Number(code) }), fetched]);
const tg = (snap, tang, cans, { code = 200, fetched = snap === S1 ? T1 : T2 } = {}) => db.query(
  `INSERT INTO stg_s09_danh_ba (snapshot_id, dong, kind, source_id, payload, meta, fetched_at) VALUES ($1,$2,'can-cao-tang',$3,$4::jsonb,$5::jsonb,$6)`,
  [snap, ++dongSo, tang, JSON.stringify({ code, data: cans }),
    JSON.stringify({ duAnId: "q56-da", toaId: "q56-toa", toaTen: "Tòa Q", tangId: tang, tangTen: `Tầng ${tang}`, status: code, soCan: cans.length }), fetched]);
const cc = (id, code = `Q-${id}`, name = code) => ({ id, code, name, increment_number: 1 });

before(async () => {
  URL_THU = await taoDbThu(TEN);
  db = new pg.Client({ connectionString: URL_THU });
  await db.connect();
  for (const s of [S1, S2]) await db.query(`INSERT INTO airbnb_snapshots (snapshot_id, city, source, manifest) VALUES ($1,'vn','s09-danh-ba','{}')`, [s]);
  // ---- AC-3 ma trận sáu ô (mỗi ô một dự án) ----
  await qc(S1, "hong-truoc-du", 1, [can("a3")], 3);                                   // S1 hỏng: chỉ trang 1
  await qc(S2, "hong-truoc-du", 0, [can("a1"), can("a2")], 3); await qc(S2, "hong-truoc-du", 1, [can("a3")], 3);
  await qc(S1, "hong-sau-du", 0, [can("b1"), can("b2")], 3); await qc(S1, "hong-sau-du", 1, [can("b3")], 3);
  await qc(S2, "hong-sau-du", 1, [can("b3")], 3);                                     // S2 hỏng, MỚI hơn bản đủ
  await qc(S1, "can-hai-trang", 0, [can("c1"), can("c2")], 2); await qc(S1, "can-hai-trang", 1, [can("c2")], 2);
  await qc(S1, "thieu-trang", 0, [can("d1"), can("d2")], 4);                          // tổng nguồn 4, chỉ một trang
  await qc(S1, "chi-ban-hong", 1, [can("e1")], 2); await qc(S1, "chi-ban-hong", 2, [can("e2")], 2);
  await qc(S1, "hai-ban-du-khac-gia", 0, [can("g1", 100)], 1); await qc(S2, "hai-ban-du-khac-gia", 0, [can("g1", 200)], 1);
  // ---- AC-4 ma trận năm ô (mỗi ô một tầng) ----
  await tg(S1, "tot-roi-loi", [cc("u1"), cc("u2")]); await tg(S2, "tot-roi-loi", [], { code: 500 });
  await tg(S1, "loi-roi-tot", [], { code: 500 }); await tg(S2, "loi-roi-tot", [cc("u3")]);
  await tg(S1, "tot-roi-rong", [cc("u4")]); await tg(S2, "tot-roi-rong", []);
  await tg(S1, "code-khac-name", [cc("u5", "A-05-01", "A5.01")]);
  await tg(S1, "tang-hai-ban", [cc("u6"), cc("u7")]); await tg(S2, "tang-hai-ban", [cc("u6"), cc("u7"), cc("u8")]);
});
after(async () => { await db?.end().catch(() => {}); await xoaDbThu(TEN); });

const rows = async (sql, p = []) => (await db.query(sql, p)).rows;
const quyCan = (duAn) => rows(`SELECT can_id, gia_ban_min::float AS gia, snapshot_id FROM v_s09_db_quy_can WHERE du_an_id = $1 ORDER BY can_id`, [duAn]);
const doiSoat = (duAn) => rows(`SELECT snapshot_id, so_trang, so_id, tong_nguon, du FROM v_s09_db_quy_can_doi_soat WHERE du_an_id = $1 ORDER BY snapshot_id`, [duAn]);
const canTang = (tang) => rows(`SELECT can_id, ma, ten, snapshot_id FROM v_s09_db_can_cao_tang WHERE tang_id = $1 ORDER BY can_id`, [tang]);

test("AC-3 ma trận quỹ căn — sáu ô viết trước, mỗi ô một assert trạng thái trọn của dự án", async () => {
  const MA_TRAN = {
    "hong-truoc-du": { can: [["a1", 100, S2], ["a2", 100, S2], ["a3", 100, S2]],
      doiSoat: [[S1, 1, 1, null, false], [S2, 2, 3, 3, true]] },
    "hong-sau-du": { can: [["b1", 100, S1], ["b2", 100, S1], ["b3", 100, S1]],
      doiSoat: [[S1, 2, 3, 3, true], [S2, 1, 1, null, false]] },
    "can-hai-trang": { can: [["c1", 100, S1], ["c2", 100, S1]], doiSoat: [[S1, 2, 2, 2, true]] },
    "thieu-trang": { can: [], doiSoat: [[S1, 1, 2, 4, false]] },
    "chi-ban-hong": { can: [], doiSoat: [[S1, 2, 2, null, false]] },
    "hai-ban-du-khac-gia": { can: [["g1", 200, S2]], doiSoat: [[S1, 1, 1, 1, true], [S2, 1, 1, 1, true]] },
  };
  let soAssert = 0;
  for (const [o, mong] of Object.entries(MA_TRAN)) {
    const thuc = {
      can: (await quyCan(o)).map((r) => [r.can_id, r.gia, r.snapshot_id]),
      doiSoat: (await doiSoat(o)).map((r) => [r.snapshot_id, r.so_trang, r.so_id, r.tong_nguon, r.du]),
    };
    assert.deepEqual(thuc, mong, `ô «${o}»`);
    soAssert++;
  }
  assert.equal(soAssert, 6);
  // không dòng đối soát nào có du rỗng
  assert.equal((await rows("SELECT count(*)::int AS n FROM v_s09_db_quy_can_doi_soat WHERE du IS NULL"))[0].n, 0);
});

test("AC-4 ma trận căn cao tầng — năm ô viết trước, mỗi ô một assert trạng thái trọn của tầng", async () => {
  const MA_TRAN = {
    "tot-roi-loi": [["u1", "Q-u1", "Q-u1", S1], ["u2", "Q-u2", "Q-u2", S1]],
    "loi-roi-tot": [["u3", "Q-u3", "Q-u3", S2]],
    "tot-roi-rong": [["u4", "Q-u4", "Q-u4", S1]],
    "code-khac-name": [["u5", "A-05-01", "A5.01", S1]],
    "tang-hai-ban": [["u6", "Q-u6", "Q-u6", S2], ["u7", "Q-u7", "Q-u7", S2], ["u8", "Q-u8", "Q-u8", S2]],
  };
  let soAssert = 0;
  for (const [o, mong] of Object.entries(MA_TRAN)) {
    assert.deepEqual((await canTang(o)).map((r) => [r.can_id, r.ma, r.ten, r.snapshot_id]), mong, `ô «${o}»`);
    soAssert++;
  }
  assert.equal(soAssert, 5);
  const [r] = await rows("SELECT du_an_id, toa_id, toa_ten, tang_id, tang_ten FROM v_s09_db_can_cao_tang WHERE can_id = 'u5'");
  assert.deepEqual(r, { du_an_id: "q56-da", toa_id: "q56-toa", toa_ten: "Tòa Q", tang_id: "code-khac-name", tang_ten: "Tầng code-khac-name" });
});

// ---- Bộ nạp trên fixture sinh từ khuôn bản thu thật ----
const docFix = (ten) => JSON.parse(gunzipSync(readFileSync(join(FIX, ten, "items-0001.json.gz"))).toString("utf8"));
const BAN = ["vn__s09-danh-ba__F-hong", "vn__s09-danh-ba__F-du", "vn__s09-danh-ba__F-tang"];
const nhatKy = [];
async function napGhiLog(thuMuc) {
  const cu = { log: console.log, error: console.error, warn: console.warn };
  const ghi = (...a) => nhatKy.push(a.map(String).join(" "));
  Object.assign(console, { log: ghi, error: ghi, warn: ghi });
  try {
    return await napDanhBaThuMuc(thuMuc, URL_THU);
  } finally {
    Object.assign(console, cu);
  }
}

test("AC-1 nạp hai lần: lần một đúng số dòng hợp lệ từng kind, lần hai 0 dòng; item hỏng đếm theo lý do", async () => {
  for (const ban of BAN) {
    const items = docFix(ban);
    const hopLe = items.filter((i) => i && typeof i === "object" && String(i.kind ?? "").trim() && String(i.sourceId ?? "").trim());
    const mong = {};
    for (const i of hopLe) mong[i.kind] = (mong[i.kind] ?? 0) + 1;
    const r1 = await napGhiLog(join(FIX, ban));
    assert.equal(r1.ghi, hopLe.length, `${ban}: lần một`);
    assert.equal(r1.boTheoLyDo.thieu_source_id, items.filter((i) => i && i.kind && !String(i.sourceId ?? "").trim()).length, `${ban}: thieu_source_id`);
    const theoKind = Object.fromEntries((await rows(
      "SELECT kind, count(*)::int AS n FROM stg_s09_danh_ba WHERE snapshot_id = $1 GROUP BY kind", [ban])).map((x) => [x.kind, x.n]));
    assert.deepEqual(theoKind, mong, `${ban}: số dòng theo kind`);
    const r2 = await napGhiLog(join(FIX, ban));
    assert.equal(r2.ghi, 0, `${ban}: lần hai`);
  }
  assert.ok(docFix("vn__s09-danh-ba__F-du").some((i) => i.sourceId === undefined), "fixture phải có item thiếu sourceId");
});

test("AC-1 sai băm: sửa một byte tệp items → lượt dừng nêu «sai băm», 0 dòng được ghi", async () => {
  const tam = mkdtempSync(join(tmpdir(), "s56-sai-bam-"));
  try {
    const dir = join(tam, "vn__s09-danh-ba__F-sai");
    cpSync(join(FIX, "vn__s09-danh-ba__F-du"), dir, { recursive: true });
    const m = JSON.parse(readFileSync(join(dir, "manifest.json"), "utf8"));
    writeFileSync(join(dir, "manifest.json"), JSON.stringify({ ...m, snapshotId: "vn__s09-danh-ba__F-sai" }));
    const tep = join(dir, "items-0001.json.gz");
    const buf = readFileSync(tep);
    buf[buf.length - 5] ^= 0xff;
    writeFileSync(tep, buf);
    await assert.rejects(napGhiLog(dir), /sai băm/);
    assert.equal((await rows("SELECT count(*)::int AS n FROM stg_s09_danh_ba WHERE snapshot_id = 'vn__s09-danh-ba__F-sai'"))[0].n, 0);
    assert.equal((await rows("SELECT count(*)::int AS n FROM airbnb_snapshots WHERE snapshot_id = 'vn__s09-danh-ba__F-sai'"))[0].n, 0);
  } finally {
    rmSync(tam, { recursive: true, force: true });
  }
});

test("AC-2, AC-9 chuỗi cấy (tên miền giả lập, toạ độ giả lập) không có trong stg, log bộ nạp, view; danh sách sync không có stg hay view mới", async () => {
  // tiền đề: fixture thật sự mang chuỗi cấy, để «không có» không phải «rỗng bằng rỗng»
  const tho = BAN.map((b) => JSON.stringify(docFix(b))).join("");
  for (const s of CHUOI_CAY) assert.ok(tho.includes(s), `fixture phải mang chuỗi cấy ${s}`);
  const stg = (await rows("SELECT payload::text AS p FROM stg_s09_danh_ba WHERE snapshot_id = ANY($1)", [BAN])).map((r) => r.p).join("");
  const view = JSON.stringify(await rows("SELECT * FROM v_s09_db_quy_can")) + JSON.stringify(await rows("SELECT * FROM v_s09_db_can_cao_tang"));
  for (const s of CHUOI_CAY) {
    assert.equal(stg.includes(s), false, `stg còn chuỗi cấy ${s} (galleries/geolocation)`);
    assert.equal(nhatKy.join("\n").includes(s), false, `log bộ nạp còn chuỗi cấy ${s}`);
    assert.equal(view.includes(s), false, `view còn chuỗi cấy ${s}`);
  }
  assert.equal(/https?:/.test(stg), false, "stg còn chuỗi http");
  assert.ok(nhatKy.some((l) => /bỏ khoá tầng A ở [1-9]\d* căn/.test(l)), "bộ nạp phải in số căn đã bỏ khoá");
  const ten = FILL.map((f) => (typeof f === "string" ? f : f.table ?? f.name ?? JSON.stringify(f)));
  for (const t of ["stg_s09_danh_ba", "v_s09_db_quy_can", "v_s09_db_quy_can_doi_soat", "v_s09_db_can_cao_tang"]) {
    assert.equal(ten.some((x) => x === t || x.includes(`"${t}"`)), false, `FILL của sync-cloud có ${t}`);
  }
});

test("AC-3 trên fixture: dự án lỗi và trang rỗng không ra căn sai; bản hỏng trước bản đủ không che bản đủ", async () => {
  const du = docFix("vn__s09-danh-ba__F-du").filter((i) => i?.kind === "quy-can" && i.sourceId && i.payload?.meta?.code === "200");
  const mong = new Set(du.flatMap((i) => i.payload.data.map((c) => `${i.meta.duAnId}|${c.id}`)));
  const thuc = new Set((await rows(`SELECT du_an_id, can_id FROM v_s09_db_quy_can WHERE snapshot_id = 'vn__s09-danh-ba__F-du'`))
    .map((r) => `${r.du_an_id}|${r.can_id}`));
  assert.deepEqual([...thuc].sort(), [...mong].sort());
  const loi = await rows(`SELECT du FROM v_s09_db_quy_can_doi_soat WHERE du_an_id = 'q-du-an-loi'`);
  assert.deepEqual(loi.map((r) => r.du), [false]);
  const hong = await rows(`SELECT du, tong_nguon FROM v_s09_db_quy_can_doi_soat WHERE snapshot_id = 'vn__s09-danh-ba__F-hong'`);
  assert.ok(hong.length > 0 && hong.every((r) => r.du === false && r.tong_nguon === null), "bản hỏng: mọi dòng du = false, tong_nguon rỗng");
});
