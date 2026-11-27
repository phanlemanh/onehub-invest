#!/usr/bin/env node
// PB6 E11 (AC-11) — tên chuẩn RESO DD 2.1 của tệp hợp đồng Property, sáu điều kiện extension, ranh giới tệp, openapi, tài liệu.
// Chạy: cd data-api && node --import tsx ../_acceptance/data-api-property-danh-ba-nha/probes/reso-ranh.mjs
// Bản DD máy đọc (`research-local/reso/dd-2.1.json`, EULA RESO — chỉ ở máy thu) vắng → in dòng bỏ qua có tên cho phần đối
// chiếu DD, phần còn lại vẫn chạy. Thoát 0 = đạt; 1 = vi phạm (mỗi dòng một thông điệp ghim «PB6 …»).
import { existsSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { execFileSync, spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const YAML = createRequire(path.join(ROOT, "pipeline/package.json"))("yaml");
const hd = await import(path.join(ROOT, "data-api/src/contract/property.ts"));
const loi = [];

// ── 1. Đối chiếu DD 2.1 ────────────────────────────────────────────────────────────────────────────────────────────────
const camel = (s) => s.charAt(0).toLowerCase() + s.slice(1);
const SAU_DIEU_KIEN = ["rationale", "migration", "check", "declared_in", "dq"];
/** Kiểm một bộ khoá với DD + mappings; trả danh sách thông điệp. */
export function kiemKhoa(khoa, dd, ext, giaTriLookup) {
  const ra = [];
  if (!dd) return ra;
  const fl = new Set(dd.fields.map((f) => `${f.resourceName}.${f.fieldName}`));
  const lk = new Map();
  for (const x of dd.lookups) {
    const ten = x.lookupName.split(".").pop();
    const a = Object.fromEntries((x.annotations ?? []).map((y) => [y.term.split(".").pop(), y.value]));
    if (!lk.has(ten)) lk.set(ten, new Set());
    lk.get(ten).add(a.StandardName ?? x.lookupValue);
  }
  for (const k of khoa) {
    if (k.resource === "extension") {
      const m = ext?.[k.key];
      if (!m) ra.push(`PB6 extension thiếu mục trong mappings.yaml: ${k.key}`);
      else {
        if (m.dd !== null) ra.push(`PB6 extension ${k.key} phải khai dd: null`);
        for (const d of SAU_DIEU_KIEN) if (!m[d]) ra.push(`PB6 extension ${k.key} thiếu điều kiện ${d}`);
      }
      continue;
    }
    if (!k.ddField || camel(k.ddField) !== k.key) ra.push(`PB6 khoá không phải camelCase của field DD: ${k.key}`);
    if (!fl.has(`${k.resource}.${k.ddField}`)) ra.push(`PB6 field DD không có: ${k.resource}.${k.ddField}`);
  }
  for (const [lookup, vals] of Object.entries(giaTriLookup)) {
    for (const v of vals) if (!lk.get(lookup)?.has(v)) ra.push(`PB6 giá trị lookup không phải StandardName: ${lookup}=${v}`);
  }
  return ra;
}

const goc = execFileSync("git", ["-C", ROOT, "rev-parse", "--path-format=absolute", "--git-common-dir"], { encoding: "utf8" }).trim();
const ddTep = [path.join(ROOT, "research-local/reso/dd-2.1.json"), path.join(path.dirname(goc), "research-local/reso/dd-2.1.json")].find(existsSync);
const dd = ddTep ? JSON.parse(readFileSync(ddTep, "utf8")) : null;
const map = YAML.parse(readFileSync(path.join(ROOT, "pipeline/mappings.yaml"), "utf8"));
const ext = map.api_extensions?.property?.keys;
const moiKhoa = [...hd.BUILDING_KEYS, ...hd.UNIT_KEYS, ...hd.LOOKUP_EXTRA_KEYS];
const giaTri = {
  AreaUnits: ["Square Meters"],
  PropertySubType: Object.values(hd.PROPERTY_SUB_TYPE).filter((v) => v !== null),
  Country: ["VN"],
};
// Khoá lookup không có giá trị cố định phải khai localValue (city, stateOrProvince) — giá trị local, miễn có tên.
for (const k of moiKhoa) if (k.lookup && !["AreaUnits", "PropertySubType", "Country"].includes(k.lookup) && !k.localValue) {
  loi.push(`PB6 khoá lookup ${k.key} không khai giá trị local`);
}
if (!dd) console.log("PB6 bỏ qua đối chiếu DD: chỉ chạy tại máy thu (thiếu research-local/reso/dd-2.1.json)");
else {
  loi.push(...kiemKhoa(moiKhoa, dd, ext, giaTri));
  // Ô tự đỏ cùng lượt — mỗi ô đúng một thông điệp ghim.
  const o = [
    ["khoá không khai", [...moiKhoa, { key: "khoaLa", resource: "extension" }], ext, giaTri, "PB6 extension thiếu mục trong mappings.yaml: khoaLa"],
    ["tên DD không có", [...moiKhoa, { key: "listPricePerArea", resource: "Property", ddField: "ListPricePerArea" }], ext, giaTri, "PB6 field DD không có: Property.ListPricePerArea"],
    ["lookup sai chữ", moiKhoa, ext, { ...giaTri, AreaUnits: ["SquareMeters"] }, "PB6 giá trị lookup không phải StandardName: AreaUnits=SquareMeters"],
    ["extension thiếu điều kiện", moiKhoa, { ...ext, unitCount: { dd: null, rationale: "x" } }, giaTri, "PB6 extension unitCount thiếu điều kiện migration"],
  ];
  for (const [ten, k, e, g, ghim] of o) {
    const r = kiemKhoa(k, dd, e, g);
    if (!r.includes(ghim)) loi.push(`PB6 ô tự đỏ «${ten}» không ra «${ghim}»`);
    else console.log(`ô tự đỏ «${ten}»: đúng`);
  }
  console.log(`PB6 đối chiếu DD 2.1 (${dd.generatedOn}): ${moiKhoa.length} khoá`);
}

// ── 2. Ranh giới tệp ───────────────────────────────────────────────────────────────────────────────────────────────────
const VUNG = [
  /^data-api\/src\/routes\/properties\.ts$/, /^data-api\/src\/contract\/property\.ts$/, /^data-api\/src\/app\.ts$/,
  /^data-api\/src\/middleware\/error-handler\.ts$/, /^data-api\/README\.md$/, /^data-api\/CLAUDE\.md$/,
  /^data-api\/test\/properties\.test\.ts$/, /^data-api\/test\/dong-ba-route\.test\.ts$/, /^pipeline\/mappings\.yaml$/,
  /^_acceptance\/config\.yaml$/, /^PRODUCT-MAP\.md$/, /^LO-TRINH\.html$/, /^_acceptance\/data-api-property-danh-ba-nha\//,
  /^docs\/superpowers\/plans\/2026-11-27-data-api-property-danh-ba-nha\.md$/,
];
const base = execFileSync("git", ["-C", ROOT, "merge-base", "HEAD", "origin/main"], { encoding: "utf8" }).trim();
const doi = execFileSync("git", ["-C", ROOT, "diff", "--name-only", base, "HEAD"], { encoding: "utf8" }).split("\n").filter(Boolean);
for (const t of doi) if (!VUNG.some((r) => r.test(t))) loi.push(`PB6 NGOÀI VÙNG: ${t}`);
console.log(`PB6 ranh giới: ${doi.length} tệp đổi`);

// ── 3. openapi sinh từ tệp hợp đồng ────────────────────────────────────────────────────────────────────────────────────
process.env.DATABASE_URL ??= "postgres://127.0.0.1:1/pb6"; // pool lười, không nối
process.env.NODE_ENV = "test";
delete process.env.DATA_API_KEYS;
const { default: app } = await import(path.join(ROOT, "data-api/src/app.ts"));
const api = await (await app.request("/openapi.json")).json();
const ss = (a) => JSON.stringify([...a].sort());
const sc = api.components?.schemas ?? {};
if (ss(Object.keys(sc.PropertyBuilding?.properties ?? {})) !== ss(hd.BUILDING_KEY_NAMES)) loi.push("PB6 openapi PropertyBuilding lệch tệp hợp đồng");
if (ss(Object.keys(sc.PropertyUnit?.properties ?? {})) !== ss(hd.UNIT_KEY_NAMES)) loi.push("PB6 openapi PropertyUnit lệch tệp hợp đồng");
if (ss(Object.keys(sc.PropertyUnitLookup?.properties ?? {})) !== ss(hd.LOOKUP_KEY_NAMES)) loi.push("PB6 openapi PropertyUnitLookup lệch tệp hợp đồng");
for (const p of ["/v1/properties", "/v1/properties/lookup", "/v1/properties/{universalPropertyId}", "/v1/properties/{universalPropertyId}/units/{unitKey}"]) {
  if (!api.paths?.[p]) loi.push(`PB6 openapi thiếu đường ${p}`);
}

// ── 4. Tài liệu + ca DRL-PB6 ───────────────────────────────────────────────────────────────────────────────────────────
const readme = readFileSync(path.join(ROOT, "data-api/README.md"), "utf8");
for (const c of ["## Property — danh bạ nhà", "NOT the RESO `Property` resource", "only on the collection machine"]) {
  if (!readme.includes(c)) loi.push(`PB6 README thiếu «${c}»`);
}
if (!readFileSync(path.join(ROOT, "data-api/CLAUDE.md"), "utf8").includes("src/contract/property.ts")) loi.push("PB6 CLAUDE.md thiếu luật khoá Property");
if (!readFileSync(path.join(ROOT, "data-api/test/dong-ba-route.test.ts"), "utf8").includes('test("DRL-PB6')) loi.push("PB6 dong-ba-route thiếu ca DRL-PB6");

// ── 5. Tên nguồn thật ──────────────────────────────────────────────────────────────────────────────────────────────────
const luoi = path.join(ROOT, "scripts/data-api-ten-nguon.mjs");
if (existsSync(luoi)) {
  const r = spawnSync("node", [luoi], { cwd: ROOT, encoding: "utf8" });
  if (r.status !== 0) loi.push(`PB6 lưới tên nguồn PB5 đỏ: ${r.stdout.trim().split("\n").pop()}`);
  else console.log("PB6 lưới tên nguồn PB5: sạch");
} else {
  console.log("PB6 lưới tên nguồn: bỏ qua — PB5 chưa gộp; soát tier-a-source-names trên tệp đổi");
  const { findSourceNames, sourceRegistrySeeds } = await import(path.join(ROOT, "scripts/lib/tier-a-source-names.mjs"));
  const e = sourceRegistrySeeds(ROOT);
  // Chỉ dòng PB6 thêm vào (diff từ merge-base) — tệp chạm chung như mappings.yaml đã mang tên từ trước, không phải của PB6.
  // Bỏ hai trang máy vẽ lại (LO-TRINH.html, PRODUCT-MAP.md — sinh từ slug có sẵn trên main). Dạng định danh liền «_»
  // (tên bảng, nợ lược đồ PB5 để ngoài phạm vi) được phép như lưới PB5.
  const tepSoat = doi.filter((t) => !/^(LO-TRINH\.html|PRODUCT-MAP\.md)$/.test(t));
  const them = tepSoat.length ? execFileSync("git", ["-C", ROOT, "diff", "-U0", base, "HEAD", "--", ...tepSoat], { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 })
    .split("\n").filter((l) => l.startsWith("+") && !l.startsWith("+++")).join("\n") : "";
  const moi = findSourceNames(them, e).filter((h) => them[h.end] !== "_").length;
  if (moi > 0) loi.push(`PB6 dòng thêm mang ${moi} cụm tên nguồn thật`);
  console.log(`PB6 tên nguồn: ${moi} cụm mới`);
}

// ── 6. typecheck ───────────────────────────────────────────────────────────────────────────────────────────────────────
const tc = spawnSync("npx", ["tsc", "-p", "tsconfig.json", "--noEmit"], { cwd: path.join(ROOT, "data-api"), encoding: "utf8" });
if (tc.status !== 0) loi.push(`PB6 typecheck data-api đỏ: ${(tc.stdout + tc.stderr).trim().split("\n")[0]}`);

if (loi.length) {
  for (const l of loi) console.error(l);
  process.exit(1);
}
console.log("PB6 tên chuẩn + ranh giới + tài liệu: đạt");
