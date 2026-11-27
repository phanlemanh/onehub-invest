#!/usr/bin/env bash
# kiem-m5.sh — HT33 E5: soát đầu ra một lượt `cd pipeline && npm run test:that` chạy trên M5 (vai may-phat-trien).
# Tệp đầu ra (mặc định evidence/m5-pipeline-that.txt) do lượt M5 ghi: dòng đầu «sha: <40 hex>», dòng «CI=<giá trị>», rồi nguyên đầu ra.
# Đòi: sha = commit cuối chạm tệp ngoài _acceptance/ của nhánh; vai may-phat-trien; bỏ qua đúng 1 ca chỉ máy thu là ON22-AC-10;
# ℹ tests 37; ℹ fail 0; CI không phải true. Rồi tự chạy chiều đỏ trên hai bản sao hỏng (sha cũ, tests 38) — phải đỏ.
set -uo pipefail
cd "$(git rev-parse --show-toplevel)" || exit 2
HS=_acceptance/pipeline-that-ca-may-thu-co-ten-tren-may-phat-trien
TEP="${1:-$HS/evidence/m5-pipeline-that.txt}"
SHA_MA=$(git log -1 --format=%H -- . ":(exclude)_acceptance")
kiem() {
  local f="$1" thieu=()
  [ -f "$f" ] || { echo "thiếu tệp đầu ra M5: $f"; return 1; }
  grep -qx "sha: $SHA_MA" "$f" || thieu+=("sha mã cuối $SHA_MA")
  grep -q "^chay-that: vai may-phat-trien — bỏ qua 1 ca chỉ máy thu$" "$f" || thieu+=("dòng vai may-phat-trien bỏ qua 1 ca")
  grep -q "^chay-that: bỏ qua (chỉ máy thu) — .* — ON22-AC-10 " "$f" || thieu+=("dòng bỏ qua ON22-AC-10")
  grep -qx "ℹ tests 37" "$f" || thieu+=("ℹ tests 37")
  grep -qx "ℹ fail 0" "$f" || thieu+=("ℹ fail 0")
  grep -qx "CI=true" "$f" && thieu+=("CI không được là true")
  if [ "${#thieu[@]}" -gt 0 ]; then printf 'thiếu/lệch: %s\n' "${thieu[@]}"; return 1; fi
  return 0
}
kiem "$TEP" || exit 1
echo "PASS đầu ra M5 đủ: sha $SHA_MA, bỏ qua 1 ca chỉ máy thu (ON22-AC-10), tests 37, fail 0"
# Chiều đỏ trên chính tệp: hai bản sao hỏng phải bị bắt.
T=$(mktemp -d); trap 'rm -rf "$T"' EXIT
sed "s/^sha: .*/sha: 0000000000000000000000000000000000000000/" "$TEP" > "$T/sha-cu.txt"
sed "s/^ℹ tests 37$/ℹ tests 38/" "$TEP" > "$T/tests-38.txt"
for b in sha-cu tests-38; do
  if kiem "$T/$b.txt" >/dev/null; then echo "FAIL chiều đỏ: bản sao $b không bị bắt"; exit 1; fi
done
echo "PASS chiều đỏ: sha cũ và tests 38 đều bị bắt"
