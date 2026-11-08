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
import { docGiaTriSong, docNguoiRut, docNhanNgay } from "../lib/do-lam-giau-db.mjs";
import { DUONG, demThayDoi, gopNgay, latPhang, nguoiSua, soAnh, tuSoat } from "../lib/do-lam-giau.mjs";
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
    [["loai-hinh-nhom"], "property_type", true, "nhom"]);
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
    const goc = await thu(c, async () => songCua(await doLamGiau(c, { ngay: D })));
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
    await thu(c, async () => assert.rejects(async () => kiemLan1(await doLamGiau(c, { ngay: D, write: true, dotBien: "lap-moc-co-dong" })), /LAP MOC CO DONG/));
    await kiemLan1(await doLamGiau(c, { ngay: D, write: true }));
    // Sửa dữ liệu qua bên ghi thật.
    await rutLL(c, [ll.A]); // A: Người hết số → tin mất số suy
    ll.B = await lienLac(c, pk.B, so(300)); // B: nhận số suy mới
    await rutLL(c, [ll.C]); ll.C2 = await lienLac(c, pk.C, so(301)); // C: đổi số
    await ganSdtQuaNguoi(c, yen);
    await ghiNhom(c, [pbNhom("a2P", "house")]); await ghiNhom(c, [pbNhom("a2P")]); // P: thay-boi-luot rồi ghi lại cùng giá trị
    await ghiNhom(c, [pbNhom("a2Q", "house")]); // Q: đổi loại hình
    await nguoiRutNhom(c, ["a2R"], "hitl-thay"); // R: người thay
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
        const kq = await doLamGiau(c, { ngay: D, write: true, dotBien });
        await assert.rejects(async () => kiemLan2(await dongDoi(c, D), kq), msg, dotBien);
      });
    }
    { const kq = await doLamGiau(c, { ngay: D, write: true }); kiemLan2(await dongDoi(c, D), kq); }
    // Lần 3: C về số đầu ngày → dòng của C bị xoá.
    await rutLL(c, [ll.C2]); ll.C3 = await lienLac(c, pk.C, so(200 + "C".charCodeAt(0)));
    await ganSdtQuaNguoi(c, yen);
    const kiemLan3 = (rows, kq) => {
      if (rows.some((r) => r.subject_key === "tin:offer_do3_a2C")) throw new Error("KHONG XOA KHI VE CU");
      assert.equal(detailCua(kq, SO).doi, 0);
    };
    await thu(c, async () => {
      const kq = await doLamGiau(c, { ngay: D, write: true, dotBien: "khong-xoa-ve-cu" });
      await assert.rejects(async () => kiemLan3(await dongDoi(c, D), kq), /KHONG XOA KHI VE CU/);
    });
    { const kq = await doLamGiau(c, { ngay: D, write: true }); kiemLan3(await dongDoi(c, D), kq); }
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
      const kq = await doLamGiau(c, { ngay: D, write: true, dotBien: "hai-dong" });
      await assert.rejects(async () => kiemLan4(await dongDoi(c, D), kq), /HAI DONG MOT CHU THE/);
    });
    { const kq = await doLamGiau(c, { ngay: D, write: true }); kiemLan4(await dongDoi(c, D), kq); }
  });
});

// ---- AC-3: người rút, người sửa ----
test("DO3-AC-3 người rút (hitl-thay, hoan-tac) và người sửa theo nhãn ngày D sau chuẩn hoá; đường không lối người không ghi 0", coDb, async () => {
  await trongGiaoDich(async (c) => {
    await chuanBi(c);
    const by = Object.fromEntries(DUONG.map((d) => [d.duong, d]));
    const goc = { rut: (await docNguoiRut(c, by[NHOM], D)).size, nhanN: nguoiSua(await docNhanNgay(c, by[NHOM], D), "property_type"),
      nhanS: nguoiSua(await docNhanNgay(c, by[SO], D), "seller_phone") };
    // Quy ước nhóm: H1, H2 (người thay), V1 (người hoàn tác), T1–T3 (máy thay), L1–L4 (mang giá trị để gắn nhãn).
    const nhom = ["H1", "H2", "V1", "T1", "T2", "T3", "L1", "L2", "L3", "L4"];
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
    // Rút ngày D.
    await nguoiRutNhom(c, ["a3H1", "a3H2"], "hitl-thay");
    await nguoiRutNhom(c, ["a3V1"], "hoan-tac:sai-nhom");
    await ghiNhom(c, ["T1", "T2", "T3"].map((x) => pbNhom(`a3${x}`, "house"))); // thay-boi-luot, vẫn trên đường
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
    const kiem = (kq) => {
      const s = detailCua(kq, SO), n = detailCua(kq, NHOM);
      if ("nguoi_rut" in s) throw new Error("KHONG LOI NGUOI GHI 0");
      assert.equal(s.duong_nguoi_rut, false);
      if (n.nguoi_rut !== goc.rut + 3) throw new Error(`MAY RUT THANH NGUOI: nguoi_rut ${n.nguoi_rut}`);
      if (s.nguoi_sua !== goc.nhanS.nguoi_sua + 1) throw new Error(`SDT CHUA CHUAN HOA: nguoi_sua ${s.nguoi_sua}`);
      assert.equal(s.nhan_da_so, goc.nhanS.nhan_da_so + 3);
      if (n.nguoi_sua !== goc.nhanN.nguoi_sua + 1 || n.nhan_da_so !== goc.nhanN.nhan_da_so + 4) throw new Error(`NHAN NGOAI NGAY: ${n.nguoi_sua}/${n.nhan_da_so}`);
      assert.equal(n.doi, 3, "máy thay bởi lượt vẫn trên đường → đổi");
      assert.equal(n.may_rut, 0, "người rút không vào máy rút");
    };
    for (const [dotBien, msg] of [["may-rut-thanh-nguoi", /MAY RUT THANH NGUOI/], ["sdt-chua-chuan", /SDT CHUA CHUAN HOA/],
      ["khong-loi-ghi-0", /KHONG LOI NGUOI GHI 0/], ["nhan-ngoai-ngay", /NHAN NGOAI NGAY/]]) {
      await thu(c, async () => assert.rejects(async () => kiem(await doLamGiau(c, { ngay: D, write: true, dotBien })), msg, dotBien));
    }
    kiem(await doLamGiau(c, { ngay: D, write: true }));
  });
});
