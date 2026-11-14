// tap-nhan-hai-khu.itest.mjs — hồ sơ tap-nhan-ghep-tin-hai-khu (PL35), ca DB «PL35-AC-n» (E1, E2, E5, E6, E7, E8).
// Chạy qua `bash pipeline/scripts/tap-nhan-hai-khu-db.sh itest` (DB thử oneinvest_u1_pl35 chép từ DB máy thu; cwd app/ để nạp
// mã TS thật của màn: ghiNhan, nhapTuDraft). Fixture viết trước nằm ở BẢNG TẠM cùng tên che bảng public trong phiên kết nối của ca
// (stg_zalo_posts, sale_offer_records, danh bạ) — bảng public không bị sửa; dòng eval_label_items của lát dọn đầu và cuối ca.
import { test } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdtempSync, readFileSync, readdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import pg from "pg";

import { layMau } from "../label-sample.mjs";
import { nhapLat } from "../label-nhap-ghep.mjs";
import { dongBangLat, docTapDongBang } from "../label-dong-bang.mjs";
import { LAT_HAI_KHU } from "../lib/mau-hai-khu.mjs";
import { phatBieuToaTruc } from "../lib/assert.mjs";

const URL = process.env.DATABASE_URL;
const LAT = LAT_HAI_KHU;
const VAI = "oneinvest_pl35_khong_fa"; // vai chạy lệnh không có quyền đọc field_assertions (AC-7)
const { ghiNhan } = await import("../../app/src/lib/labels-queries.ts");
const { nhapTuDraft } = await import("../../app/src/lib/labels-cuon-chieu.ts");

// ---- Fixture viết trước ----
const NHOM = { op1: "OCP1 cư dân mua bán", gp: "Grand Park chợ căn hộ", hai: "Grand Park và OCP1 giá tốt", khong: "Chợ căn hộ toàn quốc" };
const BAI = [];
const them = (id, nhom, text) => BAI.push({ post_id: `pl35-${id}`, group_name: nhom, text });
for (let i = 1; i <= 80; i++) them(`ot${String(i).padStart(3, "0")}`, NHOM.op1, `Bán căn 2PN toà QA1 tầng ${i}, giá ${i + 2} tỷ, liên hệ`);
for (const f of ["05", "12", "20"]) them(`or${f}`, NHOM.op1, `Chuyển nhượng căn QB2.${f}10 view hồ, sổ hồng`);
for (let i = 1; i <= 10; i++) them(`ok${String(i).padStart(2, "0")}`, NHOM.op1, `Cần bán gấp căn ${i} ngủ, giá thương lượng số ${i}`);
for (let i = 1; i <= 5; i++) them(`gt${i}`, NHOM.gp, `Bán căn toà QN1 số ${i}, nội thất đủ`);
for (let i = 1; i <= 4; i++) them(`gk${i}`, NHOM.gp, `Căn GP góc đẹp ${i}, xem nhà ngay`);
them("zd1", NHOM.op1, "Cần bán gấp căn 1 ngủ, giá thương lượng số 1"); // trùng chữ ok01 → bỏ, ok01 đại diện
them("zd2", NHOM.op1, "Cần bán gấp căn 1 ngủ, giá thương lượng số 1");
them("zs1", NHOM.op1, '{"type":"join","member":"x"}');               // bài sự kiện
them("zh1", NHOM.hai, "Bán căn QA1 giá tốt");                         // nhóm khớp hai khu
them("zn1", NHOM.khong, "Bán căn QA1 nhóm ngoài");                    // nhóm không khớp
them("zl1", NHOM.gp, "Cho thuê nhà phố mặt tiền đường lớn");          // chữ nêu loại nhà khác → không vào lát
const MONG_TANG = { "op1-toa": 75, "op1-truc": 3, "op1-khong": 10, "gp-toa": 5, "gp-khong": 4 };
const MONG_NHAN = { "op1-truc": "cho PL36", "op1-khong": "bắt buộc", "gp-toa": "bắt buộc", "gp-khong": "bắt buộc" };

