// danh-ba-nguoi.test.mjs — DB2b `ho-nguoi-theo-nguon`, lõi thuần (không DB): AC-5 luật bí danh SĐT (E5), AC-9 chỉ local,
// không suy, không tầng A (E9), luật rút vai (AC-6) và các ô Review Focus của kế hoạch.
import { test } from "node:test";
import assert from "node:assert/strict";
import { FILL } from "../sync-cloud.mjs";
import {
  BANG_TANG_A, PHUONG_PHAP_GHI, SQL, VAI_GHI, bangDuocDoc, chonVaiRut, giaiNguoi, giuVaiBaiMat, khoaBiDanh, moiKhoaNguoi,
  rutDinhDanh,
} from "../lib/danh-ba-nguoi.mjs";

const BON_BANG = ["parties", "registry_aliases", "registry_events", "party_roles"];

/** Khoá giả tất định để so người: pty_T0001, … */
function khoaGia() {
  let n = 0;
  return () => `pty_T${String(++n).padStart(4, "0")}`;
}
let soTin = 0;
const tin = (source, o = {}) => ({
  offer_id: `o${++soTin}`, source, originating_system_key: `k${soTin}`, seller_ref: null, seller_name: null,
  seller_phone_hash: null, post_ids: [], first_seen: `2026-10-${String(soTin).padStart(2, "0")}T00:00:00Z`, retired_at: null, ...o,
});
const bai = (rows) => new Map(rows.map(([post_id, source, sender_id, sender_name = null]) => [post_id, { source, sender_id, sender_name }]));
/** Người giữ bí danh (S0x, kind, value) trong bộ bí danh. */
const chu = (bd, s, kind, v) => bd.get(khoaBiDanh(s, kind, v));
/** Áp kết quả một lượt vào bộ bí danh (như ghi DB). */
function ap(bd, kq) {
  const moi = new Map(bd);
  for (const a of kq.biDanhMoi) moi.set(khoaBiDanh(a.source, a.kind, a.value, a.object_key), a.object_key);
  return moi;
}

// ---- AC-5: luật bí danh SĐT theo khuyến nghị Hỏi-4 ----

/** Bản sao luật theo LỐI KHÁC của Hỏi-4 (gắn SĐT chưa ai giữ vào người tài khoản duy nhất) — chỉ để chiều đỏ. */
function giaiNguoiGanSdt(tins, biDanh, o) {
  const kq = giaiNguoi(tins, biDanh, o);
  const daGan = new Set(); // ai thấy trước giữ SĐT
  for (const t of tins) {
    const d = rutDinhDanh(t, o.baiTheoId);
    if (d.taiKhoan.length !== 1 || !d.sdt || daGan.has(`${t.source}|${d.sdt}`)) continue;
    const giu = kq.biDanhMoi.find((a) => a.kind === "sdt_bam" && a.value === d.sdt && a.source === t.source);
    const tk = kq.vai.find((v) => v.subject_key === `${t.source}:${t.originating_system_key}`);
    if (giu && tk) { giu.object_key = tk.party_key; daGan.add(`${t.source}|${d.sdt}`); }
  }
  return kq;
}

function maTranAC5(giai) {
  const taoKhoa = khoaGia();
  const baiTheoId = bai([["pa", "S03", "A"], ["pb", "S03", "B"], ["pd1", "S03", "A"], ["pd2", "S03", "B"]]);
  const ta = tin("S03", { post_ids: ["pa"], seller_phone_hash: "h" });
  const tb = tin("S03", { seller_phone_hash: "h" });
  const tc = tin("S03", { post_ids: ["pb"], seller_phone_hash: "h" });
  const td = tin("S03", { post_ids: ["pd1", "pd2"], seller_phone_hash: "k" });
  const te = tin("S03", { seller_phone_hash: "m" });
  const tf = tin("S05", { seller_phone_hash: "h" });
  const tins = [ta, tb, tc, td, te, tf];
  const kq = giai(tins, new Map(), { baiTheoId, taoKhoa });
  return { kq, bd: ap(new Map(), kq), tins, baiTheoId, taoKhoa, ta, tb, tc, td, te, tf };
}
const vaiCua = (kq, t) => kq.vai.filter((v) => v.subject_key === `${t.source}:${t.originating_system_key}`);

