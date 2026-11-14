#!/usr/bin/env bash
# tap-nhan-hai-khu-db.sh — hồ sơ _acceptance/tap-nhan-ghep-tin-hai-khu (PL35): dựng DB thử oneinvest_u1_pl35 (chép từ DB máy thu
# bằng db/db-thu.sh) nếu chưa có, rồi chạy phần việc trên DB thử. Không chạm DB oneinvest dùng chung (luật đợt 27/10).
#   bash pipeline/scripts/tap-nhan-hai-khu-db.sh itest     ca DB PL35-AC-1, 2, 3, 5, 6, 7, 8 (fixture ở bảng tạm, mã thật của màn)
#   bash pipeline/scripts/tap-nhan-hai-khu-db.sh do        đo trên bản chép (AC-9): bảng nhóm → khu, số mỗi tầng, không gọi model
#   bash pipeline/scripts/tap-nhan-hai-khu-db.sh dung-lai  dựng lại DB thử từ đầu (dữ liệu máy thu mới)
set -euo pipefail
GOC="$(cd "$(dirname "$0")/../.." && pwd)"
TEN=oneinvest_u1_pl35
VIEC="${1:?thiếu việc: itest | do | dung-lai}"
if [ "$VIEC" = "dung-lai" ]; then bash "$GOC/db/db-thu.sh" "$TEN"; exit; fi
# «do» dựng DB riêng của lượt bên trong lệnh đo (xoá khi xong), không dùng DB thử chung của itest.
if [ "$VIEC" = "do" ]; then cd "$GOC/pipeline" && exec node scripts/tap-nhan-hai-khu-do.mjs; fi
bash "$GOC/db/db-thu.sh" "$TEN" --neu-chua-co
export DATABASE_URL="postgres://oneinvest:oneinvest@localhost:5433/$TEN"
case "$VIEC" in
  # cwd app/: tsx nạp labels-queries.ts, labels-cuon-chieu.ts của màn theo tsconfig của app.
  itest) cd "$GOC/app" && node --import tsx --test --test-concurrency=1 ../pipeline/scripts/tap-nhan-hai-khu.itest.mjs ;;
  *) echo "tap-nhan-hai-khu-db: việc lạ «$VIEC»"; exit 2 ;;
esac