async function dungFixture(c) {
  const { rows } = await c.query("SELECT current_database() AS db");
  assert.match(rows[0].db, /^oneinvest_(u1_pl35(_it)?|suite_[a-z0-9_]+)$/, `PL35 itest chỉ chạy trên DB thử, không trên ${rows[0].db}`);
  for (const t of ["stg_zalo_posts", "sale_offer_records", "buildings", "stacks", "asset_nodes", "registry_aliases"]) {
    await c.query(`CREATE TEMP TABLE ${t} (LIKE public.${t} INCLUDING DEFAULTS)`);
  }
  for (const b of BAI) {
    await c.query(`INSERT INTO pg_temp.stg_zalo_posts (post_id, snapshot_id, group_name, text, posted_at) VALUES ($1, 'pl35__fx__1', $2, $3, '2026-11-10T03:00:00Z')`,
      [b.post_id, b.group_name, b.text]);
  }
  await c.query(`INSERT INTO pg_temp.asset_nodes (id, node_type, name, slug, parent_id) VALUES
    (990001, 'project', 'OP1', 'vinhomes-ocean-park-1', NULL), (990002, 'project', 'GP', 'vinhomes-grand-park', NULL),
    (990003, 'subzone', 'Phân khu thử', 'pk-thu', 990001)`);
  await c.query(`INSERT INTO pg_temp.buildings (building_key, region_node_id, upi, iso_region, catalog_tier) VALUES
    ('bld_pl35_a1', 990003, 'u1', 'VN-HN', 'S09'), ('bld_pl35_b2', 990001, 'u2', 'VN-HN', 'S09'), ('bld_pl35_n1', 990002, 'u3', 'VN-SG', 'S09')`);
  await c.query(`INSERT INTO pg_temp.stacks (stack_key, building_key, catalog_tier) VALUES ('stk_pl35_b2_10', 'bld_pl35_b2', 'S09')`);
  await c.query(`INSERT INTO pg_temp.registry_aliases (id, object_key, kind, value, source) VALUES
    (990001, 'bld_pl35_a1', 'ten', 'QA1', 'S09'), (990002, 'bld_pl35_b2', 'ten', 'QB2', 'S09'), (990003, 'bld_pl35_n1', 'ten', 'QN1', 'S09'),
    (990004, 'stk_pl35_b2_10', 'ma_nguon', 'S09/QB2/10', 'S09')`);
  await c.query("DELETE FROM eval_label_items WHERE lat = $1", [LAT]);
}

async function moPhien() {
  const c = new pg.Client({ connectionString: URL });
  await c.connect();
  await dungFixture(c);
  return c;
}
async function dong(c) {
  await c.query("RESET ROLE").catch(() => {});
  await c.query("DELETE FROM eval_label_items WHERE lat = $1", [LAT]).catch(() => {});
  await c.end();
}
const bamTap = (refs) => createHash("sha256").update([...refs].sort().join("\n")).digest("hex");
const docTap = async (c) => (await c.query("SELECT ref_id, stratum FROM eval_label_items WHERE lat = $1 ORDER BY ref_id", [LAT])).rows;

/** Tác tử giả: đọc mã toà/căn trong chữ bằng mẫu cố định, trả nhãn kèm câu trích; bài «giá 7 tỷ» trả câu trích bịa cho toà. */
async function tacTuGia({ chu }) {
  const m = /\b(Q[A-Z]\d)(?:\.(\d{2})(\d{2}))?/.exec(chu);
  if (!m) return { building: { v: null, trich: null }, stack: { v: null }, unit_number: { v: null } };
  if (chu.includes("giá 7 tỷ")) return { building: { v: m[1], trich: "toà QZZ không có trong bài" } };
  return {
    building: { v: m[1], trich: m[0] },
    stack: m[3] ? { v: m[3], trich: m[0] } : { v: null },
    unit_number: m[2] ? { v: m[0], trich: `căn ${m[0]}` } : { v: null },
  };
}

