// thay-nguon-hook.mjs — PL36: chạy mã với MỘT tệp nguồn bị thay mà không ghi tệp nào vào cây mã.
// Nạp bằng NODE_OPTIONS="--import <đường tuyệt đối tới tệp này>" cùng hai biến:
//   THAY_NGUON_GOC  đường tuyệt đối của tệp .mjs gốc trong cây (giữ nguyên chỗ, nên import tương đối, import.meta.url còn đúng)
//   THAY_NGUON_TEP  tệp nguồn thay, đặt NGOÀI cây (thư mục tạm của hệ điều hành)
// Lúc Node nạp đúng URL của tệp gốc, hook trả nguồn của tệp thay. Biến môi trường đi theo tiến trình con (node --test, spawn),
// nên lượt nạp thật chạy như launchd cũng nhận bản thay. Lý do (S4 r2 M5, E11): bản chép đặt cạnh tệp gốc lọt vào lượt quét
// thư mục pipeline/ của suite chạy song song (TRG-AC-7 đỏ).
import { readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { isMainThread } from "node:worker_threads";

const goc = process.env.THAY_NGUON_GOC, tep = process.env.THAY_NGUON_TEP;
if (isMainThread && goc && tep) (await import("node:module")).register(import.meta.url);
const urlGoc = goc ? pathToFileURL(goc).href : null;

export async function load(url, ctx, next) {
  if (urlGoc && tep && url === urlGoc) return { format: "module", source: readFileSync(tep, "utf8"), shortCircuit: true };
  return next(url, ctx);
}
