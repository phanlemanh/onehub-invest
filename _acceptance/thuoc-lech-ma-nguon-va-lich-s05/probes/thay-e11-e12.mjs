#!/usr/bin/env node
// thuoc-lech-ma-nguon-va-lich-s05 AC-4: E11, E12 của khoa-nap-s05-paused khai thay bởi AC-3 của hồ sơ này, đúng nếp kit
// (status: not-run + superseded_by), các ô khác không khai; bộ chứng con trỏ của kho (lib/evidence-core.cjs chungThayBoi)
// trả `ho-so-thay-chua-ky` trước chữ ký (mọi điều kiện đứng trước đã qua) hoặc ok sau chữ ký. Chiều đỏ trên bản chép chuỗi.
import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const require = createRequire(import.meta.url);
const ey = require(path.join(ROOT, "lib/eval-yaml.cjs"));
const core = require(path.join(ROOT, "lib/evidence-core.cjs"));
const CU = "khoa-nap-s05-paused";
const MOI = "thuoc-lech-ma-nguon-va-lich-s05";
const CON_TRO = `${MOI}#AC-3`;
const THAY = ["E11", "E12"];

/** Lỗi khai thay trong evals.yaml của hồ sơ cũ, [] khi đúng. */
export function kiemThay(yaml) {
  const loi = [];
  const ds = ey.parseEvals(yaml, ["status", "superseded_by"]);
  for (const e of ds) {
    if (THAY.includes(e.id)) {
      if (e.status !== "not-run") loi.push(`${e.id} chưa khai status: not-run`);
      if (!e.superseded_by) loi.push(`${e.id} thiếu superseded_by`);
      else if (e.superseded_by !== CON_TRO) loi.push(`superseded_by của ${CU}/${e.id} là ${e.superseded_by}, cần ${CON_TRO}`);
    } else if (e.status || e.superseded_by) loi.push(`${e.id} khai status/superseded_by`);
  }
  for (const id of THAY) if (!ds.some((e) => e.id === id)) loi.push(`${id} vắng`);
  return loi;
}

let sai = 0;
const kiem = (ok, m) => { console.log(`${ok ? "ok  " : "FAIL"} ${m}`); if (!ok) sai++; };

const yaml = readFileSync(path.join(ROOT, "_acceptance", CU, "evals.yaml"), "utf8");
const loi = kiemThay(yaml);
kiem(loi.length === 0, `E11, E12 khai thay bởi ${CON_TRO}; ô khác không khai${loi.length ? ` — ${loi.join(" · ")}` : ""}`);

// Chiều đỏ: bốn bản chép hỏng, mỗi bản gọi tên đúng ô.
const hong = [
  ["E11 bỏ superseded_by", yaml.replace(/(  - id: E11\n(?:    .*\n)*?)    superseded_by: .*\n/, "$1"), "E11 thiếu superseded_by"],
  ["E12 đổi slug", yaml.replace(/(  - id: E12\n(?:    .*\n)*?    superseded_by: )[^\n]*/, "$1khac#AC-3"), `superseded_by của ${CU}/E12 là khac#AC-3`],
  ["E12 bỏ status", yaml.replace(/(  - id: E12\n(?:    .*\n)*?)    status: not-run\n/, "$1"), "E12 chưa khai status: not-run"],
  ["E13 thêm status", yaml.replace(/(  - id: E13\n)/, "$1    status: not-run\n"), "E13 khai status/superseded_by"],
];
for (const [ten, banChep, mong] of hong) {
  const l = kiemThay(banChep);
  kiem(banChep !== yaml && l.some((x) => x.startsWith(mong)), `bản chép «${ten}» → lỗi «${mong}» (được: ${l.join(" · ") || "không lỗi"})`);
}

// Bộ chứng con trỏ của kho trên cây này.
const daKy = /^status:\s*signed-off\s*$/m.test(readFileSync(path.join(ROOT, "_acceptance", MOI, "contract.md"), "utf8"));
for (const id of THAY) {
  const r = core.chungThayBoi({ root: ROOT, slug: CU, id, conTro: CON_TRO });
  const mong = daKy ? "ok" : "ho-so-thay-chua-ky";
  kiem(daKy ? r.ok === true : r.lyDo === mong, `chungThayBoi ${CU}/${id} → ${r.ok ? "ok" : r.lyDo} (mong ${mong})`);
}

// Chiều đỏ của bộ chứng: bản chép cây có hợp đồng bỏ thẻ khoa-nap-s05-paused/E11 → thay-khong-nhan.
const tam = mkdtempSync(path.join(tmpdir(), "tl-thay-"));
try {
  for (const s of [CU, MOI]) cpSync(path.join(ROOT, "_acceptance", s), path.join(tam, "_acceptance", s), { recursive: true });
  const hd = path.join(tam, "_acceptance", MOI, "contract.md");
  writeFileSync(hd, readFileSync(hd, "utf8").replaceAll(`${CU}/E11`, `${CU}/Exx`).replace(/^status:.*$/m, "status: signed-off"));
  mkdirSync(path.join(tam, "docs"), { recursive: true });
  const r = core.chungThayBoi({ root: tam, slug: CU, id: "E11", conTro: CON_TRO });
  kiem(r.lyDo === "thay-khong-nhan", `bản chép hợp đồng bỏ thẻ ${CU}/E11 → ${r.ok ? "ok" : r.lyDo} (mong thay-khong-nhan)`);
} finally {
  rmSync(tam, { recursive: true, force: true });
}

console.log(sai ? `TL-THAY FAIL (${sai})` : "TL-THAY PASS");
process.exitCode = sai ? 1 : 0;
