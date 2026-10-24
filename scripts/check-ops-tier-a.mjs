// check-ops-tier-a.mjs — ON7 `ops-nhan-ma-nguon`: ngoài /ops/sources, chữ hiển thị của Ops chỉ dùng mã S0x — không tên
// nguồn thật (AGENTS.md luật 6). Quét chữ hiển thị (scripts/lib/ops-visible-strings.mjs) trên components/ops/** trừ
// sources/, app/ops/quality, app/ops/collections. Đối chứng dương: cùng bộ quét thấy tên ở components/ops/sources/.
// Gọi từ check-portal-compliance.mjs (mục 12). Báo bằng mã S0x + tệp:dòng — không in tên.
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { scanSource } from "./lib/ops-visible-strings.mjs";
import { sourceRegistrySeeds } from "./lib/tier-a-source-names.mjs";

export const SCOPE = ["app/src/components/ops", "app/src/app/ops/quality", "app/src/app/ops/collections"];
export const EXCLUDE = "app/src/components/ops/sources";

function walk(root, rel) {
  const abs = path.join(root, rel);
  if (!existsSync(abs)) return [];
  if (statSync(abs).isFile()) return /\.tsx?$/.test(rel) ? [rel] : [];
  return readdirSync(abs).sort().flatMap((n) => walk(root, path.posix.join(rel, n)));
}

/** { files, hits, positive } — hits trong phạm vi (phải rỗng), positive = số chỗ ở sources/ (phải ≥ 1). */
export function checkOpsTierA({ root, entries = sourceRegistrySeeds() }) {
  const scan = (f) => scanSource(f, readFileSync(path.join(root, f), "utf8"), entries);
  const files = SCOPE.flatMap((d) => walk(root, d)).filter((f) => !f.startsWith(EXCLUDE + "/"));
  return { files, hits: files.flatMap(scan), positive: walk(root, EXCLUDE).flatMap(scan).length };
}
