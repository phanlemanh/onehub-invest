#!/usr/bin/env node
// hop-dong.mjs — PB2 AC-7 (eval E7): tệp hợp đồng Listing (data-api/src/contract/listing.ts) ↔ RESO DD 2.1 ↔ pipeline/mappings.yaml.
// Ô goc trên cây thật phải sạch; bốn ô cấy trên bản chép tạm phải đỏ đúng thông điệp ghim. Không tìm thấy dd-2.1.json → thoát 2.
//   - mọi khoá phần tử mà route dựng (khối `const v` của phanTu ở routes/listings.ts) có trong hợp đồng
//   - khoá resource Property: field DD 2.1 có thật ở resource Property, tên khoá = tên field viết camelCase
//   - khoá có lookup: mọi giá trị route trả là StandardName của lookup đó, hoặc giá trị local khai ở mappings.yaml
//   - khoá extension: có mục api_extensions.listing.<khoá> đủ sáu điều kiện ADR-0011 Qđ 3
import { execFileSync } from "node:child_process";
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import os from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const YAML = createRequire(path.join(ROOT, "pipeline", "package.json"))("yaml");
const SAU_DIEU_KIEN = ["tra_cuu", "ly_do", "migration", "check", "khai_bao", "dq"];

function timDd() {
  if (process.env.DD21_JSON) return process.env.DD21_JSON;
  const chung = execFileSync("git", ["-C", ROOT, "rev-parse", "--path-format=absolute", "--git-common-dir"], { encoding: "utf8" }).trim();
  for (const g of [ROOT, path.dirname(chung)]) {
    const f = path.join(g, "research-local", "reso", "dd-2.1.json");
    if (existsSync(f)) return f;
  }
  return null;
}
const ddTep = timDd();
if (!ddTep) {
  console.log("hop-dong: không tìm thấy dd-2.1.json (env DD21_JSON hoặc research-local/reso/dd-2.1.json của checkout chính)");
  process.exit(2);
}
const DD = JSON.parse(readFileSync(ddTep, "utf8"));
const FIELD = new Set(DD.fields.filter((f) => f.resourceName === "Property").map((f) => f.fieldName));
const STANDARD = new Map();
for (const l of DD.lookups) {
  const ten = l.lookupName.split(".").pop();
  const sn = (l.annotations ?? []).find((a) => a.term === "RESO.OData.Metadata.StandardName")?.value;
  if (!sn) continue;
  if (!STANDARD.has(ten)) STANDARD.set(ten, new Set());
  STANDARD.get(ten).add(sn);
}

/** Kiểm một cây (gốc có data-api/ và pipeline/mappings.yaml). Trả danh sách thông điệp lỗi + số đếm. */
async function kiem(goc, nhan) {
  const loi = [];
  const tam = mkdtempSync(path.join(os.tmpdir(), `pb2-hd-${nhan}-`));
  try {
    // Nạp bản chép của tệp hợp đồng (Node 24 bỏ kiểu TS sẵn) để mỗi ô đọc đúng bản của nó, không dùng bộ đệm module.
    const f = path.join(tam, "listing.ts");
    cpSync(path.join(goc, "data-api", "src", "contract", "listing.ts"), f);
    const hd = await import(pathToFileURL(f).href);
    const khoa = new Map(hd.LISTING_KEYS.map((k) => [k.key, k]));

    const route = readFileSync(path.join(goc, "data-api", "src", "routes", "listings.ts"), "utf8");
    const khoi = /const v: Record<string, unknown> = \{([\s\S]*?)\n  \};/.exec(route);
    if (!khoi) loi.push("PB2 không đọc được khối phần tử của routes/listings.ts");
    else {
      for (const m of khoi[1].matchAll(/^\s{4}([A-Za-z]\w*):/gm)) if (!khoa.has(m[1])) loi.push(`PB2 khoá không có trong hợp đồng: ${m[1]}`);
    }

    // Giá trị lookup route trả: bảng loại hình qua loaiHinh() trên mọi kind × loại, cộng các hằng của route.
    const giaTri = { PropertyType: new Set(), PropertySubType: new Set(), FeeFrequency: new Set(), AreaUnits: new Set() };
    for (const kind of ["sale", "rent_lt", "rent_st"]) {
      for (const loai of ["apartment", "house", "land", "commercial", "room", "unknown", null]) {
        const { propertyType, propertySubType } = hd.loaiHinh(kind, loai);
        if (propertyType) giaTri.PropertyType.add(propertyType);
        if (propertySubType) giaTri.PropertySubType.add(propertySubType);
      }
    }
    for (const m of route.matchAll(/leaseAmountFrequency:[^\n]*/g)) for (const s of m[0].matchAll(/"([A-Z][A-Za-z ]+)"/g)) giaTri.FeeFrequency.add(s[1]);
    for (const m of route.matchAll(/(?:livingAreaUnits|pricePerAreaUnit):[^\n]*/g)) for (const s of m[0].matchAll(/"([A-Z][A-Za-z ]+)"/g)) giaTri.AreaUnits.add(s[1]);

    const map = YAML.parse(readFileSync(path.join(goc, "pipeline", "mappings.yaml"), "utf8"));
    const local = new Set(
      (map.enums?.property_type?.values ?? []).filter((v) => v.local && v.code !== "unknown").map((v) => v.code.toLowerCase()),
    );
    let soDd = 0, soExt = 0, soGiaTri = 0;
    for (const k of hd.LISTING_KEYS) {
      if (k.resource === "Property") {
        soDd++;
        if (!FIELD.has(k.ddField)) loi.push(`PB2 không có field DD 2.1: Property.${k.ddField}`);
        else if (k.key.toLowerCase() !== k.ddField.toLowerCase()) loi.push(`PB2 tên khoá không theo field DD: ${k.key} ≠ ${k.ddField}`);
        if (k.lookup) {
          const chuan = STANDARD.get(k.lookup);
          if (!chuan) loi.push(`PB2 không có lookup DD 2.1: ${k.lookup}`);
          for (const v of giaTri[k.lookup] ?? []) {
            soGiaTri++;
            if (!chuan?.has(v) && !local.has(v.toLowerCase())) loi.push(`PB2 không phải StandardName của ${k.lookup}: ${v}`);
          }
        }
      } else {
        soExt++;
        const muc = map.api_extensions?.listing?.[k.key];
        if (!muc) loi.push(`PB2 extension chưa khai ở mappings.yaml: ${k.key}`);
        else for (const d of SAU_DIEU_KIEN) if (!String(muc[d] ?? "").trim()) loi.push(`PB2 extension ${k.key} thiếu điều kiện ${d}`);
      }
    }
    for (const t of Object.keys(map.api_extensions?.listing ?? {})) if (khoa.get(t)?.resource !== "extension") loi.push(`PB2 mappings.yaml khai extension không có trong hợp đồng: ${t}`);
    return { loi, n: khoa.size, soDd, soExt, soGiaTri };
  } finally {
    rmSync(tam, { recursive: true, force: true });
  }
}

