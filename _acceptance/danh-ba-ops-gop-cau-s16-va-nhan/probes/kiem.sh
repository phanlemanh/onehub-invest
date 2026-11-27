#!/usr/bin/env bash
# Lệnh eval của hồ sơ danh-ba-ops-gop-cau-s16-va-nhan (DA67). Đường suy từ vị trí script, không hardcode gốc kho.
#   ttc    = bộ test DA40 (tests/thuoc-tinh-can.test.tsx; DB thử dựng từ db/migrations, xoá khi xong)
#   man    = tests/danh-ba-ops-dot1.test.tsx (render tĩnh + DB thử)
#   may    = probes/so-s16.mts trên DB máy thu CHỈ ĐỌC — bản mới so bản origin/main của thuoc-tinh-can.ts
#   bidanh = probes/bi-danh.mts trên DB máy thu CHỈ ĐỌC — đếm dòng phụ nhắc lại tên
set -euo pipefail
GOC="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
HS="$GOC/_acceptance/danh-ba-ops-gop-cau-s16-va-nhan"
MAY_URL="${DBO_DB_URL:-postgres://oneinvest:oneinvest@localhost:5433/oneinvest}"
cd "$GOC/app"
case "${1:-}" in
  ttc)    exec node --import tsx --test --test-concurrency=1 tests/thuoc-tinh-can.test.tsx ;;
  man)    exec node --import tsx --test --test-concurrency=1 tests/danh-ba-ops-dot1.test.tsx ;;
  may)    git -C "$GOC" show origin/main:app/src/lib/ops/thuoc-tinh-can.ts > "${TMPDIR:-/tmp}/dbo-ttc-main.ts"
          DBO_TTC_MAIN="${TMPDIR:-/tmp}/dbo-ttc-main.ts" DATABASE_URL="$MAY_URL" exec node --import tsx "$HS/probes/so-s16.mts" ;;
  bidanh) DATABASE_URL="$MAY_URL" exec node --import tsx "$HS/probes/bi-danh.mts" ;;
  *) echo "kiem.sh: dùng ttc | man | may | bidanh" >&2; exit 2 ;;
esac
