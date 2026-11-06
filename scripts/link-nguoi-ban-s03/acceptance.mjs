#!/usr/bin/env node
// acceptance.mjs — link-nguoi-ban-s03: điểm vào chung của các lệnh chấm (executors.script.lnb_* trong _acceptance/config.yaml).
// Mỗi lệnh con là một tệp <lệnh>.mjs cùng thư mục, mỗi làn giữ tệp của mình (phân làn ở Notes hợp đồng):
//   làn ZCode: tra · dung · thu · ranh-gioi · api · tien-kiem       làn Claude: db · lien-lac · chon · ten-nguon · tai-lieu
// Tệp của lệnh chưa có → thoát 2 (không đo được), không bao giờ coi là đạt.
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const LENH = ["tra", "dung", "thu", "ranh-gioi", "api", "db", "lien-lac", "chon", "tien-kiem", "ten-nguon", "tai-lieu"];
const lenh = process.argv[2];
if (!LENH.includes(lenh)) {
  console.error(`acceptance: lệnh phải là một trong ${LENH.join(", ")}`);
  process.exit(2);
}
const tep = join(dirname(fileURLToPath(import.meta.url)), `${lenh}.mjs`);
if (!existsSync(tep)) {
  console.error(`acceptance ${lenh}: CHƯA CÓ ${lenh}.mjs — lệnh này chưa dựng, không đo được`);
  process.exit(2);
}
const { chay } = await import(pathToFileURL(tep).href);
try {
  const code = await chay(process.argv.slice(3));
  process.exit(code ?? 0);
} catch (e) {
  console.error(`acceptance ${lenh}: ${e?.stack ?? e}`);
  process.exit(1);
}
