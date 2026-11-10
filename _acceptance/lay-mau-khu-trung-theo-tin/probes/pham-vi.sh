#!/bin/bash
# AC-8 của lay-mau-khu-trung-theo-tin: tệp do commit riêng của nhánh đổi (không tính merge, trừ mọi commit đã có ở main) chỉ thuộc
# danh sách AC-8; paths của mọi eval đo vật vòng này cũng nằm trong danh sách (E8, E9 là test cũ chỉ chạy lại). Đối chứng: một tệp
# ngoài danh sách phải bị bắt. git log lỗi thì dừng, không rơi về danh sách rỗng.
set -uo pipefail
ROOT="$(cd "$(dirname "$0")/../../.." && pwd)" || exit 2; cd "$ROOT" || exit 2
echo "root $ROOT sha $(git rev-parse HEAD)"
duoc() {
  case "$1" in
    pipeline/lib/eval-labels.mjs|pipeline/label-sample.mjs|pipeline/label-ghep.mjs|pipeline/lib/ghep-mau.mjs|pipeline/lib/test-posts.mjs|\
    pipeline/lib/*.test.mjs|pipeline/scripts/*.test.mjs|pipeline/CLAUDE.md|_acceptance/config.yaml|_acceptance/lay-mau-khu-trung-theo-tin/*|\
    docs/*|PRODUCT-MAP.md|LO-TRINH.html) return 0 ;;
    *) return 1 ;;
  esac
}
vong=$(git log --no-merges --name-only --format= HEAD ^origin/main) || { echo "GIT LOG LOI"; exit 2; }
[ -n "$vong" ] || { echo "GIT LOG RONG: nhanh khong co commit rieng"; exit 2; }
tep=$( { printf '%s\n' "$vong"; git ls-files --others --exclude-standard; } | grep . | sort -u)
bad=0
while IFS= read -r f; do
  [ -z "$f" ] && continue
  if duoc "$f"; then echo "ok $f"; else echo "NGOAI PHAM VI $f"; bad=1; fi
done <<< "$tep"
paths=$(node -e 'const y=require("./pipeline/node_modules/yaml");const e=y.parse(require("fs").readFileSync("_acceptance/lay-mau-khu-trung-theo-tin/evals.yaml","utf8"));for(const v of e.evals){if(["E8","E9"].includes(v.id))continue;for(const p of v.paths??[])console.log(p)}' | sort -u) || { echo "DOC EVALS LOI"; exit 2; }
while IFS= read -r p; do
  [ -z "$p" ] && continue
  mau=$(printf '%s' "$p" | sed 's#\*\*#x#g; s#\*#x#g')
  duoc "$mau" || { echo "PATHS EVAL NGOAI PHAM VI $p"; bad=1; }
done <<< "$paths"
duoc "collector/x.ts" && { echo "LOI DOI CHUNG: tep ngoai danh sach lot"; bad=1; } || echo "ok doi chung: tep ngoai danh sach bi bat"
for f in collector app/ db/migrations .claude/hooks; do
  printf '%s\n' "$tep" | grep -q "^$f" && { echo "NGOAI PHAM VI CAM $f"; bad=1; }
done
[ "$bad" -eq 0 ] && echo "PHAM-VI OK"
exit $bad
