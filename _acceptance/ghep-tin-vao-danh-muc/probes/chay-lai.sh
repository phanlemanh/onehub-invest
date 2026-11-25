#!/usr/bin/env bash
# chay-lai.sh — E6 (AC-6): chạy lại, đổi dữ liệu, tắt nguồn trên DB thử, rồi từng bản đột biến phải làm đỏ đúng ca.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"
cd "$ROOT"
LIB=pipeline/lib/ghep-tin-danh-muc-ghi.mjs
TEST=pipeline/tests/ghep-tin-danh-muc-ghi.itest.mjs
DOT="pipeline/lib/.dot-bien-ghi-$$.mjs"
LOG="$(mktemp)"; trap 'rm -f "$DOT" "$LOG"' EXIT
chay() { bash db/db-thu.sh oneinvest_suite_pl20_cl --chay node --test "$TEST" >"$LOG" 2>&1; }

echo "== Mã thật"
chay || { cat "$LOG"; echo "ĐỎ: itest bước ghi không xanh trên mã thật"; exit 1; }
grep -E '^ℹ (tests|pass|fail) ' "$LOG"

dot_bien() { # tên · chuỗi phải thấy trong nhật ký · chuỗi gốc · chuỗi thay
  node -e '
    const fs = require("fs"); const [lib, ra, goc, thay] = process.argv.slice(1);
    const s = fs.readFileSync(lib, "utf8");
    if (!s.includes(goc)) { console.error("đột biến không tìm thấy chuỗi gốc: " + goc); process.exit(3); }
    fs.writeFileSync(ra, s.replace(goc, thay));' "$LIB" "$DOT" "$3" "$4"
  if GHEP_GHI_LIB="$PWD/$DOT" chay; then echo "ĐỎ: đột biến «$1» không làm ca nào đỏ"; exit 1; fi
  grep -q "$2" "$LOG" || { cat "$LOG"; echo "ĐỎ: đột biến «$1» không in «$2»"; exit 1; }
  echo "đột biến «$1» → thấy «$2»"
}

echo "== Đột biến"
dot_bien bo-buoc-rut "bài hai dòng sống: S03:" "if (rutId.length) {" "if (false) {"
dot_bien khong-so-can-cu "ban-doc-moi-thay-dong-cu" "d.rule_id, chuan(d.evidence ?? {})]" "d.rule_id]"
dot_bien bo-khoa "lot-khac-giu-khoa-thi-bo-luot" "if (!duoc) {" "if (false) {"
echo "XANH: itest bước ghi và ba đột biến"
