// do-lam-giau.test.mjs — DO3 do-lam-giau. Ca thuần (hàm của lib/do-lam-giau.mjs) và ca DB (DB thử của lượt, giao dịch ROLLBACK,
// 086 nạp trong giao dịch). Mỗi thước có cặp hai chiều trên cùng fixture: vật lành xanh, bản đột biến (cờ dotBien) đỏ với thông điệp
// ghim — tên ca và thông điệp khớp _acceptance/do-lam-giau/evals.yaml.
import assert from "node:assert/strict";
import { test } from "node:test";

import pg from "pg";

import { daCoLamGiau, napLamGiau } from "../lib/do-lam-giau-db.mjs";

const DB = process.env.DATABASE_URL;
const coDb = { skip: DB ? false : "thiếu DATABASE_URL — chạy qua npm test (DB thử của lượt)" };

/** Một giao dịch trên DB thử: khoá 33033, chạy fn, ROLLBACK. Từ chối DB oneinvest dùng chung. */
export async function trongGiaoDich(fn) {
  const c = new pg.Client({ connectionString: DB });
  await c.connect();
  try {
    const { rows: [{ db }] } = await c.query("SELECT current_database() AS db");
    if (db === "oneinvest") throw new Error("DATABASE_URL trỏ DB oneinvest dùng chung — dùng DB thử (db/db-thu.sh)");
    await c.query("BEGIN");
    await c.query("SELECT pg_advisory_xact_lock(33033)");
    await fn(c);
  } finally {
    await c.query("ROLLBACK").catch(() => {});
    await c.end();
  }
}

const COT = async (c, bang) => (await c.query(
  "SELECT column_name FROM information_schema.columns WHERE table_name = $1 ORDER BY ordinal_position", [bang])).rows.map((r) => r.column_name);

test("DO3-NAP 086 nạp trong giao dịch, chạy lại không lỗi, ROLLBACK thì mất", coDb, async () => {
  let truoc;
  await trongGiaoDich(async (c) => {
    truoc = await daCoLamGiau(c);
    await napLamGiau(c);
    assert.equal(await napLamGiau(c), false, "lần hai không nạp lại");
    assert.deepEqual(await COT(c, "enrichment_value_state"), ["duong", "subject_key", "value_key", "offer_id", "seen_on"]);
    assert.deepEqual(await COT(c, "enrichment_value_change"),
      ["snap_date", "duong", "subject_key", "from_value", "to_value", "huong", "offer_id"]);
    // CHECK giữ khuôn: hướng them phải từ NULL, may_rut phải về NULL, from ≠ to.
    await c.query("SAVEPOINT s");
    await assert.rejects(c.query(`INSERT INTO enrichment_value_change VALUES ('2025-06-01', 'quy-uoc-nhom', 'k', 'a', 'b', 'them', NULL)`));
    await c.query("ROLLBACK TO SAVEPOINT s");
    await assert.rejects(c.query(`INSERT INTO enrichment_value_change VALUES ('2025-06-01', 'quy-uoc-nhom', 'k', 'a', 'a', 'doi', NULL)`));
    await c.query("ROLLBACK TO SAVEPOINT s");
    await assert.rejects(c.query(`INSERT INTO enrichment_value_state VALUES ('duong-la', 'k', 'v', NULL, '2025-06-01')`));
    await c.query("ROLLBACK TO SAVEPOINT s");
  });
  if (truoc === false) {
    const c = new pg.Client({ connectionString: DB });
    await c.connect();
    try { assert.equal(await daCoLamGiau(c), false, "ROLLBACK phải bỏ 086"); } finally { await c.end(); }
  }
});

// ================= Task 2: sổ đường, ảnh chụp, thay đổi theo ngày, người sửa/rút, tự soát =================
import { resolveOffers, retractRule, writeAssertions } from "../lib/assert.mjs";
import { ngayVn } from "../lib/do-hang-ngay.mjs";
import { docGiaTriSong, docNguoiDe, docNguoiRut, docNhanNgay } from "../lib/do-lam-giau-db.mjs";
import { DUONG, demNguoiDe, demThayDoi, gopNgay, latPhang, nguoiSua, soAnh, tuSoat } from "../lib/do-lam-giau.mjs";
import { bamSo, ganSdtQuaNguoi } from "../lib/gan-sdt-qua-nguoi.mjs";
import { SQL_LL } from "../lib/lien-lac-nguoi.mjs";
import { nap068 } from "../lib/nap-068.mjs";
import { nap079 } from "../lib/nap-079.mjs";
import { napSdtE164 } from "../lib/nap-060.mjs";
import { doLamGiau } from "../do-lam-giau.mjs";
import { LOAI_HINH_VERSION } from "../transform-zalo.mjs";

const congNgay = (ngay, n) => { const d = new Date(`${ngay}T00:00:00Z`); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };

// ---- Ca thuần ----
test("DO3 sổ đường: bốn khoá nguyên văn, hai đường đang có mã ghi", () => {
  assert.deepEqual(DUONG.map((d) => d.duong), ["so-qua-nguoi-dang", "quy-uoc-nhom", "dien-tich-suy-ra", "danh-muc-cdt"]);
  const by = Object.fromEntries(DUONG.map((d) => [d.duong, d]));
  assert.deepEqual([[...by["so-qua-nguoi-dang"].rule_ids], by["so-qua-nguoi-dang"].o_nhan, by["so-qua-nguoi-dang"].nguoi_rut, by["so-qua-nguoi-dang"].kiem],
    [["s03-qua-nguoi-dang"], "seller_phone", false, "so"]);
  assert.deepEqual([[...by["quy-uoc-nhom"].rule_ids], by["quy-uoc-nhom"].o_nhan, by["quy-uoc-nhom"].nguoi_rut, by["quy-uoc-nhom"].kiem],
    [["loai-hinh-nhom"], "property_type", false, "nhom"]);
  // Người sửa bằng ghi đè `hitl` chỉ có ở quy ước nhóm; không đường nào có lối người rút (Mạnh chốt 09/11).
  assert.deepEqual(DUONG.map((d) => [d.duong, d.nguoi_de, d.nguoi_rut]),
    [["so-qua-nguoi-dang", false, false], ["quy-uoc-nhom", true, false], ["dien-tich-suy-ra", false, false], ["danh-muc-cdt", false, false]]);
  for (const k of ["dien-tich-suy-ra", "danh-muc-cdt"]) assert.deepEqual([by[k].rule_ids.length, by[k].o_nhan, by[k].kiem], [0, null, null]);
});

test("DO3 ngày đo theo giờ VN: lượt 00:30 giờ VN thuộc ngày VN, không theo UTC", () => {
  assert.equal(ngayVn("2026-11-08T17:30:00Z"), "2026-11-09");
  assert.equal(ngayVn("2026-11-08T16:59:00Z"), "2026-11-08");
});

test("DO3 phần thuần: soAnh, gopNgay, demThayDoi, nguoiSua, tuSoat", () => {
  const m = (o) => new Map(Object.entries(o).map(([k, v]) => [k, { value_key: v, offer_id: `o_${k}` }]));
  const ds = soAnh(m({ a: "1", c: "1", e: "1", r: "1" }), m({ b: "2", c: "2", e: "1" }), new Set(["r"]));
  assert.deepEqual(ds.map((x) => [x.subject_key, x.huong]), [["a", "may_rut"], ["b", "them"], ["c", "doi"]]);
  assert.deepEqual(demThayDoi(ds), { them: 1, doi: 1, may_rut: 1 });
  assert.ok(soAnh(m({ r: "1" }), m({}), new Set(["r"]), { dotBien: "nguoi-rut-hai-lan" }).length === 1);
  // gộp: giữ from đầu ngày, to mới nhất; về lại đầu ngày thì xoá.
  assert.deepEqual(gopNgay({ from_value: "1", to_value: "2", huong: "doi" }, { from_value: "2", to_value: "3" }), { from_value: "1", to_value: "3", huong: "doi" });
  assert.equal(gopNgay({ from_value: "1", to_value: "2", huong: "doi" }, { from_value: "2", to_value: "1" }), null);
  assert.deepEqual(gopNgay({ from_value: null, to_value: "2", huong: "them" }, { from_value: "2", to_value: "3" }), { from_value: null, to_value: "3", huong: "them" });
  assert.deepEqual(gopNgay(undefined, { from_value: "2", to_value: null }), { from_value: "2", to_value: null, huong: "may_rut" });
  // nhãn số so sau E.164; «không nêu» không vào mẫu số.
  const nh = [{ value: "0912 345 678", not_stated: false, gia_tri: "+84912345678" }, { value: "+84912345679", not_stated: false, gia_tri: "+84912345678" },
    { value: null, not_stated: true, gia_tri: "+84912345678" }];
  assert.deepEqual(nguoiSua(nh, "seller_phone"), { nguoi_sua: 1, nhan_da_so: 2 });
  assert.deepEqual(nguoiSua(nh, "seller_phone", { dotBien: "sdt-chua-chuan" }), { nguoi_sua: 2, nhan_da_so: 2 });
  // ghi đè: khác giá trị sống mới tính; cùng giá trị hay chủ thể ngoài đường thì không; một chủ thể đè hai lần tính một.
  const nay = m({ "s1|property_type": "apartment", "s2|property_type": "apartment" });
  const de = [{ k: "s1|property_type", value_key: "house" }, { k: "s1|property_type", value_key: "land" },
    { k: "s2|property_type", value_key: "apartment" }, { k: "s9|property_type", value_key: "house" }];
  assert.equal(demNguoiDe(nay, de), 1);
  assert.equal(demNguoiDe(nay, de, { dotBien: "de-cung-gia-tri" }), 2);
  const lat = { song: { thi_truong: { o: { a: 2, "khong-tin-hieu": 1 }, tong: 3 } } };
  assert.equal(tuSoat({ song_hom_qua: 3, song: 3, them: 1, may_rut: 1, nguoi_rut: 0, lat: latPhang(lat) }), null);
  assert.equal(tuSoat({ song_hom_qua: 3, song: 4, them: 0, may_rut: 0, lat: latPhang(lat) }), "song-lech");
  assert.equal(tuSoat({ song_hom_qua: null, song: 4, them: 0, may_rut: 0, lat: {} }), null);
  assert.equal(tuSoat({ song_hom_qua: null, song: 3, them: 0, may_rut: 0, lat: latPhang({ song: { phuong: { o: { a: 2 }, tong: 3 } } }) }), "lat-lech:song.phuong");
});

