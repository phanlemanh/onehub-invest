// danh-ba-nguoi.test.mjs — DB2b `ho-nguoi-theo-nguon`, lõi thuần (không DB): AC-5 luật bí danh SĐT (E5), AC-9 chỉ local,
// không suy, không tầng A (E9), luật rút vai (AC-6) và các ô Review Focus của kế hoạch.
import { test } from "node:test";
import assert from "node:assert/strict";
import { FILL } from "../sync-cloud.mjs";
import {
  BANG_TANG_A, PHUONG_PHAP_GHI, SQL, VAI_GHI, anhXaVai, bangDuocDoc, chonGop, chonVaiRut, giaiNguoi, giuVaiBaiMat, khoaBiDanh,
  moiKhoaNguoi, rutDinhDanh,
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
  seller_phone: null, post_ids: [], first_seen: `2026-10-${String(soTin).padStart(2, "0")}T00:00:00Z`, retired_at: null, ...o,
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
    const giu = kq.biDanhMoi.find((a) => a.kind === "sdt" && a.value === d.sdt && a.source === t.source);
    const tk = kq.vai.find((v) => v.subject_key === `${t.source}:${t.originating_system_key}`);
    if (giu && tk) { giu.object_key = tk.party_key; daGan.add(`${t.source}|${d.sdt}`); }
  }
  return kq;
}

function maTranAC5(giai) {
  const taoKhoa = khoaGia();
  const baiTheoId = bai([["pa", "S03", "A"], ["pb", "S03", "B"], ["pd1", "S03", "A"], ["pd2", "S03", "B"]]);
  const ta = tin("S03", { post_ids: ["pa"], seller_phone: "h" });
  const tb = tin("S03", { seller_phone: "h" });
  const tc = tin("S03", { post_ids: ["pb"], seller_phone: "h" });
  const td = tin("S03", { post_ids: ["pd1", "pd2"], seller_phone: "k" });
  const te = tin("S03", { seller_phone: "m" });
  const tf = tin("S05", { seller_phone: "h" });
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
  const PH = chu(bd, "S03", "sdt", "h");
  const loi = [];
  const dong = (ten, dk) => { if (!dk) loi.push(ten); };
  const va = vaiCua(kq, m.ta);
  dong("(a)", va.length === 1 && va[0].party_key === A && PH && PH !== A && ![...bd].some(([k, v]) => v === A && k.includes("|sdt|")));
  const vb = vaiCua(kq, m.tb);
  dong("(b)", vb.length === 1 && vb[0].party_key === PH && vb[0].method === "parser" && vb[0].evidence_tier === "observed");
  const vc = vaiCua(kq, m.tc);
  dong("(c)", vc.length === 1 && vc[0].party_key === B && chu(bd, "S03", "sdt", "h") === PH);
  const vd = vaiCua(kq, m.td);
  const PK = chu(bd, "S03", "sdt", "k");
  dong("(d)", vd.length === 2 && new Set(vd.map((v) => v.party_key)).size === 2 && vd.every((v) => [A, B].includes(v.party_key)) && PK && ![A, B].includes(PK));
  const ve = vaiCua(kq, m.te);
  const PM = chu(bd, "S03", "sdt", "m");
  dong("(e)", ve.length === 1 && ve[0].party_key === PM && ve[0].method === "parser");
  const PH5 = chu(bd, "S05", "sdt", "h");
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
  const t = tin("S03", { post_ids: ["q1"], seller_phone: "h1" });
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
  const cu = tin("S03", { offer_id: "cu", originating_system_key: "k-chung", post_ids: ["p1"], seller_phone: "h",
    retired_at: "2026-10-02T00:00:00Z", first_seen: "2026-09-01T00:00:00Z" });
  const moi = tin("S03", { offer_id: "moi", originating_system_key: "k-chung", post_ids: ["p1"], seller_phone: "h" });
  const rong = tin("S05", { offer_id: "r1", originating_system_key: "k-rong" });
  const rong2 = tin("S05", { offer_id: "r2", originating_system_key: "k-rong", retired_at: "2026-10-02T00:00:00Z" });
  const kq = giaiNguoi([cu, moi, rong, rong2], new Map(), { baiTheoId: b, taoKhoa: khoaGia() });
  const cap = kq.vai.map((v) => `${v.subject_key}|${v.party_key}`);
  assert.equal(new Set(cap).size, cap.length, `RF6 vai trùng chủ thể: ${cap}`);
  assert.deepEqual(kq.vai.map((v) => v.evidence.offer_id), ["moi"], "RF6 bằng chứng không lấy từ bản ghi sống");
  assert.deepEqual(kq.khongDinhDanh, { S05: 1 }, "RF6 khong_dinh_danh đếm theo bản ghi thay vì chủ thể");
});

