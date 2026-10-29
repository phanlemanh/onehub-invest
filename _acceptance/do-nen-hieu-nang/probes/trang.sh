#!/bin/bash
# AC-2: chạy script đo trên build prod (20 lượt/trang), 5/5 trang 20/20 đúng trang, băm mật khẩu ops-test@local.test không đổi. Chiều đỏ: bản sao script (cùng thư mục,
# tên tạm) đổi dấu tiêu đề của /ops thành chuỗi không có → «TRANG KHONG DUNG».
set -uo pipefail
ROOT="$(cd "$(dirname "$0")/../../.." && pwd)" || exit 2; cd "$ROOT" || exit 2
echo "root $ROOT sha $(git rev-parse HEAD)"
[ -f app/.next/BUILD_ID ] || (cd app && npx next build >/dev/null 2>&1) || { echo "BUILD LOI"; exit 2; }
bad=0
# Lượt đo không được đụng tài khoản ops thử mà worktree khác dùng: so băm password_hash trước/sau.
BAM() { node -e 'const pg=require(require.resolve("pg",{paths:["app"]}));const c=new pg.Client({connectionString:process.env.DATABASE_URL||"postgres://oneinvest:oneinvest@localhost:5433/oneinvest"});c.connect().then(()=>c.query("select md5(coalesce(password_hash,\x27\x27)) h from users where email=\x27ops-test@local.test\x27")).then(r=>{console.log(r.rows[0]?.h??"khong-co");return c.end()})'; }
h0=$(BAM)
OUT=$(node scripts/do-nen-hieu-nang/do.mjs --luot 20 2>&1); rc=$?
h1=$(BAM)
if [ -n "$h0" ] && [ "$h0" = "$h1" ]; then echo "ok tai khoan ops-test khong doi trong luot do"; else echo "LUOT DO DOI TAI KHOAN OPS-TEST"; bad=1; fi
printf '%s\n' "$OUT" | grep -E "^trang |DO NEN OK|TRANG KHONG DUNG"
n=$(printf '%s\n' "$OUT" | grep -c ": 20/20 dung trang")
[ $rc = 0 ] && [ "$n" = 5 ] || { echo "BAN THAT DO (rc $rc, $n/5 trang du)"; bad=1; }
TAM="scripts/do-nen-hieu-nang/.do-dot-bien-$$.mjs"; trap 'rm -f "$TAM"' EXIT
sed 's/dau: "Tổng quan vận hành"/dau: "khong-co-tieu-de-nay"/' scripts/do-nen-hieu-nang/do.mjs > "$TAM"
grep -q "khong-co-tieu-de-nay" "$TAM" || { echo "DOT BIEN KHONG AP DUOC"; exit 2; }
O2=$(node "$TAM" --luot 2 2>&1); r2=$?
if [ $r2 != 0 ] && printf '%s\n' "$O2" | grep -q "TRANG KHONG DUNG: /ops "; then echo "ban dau sai: do TRANG KHONG DUNG"; else echo "CA KHONG DO (rc $r2)"; printf '%s\n' "$O2" | tail -3; bad=1; fi
[ $bad = 0 ] && echo "TRANG OK"
exit $bad