test("PL35-AC-1 tất định: hai lần cùng seed cùng tập, lần hai thêm 0; seed khác tập khác; trùng chữ một đại diện", async () => {
  const c = await moPhien();
  try {
    const k1 = await layMau(c, { lat: LAT, seed: "s1", thu: false, haiKhu: { co: 75 } });
    const t1 = await docTap(c);
    const k2 = await layMau(c, { lat: LAT, seed: "s1", thu: false, haiKhu: { co: 75 } });
    const t2 = await docTap(c);
    assert.equal(bamTap(t1.map((r) => r.ref_id)), bamTap(t2.map((r) => r.ref_id)), "PL35-AC-1 hai lần cùng seed khác tập");
    assert.ok(k1.them > 0, "PL35-AC-1 lần một phải thêm dòng");
    assert.equal(k2.them, 0, "PL35-AC-1 lần hai phải thêm 0 dòng");
    const k3 = await layMau(c, { lat: `${LAT}-seed-khac`, seed: "s2", thu: true, haiKhu: { co: 5 } });
    const k1nho = await layMau(c, { lat: `${LAT}-seed-khac`, seed: "s1", thu: true, haiKhu: { co: 5 } });
    assert.notEqual(k3.chon, 0);
    // Cỡ 5 trên tầng op1-toa (80 bài): hai seed phải ra hai tập khác nhau — đọc qua tập ref_id của lần --thu.
    assert.equal(k1.bo_vi_trung, 2, "PL35-AC-1 hai bản trùng chữ của ok01 phải bị bỏ");
    assert.ok(t1.some((r) => r.ref_id === "pl35-ok01") && !t1.some((r) => r.ref_id.startsWith("pl35-zd")), "PL35-AC-1 đại diện trùng chữ là post_id nhỏ nhất");
    assert.equal(k1.bo_su_kien, 1, "PL35-AC-1 bài sự kiện phải bị gạt");
    assert.ok(k1nho && k3, "chạy được hai seed");
  } finally { await dong(c); }
});

test("PL35-AC-1 seed khác ra tập khác (đọc tập của lần --thu)", async () => {
  const { chonMauHaiKhu } = await import("../lib/mau-hai-khu.mjs");
  const db = { op1: { toa: [{ key: "a", ten: ["QA1"] }], truc: [] }, gp: { toa: [], truc: [] } };
  const a = chonMauHaiKhu(BAI, db, { seed: "s1", co: 5 }).chon.map((r) => r.ref_id);
  const b = chonMauHaiKhu(BAI, db, { seed: "s2", co: 5 }).chon.map((r) => r.ref_id);
  assert.notEqual(bamTap(a), bamTap(b), "PL35-AC-1 seed khác phải ra tập khác");
});

