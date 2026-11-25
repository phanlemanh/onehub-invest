#!/usr/bin/env bash
# kiem.sh — ZC15 E11 (AC-9): hồ sơ áp đủ năm mục có nội dung; kiem-sau chấm đúng bộ dòng mẫu; round-trip bằng chính
# collector API của nhánh (ĐẠT) và của main (KHÔNG ĐẠT đúng lý do). Hộp cát, không chạm máy thu, không DB.
# Chạy từ gốc kho. In 'AP-MAY-THU PASS' và thoát 0 khi mọi mục đạt.
set -uo pipefail
GOC="$(git rev-parse --show-toplevel)"
A="$GOC/_acceptance/s03-media-r2-allowlist/ap-may-thu"
R="$A/README.md"
LOI=()
loi() { LOI+=("$1"); echo "FAIL $1"; }
dat() { echo "ok   $1"; }

muc() { awk -v n="$1" '$0 ~ "^"n"\\. \\*\\*" {on=1; print; next} on && /^[0-9]+\. \*\*/ {on=0} on {print}' "${2:-$R}"; }
kiem_readme() {  # $1 = tệp README cần soát
  local f="$1" ok=1
  for n in 1 2 3 4 5; do
    muc "$n" "$f" | grep -qE '`[^`]+`|[0-9]+([,.][0-9]+)?%' || { echo "FAIL README mục $n không có lệnh hay con số"; ok=0; }
  done
  muc 1 "$f" | grep -q 'npm run build' || { echo "FAIL README mục 1 thiếu build dist"; ok=0; }
  muc 1 "$f" | grep -q 'media-host-suffixes.txt' || { echo "FAIL README mục 1 thiếu tệp hậu tố"; ok=0; }
  muc 1 "$f" | grep -q 'kickstart' || { echo "FAIL README mục 1 thiếu khởi động lại"; ok=0; }
  muc 1 "$f" | grep -q 'lời riêng của Mạnh' || { echo "FAIL README mục 1 thiếu «lời riêng của Mạnh»"; ok=0; }
  muc 1 "$f" | grep -q '05:30–06:30' || { echo "FAIL README mục 1 thiếu khung giờ cấm"; ok=0; }
  muc 2 "$f" | grep -q '27,5%' && muc 2 "$f" | grep -q '20,9%' || { echo "FAIL README mục 2 thiếu số trước/ước sau"; ok=0; }
  muc 3 "$f" | grep -q 'dist.bak-' || { echo "FAIL README mục 3 thiếu sao lưu dist"; ok=0; }
  muc 4 "$f" | grep -q 'dist.bak-' && muc 4 "$f" | grep -q 'kickstart' || { echo "FAIL README mục 4 thiếu lệnh lùi"; ok=0; }
  muc 5 "$f" | grep -q 'kiem-sau.mjs' || { echo "FAIL README mục 5 thiếu kiem-sau.mjs"; ok=0; }
  [ "$ok" = 1 ]
}

# 1. README thật
if kiem_readme "$R"; then dat "README năm mục có nội dung"; else loi "README"; fi
# 1b. tự phá: mục 2 thành «sẽ đo» → phải FAIL đúng mục 2
T=$(mktemp -d); trap 'rm -rf "$T"' EXIT
awk '/^2\. \*\*Số chạy thử/ {print "2. **Số chạy thử.** Sẽ đo sau."; skip=1; next} skip && /^[0-9]+\. \*\*/ {skip=0} !skip {print}' "$R" > "$T/README.md"
if out=$(kiem_readme "$T/README.md"); then loi "tự phá README mục 2 vẫn xanh"; else
  echo "$out" | grep -q 'README mục 2' && dat "tự phá README mục 2 → đỏ đúng mục" || loi "tự phá README mục 2 đỏ sai lý do: $out"; fi

# 2. bộ dòng mẫu
chay() { node "$A/kiem-sau.mjs" --tu-tep "$1" 2>&1; }
mau() {  # $1 tệp · $2 mã mong · $3 chuỗi phải có
  local out code; out=$(chay "$A/mau/$1"); code=$?
  if [ "$code" = "$2" ] && echo "$out" | grep -qF "$3"; then dat "mẫu $1 → $3"; else loi "mẫu $1: mã $code, '$out'"; fi
}
mau dat.json 0 "ĐẠT — 3 bài có ảnh"
mau con-r2-chan.json 1 "còn 1 ảnh r2.dev lỗi host-not-allowed"
mau con-redirect.json 1 "còn 1 ảnh lỗi redirect-host"
mau chua-co-r2.json 1 "chưa có ảnh r2.dev nào tải được"
mau khong-bai-moi.json 1 "chưa có bài mới có ảnh"

# 3. round-trip writer thật: dist của nhánh và của main
( cd "$GOC/collector" && npx tsc -p tsconfig.json >/dev/null 2>&1 ) || loi "build collector nhánh"
"$(command -v node)" "$A/sinh-dong-that.mjs" "$GOC/collector/dist" "$T/nhanh.json" && out=$(chay "$T/nhanh.json")
echo "$out" | grep -q '^ĐẠT — 3 bài có ảnh · 0 mất hết ảnh' && dat "round-trip nhánh → ĐẠT" || loi "round-trip nhánh: '$out'"
BASE=$(git -C "$GOC" merge-base HEAD origin/main)
mkdir -p "$T/main" && git -C "$GOC" archive "$BASE" collector | tar -x -C "$T/main" && ln -s "$GOC/collector/node_modules" "$T/main/collector/node_modules"
( cd "$T/main/collector" && npx tsc -p tsconfig.json >/dev/null 2>&1 ) || loi "build collector main"
node "$A/sinh-dong-that.mjs" "$T/main/collector/dist" "$T/main.json" && out=$(chay "$T/main.json")
echo "$out" | grep -q 'KHÔNG ĐẠT — còn 1 ảnh r2.dev lỗi host-not-allowed; còn 1 ảnh lỗi redirect-host' && dat "round-trip main ($(git -C "$GOC" rev-parse --short "$BASE")) → KHÔNG ĐẠT đúng lý do" || loi "round-trip main: '$out'"

if [ ${#LOI[@]} -eq 0 ]; then echo "AP-MAY-THU PASS"; exit 0; fi
echo "AP-MAY-THU FAIL (${#LOI[@]} mục)"; exit 1
