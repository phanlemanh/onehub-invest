#!/usr/bin/env bash
# E3/E4 (AC-3, AC-4): tái hiện một lần đỏ thật. Lệnh --chay-scripts của HEAD chạy trọn bộ scripts theo các bước CI trên
# worktree tạm của đỉnh cũ (--root). Kỳ vọng: lệnh thoát khác 0 VÀ ca đỏ đã biết nằm trong danh sách đỏ.
#   bash tai-hien.sh 471   → 5b02c3de (cha của bản vá 8d5b75b1), ca «(5) bước thu lỗi» của scripts/s05-khoa-nap.test.mjs
#   bash tai-hien.sh 472   → f3fecd5f, ca DT-AC-7 của scripts/db-thu.test.mjs
set -uo pipefail
case "${1:-}" in
  471) SHA=5b02c3de0; TEP=scripts/s05-khoa-nap.test.mjs; MAU="(5) bước thu lỗi" ;;
  472) SHA=f3fecd5f6; TEP=scripts/db-thu.test.mjs; MAU="DT-AC-7" ;;
  *) echo "dùng: bash tai-hien.sh 471|472"; exit 2 ;;
esac
GOC=$(git rev-parse --show-toplevel)
HEAD_SHA=$(git -C "$GOC" rev-parse HEAD)
TAM=$(mktemp -d); WT="$TAM/wt"
trap 'git -C "$GOC" worktree remove --force "$WT" >/dev/null 2>&1; rm -rf "$TAM"' EXIT
git -C "$GOC" worktree add -q --detach "$WT" "$SHA" || { echo "tai-hien: ĐỎ — không dựng được worktree $SHA"; exit 1; }
bash "$GOC/scripts/dung-worktree-cham.sh" "$WT" --khong-tsc >/dev/null 2>&1
OUT=$(node "$GOC/scripts/suite-neu-doi.mjs" --chay-scripts --root "$WT" 2>&1); RC=$?
echo "== #$1 · đỉnh $SHA · lệnh @${HEAD_SHA:0:9} · thoát $RC"
echo "$OUT" | tail -1
if [ "$RC" -eq 0 ]; then echo "tai-hien: ĐỎ — #$1 ($SHA): lệnh xanh, kỳ vọng đỏ ở $TEP"; exit 1; fi
if ! echo "$OUT" | grep -E "^\s*(✖|not ok)" | grep -qF "$MAU"; then echo "tai-hien: ĐỎ — #$1 ($SHA): ca «$MAU» của $TEP không nằm trong danh sách đỏ"; exit 1; fi
echo "tai-hien: xanh — #$1 ($SHA) đỏ đúng «$MAU» ở $TEP"
