#!/usr/bin/env node
// pham-vi.mjs — PB2 AC-10 phần máy (eval E10): ranh giới tệp, phần đổi của mappings.yaml, khoá config, tên nguồn thật.
//  1. Mọi tệp nhánh đổi so với nền nằm trong ranh giới AC-10(a) cộng các tệp GS cho sửa sau Cổng 1 (sổ quyết định).
//  2. pipeline/mappings.yaml chỉ đổi meta, ba mục canonical (offer_id, price_perm2, first_seen), thêm listings, api_extensions,
//     và đúng một lần chuyển ngoại lệ lint kind deals.ts → listings.ts (sổ quyết định) — so trên cây YAML đã đọc, không so chữ.
//  3. _acceptance/config.yaml chỉ THÊM khoá `dapi_reso*`.
//  4. Toàn cây data-api/ (mọi tệp, không chỉ phần diff) không có tên nguồn thật ngoài dạng định danh đã biết — bộ quét của
//     PB5 (scripts/data-api-ten-nguon.mjs). Báo bằng mã S0x, KHÔNG in tên.
// Nền: merge-base với origin/main; nhánh dựng trên PB5 (origin/fix/data-api-don-ten-nguon) chưa gộp main thì nền là
// merge-base với PB5 — lấy nền mới hơn trong hai. Chiều đỏ cùng lượt: bốn ô cấy.
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import { createRequire } from "node:module";
import path from "node:path";
import { isDeepStrictEqual } from "node:util";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const YAML = createRequire(path.join(ROOT, "pipeline", "package.json"))("yaml");
const { sourceRegistrySeeds } = await import(path.join(ROOT, "scripts", "lib", "tier-a-source-names.mjs"));
const { quet, tongKet } = await import(path.join(ROOT, "scripts", "data-api-ten-nguon.mjs"));
const git = (...a) => execFileSync("git", ["-C", ROOT, ...a], { encoding: "utf8", maxBuffer: 64 << 20 });
const gitOk = (...a) => { try { git(...a); return true; } catch { return false; } };

const SLUG = "data-api-hop-dong-reso-dd-2-1";
const DUOC = [
  /^data-api\//,
  /^pipeline\/mappings\.yaml$/, // riêng tệp này còn soát theo cây (soatMappings)
  new RegExp(`^_acceptance/${SLUG}/`),
  new RegExp(`^docs/superpowers/plans/\\d{4}-\\d{2}-\\d{2}-${SLUG}\\.md$`), // kế hoạch S2 của chính hồ sơ (kit)
  /^_acceptance\/config\.yaml$/, // riêng tệp này còn soát từng dòng (soatConfig)
  /^(PRODUCT-MAP\.md|LO-TRINH\.html)$/,
  /^app\/tests\/(can-gia-cung-loai-db|hang-gia-doc|gia-tot-du-an-doc)\.test\.tsx$/, // GS xác nhận 27/11 (sổ quyết định)
  /^scripts\/data-api-ten-nguon\.test\.mjs$/, // GS cho sửa ca PB5-AC-2, AC-3, AC-4 theo schema.sql, 27/11 (sổ quyết định)
  /^app\/tests\/chuyen-huong-ma-thi-truong\.itest\.tsx$/, // GS cho 27/11 (CÂU C): chỉ phần gọi data-api
  /^pipeline\/scripts\/vocab-lint\.test\.mjs$/, // GS cho 27/11 (CÂU A): đúng một dòng — soát riêng (soatVocabLint)
];
/** Diff -U0 của vocab-lint.test.mjs: đúng một dòng đổi, ngoại lệ kind của data-api từ deals.ts sang listings.ts. */
export function soatVocabLint(diff) {
  const xoa = [], them = [];
  for (const d of diff.split("\n")) {
    if (/^(\+\+\+|---|@@|diff |index )/.test(d) || d === "") continue;
    if (d.startsWith("-")) xoa.push(d.slice(1).trim());
    else if (d.startsWith("+")) them.push(d.slice(1).trim());
  }
  if (!xoa.length && !them.length) return [];
  const dung = xoa.length === 1 && them.length === 1 && xoa[0] === '"data-api/src/routes/deals.ts|kind",' && them[0] === '"data-api/src/routes/listings.ts|kind",';
  return dung ? [] : ["AC-10 NGOÀI PHẠM VI: pipeline/scripts/vocab-lint.test.mjs đổi ngoài đúng một dòng ngoại lệ kind"];
}

