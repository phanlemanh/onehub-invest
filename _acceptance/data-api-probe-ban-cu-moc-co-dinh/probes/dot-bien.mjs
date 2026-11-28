#!/usr/bin/env node
// dot-bien.mjs — PB11 AC-3 (eval E3): mỗi probe trong năm, chạy với PB11_MOC_THU = HEAD (một mốc ĐÃ chứa lần gộp của hàng),
// phải thoát 2 với «<tên>: mốc so hỏng: <sha> đã chứa lần gộp <sha> của hàng» — chốt chạy trước mọi việc nặng, không dựng DB.
// Đối chứng: không đặt biến → probe không in «mốc so hỏng» ở dòng đầu ra nào (đo ở E1 bằng lệnh executor, không lặp ở đây).
import { execFileSync, spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const HEAD = execFileSync("git", ["-C", ROOT, "rev-parse", "HEAD"], { encoding: "utf8" }).trim();
export const NAM = [
  ["data-api-hop-dong-reso-dd-2-1/probes/luoc-do-mau.mjs", "luoc-do", "a80d389d9"],
  ["data-api-hop-dong-reso-dd-2-1/probes/pha.mjs", "pha", "a80d389d9"],
  ["data-api-dong-ba-route-lo/probes/pha.mjs", "pha", "b013b4428"],
  ["data-api-dong-khi-thieu-khoa/probes/pha.mjs", "pha", "c16ebe9df"],
  ["data-api-markets-khong-doc-s02/probes/ban-cu.mjs", "ban-cu", "0d0710089"],
];
let sai = 0;
for (const [p, ten, gop] of NAM) {
  const r = spawnSync(process.execPath, [path.join(ROOT, "_acceptance", p)], { cwd: ROOT, encoding: "utf8", env: { ...process.env, PB11_MOC_THU: HEAD } });
  const mong = `${ten}: mốc so hỏng: ${HEAD.slice(0, 9)} đã chứa lần gộp ${gop} của hàng`;
  const dat = r.status === 2 && `${r.stdout}${r.stderr}`.includes(mong);
  console.log(JSON.stringify({ probe: p, rc: r.status, dat }));
  if (!dat) sai++;
}
console.log(sai ? `dot-bien: ${sai} ô sai` : `dot-bien: đủ ${NAM.length} ô — mốc đã chứa lần gộp thì cả năm probe dừng «mốc so hỏng»`);
process.exit(sai ? 1 : 0);