// ---- Ca DB: fixture qua bên ghi thật ----
const SNAP = "hanoi__s03do3__2099-11-08T000000";
const P = process.pid % 100000;
const CROCK = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";
let seq = 0;
const ma26 = (tien) => { let x = P * 10000 + ++seq, s = ""; for (let i = 0; i < 23; i++) { s = CROCK[x % 32] + s; x = Math.floor(x / 32); } return `${tien}${s}`; };
const yen = { out: () => {} };

/** Nạp migration cần trong giao dịch (no-op khi DB đã có), mở cổng cắt chuyển, dọn dòng DO3, ổn định số qua người đăng của dữ liệu chép. */
async function chuanBi(c) {
  await napLamGiau(c);
  await napSdtE164(c);
  await nap068(c);
  await nap079(c);
  await c.query(`INSERT INTO ops_audit (actor, action, env, detail) SELECT 'test:do3', 'phat-bieu:cat-chuyen', 'local', '{"giao_dich_thu": true}'::jsonb
                  WHERE NOT EXISTS (SELECT 1 FROM ops_audit WHERE action = 'phat-bieu:cat-chuyen')`);
  await c.query(`INSERT INTO airbnb_snapshots (snapshot_id, city, source, manifest) VALUES ($1, 'hanoi', 's03do3', '{}') ON CONFLICT DO NOTHING`, [SNAP]);
  await c.query("DELETE FROM enrichment_value_state; DELETE FROM enrichment_value_change; DELETE FROM dq_check_results WHERE check_name LIKE 'do3-%'");
  await ganSdtQuaNguoi(c, yen);
}
/** Chạy fn trong SAVEPOINT rồi hoàn lại — vật lành và bản đột biến đo trên cùng fixture. */
export async function thu(c, fn) {
  await c.query("SAVEPOINT do3");
  try { return await fn(); } finally { await c.query("ROLLBACK TO SAVEPOINT do3"); }
}
/** Người S03 thử: party + bí danh tài khoản nguồn. */
async function nguoi(c, sender) {
  const pk = `pty_${ma26("PD3")}`;
  await c.query("INSERT INTO parties (party_key, source) VALUES ($1, 'S03')", [pk]);
  await c.query("INSERT INTO registry_aliases (object_key, kind, value, source) VALUES ($1, 'tai_khoan_nguon', $2, 'S03')", [pk, sender]);
  return pk;
}
async function lienLac(c, pk, so) {
  const { rows: [{ id }] } = await c.query(
    `INSERT INTO party_contacts (party_key, kind, value, evidence_tier, method, rule_id, evidence, run_id)
     VALUES ($1, 'sdt', $2, 'observed', 'parser', 'so_trong_bai', '{}', 'do3-test') RETURNING id`, [pk, so]);
  return Number(id);
}
const rutLL = (c, ids) => c.query(SQL_LL.rut, [ids, "so-chung"]);
/** Bài + tin S03 thử. Số của tin (nếu có) là số riêng; số suy đến từ ganSdtQuaNguoi. */
async function tin(c, ma, { sender = null, ten = "Người thử", area = null, phone = null, text = `tin DO3 ${ma}`, conv = null, postIds } = {}) {
  const oid = `offer_do3_${ma}`, pid = `do3${ma}`;
  await c.query(`INSERT INTO stg_zalo_posts (post_id, snapshot_id, agent_id, group_name, text, posted_at, sender_id, sender_name, conversation_id)
                 VALUES ($1, $2, 'openclaw-hook', 'Nhóm DO3', $3, now(), $4, $5, $6) ON CONFLICT DO NOTHING`, [pid, SNAP, text, sender, ten, conv]);
  await c.query(`INSERT INTO sale_offer_records (offer_id, originating_system_key, kind, price_vnd, area_m2, area_id, first_seen, last_seen, post_ids,
                   source, seller_ref, seller_name, seller_phone, seller_phone_hash)
                 VALUES ($1, $2, 'sale', 3400000000, 62, $3, now(), now(), $4, 'S03', $5, $6, $7, $8)`,
  [oid, pid, area, postIds ?? [pid], sender, sender ? ten : null, phone, phone ? bamSo(phone) : null]);
  return oid;
}
const pbNhom = (ma, value = "apartment") => ({ subject_key: `S03:do3${ma}`, field: "property_type", value, evidence_tier: "inferred",
  method: "e1_rule", method_version: LOAI_HINH_VERSION, rule_id: "loai-hinh-nhom" });
const ghiNhom = (c, rows) => writeAssertions(c, rows, { replaceOwn: true });
/** Khu thử: 2 thị trường + `n` phường (phường i thuộc thị trường i chẵn/lẻ). */
async function khuThu(c, n = 2) {
  for (const m of ["vn-do3-ma", "vn-do3-mb"]) {
    await c.query("INSERT INTO areas (id, region_type, name, country_code) VALUES ($1, 'market', $1, 'VN') ON CONFLICT DO NOTHING", [m]);
  }
  const w = [];
  for (let i = 1; i <= n; i++) {
    const id = `vn-do3-w${String(i).padStart(2, "0")}`;
    await c.query("INSERT INTO areas (id, parent_id, region_type, name, country_code) VALUES ($1, $2, 'submarket', $1, 'VN') ON CONFLICT DO NOTHING",
      [id, i % 2 ? "vn-do3-ma" : "vn-do3-mb"]);
    w.push(id);
  }
  return w;
}
async function toa(c, area) {
  await c.query(`INSERT INTO field_assertions (resource_name, subject_key, field, value, evidence_tier, method, evidence, observed_at, run_id)
                 VALUES ('Building', $1, 'area_id', $2, 'inferred', 'registry_inherit', '{}'::jsonb, now(), 'do3-test')`, [`bld_${ma26("PD3")}`, area]);
}
/** Người rút phát biểu của đường với lý do 045 (`hitl-thay`, `hoan-tac:<lý do>`). Ghi bằng `retractRule` của lib/assert.mjs: hôm nay
 * không lối người nào của DB rút được phát biểu `loai-hinh-nhom` — apply_enrichment chỉ rút phát biểu `hitl` cũ (hitl-thay), còn
 * revert_enrichment từ 069 giữ lớp `inferred` — nên bộ đếm được kiểm trên đúng khuôn lý do mà lối người sẽ ghi. */
const nguoiRutNhom = (c, mas, lyDo) => retractRule(c, mas.map((m) => `S03:do3${m}`), "property_type", "loai-hinh-nhom", lyDo);
/** Sổ đường thử: quy ước nhóm khai có lối người rút. Sổ thật không có (Mạnh chốt 09/11) — bộ đếm rút vẫn giữ cho đường sau này có lối. */
const DUONG_RUT = Object.freeze(DUONG.map((d) => (d.duong === "quy-uoc-nhom" ? Object.freeze({ ...d, nguoi_rut: true }) : d)));
/** Người ghi đè loại hình trên tin bằng đúng lối người của 045: đề xuất xếp hàng rồi `apply_enrichment` với người `hitl:…`. */
async function deNguoi(c, ma, value, ai = "hitl:LABELER_DO3") {
  const { rows: [{ id }] } = await c.query(
    `INSERT INTO enrichment_proposals (run_id, offer_id, field, value, value_key, source, route, evidence)
     VALUES ('do3-test', $1, 'property_type', $2, lower($2), 'e2_llm', 'review', '{}'::jsonb) RETURNING id`, [`offer_do3_${ma}`, value]);
  await c.query("SELECT apply_enrichment(ARRAY[$1]::bigint[], $2)", [id, ai]);
}
const dongDq = async (c, ten, khoa, gt) => (await c.query(
  `SELECT entity, status, detail::jsonb AS detail FROM dq_check_results WHERE check_name = $1 AND detail::jsonb ->> $2 = $3 ORDER BY entity, id`, [ten, khoa, gt])).rows;
