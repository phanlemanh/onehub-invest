#!/usr/bin/env bash
# gia-tot-du-an-db.sh — hồ sơ gia-tot-cap-du-an (CG10): phép đo trên DB thử chép từ DB máy thu (db/db-thu.sh), không chạm DB `oneinvest`.
#   do        AC-9: dựng DB thử riêng oneinvest_n1_cg10_do, áp 104/view 105/106, chấm hai lần, đếm độc lập (gia-tot-du-an-do.mjs) rồi
#             hai đối chứng (nhóm theo phường thay dự án, mỗi tin một phiếu) phải đỏ; xoá DB thử khi xong
#   ghi-thu   E10: DB thử oneinvest_n1_cg10 (giữ lại) áp 104, view 105, 106 + chấm có COMMIT, cho bản chạy /ops/deals trỏ vào để chụp
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
che_do="${1:?dùng: gia-tot-du-an-db.sh <do|ghi-thu>}"
case "$che_do" in
  do)
    TEN=oneinvest_n1_cg10_do
    export DATABASE_URL="postgres://oneinvest:oneinvest@localhost:5433/$TEN"
    trap 'bash "$ROOT/db/db-thu.sh" "$TEN" --xoa >/dev/null 2>&1 || echo "gia-tot-du-an-db: chưa xoá được $TEN"' EXIT
    bash "$ROOT/db/db-thu.sh" "$TEN"
    (cd "$ROOT/pipeline" && node scripts/gia-tot-du-an-do.mjs)
    (cd "$ROOT/pipeline" && node scripts/gia-tot-du-an-do.mjs --doi-chung-khoa)
    (cd "$ROOT/pipeline" && node scripts/gia-tot-du-an-do.mjs --doi-chung-hong)
    ;;
  ghi-thu)
    TEN=oneinvest_n1_cg10
    export DATABASE_URL="postgres://oneinvest:oneinvest@localhost:5433/$TEN"
    bash "$ROOT/db/db-thu.sh" "$TEN" --neu-chua-co
    (cd "$ROOT/pipeline" && node --input-type=module -e '
      import pg from "pg"; import { readFileSync } from "node:fs"; import { xepHangGia } from "./xep-hang-gia.mjs";
      import { sqlView105 } from "./scripts/gia-tot-du-an-fixture.itest.mjs";
      const c = new pg.Client({ connectionString: process.env.DATABASE_URL }); await c.connect();
      try {
        await c.query(readFileSync("../db/migrations/104_offer_price_rank.sql", "utf8"));
        if (!(await c.query("SELECT to_regclass($1) AS t", ["offer_project"])).rows[0].t) await c.query(sqlView105());
        await c.query(readFileSync("../db/migrations/106_project_area_band.sql", "utf8"));
        await xepHangGia(c);
      } finally { await c.end(); }')
    ;;
  *) echo "gia-tot-du-an-db.sh: chế độ lạ «$che_do» (do|ghi-thu)"; exit 2 ;;
esac
