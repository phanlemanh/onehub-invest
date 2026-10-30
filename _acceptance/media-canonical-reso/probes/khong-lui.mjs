#!/usr/bin/env node
// khong-lui.mjs — media-canonical-reso E12 (AC-10 vế không lùi): chạy lưới trước-merge trên cây rồi phân loại từng
// dòng VIOLATION. Trước chữ ký chỉ được còn hai lớp đã biết:
//   1. vi phạm của CHÍNH media-canonical-reso về trạng thái/chữ ký (chưa arm cổng, human_signoff trống);
//   2. ô `superseded_by` của hồ sơ đã ký trỏ media-canonical-reso#AC-n chờ hồ sơ này ký (`ho-so-thay-chua-ky`).
// Còn bất kỳ dòng nào khác — kể cả `evidence is stale` của hồ sơ khác — thì in nguyên văn và thoát 1. Lưới không chạy
// được thì thoát 2 «không đo được» (không bao giờ PASS khi không nhìn thấy).
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const SLUG = "media-canonical-reso";
const base = process.env.KHONG_LUI_BASE ?? "origin/main";

/** Phân loại dòng VIOLATION: trả danh sách dòng lạ (rỗng = chỉ còn lớp đã biết). */
export function dongLa(output) {
  const la = [];
  for (const l of output.split("\n").filter((x) => x.startsWith("VIOLATION"))) {
    const slug = l.match(/^VIOLATION \[([^\]]+)\]/)?.[1];
    if (slug === SLUG && /status chưa arm|human_signoff|chưa ký|signoff/.test(l) && !/stale/.test(l)) continue;
    const tro = l.match(/con trỏ thay thế không chứng được: (.*)$/)?.[1];
    if (slug !== SLUG && tro) {
      const muc = tro.split(";").map((x) => x.trim()).filter(Boolean);
      if (muc.length && muc.every((m) => new RegExp(`^E\\w+: ho-so-thay-chua-ky \\(${SLUG}#AC-\\d+\\)$`).test(m))) continue;
    }
    la.push(l);
  }
  return la;
}

function main() {
  const r = spawnSync("bash", [path.join(ROOT, "scripts/pre-merge-check.sh"), ROOT, "--base", base], {
    cwd: ROOT,
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
  });
  const out = `${r.stdout ?? ""}${r.stderr ?? ""}`;
  if (r.error || !/pre-merge-check: rules ran=/.test(out)) {
    console.error(`khong-lui: không đo được — lưới trước-merge không chạy trọn (${r.error?.message ?? `mã ${r.status}`})`);
    process.exit(2);
  }
  const la = dongLa(out);
  const tong = out.split("\n").filter((x) => x.startsWith("VIOLATION")).length;
  if (la.length) {
    console.error(`khong-lui: ${la.length}/${tong} vi phạm ngoài hai lớp đã biết trước chữ ký:`);
    for (const l of la) console.error(l);
    process.exit(1);
  }
  console.log(`KHÔNG LÙI PASS — ${tong} vi phạm còn lại đều thuộc hai lớp đã biết trước chữ ký (base ${base})`);
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) main();