// ---- SD3 sdt-luu-goc-e164 (E4 lõi thuần): người theo SĐT đời trước (bí danh sdt_bam) được GIỮ party_key ----
import { readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { khoaBamCu } from "../lib/danh-ba-nguoi.mjs";

function kiemGiuNguoi(mod) {
  const SO = "+84911000001";
  const bd = new Map([[mod.khoaBiDanh("S03", "sdt_bam", mod.khoaBamCu(SO)), "pty_CU"]]);
  const kq = mod.giaiNguoi([tin("S03", { seller_phone: SO }), tin("S05", { seller_phone: SO })], bd, { taoKhoa: khoaGia() });
  const sdt03 = kq.biDanhMoi.filter((a) => a.kind === "sdt" && a.source === "S03");
  if (kq.nguoiMoi.some((p) => p.source === "S03") || sdt03.length !== 1 || sdt03[0].object_key !== "pty_CU")
    throw new Error(`NGUOI MOI THAY VI GIU: S03 người mới ${kq.nguoiMoi.filter((p) => p.source === "S03").length}`);
  // S05 chưa có sdt_bam → người riêng của nguồn (luật Hỏi-4 của DB2b không đổi).
  assert.equal(kq.nguoiMoi.filter((p) => p.source === "S05").length, 1);
  return kq;
}

test("SD3-E4: số có sdt_bam đời trước → thêm bí danh sdt cho đúng người cũ, không người mới", () => {
  kiemGiuNguoi({ giaiNguoi, khoaBiDanh, khoaBamCu });
  assert.equal(khoaBamCu("+84911000001").length, 32);
});

test("SD3-E4 đỏ: bản chép bỏ tra sdt_bam đời trước → bắt «NGUOI MOI THAY VI GIU»", async () => {
  const TEP = fileURLToPath(new URL("../lib/danh-ba-nguoi.mjs", import.meta.url));
  const goc = readFileSync(TEP, "utf8");
  const moi = goc.replace("    if (cu) return themBiDanh(source, ALIAS_KIND.sdt, e164, cu);\n", "");
  assert.notEqual(moi, goc, "bản chép không đổi được — mẫu thay đã lệch mã");
  const ban = path.join(path.dirname(TEP), `.ban-${process.pid}-danh-ba-nguoi.mjs`);
  writeFileSync(ban, moi);
  try {
    const m = await import(pathToFileURL(ban).href);
    assert.throws(() => kiemGiuNguoi(m), /NGUOI MOI THAY VI GIU/);
  } finally {
    rmSync(ban, { force: true });
  }
});

test("SD3-E4: bộ dựng nghỉ sdt_bam bằng retired_at, không DELETE", () => {
  assert.match(SQL.nghiSdtBam, /^UPDATE registry_aliases SET retired_at = now\(\) WHERE kind = 'sdt_bam' AND retired_at IS NULL$/);
});

// ---- HD13 nguoi-noi-theo-sdt: gộp người theo SĐT một–một cùng nguồn (E1, E2, E10) ----

/** Một ca chonGop: dựng người bằng giaiNguoi trên các tin, rồi chọn gộp với trạng thái/gộp có sẵn của ca. */
function caGop(tins, baiRows, { trangThai = () => new Map(), gopVao = () => new Map(), suaBiDanh = (bd) => bd } = {}) {
  const baiTheoId = bai(baiRows);
  const kq = giaiNguoi(tins, new Map(), { baiTheoId, taoKhoa: khoaGia() });
  const bd = suaBiDanh(ap(new Map(), kq));
  return { bd, kq, baiTheoId, ...chonGop(tins, bd, trangThai(bd), { baiTheoId, gopVao: gopVao(bd) }) };
}

test("HD13 E1 chonGop: ma trận mười dáng, chỉ cặp một–một cùng nguồn của người active được gộp", () => {
  const sdt = (bd, s, v) => chu(bd, s, "sdt", v);
  const tk = (bd, s, v) => chu(bd, s, "tai_khoan_nguon", v);
  const MA_TRAN = [
    ["một–một", () => caGop([tin("S03", { post_ids: ["pa"], seller_phone: "h" })], [["pa", "S03", "A"]]),
      (r) => [{ tu: sdt(r.bd, "S03", "h"), vao: tk(r.bd, "S03", "A"), source: "S03", sdt: "h" }]],
    ["SĐT hai người gửi", () => caGop([tin("S03", { post_ids: ["pa"], seller_phone: "h" }), tin("S03", { post_ids: ["pb"], seller_phone: "h" })],
      [["pa", "S03", "A"], ["pb", "S03", "B"]]), () => []],
    ["người gửi hai SĐT", () => caGop([tin("S03", { post_ids: ["pa"], seller_phone: "h" }), tin("S03", { post_ids: ["pa2"], seller_phone: "k" })],
      [["pa", "S03", "A"], ["pa2", "S03", "A"]]), () => []],
    ["cặp chỉ trên tin nghỉ", () => caGop([tin("S03", { post_ids: ["pa"], seller_phone: "h", retired_at: "2026-10-20T00:00:00Z" })],
      [["pa", "S03", "A"]]), () => []],
    ["tài khoản S03, SĐT S05", () => caGop([tin("S03", { post_ids: ["pa"] }), tin("S05", { post_ids: ["pa"], seller_phone: "h" })],
      [["pa", "S03", "A"]]), () => []],
    ["tin S06", () => caGop([tin("S06", { seller_ref: "ct:1", seller_phone: "h" })], []), () => []],
    ["người theo SĐT merged", () => caGop([tin("S03", { post_ids: ["pa"], seller_phone: "h" })], [["pa", "S03", "A"]],
      { trangThai: (bd) => new Map([[sdt(bd, "S03", "h"), "merged"]]) }), () => []],
    ["người theo SĐT split", () => caGop([tin("S03", { post_ids: ["pa"], seller_phone: "h" })], [["pa", "S03", "A"]],
      { trangThai: (bd) => new Map([[sdt(bd, "S03", "h"), "split"]]) }), () => []],
    ["Ks = Ka", () => caGop([tin("S03", { post_ids: ["pa"], seller_phone: "h" })], [["pa", "S03", "A"]],
      { suaBiDanh: (bd) => new Map([...bd].map(([k, v]) => [k, k === khoaBiDanh("S03", "sdt", "h") ? tk(bd, "S03", "A") : v])) }), () => []],
    ["người tài khoản đã gộp SĐT khác", () => caGop(
      [tin("S03", { post_ids: ["pa"], seller_phone: "k" }), tin("S03", { post_ids: ["pa1"], seller_phone: "h", retired_at: "2026-10-20T00:00:00Z" })],
      [["pa", "S03", "A"], ["pa1", "S03", "A"]],
      { gopVao: (bd) => new Map([[sdt(bd, "S03", "h"), tk(bd, "S03", "A")]]), trangThai: (bd) => new Map([[sdt(bd, "S03", "h"), "merged"]]) }),
    () => []],
  ];
  let soAssert = 0;
  for (const [dong, chay, mong] of MA_TRAN) {
    const r = chay();
    assert.deepEqual(r.gop, mong(r), `HD13 E1 sai gộp: ${dong}`);
    soAssert++;
  }
  assert.equal(soAssert, MA_TRAN.length);
  assert.equal(soAssert, 10);
  // nhieuNhieu đếm hai ca nhiều–nhiều theo nguồn.
  const nn = caGop([tin("S03", { post_ids: ["pa"], seller_phone: "h" }), tin("S03", { post_ids: ["pb"], seller_phone: "h" }),
    tin("S03", { post_ids: ["pc"], seller_phone: "m" }), tin("S03", { post_ids: ["pc2"], seller_phone: "n" })],
  [["pa", "S03", "A"], ["pb", "S03", "B"], ["pc", "S03", "C"], ["pc2", "S03", "C"]]).nhieuNhieu;
  assert.deepEqual(nn.S03, { sdt_nhieu_nguoi: 1, nguoi_nhieu_sdt: 1 });
});

test("HD13 E2 anhXaVai: tin chỉ SĐT của số đã gộp về người tài khoản (parser/observed); chưa gộp thì ở người theo SĐT", () => {
  const t1 = tin("S03", { post_ids: ["pa"], seller_phone: "h" });
  const t2 = tin("S03", { seller_phone: "h" });
  const r = caGop([t1, t2], [["pa", "S03", "A"]]);
  const ks = chu(r.bd, "S03", "sdt", "h");
  const ka = chu(r.bd, "S03", "tai_khoan_nguon", "A");
  assert.deepEqual(r.gop.map((g) => [g.tu, g.vao]), [[ks, ka]]);
  const vaiCua = (vai, t) => vai.filter((v) => v.subject_key === `S03:${t.originating_system_key}`).map((v) => `${v.party_key}/${v.method}/${v.evidence_tier}`);
  const sau = anhXaVai(r.kq.vai, new Map(r.gop.map((g) => [g.tu, g.vao])));
  assert.deepEqual(vaiCua(sau, t2), [`${ka}/parser/observed`], "HD13 E2 tin chỉ SĐT không về người tài khoản");
  assert.deepEqual(vaiCua(sau, t1), [`${ka}/source_field/fact`], "HD13 E2 tin có tài khoản đổi vai");
  const chuaGop = anhXaVai(r.kq.vai, new Map());
  assert.deepEqual(vaiCua(chuaGop, t2), [`${ks}/parser/observed`], "HD13 E2 chưa gộp mà vai rời người theo SĐT");
});

test("HD13 E10 đọc tĩnh: SQL bộ dựng + dung-nguoi.mjs không tầng A, không xoá, ghi danh bạ đúng hai kiểu", () => {
  const nguonLib = readFileSync(new URL("../lib/danh-ba-nguoi.mjs", import.meta.url), "utf8");
  const nguonCli = readFileSync(new URL("../dung-nguoi.mjs", import.meta.url), "utf8");
  const khoaDocLap = [...nguonLib.slice(nguonLib.indexOf("export const SQL"), nguonLib.indexOf("});", nguonLib.indexOf("export const SQL")))
    .matchAll(/^ {2}(\w+): `/gm)].length;
  const cli = [...nguonCli.matchAll(/"((?:BEGIN|COMMIT|ROLLBACK|SELECT|INSERT|UPDATE|DELETE|TRUNCATE)\b[^"]*)"/g)].map((m) => m[1]);
  const cau = [...Object.values(SQL), ...cli];
  assert.equal(Object.keys(SQL).length, khoaDocLap, "HD13 E10 số khoá SQL.* khác số đếm độc lập trong mã nguồn");
  assert.ok(cli.length >= 3, "HD13 E10 không rút được câu nào của dung-nguoi.mjs");
  assert.equal(cau.length, khoaDocLap + cli.length);
  const vi = (sql) => {
    const loi = [];
    if (bangDuocDoc(sql).length) loi.push(`tầng A ${bangDuocDoc(sql).join(",")}`);
    if (/\b(DELETE|TRUNCATE)\b/i.test(sql)) loi.push("xoá");
    if (/\bUPDATE\s+parties\b/i.test(sql) && !/SET\s+status\s*=[^,]+,\s*merged_into\s*=/i.test(sql)) loi.push("UPDATE parties ngoài status/merged_into");
    if (/\bregistry_events\b/i.test(sql) && !/^\s*INSERT INTO registry_events\b/i.test(sql)) loi.push("registry_events không phải INSERT");
    return loi;
  };
  const loi = cau.flatMap((s) => vi(s).map((l) => `${l}: ${s.slice(0, 50)}`));
  assert.deepEqual(loi, [], `HD13 E10 ${loi.join(" | ")}`);
  // Đối chứng dương: hai câu cài sẵn phải bị bắt.
  assert.deepEqual(vi("SELECT p.party_key FROM parties p JOIN users u ON true"), ["tầng A users"]);
  assert.deepEqual(vi("DELETE FROM parties WHERE party_key = $1"), ["xoá"]);
  assert.deepEqual(vi("UPDATE parties SET source = 'S03'"), ["UPDATE parties ngoài status/merged_into"]);
});

// ---- cong-tac-gop-nguoi-dem: công tắc ops_audit cho bước gộp, mặc định tắt ----
import { CONG_TAC_GOP, docCongTac } from "../lib/danh-ba-nguoi.mjs";

test("CTG E3 docCongTac: ma trận bảy dáng, dòng id lớn nhất thắng, chỉ detail.bat === true là bật", () => {
  const bat = (id) => ({ id: String(id), detail: { bat: true, ly_do: "x" } });
  const tat = (id) => ({ id: String(id), detail: { bat: false, ly_do: "x" } });
  const maTran = [
    ["rỗng", [], "tat"],
    ["[bat]", [bat(1)], "bat"],
    ["[tat]", [tat(1)], "tat"],
    ["[bat, tat]", [bat(1), tat(2)], "tat"],
    ["[tat, bat] viết ngược thứ tự", [bat(9), tat(3)], "bat"],
    ["[bat, bat chuỗi]", [bat(1), { id: "2", detail: { bat: "true", ly_do: "x" } }], "tat"],
    ["[detail thiếu bat]", [{ id: "1", detail: { ly_do: "x" } }], "tat"],
  ];
  let soAssert = 0;
  for (const [ten, rows, ky] of maTran) {
    assert.equal(docCongTac(rows), ky, `CTG E3 ${ten}`);
    soAssert++;
  }
  assert.equal(soAssert, maTran.length);
  // id bigserial về dạng chuỗi: "10" > "9" theo số, không theo chữ.
  assert.equal(docCongTac([tat(9), bat(10)]), "bat", "CTG E3 so id theo số");
});

/** Câu chạm ops_audit (đọc/ghi/sửa/xoá), không tính phép dò to_regclass. */
const chamAudit = (sql) => /\b(?:FROM|INTO|UPDATE|TRUNCATE(?:\s+TABLE)?|ALTER\s+TABLE|DROP\s+TABLE)\s+ops_audit\b/i.test(sql);
const viAudit = (sql) => {
  if (!chamAudit(sql)) return [];
  if (/^\s*SELECT\b/i.test(sql) && /\bFROM\s+ops_audit\b/i.test(sql) && !/\b(UPDATE|DELETE|TRUNCATE|INSERT)\b/i.test(sql)) return [];
  if (/^\s*INSERT INTO ops_audit\b/i.test(sql)) return [];
  return [`ops_audit ngoài SELECT/INSERT: ${sql.slice(0, 50)}`];
};
/** Lời gọi bộ dựng (dungNguoi( hoặc bộ tiêm dung( của buocDem), trừ chính định nghĩa hàm; trả đối số đến dấu ) khớp. */
function loiGoiDung(nguon) {
  const goi = [];
  for (const m of nguon.matchAll(/(?<![\w.])(dungNguoi|dung)\(/g)) {
    if (/function\s+$/.test(nguon.slice(Math.max(0, m.index - 20), m.index))) continue;
    let sau = 0;
    let i = m.index + m[0].length;
    for (; i < nguon.length; i++) {
      if (nguon[i] === "(") sau++;
      else if (nguon[i] === ")") { if (sau === 0) break; sau--; }
    }
    goi.push(nguon.slice(m.index, i + 1));
  }
  return goi;
}
const mangGop = (goi) => /[{,]\s*gop\s*[:,}]|\.\.\./.test(goi);

test("CTG E8 đọc tĩnh: ops_audit chỉ SELECT/INSERT, một câu đọc + một câu ghi công tắc, mã chạy thật không truyền gop", () => {
  const doc = (p) => readFileSync(new URL(p, import.meta.url), "utf8");
  const nguonCli = doc("../dung-nguoi.mjs");
  const cli = [...nguonCli.matchAll(/"((?:SELECT|INSERT|UPDATE|DELETE|TRUNCATE)\b[^"]*)"/g)].map((m) => m[1]);
  const cau = [...Object.values(SQL), ...cli];
  const loi = cau.flatMap(viAudit);
  assert.deepEqual(loi, [], `CTG E8 ${loi.join(" | ")}`);
  const docCt = cau.filter((s) => /^\s*SELECT\b/i.test(s) && /\bFROM\s+ops_audit\b/i.test(s) && s.includes(`'${CONG_TAC_GOP}'`));
  const ghiCt = cau.filter((s) => /^\s*INSERT INTO ops_audit\b/i.test(s));
  assert.equal(CONG_TAC_GOP, "danh-ba:gop-sdt");
  assert.equal(docCt.length, 1, "CTG E8 số câu đọc công tắc");
  assert.equal(ghiCt.length, 1, "CTG E8 số câu ghi công tắc");
  assert.equal(cau.filter(chamAudit).length, 2, "CTG E8 câu chạm ops_audit ngoài đọc/ghi công tắc");

  const goi = ["../refresh-bait-gap.mjs", "../dung-nguoi.mjs", "../lib/danh-ba-nguoi.mjs"].flatMap((p) => loiGoiDung(doc(p)));
  assert.ok(goi.length >= 3, `CTG E8 rút được ${goi.length} lời gọi bộ dựng`);
  assert.deepEqual(goi.filter(mangGop), [], "CTG E8 lời gọi chạy thật truyền gop");
  // buocDem chạy thật không nhận bộ dựng thay thế.
  const goiDem = [...doc("../refresh-bait-gap.mjs").matchAll(/(?<![\w.])buocDem\(([^)]*)\)/g)].map((m) => m[0]);
  assert.ok(goiDem.length >= 1 && goiDem.every((g) => !/\bdung\s*:/.test(g)), `CTG E8 buocDem chạy thật: ${goiDem.join(" | ")}`);

  // Đối chứng dương: câu và lời gọi cài sẵn phải bị bắt.
  assert.equal(viAudit("UPDATE ops_audit SET detail = '{}'").length, 1);
  assert.equal(viAudit("DELETE FROM ops_audit WHERE id = 1").length, 1);
  assert.deepEqual(viAudit("SELECT to_regclass('public.ops_audit') IS NOT NULL AS co"), []);
  assert.equal(loiGoiDung("await dungNguoi(c, { gop: true });").filter(mangGop).length, 1);
  assert.equal(loiGoiDung("await dungNguoi(c, { runId, gop });").filter(mangGop).length, 1);
  assert.equal(loiGoiDung("await dungNguoi(c, { ...o });").filter(mangGop).length, 1);
  assert.equal(loiGoiDung("export async function dungNguoi(c, { gop } = {}) {}").length, 0);
});
