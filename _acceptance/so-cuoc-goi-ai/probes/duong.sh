#!/bin/bash
# AC-9 (so-cuoc-goi-ai): đường tới trang — thuật ngữ «Cuộc gọi AI» + `Slug URL: ai-calls` trong CONTEXT.md, test route-slugs
# xanh, mục menu Ops nhóm «Giám sát», dòng routes.md. Chiều đỏ: bản chép CONTEXT.md bỏ dòng slug (trong thư mục tạm) →
# route-slugs đỏ nêu 'ai-calls'.
set -uo pipefail
ROOT="$(cd "$(dirname "$0")/../../.." && pwd)" || exit 2; cd "$ROOT" || exit 2
echo "root $ROOT sha $(git rev-parse HEAD)"
bad=0
grep -q '^- Slug URL: `ai-calls`$' CONTEXT.md && echo "ok CONTEXT.md co Slug URL ai-calls" || { echo "THIEU SLUG ai-calls"; bad=1; }
grep -q '^\*\*Cuộc gọi AI\*\*' CONTEXT.md && echo "ok CONTEXT.md co thuat ngu Cuoc goi AI" || { echo "THIEU THUAT NGU"; bad=1; }
(cd app && node --test eslint-plugin-onehub-ui/tests/route-slugs.test.mjs >/dev/null 2>&1) && echo "ok route-slugs xanh" || { echo "ROUTE-SLUGS DO"; bad=1; }
node -e 'const s=require("fs").readFileSync("app/src/components/shell/nav.tsx","utf8");const m=s.match(/\{\s*id: "ai-calls",[\s\S]*?\}/);process.exit(m&&/href: "\/ops\/ai-calls"/.test(m[0])&&/group: "Giám sát"/.test(m[0])?0:1)' \
  && echo "ok nav co muc /ops/ai-calls nhom Giam sat" || { echo "THIEU MUC MENU"; bad=1; }
grep -q '^| `/ops/ai-calls` |' .claude/skills/onehub-ui/routes.md && echo "ok routes.md co dong /ops/ai-calls" || { echo "THIEU DONG ROUTES"; bad=1; }
# Chiều đỏ: chạy test route-slugs trên bản sao app/ + CONTEXT.md đã bỏ dòng slug (cây tạm, không đụng cây thật).
TAM=$(mktemp -d); trap 'rm -rf "$TAM"' EXIT
mkdir -p "$TAM/app"; cp -R app/eslint-plugin-onehub-ui "$TAM/app/"; ln -s "$ROOT/app/src" "$TAM/app/src"; ln -s "$ROOT/app/node_modules" "$TAM/app/node_modules"; ln -s "$ROOT/app/next.config.ts" "$TAM/app/next.config.ts"
grep -v '^- Slug URL: `ai-calls`$' CONTEXT.md > "$TAM/CONTEXT.md"
OUT=$(cd "$TAM/app" && node --test eslint-plugin-onehub-ui/tests/route-slugs.test.mjs 2>&1); rc=$?
if [ $rc -ne 0 ] && printf '%s' "$OUT" | grep -q 'ai-calls'; then echo "ban bo dong slug: do route-slugs neu ai-calls"; else echo "CA KHONG DO (rc $rc)"; bad=1; fi
[ $bad -eq 0 ] && echo "DUONG OK"
exit $bad
