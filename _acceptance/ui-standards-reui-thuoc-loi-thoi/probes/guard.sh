#!/bin/bash
# AC-1: selftest baseline-guard xanh trên cây thật (tệp mẫu suy từ eslint-suppressions.json). Chiều đỏ trên bản sao app tạm
# (src, plugin, cấu hình, suppressions; node_modules symlink): (a) suppressions không còn tệp .tsx nào → đỏ «còn tệp .tsx có mục
# suppress»; (b) tăng count của đúng (tệp mẫu, luật) thêm 1 → thêm một vi phạm không còn vượt số đếm → đỏ «vượt số đếm suppress».
set -uo pipefail
ROOT="$(cd "$(dirname "$0")/../../.." && pwd)" || exit 2
echo "root $ROOT sha $(git -C "$ROOT" rev-parse HEAD)"
APP="$ROOT/app"; bad=0
OUT=$(cd "$APP" && node eslint-plugin-onehub-ui/selftest.mjs baseline-guard 2>&1); rc=$?
mau=$(printf '%s\n' "$OUT" | sed -n 's/^  INFO  tệp mẫu \([^ ]*\) · luật \([^ ]*\) .*/\1 \2/p')
if [ $rc = 0 ] && printf '%s\n' "$OUT" | grep -q "^PASS" && [ -n "$mau" ]; then echo "ban that: PASS, tep mau $mau"; else echo "BAN THAT DO (rc $rc)"; printf '%s\n' "$OUT" | grep -E "FAIL|INFO" | head; bad=1; fi
ban_sao() { # $1 = tên, $2 = biểu thức node đổi suppressions (biến s)
  local T; T=$(mktemp -d)
  for f in src eslint-plugin-onehub-ui eslint.config.mjs eslint-suppressions.json package.json tsconfig.json; do cp -R "$APP/$f" "$T/$f"; done
  ln -s "$APP/node_modules" "$T/node_modules"
  node -e 'const fs=require("fs");const p=process.argv[1];let s=JSON.parse(fs.readFileSync(p,"utf8"));'"$2"';fs.writeFileSync(p,JSON.stringify(s,null,2))' "$T/eslint-suppressions.json" "$mau" || { echo "DOT BIEN KHONG AP DUOC ($1)"; rm -rf "$T"; return 2; }
  OUT=$(cd "$T" && node eslint-plugin-onehub-ui/selftest.mjs baseline-guard 2>&1); RC=$?; rm -rf "$T"
}
ban_sao khong-tsx 's=Object.fromEntries(Object.entries(s).filter(([f])=>!f.endsWith(".tsx")))'
if [ "${RC:-0}" != 0 ] && printf '%s\n' "$OUT" | grep -q "FAIL  eslint-suppressions.json còn tệp .tsx có mục suppress"; then echo "ban khong tep tsx: do, thong diep ghim co"; else echo "CA KHONG DO (khong tep tsx)"; printf '%s\n' "$OUT" | tail -5; bad=1; fi
ban_sao tang-dem 'const [f,r]=process.argv[2].split(" ");s[f][r].count+=1'
if [ "${RC:-0}" != 0 ] && printf '%s\n' "$OUT" | grep -qE "FAIL  thêm 1 vi phạm .*vượt số đếm suppress"; then echo "ban tang dem suppress: do, thong diep ghim co"; else echo "CA KHONG DO (tang dem)"; printf '%s\n' "$OUT" | grep -E "FAIL|OK" | head; bad=1; fi
[ $bad = 0 ] && echo "GUARD OK"
exit $bad
