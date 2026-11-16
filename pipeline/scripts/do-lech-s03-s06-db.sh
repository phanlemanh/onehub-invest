#!/usr/bin/env bash
# do-lech-s03-s06-db.sh — hồ sơ do-lech-s03-s06-canh-hang (CG15): phép đo trên DB thử chép từ DB máy thu (db/db-thu.sh), không chạm DB `oneinvest`.
#   do        AC-7: dựng DB thử riêng oneinvest_n1_cg15_do, áp 104/view 105/106/107, chấm hai lần, đếm độc lập (do-lech-s03-s06-do.mjs) rồi
#             hai đối chứng (đếm theo tin, S05 lẫn vào bên S03) phải đỏ; xoá DB thử khi xong
#   ghi-thu   E8: DB thử oneinvest_n1_cg15 (giữ lại) áp 104, view 105, 106, 107 + chấm có COMMIT, cho bản chạy /ops/deals trỏ vào để chụp
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
che_do="${1:?dùng: do-lech-s03-s06-db.sh <do|ghi-thu>}"
case "$che_do" in
  do)
    TEN=oneinvest_n1_cg15_do
    export DATABASE_URL="postgres://oneinvest:oneinvest@localhost:5433/$TEN"
    trap 'bash "$ROOT/db/db-thu.sh" "$TEN" --xoa >/dev/null 2>&1 || echo "do-lech-s03-s06-db: chưa xoá được $TEN"' EXIT
    bash "$ROOT/db/db-thu.sh" "$TEN"
    (cd "$ROOT/pipeline" && node scripts/do-lech-s03-s06-do.mjs)
    (cd "$ROOT/pipeline" && node scripts/do-lech-s03-s06-do.mjs --doi-chung-tin)
    (cd "$ROOT/pipeline" && node scripts/do-lech-s03-s06-do.mjs --doi-chung-nguon)
    ;;
  ghi-thu)
    TEN=oneinvest_n1_cg15
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
        await c.query(readFileSync("../db/migrations/107_project_source_baseline.sql", "utf8"));
        await xepHangGia(c);
      } finally { await c.end(); }')
    ;;
  *) echo "do-lech-s03-s06-db.sh: chế độ lạ «$che_do» (do|ghi-thu)"; exit 2 ;;
esac