const songCua = (kq) => Object.fromEntries(kq.dq.filter((r) => r.check_name === "do3-thay-doi").map((r) => [r.entity, r.detail.song ?? 0]));
const SO = "so-qua-nguoi-dang", NHOM = "quy-uoc-nhom";
const so = (n) => `+84399000${String(n).padStart(3, "0")}`;

const D = ngayVn(Date.now()), D1 = congNgay(D, -1), D2 = congNgay(D, 1);

function kiemAc1(rows, goc) {
  if (rows.length !== 4) throw new Error(`DONG NGAY LAP: ${rows.length} dòng`);
  assert.deepEqual(rows.map((r) => r.entity).sort(), DUONG.map((d) => d.duong).sort());
  const by = Object.fromEntries(rows.map((r) => [r.entity, r]));
  // Phát biểu Building (vật thể toà) không phải giá trị trên tin: đường danh mục CĐT vẫn «chưa chạy».
  if (by["danh-muc-cdt"].detail.ly_do !== "chua-chay") throw new Error(`TOA THANH TIN: ${by["danh-muc-cdt"].detail.ly_do}`);
  for (const k of ["dien-tich-suy-ra", "danh-muc-cdt"]) {
    assert.deepEqual([by[k].status, by[k].detail.ly_do], ["skip", "chua-chay"], k);
    for (const o of ["song", "them", "doi", "may_rut", "nguoi_sua"]) if (o in by[k].detail) throw new Error(`CHUA CHAY GHI SO 0: ${k}.${o}`);
  }
  for (const r of rows) if (r.status === "fail" && !r.detail.soat_lech) throw new Error(`FAIL KHONG CO LY DO: ${r.entity}`);
  assert.deepEqual([by[SO].status, by[SO].detail.song], ["pass", goc[SO] + 3], SO);
  assert.deepEqual([by[NHOM].status, by[NHOM].detail.song], ["pass", goc[NHOM] + 4], NHOM);
}

test("DO3-AC-1 bốn dòng do3-thay-doi mỗi ngày: đường đang chạy pass, chưa chạy skip không số 0, chạy lại thay dòng, tự soát", coDb, async () => {
  await trongGiaoDich(async (c) => {
    await chuanBi(c);
    const goc = await thu(c, async () => songCua(await doLamGiau(c, { ngay: D1 })));
    // 3 tin nhận số qua người đăng bằng ganSdtQuaNguoi trên party_contacts thử.
    for (let i = 1; i <= 3; i++) {
      const pk = await nguoi(c, `do3s1${i}`);
      await lienLac(c, pk, so(110 + i));
      await tin(c, `a1s${i}`, { sender: `do3s1${i}` });
    }
    assert.equal((await ganSdtQuaNguoi(c, yen)).gan, 3);
    // 4 phát biểu loai-hinh-nhom bằng writeAssertions, đúng hằng rule/method của transform-zalo; 2 phát biểu Building.
    for (let i = 1; i <= 4; i++) await tin(c, `a1n${i}`);
    await ghiNhom(c, [1, 2, 3, 4].map((i) => pbNhom(`a1n${i}`)));
    const [w1] = await khuThu(c);
    await toa(c, w1);
    await toa(c, w1);
    await doLamGiau(c, { ngay: D1, write: true }); // lập mốc hôm qua
    await doLamGiau(c, { ngay: D, write: true });
    const lan1 = await dongDq(c, "do3-thay-doi", "ngay", D);
    kiemAc1(lan1, goc);
    await doLamGiau(c, { ngay: D, write: true });
    const lan2 = await dongDq(c, "do3-thay-doi", "ngay", D);
    kiemAc1(lan2, goc);
    assert.deepEqual(lan2.map((r) => r.detail), lan1.map((r) => r.detail), "chạy lại không đổi dữ liệu → cùng detail");
    // Review Focus 3: lượt ngày D+1 không đè dòng của ngày D.
    await thu(c, async () => {
      await doLamGiau(c, { ngay: D2, write: true });
      assert.deepEqual((await dongDq(c, "do3-thay-doi", "ngay", D)).map((r) => r.detail), lan1.map((r) => r.detail));
      assert.equal((await dongDq(c, "do3-thay-doi", "ngay", D2)).length, 4);
    });
    for (const [dotBien, msg] of [["chua-chay-so-0", /CHUA CHAY GHI SO 0/], ["toa-thanh-tin", /TOA THANH TIN/], ["dong-lap", /DONG NGAY LAP/],
      ["fail-khong-ly-do", /FAIL KHONG CO LY DO/]]) {
      await thu(c, async () => {
        await doLamGiau(c, { ngay: D, write: true, dotBien });
        await assert.rejects(async () => kiemAc1(await dongDq(c, "do3-thay-doi", "ngay", D), goc), msg, dotBien);
      });
    }
    await thu(c, async () => {
      await doLamGiau(c, { ngay: D, write: true, dotBien: "song-lech" });
      const r = (await dongDq(c, "do3-thay-doi", "ngay", D)).find((x) => x.entity === SO);
      assert.deepEqual([r.status, r.detail.soat_lech], ["fail", "song-lech"]);
    });
  });
});

const MAY_THU = process.env.DATABASE_URL_MAY_THU;
test("DO3-AC-1-THAT câu đọc giá trị sống trên DB máy thu (chỉ đọc): hai đường đang chạy có giá trị",
  { skip: process.env.CI ? "CI: không có DB máy thu" : MAY_THU ? false : "vắng DATABASE_URL_MAY_THU — ca chỉ đọc DB máy thu" }, async () => {
    const c = new pg.Client({ connectionString: MAY_THU });
    await c.connect();
    try {
      await c.query("SET SESSION CHARACTERISTICS AS TRANSACTION READ ONLY");
      const by = Object.fromEntries(DUONG.map((d) => [d.duong, d]));
      const nSo = (await docGiaTriSong(c, by[SO])).size, nNhom = (await docGiaTriSong(c, by[NHOM])).size;
      console.log(`DO3-AC-1-THAT ${SO}=${nSo} ${NHOM}=${nNhom}`);
      assert.ok(nSo > 0, SO);
      assert.ok(nNhom > 0, NHOM);
    } finally { await c.end(); }
  });

test("DO3-CHUA-AP DB chưa áp 086: chua_ap '086', 0 dòng dq", coDb, async () => {
  await trongGiaoDich(async (c) => {
    await c.query("DELETE FROM dq_check_results WHERE check_name LIKE 'do3-%'");
    if (await daCoLamGiau(c)) await c.query("DROP TABLE enrichment_value_change; DROP TABLE enrichment_value_state");
    assert.equal(await daCoLamGiau(c), false);
    const kq = await doLamGiau(c, { ngay: D, write: true });
    assert.deepEqual(kq, { dq: [], chua_ap: "086" });
    const { rows: [{ n }] } = await c.query("SELECT count(*)::int AS n FROM dq_check_results WHERE check_name LIKE 'do3-%'");
    assert.equal(n, 0);
  });
});

// ---- AC-2: ảnh chụp, dòng đổi theo ngày, bốn lượt cùng ngày ----
/** Dòng đổi ngày D của chủ thể fixture (tiền tố offer_do3_/S03:do3). */
const dongDoi = async (c, ngay) => (await c.query(
  `SELECT duong, subject_key, from_value, to_value, huong FROM enrichment_value_change
    WHERE snap_date = $1 AND (subject_key LIKE 'tin:offer\\_do3\\_%' OR subject_key LIKE 'S03:do3%') ORDER BY subject_key`, [ngay])).rows;
const detailCua = (kq, duong) => kq.dq.find((r) => r.check_name === "do3-thay-doi" && r.entity === duong).detail;