/** Bảy dòng (a)–(g) của E5; trả mảng lỗi theo dòng (rỗng = đạt). */
function kiemAC5(m) {
  const { kq, bd } = m;
  const A = chu(bd, "S03", "tai_khoan_nguon", "A");
  const B = chu(bd, "S03", "tai_khoan_nguon", "B");
  const PH = chu(bd, "S03", "sdt_bam", "h");
  const loi = [];
  const dong = (ten, dk) => { if (!dk) loi.push(ten); };
  const va = vaiCua(kq, m.ta);
  dong("(a)", va.length === 1 && va[0].party_key === A && PH && PH !== A && ![...bd].some(([k, v]) => v === A && k.includes("|sdt_bam|")));
  const vb = vaiCua(kq, m.tb);
  dong("(b)", vb.length === 1 && vb[0].party_key === PH && vb[0].method === "parser" && vb[0].evidence_tier === "observed");
  const vc = vaiCua(kq, m.tc);
  dong("(c)", vc.length === 1 && vc[0].party_key === B && chu(bd, "S03", "sdt_bam", "h") === PH);
  const vd = vaiCua(kq, m.td);
  const PK = chu(bd, "S03", "sdt_bam", "k");
  dong("(d)", vd.length === 2 && new Set(vd.map((v) => v.party_key)).size === 2 && vd.every((v) => [A, B].includes(v.party_key)) && PK && ![A, B].includes(PK));
  const ve = vaiCua(kq, m.te);
  const PM = chu(bd, "S03", "sdt_bam", "m");
  dong("(e)", ve.length === 1 && ve[0].party_key === PM && ve[0].method === "parser");
  const PH5 = chu(bd, "S05", "sdt_bam", "h");
  dong("(f)", Boolean(PH5) && PH5 !== PH && kq.nguoiMoi.find((p) => p.party_key === PH5)?.source === "S05");
  const lai = giaiNguoi(m.tins, bd, { baiTheoId: m.baiTheoId, taoKhoa: m.taoKhoa });
  dong("(g)", lai.nguoiMoi.length === 0 && lai.biDanhMoi.length === 0);
  return loi;
}

test("AC-5 luật bí danh SĐT: ma trận bảy dòng (a)–(g), SĐT là người riêng của nguồn", () => {
  const loi = kiemAC5(maTranAC5(giaiNguoi));
  let soAssert = 0;
  for (const d of ["(a)", "(b)", "(c)", "(d)", "(e)", "(f)", "(g)"]) {
    assert.ok(!loi.includes(d), `AC-5 sai dòng ${d}`);
    soAssert++;
  }
  assert.equal(soAssert, 7);
});

test("AC-5 chiều đỏ: luật theo lối khác của Hỏi-4 (gắn SĐT vào người tài khoản) làm dòng (a) đỏ", () => {
  const loi = kiemAC5(maTranAC5(giaiNguoiGanSdt));
  assert.ok(loi.includes("(a)"), "AC-5 SĐT gắn vào người tài khoản: h — bản sao lối khác vẫn xanh, thước không phân biệt");
});

// ---- AC-9: chỉ local, không suy, không tầng A ----

test("AC-9 chỉ local, không suy, không tầng A", () => {
  const giao = (ds) => ds.filter((t) => BON_BANG.includes(t));
  assert.deepEqual(giao(FILL), [], "AC-9 sync-cloud đẩy bảng danh bạ");
  assert.deepEqual(giao(["sale_offers", "parties"]), ["parties"], "chiều đỏ: danh sách mẫu có parties");
  assert.deepEqual(VAI_GHI, ["nguoi_dang"]);
  const { kq } = maTranAC5(giaiNguoi);
  const ppSinh = [...new Set(kq.vai.map((v) => v.method))];
  assert.deepEqual(ppSinh.filter((p) => !PHUONG_PHAP_GHI.includes(p)), [], "AC-9 vai suy luận");
  assert.ok(kq.vai.every((v) => VAI_GHI.includes(v.role)));
  const lo = Object.values(SQL).flatMap(bangDuocDoc);
  assert.deepEqual(lo, [], `AC-9 bảng tầng A trong bộ dựng: ${lo.join(", ")}`);
  assert.deepEqual(bangDuocDoc("SELECT 1 FROM sale_offers s JOIN users u ON true"), ["users"], "chiều đỏ: JOIN users");
  assert.ok(BANG_TANG_A.includes("source_registry"));
  assert.ok(kq.nguoiMoi.every((p) => /^S0[1-9]$/.test(p.source)), "AC-9 nguồn không phải mã S0x");
});

