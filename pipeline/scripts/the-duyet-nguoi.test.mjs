// the-duyet-nguoi.test.mjs — HD17 the-duyet-nguoi-nhieu-nhieu, phần không DB (E1 ↔ AC-1, E11 ↔ AC-9).
import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { evidenceThe, lanGopTheoThe, maCoHieuLuc, maThe, nhomNhieuNhieu } from "../lib/the-duyet-nguoi.mjs";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "..");

// Tin + bài viết tay theo đúng khuôn SQL.tin / SQL.bai của danh-ba-nguoi.mjs (cùng hàm rutDinhDanh đọc).
let n = 0;
const bai = new Map();
function tin(source, sdt, nguoiGui, { retired = false } = {}) {
  const post_ids = nguoiGui.map((g) => {
    const pid = `p${++n}`;
    bai.set(pid, { source, sender_id: g, sender_name: `Tên ${g}` });
    return pid;
  });
  return { offer_id: `o${n}`, source, seller_phone: sdt, post_ids, retired_at: retired ? "2026-10-01" : null };
}
const P = (i) => `+849000000${String(i).padStart(2, "0")}`;
const MA_TRAN = [
  { hinh: "1 SĐT 2 tài khoản", tins: [tin("S03", P(1), ["a1"]), tin("S03", P(1), ["a2"])], nhom: 1 },
  { hinh: "1 tài khoản 2 SĐT", tins: [tin("S03", P(2), ["b1"]), tin("S03", P(3), ["b1"])], nhom: 1 },
  { hinh: "nhóm lẫn 3 tài khoản 2 SĐT", tins: [tin("S05", P(4), ["c1", "c2"]), tin("S05", P(5), ["c2"]), tin("S05", P(5), ["c3"])], nhom: 1 },
  { hinh: "một–một", tins: [tin("S03", P(6), ["d1"]), tin("S03", P(6), ["d1"])], nhom: 0 },
  { hinh: "tin nghỉ", tins: [tin("S03", P(7), ["e1"]), tin("S03", P(7), ["e2"], { retired: true })], nhom: 0 },
  { hinh: "tin S06", tins: [tin("S06", P(8), []), tin("S06", P(8), [])].map((t, i) => ({ ...t, seller_ref: `ct:${i}` })), nhom: 0 },
];

test("TN-AC-1 mỗi nhóm nhiều–nhiều một thẻ", () => {
  for (const { hinh, tins, nhom } of MA_TRAN) {
    assert.equal(nhomNhieuNhieu(tins, bai).length, nhom, `TN-AC-1 hình «${hinh}»: số nhóm`);
  }
  const tatCa = MA_TRAN.flatMap((m) => m.tins);
  const nhom = nhomNhieuNhieu(tatCa, bai);
  assert.equal(nhom.length, 3, "TN-AC-1 cả ma trận: 3 nhóm");
  assert.deepEqual(nhom.find((x) => x.source === "S05").taiKhoan.map((t) => t.id), ["c1", "c2", "c3"]);
  // Mã tất định: đảo thứ tự tin ra cùng mã.
  const dao = nhomNhieuNhieu([...tatCa].reverse(), bai);
  assert.deepEqual(dao.map(maThe).sort(), nhom.map(maThe).sort(), "TN-AC-1 mã thẻ đổi theo thứ tự tin");
  assert.match(maThe(nhom[0]), /^nguoi:S0[35]:[0-9a-f]{16}$/);
});

test("TN-AC-1 chiều đỏ: bản đột biến coi một–một là nhóm", async () => {
  const goc = readFileSync(path.join(ROOT, "pipeline/lib/the-duyet-nguoi.mjs"), "utf8");
  const DONG = "      if (tk.length < 2 && sdt.length < 2) continue;\n";
  assert.ok(goc.includes(DONG), "TN-AC-1 dòng điều kiện ≥ 2 không còn nguyên văn trong lõi");
  const tep = path.join(ROOT, "pipeline/lib/_dot-bien-the-duyet-nguoi.mjs");
  writeFileSync(tep, goc.replace(DONG, ""));
  try {
    const dotBien = await import(`${tep}?v=${Date.now()}`);
    assert.throws(
      () => assert.equal(dotBien.nhomNhieuNhieu(MA_TRAN[3].tins, bai).length, 0, "TN-AC-1 nhóm một–một sinh thẻ: S03"),
      /TN-AC-1 nhóm một–một sinh thẻ: S03/,
    );
  } finally {
    rmSync(tep, { force: true });
  }
});

