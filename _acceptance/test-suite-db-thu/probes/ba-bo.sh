#!/usr/bin/env bash
# ba-bo.sh — hồ sơ test-suite-db-thu E5, E6, E7. Đo lần lượt app, pipeline, agent bằng lay-mau.mjs. Không song song: lượt chấm chạy
# cùng lúc đúng ba bộ này ở bước suite, thêm ba bộ nữa thì ca chờ khoá 33033 vượt trần vì máy quá tải (lượt chấm 1, 05/11).
# Bộ app đo sau cùng vì nặng nhất, tránh trùng trọn lượt với bộ app của bước suite.
# In một dòng JSON mỗi bộ; bộ đỏ in thêm phần tổng kết. Nhật ký trọn ở .acceptance-runs/test-suite-db-thu/.
set -uo pipefail
GOC="$(cd "$(dirname "$0")/../../.." && pwd)"
NK="$GOC/.acceptance-runs/test-suite-db-thu"
mkdir -p "$NK"
ma=0
for bo in ${BA_BO:-pipeline agent app}; do
  log="$NK/lay-mau-$bo.log"
  (cd "$GOC" && node _acceptance/test-suite-db-thu/probes/lay-mau.mjs "$bo" npm test) > "$log" 2>&1
  r=$?
  /usr/bin/grep -E '^\{"lenh"' "$log" | sed "s/^/$bo: /"
  if [ "$r" -ne 0 ]; then
    ma=1
    echo "$bo đỏ (mã $r), nhật ký $log"
    /usr/bin/awk '/failing tests:/{f=1} f' "$log" | head -40
    /usr/bin/grep -E '^(lượt còn|thước hỏng)' "$log"
  fi
done
exit "$ma"
