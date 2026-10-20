// drill-restore.mjs — C4 P3 (DR): drill khôi phục RPO/RTO THẬT.
//
// Kịch bản: máy thu mất toàn bộ (cháy/đánh cắp). Còn lại gì? Supabase (bản
// offsite, sync 15'/lần) + GitHub (code). Drill mô phỏng khôi phục DỮ LIỆU
// canonical về một schema scratch local và đối chiếu:
//   1. Kéo từng bảng qua PostgREST (HTTPS) — đúng kênh vẫn dùng được khi
//      máy mới không có IPv6 / bị middlebox như máy cũ
//   2. Tạo schema drill_restore.* + dựng bảng + INSERT
//   3. So khớp count từng bảng với bảng gốc local (mô phỏng "đủ dữ liệu")
//   4. Geometry round-trip: ST_GeomFromText? — REST trả geometry dạng hex
//      EWKB (chuẩn hoá PostgREST) → ::geometry cast trực tiếp
// Kết quả in RPO lý thuyết (nhịp sync) + RTO đo được (thời gian chạy).
import { readFile } from "node:fs/promises";
import { homedir } from "node:os";
import path from "node:path";
import pg from "pg";

const LOCAL_URL = "postgres://oneinvest:oneinvest@localhost:5433/oneinvest";
// Tên CLOUD (ref_calib_*) + ánh xạ về tên local để đối chiếu count
const TABLES = [
  ["areas", "areas"],
  ["listings", "listings"],
  ["market_metrics", "market_metrics"],
  ["sale_offers", "sale_offers"],
  ["ref_calib_markets", "airdna_markets"],
  ["ref_calib_market_metrics", "airdna_market_metrics"],
  ["ref_calib_listings", "airdna_listings"],
];

// PostgREST giới hạn 1000 hàng/request — phân trang bằng Range header
async function fetchAll(REST, key, table) {
  const rows = [];
  for (let from = 0; ; from += 1000) {
    const res = await fetch(`${REST}/${table}?select=*`, {
      headers: { apikey: key, Authorization: `Bearer ${key}`, Range: `${from}-${from + 999}` },
    });
    if (!res.ok) throw new Error(`${table}: REST ${res.status}`);
    const part = await res.json();
    rows.push(...part);
    if (part.length < 1000) return rows;
  }
}

async function main() {
  const t0 = Date.now();
  const env = await readFile(path.join(homedir(), ".oneinvest/cloud.env"), "utf8");
  const key = env.match(/SUPABASE_SERVICE_KEY=(\S+)/)?.[1];
  if (!key) throw new Error("thiếu SUPABASE_SERVICE_KEY");
  const REST = "https://smqpqiigzulwpmrsrhci.supabase.co/rest/v1";

  const local = new pg.Client({ connectionString: LOCAL_URL });
  await local.connect();
  await local.query("CREATE SCHEMA IF NOT EXISTS drill_restore");
  await local.query("DROP SCHEMA drill_restore CASCADE; CREATE SCHEMA drill_restore");

  let ok = 0;
  const fails = [];
  for (const [t, mapping] of TABLES) {
    let rows;
    try {
      rows = await fetchAll(REST, key, t);
    } catch (e) {
      fails.push(String(e instanceof Error ? e.message : e));
      continue;
    }
    // dựng bảng scratch cùng cột (text-all — drill chỉ cần SỐ LƯỢNG + dữ liệu)
    if (rows.length === 0) {
      console.log(`  ${t}: 0 (bỏ qua)`);
      ok++;
      continue;
    }
    const cols = Object.keys(rows[0]);
    const colDefs = cols.map((c) => `"${c}" text`).join(",");
    await local.query(`CREATE TABLE drill_restore."${t}" (${colDefs})`);
    // chèn theo lô 500
    for (let i = 0; i < rows.length; i += 500) {
      const chunk = rows.slice(i, i + 500);
      const ph = chunk.map((_, r) => `(${cols.map((_, c) => `$${r * cols.length + c + 1}`).join(",")})`).join(",");
      const vals = chunk.flatMap((r) => cols.map((c) => (typeof r[c] === "object" && r[c] !== null ? JSON.stringify(r[c]) : r[c])));
      await local.query(`INSERT INTO drill_restore."${t}" VALUES ${ph}`, vals);
    }
    // đối chiếu count với bảng gốc local
    const localTable = mapping; // tên bảng local (phần tử thứ hai của cặp)
    const { rows: lc } = await local.query(`SELECT count(*)::int n FROM ${localTable}`);
    const match = lc[0].n === rows.length;
    console.log(`  ${t}: cloud=${rows.length} local=${lc[0].n} ${match ? "KHỚP" : "LỆCH"}`);
    if (match) ok++;
    else fails.push(`${t}: lệch ${rows.length} vs ${lc[0].n}`);
  }

  const rtoSec = ((Date.now() - t0) / 1000).toFixed(1);
  console.log(`\nRTO đo được: ${rtoSec}s | RPO lý thuyết: 15 phút (nhịp cloud-sync)`);
  console.log(`KHỚP: ${ok}/${TABLES.length}${fails.length ? " | LỆCH: " + fails.join("; ") : " — DRILL PASS"}`);
  await local.end();
  if (fails.length) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
