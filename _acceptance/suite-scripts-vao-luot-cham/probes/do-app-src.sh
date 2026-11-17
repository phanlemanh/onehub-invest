#!/usr/bin/env bash
# E7 (AC-7): nhánh chỉ đổi app/src/lib/ops/registry/doc.ts → phần node --test của tập chọn ≤ 120 giây. Đổi bằng cây làm
# việc của worktree tạm (không commit): tepDoi tính cả thay đổi chưa commit. In số tệp chọn, giây lượt chọn, giây trọn bộ.
set -uo pipefail
GOC=$(git rev-parse --show-toplevel)
LENH="$GOC/scripts/suite-neu-doi.mjs"
TAM=$(mktemp -d); WT="$TAM/wt"
trap 'git -C "$GOC" worktree remove --force "$WT" >/dev/null 2>&1; rm -rf "$TAM"' EXIT
git -C "$GOC" worktree add -q --detach "$WT" HEAD || { echo "do-app-src: không dựng được worktree"; exit 2; }
bash "$GOC/scripts/dung-worktree-cham.sh" "$WT" --khong-tsc >/dev/null 2>&1
printf '\n// do-app-src: dòng chú thích của probe AC-7\n' >> "$WT/app/src/lib/ops/registry/doc.ts"
giay() { grep -E "^ℹ duration_ms" | tail -1 | awk '{printf "%.1f", $3/1000}'; }
CHON=$(SUITE_NEU_DOI_BASE=HEAD node "$LENH" --chay-scripts --root "$WT" 2>&1); rc1=$?
N=$(echo "$CHON" | grep -oE "^suite-neu-doi: scripts — [0-9]+/[0-9]+" | grep -oE "[0-9]+/[0-9]+")
G1=$(echo "$CHON" | giay)
TRON=$(SUITE_NEU_DOI=chay SUITE_NEU_DOI_BASE=HEAD node "$LENH" --chay-scripts --root "$WT" 2>&1); rc2=$?
G2=$(echo "$TRON" | giay)
echo "do-app-src: chọn $N tệp · node --test ${G1}s (thoát $rc1) · trọn bộ ${G2}s (thoát $rc2)"
echo "$CHON" | grep -E "^  scripts/"
awk -v g="$G1" 'BEGIN { exit !(g != "" && g + 0 <= 120) }' || { echo "do-app-src: ĐỎ — tập chọn ${G1}s vượt 120s"; exit 1; }
echo "do-app-src: xanh — ${G1}s ≤ 120s"
