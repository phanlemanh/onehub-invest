#!/usr/bin/env node
// hop-dong.mjs — PB2 AC-7 (eval E7): tệp hợp đồng Listing (data-api/src/contract/listing.ts) ↔ RESO DD 2.1 ↔ pipeline/mappings.yaml.
// Ô goc trên cây thật phải sạch; bốn ô cấy trên bản chép tạm phải đỏ đúng thông điệp ghim. Không tìm thấy dd-2.1.json → thoát 2.
//   - mọi khoá phần tử mà route dựng (khối `const v` của phanTu ở routes/listings.ts) có trong hợp đồng
//   - khoá resource Property: field DD 2.1 có thật ở resource Property, tên khoá = tên field viết camelCase
//   - khoá có lookup: mọi giá trị ĐẦU RA của hàm dựng phần tử (phanTu của routes/listings.ts, chạy bằng tsx trên dòng mẫu mọi
//     kind × loại — finding S4 r1: không grep mã nguồn) là StandardName của lookup đó, hoặc giá trị local khai ở mappings.yaml;
//     mỗi lookup phải có ≥ 1 giá trị ở đầu ra (không xanh suông); tập khoá của đầu ra = tệp hợp đồng
//   - khoá extension: có mục api_extensions.listing.<khoá> đủ sáu điều kiện ADR-0011 Qđ 3
import { execFileSync, spawnSync } from "node:child_process";
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
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

const LOAI = ["apartment", "house", "land", "commercial", "room", "unknown", null];
/** Chạy phanTu của routes/listings.ts (bản trong cây `goc`) trên dòng mẫu mọi kind × loại; trả các phần tử đầu ra. */
function dauRa(goc) {
  const tam = mkdtempSync(path.join(os.tmpdir(), "pb2-hd-chay-"));
  try {
    const f = path.join(tam, "chay.mts");
    writeFileSync(f, `const m = await import(${JSON.stringify(pathToFileURL(path.join(goc, "data-api", "src", "routes", "listings.ts")).href)});
const ra = [];
for (const kind of m.KIND) for (const loai of ${JSON.stringify(LOAI)}) {
  const r = { k: "pb2-mau", kind, source: "S03", property_type: loai, gia: 5e9, area_m2: 70, price_perm2: 71428571, bedrooms: 2, wc: 1.5,
    phuong: "P", ma_phuong: "p", ma_thi_truong: "t", latitude: 21, longitude: 105, first_seen: "2026-11-01T00:00:00Z",
    last_seen: "2026-11-02T00:00:00Z", confidence: "high", n_reposts: 1, ten: "t", loai_cho: "Entire home/apt", so_khach: 2,
    dem_toi_thieu: 1, so_danh_gia: 3 };
  ra.push(m.phanTu(r, { below: 10, median: 1, rank: null }, { occupancy: 50, revenue: 1 }));
}
console.log("KQ " + JSON.stringify(ra));
`);
    // DATABASE_URL giả, không có tài khoản: client.ts chỉ dựng pool, không kết nối khi không truy vấn.
    const r = spawnSync("npx", ["tsx", f], { cwd: path.join(goc, "data-api"), encoding: "utf8", env: { ...process.env, DATABASE_URL: "postgres://127.0.0.1:1/pb2" } });
    const dong = (r.stdout ?? "").split("\n").find((l) => l.startsWith("KQ "));
    if (!dong) throw new Error(`hop-dong: không chạy được phanTu: ${(r.stderr ?? "").split("\n").slice(-4).join(" | ")}`);
    return JSON.parse(dong.slice(3));
  } finally {
    rmSync(tam, { recursive: true, force: true });
  }
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

    // Giá trị lookup: đọc từ ĐẦU RA của phanTu, mỗi khoá có lookup gom mọi giá trị khác null.
    const ra = dauRa(goc);
    const giaTri = {};
    for (const k of hd.LISTING_KEYS.filter((x) => x.lookup)) giaTri[k.key] = new Set(ra.map((d) => d[k.key]).filter((v) => v !== null && v !== undefined));
    for (const d of ra) {
      const thua = Object.keys(d).filter((x) => !khoa.has(x)), thieu = [...khoa.keys()].filter((x) => !(x in d));
      for (const x of [...thua, ...thieu]) loi.push(`PB2 đầu ra lệch tập khoá hợp đồng: ${x}`);
    }

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
          if (!giaTri[k.key]?.size) loi.push(`PB2 lookup ${k.key} không có giá trị nào ở đầu ra`);
          for (const v of giaTri[k.key] ?? []) {
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
  for (const p of ["data-api/src", "data-api/package.json", "pipeline/mappings.yaml"]) {
    mkdirSync(path.dirname(path.join(g, p)), { recursive: true });
    cpSync(path.join(ROOT, p), path.join(g, p), { recursive: true });
  }
  symlinkSync(path.join(ROOT, "data-api", "node_modules"), path.join(g, "data-api", "node_modules"));
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
  { o: "lookup-rong", mong: "PB2 lookup leaseAmountFrequency không có giá trị nào ở đầu ra",
    sua: (g) => doiTep(g, "data-api/src/routes/listings.ts", 'leaseAmountFrequency: kind === "rent_lt" ? "Monthly" : kind === "rent_st" ? "Daily" : null,', "leaseAmountFrequency: null,") },
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