/** Tệp ngoài ranh giới → dòng vi phạm. */
export function soatTep(tep) {
  return tep.filter((t) => !DUOC.some((re) => re.test(t))).map((t) => `AC-10 NGOÀI PHẠM VI: ${t}`);
}
/** Diff -U0 của config.yaml: chỉ được thêm dòng khoá `dapi_reso*` (hoặc dòng trống, dòng chú thích nhắc slug). */
export function soatConfig(diff) {
  const loi = [];
  for (const d of diff.split("\n")) {
    if (/^(\+\+\+|---|@@|diff |index )/.test(d) || d === "") continue;
    if (d.startsWith("-")) { loi.push("AC-10 NGOÀI PHẠM VI: _acceptance/config.yaml khoá «dòng bị xoá»"); continue; }
    if (!d.startsWith("+")) continue;
    const than = d.slice(1);
    if (than.trim() === "" || new RegExp(`^\\s*#.*${SLUG}`).test(than)) continue;
    const m = /^\s+([A-Za-z0-9_]+):\s/.exec(than);
    if (!m || !/^dapi_reso[a-z0-9_]*$/.test(m[1])) loi.push(`AC-10 NGOÀI PHẠM VI: _acceptance/config.yaml khoá ${m ? m[1] : "«không đọc được»"}`);
  }
  return loi;
}
/** So hai cây mappings.yaml đã đọc: mọi chỗ khác ngoài phần được giao → «AC-10 mappings.yaml đổi ngoài phần được giao: <đường>». */
export function soatMappings(cu, moi) {
  const loi = [];
  const ngoai = (p) => loi.push(`AC-10 mappings.yaml đổi ngoài phần được giao: ${p}`);
  const DUOC_CANONICAL = new Set(["offer_id", "price_perm2", "first_seen"]);
  const MOI = new Set(["listings", "api_extensions"]);
  for (const k of new Set([...Object.keys(cu), ...Object.keys(moi)])) {
    if (MOI.has(k)) { if (k in cu) ngoai(k); continue; }
    if (k === "meta") {
      for (const m of new Set([...Object.keys(cu.meta ?? {}), ...Object.keys(moi.meta ?? {})])) {
        if (m === "dd_version" || m === "checked_on") continue;
        if (!isDeepStrictEqual(cu.meta?.[m], moi.meta?.[m])) ngoai(`meta.${m}`);
      }
      continue;
    }
    if (k === "canonical") {
      for (const m of new Set([...Object.keys(cu.canonical ?? {}), ...Object.keys(moi.canonical ?? {})])) {
        if (m !== "fields") { if (!isDeepStrictEqual(cu.canonical?.[m], moi.canonical?.[m])) ngoai(`canonical.${m}`); continue; }
        const a = cu.canonical.fields ?? {}, b = moi.canonical.fields ?? {};
        for (const f of new Set([...Object.keys(a), ...Object.keys(b)])) {
          if (DUOC_CANONICAL.has(f)) continue;
          if (!isDeepStrictEqual(a[f], b[f])) ngoai(`canonical.fields.${f}`);
        }
      }
      continue;
    }
    if (k === "enums_lint_allow") {
      // Đúng một mục được chuyển: kind của data-api deals.ts → listings.ts; mọi mục khác giữ nguyên.
      const doi = (ds) => (ds ?? []).map((x) => (x.path === "data-api/src/routes/deals.ts" && x.axis === "kind" ? null : x)).filter(Boolean);
      const boMoi = (ds) => (ds ?? []).filter((x) => !(x.path === "data-api/src/routes/listings.ts" && x.axis === "kind"));
      if (!isDeepStrictEqual(doi(cu[k]), boMoi(moi[k]))) ngoai(k);
      continue;
    }
    if (k === "enums") {
      for (const e of new Set([...Object.keys(cu.enums ?? {}), ...Object.keys(moi.enums ?? {})])) if (!isDeepStrictEqual(cu.enums?.[e], moi.enums?.[e])) ngoai(`enums.${e}`);
      continue;
    }
    if (!isDeepStrictEqual(cu[k], moi[k])) ngoai(k);
  }
  return loi;
}
/** Quét tên nguồn thật trên một cây; trả vi phạm (mã + tệp) và số đếm. */
function soatTen(goc, entries, files) {
  const k = tongKet(quet(goc, files ? { entries, files } : { entries }));
  return {
    loi: [...k.viPham.map((v) => `AC-10 tên nguồn thật: ${v.code} (${v.file})`), ...k.viPhamTenTep.map((v) => `AC-10 tên nguồn thật: ${v.code} (tên tệp ${v.file})`)],
    soTep: k.soTep, dinhDanh: k.dinhDanhBiet,
  };
}

let entries;
try {
  entries = sourceRegistrySeeds(ROOT);
} catch (e) {
  console.log(`pham-vi: không rút được tên nguồn nào (${e.message})`);
  process.exit(2);
}

