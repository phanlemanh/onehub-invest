#!/usr/bin/env bash
# can-gia-cung-loai-db.sh — hồ sơ can-gia-tot-cung-loai (CG8): thước đo chạy trên DB thử oneinvest_u1_cg8 (db/db-thu.sh), không chạm
# DB `oneinvest` dùng chung.
#   itest    ca AC-1, AC-2 (pipeline) + AC-3, AC-5, AC-6 (app, data-api) — BEGIN…ROLLBACK, lược đồ riêng; DB thử dựng nếu chưa có
#   do       AC-7: dựng LẠI DB thử từ DB máy thu, refreshBaitGap trong giao dịch + đếm + gọi hai API (ROLLBACK)
#   ghi-thu  chạy refreshBaitGap mới CÓ COMMIT trên DB thử (cho E8 chụp /ops/deals trỏ DB thử)
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
TEN=oneinvest_u1_cg8
export DATABASE_URL="postgres://oneinvest:oneinvest@localhost:5433/$TEN"
che_do="${1:?dùng: can-gia-cung-loai-db.sh <itest|do|ghi-thu>}"
case "$che_do" in
  itest)
    bash "$ROOT/db/db-thu.sh" "$TEN" --neu-chua-co
    (cd "$ROOT/pipeline" && node --test --test-concurrency=1 scripts/can-gia-cung-loai.itest.mjs)
    (cd "$ROOT/app" && node --experimental-test-module-mocks --import tsx --test --test-concurrency=1 tests/can-gia-cung-loai-db.test.tsx)
    ;;
  do)
    bash "$ROOT/db/db-thu.sh" "$TEN"
    (cd "$ROOT/app" && node --import tsx "$ROOT/pipeline/scripts/do-can-gia-cung-loai.mjs")
    ;;
  ghi-thu)
    bash "$ROOT/db/db-thu.sh" "$TEN" --neu-chua-co
    (cd "$ROOT/pipeline" && node --input-type=module -e '
      import pg from "pg"; import { refreshBaitGap } from "./refresh-bait-gap.mjs";
      const c = new pg.Client({ connectionString: process.env.DATABASE_URL }); await c.connect();
      try { await c.query("BEGIN"); await refreshBaitGap(c); await c.query("COMMIT"); } finally { await c.end(); }')
    ;;
  *) echo "can-gia-cung-loai-db.sh: chế độ lạ «$che_do» (itest|do|ghi-thu)"; exit 2 ;;
esac
