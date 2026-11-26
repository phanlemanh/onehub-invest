#!/usr/bin/env bash
# _chung.sh — hàm dùng chung cho probe PL36: chạy một lệnh test (mã thật phải xanh), rồi từng bản đột biến phải làm đỏ đúng ca.
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
cd "$ROOT/pipeline"
LOG="$(mktemp -t pl36-probe)"
TAM_DS=()
# Bản đột biến SQL ra thư mục tạm NGOÀI kho: tệp ẩn trong db/migrations bị bộ dựng DB thử (thuMucMigration chép mọi *.sql) của
# suite chạy song song áp trước 001 → ci-db-init thoát 2 (đo S4 r1 M5: 15 ca CG9/CG10 đỏ ở pipeline_a, E11).
TAM_DIR="$(mktemp -d -t pl36-dot-bien)"
don() { rm -rf "$LOG" "$TAM_DIR" ${TAM_DS[@]+"${TAM_DS[@]}"}; }
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
  local duoi tam; duoi="$(basename "$goc" | sed 's/.*\.//')"
  # .mjs cạnh tệp gốc (import tương đối phải còn đúng), đường tuyệt đối; .sql ra thư mục tạm ngoài kho.
  if [ "$duoi" = "sql" ]; then tam="$TAM_DIR/$(basename "$goc")"
  else tam="$(cd "$(dirname "$goc")" && pwd)/.dot-bien-pl36-$$-$RANDOM.$duoi"; TAM_DS+=("$tam"); fi
  node -e '
    const fs = require("fs"); const [goc, ra, tu, thay] = process.argv.slice(1);
    const s = fs.readFileSync(goc, "utf8");
    if (!s.includes(tu)) { console.error("đột biến không tìm thấy chuỗi gốc: " + tu); process.exit(3); }
    fs.writeFileSync(ra, s.replace(tu, thay));' "$goc" "$tam" "$tu" "$thay"
  if env "$bien=$tam" "$@" >"$LOG" 2>&1; then echo "ĐỎ: đột biến «$ten» không làm ca nào đỏ"; exit 1; fi
  # «Đúng ca đỏ» = chuỗi ca (tên ca hay thông điệp assert) nằm trong phần «✖ failing tests:» của reporter — phần đó chỉ liệt ca
  # đỏ và thông điệp của chúng; tên ca xanh vẫn in ở phần trên nên grep cả log không phân biệt được (finding r1, hình dạng 4).
  sed -n '/^✖ failing tests:/,$p' "$LOG" | grep -qF -- "$ca" || { tail -40 "$LOG"; echo "ĐỎ: đột biến «$ten» không làm đỏ ca «$ca»"; exit 1; }
  echo "đột biến «$ten» → ca «$ca» đỏ"
}