const ung = [git("merge-base", "HEAD", "origin/main").trim()];
if (gitOk("rev-parse", "--verify", "-q", "origin/fix/data-api-don-ten-nguon")) ung.push(git("merge-base", "HEAD", "origin/fix/data-api-don-ten-nguon").trim());
const nen = ung.find((c) => ung.every((d) => d === c || gitOk("merge-base", "--is-ancestor", d, c))) ?? ung[0];
const tep = [...new Set(git("diff", "--name-only", nen).split("\n").filter(Boolean))].sort();
const diffConfig = git("diff", "-U0", nen, "--", "_acceptance/config.yaml");
const mapCu = YAML.parse(git("show", `${nen}:pipeline/mappings.yaml`));
const mapMoi = YAML.parse(readFileSync(path.join(ROOT, "pipeline", "mappings.yaml"), "utf8"));
const ten = soatTen(ROOT, entries);
const diffVocab = git("diff", "-U0", nen, "--", "pipeline/scripts/vocab-lint.test.mjs");
const loi = [...soatTep(tep), ...soatConfig(diffConfig), ...soatMappings(mapCu, mapMoi), ...soatVocabLint(diffVocab), ...ten.loi];

// ── Chiều đỏ: cùng các hàm trên, đầu vào cấy ─────────────────────────────────────────────────────────────────────
const sao = structuredClone(mapMoi);
sao.enums.kind = { ...(sao.enums.kind ?? {}), pb2_cay: true };
const don = entries.find((e) => /^[A-Za-z0-9]{5,}$/.test(e.realName)) ?? entries[0];
const caySao = (() => {
  // pha-ten: tên trần vào bản chép tạm một tệp data-api, quét bản chép bằng cùng bộ quét
  const tam = mkdtempSync(path.join(os.tmpdir(), "pb2-pv-"));
  try {
    mkdirSync(path.join(tam, "data-api"), { recursive: true });
    writeFileSync(path.join(tam, "data-api", "README.md"), `${readFileSync(path.join(ROOT, "data-api", "README.md"), "utf8")}\nNguồn: ${don.realName}\n`);
    return soatTen(tam, entries, ["data-api/README.md"]).loi.some((l) => l.startsWith(`AC-10 tên nguồn thật: ${don.code} `));
  } finally {
    rmSync(tam, { recursive: true, force: true });
  }
})();
const o = {
  "pha-tep": soatTep([...tep, "db/migrations/x.sql"]).includes("AC-10 NGOÀI PHẠM VI: db/migrations/x.sql"),
  "pha-mappings": soatMappings(mapCu, sao).includes("AC-10 mappings.yaml đổi ngoài phần được giao: enums.kind"),
  "pha-ten": caySao,
  "pha-vocab": soatVocabLint(`-  "data-api/src/routes/deals.ts|kind",\n+  "data-api/src/routes/listings.ts|kind",\n+  "x|kind",`).length === 1
    && soatVocabLint(`-  "data-api/src/routes/deals.ts|kind",\n+  "data-api/src/routes/listings.ts|kind",`).length === 0,
  "pha-config": soatConfig(`+    khoa_la: "echo"\n+    dapi_reso_x: "echo"`).join("|") === "AC-10 NGOÀI PHẠM VI: _acceptance/config.yaml khoá khoa_la",
};
for (const [ten_o, dat] of Object.entries(o)) {
  if (!dat) { console.log(`pham-vi: thước không đỏ ở ${ten_o}`); process.exit(1); }
}
console.log(`chieu-do: ${Object.keys(o).join(", ")} — năm ô cấy đều ra đúng (pha-vocab → thêm dòng thứ hai bị bắt, pha-tep → «AC-10 NGOÀI PHẠM VI: db/migrations/x.sql», pha-mappings → «… enums.kind», pha-ten → «AC-10 tên nguồn thật: ${don.code}», pha-config → «… khoá khoa_la»)`);

if (loi.length) {
  for (const l of loi) console.log(l);
  console.log(`pham-vi: ${loi.length} vi phạm`);
  process.exit(1);
}
console.log(`pham-vi: nền ${nen.slice(0, 9)}; ${tep.length} tệp đổi, đều trong ranh giới; mappings.yaml chỉ đổi meta, ba mục canonical, thêm listings, api_extensions (cộng một ngoại lệ lint chuyển tệp); soát ${entries.length} tên nguồn thật trên toàn cây data-api (${ten.soTep} tệp), 0 khớp ngoài dạng định danh (${ten.dinhDanh} định danh đã biết)`);
