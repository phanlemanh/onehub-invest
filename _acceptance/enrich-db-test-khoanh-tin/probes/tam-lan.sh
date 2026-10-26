#!/bin/bash
# AC-2: ca «AC-6 để sau: lượt backlog» tám lần xanh; đối chứng: bản tệp test của origin/main đỏ ít nhất một lần trong tám.
set -u
ROOT="$(git rev-parse --show-toplevel)"; cd "$ROOT/agent" || exit 2
CA="AC-6 để sau: lượt backlog"
chay() { env -u NODE_TEST_CONTEXT node --import tsx --test --test-name-pattern="$CA" "$1" 2>&1 | grep -q '^ℹ fail 0'; }
for n in $(seq 1 8); do chay tests/enrich-db.test.ts && echo "lan $n: xanh" || { echo "lan $n: DO"; exit 1; }; done
echo "TAM LAN XANH"
# Thân ca không truyền offerIds cho lượt backlog (giữ ý đo của AC-6).
# Lấy đúng khối «await runEnrich({ … });» của lượt backlog trong ca (bỏ chú thích).
goi=$(awk -v ca="$CA" 'index($0, ca){f=1} f && /await runEnrich\(\{/{g=1} g{print} g && /\}\);/{exit}' tests/enrich-db.test.ts | sed 's#//.*##')
printf '%s\n' "$goi" | grep -q 'runId: "test-ac6-backlog"' || { echo "KHONG THAY LOI GOI BACKLOG"; exit 1; }
printf '%s\n' "$goi" | grep -q 'offerIds' && { echo "LOI GOI BACKLOG CO offerIds"; exit 1; }
echo "LOI GOI BACKLOG KHONG offerIds"
# Đối chứng: bản lỗi GHIM CỨNG ở main 106cbd3 (không theo origin/main đang trôi — sau merge nó là bản sửa). Bản cũ chỉ đỏ
# khi DB :5433 lúc chạy có tin «hoãn» của ca khác; đếm trước, không có thì nói rõ là không đối chứng được, không giả đạt.
cu=tests/.enrich-db-doi-chung.test.ts; git -C "$ROOT" show 106cbd3e:agent/tests/enrich-db.test.ts > "$cu" || { echo "KHONG LAY DUOC BAN CU 106cbd3"; exit 2; }
khac=$(node -e "const pg=require('pg');const c=new pg.Client(process.env.DATABASE_URL||'postgres://oneinvest:oneinvest@localhost:5433/oneinvest');c.connect().then(async()=>{const r=await c.query(\"SELECT count(DISTINCT ep.offer_id)::int n FROM enrichment_proposals ep WHERE ep.status='queued' AND ep.route='review' AND NOT EXISTS (SELECT 1 FROM review_queue rq WHERE rq.id=ep.review_id AND rq.status='pending')\");console.log(r.rows[0].n);await c.end()})") || { rm -f "$cu"; echo "KHONG DEM DUOC TIN HOAN"; exit 2; }
echo "tin hoan khac tren DB: $khac"
k=0; for n in $(seq 1 8); do chay "$cu" || k=$((k+1)); done; rm -f "$cu"
echo "DOI CHUNG: ban cu do $k/8"
if [ "$khac" -gt 0 ]; then
  [ "$k" -ge 1 ] || { echo "DOI CHUNG KHONG DO — phép đo không phân biệt"; exit 1; }
else
  echo "DOI CHUNG KHONG AP DUNG — DB không có tin hoãn khác, bản cũ không có cớ đỏ"
fi