test("PL35-AC-2 mỗi tầng min(75, số bài khác nhau), stratum đúng tầng, nhãn thiếu cỡ; PL35-AC-3 bài chỉ vào lát khi nhóm khớp một khu", async () => {
  const c = await moPhien();
  try {
    const k = await layMau(c, { lat: LAT, seed: "s1", thu: false, haiKhu: { co: 75 } });
    const tap = await docTap(c);
    for (const [t, so] of Object.entries(MONG_TANG)) {
      assert.equal(tap.filter((r) => r.stratum === t).length, so, `PL35-AC-2 tầng ${t} phải chọn ${so}`);
      assert.equal(k.moiTangHaiKhu[t].chon, so, `PL35-AC-2 báo cáo tầng ${t}`);
    }
    for (const [t, nhan] of Object.entries(MONG_NHAN)) {
      assert.equal(k.moiTangHaiKhu[t].nhan, nhan, `PL35-AC-2 nhãn tầng ${t}`);
      assert.equal(k.moiTangHaiKhu[t].thieu, 75 - MONG_TANG[t], `PL35-AC-2 «thiếu N» tầng ${t}`);
      assert.ok(k.moiTangHaiKhu[t].wilson_toi_da > 0 && k.moiTangHaiKhu[t].wilson_toi_da < 0.95, `PL35-AC-2 Wilson tầng ${t}`);
    }
    assert.equal(k.moiTangHaiKhu["op1-toa"].nhan, undefined, "PL35-AC-2 tầng đủ không mang nhãn thiếu");
    assert.ok(tap.every((r) => r.stratum && r.stratum in MONG_TANG), "PL35-AC-2 stratum ngoài năm tầng");
    // AC-3: một assert mỗi loại nhóm.
    assert.ok(tap.some((r) => r.ref_id.startsWith("pl35-ot")), "PL35-AC-3 nhóm OP1 phải vào lát");
    assert.ok(tap.some((r) => r.ref_id.startsWith("pl35-g")), "PL35-AC-3 nhóm GP phải vào lát");
    assert.ok(!tap.some((r) => r.ref_id === "pl35-zh1"), "PL35-AC-3 nhóm khớp hai khu không vào lát");
    assert.ok(!tap.some((r) => r.ref_id === "pl35-zn1"), "PL35-AC-3 nhóm không khớp không vào lát");
    assert.ok(tap.filter((r) => r.ref_id.startsWith("pl35-g")).every((r) => r.stratum.startsWith("gp-")), "PL35-AC-3 khu ghi theo nhóm GP");
    assert.ok(!tap.some((r) => r.ref_id === "pl35-zl1") && k.bo_loai_khac === 1, "PL35 bài chữ nêu nhà phố không vào lát");
  } finally { await dong(c); }
});

test("PL35-AC-5 nháp: draft có ba ô kèm can_cu, câu trích không có trong bài thì ô trống, nhapTuDraft thật đọc ra đúng", async () => {
  const c = await moPhien();
  try {
    await layMau(c, { lat: LAT, seed: "s1", thu: false, haiKhu: { co: 75 } });
    const kq = await nhapLat(c, { lat: LAT, tacTu: tacTuGia });
    assert.ok(kq.ghi > 0, "PL35-AC-5 phải ghi nháp");
    const { rows } = await c.query(
      `SELECT i.item_id, i.ref_id, i.draft, p.text FROM eval_label_items i JOIN pg_temp.stg_zalo_posts p ON p.post_id = i.ref_id WHERE i.lat = $1 ORDER BY i.ref_id`, [LAT]);
    const truc = rows.find((r) => r.ref_id === "pl35-or12");
    assert.ok(truc, "PL35-AC-5 bài trục or12 phải trong lát");
    const nhap = nhapTuDraft(truc.draft);
    assert.ok(nhap, `PL35-AC-5 nhapTuDraft trả null cho ${truc.ref_id}`);
    assert.equal(nhap.cachDoc, "ghep");
    assert.deepEqual(nhap.o, { building: "QB2", stack: "10", unit_number: "QB2.1210" }, `PL35-AC-5 ô đọc qua nhapTuDraft sai cho ${truc.ref_id}`);
    const cc = truc.draft.cach_doc.ghep.can_cu;
    for (const f of ["building", "stack", "unit_number"]) assert.ok(truc.text.includes(cc[f].trich), `PL35-AC-5 can_cu.${f} phải có trong bài`);
    const bia = rows.find((r) => r.text.includes("giá 7 tỷ"));
    assert.ok(bia, "fixture có bài «giá 7 tỷ» trong lát");
    assert.equal(nhapTuDraft(bia.draft).o.building, undefined, `PL35-AC-5 câu trích bịa phải để trống ô toà (${bia.ref_id})`);
    const khong = rows.find((r) => r.ref_id === "pl35-ok02");
    assert.deepEqual(nhapTuDraft(khong.draft).o, {}, "PL35-AC-5 bài không nêu toà: không điền ô nào");
  } finally { await dong(c); }
});

