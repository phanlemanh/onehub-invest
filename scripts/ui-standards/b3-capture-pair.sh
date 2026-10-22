#!/bin/bash
# Chụp cặp "trước/sau" của đợt B3 liền nhau trên CÙNG dev server (:3456, HMR) và cùng bản
# b3-capture.mjs: tạm khôi phục app/src về commit gốc → chụp evidence/before (--as-of gốc) →
# trả app/src về HEAD → chụp evidence/after. Cần cây sạch ở app/src và app đang chạy.
# Dùng: bash scripts/ui-standards/b3-capture-pair.sh [<commit gốc>=b273de1]
set -euo pipefail
cd "$(dirname "$0")/../.."
base="${1:-b273de1}"
ev="_acceptance/ui-clean-b3-charts/evidence"

if [ -n "$(git status --porcelain -- app/src)" ]; then
  echo "app/src đang bẩn — commit trước khi chụp" >&2
  exit 1
fi
# Luôn trả app/src về HEAD, kể cả khi chụp lỗi giữa chừng.
trap 'git restore --source=HEAD --worktree -- app/src' EXIT

# Chờ dev server biên dịch lại sau khi tệp đổi: tải trang tới khi 200.
warm() {
  for path in /vn/hanoi /vn/hanoi/hoan-kiem /yield; do
    for _ in $(seq 1 60); do
      [ "$(curl -s -o /dev/null -w '%{http_code}' "http://localhost:3456$path")" = 200 ] && break
      sleep 2
    done
  done
}

git restore --source="$base" --worktree -- app/src
sleep 3
warm
node scripts/ui-standards/b3-capture.mjs --out "$ev/before" --as-of "$base"

git restore --source=HEAD --worktree -- app/src
sleep 3
warm
node scripts/ui-standards/b3-capture.mjs --out "$ev/after"
