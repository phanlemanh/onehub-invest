#!/usr/bin/env bash
# hang-gia-db.sh — hồ sơ bang-hang-gia-m2 (CG9): phép đo trên DB thử chép từ DB máy thu (db/db-thu.sh), không chạm DB `oneinvest`.
#   do        AC-9: dựng DB thử riêng oneinvest_u1_cg9_do, áp 104, chấm hai lần, đếm độc lập (hang-gia-do.mjs) rồi đối chứng hỏng
#             (bản 420 «mỗi tin một phiếu» phải đỏ); xoá DB thử khi xong
#   ghi-thu   E10: DB thử oneinvest_u1_cg9 (giữ lại) áp 104 + chấm có COMMIT, cho bản chạy /ops/deals trỏ vào để chụp
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
che_do="${1:?dùng: hang-gia-db.sh <do|ghi-thu>}"
case "$che_do" in
  do)
    TEN=oneinvest_u1_cg9_do
    export DATABASE_URL="postgres://oneinvest:oneinvest@localhost:5433/$TEN"
    trap 'bash "$ROOT/db/db-thu.sh" "$TEN" --xoa >/dev/null 2>&1 || echo "hang-gia-db: chưa xoá được $TEN"' EXIT
    bash "$ROOT/db/db-thu.sh" "$TEN"
    (cd "$ROOT/pipeline" && node scripts/hang-gia-do.mjs)
    (cd "$ROOT/pipeline" && node scripts/hang-gia-do.mjs --doi-chung-hong)
    ;;
  ghi-thu)
    TEN=oneinvest_u1_cg9
    export DATABASE_URL="postgres://oneinvest:oneinvest@localhost:5433/$TEN"
    bash "$ROOT/db/db-thu.sh" "$TEN" --neu-chua-co
    (cd "$ROOT/pipeline" && node --input-type=module -e '
      import pg from "pg"; import { readFileSync } from "node:fs"; import { xepHangGia } from "./xep-hang-gia.mjs";
      const c = new pg.Client({ connectionString: process.env.DATABASE_URL }); await c.connect();
      try { await c.query(readFileSync("../db/migrations/104_offer_price_rank.sql", "utf8")); await xepHangGia(c); } finally { await c.end(); }')
    ;;
  *) echo "hang-gia-db.sh: chế độ lạ «$che_do» (do|ghi-thu)"; exit 2 ;;
esac
