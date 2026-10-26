#!/usr/bin/env node
// check-cloud-catchup.mjs — kiểm tĩnh tệp SQL bắt kịp cloud của một hồ sơ (PL14 nap-lai-khong-xoa AC-10).
// Không kết nối cloud, không kết nối DB. Mỗi tệp phải có mốc «-- ĐO TRƯỚC» rồi «-- ÁP»; khối ĐO TRƯỚC chỉ đọc (ngoài
// chú thích không câu ALTER/CREATE/DROP/INSERT/UPDATE/DELETE/TRUNCATE/GRANT/REVOKE). Tệp ghi lại một bản ĐÃ ÁP thì khối
// ÁP phải bằng từng byte bản đó (đối chiếu sha256). Cuối lượt tự chạy đối chứng: chèn một ALTER vào khối ĐO TRƯỚC của
// bản sao → bộ kiểm phải đỏ, nêu tệp và dòng; không đỏ thì chính bộ kiểm hỏng (exit 1).
//
//   node scripts/check-cloud-catchup.mjs <slug>     exit 0 sạch · 1 vi phạm · 2 dùng sai
import { createHash } from "node:crypto";
import { existsSync, readFileSync, realpathSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

/** Hồ sơ → tệp catch-up; `ap_sha256` khi khối ÁP là nguyên văn một bản đã áp. */
export const HO_SO = {
  "nap-lai-khong-xoa": [
    {
      path: "docs/ops/cloud-schema-catchup-2026-10-26-043.sql",
      // tệp giám sát đợt dot0-cam-mau đã áp 26/10 (.acceptance-runs/dieu-phoi-dot0-cam-mau/cloud-catchup-2026-10-26-043.sql)
      ap_sha256: "5391e044868548ba75ebf47b69514c10879c14e91ffde20aa52ba75dfc55c0c2",
    },
    { path: "docs/ops/cloud-schema-catchup-2026-10-26-044.sql" },
  ],
};

const GHI = /\b(ALTER|CREATE|DROP|INSERT|UPDATE|DELETE|TRUNCATE|GRANT|REVOKE)\b/i;
const MOC_DO = "-- ĐO TRƯỚC";
const MOC_AP = "-- ÁP";

/** Vi phạm của một tệp: ['<tệp>:<dòng> <lý do>']. */
export function kiemTep(path, text, apSha256) {
  const loi = [];
  const dong = text.split("\n");
  const iDo = dong.findIndex((l) => l.startsWith(MOC_DO));
  const iAp = dong.findIndex((l, i) => i > iDo && l.startsWith(MOC_AP));
  if (iDo < 0) loi.push(`${path} thiếu mốc «${MOC_DO}»`);
  if (iAp < 0) loi.push(`${path} thiếu mốc «${MOC_AP}» sau «${MOC_DO}»`);
  if (loi.length) return loi;
  for (let i = iDo + 1; i < iAp; i++) {
    const ma = dong[i].replace(/--.*$/, "");
    const m = ma.match(GHI);
    if (m) loi.push(`${path}:${i + 1} khối ĐO TRƯỚC có câu ghi «${m[1]}»`);
  }
  if (apSha256) {
    const dau = Buffer.byteLength(dong.slice(0, iAp + 1).join("\n") + "\n", "utf8");
    const sha = createHash("sha256").update(Buffer.from(text, "utf8").subarray(dau)).digest("hex");
    if (sha !== apSha256) loi.push(`${path}:${iAp + 2} khối ÁP khác bản đã áp (sha256 ${sha.slice(0, 12)}… ≠ ${apSha256.slice(0, 12)}…)`);
  }
  return loi;
}

function main() {
  const slug = process.argv[2];
  const tep = HO_SO[slug];
  if (!tep) {
    console.error(`dùng: node scripts/check-cloud-catchup.mjs <${Object.keys(HO_SO).join("|")}>`);
    process.exit(2);
  }
  const loi = [];
  for (const t of tep) {
    const p = join(ROOT, t.path);
    if (!existsSync(p)) { loi.push(`${t.path} không có`); continue; }
    loi.push(...kiemTep(t.path, readFileSync(p, "utf8"), t.ap_sha256));
  }
  for (const l of loi) console.log(`VI PHẠM ${l}`);

  // Đối chứng: bản sao của tệp đầu, chèn ALTER ngay sau mốc ĐO TRƯỚC → phải đỏ, nêu đúng tệp và dòng.
  const dau = tep[0];
  const goc = readFileSync(join(ROOT, dau.path), "utf8").split("\n");
  const i = goc.findIndex((l) => l.startsWith(MOC_DO));
  const ban = [...goc.slice(0, i + 1), "ALTER TABLE sale_offers ADD COLUMN thu int;", ...goc.slice(i + 1)].join("\n");
  const doiChung = kiemTep(`${dau.path} (bản sao)`, ban, null);
  const batDuoc = doiChung.some((l) => l.startsWith(`${dau.path} (bản sao):${i + 2} `));
  console.log(`đối chứng (chèn ALTER vào ĐO TRƯỚC): ${batDuoc ? `đỏ đúng — ${doiChung[0]}` : "KHÔNG bắt được — bộ kiểm hỏng"}`);

  console.log(`check-cloud-catchup ${slug}: ${tep.length} tệp · ${loi.length} vi phạm`);
  process.exit(loi.length || !batDuoc ? 1 : 0);
}

if (process.argv[1] && realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)) main();
