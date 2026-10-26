#!/bin/bash
# AC-2: pgrep giả luân phiên trên PATH — bản sửa xanh 3/3, bản tệp test của main aa928f3 đỏ ≥ 1/3 ĐÚNG ở câu «lớp lệch».
# pgrep giả chỉ tới phía app (getLockdownStatus); phía bên ghi chạy pgrep thật vì pipeline/scripts/capture-ops-facts.mjs đặt
# PATH cứng — hai phía vẫn đọc khác nhau giữa hai lần đo, đúng cơ chế gây chập chờn.
set -uo pipefail
ROOT="$(git rev-parse --show-toplevel)"; P="$ROOT/_acceptance/on-dinh-test-app-chap-chon/probes"
cd "$ROOT/app" || exit 2
DEM=$(mktemp); export PATH="$P/pgrep-gia:$PATH" PGREP_GIA_DEM="$DEM"
# Bản cũ đặt trong app/node_modules/ (ESLint và tsc bỏ qua): đặt trong app/tests thì bộ suite lint chạy song song quét phải
# tệp tạm rồi gặp nó bị xoá — ENOENT, đỏ oan cả lượt chấm. Đường import tương đối đổi sang tuyệt đối.
TAM="$ROOT/app/node_modules/.odt-doi-chung"; mkdir -p "$TAM"; cu="$TAM/ops-cu.test.tsx"
trap 'rm -rf "$TAM" "$DEM"' EXIT
git -C "$ROOT" show aa928f30:app/tests/ops-facts-so-tong-hop.test.tsx \
  | sed -e "s#\"\.\./\.\./#\"$ROOT/#g" -e "s#\"\.\./src/#\"$ROOT/app/src/#g" -e "s#import\.meta\.dirname#\"$ROOT/app/tests\"#g" > "$cu" \
  || { echo "KHONG LAY DUOC BAN CU"; exit 2; }
# Ghi trọn đầu ra rồi mới tìm: với pipefail, «node … | grep -q» báo thất bại oan khi grep thoát sớm làm node nhận SIGPIPE.
OUT=""
chay() { rm -f "$DEM"; OUT=$(env -u NODE_TEST_CONTEXT node --import tsx --test --test-name-pattern="ON22-AC-5 ma trận" "$1" 2>&1); printf '%s\n' "$OUT" | grep -q '^ℹ fail 0'; }
ds=0; for i in 1 2 3; do chay tests/ops-facts-so-tong-hop.test.tsx || ds=$((ds+1)); done
goi=$(cat "$DEM" 2>/dev/null || echo 0)
# Đỏ của bản cũ chỉ tính khi đúng câu «lớp lệch» (so giá trị lớp) — đỏ vì lý do khác không chứng gì.
dc=0; for i in 1 2 3; do chay "$cu" || { printf '%s\n' "$OUT" | grep -q 'lớp lệch' && dc=$((dc+1)); }; done
echo "ban sua: do $ds/3"; echo "ban cu aa928f3: do vi lop lech $dc/3"; echo "pgrep gia duoc goi (phia app, mot luot ban sua): $goi"
[ "$goi" -eq 7 ] || { echo "PGREP GIA KHONG DUOC GOI DU 7 LAN (moi dong ma tran mot lan)"; exit 1; }
[ "$ds" -eq 0 ] || exit 1
[ "$dc" -ge 1 ] || { echo "DOI CHUNG KHONG DO"; exit 1; }
echo "DOI CHUNG LD OK"
