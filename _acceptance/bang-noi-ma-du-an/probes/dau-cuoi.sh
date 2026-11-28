#!/usr/bin/env bash
# E9 (AC-9): đầu–cuối trên bản chép — ngả so bộ đo S1 đóng băng, ô (oSo) tách hai hiệu ứng, đảo về cột đổi phạm vi.
# Tạo phẩm ra .acceptance-runs/bang-noi-ma-du-an/ (không ghi cây hồ sơ khi chạy); chỉ chép dau-cuoi.md, the-S07.md (đầu vào E10)
# vào evidence/ khi nội dung khác — sau Cổng Bằng chứng cây hồ sơ là chỉ đọc (bài học PL36 27/11).
source "$(dirname "${BASH_SOURCE[0]}")/_chung.sh"
RA="$ROOT/.acceptance-runs/bang-noi-ma-du-an"
EV="$ROOT/_acceptance/bang-noi-ma-du-an/evidence"
mkdir -p "$RA"
ma=0
DA3_RA="$RA" chay_db e9 app node --import tsx --test probes/da3-dau-cuoi.test.tsx || ma=$?
for t in dau-cuoi.md the-S07.md; do
  [ -f "$RA/$t" ] || continue
  cmp -s "$RA/$t" "$EV/$t" || cp "$RA/$t" "$EV/$t"
done
exit "$ma"
