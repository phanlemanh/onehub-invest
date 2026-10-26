#!/bin/bash
# AC-2: pgrep giả luân phiên trên PATH — bản sửa xanh 3/3, bản tệp test của main aa928f3 đỏ ≥ 1/3.
set -uo pipefail
ROOT="$(git rev-parse --show-toplevel)"; P="$ROOT/_acceptance/on-dinh-test-app-chap-chon/probes"
cd "$ROOT/app" || exit 2
DEM=$(mktemp); export PATH="$P/pgrep-gia:$PATH" PGREP_GIA_DEM="$DEM"
cu=tests/.zz-ops-doi-chung.test.tsx
git -C "$ROOT" show aa928f30:app/tests/ops-facts-so-tong-hop.test.tsx > "$cu" || { echo "KHONG LAY DUOC BAN CU"; exit 2; }
# Ghi trọn đầu ra rồi mới tìm: với pipefail, «node … | grep -q» báo thất bại oan khi grep thoát sớm làm node nhận SIGPIPE.
chay() { local out; rm -f "$DEM"; out=$(env -u NODE_TEST_CONTEXT node --import tsx --test --test-name-pattern="ON22-AC-5 ma trận" "$1" 2>&1); printf '%s\n' "$out" | grep -q '^ℹ fail 0'; }
ds=0; for i in 1 2 3; do chay tests/ops-facts-so-tong-hop.test.tsx || ds=$((ds+1)); done
goi=$(cat "$DEM" 2>/dev/null || echo 0)
dc=0; for i in 1 2 3; do chay "$cu" || dc=$((dc+1)); done
rm -f "$cu" "$DEM"
echo "ban sua: do $ds/3"; echo "ban cu aa928f3: do $dc/3"; echo "pgrep gia duoc goi: $goi"
[ "$goi" -gt 0 ] || { echo "PGREP GIA KHONG DUOC GOI"; exit 1; }
[ "$ds" -eq 0 ] || exit 1
[ "$dc" -ge 1 ] || { echo "DOI CHUNG KHONG DO"; exit 1; }
echo "DOI CHUNG LD OK"
