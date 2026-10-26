#!/usr/bin/env bash
# AC-6 — riêng tư: kho công khai không giữ tài liệu thô hay trang; raw ngoài loại tep-kho không có tên nguồn thật
# (bộ quét lấy tên từ migrations + source_registry local, in mã, không in tên); raw loại tep-kho trùng byte một bản đã
# có trên origin/main của kho công khai (không lộ thêm gì).
set -uo pipefail; . "$(dirname "$0")/_chung.sh"
cd "$ROOT" || exit 2
x="$(git ls-files | grep -E '(^|/)(raw|wiki)/.*nguon\.md$|(^|/)TRI-THUC\.md$' || true)"
[ -z "$x" ] && ok "kho công khai: không tệp nguon.md hay TRI-THUC.md nào" || bad "kho công khai có tệp tri thức: $x"
quet="$(dirname "$0")/quet-tang-a.mjs"
for d in "$GOC"/raw/*/; do
  ten="$(basename "$d")"; loai="$(grep -m1 '^loai:' "$d/nguon.md" | sed 's/^loai: *//')"
  tep="$(grep -E '^- `' "$d/nguon.md" | sed -E 's/^- `([^`]+)`.*/\1/')"
  if [ "$loai" = "tep-kho" ]; then
    goc="$(grep -m1 '^goc:' "$d/nguon.md" | sed 's/^goc: *//')"
    for f in $tep; do
      h="$(git hash-object "$d/$f")"; p="$(echo "$goc" | tr ',' '\n' | sed 's/^ *//' | grep "/$f\$\|^$f\$" | head -1)"
      if [ -n "$p" ] && git rev-list origin/main -- "$p" | while read -r c; do git rev-parse -q --verify "$c:$p" 2>/dev/null; done | grep -qx "$h"; then ok "$ten/$f: trùng một bản của $p trên origin/main"
      else bad "$ten/$f: không trùng bản nào của «$p» trên origin/main"; fi
    done
  else
    for f in $tep; do
      if node "$quet" "$ROOT" "$d/$f" >/dev/null 2>&1; then ok "$ten/$f ($loai): 0 tên nguồn thật"; else bad "$ten/$f ($loai): có tên nguồn thật — $(node "$quet" "$ROOT" "$d/$f" 2>/dev/null)"; fi
    done
  fi
done
[ $fail -eq 0 ] && echo "RIENG-TU OK" || { echo "RIENG-TU FAIL"; exit 1; }
