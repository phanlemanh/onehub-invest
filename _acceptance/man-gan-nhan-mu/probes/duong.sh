#!/bin/bash
# AC-9 (man-gan-nhan-mu, E12): đường tới trang — thuật ngữ «Gắn nhãn» + `Slug URL: labels` và «Nhãn đánh giá» trong
# CONTEXT.md, test route-slugs xanh, mục menu Ops nhóm «Xử lý», dòng routes.md + portals.md, quyền label.write (vai ops,
# không bearer). Chiều đỏ: bản chép nav.tsx bỏ mục (thư mục tạm) → cùng bộ kiểm báo 'THIEU MUC NAV'.
set -uo pipefail
ROOT="$(cd "$(dirname "$0")/../../.." && pwd)" || exit 2; cd "$ROOT" || exit 2
echo "root $ROOT sha $(git rev-parse HEAD)"
bad=0
grep -q '^- Slug URL: `labels`$' CONTEXT.md && grep -q '^\*\*Gắn nhãn\*\*' CONTEXT.md && grep -q '^\*\*Nhãn đánh giá\*\*' CONTEXT.md \
  && echo "ok context: Gan nhan (Slug URL labels) + Nhan danh gia" || { echo "THIEU THUAT NGU"; bad=1; }
(cd app && node --test eslint-plugin-onehub-ui/tests/route-slugs.test.mjs >/dev/null 2>&1) && echo "ok route-slugs xanh" || { echo "ROUTE-SLUGS DO"; bad=1; }
kiem_nav() { node -e 'const s=require("fs").readFileSync(process.argv[1],"utf8");const m=s.match(/\{[^{}]*id: "labels",[\s\S]*?\n    \}/);process.exit(m&&/href: "\/ops\/labels"/.test(m[0])&&/group: "Xử lý"/.test(m[0])?0:1)' "$1"; }
kiem_nav app/src/components/shell/nav.tsx && echo "ok nav: muc /ops/labels nhom Xu ly" || { echo "THIEU MUC NAV"; bad=1; }
grep -q '^| `/ops/labels` |' .claude/skills/onehub-ui/routes.md && echo "ok routes" || { echo "THIEU DONG ROUTES"; bad=1; }
grep -q '^| `/ops/labels` |' docs/architecture/portals.md && echo "ok portals" || { echo "THIEU DONG PORTALS"; bad=1; }
grep -q '"label.write": { vai: "ops", bearer: false }' app/src/lib/ops-access.ts && echo "ok quyen label.write: vai ops, khong bearer" || { echo "SAI QUYEN label.write"; bad=1; }
TAM=$(mktemp -d); trap 'rm -rf "$TAM"' EXIT
node -e 'const fs=require("fs");const s=fs.readFileSync(process.argv[1],"utf8");fs.writeFileSync(process.argv[2],s.replace(/\n    \{\n      \/\/ Gắn nhãn[\s\S]*?id: "labels",[\s\S]*?\n    \},/,""))' app/src/components/shell/nav.tsx "$TAM/nav.tsx"
if ! cmp -s app/src/components/shell/nav.tsx "$TAM/nav.tsx" && ! kiem_nav "$TAM/nav.tsx"; then echo "ok doi chung: ban bo muc nav bi bat 'THIEU MUC NAV'"; else echo "DOI CHUNG NAV KHONG DO"; bad=1; fi
[ $bad -eq 0 ] && echo "DUONG OK"
exit $bad
