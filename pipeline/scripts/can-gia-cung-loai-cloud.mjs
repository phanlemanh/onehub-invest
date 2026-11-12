// can-gia-cung-loai-cloud.mjs — hồ sơ can-gia-tot-cung-loai (CG8), AC-10: thước v_ruler_p2 trên cloud là đúng view của máy thu.
// CHỈ SELECT: cloud qua Management API (token ~/.oneinvest/cloud.env, không in), máy thu qua DATABASE_URL (mặc định :5433).
// In băm md5(pg_get_viewdef) hai phía và số dòng thước theo loại trên cloud; lệch, vắng view, thiếu loại → thoát 1 nêu phía.
//   node scripts/can-gia-cung-loai-cloud.mjs              so thật
//   node scripts/can-gia-cung-loai-cloud.mjs --doi-chung  đối chứng đỏ: so băm cloud với định nghĩa máy thu sửa một ký tự
import { readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

import pg from "pg";

import { mgmtExec } from "../sync-cloud.mjs";

const LOAI = ["apartment", "house", "land", "commercial"];
const BAM = "SELECT md5(pg_get_viewdef('v_ruler_p2'::regclass)) AS bam, pg_get_viewdef('v_ruler_p2'::regclass) AS def";

/** Phán quyết thuần: trả danh sách lỗi (rỗng = khớp). */
export function soSanh({ bamMay, bamCloud, demCloud }) {
  const loi = [];
  if (!bamCloud) loi.push("cloud: không có view v_ruler_p2");
  else if (bamMay !== bamCloud) loi.push(`lệch: băm máy thu ${bamMay} ≠ cloud ${bamCloud}`);
  for (const t of LOAI) if (!(demCloud[t] > 0)) loi.push(`cloud: không có dòng thước cho ${t}`);
  return loi;
}

async function main() {
  const doiChung = process.argv.includes("--doi-chung");
  const c = new pg.Client({ connectionString: process.env.DATABASE_URL ?? "postgres://oneinvest:oneinvest@localhost:5433/oneinvest" });
  await c.connect();
  let may;
  try {
    await c.query("SET default_transaction_read_only = on");
    may = (await c.query(BAM)).rows[0];
  } finally {
    await c.end();
  }
  const env = readFileSync(join(homedir(), ".oneinvest/cloud.env"), "utf8");
  const token = process.env.SUPABASE_MGMT_TOKEN ?? env.match(/SUPABASE_MGMT_TOKEN=(\S+)/)?.[1];
  if (!token) throw new Error("thiếu SUPABASE_MGMT_TOKEN trong ~/.oneinvest/cloud.env");
  const exec = mgmtExec(token);
  const coView = (await exec("SELECT to_regclass('public.v_ruler_p2') IS NOT NULL AS co"))[0]?.co === true;
  const bamCloud = coView ? (await exec("SELECT md5(pg_get_viewdef('v_ruler_p2'::regclass)) AS bam"))[0]?.bam : null;
  const demCloud = coView
    ? Object.fromEntries((await exec("SELECT property_type, count(*)::int AS n FROM v_ruler_p2 GROUP BY 1 ORDER BY 1"))
      .map((r) => [r.property_type, Number(r.n)]))
    : {};
  // Đối chứng: định nghĩa máy thu sửa một ký tự → băm khác → phải ra «lệch».
  const bamMay = doiChung
    ? (await import("node:crypto")).createHash("md5").update(may.def.replace("5000000", "5000001")).digest("hex")
    : may.bam;
  console.log(`bam_may_thu=${bamMay}${doiChung ? " (đối chứng: định nghĩa sửa một ký tự)" : ""}`);
  console.log(`bam_cloud=${bamCloud ?? "—"}`);
  console.log(`dong_thuoc_cloud=${JSON.stringify(demCloud)}`);
  const loi = soSanh({ bamMay, bamCloud, demCloud });
  for (const l of loi) console.log(`LỖI ${l}`);
  console.log(loi.length ? "KẾT: lệch" : "KẾT: khớp");
  process.exitCode = loi.length ? 1 : 0;
}

if (import.meta.url === `file://${process.argv[1]}`) await main();