test("TN-AC-1b evidence và lần gộp theo thẻ (hàm thuần)", () => {
  const [nhom] = nhomNhieuNhieu(MA_TRAN[0].tins, bai);
  const ev = evidenceThe(nhom, new Map([[nhom.offerIds[0], { offer_id: nhom.offerIds[0], gia: 3e9, dien_tich: 60, ngay: "2026-10-30" }]]));
  assert.equal(ev.source, "S03");
  assert.deepEqual(ev.tai_khoan.map((t) => t.id), ["a1", "a2"]);
  assert.equal(ev.tin_mau.length, 1);
  const biDanh = new Map([
    ["S03|tai_khoan_nguon|a1", "pty_B"], ["S03|tai_khoan_nguon|a2", "pty_A"], [`S03|sdt|${P(1)}`, "pty_C"],
  ]);
  assert.deepEqual(lanGopTheoThe({ id: 7, evidence: ev }, biDanh, new Map(), new Map()),
    { dich: "pty_A", tu: ["pty_B", "pty_C"], lyDo: "the-duyet:7 S03" });
  // Đích nhỏ nhất đang split → đích kế tiếp; người split không bị gộp.
  assert.deepEqual(lanGopTheoThe({ id: 7, evidence: ev }, biDanh, new Map([["pty_A", "split"]]), new Map()),
    { dich: "pty_B", tu: ["pty_C"], lyDo: "the-duyet:7 S03" });
  // Không còn người tài khoản active → không đích.
  assert.equal(lanGopTheoThe({ id: 7, evidence: ev }, biDanh, new Map([["pty_A", "split"], ["pty_B", "split"]]), new Map()), null);
  // Thẻ máy đóng không tính là thẻ hiệu lực.
  assert.deepEqual([...maCoHieuLuc([
    { item_id: "x", status: "deferred", decided_by: "dung-nguoi" },
    { item_id: "y", status: "deferred", decided_by: "u_1" },
    { item_id: "z", status: "pending", decided_by: null },
  ])].sort(), ["y", "z"]);
});

// ---------- TN-AC-9: tệp test đã ký của HD13 không đổi so với merge-base ----------
const TEP_DA_KY = ["pipeline/scripts/danh-ba-nguoi.test.mjs", "pipeline/scripts/danh-ba-nguoi.itest.mjs"];
const git = (...a) => execFileSync("git", a, { cwd: ROOT, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
/** So từng byte bản ở mốc với tệp đang có; tệp vắng ở mốc là lỗi đọc riêng, không phải «đã sửa». */
function soVoiMoc(moc, ds, doc = (f) => readFileSync(path.join(ROOT, f), "utf8")) {
  const doi = [];
  const khongDoc = [];
  for (const f of ds) {
    let goc;
    try {
      goc = git("show", `${moc}:${f}`);
    } catch {
      khongDoc.push(f);
      continue;
    }
    if (goc !== doc(f)) doi.push(f);
  }
  return { doi, khongDoc };
}
test("TN-AC-9 test đã ký HD13 không đổi", (t) => {
  let moc;
  try {
    moc = git("merge-base", "HEAD", "origin/main").trim();
  } catch {
    return t.skip("không có origin/main đủ lịch sử để tính merge-base (CI checkout nông)");
  }
  const kq = soVoiMoc(moc, TEP_DA_KY);
  assert.deepEqual(kq.khongDoc, [], "TN-AC-9 không đọc được tệp ở merge-base");
  assert.deepEqual(kq.doi, [], "TN-AC-9 tệp test đã ký bị sửa so với merge-base");
  // Chiều đỏ trên cùng phép so: bản chép của tệp đã ký sửa một dòng (tệp CÓ ở mốc).
  const tam = mkdtempSync(path.join(tmpdir(), "tn-ac-9-"));
  const chep = path.join(tam, "sua.mjs");
  writeFileSync(chep, readFileSync(path.join(ROOT, TEP_DA_KY[0]), "utf8").replace(/\n/, "\n// sửa một dòng\n"));
  const sua = soVoiMoc(moc, [TEP_DA_KY[0]], () => readFileSync(chep, "utf8"));
  assert.throws(() => assert.deepEqual(sua.doi, [], "TN-AC-9 tệp test đã ký bị sửa so với merge-base"),
    /TN-AC-9 tệp test đã ký bị sửa so với merge-base/);
  // Tệp vắng ở mốc → lỗi đọc, không phải «đã sửa».
  assert.deepEqual(soVoiMoc(moc, ["pipeline/scripts/khong-co-tep-nay.mjs"]), { doi: [], khongDoc: ["pipeline/scripts/khong-co-tep-nay.mjs"] });
});
