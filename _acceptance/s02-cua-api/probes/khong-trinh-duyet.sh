#!/usr/bin/env bash
# Phép đo AC-1 và AC-7 (hồ sơ s02-cua-api), soi TĨNH mã nguồn — không chạy gì:
#   AC-1: hai tệp bộ thu S02 (tệp xuất docExpAppToken, tệp xuất docPhienTuProfile) không nhập playwright-core,
#         không launchPersistentContext, không chromium. — vế KHÔNG-BẮN: không tệp nào còn mở trình duyệt.
#   AC-7: dòng chuẩn «AUTH FAIL [S02] ${new Date().toISOString()}» và chuỗi «401 sau refresh token» nằm cùng ở
#         ĐÚNG MỘT tệp bộ thu; không tệp bộ thu nào khác chứa literal đó (kể cả chú thích).
# Chiều đỏ: cùng phép kiểm trên một tệp tạm có chứa dòng nhập playwright-core thì phải ĐỎ.
set -uo pipefail
ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"; cd "$ROOT"

F_BO_THU="$(grep -l "export function docExpAppToken" collector/src/collectors/*.ts | head -1)"
F_PHIEN="$(grep -l "export function docPhienTuProfile" collector/src/collectors/*.ts | head -1)"
if [ -z "$F_BO_THU" ] || [ -z "$F_PHIEN" ]; then echo "ĐỎ: không tìm đủ hai tệp bộ thu S02 (xuất docExpAppToken, xuất docPhienTuProfile)"; exit 1; fi

mo_trinh_duyet() { grep -nE 'from "playwright-core"|launchPersistentContext|chromium\.' "$1"; }

# ---- AC-1: lượt thu không mở trình duyệt
for p in "$F_BO_THU:tệp bộ thu (xuất docExpAppToken)" "$F_PHIEN:tệp phiên (xuất docPhienTuProfile)"; do
  t="${p%%:*}"; v="${p#*:}"
  if [ -n "$(mo_trinh_duyet "$t")" ]; then echo "ĐỎ: $v còn mở trình duyệt:"; mo_trinh_duyet "$t"; exit 1; fi
  echo "đạt: bản thật · AC-1 $v không nhập playwright-core, không mở trình duyệt"
done

# ---- AC-7: dòng chuẩn ở đúng một tệp, cùng chuỗi «401 sau refresh token»
SO_TEP="$(grep -l "AUTH FAIL \[S02\]" collector/src/collectors/*.ts | wc -l | tr -d ' ')"
if grep -q 'AUTH FAIL \[S02\] ${new Date().toISOString()}' "$F_BO_THU" && grep -q "401 sau refresh token" "$F_BO_THU" && [ "$SO_TEP" = "1" ]; then
  echo "đạt: bản thật · AC-7 dòng AUTH FAIL [S02] kèm mốc ISO và chuỗi «401 sau refresh token» cùng ở đúng một tệp bộ thu"
else
  echo "ĐỎ: dòng chuẩn AUTH FAIL [S02] phải ở đúng tệp bộ thu (cùng chuỗi «401 sau refresh token»); thấy literal ở $SO_TEP tệp"; exit 1
fi

# ---- chiều đỏ của AC-7: cấy thêm một tệp bộ thu chứa literal đó → phép đếm phải không còn là 1
CAY="collector/src/collectors/zz-cay-auth-fail.ts"
printf '%s\n' '// AUTH FAIL [S02] chỉ được ở một tệp' > "$CAY"
SO_CAY="$(grep -l "AUTH FAIL \[S02\]" collector/src/collectors/*.ts | wc -l | tr -d ' ')"
rm -f "$CAY"
if [ "$SO_CAY" != "1" ]; then
  echo "đạt: bản đột biến (tệp cấy chứa literal AUTH FAIL) bị bắt ở ô: AC-7 dòng chuẩn ở đúng một tệp bộ thu"
else
  echo "ĐỎ: thước mù — cấy thêm tệp chứa literal AUTH FAIL mà phép đếm vẫn là 1"; exit 1
fi

# ---- chiều đỏ: tệp cấy nhập playwright-core thì phép kiểm AC-1 phải đỏ
T="$(mktemp)"; printf '%s\n' 'import { chromium } from "playwright-core";' > "$T"
if [ -n "$(mo_trinh_duyet "$T")" ]; then
  echo "đạt: bản đột biến (tệp cấy nhập playwright-core) bị bắt ở ô: AC-1 tệp bộ thu không nhập playwright-core"
else
  rm -f "$T"; echo "ĐỎ: thước mù — tệp cấy nhập playwright-core mà phép kiểm vẫn xanh"; exit 1
fi
rm -f "$T"
echo "XANH"
