#!/bin/bash
# E10/AC-10 — phần .patch (ma-album-s03): áp collector/openclaw/ma-album-s03-extension.patch
# lên 568ed825b trong bản sao sạch → cây kết quả phải khớp ĐÚNG nhánh
# feat/s03-ma-album-ext (mã đã build + test). Không đụng kho nguồn.
set -euo pipefail
HERE="$(cd "$(dirname "$0")/../.." && pwd)"   # collector/openclaw
PATCH="$HERE/ma-album-s03-extension.patch"
SRC="${OPENCLAW_SRC:-$HOME/dev/openclaw}"
BASE="568ed825b"
[ -f "$PATCH" ] || { echo "E10 FAIL: thiếu $PATCH"; exit 1; }

T=$(mktemp -d /tmp/mas3-patch-XXXX)
trap 'rm -rf "$T"' EXIT
git clone -q --no-hardlinks "$SRC" "$T/repo"
cd "$T/repo"
git checkout -q "$BASE"
git apply --check "$PATCH" || { echo "E10 FAIL: patch không áp được lên $BASE"; exit 1; }
git apply "$PATCH"
git add -A
git -c user.email=t@t -c user.name=t commit -qm "applied"
# so cây base+patch với nhánh ext — patch chỉ chạm extensions/zalouser nên
# diff giới hạn đường dẫn đó; khác gì (kể cả dist/package.json local của môi
# trường dev không nằm trong nhánh ext vì chưa commit) đều là FAIL của patch
if git diff --quiet HEAD feat/s03-ma-album-ext -- extensions/zalouser; then
  # BÁO 0611-12: 2 kiểm tài liệu (E11 phần script) — không còn chữ «poll»
# chưa đo trong runtime-map + runbook; cả hai có dòng chạy lại mapper-runtime
# tài liệu nằm ở KHO onehub-invest (thư mục chứa script này), không phải
# clone kho nguồn extension ở $T/repo — kiểm đúng chỗ
REPO_OI="$(cd "$HERE/../.." && pwd)"
for f in docs/ops/runtime-map.md docs/ops/runbook-openclaw-hook.md; do
  if grep -qi "poll .*10 phút chưa đo\|10 phút chưa đo" "$REPO_OI/$f" 2>/dev/null; then
    echo "E10 FAIL: $f vẫn còn «poll 10 phút chưa đo»"; exit 1
  fi
  grep -q "mapper-runtime.test.mjs" "$REPO_OI/$f" || { echo "E10 FAIL: $f thiếu dòng chạy lại mapper-runtime.test.mjs"; exit 1; }
done
echo "E10 PASS: .patch áp lên $BASE ra đúng mã nhánh feat/s03-ma-album-ext (extensions/zalouser) + tài liệu sạch poll / có mapper-runtime"
else
  echo "E10 FAIL: base+patch KHÁC nhánh ext:"; git diff --stat HEAD feat/s03-ma-album-ext -- extensions/zalouser | tail -3
  exit 1
fi
