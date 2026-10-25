#!/bin/bash
# AC-2 + AC-3: chỉ ba tệp test đổi; mọi dòng bị xoá/thêm trong chúng chỉ liên quan ghi manifest (không nới assert).
set -uo pipefail
R="${1:?gốc kho}"; cd "$R"; bad=0
base=$(git merge-base origin/main HEAD)
while read -r f; do
  case "$f" in
    scripts/nap-ts-order.test.mjs|scripts/zalo-import-job.test.mjs|scripts/job-exit.test.mjs|_acceptance/test-anh-mau-co-manifest/*|_acceptance/config.yaml|PRODUCT-MAP.md|LO-TRINH.html) echo "ok  $f";;
    *) echo "NGOÀI PHẠM VI $f"; bad=1;;
  esac
done < <(git diff --name-only "$base" HEAD)
xoa=$(git diff "$base" HEAD -- scripts/*.test.mjs | grep -E '^-[^-]' | grep -c 'assert' || true)
echo "dòng assert bị xoá/sửa: $xoa"; [ "$xoa" = 0 ] || bad=1
la=$(git diff "$base" HEAD -- scripts/*.test.mjs | grep -E '^\+[^+]' | grep -vE 'manifest|^\+\s*(//.*)?$|^\+\s*[{}]\s*$|mkdirSync|const d = |for \(const d of dirs\)' || true)
[ -z "$la" ] && echo "dòng thêm: chỉ ghi manifest" || { echo "DÒNG THÊM LẠ:"; echo "$la"; bad=1; }
[ "$bad" = 0 ] && echo "KHONG-NOI OK"; exit "$bad"
