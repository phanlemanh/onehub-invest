// doc-gop-s03.ts — PL30 `chon-model-theo-o`: lệnh đọc gộp tin S03 theo bảng chọn model (agent/config/doc-gop-s03.json).
//   chay --lat <lát> [--split dev|test] | --post <id,id> --tran-usd <USD> [--cau-hinh <tệp>] [--run-id <id>] [--thu]
//       đọc một tập bài, ghi silver_labels + ai_calls (luật 7: không bảng nào khác). Không có đường chạy toàn S03.
//   hang-ngay [--ngay YYYY-MM-DD] [--tran-ngay-usd 20] [--cau-hinh <tệp>] [--thu]
//       PL34: đọc toàn bộ bài S03 của một ngày (giờ VN, mặc định hôm qua) đã khử trùng theo tin, trần theo ngày chi (giờ VN lúc
//       chạy); bài đã có nhãn đọc được không gọi lại. --thu chỉ in phạm vi + ước, không gọi model, không ghi, không đòi khoá.
//       Dòng cuối stdout: {"pl34": {...}}. Thoát: 0 xong · 1 mọi lời gọi hỏng (lỗi gọi hay JSON hỏng) · 2 đầu vào sai · 3 trần.
//   cham --split test|dev --tran-usd <USD> [--lat s03-theo-nhom] [--cau-hinh <tệp>] [--ra <bảng.md>] [--tom-tat <tệp.json>]
//       chấm bộ đọc trên nhãn vàng; chỉ đọc DB, không ghi bảng nào.
// Khoá Gateway: AI_GATEWAY_API_KEY (người chạy nạp .env bằng --env-file), đòi cả khi --thu. Bảng chọn và cờ được kiểm trước
// khoá: sai thì thoát 2, chưa gọi model lần nào. Thoát: 0 xong · 1 mọi lời gọi hỏng · 2 đầu vào sai · 3 dừng vì trần.
import pg from "pg";
import { napCauHinh } from "../src/enrich/doc-gop-s03/cau-hinh.js";
import { chayLuot, docCo } from "../src/enrich/doc-gop-s03/chay.js";

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
  if (!process.env.AI_GATEWAY_API_KEY) {
    console.error("doc-gop-s03 chay: thiếu AI_GATEWAY_API_KEY — nạp .env bằng --env-file rồi chạy lại; chưa gọi model lần nào");
    return 2;
  }
  const c = new pg.Client({ connectionString: DB_URL });
  await c.connect();
  try {
    const kq = await chayLuot({ client: c, co });
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
  if (!co.thu && !process.env.AI_GATEWAY_API_KEY) {
    console.error("doc-gop-s03 hang-ngay: thiếu AI_GATEWAY_API_KEY — nạp .env bằng --env-file rồi chạy lại; chưa gọi model lần nào");
    return 2;
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
