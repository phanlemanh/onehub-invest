#!/usr/bin/env bash
# Dựng DB thử cho E10 (ui-check) của hồ sơ lat-khai-o-can-gan: chép DB máy thu bằng db/db-thu.sh rồi cấy lát giả
# `hai-khu-ghep-b` (một phần, 3 bài) để người chấm bấm Lưu thật. KHÔNG ghi DB `oneinvest`: tên DB phải là oneinvest_lkocg_e10*.
#   bash _acceptance/lat-khai-o-can-gan/probes/dung-db-e10.sh [tên]      (mặc định oneinvest_lkocg_e10)
#   bash db/db-thu.sh <tên> --xoa                                         dọn sau lượt chấm
set -euo pipefail
goc="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
ten="${1:-oneinvest_lkocg_e10}"
case "$ten" in oneinvest_lkocg_e10*) ;; *) echo "dung-db-e10: tên phải bắt đầu oneinvest_lkocg_e10" >&2; exit 2 ;; esac
bash "$goc/db/db-thu.sh" "$ten"
cd "$goc/app"
DB_E10="postgres://oneinvest:oneinvest@localhost:5433/$ten" node --input-type=module -e '
import pg from "pg"
const c = new pg.Client({ connectionString: process.env.DB_E10 })
await c.connect()
const LAT = "hai-khu-ghep-b"
await c.query("BEGIN")
await c.query("DELETE FROM eval_label_items WHERE lat = $1", [LAT])
await c.query(`INSERT INTO airbnb_snapshots (snapshot_id, city, source, manifest) VALUES ($1, $2, $3, $4::jsonb) ON CONFLICT DO NOTHING`,
  ["lkocg__e10", "vn", "lkocg-e10", "{}"])
const bai = [
  ["p1", "Bán căn 2PN toà S5.03 phân khu Rainbow, 64m2, giá 4,35 tỷ, sổ hồng, liên hệ chính chủ."],
  ["p1", "Cần bán gấp căn góc 3PN Sapphire 2, view hồ, nội thất cơ bản, thương lượng."],
  ["p1", "Chuyển nhượng căn studio, toà không rõ, khu Origami, giá tốt cho khách thiện chí."],
]
for (const [k, [phan, chu]] of bai.entries()) {
  const id = `lkocg-e10-${k + 1}`
  await c.query(
    `INSERT INTO stg_zalo_posts (post_id, snapshot_id, group_name, text, posted_at) VALUES ($1, $2, $3, $4, now())
     ON CONFLICT DO NOTHING`, [id, "lkocg__e10", "Nhóm thử E10", chu])
  await c.query(
    `INSERT INTO eval_label_items (lat, source_code, ref_id, text_hash, split, double_label, seed, stratum)
     VALUES ($1, $2, $3, $4, $5, false, $6, $7)`, [LAT, "S03", id, `lkocg-e10-${k + 1}`, "test", "e10", phan])
}
await c.query("COMMIT")
const { rows } = await c.query("SELECT count(*)::int AS n FROM eval_label_items WHERE lat = $1", [LAT])
console.log(`dung-db-e10: ${process.env.DB_E10.split("/").pop()} có ${rows[0].n} bài lát ${LAT}`)
await c.end()
'
