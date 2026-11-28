// thu-duoi-moc.mjs — cắt moc.json của «thu đuôi» S06 theo TRẦN SỐ ID giữ lại
// (claudedp-2511-29 ý (c): mốc lớn dần theo tuổi → cắt có trần).
//
// An toàn khi cắt: moc.json chỉ là mảng id (không có dấu thời gian) nên trần là
// SỐ LƯỢNG — giữ N id CUỐI (id mới thêm nằm cuối Set). Phần cắt là id cũ nhất,
// hầu hết đã nằm trong stg; bộ thu còn tra stg TỪNG TIN trước khi coi là «đã
// có», nên tin cũ chưa kịp nạp chỉ bị thu lại ở vòng sau (tốn lời gọi, không
// mất dữ liệu).
//
// Lỗi đọc/parse KHÔNG ném — trả null để vòng thu vẫn chạy (cắt là việc phụ).
//
// Dùng: node thu-duoi-moc.mjs <goc> <trần>   → in JSON một dòng kết quả
import { realpathSync } from "node:fs";
import { readFile, rename, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

export async function catMoc(goc, toiDa) {
  if (!Number.isInteger(toiDa) || toiDa <= 0) return { daCat: false, lyDo: "tran-khong-hop-le" };
  let duLieu;
  try {
    duLieu = JSON.parse(await readFile(join(goc, "moc.json"), "utf8"));
  } catch {
    return null; // chưa có file / JSON hỏng — không cắt, vòng thu tự xử mốc của nó
  }
  const daCo = duLieu?.daCo;
  if (!Array.isArray(daCo) || daCo.length <= toiDa) return { daCat: false, truoc: daCo?.length ?? 0 };
  const giu = daCo.slice(-toiDa);
  const tam = join(goc, "moc.json.tmp");
  await writeFile(tam, JSON.stringify({ daCo: giu }));
  await rename(tam, join(goc, "moc.json")); // ghi mới nguyên khối — không ghi đè giữa chừng
  return { daCat: true, truoc: daCo.length, sau: giu.length };
}

// Chạy trực tiếp qua CLI (wrapper gọi): node thu-duoi-moc.mjs <goc> <trần>
if (process.argv[1] && realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const [goc, tran] = process.argv.slice(2);
  const kq = await catMoc(goc, Number.parseInt(tran ?? "", 10));
  console.log(JSON.stringify(kq ?? { daCat: false, lyDo: "doc-loi" }));
}
