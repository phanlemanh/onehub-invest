#!/usr/bin/env bash
# AC-3 — /tri-thuc:kiem xanh: 12 trang, 12 raw, 0 lỗi; kho riêng sạch và không còn commit chưa đẩy.
set -uo pipefail; . "$(dirname "$0")/_chung.sh"
cd "$ROOT" || exit 2
out="$(node "$AG/scripts/tri-thuc.mjs" --root . --kiem 2>&1)"; rc=$?; echo "$out"
[ $rc -eq 0 ] && echo "$out" | grep -q '^tri thức: 12 trang, 12 raw, 0 lỗi$' && ok "lint xanh 12/12/0" || bad "lint rc=$rc"
[ -z "$(git -C "$GOC" status --porcelain)" ] && ok "kho riêng không có thay đổi chưa commit" || bad "kho riêng còn thay đổi"
git -C "$GOC" fetch -q origin && [ -z "$(git -C "$GOC" log --oneline @{u}..HEAD)" ] && ok "kho riêng: mọi commit đã đẩy" || bad "kho riêng còn commit chưa đẩy"
[ $fail -eq 0 ] && echo "LINT OK" || { echo "LINT FAIL"; exit 1; }
