#!/usr/bin/env bash
# ranh-gioi.sh — E9 của sdt-s06-khoi-phuc-xuat-xu: PR không chạm schema, app, data-api, bộ thu, bộ nạp, đường lên cloud; test cũ chỉ được thêm.
# RANH_GIOI_THEM: danh sách tệp giả (cách nhau bằng dấu cách) để đo chiều đỏ trên cùng lệnh.
# RANH_GIOI_BOT: số dòng xoá giả ở tệp test, cũng cho chiều đỏ.
set -euo pipefail
cd "$(git rev-parse --show-toplevel)"

base=$(git merge-base HEAD origin/main)
tep=$({ git diff --name-only "$base"; git ls-files --others --exclude-standard; printf '%s\n' ${RANH_GIOI_THEM:-}; } | sort -u)
cham=$(printf '%s\n' "$tep" | grep -E '^(db/migrations/|pipeline/sync-cloud|pipeline/push-ops-facts|app/|data-api/|collector/|pipeline/collect-|pipeline/import-)' || true)
if [ -n "$cham" ]; then echo "RANH-GIOI: chạm tệp ngoài phạm vi:"; echo "$cham"; exit 1; fi

bot=$(git diff --numstat "$base" -- pipeline/scripts/gan-sdt-s06.test.mjs | awk '{print $2}')
bot=$(( ${bot:-0} + ${RANH_GIOI_BOT:-0} ))
if [ "$bot" -ne 0 ]; then echo "RANH-GIOI: test cũ bị sửa hoặc xoá $bot dòng"; exit 1; fi
echo "ranh-gioi: xanh"
