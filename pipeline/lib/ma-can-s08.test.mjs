// ma-can-s08.test.mjs — hồ sơ danh-ba-toa-truc-can E2 (AC-2): ma trận mã TỔNG HỢP viết trước (tiền tố Q, không mã S08
// thật — luật 5), mỗi khuôn có ca dương và ca âm; kiểm chéo không mã nào khớp hai khuôn.
import { test } from "node:test";
import assert from "node:assert/strict";
import { KHUON, tachMa } from "./ma-can-s08.mjs";

// [mã, kỳ vọng, khuôn mà ca âm nhắm tới]: kỳ vọng là {toa, tang, truc, khuon_id} hoặc {khong_tach}.
// Mỗi khuôn có một ca âm «đúng khuôn + phần thừa» (gắn tên khuôn): khuôn bị nới thành khớp tiền tố thì chính ca này đỏ.
const MA_TRAN = [
  // K-gach: <toà>-<tầng>-<trục>
  ["Q12-07-03", { toa: "Q12", tang: "7", truc: "03", khuon_id: "gach" }],
  ["Q12A-17-05A", { toa: "Q12A", tang: "17", truc: "05A", khuon_id: "gach" }],
  ["Q12-7-03", { khong_tach: "khong-khop-khuon" }],
  ["Q12A-QQQQ-02", { khong_tach: "khong-khop-khuon" }],
  ["Q12-07-03-1", { khong_tach: "khong-khop-khuon" }, "gach"],
  // K-cham: <toà>.<tầng>.<trục>
  ["Q1.18.12", { toa: "Q1", tang: "18", truc: "12", khuon_id: "cham" }],
  ["QX.04.14", { toa: "QX", tang: "4", truc: "14", khuon_id: "cham" }],
  ["Q.05.02", { toa: "Q", tang: "5", truc: "02", khuon_id: "cham" }],
  ["Q1.18.123", { khong_tach: "khong-khop-khuon" }, "cham"],
  ["Q1.05", { khong_tach: "khong-khop-khuon" }],
  // K-tien-to-x: <dự án>_<toà>-X<tầng>.<trục>
  ["QQQQQ_Q1-X24.04", { toa: "Q1", tang: "24", truc: "04", khuon_id: "tien-to-x" }],
  ["QQQQ9_QC-X32.01", { toa: "QC", tang: "32", truc: "01", khuon_id: "tien-to-x" }],
  ["QQQQQ_Q1-24.04", { khong_tach: "khong-khop-khuon" }],
  ["QQQQQ_Q1-X24.04.1", { khong_tach: "khong-khop-khuon" }, "tien-to-x"],
  // K-dinh-cham: <toà chữ + số><tầng 2 số>.<trục>
  ["QX102.01", { toa: "QX1", tang: "2", truc: "01", khuon_id: "dinh-cham" }],
  ["QX1002.17", { toa: "QX10", tang: "2", truc: "17", khuon_id: "dinh-cham" }],
  ["QX801.Q06", { khong_tach: "khong-khop-khuon" }],
  ["QX12.01", { khong_tach: "khong-khop-khuon" }],
  ["QX102.011", { khong_tach: "khong-khop-khuon" }, "dinh-cham"],
  // K-toa-cham-bon: <toà Q9.99><tầng 2 số>.<trục>
  ["Q6.0107.05", { toa: "Q6.01", tang: "7", truc: "05", khuon_id: "toa-cham-bon" }],
  ["Q10.0219.18", { toa: "Q10.02", tang: "19", truc: "18", khuon_id: "toa-cham-bon" }],
  ["Q6.017.05", { khong_tach: "khong-khop-khuon" }],
  ["Q6.0107.051", { khong_tach: "khong-khop-khuon" }, "toa-cham-bon"],
  // K-toa-cham-dinh: <toà Q9.99><tầng: 2 số | số + A><trục: 1–2 số + A?>
  ["Q1.020203", { toa: "Q1.02", tang: "2", truc: "03", khuon_id: "toa-cham-dinh" }],
  ["Q2.17025A", { toa: "Q2.17", tang: "2", truc: "5A", khuon_id: "toa-cham-dinh" }],
  ["Q2.170512A", { toa: "Q2.17", tang: "5", truc: "12A", khuon_id: "toa-cham-dinh" }],
  ["Q2.1715A10", { toa: "Q2.17", tang: "15A", truc: "10", khuon_id: "toa-cham-dinh" }],
  ["Q2.175A05", { toa: "Q2.17", tang: "5A", truc: "05", khuon_id: "toa-cham-dinh" }],
  ["Q2.175A5A", { toa: "Q2.17", tang: "5A", truc: "5A", khuon_id: "toa-cham-dinh" }],
  ["Q2.17", { khong_tach: "khong-khop-khuon" }],
  ["Q2.17A", { khong_tach: "khong-khop-khuon" }],
  ["Q1.0202031", { khong_tach: "khong-khop-khuon" }, "toa-cham-dinh"],
  // K-dinh-lien: <toà 2 chữ + 1 số><tầng 2 số><trục 2 số>
  ["QX11807", { toa: "QX1", tang: "18", truc: "07", khuon_id: "dinh-lien" }],
  ["QX1807", { khong_tach: "khong-khop-khuon" }],
  ["QX118071", { khong_tach: "khong-khop-khuon" }, "dinh-lien"],
  // K-chan-de: <toà 2 chữ + 1 số><tầng 2 số>S<trục 2 số> — căn thương mại chân đế
  ["QX101S10", { toa: "QX1", tang: "1", truc: "S10", khuon_id: "chan-de" }],
  ["QX1.01S02", { khong_tach: "khong-khop-khuon" }],
  ["QX101S101", { khong_tach: "khong-khop-khuon" }, "chan-de"],
  // Mã rỗng
  ["", { khong_tach: "ma-rong" }],
  ["   ", { khong_tach: "ma-rong" }],
  [null, { khong_tach: "ma-rong" }],
];

