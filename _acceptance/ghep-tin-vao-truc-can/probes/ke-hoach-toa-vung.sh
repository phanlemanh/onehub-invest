#!/usr/bin/env bash
# ke-hoach-toa-vung.sh — căn cứ đổi cách bắt chiều đỏ E7 (GS phán 27/11): EXPLAIN câu đếm trên thân offer_building của 131
# (dạng SELECT, không tạo view, phiên chỉ đọc) — bản thật phải có bước «CTE toa_vung», bản bỏ MATERIALIZED ở toa_vung thì mất.
# Chạy: bash ke-hoach-toa-vung.sh [tên DB, mặc định oneinvest] — qua docker exec vào one-invest-db. Thêm --thoi-gian để đo giây.
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
DB="${1:-oneinvest}"; DO_GIAY="${2:-}"
node -e '
const fs = require("fs"); const s = fs.readFileSync(process.argv[1], "utf8");
const dau = "CREATE OR REPLACE VIEW offer_building AS"; const a = s.indexOf(dau) + dau.length, b = s.indexOf("FROM xet;", a) + "FROM xet".length;
const than = s.slice(a, b), dot = than.replace("toa_vung AS MATERIALIZED", "toa_vung AS NOT MATERIALIZED");
if (dot === than) { console.error("không tìm thấy toa_vung AS MATERIALIZED"); process.exit(3); }
const ra = ["SET default_transaction_read_only = on;", "SET statement_timeout = 120000;"];
for (const [k, q] of [["that", than], ["dot_bien", dot]]) {
  ra.push(`\\echo == ${k}`, `EXPLAIN (COSTS OFF) SELECT count(*) FROM (${q}) x;`);
  if (process.argv[2] === "--thoi-gian") ra.push("\\timing on", `SELECT count(*) FROM (${q}) x;`, "\\timing off");
}
process.stdout.write(ra.join("\n") + "\n");' "$ROOT/db/migrations/131_ghep_truc_can_tren_tin.sql" "$DO_GIAY" \
| docker exec -i -e PGPASSWORD=oneinvest one-invest-db psql -U oneinvest -h localhost -d "$DB" -X -q \
| node -e '
let t = ""; process.stdin.on("data", (d) => (t += d)).on("end", () => {
  const phan = {}; let k = null;
  for (const d of t.split("\n")) { const m = /^== (\w+)/.exec(d); if (m) { k = m[1]; phan[k] = []; } else if (k) phan[k].push(d); }
  for (const [k, ds] of Object.entries(phan)) {
    const co = ds.some((d) => /^\s*CTE toa_vung\s*$/.test(d)); const gio = ds.find((d) => /^Time:/.test(d));
    console.log(`${k}: ${co ? "có" : "KHÔNG có"} bước «CTE toa_vung»${gio ? " · " + gio.trim() : ""}`);
  }
  process.exit(phan.that?.some((d) => /^\s*CTE toa_vung\s*$/.test(d)) && !phan.dot_bien?.some((d) => /^\s*CTE toa_vung\s*$/.test(d)) ? 0 : 1);
});'