// ---- Rút định danh + Review Focus ----

test("rutDinhDanh: S06 seller_ref, người gửi S03/S05, Review Focus 1/2/4", () => {
  const s06 = rutDinhDanh(tin("S06", { seller_ref: "ct:900001", seller_name: " Anh Tư " }), new Map());
  assert.deepEqual(s06.taiKhoan, [{ value: "900001", ten: "Anh Tư", post_ids: [] }]);
  assert.equal(s06.field, "seller_ref");
  // RF4: seller_ref lạ → không tài khoản, đếm không định danh, không ném
  const la = tin("S06", { seller_ref: "S06:abc" });
  assert.deepEqual(rutDinhDanh(la, new Map()).taiKhoan, []);
  assert.equal(giaiNguoi([la], new Map(), { taoKhoa: khoaGia() }).khongDinhDanh.S06, 1);
  // RF1: sender_id rỗng hay khoảng trắng → không tài khoản; RF2: hai bài cùng người gửi → một tài khoản, hai bài
  const bt = bai([["p1", "S03", "  "], ["p2", "S03", "s1", "Lan"], ["p3", "S03", "s1"], ["p4", "S05", "s9"]]);
  const d = rutDinhDanh(tin("S03", { post_ids: ["p1", "p2", "p3", "p4", "p-mat"] }), bt);
  assert.deepEqual(d.taiKhoan, [{ value: "s1", ten: "Lan", post_ids: ["p2", "p3"] }], "bài kênh khác nguồn (p4) và bài mất không tính");
  const kq = giaiNguoi([tin("S03", { post_ids: ["p2", "p3"] })], new Map(), { baiTheoId: bt, taoKhoa: khoaGia() });
  assert.equal(kq.vai.length, 1);
  assert.deepEqual(kq.vai[0].evidence.post_ids, ["p2", "p3"]);
  assert.ok(kq.biDanhMoi.some((a) => a.kind === "ten" && a.value === "Lan"), "tên hiển thị là bí danh ten");
});

test("moiKhoaNguoi: pty_ + 26 ký tự Crockford, không trùng", () => {
  const ks = new Set(Array.from({ length: 1000 }, () => moiKhoaNguoi()));
  assert.equal(ks.size, 1000);
  for (const k of ks) assert.match(k, /^pty_[0-9A-HJKMNP-TV-Z]{26}$/);
});

// ---- AC-6 luật rút vai (lõi) ----

test("AC-6 bài mất (tin có SĐT): giữ vai theo bài, không vai parser thay; chiều đỏ khi bỏ giữ", () => {
  const t = tin("S03", { post_ids: ["q1"], seller_phone_hash: "h1" });
  const subject = `S03:${t.originating_system_key}`;
  const cu = { id: 1, subject_key: subject, party_key: "pty_CU", method: "source_field", evidence: { offer_id: t.offer_id, field: "post_ids", post_ids: ["q1"] } };
  const mat = new Map(); // q1 không còn nối được
  const giu = giuVaiBaiMat([cu], mat);
  assert.deepEqual([...giu], [subject]);
  const kq = giaiNguoi([t], new Map(), { baiTheoId: mat, taoKhoa: khoaGia(), giuBaiMat: giu });
  assert.deepEqual(kq.vai, [], "AC-6 bài mất sinh vai parser thay");
  assert.deepEqual(kq.khongDinhDanh, {}, "AC-6 tin giữ vai theo bài bị đếm không định danh");
  assert.deepEqual(chonVaiRut([cu], kq.vai, [t], mat), [], "AC-6 bài mất làm rút vai");
  // chiều đỏ: bỏ tập giữ (luật cũ) → bộ dựng sinh vai parser cho đúng tin này
  const doi = giaiNguoi([t], new Map(), { baiTheoId: mat, taoKhoa: khoaGia() });
  assert.deepEqual(doi.vai.map((v) => v.method), ["parser"], "chiều đỏ: thiếu tập giữ phải sinh vai parser");
  // bài nối lại được (cùng người gửi) → không còn giữ; tin chưa từng có vai theo bài → vai parser như AC-4
  assert.deepEqual([...giuVaiBaiMat([cu], bai([["q1", "S03", "s1"]]))], []);
  assert.deepEqual([...giuVaiBaiMat([], mat)], []);
  assert.deepEqual([...giuVaiBaiMat([{ ...cu, method: "parser", evidence: { field: "seller_phone_hash" } }], mat)], []);
});

