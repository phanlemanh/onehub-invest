#!/usr/bin/env bash
# E9 (AC-9): đầu–cuối trên bản chép — ngả so bộ đo S1 đóng băng, ô (oSo) tách hai hiệu ứng, đảo về cột đổi phạm vi.
# Chạy trên một bản chép MỚI của DB máy thu dựng riêng cho lượt (db/db-thu.sh <tên>, pg_dump), không dùng bản mẫu chung: bản mẫu
# chỉ dựng lại khi lược đồ đổi hay quá 24 giờ, nên có thể thiếu dữ liệu vừa áp (đo 28/11: bản mẫu dựng trước lượt áp DA55, S07 K3 48
# thay vì 62). AC-9 đòi số của dữ liệu thật hôm nay.
# Tạo phẩm ra .acceptance-runs/bang-noi-ma-du-an/ (không ghi cây hồ sơ khi chạy); chỉ chép dau-cuoi.md, the-S07.md (đầu vào E10)
# vào evidence/ khi nội dung khác — sau Cổng Bằng chứng cây hồ sơ là chỉ đọc (bài học PL36 27/11).
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
T="oneinvest_suite_da3_e9_$$"
RA="$ROOT/.acceptance-runs/bang-noi-ma-du-an"
EV="$ROOT/_acceptance/bang-noi-ma-du-an/evidence"
LOG="$(mktemp -t da3-e9)"
trap 'bash "$ROOT/db/db-thu.sh" "$T" --xoa >/dev/null 2>&1 || true; rm -f "$LOG"' EXIT
mkdir -p "$RA"
bash "$ROOT/db/db-thu.sh" "$T" >/dev/null
ma=0
(cd "$ROOT/app" && DA3_RA="$RA" DATABASE_URL="postgres://oneinvest:oneinvest@localhost:5433/$T" \
  node --import tsx --test probes/da3-dau-cuoi.test.tsx) >"$LOG" 2>&1 || ma=$?
tail -60 "$LOG"
for t in dau-cuoi.md the-S07.md; do
  [ -f "$RA/$t" ] || continue
  cmp -s "$RA/$t" "$EV/$t" || cp "$RA/$t" "$EV/$t"
done
exit "$ma"
