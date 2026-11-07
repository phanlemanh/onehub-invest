#!/bin/bash
# AC-10 của truong-nhan-s03-081: tệp do commit riêng của nhánh đổi (không tính merge, trừ mọi commit đã có ở main) chỉ thuộc danh
# sách ở AC-10; paths của mọi eval cũng nằm trong danh sách. Đối chứng: một tệp ngoài danh sách phải bị bắt.
set -uo pipefail
ROOT="$(cd "$(dirname "$0")/../../.." && pwd)" || exit 2; cd "$ROOT" || exit 2
echo "root $ROOT sha $(git rev-parse HEAD)"
tep_vong() { git log --no-merges --name-only --format= HEAD ^origin/main | sort -u; }
duoc() {
  case "$1" in
    db/migrations/081_*|app/src/lib/labels-normalize.ts|app/src/lib/labels-queries.ts|app/src/lib/labels-luot-hai.ts|\
    app/src/lib/labels-s08.ts|app/src/lib/vocab.generated.ts|app/src/components/ops/labels/*|app/src/app/api/v1/ops/labels/*|\
    app/tests/*|pipeline/mappings.yaml|pipeline/vocab*.mjs|pipeline/lib/vocab.generated.mjs|pipeline/lib/eval-classify.mjs|\
    pipeline/eval-classify.mjs|pipeline/lib/eval-classify.test.mjs|pipeline/scripts/*.test.mjs|agent/src/vocab.generated.ts|\
    CONTEXT.md|docs/*|_acceptance/config.yaml|_acceptance/truong-nhan-s03-081/*|PRODUCT-MAP.md|LO-TRINH.html) return 0 ;;
    *) return 1 ;;
  esac
}
tep=$( { tep_vong; git ls-files --others --exclude-standard; } | grep . | sort -u) || { echo "GIT LOG LOI"; exit 2; }
bad=0
while IFS= read -r f; do
  [ -z "$f" ] && continue
  if duoc "$f"; then echo "ok $f"; else echo "NGOAI PHAM VI $f"; bad=1; fi
done <<< "$tep"
# paths của mọi eval: mỗi glob phải nằm trong danh sách (đổi ** và * thành một tên mẫu để so).
paths=$(node -e 'const y=require("./pipeline/node_modules/yaml");const e=y.parse(require("fs").readFileSync("_acceptance/truong-nhan-s03-081/evals.yaml","utf8"));for(const v of e.evals)for(const p of v.paths??[])console.log(p)' | sort -u) || { echo "DOC EVALS LOI"; exit 2; }
# Đường rời máy (E7 đọc, không sửa) và test cũ chạy lại không thuộc phạm vi sửa: bỏ qua đúng các đường đó.
CHI_DOC='^(pipeline/sync-cloud\.mjs|pipeline/push-ops-facts\.mjs|scripts/cloud-sync\.sh|data-api/src/\*\*|db/migrations/\*\*)$'
while IFS= read -r p; do
  [ -z "$p" ] && continue
  printf '%s\n' "$p" | grep -Eq "$CHI_DOC" && { echo "ok chi doc $p"; continue; }
  mau=$(printf '%s' "$p" | sed 's#\*\*#x#g; s#\*#x#g')
  duoc "$mau" || { echo "PATHS EVAL NGOAI PHAM VI $p"; bad=1; }
done <<< "$paths"
duoc "collector/x.ts" && { echo "LOI DOI CHUNG: tep ngoai danh sach lot"; bad=1; } || echo "ok doi chung: tep ngoai danh sach bi bat"
for f in collector pipeline/sync-cloud.mjs .claude/hooks; do
  printf '%s\n' "$tep" | grep -q "^$f" && { echo "NGOAI PHAM VI CAM $f"; bad=1; }
done
[ "$bad" -eq 0 ] && echo "PHAM-VI OK"
exit $bad