test("AC-6 chonVaiRut: chỉ rút khi có bằng chứng thay; bài mất thì giữ", () => {
  const t = tin("S03", { post_ids: ["q1"] });
  const subject = `S03:${t.originating_system_key}`;
  const cu = { id: 1, subject_key: subject, party_key: "pty_CU", method: "source_field", evidence: { offer_id: t.offer_id, field: "post_ids", post_ids: ["q1"] } };
  // bài mất: lượt này không sinh vai cho tin, bài không nối được → giữ
  assert.deepEqual(chonVaiRut([cu], [], [t], new Map()), [], "AC-6 bài mất làm rút vai");
  // người gửi đổi: bài vẫn nối được, vai lượt này trỏ người khác → rút
  const bt = bai([["q1", "S03", "s4"]]);
  const moi = [{ subject_key: subject, party_key: "pty_MOI", method: "source_field", evidence: {} }];
  assert.deepEqual(chonVaiRut([cu], moi, [t], bt).map((r) => r.id), [1]);
  // cùng người: lượt này sinh lại đúng (tin, người) → giữ
  assert.deepEqual(chonVaiRut([cu], [{ ...moi[0], party_key: "pty_CU" }], [t], bt), []);
  // tin không có mặt trong lượt → giữ
  assert.deepEqual(chonVaiRut([cu], [], [], bt), []);
  // tin chỉ-SĐT nay có tài khoản → rút vai parser
  const p = { id: 2, subject_key: subject, party_key: "pty_SDT", method: "parser", evidence: { offer_id: t.offer_id, field: "seller_phone_hash" } };
  assert.deepEqual(chonVaiRut([p], moi, [t], bt).map((r) => r.id), [2]);
  // S06 đổi tài khoản → rút
  const t6 = tin("S06", { seller_ref: "ct:2" });
  const s6 = `S06:${t6.originating_system_key}`;
  const r6 = { id: 3, subject_key: s6, party_key: "pty_1", method: "source_field", evidence: { field: "seller_ref" } };
  assert.deepEqual(chonVaiRut([r6], [{ subject_key: s6, party_key: "pty_2" }], [t6], new Map()).map((r) => r.id), [3]);
});

test("RF6 hai bản ghi cùng chủ thể (tin nghỉ doi_khoa + tin thay): một vai, bằng chứng từ bản ghi sống", () => {
  const b = bai([["p1", "S03", "A"]]);
  const cu = tin("S03", { offer_id: "cu", originating_system_key: "k-chung", post_ids: ["p1"], seller_phone_hash: "h",
    retired_at: "2026-10-02T00:00:00Z", first_seen: "2026-09-01T00:00:00Z" });
  const moi = tin("S03", { offer_id: "moi", originating_system_key: "k-chung", post_ids: ["p1"], seller_phone_hash: "h" });
  const rong = tin("S05", { offer_id: "r1", originating_system_key: "k-rong" });
  const rong2 = tin("S05", { offer_id: "r2", originating_system_key: "k-rong", retired_at: "2026-10-02T00:00:00Z" });
  const kq = giaiNguoi([cu, moi, rong, rong2], new Map(), { baiTheoId: b, taoKhoa: khoaGia() });
  const cap = kq.vai.map((v) => `${v.subject_key}|${v.party_key}`);
  assert.equal(new Set(cap).size, cap.length, `RF6 vai trùng chủ thể: ${cap}`);
  assert.deepEqual(kq.vai.map((v) => v.evidence.offer_id), ["moi"], "RF6 bằng chứng không lấy từ bản ghi sống");
  assert.deepEqual(kq.khongDinhDanh, { S05: 1 }, "RF6 khong_dinh_danh đếm theo bản ghi thay vì chủ thể");
});
