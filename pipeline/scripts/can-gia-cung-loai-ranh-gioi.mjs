// can-gia-cung-loai-ranh-gioi.mjs — hồ sơ can-gia-tot-cung-loai (CG8), AC-9: diff của hàng so với base không có migration, không đổi
// pipeline/sync-cloud.mjs, không thêm trường liên lạc vào /v1/deals, không dòng thêm nào chứa tên nguồn thật (đọc source_registry
// local, không in tên). Đếm cả thay đổi chưa commit trong cây làm việc.
//   node scripts/can-gia-cung-loai-ranh-gioi.mjs --base origin/main [--root <kho>]
//   node scripts/can-gia-cung-loai-ranh-gioi.mjs --doi-chung   cây tạm có tệp giả dưới db/migrations → migration_doi=1, thoát 1
import { execFileSync } from "node:child_process";
import { mkdtempSync, mkdirSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import pg from "pg";

const git = (root, ...a) => execFileSync("git", ["-C", root, ...a], { encoding: "utf8", maxBuffer: 64 << 20 });
const ROUTE = "data-api/src/routes/deals.ts";
const LIEN_LAC = /contact|sender|seller|phone|sdt|groupName|mediaPath/i;
// Tệp hồ sơ và tệp máy sinh: trích mã hồ sơ cũ đã có trên main (có hồ sơ mang tên nguồn trong slug — việc dọn riêng sau 05/11),
// không phải chữ mới của hàng. Đếm riêng, in ra, không làm đỏ; mã và tài liệu của hàng vẫn phải 0.
const HO_SO = /^(_acceptance\/|LO-TRINH\.html$|PRODUCT-MAP\.md$)/;

/** Đếm thuần trên danh sách tệp đổi + dòng thêm theo tệp. */
export function dem({ tep, themTheoTep, tenNguon }) {
  // Tên đứng riêng: không tính khi dính chữ, số hay «_» hai bên (tên bảng như stg_<nguồn>_posts là định danh có sẵn, không lộ).
  const mau = tenNguon.map((t) => new RegExp(`(?<![a-z0-9_])${t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?![a-z0-9_])`));
  const coTen = (dong) => dong.filter((l) => mau.some((m) => m.test(l.toLowerCase()))).length;
  const theoNhom = (hoSo) => Object.entries(themTheoTep).filter(([f]) => HO_SO.test(f) === hoSo).flatMap(([, d]) => d);
  return {
    migration_doi: tep.filter((f) => f.startsWith("db/migrations/")).length,
    sync_cloud_doi: tep.filter((f) => f === "pipeline/sync-cloud.mjs").length,
    contact_doi: (themTheoTep[ROUTE] ?? []).filter((l) => LIEN_LAC.test(l)).length,
    ten_nguon: coTen(theoNhom(false)),
    ten_nguon_ho_so: coTen(theoNhom(true)),
  };
}

function docDiff(root, base) {
  const tep = [...new Set([
    ...git(root, "diff", "--name-only", base).split("\n"),
    ...git(root, "ls-files", "--others", "--exclude-standard").split("\n"),
  ].filter(Boolean))];
  const themTheoTep = {};
  let hien = null;
  for (const l of git(root, "diff", "-U0", base).split("\n")) {
    if (l.startsWith("+++ ")) hien = l.slice(6);
    else if (l.startsWith("+") && hien) (themTheoTep[hien] ??= []).push(l.slice(1));
  }
  return { tep, themTheoTep };
}

async function tenNguonLocal() {
  const c = new pg.Client({ connectionString: process.env.DATABASE_URL ?? "postgres://oneinvest:oneinvest@localhost:5433/oneinvest" });
  await c.connect();
  try {
    await c.query("SET default_transaction_read_only = on");
    const { rows } = await c.query("SELECT real_name FROM source_registry WHERE real_name IS NOT NULL");
    // Chỉ tên đủ dài để không khớp nhầm chữ thường (≥ 4 ký tự); không in ra.
    return rows.map((r) => String(r.real_name).toLowerCase().trim()).filter((t) => t.length >= 4);
  } finally {
    await c.end();
  }
}

function inVaThoat(kq) {
  for (const [k, v] of Object.entries(kq)) console.log(`${k}=${v}`);
  const hong = Object.entries(kq).filter(([k, v]) => k !== "ten_nguon_ho_so" && v !== 0).map(([k]) => k);
  if (kq.ten_nguon_ho_so) console.log(`(ten_nguon_ho_so: dòng hồ sơ/tệp máy sinh trích mã hồ sơ cũ — thông tin, không chặn)`);
  console.log(hong.length ? `KẾT: vượt ranh giới (${hong.join(", ")})` : "KẾT: trong ranh giới");
  return hong.length ? 1 : 0;
}

async function main() {
  const a = process.argv.slice(2);
  const tenNguon = await tenNguonLocal();
  if (a.includes("--doi-chung")) {
    const tam = mkdtempSync(join(tmpdir(), "cg8-ranh-gioi-"));
    try {
      git(tam, "init", "-q");
      writeFileSync(join(tam, "README"), "x\n");
      git(tam, "add", "."); git(tam, "-c", "user.name=t", "-c", "user.email=t@t", "commit", "-qm", "base");
      mkdirSync(join(tam, "db/migrations"), { recursive: true });
      writeFileSync(join(tam, "db/migrations/999_gia.sql"), "SELECT 1;\n");
      git(tam, "add", "."); git(tam, "-c", "user.name=t", "-c", "user.email=t@t", "commit", "-qm", "gia");
      console.log("đối chứng: cây tạm có db/migrations/999_gia.sql");
      process.exitCode = inVaThoat(dem({ ...docDiff(tam, "HEAD~1"), tenNguon }));
    } finally {
      rmSync(tam, { recursive: true, force: true });
    }
    return;
  }
  const base = a[a.indexOf("--base") + 1];
  if (!a.includes("--base") || !base) throw new Error("thiếu --base <ref>");
  const root = a.includes("--root") ? a[a.indexOf("--root") + 1] : git(process.cwd(), "rev-parse", "--show-toplevel").trim();
  const mb = git(root, "merge-base", base, "HEAD").trim();
  process.exitCode = inVaThoat(dem({ ...docDiff(root, mb), tenNguon }));
}

const isMain = process.argv[1] && realpathSync(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) await main();
