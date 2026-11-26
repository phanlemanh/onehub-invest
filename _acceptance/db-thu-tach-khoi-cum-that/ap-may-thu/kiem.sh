#!/usr/bin/env bash
# kiem.sh — E10 của db-thu-tach-khoi-cum-that: README áp đủ năm mục; lệnh kiểm sau in nền + sau áp trên mẫu thật cộng ba
# lượt giả sau mốc áp; mẫu chưa có lượt sau mốc thì in «chưa có lượt nào sau áp», mã 0.
set -uo pipefail
A="$(cd "$(dirname "$0")" && pwd)"
GOC="$(cd "$A/../../.." && pwd)"
loi=0
for muc in "## 1. Lệnh áp" "## 2. Số chạy thử" "## 3. Sao lưu trước" "## 4. Cách lùi" "## 5. Lệnh kiểm sau"; do
  grep -qF "$muc" "$A/README.md" || { echo "FAIL README thiếu mục: $muc"; loi=1; }
done
T=$(mktemp -d)
trap 'rm -rf "$T"' EXIT
MAU="$GOC/scripts/fixtures/su-kien-s4-2311-2511.jsonl"
cp "$MAU" "$T/co.jsonl"
for luc in 2026-12-01T00:00:00Z 2026-12-01T00:20:00Z 2026-12-01T00:50:00Z 2026-12-01T01:30:00Z; do
  echo "{\"luc\":\"$luc\",\"loai\":\"cap\",\"tai_nguyen\":\"s4\",\"phien\":\"X\"}" >> "$T/co.jsonl"
done
ra=$(bash "$A/kiem-sau.sh" 2026-11-30T00:00:00Z "$T/co.jsonl") || { echo "FAIL kiem-sau.sh thoát khác 0"; loi=1; }
echo "$ra"
echo "$ra" | grep -q "^nền 99′ (n=15" || { echo "FAIL thiếu dòng nền 99′ (n=15)"; loi=1; }
echo "$ra" | grep -q "^sau áp 30′ (n=3" || { echo "FAIL thiếu dòng sau áp 30′ (n=3) — ba lượt 20′, 30′, 40′"; loi=1; }
ra2=$(bash "$A/kiem-sau.sh" 2026-11-30T00:00:00Z "$MAU") || { echo "FAIL kiem-sau.sh (mẫu chưa có lượt sau) thoát khác 0"; loi=1; }
echo "$ra2"
echo "$ra2" | grep -q "^chưa có lượt nào sau áp$" || { echo "FAIL thiếu «chưa có lượt nào sau áp»"; loi=1; }
[ "$loi" -eq 0 ] && echo "PASS ap-may-thu: README năm mục, lệnh kiểm sau in nền + sau áp"
exit "$loi"
