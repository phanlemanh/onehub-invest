#!/usr/bin/env bash
# can-gia-cung-loai-db.sh — hồ sơ can-gia-tot-cung-loai (CG8): thước đo chạy trên DB thử oneinvest_u1_cg8 (db/db-thu.sh), không chạm
# DB `oneinvest` dùng chung.
#   itest    ca AC-1, AC-2 (pipeline) + AC-3, AC-5, AC-6 (app, data-api) — BEGIN…ROLLBACK, lược đồ riêng; DB thử dựng nếu chưa có
#   do       AC-7: dựng LẠI DB thử RIÊNG (oneinvest_u1_cg8_do) từ DB máy thu, refreshBaitGap trong giao dịch + đếm + gọi hai API
#            (ROLLBACK), xoá DB đó khi xong. Tên riêng vì lượt chấm chạy ba chế độ song song: dựng lại DB chung giữa chừng làm itest
#            mất DB (3D000) và ghi-thu kẹt khoá với bản khôi phục (S4 r1, 12/11).
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
    TEN_DO="${TEN}_do"
    export DATABASE_URL="postgres://oneinvest:oneinvest@localhost:5433/$TEN_DO"
    trap 'bash "$ROOT/db/db-thu.sh" "$TEN_DO" --xoa >/dev/null 2>&1 || echo "can-gia-cung-loai-db: chưa xoá được $TEN_DO"' EXIT
    bash "$ROOT/db/db-thu.sh" "$TEN_DO"
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
