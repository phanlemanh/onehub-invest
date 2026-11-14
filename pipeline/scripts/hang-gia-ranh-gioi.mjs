// hang-gia-ranh-gioi.mjs — hồ sơ bang-hang-gia-m2 (CG9), AC-8: diff của hàng so với base không đổi pipeline/refresh-bait-gap.mjs
// (bait_gap_pct giữ nghĩa gốc), và không dòng thêm nào ngoài tệp hồ sơ chứa tên nguồn thật (đọc source_registry local, chỉ đọc,
// không in tên). Đếm cả tệp chưa theo dõi trong cây làm việc. Danh sách tên rỗng → thoát 1 (không soát được thì không cho qua).
//   node pipeline/scripts/hang-gia-ranh-gioi.mjs --base origin/main
//   node pipeline/scripts/hang-gia-ranh-gioi.mjs --doi-chung   hai cây tạm: sửa refresh-bait-gap → bait_gap_doi=1; thêm dòng mang
//                                                               tên giả → ten_nguon=1; cả hai phải thoát 1
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import pg from "pg";

const git = (root, ...a) => execFileSync("git", ["-C", root, ...a], { encoding: "utf8", maxBuffer: 64 << 20 });
const BAIT_GAP = "pipeline/refresh-bait-gap.mjs";
// Tệp hồ sơ và tệp máy sinh trích mã hồ sơ cũ (có slug mang tên nguồn — việc dọn riêng sau 05/11): đếm riêng, không chặn.
const HO_SO = /^(_acceptance\/|LO-TRINH\.html$|PRODUCT-MAP\.md$)/;

/** Đếm thuần trên danh sách tệp đổi + dòng thêm theo tệp. */
export function dem({ tep, themTheoTep, tenNguon }) {
  // Tên đứng riêng: không tính khi dính chữ, số, «_», «-», «/», «.» hai bên — tên tệp, tên job, tên bảng có sẵn trong kho
  // (vd tên job đêm theo nguồn) là định danh cũ, không phải chữ mới lộ ra.
  const mau = tenNguon.map((t) => new RegExp(`(?<![a-z0-9_./-])${t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?![a-z0-9_./-])`));
  const coTen = (dong) => dong.filter((l) => mau.some((m) => m.test(l.toLowerCase()))).length;
  const theoNhom = (hoSo) => Object.entries(themTheoTep).filter(([f]) => HO_SO.test(f) === hoSo).flatMap(([, d]) => d);
  return {
    bait_gap_doi: tep.filter((f) => f === BAIT_GAP).length,
    ten_nguon: coTen(theoNhom(false)),
    ten_nguon_ho_so: coTen(theoNhom(true)),
  };
}

function docDiff(root, base) {
  const moi = git(root, "ls-files", "--others", "--exclude-standard").split("\n").filter(Boolean);
  const tep = [...new Set([...git(root, "diff", "--name-only", base).split("\n"), ...moi].filter(Boolean))];
  const themTheoTep = {};
  let hien = null;
  for (const l of git(root, "diff", "-U0", base).split("\n")) {
    if (l.startsWith("+++ ")) hien = l.slice(6);
    else if (l.startsWith("+") && hien) (themTheoTep[hien] ??= []).push(l.slice(1));
  }
  // Tệp chưa theo dõi: mọi dòng là dòng thêm (CG8 Ngoài-2 — công cụ cũ bỏ sót nội dung tệp mới).
  for (const f of moi) themTheoTep[f] = readFileSync(join(root, f), "utf8").split("\n");
  return { tep, themTheoTep };
}

async function tenNguonLocal() {
  const c = new pg.Client({ connectionString: process.env.DATABASE_URL ?? "postgres://oneinvest:oneinvest@localhost:5433/oneinvest" });
  await c.connect();
  try {
    await c.query("SET default_transaction_read_only = on");
    const { rows } = await c.query("SELECT real_name FROM source_registry WHERE real_name IS NOT NULL");
    return rows.map((r) => String(r.real_name).toLowerCase().trim()).filter((t) => t.length >= 4);
  } finally {
    await c.end();
  }
}

function ketQua(kq) {
  for (const [k, v] of Object.entries(kq)) console.log(`${k}=${v}`);
  const hong = Object.entries(kq).filter(([k, v]) => k !== "ten_nguon_ho_so" && v !== 0).map(([k]) => k);
  console.log(hong.length ? `KẾT: vượt ranh giới (${hong.join(", ")})` : "KẾT: trong ranh giới");
  return hong.length ? 1 : 0;
}

function cayTam(fn) {
  const tam = mkdtempSync(join(tmpdir(), "cg9-ranh-gioi-"));
  try {
    git(tam, "init", "-q");
    mkdirSync(join(tam, "pipeline"), { recursive: true });
    writeFileSync(join(tam, BAIT_GAP), "// goc\n");
    git(tam, "add", ".");
    git(tam, "-c", "user.name=t", "-c", "user.email=t@t", "commit", "-qm", "base");
    fn(tam);
    return docDiff(tam, "HEAD");
  } finally {
    rmSync(tam, { recursive: true, force: true });
  }
}

async function main() {
  const a = process.argv.slice(2);
  const tenNguon = await tenNguonLocal();
  if (tenNguon.length === 0) {
    console.log("KẾT: không đọc được tên nguồn nào từ source_registry — không soát được, không cho qua");
    return 1;
  }
  if (a.includes("--doi-chung")) {
    const d1 = dem({ ...cayTam((t) => writeFileSync(join(t, BAIT_GAP), "// sua\n")), tenNguon });
    const d2 = dem({ ...cayTam((t) => writeFileSync(join(t, "moi.mjs"), `const x = "${tenNguon[0]}";\n`)), tenNguon });
    const ok = d1.bait_gap_doi === 1 && d2.ten_nguon === 1;
    console.log(`doi-chung: bait_gap_doi=${d1.bait_gap_doi} ten_nguon=${d2.ten_nguon} → ${ok ? "đỏ đúng" : "KHÔNG đỏ"}`);
    return ok ? 1 : 2;
  }
  const i = a.indexOf("--base");
  const root = git(process.cwd(), "rev-parse", "--show-toplevel").trim();
  // So với điểm tách nhánh: nhánh chính đi tiếp sau khi tách không phải diff của hàng.
  const base = git(root, "merge-base", "HEAD", i >= 0 ? a[i + 1] : "origin/main").trim();
  return ketQua(dem({ ...docDiff(root, base), tenNguon }));
}

if (process.argv[1] && realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().then((m) => process.exit(m), (e) => { console.error(e); process.exit(2); });
}