test("DO3-AC-2 ảnh chụp và dòng đổi: lập mốc, thêm/đổi/máy rút, người rút không vào máy rút, gộp bốn lượt cùng ngày", coDb, async () => {
  await trongGiaoDich(async (c) => {
    await chuanBi(c);
    const goc = await thu(c, async () => songCua(await doLamGiau(c, { ngay: D, duong: DUONG_RUT })));
    const { rows: [{ n: n0 }] } = await c.query("SELECT count(*)::int AS n FROM enrichment_value_state");
    // Số qua người đăng: A, C, E có số suy; B có Người chưa có số.
    const pk = {}, ll = {};
    for (const x of ["A", "B", "C", "E"]) {
      pk[x] = await nguoi(c, `do3s2${x}`);
      if (x !== "B") ll[x] = await lienLac(c, pk[x], so(200 + x.charCodeAt(0)));
      await tin(c, `a2${x}`, { sender: `do3s2${x}` });
    }
    await ganSdtQuaNguoi(c, yen);
    // Quy ước nhóm: P, Q, R, S, T; R có đề xuất đã áp để người hoàn tác.
    for (const x of ["P", "Q", "R", "S", "T"]) await tin(c, `a2${x}`);
    await ghiNhom(c, ["P", "Q", "R", "S", "T"].map((x) => pbNhom(`a2${x}`)));
    const kiemLan1 = async (kq) => {
      if ((await dongDoi(c, D)).length) throw new Error("LAP MOC CO DONG");
      const { rows: [{ n }] } = await c.query("SELECT count(*)::int AS n FROM enrichment_value_state");
      assert.equal(n - n0, 8 + goc[SO] + goc[NHOM] - n0, "ảnh chụp 8 dòng fixture");
      for (const k of [SO, NHOM]) assert.deepEqual([detailCua(kq, k).ly_do, kq.dq.find((r) => r.entity === k && r.check_name === "do3-thay-doi").status], ["lap-moc", "skip"]);
    };
    await thu(c, async () => assert.rejects(async () => kiemLan1(await doLamGiau(c, { ngay: D, duong: DUONG_RUT, write: true, dotBien: "lap-moc-co-dong" })), /LAP MOC CO DONG/));
    await kiemLan1(await doLamGiau(c, { ngay: D, duong: DUONG_RUT, write: true }));
    // Sửa dữ liệu qua bên ghi thật.
    await rutLL(c, [ll.A]); // A: Người hết số → tin mất số suy
    ll.B = await lienLac(c, pk.B, so(300)); // B: nhận số suy mới
    await rutLL(c, [ll.C]); ll.C2 = await lienLac(c, pk.C, so(301)); // C: đổi số
    await ganSdtQuaNguoi(c, yen);
    await ghiNhom(c, [pbNhom("a2P", "house")]); await ghiNhom(c, [pbNhom("a2P")]); // P: thay-boi-luot rồi ghi lại cùng giá trị
    await ghiNhom(c, [pbNhom("a2Q", "house")]); // Q: đổi loại hình
    await nguoiRutNhom(c, ["a2R"], "hitl-thay"); // R: người rút (sổ thử khai lối người rút)
    const kiemLan2 = (rows, kq) => {
      if (rows.some((r) => /a2[PE]$/.test(r.subject_key.replace(/\|.*$/, "")))) throw new Error("DOI GIA");
      if (rows.some((r) => r.subject_key.startsWith("S03:do3a2R"))) throw new Error("NGUOI RUT DEM HAI LAN");
      assert.deepEqual(rows.map((r) => [r.subject_key, r.huong]), [
        ["S03:do3a2Q|property_type", "doi"], ["tin:offer_do3_a2A", "may_rut"], ["tin:offer_do3_a2B", "them"], ["tin:offer_do3_a2C", "doi"]]);
      const s = detailCua(kq, SO), n = detailCua(kq, NHOM);
      assert.deepEqual([s.them, s.doi, s.may_rut, s.song], [1, 1, 1, goc[SO] + 3]);
      assert.deepEqual([n.them, n.doi, n.may_rut, n.nguoi_rut, n.song], [0, 1, 0, 1, goc[NHOM] + 4]);
    };
    for (const [dotBien, msg] of [["doi-gia", /DOI GIA/], ["nguoi-rut-hai-lan", /NGUOI RUT DEM HAI LAN/]]) {
      await thu(c, async () => {
        const kq = await doLamGiau(c, { ngay: D, duong: DUONG_RUT, write: true, dotBien });
        await assert.rejects(async () => kiemLan2(await dongDoi(c, D), kq), msg, dotBien);
      });
    }
    { const kq = await doLamGiau(c, { ngay: D, duong: DUONG_RUT, write: true }); kiemLan2(await dongDoi(c, D), kq); }
    // Lần 3: C về số đầu ngày → dòng của C bị xoá.
    await rutLL(c, [ll.C2]); ll.C3 = await lienLac(c, pk.C, so(200 + "C".charCodeAt(0)));
    await ganSdtQuaNguoi(c, yen);
    const kiemLan3 = (rows, kq) => {
      if (rows.some((r) => r.subject_key === "tin:offer_do3_a2C")) throw new Error("KHONG XOA KHI VE CU");
      assert.equal(detailCua(kq, SO).doi, 0);
    };
    await thu(c, async () => {
      const kq = await doLamGiau(c, { ngay: D, duong: DUONG_RUT, write: true, dotBien: "khong-xoa-ve-cu" });
      await assert.rejects(async () => kiemLan3(await dongDoi(c, D), kq), /KHONG XOA KHI VE CU/);
    });
    { const kq = await doLamGiau(c, { ngay: D, duong: DUONG_RUT, write: true }); kiemLan3(await dongDoi(c, D), kq); }
    // Lần 4: B đổi sang số khác → vẫn một dòng them, from null, to số mới nhất.
    await rutLL(c, [ll.B]); ll.B2 = await lienLac(c, pk.B, so(302));
    await ganSdtQuaNguoi(c, yen);
    const kiemLan4 = (rows, kq) => {
      const dem = kq.dong[SO].filter((r) => r.subject_key === "tin:offer_do3_a2B").length;
      if (dem !== 1) throw new Error(`HAI DONG MOT CHU THE: ${dem}`);
      const b = rows.filter((r) => r.subject_key === "tin:offer_do3_a2B");
      assert.deepEqual(b.map((r) => [r.huong, r.from_value, r.to_value]), [["them", null, bamSo(so(302))]]);
      assert.equal(detailCua(kq, SO).them, 1);
    };
    await thu(c, async () => {
      const kq = await doLamGiau(c, { ngay: D, duong: DUONG_RUT, write: true, dotBien: "hai-dong" });
      await assert.rejects(async () => kiemLan4(await dongDoi(c, D), kq), /HAI DONG MOT CHU THE/);
    });
    { const kq = await doLamGiau(c, { ngay: D, duong: DUONG_RUT, write: true }); kiemLan4(await dongDoi(c, D), kq); }
  });
});

test("DO3-AC-2 đường đã lập mốc mà mất hết giá trị: mỗi chủ thể một dòng máy rút, song 0, không báo «chưa chạy»", coDb, async () => {
  await trongGiaoDich(async (c) => {
    await chuanBi(c);
    // Sổ đường thử: một đường phát biểu với mã ghi riêng của ca (không trùng dữ liệu chép), không kiểm ngược.
    const RULE = "do3-thu-mat-het";
    const so = [Object.freeze({ duong: "dien-tich-suy-ra", doc: "phat-bieu", rule_ids: Object.freeze([RULE]), o_nhan: null, nguoi_rut: false,
      nguoi_de: false, kiem: null })];
    const ma = ["mh1", "mh2", "mh3"];
    for (const x of ma) await tin(c, `a2${x}`);
    await ghiNhom(c, ma.map((x) => ({ ...pbNhom(`a2${x}`), rule_id: RULE })));
    const lan1 = await doLamGiau(c, { ngay: D, write: true, duong: so, kiemNguoc: false });
    assert.equal(detailCua(lan1, "dien-tich-suy-ra").ly_do, "lap-moc");
    await retractRule(c, ma.map((x) => `S03:do3a2${x}`), "property_type", RULE, "thay-boi-luot"); // mất hết giá trị
    const kiem = async (kq) => {
      const r = kq.dq.find((x) => x.check_name === "do3-thay-doi" && x.entity === "dien-tich-suy-ra");
      if (r.detail.ly_do === "chua-chay") throw new Error("MAT HET THANH CHUA CHAY");
      assert.equal(r.status, "pass");
      assert.deepEqual([r.detail.song, r.detail.may_rut, r.detail.them, r.detail.doi], [0, 3, 0, 0]);
      const dong = (await dongDoi(c, D)).filter((x) => x.subject_key.startsWith("S03:do3a2mh"));
      assert.deepEqual(dong.map((x) => x.huong), ["may_rut", "may_rut", "may_rut"]);
      const { rows: [{ n }] } = await c.query("SELECT count(*)::int AS n FROM enrichment_value_state WHERE duong = 'dien-tich-suy-ra'");
      assert.equal(n, 0, "ảnh chụp thay bằng trạng thái rỗng");
    };
    await thu(c, async () => assert.rejects(async () => kiem(await doLamGiau(c, { ngay: D, write: true, duong: so, kiemNguoc: false,
      dotBien: "mat-het-la-chua-chay" })), /MAT HET THANH CHUA CHAY/));
    await kiem(await doLamGiau(c, { ngay: D, write: true, duong: so, kiemNguoc: false }));
  });
});