test("PL35-AC-6 bài đã có nhãn người: draft không đổi, 0 dòng eval_labels mới; bài chưa có nhãn vẫn được nháp", async () => {
  const c = await moPhien();
  try {
    await layMau(c, { lat: LAT, seed: "s1", thu: false, haiKhu: { co: 75 } });
    const { rows: it } = await c.query("SELECT item_id::int, ref_id, double_label FROM eval_label_items WHERE lat = $1 ORDER BY item_id LIMIT 2", [LAT]);
    const [daGan, chuaGan] = it;
    const r = await ghiNhan(c, "nguoi-thu-1", LAT, daGan.item_id, [
      { field: "building", value: "QA1", not_stated: false, basis: "chu_bai" },
      { field: "stack", value: null, not_stated: true, basis: null },
      { field: "unit_number", value: null, not_stated: true, basis: null },
    ]);
    assert.equal(r.ok, true, `ghiNhan thật phải ghi được: ${JSON.stringify(r)}`);
    const truoc = await c.query("SELECT (SELECT draft::text FROM eval_label_items WHERE item_id = $1) AS d, (SELECT count(*)::int FROM eval_labels) AS so", [daGan.item_id]);
    await nhapLat(c, { lat: LAT, tacTu: tacTuGia, lamLai: true });
    const sau = await c.query("SELECT (SELECT draft::text FROM eval_label_items WHERE item_id = $1) AS d, (SELECT count(*)::int FROM eval_labels) AS so", [daGan.item_id]);
    assert.equal(sau.rows[0].d, truoc.rows[0].d, `PL35-AC-6 draft của item ${daGan.item_id} đã có nhãn người bị đổi`);
    assert.equal(sau.rows[0].so, truoc.rows[0].so, "PL35-AC-6 lệnh nháp không được ghi eval_labels");
    const { rows: dc } = await c.query("SELECT draft FROM eval_label_items WHERE item_id = $1", [chuaGan.item_id]);
    assert.ok(dc[0].draft?.cach_doc?.ghep, `PL35-AC-6 đối chứng: item ${chuaGan.item_id} chưa có nhãn phải được nháp`);
  } finally { await dong(c); }
});