/** Bản chép tối thiểu của cây để cấy lỗi. */
function banChep(nhan, sua) {
  const g = mkdtempSync(path.join(os.tmpdir(), `pb2-hd-cay-${nhan}-`));
  for (const p of ["data-api/src/contract/listing.ts", "data-api/src/routes/listings.ts", "pipeline/mappings.yaml"]) {
    mkdirSync(path.dirname(path.join(g, p)), { recursive: true });
    cpSync(path.join(ROOT, p), path.join(g, p));
  }
  sua(g);
  return g;
}
const doiTep = (g, p, a, b) => {
  const f = path.join(g, p);
  const s = readFileSync(f, "utf8");
  if (!s.includes(a)) throw new Error(`ô cấy hỏng: không thấy «${a}» trong ${p}`);
  writeFileSync(f, s.replace(a, b));
};

const goc = await kiem(ROOT, "goc");
let sai = 0;
if (goc.loi.length) {
  for (const l of goc.loi) console.log(l);
  sai++;
}
console.log(JSON.stringify({ o: "goc", loi: goc.loi.length }));

const O = [
  { o: "khoa-khong-khai", mong: "PB2 khoá không có trong hợp đồng: pb2KhoaLa",
    sua: (g) => doiTep(g, "data-api/src/routes/listings.ts", "    kind,\n", "    kind,\n    pb2KhoaLa: null,\n") },
  { o: "ten-dd-sai", mong: "PB2 không có field DD 2.1: Property.ListPricePerArea",
    sua: (g) => doiTep(g, "data-api/src/contract/listing.ts", 'ddField: "SalePricePerArea"', 'ddField: "ListPricePerArea"') },
  { o: "lookup-sai", mong: "PB2 không phải StandardName của PropertySubType: SingleFamilyResidence",
    sua: (g) => doiTep(g, "data-api/src/contract/listing.ts", '"Condominium", "Condominium"]', '"SingleFamilyResidence", "Condominium"]') },
  { o: "extension-thieu", mong: "PB2 extension chưa khai ở mappings.yaml: repostCount",
    sua: (g) => doiTep(g, "pipeline/mappings.yaml", "    repostCount:\n", "    repostCountBo:\n") },
];
for (const o of O) {
  const g = banChep(o.o, o.sua);
  try {
    const k = await kiem(g, o.o);
    const dat = k.loi.includes(o.mong);
    console.log(JSON.stringify({ o: o.o, dat, loi: k.loi }));
    if (!dat) {
      console.log(`hop-dong: thước không đỏ ở ${o.o}`);
      sai++;
    }
  } finally {
    rmSync(g, { recursive: true, force: true });
  }
}
if (sai) process.exit(1);
console.log(`hop-dong: ${goc.n} khoá (${goc.soDd} field DD 2.1, ${goc.soExt} extension), ${goc.soGiaTri} giá trị lookup — đều khớp DD 2.1 ${DD.generatedOn} và mappings.yaml`);