// ---- AC-3: người rút, người sửa ----
test("DO3-AC-3 người sửa = nhãn ngày D khác giá trị + ghi đè hitl ngày D khác giá trị; không đường nào có lối người rút; bộ đếm rút đo trên sổ thử", coDb, async () => {
  await trongGiaoDich(async (c) => {
    await chuanBi(c);
    const by = Object.fromEntries(DUONG.map((d) => [d.duong, d]));
    const rutNhom = DUONG_RUT.find((d) => d.duong === NHOM);
    const deGoc = async (ngay) => demNguoiDe(await docGiaTriSong(c, by[NHOM]), await docNguoiDe(c, by[NHOM], ngay));
    const goc = { rut: (await docNguoiRut(c, rutNhom, D)).size, nhanN: nguoiSua(await docNhanNgay(c, by[NHOM], D), "property_type"),
      nhanS: nguoiSua(await docNhanNgay(c, by[SO], D), "seller_phone"), de: await deGoc(D), de2: await deGoc(D2) };
    // Quy ước nhóm: H1, H2 (người thay), V1 (người hoàn tác) — chỉ có nghĩa trên sổ thử; T1–T3 (máy thay); L1–L4 (gắn nhãn);
    // D1, D2 (người ghi đè sang loại khác), K1 (người ghi đè cùng giá trị).
    const nhom = ["H1", "H2", "V1", "T1", "T2", "T3", "L1", "L2", "L3", "L4", "D1", "D2", "K1"];
    for (const x of nhom) await tin(c, `a3${x}`);
    await ghiNhom(c, nhom.map((x) => pbNhom(`a3${x}`)));
    // Số qua người đăng: S1 suy +84912345678, S2, S3.
    const soS = { S1: "+84912345678", S2: so(401), S3: so(402) };
    for (const [x, v] of Object.entries(soS)) {
      const pk = await nguoi(c, `do3s3${x}`);
      await lienLac(c, pk, v);
      await tin(c, `a3${x}`, { sender: `do3s3${x}` });
    }
    await ganSdtQuaNguoi(c, yen);
    await doLamGiau(c, { ngay: D, write: true }); // lập mốc
    // Ngày D: rút, máy thay, người ghi đè.
    await nguoiRutNhom(c, ["a3H1", "a3H2"], "hitl-thay");
    await nguoiRutNhom(c, ["a3V1"], "hoan-tac:sai-nhom");
    await ghiNhom(c, ["T1", "T2", "T3"].map((x) => pbNhom(`a3${x}`, "house"))); // thay-boi-luot, vẫn trên đường
    await deNguoi(c, "a3D1", "house");
    await deNguoi(c, "a3D2", "house");
    await deNguoi(c, "a3K1", "apartment");
    // Nhãn người ngày D (và một nhãn D-1).
    const the = new Map();
    const nhanTren = async (ma, field, value, luc = "now()", ai = "LABELER_DO3") => {
      if (!the.has(ma)) {
        const { rows: [r] } = await c.query(
          `INSERT INTO eval_label_items (lat, source_code, ref_id, text_hash, split, seed) VALUES ('do3-thu', 'S03', $1, $2, 'dev', 'do3') RETURNING item_id`,
          [`do3${ma}`, `h-do3-${ma}`]);
        the.set(ma, r.item_id);
      }
      const item_id = the.get(ma);
      await c.query(`INSERT INTO eval_labels (item_id, labeler_id, field, value, labeled_at) VALUES ($1, $4, $2, $3, ${luc})`, [item_id, field, value, ai]);
    };
    await nhanTren("a3L1", "property_type", "house");
    for (const x of ["L2", "L3", "L4"]) await nhanTren(`a3${x}`, "property_type", "apartment");
    await nhanTren("a3L2", "property_type", "house", `'${D}T00:00:00+07:00'::timestamptz - interval '1 hour'`, "LABELER_DO3_B");
    await nhanTren("a3S1", "seller_phone", "0912 345 678");
    await nhanTren("a3S2", "seller_phone", soS.S2);
    await nhanTren("a3S3", "seller_phone", so(499));
    // Sổ thật.
    const kiem = (kq) => {
      const s = detailCua(kq, SO), n = detailCua(kq, NHOM);
      if ("nguoi_rut" in s || "nguoi_rut" in n) throw new Error("KHONG LOI NGUOI GHI 0");
      assert.deepEqual([s.duong_nguoi_rut, n.duong_nguoi_rut], [false, false]);
      assert.ok(!("nguoi_sua_de" in s), "số qua người đăng không có lối ghi đè");
      if (s.nguoi_sua !== goc.nhanS.nguoi_sua + 1) throw new Error(`SDT CHUA CHUAN HOA: nguoi_sua ${s.nguoi_sua}`);
      assert.equal(s.nhan_da_so, goc.nhanS.nhan_da_so + 3);
      if (n.nguoi_sua_de > goc.de + 2) throw new Error(`DE CUNG GIA TRI: nguoi_sua_de ${n.nguoi_sua_de}`);
      if (!(n.nguoi_sua_de === goc.de + 2)) throw new Error(`BO QUA NGUOI DE: nguoi_sua_de ${n.nguoi_sua_de}`);
      if (n.nguoi_sua - n.nguoi_sua_de !== goc.nhanN.nguoi_sua + 1 || n.nhan_da_so !== goc.nhanN.nhan_da_so + 4) {
        throw new Error(`NHAN NGOAI NGAY: ${n.nguoi_sua - n.nguoi_sua_de}/${n.nhan_da_so}`);
      }
      assert.equal(n.doi, 3, "máy thay bởi lượt vẫn trên đường → đổi; ghi đè không làm đổi giá trị của đường");
      assert.equal(n.may_rut, 3, "sổ thật không có lối người rút: phát biểu rút rời đường là máy rút");
    };
    // Ngày D+1 trên cùng dữ liệu: ghi đè của ngày D không vào.
    const kiemD2 = (kq) => {
      const n = detailCua(kq, NHOM);
      if (n.nguoi_sua_de !== goc.de2) throw new Error(`DE NGOAI NGAY: nguoi_sua_de ${n.nguoi_sua_de}`);
    };
    // Sổ thử khai lối người rút: hitl-thay, hoan-tac vào người rút, thay-boi-luot không.
    const kiemRut = (kq) => {
      const n = detailCua(kq, NHOM);
      if (n.nguoi_rut !== goc.rut + 3) throw new Error(`MAY RUT THANH NGUOI: nguoi_rut ${n.nguoi_rut}`);
      assert.equal(n.may_rut, 0, "người rút không vào máy rút");
    };
    for (const [dotBien, msg] of [["de-cung-gia-tri", /DE CUNG GIA TRI/], ["bo-de", /BO QUA NGUOI DE/], ["sdt-chua-chuan", /SDT CHUA CHUAN HOA/],
      ["khong-loi-ghi-0", /KHONG LOI NGUOI GHI 0/], ["nhan-ngoai-ngay", /NHAN NGOAI NGAY/]]) {
      await thu(c, async () => assert.rejects(async () => kiem(await doLamGiau(c, { ngay: D, write: true, dotBien })), msg, dotBien));
    }
    await thu(c, async () => assert.rejects(async () => kiemD2(await doLamGiau(c, { ngay: D2, write: true, dotBien: "de-ngoai-ngay" })), /DE NGOAI NGAY/));
    await thu(c, async () => kiemD2(await doLamGiau(c, { ngay: D2, write: true })));
    await thu(c, async () => assert.rejects(async () => kiemRut(await doLamGiau(c, { ngay: D, duong: DUONG_RUT, write: true, dotBien: "may-rut-thanh-nguoi" })),
      /MAY RUT THANH NGUOI/));
    await thu(c, async () => kiemRut(await doLamGiau(c, { ngay: D, duong: DUONG_RUT, write: true })));
    kiem(await doLamGiau(c, { ngay: D, write: true }));
  });
});

// ================= Task 3: kiểm ngược bỏ-một-ra theo tuần =================
import { wilson } from "../lib/do-hang-ngay.mjs";
import { kiemNguocNhom, kiemNguocSo, tongKiem } from "../lib/do-lam-giau.mjs";

/** Wilson tham chiếu viết lại độc lập (công thức chuẩn), như DO1. */
function wilsonThamChieu(k, n) {
  const z = 1.959964, p = k / n;
  const tam = p + (z * z) / (2 * n);
  const can = z * Math.sqrt((p * (1 - p) + (z * z) / (4 * n)) / n);
  const mau = 1 + (z * z) / n;
  return { thap: (tam - can) / mau, cao: (tam + can) / mau };
}
const gan4 = (a, b, msg) => assert.ok(Math.abs(a - b) < 1e-4, `${msg}: ${a} ≠ ${b}`);
const chu = (n) => `0399000${String(n).padStart(3, "0")}`;

// ---- AC-4: ma trận viết trước. Số đặt trong CHỮ BÀI (rutLienLac đọc từ bài) và trên tin (số riêng do transform ghi). ----
// N1: 3 bài, mỗi bài một tin, cùng số X (+ một tin mang số suy X, không vào tập) → 3 đúng.
// N2: 3 bài số X2 + 1 bài số Y → tin Y suy lại ra X2: 1 sai; tin X2 còn hai số trên tin (X2, Y) → chonSoNguoi (đúng một số) không chọn: 3 không ra.
// N3: 1 bài sinh HAI tin cùng số Z → bỏ tin thứ nhất kéo theo bài và tin thứ hai: 2 không ra.
// N4: 2 bài số W, người gửi khác cũng đăng W (số chung, bị loại) → 2 không ra.
// N5: 1 bài số V, một tin → bỏ tin + bài: 1 không ra (giữ bài thì thành đúng).
// N6: 1 bài KHÔNG số, tin mang số U → bỏ tin: 1 không ra (không bỏ gì thì thành đúng).
const MA_TRAN_SO = { N1a: "dung", N1b: "dung", N1c: "dung", N2a: "khong_ra", N2b: "khong_ra", N2c: "khong_ra", N2y: "sai",
  N3a: "khong_ra", N3b: "khong_ra", N4a: "khong_ra", N4b: "khong_ra", N5: "khong_ra", N6: "khong_ra" };
