#!/usr/bin/env bash
# ranh-gioi.sh — E9 của sdt-s06-khoi-phuc-xuat-xu: PR không chạm schema, app, data-api, bộ thu, bộ nạp, đường lên cloud; test cũ chỉ được thêm.
# Lớp «thu, nạp» lấy theo bảng phân làn ZCode ở AGENTS.md; lớp «đẩy cloud» gồm cả job scripts/cloud-sync.sh.
# RANH_GIOI_THEM: danh sách tệp giả (cách nhau bằng dấu cách) để đo chiều đỏ trên cùng lệnh.
# RANH_GIOI_BOT: số dòng xoá giả ở tệp test, cũng cho chiều đỏ.
# Không có hai biến đó: chạy luôn chiều đỏ của từng mẫu, chiều đỏ không đỏ thì thoát 2.
set -euo pipefail
cd "$(git rev-parse --show-toplevel)"

if [ -z "${RANH_GIOI_THEM:-}${RANH_GIOI_BOT:-}" ]; then
  for gia in db/migrations/071_x.sql app/x.ts data-api/x.ts collector/x.ts \
             pipeline/sync-cloud.mjs pipeline/push-ops-facts.mjs scripts/cloud-sync.sh \
             pipeline/collect-x.mjs pipeline/import-x.mjs pipeline/import.sh pipeline/apify-x.mjs \
             pipeline/airdna-rotate.mjs pipeline/fetch-data.sh pipeline/cron/x.plist \
             pipeline/thu-so-s06.mjs pipeline/bu-seller-v5.mjs \
             scripts/chotot-daily.sh scripts/install-x.sh scripts/zalo-x.sh; do
    if ra=$(RANH_GIOI_THEM="$gia" bash "$0" 2>&1) || ! printf '%s' "$ra" | /usr/bin/grep -q 'RANH-GIOI: chạm'; then
      echo "RANH-GIOI-CHIEU-DO: $gia không bị chặn"; exit 2
    fi
  done
  if ra=$(RANH_GIOI_BOT=1 bash "$0" 2>&1) || ! printf '%s' "$ra" | /usr/bin/grep -q 'RANH-GIOI: test cũ'; then
    echo "RANH-GIOI-CHIEU-DO: xoá dòng test không bị chặn"; exit 2
  fi
fi

base=$(git merge-base HEAD origin/main)
tep=$({ git diff --name-only "$base"; git ls-files --others --exclude-standard; printf '%s\n' ${RANH_GIOI_THEM:-}; } | sort -u)
cham=$(printf '%s\n' "$tep" | /usr/bin/grep -E '^(db/migrations/|app/|data-api/|collector/|scripts/cloud-sync\.sh$|scripts/.*-daily\.sh$|scripts/install-|scripts/zalo-.*\.sh$|pipeline/(sync-cloud|push-ops-facts|collect-|import-|import\.sh$|apify-|airdna-rotate\.mjs$|fetch-data\.sh$|cron/|thu-so-s06\.mjs$|bu-seller-v5\.mjs$))' || true)
if [ -n "$cham" ]; then echo "RANH-GIOI: chạm tệp ngoài phạm vi:"; echo "$cham"; exit 1; fi

bot=$(git diff --numstat "$base" -- pipeline/scripts/gan-sdt-s06.test.mjs | awk '{print $2}')
bot=$(( ${bot:-0} + ${RANH_GIOI_BOT:-0} ))
if [ "$bot" -ne 0 ]; then echo "RANH-GIOI: test cũ bị sửa hoặc xoá $bot dòng"; exit 1; fi
echo "ranh-gioi: xanh"
