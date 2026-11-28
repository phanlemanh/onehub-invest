#!/usr/bin/env node
// pham-vi.mjs — PB7 AC-9 phần máy (eval E11): ranh giới tệp, mappings.yaml chỉ thêm nguon_khong_hien_thi, offers-filters.ts chỉ
// đổi dòng hằng nguồn ẩn, config chỉ thêm khoá dapi_an*, toàn cây data-api không có tên nguồn thật ngoài dạng định danh đã biết
// (bộ quét PB5). Nền: merge-base mới hơn trong hai — với origin/main và với nhánh PB2 (PB7 dựng trên PB2, gộp sau PB2).
// Chiều đỏ cùng lượt: bốn ô cấy. Báo bằng mã S0x, không in tên.
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import os from "node:os";
import path from "node:path";
import { isDeepStrictEqual } from "node:util";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const YAML = createRequire(path.join(ROOT, "pipeline", "package.json"))("yaml");
const { sourceRegistrySeeds } = await import(path.join(ROOT, "scripts", "lib", "tier-a-source-names.mjs"));
const { quet, tongKet } = await import(path.join(ROOT, "scripts", "data-api-ten-nguon.mjs"));
const git = (...a) => execFileSync("git", ["-C", ROOT, ...a], { encoding: "utf8", maxBuffer: 64 << 20 });
const gitOk = (...a) => { try { git(...a); return true; } catch { return false; } };

const SLUG = "data-api-tin-hien-thi";
const DUOC = [
  /^data-api\//,
  /^pipeline\/mappings\.yaml$/, // soát theo cây (soatMappings)
  /^pipeline\/lib\/vocab-core\.mjs$/,
  /^pipeline\/lib\/vocab\.generated\.mjs$/, /^agent\/src\/vocab\.generated\.ts$/, /^app\/src\/lib\/vocab\.generated\.ts$/,
  /^app\/src\/lib\/offers-filters\.ts$/, // soát từng dòng (soatApp)
  /^pipeline\/scripts\/do-s03-len-cong\.mjs$/,
  /^pipeline\/scripts\/vocab(-lint)?\.test\.mjs$/,
  new RegExp(`^_acceptance/${SLUG}/`),
  new RegExp(`^docs/superpowers/plans/\\d{4}-\\d{2}-\\d{2}-${SLUG}\\.md$`),
  /^_acceptance\/config\.yaml$/, // soát từng dòng (soatConfig)
  /^(PRODUCT-MAP\.md|LO-TRINH\.html)$/,
];
export const soatTep = (tep) => tep.filter((t) => !DUOC.some((re) => re.test(t))).map((t) => `AC-9 NGOÀI PHẠM VI: ${t}`);
export function soatConfig(diff) {
  const loi = [];
  for (const d of diff.split("\n")) {
    if (/^(\+\+\+|---|@@|diff |index )/.test(d) || d === "") continue;
    if (d.startsWith("-")) { loi.push("AC-9 NGOÀI PHẠM VI: _acceptance/config.yaml khoá «dòng bị xoá»"); continue; }
    if (!d.startsWith("+")) continue;
    const m = /^\s+([A-Za-z0-9_]+):\s/.exec(d.slice(1));
    if (!m || !/^dapi_an[a-z0-9_]*$/.test(m[1])) loi.push(`AC-9 NGOÀI PHẠM VI: _acceptance/config.yaml khoá ${m ? m[1] : "«không đọc được»"}`);
  }
  return loi;
}
export function soatMappings(cu, moi) {
  const loi = [];
  for (const k of new Set([...Object.keys(cu), ...Object.keys(moi)])) {
    if (k === "nguon_khong_hien_thi") { if (k in cu) loi.push(`AC-9 mappings.yaml đổi ngoài phần được giao: ${k}`); continue; }
    if (k === "enums") {
      for (const e of new Set([...Object.keys(cu.enums ?? {}), ...Object.keys(moi.enums ?? {})])) if (!isDeepStrictEqual(cu.enums?.[e], moi.enums?.[e])) loi.push(`AC-9 mappings.yaml đổi ngoài phần được giao: enums.${e}`);
      continue;
    }
    if (!isDeepStrictEqual(cu[k], moi[k])) loi.push(`AC-9 mappings.yaml đổi ngoài phần được giao: ${k}`);
  }
  return loi;
}
/** offers-filters.ts: chỉ dòng import (thêm SOURCE_HIDDEN) và hai dòng hằng nguồn ẩn (chú thích + hằng) được đổi. */
export function soatApp(diff) {
  const doi = diff.split("\n").filter((d) => /^[+-]/.test(d) && !/^(\+\+\+|---)/.test(d)).map((d) => d.slice(1));
  const hop = (l) => /^import \{ KIND, PROPERTY_TYPE(, SOURCE_HIDDEN)? \} from "\.\/vocab\.generated";$/.test(l) || /OFFER_HIDDEN_SOURCES/.test(l) || /^\/\*\* Nguồn không bao giờ hiển thị/.test(l);
  return doi.filter((l) => !hop(l)).map(() => "AC-9 app/src/lib/offers-filters.ts đổi ngoài dòng hằng nguồn ẩn").slice(0, 1);
}

