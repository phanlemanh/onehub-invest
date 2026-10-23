// cloud-sync-watch.mjs — đo prod CHỈ ĐỌC trong lúc một lượt sync chạy (cloud-sync-atomic).
// Lặp truy vấn `read_only: true` qua Management API, ghi min/max số dòng từng bảng prod đọc.
//
//   node scripts/cloud-sync-watch.mjs --seconds 300 --every 2
//   node scripts/cloud-sync-watch.mjs --selftest   (hai chiều của chính máy đo, không gọi mạng)
//
// Exit 1 khi có bảng từng về 0, hoặc saved_markets đổi số dòng (dữ liệu người dùng).
// Env: ~/.oneinvest/cloud.env (SUPABASE_MGMT_TOKEN). Không ghi gì lên cloud.
import { readFile } from "node:fs/promises";
import { homedir } from "node:os";
import path from "node:path";

const MGMT = "https://api.supabase.com/v1/projects/smqpqiigzulwpmrsrhci/database/query";
const TABLES = [
  "sale_offers", "properties", "sellers", "areas", "listings", "nights", "market_metrics",
  "ref_calib_listings", "v_ruler_p2", "v_ruler_p2_area", "saved_markets",
];

const arg = (name, dflt) => {
  const i = process.argv.indexOf(`--${name}`);
  return i > 0 ? Number(process.argv[i + 1]) : dflt;
};
const seconds = arg("seconds", 300);
const every = arg("every", 2);

function newStats() {
  return Object.fromEntries(TABLES.map((t) => [t, { min: Infinity, max: -Infinity, first: null, last: null }]));
}
function record(stats, rows) {
  for (const { t, n } of rows) {
    const x = stats[t];
    x.min = Math.min(x.min, n);
    x.max = Math.max(x.max, n);
    x.first ??= n;
    x.last = n;
  }
}
/** Phán: bảng nào từng 0 (trừ saved_markets) hoặc saved_markets đổi số dòng → vi phạm. */
export function verdict(stats, reads) {
  const out = [];
  for (const [t, x] of Object.entries(stats)) if (t !== "saved_markets" && x.min === 0) out.push(`MIN0 ${t}`);
  const sm = stats.saved_markets;
  if (sm.min !== sm.max) out.push(`SAVED_MARKETS_DOI ${sm.first} → ${sm.last} (min ${sm.min}, max ${sm.max})`);
  if (!reads) out.push("KHONG_DOC_DUOC");
  return out;
}

if (process.argv.includes("--selftest")) {
  const full = TABLES.map((t) => ({ t, n: t === "saved_markets" ? 3 : 100 }));
  const ok = newStats();
  record(ok, full);
  record(ok, full);
  const red = newStats();
  record(red, full);
  record(red, full.map((r) => (r.t === "sale_offers" ? { ...r, n: 0 } : r.t === "saved_markets" ? { ...r, n: 0 } : r)));
  const a = verdict(ok, 2);
  const b = verdict(red, 2);
  const pass = a.length === 0 && b.includes("MIN0 sale_offers") && b.some((x) => x.startsWith("SAVED_MARKETS_DOI 3 → 0"));
  console.log(`selftest: lành → ${JSON.stringify(a)} · phá (sale_offers=0, saved_markets 3→0) → ${JSON.stringify(b)}`);
  console.log(pass ? "selftest: OK" : "selftest: SAI");
  process.exit(pass ? 0 : 1);
}

const env = await readFile(path.join(homedir(), ".oneinvest/cloud.env"), "utf8");
const token = process.env.SUPABASE_MGMT_TOKEN ?? env.match(/SUPABASE_MGMT_TOKEN=(\S+)/)?.[1];
if (!token) throw new Error("thiếu SUPABASE_MGMT_TOKEN trong ~/.oneinvest/cloud.env");

const sql = TABLES.map((t) => `SELECT '${t}' AS t, count(*)::int AS n FROM public.${t}`).join(" UNION ALL ");
const stats = newStats();
let reads = 0;
let errors = 0;
const end = Date.now() + seconds * 1000;
console.log(`watch ${new Date().toISOString()}: ${seconds}s, mỗi ${every}s, chỉ đọc`);
while (Date.now() < end) {
  const t0 = Date.now();
  try {
    const res = await fetch(MGMT, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "content-type": "application/json" },
      body: JSON.stringify({ query: sql, read_only: true }),
    });
    if (!res.ok) throw new Error(`${res.status} ${(await res.text()).slice(0, 120)}`);
    const rows = await res.json();
    reads++;
    record(stats, rows);
    console.log(`  ${new Date().toISOString().slice(11, 19)} ${rows.map(({ t, n }) => `${t}=${n}`).join(" ")}`);
  } catch (e) {
    errors++;
    console.log(`  ${new Date().toISOString().slice(11, 19)} lỗi đọc: ${e.message}`);
  }
  await new Promise((r) => setTimeout(r, Math.max(0, every * 1000 - (Date.now() - t0))));
}

console.log(`\n${reads} lần đọc, ${errors} lỗi`);
for (const [t, x] of Object.entries(stats)) console.log(`  ${t}: min ${x.min} · max ${x.max} · đầu ${x.first} · cuối ${x.last}`);
const bad = verdict(stats, reads);
for (const v of bad) console.log(v);
console.log(bad.length ? "watch: CÓ LÚC PROD ĐỌC THẤY RỖNG/ĐỔI DỮ LIỆU NGƯỜI DÙNG" : "watch: OK — không lúc nào 0, saved_markets không đổi");
process.exit(bad.length ? 1 : 0);
