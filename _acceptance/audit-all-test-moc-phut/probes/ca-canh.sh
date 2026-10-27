#!/bin/bash
# AC-1: ca canh «MP-AC-1» xanh trên bản sửa; ba bản sao đột biến của CÙNG tệp, mỗi bản đỏ với thông điệp ghim riêng:
#   go   — gỡ khoá date khỏi FAKES            → «dòng tiêu đề phải mang mốc ghim»
#   ghim — date giả trả mốc cho mọi đối số    → «date giả phải chuyển định dạng khác cho date thật»
#   log  — date giả thôi ghi nhật ký lời gọi  → «nhật ký lời gọi phải có date»
set -uo pipefail
ROOT="$(cd "$(dirname "$0")/../../.." && pwd)" || exit 2
echo "root $ROOT sha $(git -C "$ROOT" rev-parse HEAD)"
TAM=$(mktemp -d); trap 'rm -rf "$TAM"' EXIT
sed -e "s#^const REPO = .*#const REPO = \"$ROOT\";#" "$ROOT/scripts/audit-all.test.mjs" > "$TAM/sua.test.mjs"
grep -q "MP-AC-1" "$TAM/sua.test.mjs" || { echo "KHONG TIM THAY CA CANH"; exit 2; }
# Đột biến bằng thay chuỗi đúng nguyên văn; chuỗi không có trong tệp → dừng (bản sao không đổi thì đỏ/xanh không chứng gì).
node - "$TAM" <<'JS' || exit 2
const fs = require("fs"); const tam = process.argv[2];
const src = fs.readFileSync(`${tam}/sua.test.mjs`, "utf8");
const dong = src.split("\n").find((l) => l.startsWith("  date: "));
if (!dong) { console.log("KHONG TIM THAY BAN GIA DATE"); process.exit(2); }
const thay = (ten, cu, moi) => {
  if (!dong.includes(cu)) { console.log(`DOT BIEN ${ten} KHONG AP DUOC`); process.exit(2); }
  fs.writeFileSync(`${tam}/${ten}.test.mjs`, src.replace(dong, dong.replace(cu, moi)));
};
fs.writeFileSync(`${tam}/go.test.mjs`, src.replace(dong + "\n", ""));
thay("ghim", 'PATH=/usr/bin:/bin exec date "$@"', 'echo "${MOC_GHIM}"');
thay("log", 'echo "date $*" >> "$FAKE_LOG"; ', "");
JS
OUT=""
chay() { OUT=$(env -u NODE_TEST_CONTEXT node --test --test-name-pattern="MP-AC-1" "$1" 2>&1); }
so() { printf '%s\n' "$OUT" | sed -n "s/^ℹ $1 \([0-9]*\)$/\1/p" | tail -1; }
bad=0
chay "$TAM/sua.test.mjs"
if [ "$(so pass)" = 1 ] && [ "$(so fail)" = 0 ]; then echo "ban sua: ca canh xanh"; else echo "ban sua: ca canh KHONG xanh"; printf '%s\n' "$OUT" | tail -30; bad=1; fi
for cap in "go|dòng tiêu đề phải mang mốc ghim|ban go date gia" "ghim|date giả phải chuyển định dạng khác cho date thật|ban date tra moc moi doi so" "log|nhật ký lời gọi phải có date|ban bo ghi nhat ky"; do
  IFS='|' read -r ten tdiep nhan <<< "$cap"
  chay "$TAM/$ten.test.mjs"
  if [ "$(so fail)" = 1 ] && printf '%s\n' "$OUT" | grep -q "$tdiep"; then
    echo "$nhan: ca canh do, thong diep ghim co"
  else
    echo "CA CANH KHONG DO ($nhan)"; printf '%s\n' "$OUT" | tail -30; bad=1
  fi
done
[ $bad = 0 ] && echo "CA CANH OK"
exit $bad
