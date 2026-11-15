// doc-gop-s03.ts — PL30 `chon-model-theo-o`: lệnh đọc gộp tin S03 theo bảng chọn model (agent/config/doc-gop-s03.json).
//   chay --lat <lát> [--split dev|test] | --post <id,id> --tran-usd <USD> [--cau-hinh <tệp>] [--run-id <id>] [--thu]
//       đọc một tập bài, ghi silver_labels + ai_calls (luật 7: không bảng nào khác). Không có đường chạy toàn S03.
//   hang-ngay [--ngay YYYY-MM-DD] [--tran-ngay-usd 20] [--cau-hinh <tệp>] [--thu]
//       PL34: đọc toàn bộ bài S03 của một ngày (giờ VN, mặc định hôm qua) đã khử trùng theo tin, trần theo ngày chi (giờ VN lúc
//       chạy); bài đã có nhãn đọc được không gọi lại. --thu chỉ in phạm vi + ước, không gọi model, không ghi, không đòi khoá.
//       Dòng cuối stdout: {"pl34": {...}}. Thoát: 0 xong · 1 mọi lời gọi hỏng (lỗi gọi hay JSON hỏng) hoặc dừng vì khoá sai ·
//       2 đầu vào sai · 3 trần · 4 dừng sớm vì hết tiền · 5 thiếu khoá.
//   cham --split test|dev --tran-usd <USD> [--lat s03-theo-nhom] [--cau-hinh <tệp>] [--ra <bảng.md>] [--tom-tat <tệp.json>]
//       chấm bộ đọc trên nhãn vàng; chỉ đọc DB, không ghi bảng nào.
// Khoá theo đường của bảng chọn (goi-thang-anthropic): ANTHROPIC_API_KEY cho model đi đường anthropic, AI_GATEWAY_API_KEY cho
// model đi Gateway (người chạy nạp .env bằng --env-file); bảng có `tu_lui` thì chỉ cần khoá của MỘT đường mỗi model, đường thiếu khoá
// hay cạn tiền được lùi qua (dòng `JOB WARN … chuyen-duong`). Bảng chọn và cờ được kiểm trước khoá: sai thì thoát 2; thiếu khoá thoát 5
// với dòng `THIEU KHOA <biến>`, chưa nối DB, chưa gọi model. Hết tiền (HTTP 402) hay khoá sai (401/403) ở một lời gọi: lượt dừng
// ngay, stderr `JOB FAIL [doc-gop-s03] het-tien|khoa: …`. Thoát: 0 xong · 1 mọi lời gọi hỏng / khoá sai · 2 đầu vào sai · 3 trần ·
// 4 hết tiền · 5 thiếu khoá.
import pg from "pg";
import { keHoach, khoaThieu, napCauHinh } from "../src/enrich/doc-gop-s03/cau-hinh.js";
import { chayLuot, docCo, dongDung } from "../src/enrich/doc-gop-s03/chay.js";

/** Khoá vắng theo đường của bảng chọn → in từng dòng THIEU KHOA, trả 5; đủ khoá trả null. */
function thieuKhoa(lenh: string, duongBang: string | undefined): number | null {
  const thieu = khoaThieu(keHoach(napCauHinh(duongBang).cauHinh));
  for (const k of thieu) console.error(`doc-gop-s03 ${lenh}: THIEU KHOA ${k} — nạp .env bằng --env-file rồi chạy lại; chưa gọi model lần nào`);
  return thieu.length ? 5 : null;
}

const DB_URL = process.env.DATABASE_URL ?? "postgres://oneinvest:oneinvest@localhost:5433/oneinvest";

export async function lenhChay(argv: string[]): Promise<number> {
  let co;
  try {
    co = docCo(argv);
    napCauHinh(co.cauHinh);
  } catch (e) {
    console.error(`doc-gop-s03 chay: ${(e as Error).message}`);
    return 2;
  }
  // --thu vẫn gọi model (chỉ bỏ ghi silver_labels) nên cũng đòi khoá, như doc-toan-bo-s03 (S4-r1 t1).
  const ma = thieuKhoa("chay", co.cauHinh);
  if (ma !== null) return ma;
  const c = new pg.Client({ connectionString: DB_URL });
  await c.connect();
  try {
    const kq = await chayLuot({ client: c, co });
    for (const d of kq.chuyenDuong) console.error(d);
    if (kq.dung) {
      console.error(dongDung(kq));
      return kq.dung === "het-tien" ? 4 : 1;
    }
    if (kq.goi > 0 && kq.loi === kq.goi) return 1; // mọi lời gọi đều hỏng — không giả làm lượt thành công (S4-r1 t6)
    return kq.dungTran ? 3 : 0;
  } finally {
    await c.end();
  }
}

export async function lenhHangNgay(argv: string[]): Promise<number> {
  const { docCoHangNgay, chayHangNgay } = await import("../src/enrich/doc-gop-s03/hang-ngay.js");
  let co;
  try {
    co = docCoHangNgay(argv);
    napCauHinh(co.cauHinh);
  } catch (e) {
    console.error(`doc-gop-s03 hang-ngay: ${(e as Error).message}`);
    return 2;
  }
  if (!co.thu) {
    const ma = thieuKhoa("hang-ngay", co.cauHinh);
    if (ma !== null) return ma;
  }
  const c = new pg.Client({ connectionString: DB_URL });
  await c.connect();
  try {
    const kq = await chayHangNgay({ client: c, co });
    console.log(JSON.stringify({ pl34: kq.tomTat }));
    return kq.ma;
  } finally {
    await c.end();
  }
}

async function main(): Promise<number> {
  const [lenh, ...rest] = process.argv.slice(2);
  if (lenh === "chay") return lenhChay(rest);
  if (lenh === "hang-ngay") return lenhHangNgay(rest);
  if (lenh === "cham") return (await import("../src/enrich/doc-gop-s03/cham-lenh.js")).lenhCham(rest);
  console.error("lệnh: chay | hang-ngay | cham");
  return 2;
}

main().then((code) => { process.exitCode = code; }, (e) => { console.error(e); process.exitCode = 1; });
