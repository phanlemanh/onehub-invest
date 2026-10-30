#!/usr/bin/env node
// khong-lui.mjs — media-canonical-reso E12 (AC-10 vế không lùi): chạy lưới trước-merge trên cây rồi phân loại từng
// dòng VIOLATION. Trước chữ ký chỉ được còn ba lớp đã biết:
//   1. vi phạm của CHÍNH media-canonical-reso về trạng thái/chữ ký (status, verdict lượt trước, human_signoff trống…),
//      trừ «evidence is stale»;
//   2. ô `superseded_by` của hồ sơ đã ký trỏ media-canonical-reso#AC-n chờ hồ sơ này ký (`ho-so-thay-chua-ky`);
//   3. `evidence is stale` của hồ sơ đã ký có ô `superseded_by` trỏ media-canonical-reso — làn ghim lại từ chối ghim
//      chúng khi hồ sơ thay chưa ký, nên chúng ghim trong lượt ký của NH1. Lớp này chỉ được nhận khi probe tự chạy MỌI
//      eval test/script còn hiệu lực (không `status: not-run`) của hồ sơ ấy trên cây và tất cả thoát 0.
// Còn bất kỳ dòng nào khác — kể cả `evidence is stale` của hồ sơ khác — thì in nguyên văn và thoát 1. Lưới không chạy
// được thì thoát 2 «không đo được» (không bao giờ PASS khi không nhìn thấy).
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const SLUG = "media-canonical-reso";
const base = process.env.KHONG_LUI_BASE ?? "origin/main";

const { parse } = createRequire(path.join(ROOT, "pipeline/package.json"))("yaml");

/** Hồ sơ đã ký có ô superseded_by trỏ hồ sơ này (đọc evals.yaml). */
function troVeDay(slug) {
  const p = path.join(ROOT, "_acceptance", slug, "evals.yaml");
  if (!existsSync(p)) return false;
  return (parse(readFileSync(p, "utf8"))?.evals ?? []).some((e) => String(e.superseded_by ?? "").startsWith(`${SLUG}#`));
}

/** Lệnh của mọi eval test/script còn hiệu lực của một hồ sơ, đã giải `config:` (trùng thì một lần). */
export function lenhConHieuLuc(slug) {
  const cfg = parse(readFileSync(path.join(ROOT, "_acceptance/config.yaml"), "utf8"));
  const evals = parse(readFileSync(path.join(ROOT, "_acceptance", slug, "evals.yaml"), "utf8"))?.evals ?? [];
  const out = new Set();
  for (const e of evals) {
    if (!["test", "script"].includes(e.executor) || e.status === "not-run") continue;
    let cmd = String(e.cmd ?? "");
    if (cmd.startsWith("config:")) cmd = cmd.slice(7).split(".").reduce((o, k) => o?.[k], cfg);
    if (typeof cmd !== "string" || !cmd) throw new Error(`${slug}/${e.id}: không giải được lệnh ${e.cmd}`);
    out.add(cmd);
  }
  return [...out];
}

/** Phân loại dòng VIOLATION: trả danh sách dòng lạ (rỗng = chỉ còn lớp đã biết) và hồ sơ lớp (3) cần chạy lại. */
export function dongLa(output, laTroVeDay = troVeDay) {
  const la = [];
  const chayLai = [];
  for (const l of output.split("\n").filter((x) => x.startsWith("VIOLATION"))) {
    const slug = l.match(/^VIOLATION \[([^\]]+)\]/)?.[1];
    // Lớp (1): trạng thái của CHÍNH hồ sơ lúc đang chấm (status, verdict lượt trước, báo cáo, chữ ký, lượt dùng được hay
    // không) — cổng tự đo chúng; E12 đo không lùi ở hồ sơ KHÁC. Riêng «evidence is stale» vẫn đỏ: code đổi sau lượt chấm.
    if (slug === SLUG && !/evidence is stale/.test(l)) continue;
    const tro = l.match(/con trỏ thay thế không chứng được: (.*)$/)?.[1];
    if (slug !== SLUG && tro) {
      const muc = tro.split(";").map((x) => x.trim()).filter(Boolean);
      if (muc.length && muc.every((m) => new RegExp(`^E\\w+: ho-so-thay-chua-ky \\(${SLUG}#AC-\\d+\\)$`).test(m))) continue;
    }
    if (slug && slug !== SLUG && /evidence is stale/.test(l) && laTroVeDay(slug)) {
      chayLai.push(slug);
      continue;
    }
    la.push(l);
  }
  la.chayLai = chayLai;
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
  for (const slug of la.chayLai) {
    const lenh = lenhConHieuLuc(slug);
    let xanh = 0;
    for (const cmd of lenh) {
      const rr = spawnSync("bash", ["-c", cmd], { cwd: ROOT, encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
      if (rr.status === 0) xanh++;
      else la.push(`lệnh đỏ của ${slug} (mã ${rr.status}): ${cmd}\n${`${rr.stdout}${rr.stderr}`.split("\n").filter((x) => /✖|Error|FAIL/.test(x)).slice(0, 8).join("\n")}`);
    }
    console.log(`chạy lại ${slug}: ${xanh}/${lenh.length} lệnh xanh`);
  }
  if (la.length) {
    console.error(`khong-lui: ${la.length} dòng ngoài ba lớp đã biết trước chữ ký (tổng ${tong} vi phạm):`);
    for (const l of la) console.error(l);
    process.exit(1);
  }
  console.log(`KHÔNG LÙI PASS — ${tong} vi phạm còn lại đều thuộc ba lớp đã biết trước chữ ký (base ${base})`);
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) main();
