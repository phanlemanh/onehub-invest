#!/usr/bin/env bash
# E6 (AC-6): tái hiện hai lần đỏ thật. Bộ chọn + lệnh suite của HEAD, tệp khai của HEAD (--khai), chạy trên worktree tạm
# của đỉnh cũ (đỉnh cũ chưa có bộ chọn). Gốc so sánh = merge-base của đỉnh với origin/main (hai PR gộp kiểu squash nên đỉnh
# không nằm trong main). Kỳ vọng: tệp được chọn VÀ lệnh đỏ đúng ca. Thoát 1 gọi tên đỉnh khi lệch.
set -uo pipefail
GOC=$(git rev-parse --show-toplevel)
HEAD_SHA=$(git -C "$GOC" rev-parse HEAD)
LENH="$GOC/scripts/suite-neu-doi.mjs"
KHAI="$GOC/scripts/suite-scripts-vung.json"
TAM=$(mktemp -d)
WTS=()
don() { for w in "${WTS[@]}"; do git -C "$GOC" worktree remove --force "$w" >/dev/null 2>&1; done; rm -rf "$TAM"; }
trap don EXIT
loi=0
ca() { # <sha> <tệp test kỳ vọng> <đầu tên ca đỏ>
  local sha=$1 tep=$2 mau=$3 wt="$TAM/wt-$1" base out rc
  git -C "$GOC" worktree add -q --detach "$wt" "$sha" || { echo "tai-hien: ĐỎ — không dựng được worktree $sha"; loi=1; return; }
  WTS+=("$wt")
  bash "$GOC/scripts/dung-worktree-cham.sh" "$wt" --khong-tsc >/dev/null 2>&1
  base=$(git -C "$GOC" merge-base "$sha" origin/main)
  out=$(SUITE_NEU_DOI_BASE="$base" node "$LENH" --chay-scripts --root "$wt" --khai "$KHAI" 2>&1); rc=$?
  echo "== $sha · bộ chọn @${HEAD_SHA:0:9} · gốc ${base:0:9} · lệnh thoát $rc"
  echo "$out" | grep -E "^suite-neu-doi: scripts" ; echo "$out" | grep -F "  $tep ←"
  if ! echo "$out" | grep -qF "  $tep ←"; then echo "tai-hien: ĐỎ — $sha: $tep không được chọn"; loi=1; return; fi
  if [ "$rc" -eq 0 ]; then echo "tai-hien: ĐỎ — $sha: lệnh suite xanh, kỳ vọng đỏ ở $tep"; loi=1; return; fi
  if ! echo "$out" | grep -E "^\s*(not ok|✖)" | grep -qF "$mau"; then echo "tai-hien: ĐỎ — $sha: ca đỏ «$mau» không xuất hiện"; loi=1; return; fi
  echo "tai-hien: $sha đỏ đúng «$mau» ở $tep"
}
ca 5b02c3de0 scripts/s05-khoa-nap.test.mjs "(5) bước thu lỗi"
ca f3fecd5f6 scripts/db-thu.test.mjs "DT-AC-7"
[ "$loi" -eq 0 ] && echo "tai-hien: xanh — hai lần đỏ thật tái hiện qua bộ chọn @${HEAD_SHA:0:9}"
exit "$loi"
