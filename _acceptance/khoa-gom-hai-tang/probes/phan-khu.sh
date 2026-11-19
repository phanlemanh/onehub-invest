#!/usr/bin/env bash
# GT5 E5 (AC-5): bản chép DB, công tắc bật, một lượt nạp, kiểm từng tin của danh sách đóng băng (gt5-phan-khu.mjs).
# Chiều đỏ: bản nhân, cấy bài của một tin mới sang tin mới khác của cùng tin đóng băng (một tin hai phân khu) → thoát 1 ghim offer_id.
set -uo pipefail
ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"; cd "$ROOT"
D=_acceptance/khoa-gom-hai-tang/probes/gt5-db.mjs; K=_acceptance/khoa-gom-hai-tang/probes/gt5-phan-khu.mjs
DB_=_acceptance/khoa-gom-hai-tang/dong-bang/phan-khu.json; U() { echo "postgres://oneinvest:oneinvest@localhost:5433/$1"; }
RA="$(mktemp -d)"; trap 'for t in oneinvest_gt5_pk oneinvest_gt5_pk_do; do node $D xoa $t >/dev/null 2>&1 || true; done' EXIT
bash db/db-thu.sh oneinvest_gt5_pk >/dev/null || { echo "ĐỎ: không chép được DB thử"; exit 2; }
DATABASE_URL="$(U oneinvest_gt5_pk)" node $D cong-tac bat "phan-khu probe"
DATABASE_URL="$(U oneinvest_gt5_pk)" node pipeline/transform-zalo.mjs > "$RA/log.txt" 2>&1 || { tail -5 "$RA/log.txt"; echo "ĐỎ: transform bật lỗi"; exit 1; }
DATABASE_URL="$(U oneinvest_gt5_pk)" node $K $DB_; RC=$?
echo "== chiều đỏ: cấy một tin hai phân khu"
node $D nhan oneinvest_gt5_pk oneinvest_gt5_pk_do >/dev/null
CAY="$(DATABASE_URL="$(U oneinvest_gt5_pk_do)" node -e '
const pg=require(process.argv[1]); const db=require(process.argv[2]); const c=new pg.Client({connectionString:process.env.DATABASE_URL});
c.connect().then(async()=>{
 for (const t of db.tin) { const k=new Map(); for (const b of t.bai) k.set(b.khoa.join("+"), [...(k.get(b.khoa.join("+"))??[]), b.post_id]);
  if (k.size<2) continue; const [[,a],[,b]]=[...k];
  const r=await c.query(`SELECT offer_id, post_ids FROM sale_offer_records WHERE source=$$S03$$ AND retired_at IS NULL AND post_ids && $1::text[]`,[[a[0],b[0]]]);
  if (r.rows.length<2) continue; const [x,y]=r.rows; const p=y.post_ids.find(q=>b.includes(q)||a.includes(q));
  await c.query(`UPDATE sale_offer_records SET post_ids = array_append(array_remove(post_ids,$2), $2) WHERE offer_id=$1`,[x.offer_id,p]);
  await c.query(`UPDATE sale_offer_records SET post_ids = array_remove(post_ids,$2) WHERE offer_id=$1`,[y.offer_id,p]);
  console.log(x.offer_id); break; }
 await c.end(); })' "$ROOT/pipeline/node_modules/pg" "$ROOT/$DB_")"
if [ -z "$CAY" ]; then echo "ĐỎ: không cấy được (không tin đóng băng nào đã tách)"; RC=1
elif DATABASE_URL="$(U oneinvest_gt5_pk_do)" node $K $DB_ > "$RA/do.txt"; then cat "$RA/do.txt"; echo "ĐỎ: thước mù — cấy hai phân khu vào $CAY mà vẫn xanh"; RC=1
else grep -qF "$CAY" "$RA/do.txt" && echo "đạt: chiều đỏ ghim $CAY" || { tail -3 "$RA/do.txt"; echo "ĐỎ: chiều đỏ không ghim $CAY"; RC=1; }; fi
[ $RC = 0 ] && echo "XANH: phan-khu" || echo "ĐỎ: phan-khu"
exit $RC
