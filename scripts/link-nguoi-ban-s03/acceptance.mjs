#!/usr/bin/env node
// acceptance.mjs — link-nguoi-ban-s03: điểm vào chung của các lệnh chấm (executors.script.lnb_* trong _acceptance/config.yaml).
// Mỗi lệnh con là một tệp <lệnh>.mjs cùng thư mục, mỗi làn giữ tệp của mình (phân làn ở Notes hợp đồng):
//   bộ chạy tích hợp của làn Claude (tich-hop.mjs): tra · dung · thu · ranh-gioi · tien-kiem   nối test làn ZCode: api
//   làn Claude: db · lien-lac · chon · ten-nguon · tai-lieu
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
// Hai biến của test làn ZCode (LNB_IMPORT_FILE, OPENCLAW_EXT_DIR) trỏ tới tệp mang tên nguồn trong tên — không ghi vào tệp nào.
// Vắng thì suy lúc chạy: bộ nạp là pipeline/import-*.mjs khai nguồn s03-ho-so; thư mục extension từ đầu khối diff của .patch.
{
  const { readdirSync, readFileSync } = await import("node:fs");
  const { homedir } = await import("node:os");
  const goc = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
  if (!process.env.LNB_IMPORT_FILE) {
    const nap = readdirSync(join(goc, "pipeline")).find((f) => /^import-.*\.mjs$/.test(f)
      && readFileSync(join(goc, "pipeline", f), "utf8").includes('"s03-ho-so"'));
    if (nap) process.env.LNB_IMPORT_FILE = join(goc, "pipeline", nap);
  }
  const patch = join(goc, "_acceptance", "link-nguoi-ban-s03", "extension.patch");
  if (!process.env.OPENCLAW_EXT_DIR && existsSync(patch)) {
    const d = readFileSync(patch, "utf8").match(/^diff --git a\/(extensions\/[^/\s]+)\//m)?.[1];
    if (d) process.env.OPENCLAW_EXT_DIR = join(process.env.OPENCLAW_SRC ?? join(homedir(), "dev", "openclaw"), d);
  }
}
const { chay } = await import(pathToFileURL(tep).href);
try {
  const code = await chay(process.argv.slice(3));
  process.exit(code ?? 0);
} catch (e) {
  console.error(`acceptance ${lenh}: ${e?.stack ?? e}`);
  process.exit(1);
}
