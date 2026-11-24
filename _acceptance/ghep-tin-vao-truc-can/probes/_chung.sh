#!/usr/bin/env bash
# _chung.sh — hàm dùng chung cho probe PL36: chạy một lệnh test (mã thật phải xanh), rồi từng bản đột biến phải làm đỏ đúng ca.
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
cd "$ROOT/pipeline"
LOG="$(mktemp -t pl36-probe)"
TAM_DS=()
don() { rm -f "$LOG" "${TAM_DS[@]}"; }
trap don EXIT

# xanh <mô tả> <lệnh…>
xanh() {
  local mo_ta="$1"; shift
  "$@" >"$LOG" 2>&1 || { cat "$LOG"; echo "ĐỎ: $mo_ta không xanh trên mã thật"; exit 1; }
  grep -E '^ℹ (tests|pass|fail) |thời gian' "$LOG" || true
}

# dot_bien <tên> <ca phải đỏ> <tệp gốc> <biến môi trường trỏ bản đột biến> <chuỗi gốc> <chuỗi thay> <lệnh…>
dot_bien() {
  local ten="$1" ca="$2" goc="$3" bien="$4" tu="$5" thay="$6"; shift 6
  local tam; tam="$(dirname "$goc")/.dot-bien-pl36-$$-$RANDOM.$(basename "$goc" | sed 's/.*\.//')"
  TAM_DS+=("$tam")
  node -e '
    const fs = require("fs"); const [goc, ra, tu, thay] = process.argv.slice(1);
    const s = fs.readFileSync(goc, "utf8");
    if (!s.includes(tu)) { console.error("đột biến không tìm thấy chuỗi gốc: " + tu); process.exit(3); }
    fs.writeFileSync(ra, s.replace(tu, thay));' "$goc" "$tam" "$tu" "$thay"
  if env "$bien=$PWD/$tam" "$@" >"$LOG" 2>&1; then echo "ĐỎ: đột biến «$ten» không làm ca nào đỏ"; exit 1; fi
  grep -q -- "$ca" "$LOG" || { tail -40 "$LOG"; echo "ĐỎ: đột biến «$ten» không làm đỏ ca «$ca»"; exit 1; }
  echo "đột biến «$ten» → ca «$ca» đỏ"
}
