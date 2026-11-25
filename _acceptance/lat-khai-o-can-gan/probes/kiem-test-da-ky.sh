#!/usr/bin/env bash
# Các tệp test của hồ sơ đã ký về màn Gắn nhãn phải giữ nguyên so với điểm rẽ khỏi main.
set -euo pipefail
goc="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
cd "$goc"
base="$(git merge-base HEAD origin/main)"
git diff --exit-code "$base" HEAD -- app/tests/labels.test.tsx app/tests/labels-nhom.test.tsx app/tests/labels-gia.test.tsx app/tests/labels-nguoi-dang.test.tsx app/tests/labels-mau.test.tsx app/tests/labels-truong-moi-chuan.test.ts app/tests/labels-truong-moi-route.test.tsx
echo "test da ky khong doi so voi $base"
