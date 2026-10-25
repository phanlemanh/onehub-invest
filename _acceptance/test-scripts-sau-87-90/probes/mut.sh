#!/bin/bash
# Độ nhạy: hai test đã sửa phải ĐỎ khi mã thật hỏng đúng chỗ chúng canh. Chạy trên BẢN CHÉP pipeline/ + scripts/
# trong thư mục tạm (node_modules, app/ là symlink chỉ đọc) — không sửa tệp nào trong kho.
set -uo pipefail
R="${1:?gốc kho}"; cd "$R"
export DATABASE_URL="${DATABASE_URL:-postgres://oneinvest:oneinvest@localhost:5433/oneinvest}"
T=$(mktemp -d); trap 'rm -rf "$T"' EXIT
tree() { # $1 = thư mục đích
  mkdir -p "$1"
  rsync -a --exclude node_modules --exclude logs pipeline/ "$1/pipeline/"; ln -s "$R/pipeline/node_modules" "$1/pipeline/node_modules"
  rsync -a --exclude '*.state' scripts/ "$1/scripts/"; ln -s "$R/app" "$1/app"
}
bad=0
run() { node --test --test-name-pattern="$2" "$1" 2>&1; }
# đối chứng: bản chép lành → các ca canh xanh
tree "$T/goc"
o=$(run "$T/goc/scripts/check-freshness.test.mjs" "GT-AC-1"); echo "$o" | grep -qx 'ℹ fail 0' && echo "$o" | grep -qx 'ℹ pass 2' || { echo "ĐỐI CHỨNG freshness không xanh"; echo "$o" | tail -20; bad=1; }
o=$(run "$T/goc/scripts/job-exit.test.mjs" "AC-2 apify-facebook-daily: mọi bước lành"); echo "$o" | grep -qx 'ℹ fail 0' && echo "$o" | grep -qx 'ℹ pass 1' || { echo "ĐỐI CHỨNG job-exit không xanh"; echo "$o" | tail -20; bad=1; }
# M1: importer ghi lại giờ nạp now() làm captured_at → GT-AC-1 phải đỏ, nêu captured_at = finishedAt
tree "$T/m1"
f="$T/m1/pipeline/import-chotot.mjs"; n='manifest.snapshotId, manifest.finishedAt, // 2410-1'
grep -qF "$n" "$f" || { echo "M1 khuôn đột biến lệch mã nguồn"; exit 1; }
sed -i '' "s|manifest.snapshotId, manifest.finishedAt, // 2410-1|manifest.snapshotId, new Date().toISOString(), // 2410-1|" "$f"
o=$(run "$T/m1/scripts/check-freshness.test.mjs" "GT-AC-1")
if echo "$o" | grep -qx 'ℹ fail 0'; then echo "M1 KHÔNG bị bắt: importer ghi now() mà GT-AC-1 vẫn xanh"; bad=1
elif echo "$o" | grep -qF 'importer phải ghi captured_at = finishedAt'; then echo "M1 bị bắt (captured_at = giờ nạp)"
else echo "M1 đỏ nhưng không vì captured_at"; echo "$o" | grep -E 'Error|phải' | head -5; bad=1; fi
# M2: tệp bọc apify không còn gọi import-airbnb → AC-2 lành phải đỏ (ảnh mẫu đã được tệp bọc nhìn thấy)
tree "$T/m2"
f="$T/m2/scripts/apify-facebook-daily.sh"; n='if node "$ROOT/pipeline/import-airbnb.mjs" "$snap"'
grep -qF "$n" "$f" || { echo "M2 khuôn đột biến lệch mã nguồn"; exit 1; }
sed -i '' 's|if node "$ROOT/pipeline/import-airbnb.mjs" "$snap"|if true|' "$f"
o=$(run "$T/m2/scripts/job-exit.test.mjs" "AC-2 apify-facebook-daily: mọi bước lành")
if echo "$o" | grep -qx 'ℹ fail 0'; then echo "M2 KHÔNG bị bắt: bỏ import-airbnb mà AC-2 vẫn xanh"; bad=1
elif echo "$o" | grep -qF 'dãy lời gọi phải khớp đúng dãy viết trước'; then echo "M2 bị bắt (thiếu import-airbnb trong dãy)"
else echo "M2 đỏ nhưng không vì dãy lời gọi"; echo "$o" | grep -E 'Error|phải' | head -5; bad=1; fi
[ "$bad" = 0 ] && echo "MUT OK"
exit "$bad"
