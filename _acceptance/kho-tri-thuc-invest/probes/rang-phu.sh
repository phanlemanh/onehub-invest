#!/usr/bin/env bash
# AC-4 — răng phủ trên 10 bản phạm vi: 0 lỗi nguồn ở cả 10; 9 bản 0 lỗi; ops-noi-that chỉ còn đúng 3 lỗi có từ trước.
set -uo pipefail; . "$(dirname "$0")/_chung.sh"
cd "$ROOT" || exit 2
n=0
for s in docs/plan/pham-vi-*.md; do
  n=$((n+1)); r="$(node "$AG/scripts/cat-luot.mjs" --root . --pham-vi "$s" --lo-trinh "$LT" 2>&1)"; rc=$?
  nl="$(echo "$r" | grep -c '\[nguon-')"; l="$(echo "$r" | grep -c '^lỗi:')"
  grep -q '^nguon: onehub-invest-tri-thuc:wiki/dot/[a-z0-9-]*\.md#[0-9a-f]\{40\}$' "$s" || bad "$(basename "$s"): nguon không phải một đường trỏ băm"
  if [ "$(basename "$s")" = "pham-vi-ops-noi-that-2410.md" ]; then
    k="$(echo "$r" | grep '^lỗi:' | grep -cE 'mốc OM1 \[moc-ngoai-da-bo\]|mốc OM2 \[moc-ngoai-da-bo\]|mã YC9c không ở hàng')"
    [ "$nl" = 0 ] && [ "$l" = 3 ] && [ "$k" = 3 ] && ok "$(basename "$s"): 0 lỗi nguồn; còn đúng 3 lỗi có từ trước (OM1, OM2, YC9c)" || bad "$(basename "$s"): rc=$rc lỗi=$l nguồn=$nl"
  else
    [ $rc -eq 0 ] && [ "$l" = 0 ] && ok "$(basename "$s"): xanh, 0 lỗi" || bad "$(basename "$s"): rc=$rc lỗi=$l nguồn=$nl $(echo "$r" | grep '^lỗi' | head -2)"
  fi
done
[ "$n" = 10 ] && ok "đủ 10 bản phạm vi" || bad "có $n bản phạm vi, cần 10"
[ $fail -eq 0 ] && echo "RANG-PHU OK" || { echo "RANG-PHU FAIL"; exit 1; }
