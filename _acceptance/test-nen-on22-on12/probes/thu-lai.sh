#!/bin/bash
# AC-2: db-tam-thoi.test.tsx xanh; bản sao helper bỏ 53300 khỏi tập mã → ca đỏ với thông điệp ghim
# «lỗi DB tạm thời phải được thử lại». Bản sao ở app/node_modules/.tn-tmp (tsx giải được, eslint/tsc bỏ qua).
set -uo pipefail
ROOT="$(cd "$(dirname "$0")/../../.." && pwd)" || exit 2
echo "root $ROOT sha $(git -C "$ROOT" rev-parse HEAD)"
TAM="$ROOT/app/node_modules/.tn-tmp-$$"; trap 'rm -rf "$TAM"' EXIT
for b in sua bo; do mkdir -p "$TAM/$b/helpers"; cp "$ROOT/app/tests/db-tam-thoi.test.tsx" "$TAM/$b/"; cp "$ROOT/app/tests/helpers/db-tam-thoi.ts" "$TAM/$b/helpers/"; done
grep -q '"53300", ' "$TAM/bo/helpers/db-tam-thoi.ts" || { echo "DOT BIEN KHONG AP DUOC"; exit 2; }
sed -i '' 's/"53300", //' "$TAM/bo/helpers/db-tam-thoi.ts"
OUT=""
chay() { OUT=$(cd "$ROOT/app" && env -u NODE_TEST_CONTEXT node --import tsx --test "$TAM/$1/db-tam-thoi.test.tsx" 2>&1); }
so() { printf '%s\n' "$OUT" | sed -n "s/^ℹ $1 \([0-9]*\)$/\1/p" | tail -1; }
bad=0
chay sua; t=$(so tests); p=$(so pass); f=$(so fail); echo "ban sua: ${p:-?}/${t:-?} ca xanh"
[ -n "$t" ] && [ "$t" = "$p" ] && [ "$f" = 0 ] && [ "$t" -ge 4 ] || { printf '%s\n' "$OUT" | tail -20; bad=1; }
chay bo
if [ "$(so fail)" -ge 1 ] 2>/dev/null && printf '%s\n' "$OUT" | grep -q "lỗi DB tạm thời phải được thử lại"; then echo "ban bo 53300: ca do, thong diep ghim co"; else echo "CA KHONG DO (ban bo 53300)"; printf '%s\n' "$OUT" | tail -20; bad=1; fi
[ $bad = 0 ] && echo "THU LAI OK"
exit $bad
