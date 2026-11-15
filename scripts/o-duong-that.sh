#!/usr/bin/env bash
# o-duong-that.sh — mục «Ô đường thật» của audit-all.sh (hồ sơ tach-o-duong-dau-vao-ban). Chạy probe ô đường trên DB máy thu
# (agent/probes/o-duong-that.test.ts, chỉ SELECT), in MỘT dòng: ✅ kèm số giá trị và đếm theo lớp (thoát 0), hoặc ❌ kèm
# giá trị lệch (thoát 1). Người đọc: /ops-check (bước 2 chạy audit-all). ❌ = nguồn có kiểu viết ô đường mới → mở hàng sửa bộ tách.
# O_DUONG_DOT_BIEN=1 chạy probe bằng bản luật đột biến — chỉ để kiểm nhánh ❌.
set -u
export LC_ALL=en_US.UTF-8
# Gọi từ bên trong một lượt node --test (ca CD-AC-11) thì biến này biến lượt con thành tiến trình con của trình chạy cha và nuốt mã thoát.
unset NODE_TEST_CONTEXT
cd "$(dirname "$0")/../agent" || { echo "❌ Ô đường thật: không vào được agent/"; exit 1; }
OUT=$(O_DUONG_TRONG_SCRIPT=1 node --import tsx --test --test-reporter=tap --test-name-pattern='CD-AC-(8|12) probe' probes/o-duong-that.test.ts 2>&1)
MA=$?
GIA_TRI=$(printf '%s\n' "$OUT" | sed -n 's/.*CD-AC-8: \([0-9][0-9]*\) giá trị.*/\1/p' | head -1)
LOP=$(printf '%s\n' "$OUT" | grep -o 'CD-AC-12 lớp: .*' | head -1 | sed 's/CD-AC-12 //')
if [ "$MA" -eq 0 ] && [ -n "$GIA_TRI" ] && [ -n "$LOP" ]; then
  echo "✅ Ô đường thật: $GIA_TRI giá trị có cụm vị trí, 0 lệch · $LOP"
  exit 0
fi
LECH=$(printf '%s\n' "$OUT" | grep -m1 'ra Lệch' | sed 's/^[[:space:]]*//; s/^error: //' | sed -E 's/^(.{0,250}).*/\1/')
echo "❌ Ô đường thật: ${LECH:-probe không chạy được (mã $MA)}"
exit 1
