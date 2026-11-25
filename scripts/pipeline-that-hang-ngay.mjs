#!/usr/bin/env node
// pipeline-that-hang-ngay.mjs — hồ sơ db-thu-tach-khoi-cum-that AC-11: chạy suite pipeline_that (30 ca cần dữ liệu thật,
// trên bản chép) MỘT lần mỗi ngày trên `main`, ghi kết quả vào sổ và in một dòng. GS gọi ở nhịp đầu ngày, không plist.
// Từ chối chạy khi cây không đứng ở nhánh main. Sổ: <gốc checkout chính>/.acceptance-runs/pipeline-that/lan-chay.jsonl,
// mỗi lần một dòng {ngay, luc, sha, ket_qua: "xanh"|"do", ca_do: [...]} — suite-neu-doi.mjs đọc dòng xanh cuối.
// Chạy: node scripts/pipeline-that-hang-ngay.mjs
// Biến (chỉ để test): PIPELINE_THAT_LENH (lệnh suite, mặc định `cd pipeline && npm run test:that`), PIPELINE_THAT_SO (đường sổ).
import { appendFileSync, mkdirSync, realpathSync } from "node:fs";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const git = (...a) => spawnSync("git", a, { encoding: "utf8" }).stdout.trim();

/** Đường sổ dùng chung của mọi worktree: thư mục cha của git-common-dir (checkout chính). */
export function duongSo(cwd = process.cwd()) {
  if (process.env.PIPELINE_THAT_SO) return process.env.PIPELINE_THAT_SO;
  const common = spawnSync("git", ["-C", cwd, "rev-parse", "--path-format=absolute", "--git-common-dir"], { encoding: "utf8" }).stdout.trim();
  return path.join(path.dirname(common), ".acceptance-runs/pipeline-that/lan-chay.jsonl");
}

/** Tên ca đỏ bóc từ đầu ra node --test (dòng `✖ <tên> (<thời gian>)`), không trùng. */
export function caDo(out) {
  const ten = new Set();
  for (const m of out.matchAll(/^\s*✖ (.+?) \(\d[\d.]*m?s\)\s*$/gm)) ten.add(m[1]);
  return [...ten];
}

if (process.argv[1] && realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const nhanh = git("rev-parse", "--abbrev-ref", "HEAD");
  if (nhanh !== "main") {
    console.error(`pipeline-that-hang-ngay: cây đang ở nhánh «${nhanh}», chỉ chạy trên main`);
    process.exit(2);
  }
  const sha = git("rev-parse", "HEAD");
  const lenh = process.env.PIPELINE_THAT_LENH ?? "cd pipeline && npm run test:that";
  const r = spawnSync("bash", ["-c", lenh], { encoding: "utf8", maxBuffer: 256 * 1024 * 1024 });
  const out = (r.stdout ?? "") + (r.stderr ?? "");
  process.stdout.write(out.split("\n").slice(-40).join("\n") + "\n");
  const luc = new Date().toISOString();
  const ket_qua = r.status === 0 ? "xanh" : "do";
  const ca_do = ket_qua === "do" ? caDo(out) : [];
  const so = duongSo();
  mkdirSync(path.dirname(so), { recursive: true });
  appendFileSync(so, JSON.stringify({ ngay: luc.slice(0, 10), luc, sha, ket_qua, ca_do }) + "\n");
  console.log(ket_qua === "xanh"
    ? `ca dữ liệu thật trên main ${sha.slice(0, 9)} ${luc.slice(0, 10)}: xanh`
    : `ca dữ liệu thật trên main ${sha.slice(0, 9)} ${luc.slice(0, 10)}: ĐỎ (mã ${r.status}) — ca đỏ: ${ca_do.join("; ") || "không bóc được tên ca, xem đầu ra"}`);
  process.exit(ket_qua === "xanh" ? 0 : 1);
}
