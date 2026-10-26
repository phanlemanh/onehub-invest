#!/bin/bash
# AC-3: tệp đổi so với điểm rẽ nhánh khỏi origin/main chỉ là tệp test + hồ sơ + cấu hình + tệp máy sinh; tệp test chỉ THÊM dòng.
set -uo pipefail
cd "$(git rev-parse --show-toplevel)" || exit 2
base=$(git merge-base origin/main HEAD) || { echo "KHONG TINH DUOC DIEM RE NHANH"; exit 2; }
tep=$(git diff --name-only "$base" HEAD) || { echo "GIT DIFF LOI"; exit 2; }
# Đối chứng dương: phải có chính tệp test trong diff — diff rỗng (ví dụ chạy sau merge, base = HEAD) không được tính là đạt.
printf '%s\n' "$tep" | grep -qx 'agent/tests/enrich-db.test.ts' || { echo "KHONG THAY TEP TEST TRONG DIFF (base $base)"; exit 1; }
bad=0
while IFS= read -r f; do
  [ -z "$f" ] && continue
  case "$f" in
    agent/tests/enrich-db.test.ts|_acceptance/enrich-db-test-khoanh-tin/*|_acceptance/config.yaml|PRODUCT-MAP.md|LO-TRINH.html) echo "ok $f" ;;
    *) echo "NGOAI PHAM VI $f"; bad=1 ;;
  esac
done <<< "$tep"
# numstat: cột 1 dòng thêm, cột 2 dòng xoá — đếm mọi dòng xoá, kể cả dòng trống và dòng mở đầu bằng '-'.
read -r them xoa _ < <(git diff --numstat "$base" HEAD -- agent/tests/enrich-db.test.ts) || { echo "NUMSTAT LOI"; exit 2; }
echo "tep test: them $them xoa $xoa"
[ "${them:-0}" -gt 0 ] || { echo "TEP TEST KHONG THEM DONG NAO"; bad=1; }
[ "${xoa:-1}" -eq 0 ] || { echo "XOA DONG $xoa"; bad=1; }
# Đối chứng bộ đếm xoá: hai tệp tạm khác đúng ở một dòng trống và một dòng mở đầu bằng '-' (đúng hai loại mà grep '^-[^-]' cũ
# bỏ sót) — numstat phải đếm 2 dòng xoá.
t=$(mktemp -d); printf 'a\n\n-x\nb\n' > "$t/cu"; printf 'a\nb\n' > "$t/moi"
read -r _ xoa_dc _ < <(git diff --no-index --numstat "$t/cu" "$t/moi"); rm -rf "$t"
echo "doi chung bo dem xoa: $xoa_dc/2"
[ "${xoa_dc:-0}" -eq 2 ] || { echo "BO DEM XOA KHONG BAT DONG TRONG / DONG '-'"; bad=1; }
[ "$bad" -eq 0 ] && echo "PHAM-VI OK"
exit $bad
