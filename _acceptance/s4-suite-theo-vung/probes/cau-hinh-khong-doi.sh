#!/usr/bin/env bash
# E6 (AC-6, vế «lệnh cũ không đổi»): so _acceptance/config.yaml của nhánh với merge-base origin/main — dòng bị xoá
# hay sửa chỉ được là dòng suite_keys; mọi executors.test.* và executors.script.portal_static giữ nguyên từng byte.
# Chiều đỏ ngay trong probe: bản diff giả sửa một ký tự lệnh test.app phải bị bắt.
set -uo pipefail
GOC=$(git rev-parse --show-toplevel)
BASE=${S4V_BASE:-$(git -C "$GOC" merge-base origin/main HEAD)} || { echo "cau-hinh: không giải được merge-base"; exit 2; }

kiem() { # stdin: diff unified; in dòng bị xoá ngoài suite_keys
  grep -E '^-[^-]' | grep -vE '^-  suite_keys: \[' || true
}

xoa=$(git -C "$GOC" diff "$BASE" -- _acceptance/config.yaml | kiem)
if [ -n "$xoa" ]; then
  echo "cau-hinh: ĐỎ — dòng cũ bị xoá/sửa ngoài suite_keys:"; echo "$xoa"; exit 1
fi
# executors.script.portal_static và executors.test.<các tên bị bọc> còn nguyên ở HEAD như ở gốc.
# Giữ cả `pipeline`: nó thôi nằm trong suite_keys (tach-suite-pipeline 13/11) nhưng key vẫn sống trên main.
# `scripts`: suite thứ tám (suite-scripts-vao-luot-cham) không bọc nguyên văn, nhưng executors.test.scripts phải còn nguyên.
for k in agent app app_ui pipeline pipeline_a pipeline_b ui_lint_rules portal_static scripts; do
  a=$(git -C "$GOC" show "$BASE:_acceptance/config.yaml" | grep -E "^    $k: " | grep -v suite-neu-doi)
  b=$(grep -E "^    $k: " "$GOC/_acceptance/config.yaml" | grep -v suite-neu-doi)
  [ "$a" = "$b" ] || { echo "cau-hinh: ĐỎ — lệnh $k lệch gốc"; exit 1; }
done
# chiều đỏ của chính thước
gia=$(printf -- '--- a\n+++ b\n-    app: "cd app && npx tsc --noEmit && npm run lint"\n+    app: "cd app && npx tsc --noEmit && npm run lint "\n' | kiem)
[ -n "$gia" ] || { echo "cau-hinh: thước hỏng — diff giả sửa test.app không bị bắt"; exit 3; }
echo "cau-hinh: xanh — chỉ suite_keys đổi; chín lệnh cũ (bảy suite bọc + pipeline + scripts) nguyên byte (gốc $BASE)"