test("PL35-AC-7 + AC-4 chọn mẫu và nháp chạy xong khi vai không đọc được field_assertions; cấy phát biểu PL20 không đổi tập; đột biến đọc thì lỗi quyền", async () => {
  const c = await moPhien();
  try {
    await c.query(`DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = '${VAI}') THEN EXECUTE 'DROP OWNED BY ${VAI}'; EXECUTE 'DROP ROLE ${VAI}'; END IF; END $$`);
    await c.query(`CREATE ROLE ${VAI} NOLOGIN`);
    await c.query(`GRANT USAGE ON SCHEMA public TO ${VAI}`);
    await c.query(`GRANT ALL ON ALL TABLES IN SCHEMA public TO ${VAI}`);
    await c.query(`GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO ${VAI}`);
    await c.query(`REVOKE ALL ON field_assertions FROM ${VAI}`);
    for (const t of ["stg_zalo_posts", "sale_offer_records", "buildings", "stacks", "asset_nodes", "registry_aliases"]) await c.query(`GRANT ALL ON pg_temp.${t} TO ${VAI}`);
    await c.query(`SET ROLE ${VAI}`);
    await assert.rejects(c.query("SELECT 1 FROM field_assertions LIMIT 1"), /permission denied/, "PL35-AC-7 vai thử phải không đọc được field_assertions");
    await layMau(c, { lat: LAT, seed: "s1", thu: false, haiKhu: { co: 75 } });
    const truoc = await docTap(c);
    const kn = await nhapLat(c, { lat: LAT, tacTu: tacTuGia });
    assert.ok(kn.ghi > 0, "PL35-AC-7 nháp phải chạy xong và ghi dưới vai không đọc field_assertions");
    // Cấy phát biểu toà/trục PL20 (bằng vai chủ) cho bài fixture — toà khác danh bạ để nếu bộ phân tầng đọc thì tầng sẽ đổi.
    await c.query("RESET ROLE");
    // field_assertions chỉ thêm (trigger chặn DELETE): cấy trong giao dịch, ROLLBACK ở finally.
    await c.query("BEGIN");
    const pb = phatBieuToaTruc("S03", BAI.filter((b) => /^pl35-o[tk]/.test(b.post_id)).map((b) => ({ post_id: b.post_id, posted_at: "2026-11-10T03:00:00Z", block: "QB2", unit: "QB2.0910" })), "pl35-cay");
    for (const r of pb) {
      await c.query(`INSERT INTO field_assertions (subject_key, field, value, evidence_tier, method, method_version, observed_at) VALUES ($1,$2,$3,$4,$5,$6,$7)`,
        [r.subject_key, r.field, r.value, r.evidence_tier, r.method, r.method_version, r.observed_at]);
    }
    try {
      await c.query(`SET ROLE ${VAI}`);
      const lai = await layMau(c, { lat: LAT, seed: "s1", thu: true, haiKhu: { co: 75 } });
      await c.query("RESET ROLE");
      const { chonMauHaiKhu } = await import("../lib/mau-hai-khu.mjs");
      assert.ok(lai && chonMauHaiKhu, "chọn lại chạy xong");
      const sau = await docTap(c);
      assert.equal(bamTap(sau.map((r) => `${r.ref_id}|${r.stratum}`)), bamTap(truoc.map((r) => `${r.ref_id}|${r.stratum}`)), "PL35-AC-4 cấy phát biểu PL20 làm đổi tập hoặc stratum");
      assert.equal(lai.chon, truoc.length, "PL35-AC-4 chọn lại (--thu) phải cùng cỡ");
      // Đột biến: chọn mẫu mà đọc field_assertions (client bọc chèn câu đọc trước mọi câu) → DB trả lỗi quyền.
      await c.query(`SET ROLE ${VAI}`);
      const dot = { query: async (...a) => { await c.query("SELECT count(*) FROM field_assertions"); return c.query(...a); } };
      await assert.rejects(layMau(dot, { lat: LAT, seed: "s1", thu: true, haiKhu: { co: 75 } }), /permission denied/, "PL35-AC-7 đột biến đọc field_assertions phải bị DB chặn");
    } finally {
      await c.query("ROLLBACK");
      await c.query("RESET ROLE");
    }
  } finally {
    await c.query("RESET ROLE").catch(() => {});
    await c.query(`DELETE FROM eval_label_items WHERE lat = $1`, [LAT]).catch(() => {});
    await c.query(`DROP OWNED BY ${VAI}`).catch(() => {});
    await c.query(`DROP ROLE IF EXISTS ${VAI}`).catch(() => {});
    await c.end();
  }
});

