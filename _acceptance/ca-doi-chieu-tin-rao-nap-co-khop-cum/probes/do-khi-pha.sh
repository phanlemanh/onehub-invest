#!/usr/bin/env bash
# do-khi-pha.sh — ca-doi-chieu-tin-rao-nap-co-khop-cum AC-2, AC-3 trên CÙNG một DB thử oneinvest_suite_*:
#   (a) ca «ca-doi-chieu» của nhánh xanh (cấy đủ hai từ → API null, thước bắt; chỉ từ đầu → API nguyên, thước không bắt;
#       token trần bắt từ đầu); (b) bản sao ca mà hàm nạp trả token trần → đỏ ghim «thước coi tên chỉ mang từ đầu là định danh».
# Chạy từ gốc kho: bash _acceptance/ca-doi-chieu-tin-rao-nap-co-khop-cum/probes/do-khi-pha.sh. Nguồn giả, không tên thật.
set -uo pipefail
ROOT=$(cd "$(dirname "$0")/../../.." && pwd); cd "$ROOT"
echo "root $ROOT sha $(git rev-parse HEAD)"
if [ -z "${DATABASE_URL:-}" ] || [[ "$DATABASE_URL" != *oneinvest_suite_* ]]; then
  exec bash db/db-thu.sh oneinvest_suite_tdc_pha --chay bash "$0"
fi
cd app
T=tests/tin-rao-doi-chieu.test.tsx; PHA=tests/_tdc-pha-$$.test.tsx
trap 'rm -f "$PHA"' EXIT
chay() { node --import tsx --test --test-name-pattern "^ca-doi-chieu" "$1" 2>&1; }
loi=0
o=$(chay "$T")
if grep -q "ℹ pass 1" <<<"$o" && grep -q "ℹ fail 0" <<<"$o" && grep -q "ℹ skipped 0" <<<"$o"; then echo "ban nhanh: ca-doi-chieu xanh (du hai tu → API null, tu dau → API nguyen, token tran bat tu dau)"; else echo "BAN NHANH DO"; echo "$o" | tail -25; loi=1; fi
node -e '
const fs=require("fs");const s=fs.readFileSync(process.argv[1],"utf8");
const m=s.replace("return { entries, tokens: tokensFromEntries(entries) }","return { entries, tokens: entries.map((e) => e.realName) }");
if(m===s){console.log("PHA KHONG AP DUOC");process.exit(1)}fs.writeFileSync(process.argv[2],m)' "$T" "$PHA" || loi=1
o=$(chay "$PHA")
if grep -q "ℹ fail 1" <<<"$o" && grep -q "thước coi tên chỉ mang từ đầu là định danh" <<<"$o"; then echo "pha ve token tran: ca-doi-chieu do «thuoc coi ten chi mang tu dau la dinh danh»"; else echo "PHA KHONG DO"; echo "$o" | tail -20; loi=1; fi
[ $loi = 0 ] && echo "DO-KHI-PHA OK"
exit $loi
