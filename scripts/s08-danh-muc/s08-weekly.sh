#!/bin/bash
# s08-weekly.sh — lượt thu S08 (danh mục quỹ căn) MỘT LẦN MỖI TUẦN theo preset
# launchd (claudedp-3110-10). Chính sách Mạnh duyệt 24/10: chỉ đọc, ≤1 lượt/tuần,
# chỉ dùng nội bộ — lịch này CHÍNH LÀ cơ chế giữ nhịp 1 lần/tuần.
#
# Tầng A (tên thật/endpoint) nằm ở ~/.oneinvest/s08.env (không commit):
#   S08_API_BASE, S08_EP_UNITS, S08_EP_CATALOG, S08_EP_DETAIL
# Thiếu file → dừng rõ (fail-closed), không thu mò.
set -uo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
export PATH="$HOME/.local/node-v24.21.0/bin:$PATH"
export DATABASE_URL="${DATABASE_URL:-postgres://oneinvest:oneinvest@localhost:5433/oneinvest}"

ENV_TANG_A="$HOME/.oneinvest/s08.env"
if [ ! -f "$ENV_TANG_A" ]; then
  echo "❌ thiếu $ENV_TANG_A (tầng A — cấu hình local, xem collector/src/collectors/s08-danh-muc.ts)" >&2
  exit 1
fi
set -a; . "$ENV_TANG_A"; set +a
export S08_PROJECTS="${S08_PROJECTS:-all}"

# Cổng vòng đời S08 (TV2b) — DUY NHẤT qua pipeline/lib/vong-doi.mjs.
VD_RC=0; VD_KQ="$(node "$ROOT"/pipeline/lib/vong-doi.mjs S08)" || VD_RC=$?
if [ "$VD_RC" -eq 3 ]; then echo "$VD_KQ — bỏ qua lượt thu S08"; exit 0; fi
if [ "$VD_RC" -ne 0 ]; then echo "❌ vong-doi S08 lỗi — dừng (fail-closed)"; exit 1; fi

# Thu (đã qua cổng). Chạy theo lịch nên mở cửa sổ conduct; jitter tắt cho REST
# API đăng nhập hợp lệ ~850 request/lượt (trùng conduct lượt tay 24/10 & 1/11).
CONDUCT_WINDOW=off CONDUCT_JITTER=0 \
  node "$ROOT"/collector/dist/cli.js collect --city vn --source s08-danh-muc || {
  echo "❌ bước thu S08 lỗi"; exit 1; }

# Nạp snapshot s08 MỚI NHẤT (idempotent — chạy lại không nhân dòng; importer
# bỏ item catalog/detail theo s08RowOf).
SNAP="$(ls -t "$ROOT"/collector/snapshots/vn 2>/dev/null | grep '^vn__s08-danh-muc__' | head -1)"
if [ -z "$SNAP" ]; then echo "❌ không thấy snapshot s08-danh-muc sau thu"; exit 1; fi
node "$ROOT"/pipeline/import-airbnb.mjs "$ROOT"/collector/snapshots/vn/"$SNAP" || {
  echo "❌ bước nạp S08 lỗi"; exit 1; }
echo "✅ S08 tuần: thu + nạp xong ($SNAP)"
