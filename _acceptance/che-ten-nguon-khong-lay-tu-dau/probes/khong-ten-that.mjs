// khong-ten-that.mjs — AC-9 che-ten-nguon-khong-lay-tu-dau: không biến thể BÍ MẬT nào của tên thật S16 nằm trong hồ sơ, test,
// bảng ca hay đầu ra lượt chấm (kho công khai). Đọc tệp cục bộ GS cấp (CTEN_TEP, mặc định thư mục tạm của đợt); thiếu → exit 2.
// Biến thể dò (đã gập): tên đủ, tên viết liền, mỗi định danh đủ và viết liền, dạng chữa tạm (tên viết liền nối với slug).
// KHÔNG dò từ đầu đứng riêng: Mạnh duyệt cho rời máy (Cổng 1, 18/11) và chúng có sẵn trong tên dự án công khai.
// Chỉ in số chỗ trúng theo tệp — không in biến thể.
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { fold } from "../../../pipeline/lib/mask-source-names.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const TEP = process.env.CTEN_TEP ?? "/Users/manhphan/dev/onehub-invest/.acceptance-runs/dieu-phoi-dot0-cam-mau/tam/s16-ten-that.json";
if (!existsSync(TEP)) { console.log("cần tệp tên thật S16 để dò (CTEN_TEP) — không bỏ qua"); process.exit(2); }
const dong = JSON.parse(readFileSync(TEP, "utf8")).find((r) => r.code === "S16");
if (!dong) { console.log("tệp không có dòng S16"); process.exit(2); }
const lien = (t) => fold(t.trim()).split(/[\s.\-_/]+/).filter(Boolean).join("");
const BIEN = new Set();
for (const t of [dong.real_name, ...(dong.source_ids ?? [])].filter(Boolean)) { BIEN.add(fold(t.trim())); BIEN.add(lien(t)); }
for (const id of dong.source_ids ?? []) BIEN.add(lien(dong.real_name) + lien(id));
const bien = [...BIEN].filter((v) => v.length >= 4);

export function demTrung(text) { const f = fold(text); return bien.reduce((n, v) => n + (f.split(v).length - 1), 0); }

const VUNG = [
  "_acceptance/che-ten-nguon-khong-lay-tu-dau", "pipeline/scripts/mask-source-names.cases.json",
  "pipeline/scripts/ops-nhan-ma-nguon.test.mjs", "pipeline/scripts/soat-tang-a.test.mjs",
  "pipeline/scripts/source-name-entries.itest.mjs", "pipeline/scripts/do-hang-ngay.test.mjs", "scripts/ops-nhan-ma-nguon.test.mjs",
  ".acceptance-runs/che-ten-nguon-khong-lay-tu-dau",
];
const tep = [];
const di = (p) => { if (!existsSync(p)) return; const s = statSync(p); if (s.isDirectory()) for (const x of readdirSync(p)) di(path.join(p, x)); else tep.push(p); };
for (const v of VUNG) di(path.join(ROOT, v));
// đối chứng dương ngay trong lượt: chuỗi mang một biến thể phải đếm ≥ 1
if (demTrung(`x ${bien[0]} y`) < 1) { console.log("đối chứng dương hỏng — phép dò không bắt được biến thể"); process.exit(3); }
let tong = 0;
for (const f of tep) { const n = demTrung(readFileSync(f, "utf8")); if (n) { tong += n; console.log(`TRÚNG ${n} · ${path.relative(ROOT, f)}`); } }
console.log(`khong-ten-that: ${tep.length} tệp, ${bien.length} biến thể, ${tong} chỗ trúng — ${tong === 0 ? "ĐẠT" : "KHÔNG ĐẠT"}`);
void execFileSync;
process.exit(tong === 0 ? 0 : 1);
