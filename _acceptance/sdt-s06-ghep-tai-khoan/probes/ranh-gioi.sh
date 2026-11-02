#!/usr/bin/env bash
# ranh-gioi.sh — E9 của sdt-s06-ghep-tai-khoan: PR không chạm đường lên cloud, app, data-api, bộ thu, bộ nạp.
# RANH_GIOI_THEM: danh sách tệp giả (cách nhau bằng dấu cách) để đo chiều đỏ trên cùng lệnh.
set -euo pipefail
cd "$(git rev-parse --show-toplevel)"

node --test pipeline/sync-cloud.test.mjs >/dev/null

grep -q 'sale_offers: \["seller_phone"' pipeline/sync-cloud.mjs || { echo "RANH-GIOI: PII_EXCLUDE không còn loại seller_phone"; exit 1; }
if grep -q 'field_provenance' pipeline/sync-cloud.mjs; then echo "RANH-GIOI: field_provenance có trong sync-cloud"; exit 1; fi

base=$(git merge-base HEAD origin/main)
{ git diff --name-only "$base"; git ls-files --others --exclude-standard; printf '%s\n' ${RANH_GIOI_THEM:-}; } | sort -u > "${TMPDIR:-/tmp}/ranh-gioi.$$"
cham=$(grep -E '^(pipeline/sync-cloud|pipeline/push-ops-facts|app/|data-api/|collector/|pipeline/collect-|pipeline/import-)' "${TMPDIR:-/tmp}/ranh-gioi.$$" || true)
rm -f "${TMPDIR:-/tmp}/ranh-gioi.$$"
if [ -n "$cham" ]; then echo "RANH-GIOI: chạm tệp ngoài phạm vi:"; echo "$cham"; exit 1; fi
echo "ranh-gioi: xanh"
