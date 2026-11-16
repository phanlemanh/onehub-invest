#!/usr/bin/env bash
# probe-du-lieu-that.sh — mục B5 «Probe dữ liệu thật» của audit-all.sh (hồ sơ l2-bao-thu-doi-probe-that). Chạy bốn probe dữ liệu
# thật đã dời khỏi suite chung, chỉ SELECT trên DB máy thu, mỗi tệp một dòng ✅/❌. Toàn ✅ thoát 0; có ❌ thoát 1.
# Người đọc: /ops-check (bước 2 chạy audit-all). ❌ = dữ liệu mới phạm một bất biến đã ký → mở hàng sửa luật hay sửa probe.
# PROBE_GIA_DO=<tên tệp> làm đúng tệp ấy ❌ (kiểm nhánh lỗi, không sửa mã nguồn). Lượt này không chạy chiều đỏ, không ghi tệp tạm.
set -u
export LC_ALL=en_US.UTF-8
# Gọi từ bên trong một lượt node --test thì biến này nuốt mã thoát của lượt con.
unset NODE_TEST_CONTEXT
GOC="$(cd "$(dirname "$0")/.." && pwd)"
LOI=0
chay() { # <module> <tệp> <tên>
  local OUT MA DIEN DONG
  OUT=$(cd "$GOC/$1" && PROBE_TRONG_SCRIPT=1 node --import tsx --test --test-reporter=tap "$2" 2>&1)
  MA=$?
  DIEN=$(printf '%s\n' "$OUT" | grep -m1 -E '^# (KD-AC-6|TPL-AC-6|CD-AC|LT-AC)' | sed 's/^# //' | sed -E 's/^(.{0,200}).*/\1/')
  if [ "$MA" -eq 0 ]; then
    echo "✅ $3${DIEN:+ · $DIEN}"
  else
    DONG=$(printf '%s\n' "$OUT" | grep -v -E '^#|^(not )?ok ' | grep -m1 -E 'PROBE_GIA_DO|AssertionError|LT-AC-6|KD-AC-6|TPL-AC-6|AC-9' | sed 's/^[[:space:]]*//; s/^error: //' | sed -E 's/^(.{0,250}).*/\1/')
    echo "❌ $3: ${DONG:-mã $MA}"
    LOI=1
  fi
}
chay agent probes/khong-dau-that.test.ts khong-dau-that
chay agent probes/judge-luat-that.test.ts judge-luat-that
chay agent probes/context-resolver-that.test.ts context-resolver-that
chay app probes/the-duyet-phuong-that.test.tsx the-duyet-phuong-that
exit $LOI