test("PL35-AC-8 đóng băng: hai lần cùng băm, đổi một nhãn đổi băm, một dòng mỗi ref_id, bài lệch bị loại, khoá đúng", async () => {
  const c = await moPhien();
  try {
    await layMau(c, { lat: LAT, seed: "s1", thu: false, haiKhu: { co: 75 } });
    const { rows: don } = await c.query("SELECT item_id::int, ref_id FROM eval_label_items WHERE lat = $1 AND NOT double_label ORDER BY item_id LIMIT 3", [LAT]);
    const { rows: doi } = await c.query("SELECT item_id::int, ref_id FROM eval_label_items WHERE lat = $1 AND double_label ORDER BY item_id LIMIT 2", [LAT]);
    assert.equal(doi.length, 2, "fixture cần hai bài gắn trùng");
    const ba = (b, s, u) => [
      { field: "building", value: b, not_stated: b === null, basis: b === null ? null : "chu_bai" },
      { field: "stack", value: s, not_stated: s === null, basis: s === null ? null : "chu_bai" },
      { field: "unit_number", value: u, not_stated: u === null, basis: u === null ? null : "chu_bai" },
    ];
    for (const d of don) assert.equal((await ghiNhan(c, "nguoi-1", LAT, d.item_id, ba("QA1", null, null))).ok, true);
    // Bài trùng khớp: hai người cùng nhãn. Bài trùng lệch: người hai ghi toà khác.
    assert.equal((await ghiNhan(c, "nguoi-1", LAT, doi[0].item_id, ba("QB2", "10", "QB2.1210"))).ok, true);
    assert.equal((await ghiNhan(c, "nguoi-2", LAT, doi[0].item_id, ba("QB2", "10", "QB2.1210"))).ok, true);
    assert.equal((await ghiNhan(c, "nguoi-1", LAT, doi[1].item_id, ba("QA1", null, null))).ok, true);
    assert.equal((await ghiNhan(c, "nguoi-2", LAT, doi[1].item_id, ba("QN1", null, null))).ok, true);
    const ra1 = mkdtempSync(join(tmpdir(), "pl35-db1-")), ra2 = mkdtempSync(join(tmpdir(), "pl35-db2-"));
    const a = await dongBangLat(c, { lat: LAT, ra: ra1 });
    const b = await dongBangLat(c, { lat: LAT, ra: ra2 });
    assert.equal(a.sha256, b.sha256, "PL35-AC-8 băm không ổn định giữa hai lần");
    const x = docTapDongBang(a.tep);
    assert.equal(x.sha256, a.sha256, "PL35-AC-8 băm trong tệp khác băm in ra");
    assert.equal(readFileSync(a.tep, "utf8"), readFileSync(b.tep, "utf8"), "PL35-AC-8 hai tệp cùng dữ liệu khác nội dung");
    assert.equal(x.so_dong, don.length + 1, "PL35-AC-8 số dòng = bài đơn + bài trùng khớp");
    assert.equal(x.so_bo_lech, 1, "PL35-AC-8 bài hai người lệch phải bị loại và đếm");
    assert.ok(!x.dong.some((r) => r.ref_id === doi[1].ref_id), `PL35-AC-8 bài lệch ${doi[1].ref_id} còn trong tệp`);
    assert.equal(new Set(x.dong.map((r) => r.ref_id)).size, x.dong.length, "PL35-AC-8 mỗi ref_id đúng một dòng");
    for (const r of x.dong) assert.deepEqual(Object.keys(r), ["building", "ref_id", "stack", "stratum", "unit_number"], `PL35-AC-8 khoá dòng ${r.ref_id}`);
    const khop = x.dong.find((r) => r.ref_id === doi[0].ref_id);
    assert.deepEqual([khop.building, khop.stack, khop.unit_number], ["QB2", "10", "QB2.1210"], `PL35-AC-8 nhãn bài khớp ${doi[0].ref_id}`);
    const tho = readFileSync(a.tep, "utf8");
    for (const cam of ["text", "trich", "labeler", "nguoi-1"]) assert.ok(!tho.includes(`"${cam}`) && !tho.includes(cam === "nguoi-1" ? cam : `"${cam}"`), `PL35-AC-8 tệp chứa «${cam}»`);
    await c.query("UPDATE eval_labels SET value = 'QB2' WHERE item_id = $1 AND field = 'building'", [don[0].item_id]);
    const d = await dongBangLat(c, { lat: LAT, ra: ra1 });
    assert.notEqual(d.sha256, a.sha256, "PL35-AC-8 đổi một nhãn mà băm không đổi");
    assert.equal(readdirSync(ra1).length, 2, "PL35-AC-8 đổi nhãn phải ra tệp mới, giữ tệp cũ");
  } finally { await dong(c); }
});