let entries;
try { entries = sourceRegistrySeeds(ROOT); } catch (e) { console.log(`pham-vi: không rút được tên nguồn nào (${e.message})`); process.exit(2); }
const ung = [git("merge-base", "HEAD", "origin/main").trim()];
if (gitOk("rev-parse", "--verify", "-q", "origin/feat/data-api-hop-dong-reso-dd-2-1")) ung.push(git("merge-base", "HEAD", "origin/feat/data-api-hop-dong-reso-dd-2-1").trim());
const nen = ung.find((c) => ung.every((d) => d === c || gitOk("merge-base", "--is-ancestor", d, c))) ?? ung[0];
const tep = [...new Set([...git("diff", "--name-only", nen).split("\n"), ...git("ls-files", "--others", "--exclude-standard").split("\n")].filter(Boolean))].sort();
const mapCu = YAML.parse(git("show", `${nen}:pipeline/mappings.yaml`));
const mapMoi = YAML.parse(readFileSync(path.join(ROOT, "pipeline", "mappings.yaml"), "utf8"));
const k = tongKet(quet(ROOT, { entries }));
const loi = [
  ...soatTep(tep), ...soatConfig(git("diff", "-U0", nen, "--", "_acceptance/config.yaml")), ...soatMappings(mapCu, mapMoi),
  ...soatApp(git("diff", "-U0", nen, "--", "app/src/lib/offers-filters.ts")),
  ...k.viPham.map((v) => `AC-9 tên nguồn thật: ${v.code} (${v.file})`), ...k.viPhamTenTep.map((v) => `AC-9 tên nguồn thật: ${v.code} (tên tệp ${v.file})`),
];

// ── Chiều đỏ ───────────────────────────────────────────────────────────────────────────────────────────────────────
const sao = structuredClone(mapMoi); sao.enums.kind = { ...(sao.enums.kind ?? {}), pb7_cay: true };
const don = entries.find((e) => /^[A-Za-z0-9]{5,}$/.test(e.realName)) ?? entries[0];
const phaTen = (() => {
  const tam = mkdtempSync(path.join(os.tmpdir(), "pb7-pv-"));
  try {
    mkdirSync(path.join(tam, "data-api"), { recursive: true });
    writeFileSync(path.join(tam, "data-api", "README.md"), `${readFileSync(path.join(ROOT, "data-api", "README.md"), "utf8")}\nNguồn: ${don.realName}\n`);
    return tongKet(quet(tam, { entries, files: ["data-api/README.md"] })).viPham.some((v) => v.code === don.code);
  } finally { rmSync(tam, { recursive: true, force: true }); }
})();
const o = {
  "pha-tep": soatTep([...tep, "db/migrations/x.sql"]).includes("AC-9 NGOÀI PHẠM VI: db/migrations/x.sql"),
  "pha-mappings": soatMappings(mapCu, sao).includes("AC-9 mappings.yaml đổi ngoài phần được giao: enums.kind"),
  "pha-ten": phaTen,
  "pha-config": soatConfig(`+    khoa_la: "echo"\n+    dapi_an_x: "echo"`).join("|") === "AC-9 NGOÀI PHẠM VI: _acceptance/config.yaml khoá khoa_la",
  "pha-app": soatApp(`+++ b/app/src/lib/offers-filters.ts\n+export const OFFER_RECENT_DAYS = 60;`).length === 1,
};
for (const [ten, dat] of Object.entries(o)) if (!dat) { console.log(`pham-vi: thước không đỏ ở ${ten}`); process.exit(1); }
console.log(`chieu-do: ${Object.keys(o).join(", ")} — năm ô cấy đều ra đúng`);
if (loi.length) { for (const l of loi) console.log(l); console.log(`pham-vi: ${loi.length} vi phạm`); process.exit(1); }
console.log(`pham-vi: nền ${nen.slice(0, 9)}; ${tep.length} tệp đổi, đều trong ranh giới; mappings.yaml chỉ thêm nguon_khong_hien_thi; offers-filters.ts chỉ đổi dòng hằng nguồn ẩn; soát ${entries.length} tên nguồn thật trên toàn cây data-api (${k.soTep} tệp), 0 khớp ngoài dạng định danh`);
