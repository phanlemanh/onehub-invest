#!/usr/bin/env bash
# Thước máy của hồ sơ invest-target-map — chạy từ gốc repo: bash _acceptance/invest-target-map/verify.sh <e2|e3|e5|e10>
set -u
cd "$(git rev-parse --show-toplevel)"
ROUTES=.claude/skills/onehub-ui/routes.md
echo "run_id: invest-target-map-$1-$(date -u +%Y%m%dT%H%M%SZ)"
mutate() { # $1 = biểu thức sed; test con phải ĐỎ, routes.md phải khôi phục
  local b; b=$(mktemp); cp "$ROUTES" "$b"
  sed -i '' "$1" "$ROUTES"
  local out rc
  out=$(cd app && node --test eslint-plugin-onehub-ui/tests/routes-map.test.mjs 2>&1); rc=$?
  echo "$out" | grep -E "→|^ℹ (pass|fail)"
  cp "$b" "$ROUTES"; rm -f "$b"
  git diff --quiet "$ROUTES" && echo "routes.md khôi phục sạch" || { echo "routes.md KHÔNG sạch"; exit 2; }
  (cd app && node --test eslint-plugin-onehub-ui/tests/routes-map.test.mjs >/dev/null 2>&1) || { echo "test gốc đỏ"; exit 2; }
  [ "$rc" -ne 0 ] || { echo "đột biến KHÔNG bị bắt (test con xanh)"; exit 1; }
  echo "đột biến bị bắt (test con đỏ, exit $rc)"
}
case "$1" in
  e2) node -e "const t=require('fs').readFileSync('$ROUTES','utf8');const r=t.split('\n').filter(l=>/^\| \`\/(?!ops)/.test(l)&&!/\| redirect \|/.test(l));const bad=r.filter(l=>/\| chờ /.test(l));console.log('invest rows',r.length,'chờ',bad.length);process.exit(r.length===13&&bad.length===0?0:1)" ;;
  e3) mutate 's/| `auth-4` (giữ) |/| giữ |/' ;;
  e10) mutate 's#| `/compare` |#| /so-sánh |#' ;;
  e5) CHROME_EXE="${CHROME_EXE:-$HOME/Library/Caches/ms-playwright/chromium_headless_shell-1243/chrome-headless-shell-mac-arm64/chrome-headless-shell}" \
      node _acceptance/invest-target-map/verify-e5.js "$PWD/_acceptance/invest-target-map/ban-quyet-dinh.html" ;;
  *) echo "dùng: verify.sh e2|e3|e5|e10"; exit 2 ;;
esac
