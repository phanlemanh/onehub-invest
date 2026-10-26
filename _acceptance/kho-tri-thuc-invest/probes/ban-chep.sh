#!/usr/bin/env bash
# AC-2 — 7 tệp mang nhãn [only-if-declared: tri_thuc] của danh sách chép có mặt và trùng byte bản cài kit.
set -uo pipefail; . "$(dirname "$0")/_chung.sh"
cd "$ROOT" || exit 2
ds="$(awk '/<<<INIT-CI-COPY-LIST/{f=1} /INIT-CI-COPY-LIST>>>/{f=0} f' "$AG/commands/acceptance-init.md" | grep 'only-if-declared: tri_thuc' | sed -E 's/.*`\$\{CLAUDE_PLUGIN_ROOT\}\/([^`]+)`.*/\1/')"
n=0; for f in $ds; do n=$((n+1)); if cmp -s "$f" "$AG/$f"; then ok "trùng byte: $f"; else bad "lệch hay thiếu: $f"; fi; done
[ "$n" -eq 7 ] && ok "danh sách chép của kit $KIT_VER có 7 tệp tri_thuc" || bad "danh sách có $n tệp, cần 7"
[ $fail -eq 0 ] && echo "BAN-CHEP OK" || { echo "BAN-CHEP FAIL"; exit 1; }
