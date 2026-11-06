// doc-gop-s03.ts — PL30 `chon-model-theo-o`: lệnh đọc gộp tin S03 theo bảng chọn model (agent/config/doc-gop-s03.json).
//   chay --lat <lát> [--split dev|test] | --post <id,id> --tran-usd <USD> [--cau-hinh <tệp>] [--run-id <id>] [--thu]
//       đọc một tập bài, ghi silver_labels + ai_calls (luật 7: không bảng nào khác). Không có đường chạy toàn S03.
//   cham --split test|dev --tran-usd <USD> [--lat s03-theo-nhom] [--cau-hinh <tệp>] [--ra <bảng.md>] [--tom-tat <tệp.json>]
//       chấm bộ đọc trên nhãn vàng; chỉ đọc DB, không ghi bảng nào.
// Khoá Gateway: AI_GATEWAY_API_KEY (người chạy nạp .env bằng --env-file). Bảng chọn và cờ được kiểm trước khoá: sai thì
// thoát 2, chưa gọi model lần nào.
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
  if (!co.thu && !process.env.AI_GATEWAY_API_KEY) {
    console.error("doc-gop-s03 chay: thiếu AI_GATEWAY_API_KEY — nạp .env bằng --env-file rồi chạy lại; chưa gọi model lần nào");
    return 2;
  }
  const c = new pg.Client({ connectionString: DB_URL });
  await c.connect();
  try {
    const kq = await chayLuot({ client: c, co });
    return kq.dungTran ? 3 : 0;
  } finally {
    await c.end();
  }
}

async function main(): Promise<number> {
  const [lenh, ...rest] = process.argv.slice(2);
  if (lenh === "chay") return lenhChay(rest);
  if (lenh === "cham") return (await import("../src/enrich/doc-gop-s03/cham-lenh.js")).lenhCham(rest);
  console.error("lệnh: chay | cham");
  return 2;
}

main().then((code) => { process.exitCode = code; }, (e) => { console.error(e); process.exitCode = 1; });
