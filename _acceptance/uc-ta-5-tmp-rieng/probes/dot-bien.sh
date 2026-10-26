#!/bin/bash
# UC-TA-5 vẫn có răng: bản chép ui-capture-login.mjs bỏ bước dọn thư mục tạm → ca phải ĐỎ; bản thật → XANH.
set -uo pipefail
R="${1:?gốc kho}"; T=$(mktemp -d); trap 'rm -rf "$T"' EXIT
mkdir -p "$T/scripts"; cp "$R/scripts/ui-capture-login.mjs" "$R/scripts/ui-capture-login.test.mjs" "$T/scripts/"
cp -R "$R/scripts/." "$T/scripts/"
ln -s "$R/app" "$T/app"
o=$(cd "$T" && node --test --test-name-pattern="UC-TA-5" scripts/ui-capture-login.test.mjs 2>&1)
echo "$o" | grep -qx "ℹ fail 0" && echo "ok   bản thật: UC-TA-5 xanh" || { echo "FAIL bản thật không xanh"; echo "$o" | tail -5; exit 1; }
n=$(grep -c 'rmSync(tmp' "$T/scripts/ui-capture-login.mjs"); [ "$n" -ge 1 ] || { echo "FAIL khuôn đột biến lệch (không thấy rmSync(tmp)"; exit 1; }
sed -i '' 's/rmSync(tmp,/void (tmp,/g' "$T/scripts/ui-capture-login.mjs"
o=$(cd "$T" && node --test --test-name-pattern="UC-TA-5" scripts/ui-capture-login.test.mjs 2>&1)
echo "$o" | grep -qx "ℹ fail 0" && { echo "FAIL đột biến bỏ dọn thư mục tạm KHÔNG bị bắt"; exit 1; } || echo "ok   đột biến bỏ dọn thư mục tạm → UC-TA-5 đỏ"
echo "DOT-BIEN OK"
