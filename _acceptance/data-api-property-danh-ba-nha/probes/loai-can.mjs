#!/usr/bin/env node
// PB6 E8 (AC-8) — mọi giá trị loại căn nội bộ trong DB có dòng đổi sang PropertySubType; hai bản bảng đổi khớp nhau.
// Chạy trên DB thử: bash db/db-thu.sh oneinvest_suite_dapi_prop_loai --chay node _acceptance/data-api-property-danh-ba-nha/probes/loai-can.mjs
// Thoát 0 = đạt (kể cả ô tự đỏ cấy giá trị lạ); 1 = có giá trị chưa có dòng đổi, hai bản lệch, hay ô tự đỏ không đỏ.
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const req = createRequire(path.join(ROOT, "data-api/package.json"));
const reqPipe = createRequire(path.join(ROOT, "pipeline/package.json"));
const { Client } = req("pg");
const YAML = reqPipe("yaml");

const banYaml = YAML.parse(readFileSync(path.join(ROOT, "pipeline/mappings.yaml"), "utf8")).api_extensions.property.property_sub_type;
// Bản trong tệp hợp đồng: đọc khối PROPERTY_SUB_TYPE bằng chữ (data-api là TS; probe không nạp tsx).
const ts = readFileSync(path.join(ROOT, "data-api/src/contract/property.ts"), "utf8");
const khoi = ts.slice(ts.indexOf("export const PROPERTY_SUB_TYPE"), ts.indexOf("};", ts.indexOf("export const PROPERTY_SUB_TYPE")));
const banTs = {};
for (const m of khoi.matchAll(/^\s*(?:"([^"]*)"|([a-z_]+)):\s*(null|"([^"]*)")/gm)) banTs[m[1] ?? m[2]] = m[3] === "null" ? null : m[4];

const loi = [];
const a = JSON.stringify(Object.entries(banYaml).sort()), b = JSON.stringify(Object.entries(banTs).sort());
if (a !== b) loi.push(`PB6 bảng đổi loại căn lệch giữa mappings.yaml và contract/property.ts: ${a} ≠ ${b}`);

function kiem(giaTri) {
  const ra = [];
  for (const v of giaTri) if (!Object.prototype.hasOwnProperty.call(banTs, v)) ra.push(`PB6 loại căn chưa có dòng đổi: ${v}`);
  return ra;
}

const c = new Client({ connectionString: process.env.DATABASE_URL });
await c.connect();
const { rows } = await c.query(
  `SELECT coalesce(value, '') AS v, count(*)::int AS n FROM field_assertions
    WHERE resource_name = 'Unit' AND field = 'property_type' AND retracted_at IS NULL GROUP BY 1 ORDER BY 2 DESC`,
);
await c.end();
for (const r of rows) console.log(`${r.v || "(trống)"} × ${r.n} → ${banTs[r.v] === undefined ? "CHƯA CÓ DÒNG ĐỔI" : banTs[r.v] ?? "null"}`);
loi.push(...kiem(rows.map((r) => r.v)));

// Ô tự đỏ cùng lượt: cấy một giá trị lạ vào danh sách → phải ra đúng thông điệp ghim.
const doCay = kiem([...rows.map((r) => r.v), "gia-tri-la-pb6"]);
if (!doCay.includes("PB6 loại căn chưa có dòng đổi: gia-tri-la-pb6")) loi.push("PB6 ô tự đỏ không đỏ: giá trị lạ lọt qua");
else console.log("ô tự đỏ: cấy gia-tri-la-pb6 → đỏ đúng thông điệp");

if (loi.length) {
  for (const l of loi) console.error(l);
  process.exit(1);
}
console.log(`PB6 loại căn: ${rows.length} giá trị khác nhau, đều có dòng đổi; hai bản bảng đổi khớp`);
