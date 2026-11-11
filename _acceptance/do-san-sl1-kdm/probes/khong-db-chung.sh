#!/usr/bin/env bash
# do-san-sl1-kdm AC-4 — thước gán khu vực và test của nó không ghi DB dùng chung ngoài giao dịch.
# Quan hệ đo (không phải chuỗi có mặt): với mỗi câu ghi (INSERT INTO, UPDATE … SET, DELETE FROM, DROP), lệnh điều khiển
# giao dịch GẦN NHẤT phía trước phải là query("BEGIN") và gần nhất phía sau phải là query("ROLLBACK") — lệnh thật trong
# query(…), không tính chữ BEGIN/ROLLBACK trong chú thích hay chuỗi thông báo. Chiều đỏ trên bản sao mỗi tệp: câu ghi chèn
# trước BEGIN đầu tiên, và câu ghi chèn ngay sau lệnh ROLLBACK thật đầu tiên — cả hai phải làm phép quét đỏ, gọi tên dòng.
set -uo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
TEP=("scripts/kiem-tin-rao-gan-khu-vuc.mjs" "scripts/kiem-tin-rao-gan-khu-vuc.test.mjs")
GHI='(INSERT INTO|UPDATE [a-z_]+ SET|DELETE FROM|DROP (TABLE|VIEW|FUNCTION))'
DK='query[(][[:space:]]*["`](BEGIN|ROLLBACK|COMMIT)["`]'
loi=0

# In «<tệp>:<dòng>» cho mỗi câu ghi không nằm trong một cặp BEGIN … ROLLBACK; mã 1 khi có.
kiem() {
  local duong="$1" ten="$2"
  awk -v ten="$ten" -v re="$GHI" -v dk="$DK" '
    { dong[NR] = $0
      if (match($0, dk)) { s = substr($0, RSTART, RLENGTH); loai[NR] = (s ~ /BEGIN/) ? "B" : (s ~ /ROLLBACK/) ? "R" : "C" } }
    END {
      sai = 0
      for (i = 1; i <= NR; i++) {
        if (dong[i] ~ /^[[:space:]]*\/\//) continue
        if (dong[i] !~ re) continue
        truoc = ""; for (j = i - 1; j >= 1; j--) if (j in loai) { truoc = loai[j]; break }
        sau = "";   for (k = i + 1; k <= NR; k++) if (k in loai) { sau = loai[k]; break }
        if (truoc != "B" || sau != "R") { print ten ":" i; sai = 1 }
      }
      exit sai
    }' "$duong"
}

for t in "${TEP[@]}"; do
  out=$(kiem "$ROOT/$t" "$t" 2>&1); ma=$?
  if [ "$ma" -eq 0 ] && [ -z "$out" ]; then
    echo "khong-db-chung: $t — mọi câu ghi nằm trong một cặp BEGIN … ROLLBACK"
  else
    echo "khong-db-chung: ĐỎ — câu ghi ngoài giao dịch: $(echo $out)"; loi=1
  fi
done

# Chiều đỏ trên bản sao.
TMP=$(mktemp -d); trap 'rm -rf "$TMP"' EXIT
GHI_GIA='await c.query("UPDATE areas SET name = name");'
for t in "${TEP[@]}"; do
  # (1) trước BEGIN đầu tiên
  awk -v g="$GHI_GIA" 'NR==1{print; print g; next}1' "$ROOT/$t" > "$TMP/truoc.mjs"
  # (2) ngay sau lệnh ROLLBACK thật đầu tiên
  awk -v g="$GHI_GIA" 'BEGIN{xong=0} {print} !xong && /query\([[:space:]]*["`]ROLLBACK["`]/ {print g; xong=1}' "$ROOT/$t" > "$TMP/sau.mjs"
  for ca in truoc sau; do
    out=$(kiem "$TMP/$ca.mjs" "$t" 2>&1); ma=$?
    # Đỏ đúng = thoát 1 VÀ gọi được tên dòng «<tệp>:<số>»; awk hỏng cũng thoát ≠ 0 nhưng không gọi tên dòng nào.
    if [ "$ma" -eq 1 ] && grep -qE "^$t:[0-9]+$" <<<"$out"; then
      echo "khong-db-chung: chiều đỏ đúng ($ca) — $(echo $out)"
    else
      echo "khong-db-chung: ĐỎ — bản sao $t ($ca) không làm phép quét đỏ gọi tên dòng (thoát $ma): $(echo $out)"; loi=1
    fi
  done
done

[ "$loi" -eq 0 ] && echo "khong-db-chung: xanh" || echo "khong-db-chung: đỏ"
exit "$loi"
