#!/usr/bin/env bash
# doi-chung.sh — on12-ac5-bo-dong-s03-moc-ngay AC-1, AC-2: trên CÙNG một DB thử có dòng s03-moc-ngay,
#   (a) ca ON12-AC-5 của nhánh xanh; (b) bản ca của origin/main đỏ «dòng kiểm chưa diễn giải» nêu s03-moc-ngay;
#   (c) bỏ s03-moc-ngay khỏi hằng chung (bản chép dq-checks) → ca của nhánh đỏ cùng thông điệp — bảng và ca đọc MỘT hằng.
# Chạy từ gốc kho: bash _acceptance/on12-ac5-bo-dong-s03-moc-ngay/probes/doi-chung.sh. Chỉ DB oneinvest_suite_* (db-thu.sh --chay).
set -uo pipefail
ROOT=$(cd "$(dirname "$0")/../../.." && pwd)
cd "$ROOT"
echo "root $ROOT sha $(git rev-parse HEAD)"
if [ -z "${DATABASE_URL:-}" ] || [[ "$DATABASE_URL" != *oneinvest_suite_* ]]; then
  exec bash db/db-thu.sh oneinvest_suite_on12ac5 --chay bash "$0"
fi
cd app
T=tests/ops-nhan-theo-context.test.tsx
CU=tests/_dc-on12-cu.test.tsx; DB=tests/_dc-on12-dot-bien.test.tsx; DQ=tests/_dc-dq-checks.ts
trap 'rm -f "$CU" "$DB" "$DQ"' EXIT
node -e '
const pg=require("pg");(async()=>{const c=new pg.Client({connectionString:process.env.DATABASE_URL});await c.connect();
await c.query("INSERT INTO dq_check_results(check_name,entity,status,detail) VALUES ($1,$2,$3,$4)",["s03-moc-ngay","S03","pass","{\"ngay\": \"2026-11-20\", \"offers_total\": 7672, \"project_linked\": 7427}"]);
const r=await c.query("SELECT count(*)::int n FROM dq_check_results WHERE check_name=$1 AND checked_at > now() - interval '"'"'7 days'"'"'",["s03-moc-ngay"]);
console.log("cay dong s03-moc-ngay: "+r.rows[0].n+" dong trong 7 ngay");await c.end()})().catch(e=>{console.error(e.message);process.exit(3)})' || { echo "CAY KHONG DUOC"; exit 1; }
chay() { node --import tsx --test --test-name-pattern "ON12-AC-5" "$1" 2>&1; }
loi=0
o=$(chay "$T"); if grep -q "ℹ pass 1" <<<"$o" && grep -q "ℹ fail 0" <<<"$o"; then echo "ban nhanh: ON12-AC-5 xanh"; else echo "BAN NHANH DO"; echo "$o" | tail -30; loi=1; fi
git show origin/main:app/$T > "$CU"
o=$(chay "$CU"); if grep -q "ℹ fail 1" <<<"$o" && grep -q "dòng kiểm chưa diễn giải" <<<"$o" && grep -q "s03-moc-ngay ·" <<<"$o"; then echo "ban origin/main: ON12-AC-5 do «dòng kiểm chưa diễn giải» nêu s03-moc-ngay"; else echo "DOI CHUNG KHONG DO"; echo "$o" | tail -20; loi=1; fi
node -e '
const fs=require("fs");const s=fs.readFileSync("src/lib/dq-checks.ts","utf8");const m=s.replace(" AND check_name <> '"'"'s03-moc-ngay'"'"'","");
if(m===s){console.log("DOT BIEN KHONG AP DUOC");process.exit(1)}fs.writeFileSync(process.argv[1],m.replace(/from "@\/components/g,"from \"../src/components"));
const t=fs.readFileSync(process.argv[3],"utf8");const t2=t.replace("await import(\"../src/lib/dq-checks\")","await import(\"./_dc-dq-checks\")");
if(t2===t){console.log("DOT BIEN KHONG AP DUOC");process.exit(1)}fs.writeFileSync(process.argv[2],t2)' "$DQ" "$DB" "$T" || loi=1
o=$(chay "$DB"); if grep -q "ℹ fail 1" <<<"$o" && grep -q "dòng kiểm chưa diễn giải" <<<"$o" && grep -q "s03-moc-ngay ·" <<<"$o"; then echo "dot bien hang chung bo s03-moc-ngay: ON12-AC-5 do «dòng kiểm chưa diễn giải»"; else echo "DOT BIEN KHONG DO"; echo "$o" | tail -20; loi=1; fi
[ $loi = 0 ] && echo "DOI CHUNG OK"
exit $loi