function fixtureSo() {
  const bai = [], tins = [], nguoiCuaTaiKhoan = new Map();
  const ng = (s) => nguoiCuaTaiKhoan.set(`do3k${s}`, `pty_k${s}`);
  const b = (id, s, text) => bai.push({ post_id: `do3k${id}`, sender_id: `do3k${s}`, text });
  const t = (id, s, phone, pids, fp = null) => tins.push({ offer_id: `offer_do3k${id}`, seller_ref: `do3k${s}`, seller_phone: phone, post_ids: pids.map((p) => `do3k${p}`),
    field_provenance: fp ? { seller_phone: fp } : {}, song: true });
  for (const s of [1, 2, 3, 4, 5, 6]) ng(s);
  for (const x of ["a", "b", "c"]) { b(`N1${x}`, 1, `Bán 2PN lh ${chu(501)}`); t(`N1${x}`, 1, so(501), [`N1${x}`]); }
  b("N1d", 1, "Bán 3PN"); t("N1d", 1, so(501), ["N1d"], { rule_id: "s03-qua-nguoi-dang", tier: "inferred" });
  for (const x of ["a", "b", "c"]) { b(`N2${x}`, 2, `Bán nhà lh ${chu(502)}`); t(`N2${x}`, 2, so(502), [`N2${x}`]); }
  b("N2y", 2, `Bán đất lh ${chu(512)}`); t("N2y", 2, so(512), ["N2y"]);
  b("N3", 3, `Bán hai căn lh ${chu(503)}`); t("N3a", 3, so(503), ["N3"]); t("N3b", 3, so(503), ["N3"]);
  for (const x of ["a", "b"]) { b(`N4${x}`, 4, `Cho thuê lh ${chu(504)}`); t(`N4${x}`, 4, so(504), [`N4${x}`]); }
  b("N4z", 7, `ib ${chu(504)}`); // người gửi khác, không có Người
  b("N5", 5, `Bán lh ${chu(505)}`); t("N5", 5, so(505), ["N5"]);
  b("N6", 6, "Bán căn góc"); t("N6", 6, so(506), ["N6"]);
  return { bai, tins, nguoiCuaTaiKhoan };
}
function kiemSo(k) {
  const ket = (ma) => k.ket.get(`offer_do3k${ma}`);
  if (ket("N1d") !== undefined) throw new Error("SO SUY VAO TAP KIEM");
  if (ket("N6") === "dung") throw new Error("KHONG BO MOT RA");
  if (ket("N5") === "dung") throw new Error("RO BAI CUA TIN");
  if (ket("N3a") === "dung" || ket("N3b") === "dung") throw new Error("RO TIN CUNG BAI");
  for (const [ma, x] of Object.entries(MA_TRAN_SO)) assert.equal(ket(ma), x, ma);
  assert.deepEqual([k.tap_do, k.n, k.dung, k.sai, k.khong_ra], ["tin-co-so-rieng", 13, 3, 1, 9]);
}
function kiemTong(k, t, truoc) {
  if (t.ty_le_dung !== k.dung / (k.dung + k.sai)) throw new Error(`KHONG RA VAO MAU SO: ${t.ty_le_dung}`);
  const w = wilsonThamChieu(k.dung, k.dung + k.sai);
  gan4(t.wilson.thap, w.thap, "wilson thấp"); gan4(t.wilson.cao, w.cao, "wilson cao");
  assert.equal(t.phu, (k.dung + k.sai) / k.n);
  if (truoc) {
    gan4(t.chenh, t.ty_le_dung - truoc.dung / (truoc.dung + truoc.sai), "chênh");
    const a = wilson(k.dung, k.dung + k.sai), b = wilson(truoc.dung, truoc.dung + truoc.sai);
    assert.equal(t.co_y_nghia, a.cao < b.thap || b.cao < a.thap, "có ý nghĩa = hai khoảng không chồng");
    gan4(t.nguong_phat_hien, (a.cao - a.thap) / 2 + (b.cao - b.thap) / 2, "ngưỡng phát hiện");
  }
}
test("DO3-AC-4 phần thuần: bỏ-một-ra số qua người đăng trên ma trận viết trước, Wilson, so tuần trước", () => {
  const { bai, tins, nguoiCuaTaiKhoan } = fixtureSo();
  const k = kiemNguocSo(bai, tins, nguoiCuaTaiKhoan);
  kiemSo(k);
  const truoc = { dung: 1, sai: 9 };
  kiemTong(k, tongKiem(k, truoc), truoc);
  assert.equal(tongKiem({ n: 40, dung: 38, sai: 2 }, { dung: 2, sai: 38 }).co_y_nghia, true);
  for (const [dotBien, msg] of [["khong-bo-ra", /KHONG BO MOT RA/], ["giu-bai", /RO BAI CUA TIN/], ["giu-tin-cung-bai", /RO TIN CUNG BAI/],
    ["so-suy-vao-tap", /SO SUY VAO TAP KIEM/]]) {
    assert.throws(() => kiemSo(kiemNguocSo(bai, tins, nguoiCuaTaiKhoan, { dotBien })), msg, dotBien);
  }
  assert.throws(() => kiemTong(k, tongKiem(k, truoc, { dotBien: "khong-ra-mau-so" }), truoc), /KHONG RA VAO MAU SO/);
});

// ---- AC-5: ngưỡng thật của loaiHinhNhom (≥ 20 bài nói rõ loại, ≥ 85% một loại) ----
function fixtureNhom() {
  const bai = [];
  const b = (id, conv, text, x = {}) => bai.push({ post_id: `do3g${id}`, conversation_id: conv, text, snapshot_id: SNAP, agent_id: "openclaw-hook", group_name: "Nhóm DO3", ...x });
  for (let i = 0; i < 24; i++) b(`1a${i}`, "do3:g1", `Bán căn hộ 2PN tầng ${i}`);
  b("1h", "do3:g1", "Bán nhà phố mặt ngõ");
  b("1t1", "do3:g1", "Bán căn hộ thử", { agent_id: "test-do3" });
  b("1t2", "do3:g1", "Bán căn hộ thử", { group_name: "TEST nhóm" });
  for (let i = 0; i < 20; i++) b(`2a${i}`, "do3:g2", `Bán căn hộ 1PN số ${i}`);
  b("2x", "do3:g2", "Bán căn góc"); // không nói loại → ngoài tập, không vào ngưỡng
  return bai;
}
function kiemNhom(k) {
  const ket = (id) => k.ket.get(`do3g${id}`);
  if (ket("1t1") || ket("1t2")) throw new Error("BAI THU VAO TAP");
  if (ket("2a0") === "dung") throw new Error("KHONG BO MOT RA");
  assert.equal(ket("1h"), "sai");
  assert.deepEqual([k.tap_do, k.n, k.dung, k.sai, k.khong_ra], ["bai-co-chu-loai", 45, 24, 1, 20]);
  const w = wilsonThamChieu(24, 25), t = tongKiem(k, null);
  gan4(t.wilson.thap, w.thap, "wilson thấp");
}
test("DO3-AC-5 phần thuần: bỏ-một-ra loại hình theo nhóm, gọi đúng loaiHinhNhom/docLoaiHinh của transform-zalo", () => {
  const bai = fixtureNhom();
  kiemNhom(kiemNguocNhom(bai));
  assert.throws(() => kiemNhom(kiemNguocNhom(bai, { dotBien: "khong-bo-bai" })), /KHONG BO MOT RA/);
  assert.throws(() => kiemNhom(kiemNguocNhom(bai, { dotBien: "giu-bai-thu" })), /BAI THU VAO TAP/);
});

