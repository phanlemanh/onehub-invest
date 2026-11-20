#!/usr/bin/env bash
# may-thu.sh — ca-doi-chieu-tin-rao-nap-co-khop-cum AC-1: ca E4b của nhánh xanh trên DB máy thu sau khi áp che-ten.
# CHỈ ĐỌC (E4b mở phiên READ ONLY; câu tiền đề chạy trong phiên default_transaction_read_only). Chỉ in số đếm, không in tên nguồn.
# Chạy từ gốc kho: bash _acceptance/ca-doi-chieu-tin-rao-nap-co-khop-cum/probes/may-thu.sh
set -uo pipefail
ROOT=$(cd "$(dirname "$0")/../../.." && pwd); cd "$ROOT"
echo "root $ROOT sha $(git rev-parse HEAD)"
export DATABASE_URL=postgres://oneinvest:oneinvest@localhost:5433/oneinvest
cd app
n=$(node -e '
const pg=require("pg");(async()=>{const c=new pg.Client({connectionString:process.env.DATABASE_URL});await c.connect();
await c.query("SET default_transaction_read_only = on");
const r=await c.query("SELECT count(*)::int n FROM source_registry WHERE match_whole AND btrim(real_name) ~ $1",["\\s"]);
console.log(r.rows[0].n);await c.end()})().catch(e=>{console.error(e.message);process.exit(3)})') || { echo "THIEU DB MAY THU"; exit 1; }
echo "tien de: $n dong khai khop nguyen cum, ten nhieu tu"
[ "$n" -ge 1 ] || { echo "TIEN DE KHONG CO"; exit 1; }
o=$(node --import tsx --test --test-name-pattern "^E4b đối chiếu DB máy thu$" tests/tin-rao-doi-chieu.test.tsx 2>&1)
echo "$o" | grep -E "^tin mang định danh đã đọc lại [0-9]+$|định danh nguồn [0-9]+ ·|^ℹ (pass|fail) " | sed 's/^/  /'
if grep -q "ℹ pass 1" <<<"$o" && grep -q "ℹ fail 0" <<<"$o" && grep -qE "^tin mang định danh đã đọc lại [0-9]+$" <<<"$o"; then
  echo "E4b xanh"; echo "MAY-THU OK"; exit 0
fi
echo "E4B DO"; echo "$o" | grep -E "AssertionError|lọt|lệch|định danh" | head -5; exit 1
