#!/usr/bin/env bash
# do-san-sl1-kdm AC-4 — thước gán khu vực và test của nó không ghi DB dùng chung ngoài giao dịch:
#  mỗi câu ghi (INSERT INTO, UPDATE … SET, DELETE FROM, DROP) trong hai tệp phải có một dòng BEGIN đứng trước nó và một
#  dòng ROLLBACK đứng sau nó trong cùng tệp; tự kiểm chiều đỏ: bản sao mỗi tệp chèn một câu ghi trước BEGIN đầu tiên thì
#  phép quét đỏ, gọi tên tệp và dòng.
set -uo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
TEP=("scripts/kiem-tin-rao-gan-khu-vuc.mjs" "scripts/kiem-tin-rao-gan-khu-vuc.test.mjs")
GHI='(INSERT INTO|UPDATE [a-z_]+ SET|DELETE FROM|DROP (TABLE|VIEW|FUNCTION))'
loi=0

# In «<tệp>:<dòng>» cho mỗi câu ghi không nằm giữa một BEGIN trước và một ROLLBACK sau; mã 1 khi có.
kiem() {
  local duong="$1" ten="$2"
  awk -v ten="$ten" -v re="$GHI" '
    { dong[NR] = $0 }
    /["`]BEGIN["`]/ { if (!b) b = NR }
    /ROLLBACK/ { r = NR }
    END {
      sai = 0
      for (i = 1; i <= NR; i++) {
        if (dong[i] ~ /^[[:space:]]*\/\//) continue
        if (dong[i] ~ re && !(b && b < i && r > i)) { print ten ":" i; sai = 1 }
      }
      exit sai
    }' "$duong"
}

for t in "${TEP[@]}"; do
  if out=$(kiem "$ROOT/$t" "$t"); then
    echo "khong-db-chung: $t — mọi câu ghi nằm giữa BEGIN và ROLLBACK"
  else
    echo "khong-db-chung: ĐỎ — câu ghi ngoài giao dịch: $out"; loi=1
  fi
done

# Chiều đỏ trên bản sao: chèn một câu ghi ngay dòng đầu (trước mọi BEGIN).
TMP=$(mktemp -d); trap 'rm -rf "$TMP"' EXIT
for t in "${TEP[@]}"; do
  awk 'NR==1{print; print "await c.query(\"UPDATE areas SET name = name\");"; next}1' "$ROOT/$t" > "$TMP/hong.mjs"
  if out=$(kiem "$TMP/hong.mjs" "$t"); then
    echo "khong-db-chung: ĐỎ — bản sao $t có câu ghi trước BEGIN mà phép quét không đỏ"; loi=1
  else
    echo "khong-db-chung: chiều đỏ đúng — $out"
  fi
done

[ "$loi" -eq 0 ] && echo "khong-db-chung: xanh" || echo "khong-db-chung: đỏ"
exit "$loi"