// ---- AC-4 + AC-5 qua bộ ghi: nhịp tuần, lỗi tiêm, tuần trước, đường không hàm kiểm ngược ----
const T2 = "2026-11-02", T3 = "2026-11-03"; // thứ Hai, thứ Ba của 2026-W45
const kiemCua = (kq, duong) => kq.dq.find((r) => r.check_name === "do3-kiem-nguoc" && r.entity === duong);
const tru = (a, b) => ({ n: a.n - b.n, dung: a.dung - b.dung, sai: a.sai - b.sai, khong_ra: a.khong_ra - b.khong_ra });
/** Ghi fixture AC-4 (bài kênh S03, Người, tin) và AC-5 (bài hai nhóm) vào DB thử; số suy của N1d qua ganSdtQuaNguoi. */
async function ghiFixtureKiem(c) {
  for (const n of [501, 502, 503, 504, 505, 506, 512]) {
    const { rows: [{ k }] } = await c.query("SELECT count(*)::int AS k FROM stg_zalo_posts WHERE text LIKE '%' || $1 || '%'", [chu(n)]);
    assert.equal(k, 0, `số bịa ${chu(n)} đã có trong dữ liệu — đổi số fixture`);
  }
  const { bai, tins } = fixtureSo();
  const pk = new Map();
  for (const s of [1, 2, 3, 4, 5, 6]) pk.set(`do3k${s}`, await nguoi(c, `do3k${s}`));
  for (const b of bai) {
    await c.query(`INSERT INTO stg_zalo_posts (post_id, snapshot_id, agent_id, group_name, text, posted_at, sender_id, sender_name)
                   VALUES ($1, $2, 'openclaw-hook', 'Nhóm DO3', $3, now(), $4, 'Người thử')`, [b.post_id, SNAP, b.text, b.sender_id]);
  }
  for (const t of tins) {
    const suy = t.field_provenance.seller_phone;
    await c.query(`INSERT INTO sale_offer_records (offer_id, originating_system_key, kind, first_seen, last_seen, post_ids, source, seller_ref, seller_phone, seller_phone_hash)
                   VALUES ($1, $2, 'sale', now(), now(), $3, 'S03', $4, $5, $6)`,
    [t.offer_id, t.post_ids[0], t.post_ids, t.seller_ref, suy ? null : t.seller_phone, suy ? null : bamSo(t.seller_phone)]);
  }
  await lienLac(c, pk.get("do3k1"), so(501));
  await ganSdtQuaNguoi(c, yen);
  const { rows: [n1d] } = await c.query("SELECT field_provenance -> 'seller_phone' ->> 'rule_id' AS r FROM sale_offer_records WHERE offer_id = 'offer_do3kN1d'");
  assert.equal(n1d.r, "s03-qua-nguoi-dang", "N1d mang số suy qua người đăng");
  for (const b of fixtureNhom()) {
    await c.query(`INSERT INTO stg_zalo_posts (post_id, snapshot_id, agent_id, group_name, text, posted_at, conversation_id)
                   VALUES ($1, $2, $3, $4, $5, now(), $6)`, [b.post_id, SNAP, b.agent_id, b.group_name, b.text, b.conversation_id]);
  }
  // Đường quy ước nhóm đang chạy (CI: DB rỗng).
  await tin(c, "k5n");
  await ghiNhom(c, [pbNhom("k5n")]);
}

test("DO3-AC-4 nhịp tuần qua bộ ghi: lỗi tiêm không để dòng, lượt sau ghi đúng một dòng, lượt nữa không thêm; không gọi model", coDb, async () => {
  await trongGiaoDich(async (c) => {
    await chuanBi(c);
    const by = Object.fromEntries(DUONG.map((d) => [d.duong, d]));
    const goc = await thu(c, async () => {
      await tin(c, "k5n"); await ghiNhom(c, [pbNhom("k5n")]); // đường nhóm chạy cả ở gốc
      const kq = await doLamGiau(c, { ngay: T2 });
      return { so: kiemCua(kq, SO)?.detail ?? { n: 0, dung: 0, sai: 0, khong_ra: 0 }, nhom: kiemCua(kq, NHOM).detail };
    });
    await ghiFixtureKiem(c);
    // Tuần trước có dòng với tỉ lệ đặt trước.
    await c.query(`INSERT INTO dq_check_results (check_name, entity, status, detail) VALUES ('do3-kiem-nguoc', $1, 'pass', $2)`,
      [SO, JSON.stringify({ tuan: "2026-W44", n: 20, dung: 2, sai: 8, khong_ra: 10 })]);
    const goiMang = [];
    const fetchGoc = globalThis.fetch;
    globalThis.fetch = async (...a) => { goiMang.push(a[0]); throw new Error("DO3 không được gọi mạng"); };
    try {
      const dongTuan = async () => (await dongDq(c, "do3-kiem-nguoc", "tuan", "2026-W45"));
      const kiemLan2 = async () => {
        const rows = await dongTuan();
        if (!rows.some((r) => r.entity === SO)) throw new Error("MAT TUAN KHI LUOT DAU LOI");
        if (rows.filter((r) => r.entity === SO).length !== 1) throw new Error("KIEM NGUOC LAP TUAN");
        const d = rows.find((r) => r.entity === SO).detail;
        assert.deepEqual(tru(d, goc.so), { n: 13, dung: 3, sai: 1, khong_ra: 9 }, "ma trận qua bộ ghi");
        assert.equal(d.tap_do, "tin-co-so-rieng");
        kiemTong(d, d, { dung: 2, sai: 8 });
        for (const k of ["tuan", "tap_do", "n", "dung", "sai", "khong_ra", "ty_le_dung", "wilson", "phu", "chenh", "co_y_nghia", "nguong_phat_hien", "lat", "phien_ban_thuoc"]) {
          assert.ok(k in d, `thiếu ${k}`);
        }
        return rows;
      };
      // Lượt 1 (thứ Hai) lỗi sau khi tính → rút giao dịch, 0 dòng tuần.
      await c.query("SAVEPOINT luot1");
      await assert.rejects(doLamGiau(c, { ngay: T2, write: true, loiTiem: "LOI TIEM DO3" }), /LOI TIEM DO3/);
      await c.query("ROLLBACK TO SAVEPOINT luot1");
      assert.equal((await dongTuan()).length, 0);
      await thu(c, async () => {
        await doLamGiau(c, { ngay: T3, write: true, dotBien: "chi-luot-dau" });
        await assert.rejects(kiemLan2, /MAT TUAN KHI LUOT DAU LOI/);
      });
      // Lượt 2 (thứ Ba) → đúng một dòng mỗi đường đang chạy.
      await doLamGiau(c, { ngay: T3, write: true });
      const lan2 = await kiemLan2();
      // Lượt 3 → không thêm dòng, detail không đổi.
      await thu(c, async () => {
        await doLamGiau(c, { ngay: T3, write: true, dotBien: "lap-tuan" });
        await assert.rejects(kiemLan2, /KIEM NGUOC LAP TUAN/);
      });
      await doLamGiau(c, { ngay: T3, write: true });
      const lan3 = await kiemLan2();
      assert.deepEqual(lan3.map((r) => [r.entity, r.detail]), lan2.map((r) => [r.entity, r.detail]));
      // AC-5 qua bộ ghi: nhóm G1, G2 vào đúng bảng viết trước (phần chênh so gốc).
      const dn = lan2.find((r) => r.entity === NHOM).detail;
      assert.deepEqual(tru(dn, goc.nhom), { n: 45, dung: 24, sai: 1, khong_ra: 20 });
      kiemTong(dn, dn, null);
      assert.equal(by[NHOM].kiem, "nhom");
    } finally { globalThis.fetch = fetchGoc; }
    assert.equal(goiMang.length, 0, "lời gọi model/mạng = 0");
  });
});

test("DO3-AC-5 đường đang chạy chưa có hàm kiểm ngược ghi skip «chưa có kiểm ngược», không số 0", coDb, async () => {
  await trongGiaoDich(async (c) => {
    await chuanBi(c);
    // Sổ đường của ca: diện tích suy ra «đang chạy» bằng một luật giả, chưa có hàm kiểm ngược.
    const gia = DUONG.map((d) => (d.duong === "dien-tich-suy-ra" ? { ...d, rule_ids: ["do3-gia"] } : d));
    await tin(c, "k5d");
    await writeAssertions(c, [{ subject_key: "S03:do3k5d", field: "bedrooms", value: "2", evidence_tier: "inferred", method: "e1_rule",
      method_version: "do3-test", rule_id: "do3-gia" }]);
    const kiem = (kq) => {
      const r = kiemCua(kq, "dien-tich-suy-ra");
      assert.ok(r, "có dòng kiểm ngược cho đường đang chạy");
      if (r.status !== "skip" || "n" in r.detail || "dung" in r.detail) throw new Error(`CHUA KIEM GHI SO 0: ${JSON.stringify(r.detail)}`);
      assert.deepEqual([r.detail.ly_do, r.detail.tuan], ["chua-co-kiem-nguoc", "2026-W45"]);
    };
    await thu(c, async () => assert.rejects(async () => kiem(await doLamGiau(c, { ngay: T3, write: true, duong: gia, dotBien: "chua-kiem-so-0" })), /CHUA KIEM GHI SO 0/));
    kiem(await doLamGiau(c, { ngay: T3, write: true, duong: gia }));
    // Một lần mỗi tuần.
    assert.equal(kiemCua(await doLamGiau(c, { ngay: T3, write: true, duong: gia }), "dien-tich-suy-ra"), undefined);
  });
});

// ================= Task 4: bất biến lát và chặn rò trên detail thật =================
import * as DO1 from "../do-hang-ngay.mjs";
import { phanRa as phanRaDo1 } from "../lib/do-hang-ngay.mjs";
import { KHOA_LAT_DON_VI as KHOA_DO3, phanRa as phanRaDo3 } from "../do-lam-giau.mjs";
import { FILL } from "../sync-cloud.mjs";