test("DBV-AC-2 bộ tách mã: ma trận mã tổng hợp ra đúng toà, tầng, trục, khuôn; mã lạ có lý do", () => {
  let soCa = 0;
  for (const [ma, ky, gan] of MA_TRAN) {
    const kq = tachMa(ma);
    const khuon = ky.khuon_id ?? gan ?? "khong-tach";
    assert.deepEqual(kq, ky, `DBV-AC-2 khuôn ${khuon} nhận mã sai: «${ma}»`);
    soCa++;
  }
  assert.equal(soCa, MA_TRAN.length);
  // Mọi khuôn đã khai có ít nhất một ca dương trong ma trận.
  const coDuong = new Set(MA_TRAN.map(([, k]) => k.khuon_id).filter(Boolean));
  for (const k of KHUON) assert.ok(coDuong.has(k.id), `DBV-AC-2 khuôn ${k.id} chưa có ca dương`);
  // Và một ca âm gần đúng khuôn mang tên khuôn — ma trận toàn phần theo khuôn.
  const coAm = new Set(MA_TRAN.filter(([, k, g]) => g && k.khong_tach).map(([, , g]) => g));
  for (const k of KHUON) assert.ok(coAm.has(k.id), `DBV-AC-2 khuôn ${k.id} chưa có ca âm gần đúng khuôn`);
});

test("DBV-AC-2 chéo: không mã nào của ma trận khớp hai khuôn; mã viết thường cũng tách", () => {
  for (const [ma] of MA_TRAN) {
    if (typeof ma !== "string" || !ma.trim()) continue;
    const khop = KHUON.filter((k) => k.re.test(ma.trim().toUpperCase())).map((k) => k.id);
    assert.ok(khop.length <= 1, `DBV-AC-2 mã «${ma}» khớp hai khuôn: ${khop.join(", ")}`);
  }
  assert.deepEqual(tachMa(" q12-07-03 "), { toa: "Q12", tang: "7", truc: "03", khuon_id: "gach" });
});
