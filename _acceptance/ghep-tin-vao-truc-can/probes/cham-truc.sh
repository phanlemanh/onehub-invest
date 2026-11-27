#!/usr/bin/env bash
# cham-truc.sh — E10a (AC-10): lệnh chấm trên tập giả (Wilson, bảng bài sai, đổi nhãn thì băm lệch), rồi chấm thật trên tập nhãn
# trục OP1 đóng băng khi tập đã có nhãn người; ghi evidence/cham-truc.md. Băm ghim ở tệp TAP-GHIM của hồ sơ.
set -euo pipefail
HS="$(cd "$(dirname "$0")/.." && pwd)"
ROOT="$(cd "$HS/../.." && pwd)"
cd "$ROOT/pipeline"
node --test scripts/ghep-tin-truc-can-cham.test.mjs
[ -f "$HS/TAP-GHIM" ] || { echo "ĐỎ: chưa có tập nhãn trục đóng băng (TAP-GHIM) — AC-10 chờ buổi gắn nhãn"; exit 4; }
read -r TEP BAM < "$HS/TAP-GHIM"
mkdir -p "$HS/evidence"
export DATABASE_URL="${DATABASE_URL:-postgres://oneinvest:oneinvest@localhost:5433/oneinvest}"
# Thẻ cài lỗi của phiên gắn nhãn (research-local, chỉ ở máy thu): loại khỏi tập chấm luật, đếm người duyệt sửa đúng.
THE_CAI="${THE_CAI:-$HOME/dev/onehub-invest/research-local/gan-nhan-tro-ly/the-cai-hai-khu-truc-2411.json}"
# Thiếu tệp thì dừng có tên, không lặng lẽ chấm một tập khác (finding r1, ngoài hợp đồng); không dùng mảng rỗng với set -u
# (bash 3.2 của macOS báo «unbound variable» — đo S4 r1 trên M5).
[ -f "$THE_CAI" ] || { echo "ĐỎ: thiếu tệp thẻ cài lỗi $THE_CAI (chỉ ở máy thu) — chép sang hoặc trỏ THE_CAI rồi chấm lại"; exit 5; }
# Bản chấm ghi ra thư mục lượt chạy; chỉ chép vào evidence/ khi nội dung khác (sau Cổng Bằng chứng cây hồ sơ là chỉ đọc — làn
# trước chữ ký đỏ 27/11 vì lượt chấm ghi lại cùng nội dung lên tệp đã thông cổng).
RA="$ROOT/.acceptance-runs/ghep-tin-vao-truc-can/cham-truc.md"
mkdir -p "$(dirname "$RA")"
node scripts/ghep-tin-truc-can-cham.mjs --tep "$ROOT/$TEP" --bam "$BAM" --ra "$RA" --bo-the-cai "$THE_CAI"
cmp -s "$RA" "$HS/evidence/cham-truc.md" || cp "$RA" "$HS/evidence/cham-truc.md"