/** Mọi nhóm số × mọi chiều của mọi dòng do3-*: có chiều thị trường; tổng các ô = tổng của chiều = số chung của nhóm. */
function kiemLatMoiDong(rows) {
  let so = 0;
  for (const r of rows) {
    for (const [nhom, chieu] of Object.entries(r.detail.lat ?? {})) {
      if (!("thi_truong" in chieu)) throw new Error(`THIEU THI TRUONG: ${r.entity} ${nhom}`);
      for (const [ten, v] of Object.entries(chieu)) {
        const tong = Object.values(v.o).reduce((s, n) => s + n, 0);
        if (tong !== v.tong || v.tong !== r.detail[nhom]) throw new Error(`TONG LAT LECH: ${r.entity} ${nhom}.${ten} ${tong}/${v.tong}/${r.detail[nhom]}`);
        so++;
      }
    }
  }
  return so;
}
test("DO3-AC-6 lát của DO1 trên detail thật: thị trường, phường 30 ô + khác, hai ô chưa gắn tách nhau, dự án, tổng ô = tổng chung", coDb, async () => {
  assert.equal(KHOA_DO3, DO1.KHOA_LAT_DON_VI, "KHOA_LAT_DON_VI là hàm của DO1 (import, không bản chép)");
  assert.equal(phanRaDo3, phanRaDo1, "phanRa là hàm của DO1");
  await trongGiaoDich(async (c) => {
    await chuanBi(c);
    const w = await khuThu(c, 35);
    await tin(c, "k6seed"); await ghiNhom(c, [pbNhom("k6seed")]); // đường nhóm đang chạy cả trên DB rỗng
    await doLamGiau(c, { ngay: T3, write: true, kiemNguoc: false }); // lập mốc
    // Ma trận: phường i có 36 − i tin (35..1), 3 tin không area_id, 2 tin chỉ có thị trường và chữ toà «S8.02», 2 dự án (10 + 5 tin).
    const ma = [];
    for (let i = 1; i <= 35; i++) for (let j = 0; j < 36 - i; j++) { const m = `k6w${i}x${j}`; await tin(c, m, { area: w[i - 1] }); ma.push(m); }
    for (let j = 0; j < 3; j++) { await tin(c, `k6n${j}`); ma.push(`k6n${j}`); }
    for (let j = 0; j < 2; j++) { await tin(c, `k6t${j}`, { area: "vn-do3-ma" }); ma.push(`k6t${j}`); }
    await writeAssertions(c, [0, 1].map((j) => ({ subject_key: `S03:do3k6t${j}`, field: "block_raw", value: "S8.02", evidence_tier: "observed",
      method: "parser", method_version: "do3-test" })));
    await resolveOffers(c, ["offer_do3_k6t0", "offer_do3_k6t1"]);
    const node = [];
    for (const k of [1, 2]) {
      const { rows: [{ id }] } = await c.query(`INSERT INTO asset_nodes (node_type, name, slug) VALUES ('project', $1, $1) RETURNING id`, [`do3-du-an-${k}-${P}`]);
      const { rows: [p] } = await c.query(`INSERT INTO properties (kind, property_type, project_node, first_seen, last_seen) VALUES ('sale', 'apartment', $1, now(), now()) RETURNING id`, [id]);
      for (const m of ma.slice(k === 1 ? 0 : 10, k === 1 ? 10 : 15)) await c.query("INSERT INTO property_offers (property_id, offer_id) VALUES ($1, $2)", [p.id, `offer_do3_${m}`]);
      node.push(`node:${id}`);
    }
    await ghiNhom(c, ma.map((m) => pbNhom(m)));
    const kiem = async (dotBien) => {
      const kq = await doLamGiau(c, { ngay: T3, write: true, dotBien });
      const rows = [...await dongDq(c, "do3-thay-doi", "ngay", T3), ...await dongDq(c, "do3-kiem-nguoc", "tuan", "2026-W45")];
      assert.ok(kiemLatMoiDong(rows) >= 4 * 4, "đã duyệt mọi nhóm × chiều");
      const them = detailCua(kq, NHOM).lat.them;
      if (them.toa.o["chua-co-danh-ba"] !== 2) throw new Error(`GOP HAI O CHUA GAN: ${JSON.stringify(them.toa.o)}`);
      assert.deepEqual(them.thi_truong.o, { "vn-do3-ma": 326, "vn-do3-mb": 306, "khong-tin-hieu": 3, "chua-co-danh-ba": 0 });
      const phuong = Object.keys(them.phuong.o).filter((k) => k.startsWith("vn-do3-w"));
      assert.deepEqual(phuong, w.slice(0, 30), "30 phường lớn nhất");
      assert.deepEqual([them.phuong.o.khac, them.phuong.o["khong-tin-hieu"], them.phuong.o["chua-co-danh-ba"]], [15, 5, 0]);
      assert.deepEqual([them.toa.o["khong-tin-hieu"], them.toa.tong], [633, 635]);
      assert.deepEqual([them.du_an.o[node[0]], them.du_an.o[node[1]], them.du_an.o["khong-tin-hieu"]], [10, 5, 620]);
      assert.ok(rows.some((r) => r.detail.tap_do), "có dòng kiểm ngược để duyệt lát dung/sai/khong_ra");
    };
    for (const [dotBien, msg] of [["gop-chua-gan", /GOP HAI O CHUA GAN/], ["bo-khac", /TONG LAT LECH/], ["bo-thi-truong", /THIEU THI TRUONG/]]) {
      await thu(c, async () => assert.rejects(() => kiem(dotBien), msg, dotBien));
    }
    await kiem();
  });
});

// ---- AC-8: chặn rò ----
const TEN_THAT = "TEN_THAT_DO3_GIA";
function kiemFill(fill) {
  if (!fill.includes("dq_check_results")) throw new Error("THIEU dq_check_results trong FILL");
  for (const t of ["enrichment_value_state", "enrichment_value_change"]) if (fill.includes(t)) throw new Error(`ANH CHUP LEN CLOUD: ${t}`);
}
test("DO3-AC-8 detail do3-* không mang SĐT, băm SĐT, người đăng, chữ bài, labeler, tên nguồn thật; bảng ảnh chụp không vào FILL; có rò thì dừng", coDb, async () => {
  kiemFill(FILL);
  assert.throws(() => kiemFill([...FILL, "enrichment_value_state"]), /ANH CHUP LEN CLOUD/);
  await trongGiaoDich(async (c) => {
    await chuanBi(c);
    await c.query(`INSERT INTO source_registry (code, real_name, label_vi) VALUES ('S09', $1, 'thử') ON CONFLICT (code) DO UPDATE SET real_name = EXCLUDED.real_name`, [TEN_THAT]);
    const SDT = "+84912345678", BAM = bamSo(SDT);
    const pk = await nguoi(c, "do3s8");
    await lienLac(c, pk, SDT);
    await tin(c, "a8", { sender: "do3s8", ten: "Nguyễn Văn Hiếu", text: `Bán căn hộ ${TEN_THAT} giá tốt, liên hệ anh Hiếu ngay hôm nay` });
    await tin(c, "a8n"); await ghiNhom(c, [pbNhom("a8n")]);
    await ganSdtQuaNguoi(c, yen);
    await doLamGiau(c, { ngay: T3, write: true }); // lập mốc
    const { rows: [{ item_id }] } = await c.query(
      `INSERT INTO eval_label_items (lat, source_code, ref_id, text_hash, split, seed) VALUES ('do3-thu', 'S03', 'do3a8', 'h-do3-a8', 'dev', 'do3') RETURNING item_id`);
    await c.query(`INSERT INTO eval_labels (item_id, labeler_id, field, value, labeled_at) VALUES ($1, 'LABELER_DO3_X', 'seller_phone', $2, '${T3}T10:00:00+07:00')`, [item_id, so(899)]);
    const CAM = ["912345678", BAM, "Hiếu", TEN_THAT, "LABELER_DO3_X"];
    const quet = async () => {
      const { rows } = await c.query("SELECT detail FROM dq_check_results WHERE check_name LIKE 'do3-%'");
      assert.ok(rows.length >= 4);
      const json = rows.map((r) => r.detail).join("\n");
      for (const x of CAM) if (json.includes(x)) throw new Error(`LO DO3: detail chứa «${x}»`);
    };
    const dem = async () => (await c.query("SELECT count(*)::int AS n FROM dq_check_results WHERE check_name LIKE 'do3-%'")).rows[0].n;
    const kq = await doLamGiau(c, { ngay: T3, write: true });
    assert.equal(detailCua(kq, SO).nguoi_sua, 1, "nhãn của người gắn đã vào số — chuỗi cấm có labeler, chữ bài");
    await quet();
    // Đối chứng dương: băm số vào ô lát → dừng, không ghi dòng nào; source_registry rỗng → dừng.
    const truoc = await dem();
    await thu(c, async () => {
      await assert.rejects(doLamGiau(c, { ngay: T3, write: true, dotBien: `lo:${BAM}` }), /LO DO3/);
      assert.equal(await dem(), truoc);
    });
    await thu(c, async () => {
      await c.query("UPDATE source_registry SET real_name = '', source_ids = '{}'");
      await assert.rejects(doLamGiau(c, { ngay: T3, write: true }), /LO DO3/);
      assert.equal(await dem(), truoc);
    });
    // Chiều đỏ: bỏ chặn rò → băm số lọt vào detail → quét đỏ.
    await thu(c, async () => {
      await doLamGiau(c, { ngay: T3, write: true, dotBien: `bo-chan-lo:${BAM}` });
      await assert.rejects(quet, /LO DO3/);
    });
  });
});
