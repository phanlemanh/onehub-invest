#!/usr/bin/env bash
# s02-cua-api — AC-11, AC-12 (ZT viết, 27/11): giá trị phiên không rời bộ nhớ; bộ test không chạm profile thật.
# Soát tĩnh trên mã của nhánh, rồi tự phá: mỗi chốt có một bản chép cấy lỗi phải làm nó đỏ.
# Không đọc profile, không chạy bộ thu. Tệp được tìm theo hàm nó xuất — không gõ tên nguồn ở đây.
set -u
ROOT=$(git rev-parse --show-toplevel)
SRC="$ROOT/collector/src"
PHIEN=$(grep -l 'export function docPhienTuProfile' "$SRC"/collectors/*.ts)
BOTHU=$(grep -l 'export function docExpAppToken' "$SRC"/collectors/*.ts)
TESTS=$(ls "$SRC"/test/s02-*.test.ts)
do=0

# Chốt 1 (AC-11): mô-đun phiên không in, không ghi tệp, không ghi log.
chot_phien() { ! grep -n -E 'writeFile|appendFile|createWriteStream|console\.|process\.std(out|err)|\blog\(' "$1" >/dev/null; }
# Chốt 2 (AC-11): không dòng log / thông điệp lỗi nào của bộ thu nội suy một biến mang token hay phiên.
chot_log() {
  ! grep -E '(\blog\(|console\.[a-z]+\(|Error\(|Loi[A-Za-z]*\()' "$1" \
    | grep -o -E '\$\{[^}]*\}' | grep -i -E 'token|\brt\b|refresh|phien|giaTri|auth|bearer' >/dev/null
}
# Chốt 3 (AC-12): bộ test của hàng không gọi lượt thu, không dùng đường profile mặc định của mô-đun,
# và mọi lời gọi CLI vào nguồn S02 đặt S02_PROFILE_DIR (thư mục tạm).
chot_test() {
  local f
  for f in "$@"; do
    grep -n -E '\.collect\(|\bPROFILE_DIR\b' "$f" >/dev/null && return 1
    grep -E 'chayCli\(\[' "$f" | grep -v '"example"' | grep -v 'S02_PROFILE_DIR' | grep -q . && return 1
  done
  return 0
}

bao() { if "$@"; then echo "đạt: bản thật · $NHAN"; else echo "ĐỎ: bản thật · $NHAN"; do=1; fi; }
bat() { if "$@"; then echo "ĐỎ: bản đột biến ($NHAN) KHÔNG bị bắt"; do=1; else echo "đạt: bản đột biến ($NHAN) bị bắt"; fi; }

NHAN="AC-11 mô-đun phiên không in, không ghi tệp"; bao chot_phien "$PHIEN"
NHAN="AC-11 log và thông điệp lỗi của bộ thu không nội suy token hay phiên"; bao chot_log "$BOTHU"
NHAN="AC-11 log và thông điệp lỗi của mô-đun phiên không nội suy token hay phiên"; bao chot_log "$PHIEN"
NHAN="AC-12 bộ test không gọi lượt thu, không dùng profile mặc định, CLI S02 có S02_PROFILE_DIR"; bao chot_test $TESTS

T=$(mktemp -d); trap 'rm -rf "$T"' EXIT
cp "$PHIEN" "$T/phien.ts"; echo 'console.log(giaTri);' >> "$T/phien.ts"
NHAN="mô-đun phiên in giá trị"; bat chot_phien "$T/phien.ts"
cp "$BOTHU" "$T/bothu.ts"; printf '%s\n' '  log(`rt=${rt}`);' >> "$T/bothu.ts"
NHAN="bộ thu ghi refresh token vào log"; bat chot_log "$T/bothu.ts"
cp "$BOTHU" "$T/bothu2.ts"; printf '%s\n' '  throw new Error(`token ${appToken} hết hạn`);' >> "$T/bothu2.ts"
NHAN="thông điệp lỗi mang appToken"; bat chot_log "$T/bothu2.ts"
printf '%s\n' 'await boThu.collect(ctx);' > "$T/a.test.ts"
NHAN="test gọi lượt thu"; bat chot_test "$T/a.test.ts"
printf '%s\n' 'const r = chayCli(["login", "--source", "nguon-s02"], { S02_CHROME_BIN: "/usr/bin/true" });' > "$T/b.test.ts"
NHAN="test gọi CLI S02 không đặt S02_PROFILE_DIR"; bat chot_test "$T/b.test.ts"
printf '%s\n' 'docPhienTuProfile(PROFILE_DIR, KHOA);' > "$T/c.test.ts"
NHAN="test đọc profile mặc định"; bat chot_test "$T/c.test.ts"

if [ "$do" = 0 ]; then echo XANH; exit 0; else echo ĐỎ; exit 1; fi
