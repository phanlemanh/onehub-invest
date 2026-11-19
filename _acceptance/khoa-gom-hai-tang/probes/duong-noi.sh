#!/usr/bin/env bash
# GT5 E7 (AC-7): offer_id có đường nối. Dùng lại trạng thái cong-tac.sh (GT5_GIU=1): DB oneinvest_gt5_bat đã chạy một lượt bật.
#   mọi offer_id của đường chuẩn S1 còn sống hoặc nghỉ có superseded_by; bảng đổi theo bài khớp S1 → S4;
#   tắt lại, chạy → vẫn 0 treo; chiều đỏ: bản nhân, xoá superseded_by của một tin nghỉ → treo thoát 1 ghim offer_id.
set -uo pipefail
ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"; cd "$ROOT"
D=_acceptance/khoa-gom-hai-tang/probes/gt5-db.mjs
RA="$(mktemp -d)"; U() { echo "postgres://oneinvest:oneinvest@localhost:5433/$1"; }
trap 'for t in oneinvest_gt5_bat oneinvest_gt5_do; do node $D xoa $t >/dev/null 2>&1 || true; done' EXIT
GT5_GIU=1 GT5_RA="$RA" bash _acceptance/khoa-gom-hai-tang/probes/cong-tac.sh > "$RA/cong-tac.txt" 2>&1 || { tail -20 "$RA/cong-tac.txt"; echo "ĐỎ: cong-tac.sh không xanh, không đo được đường nối"; exit 2; }
RC=0
echo "== sau lượt bật"
DATABASE_URL="$(U oneinvest_gt5_bat)" node $D treo "$RA/s1.json" || RC=1
[ -s "$RA/bang-doi.tsv" ] && node $D bang-doi "$RA/bang-doi.tsv" "$RA/s1.json" "$RA/s4.json" || { echo "ĐỎ: không có hoặc lệch bảng đổi theo bài"; RC=1; }
echo "== chiều đỏ: xoá superseded_by của một tin nghỉ (bản nhân)"
node $D nhan oneinvest_gt5_bat oneinvest_gt5_do >/dev/null
ID="$(DATABASE_URL="$(U oneinvest_gt5_do)" node -e '
const pg=require(process.argv[1]); const c=new pg.Client({connectionString:process.env.DATABASE_URL});
c.connect().then(async()=>{const r=await c.query(`UPDATE sale_offer_records SET superseded_by=NULL WHERE offer_id=(SELECT offer_id FROM sale_offer_records WHERE source=$$S03$$ AND retired_at IS NOT NULL AND superseded_by IS NOT NULL AND offer_id = ANY($1::text[]) ORDER BY offer_id LIMIT 1) RETURNING offer_id`,[Object.keys(require(process.argv[2]))]);console.log(r.rows[0]?.offer_id??"");await c.end()})' "$ROOT/pipeline/node_modules/pg" "$RA/s1.json")"
if [ -z "$ID" ]; then echo "ĐỎ: không có tin nghỉ nào có superseded_by để phá"; RC=1
elif DATABASE_URL="$(U oneinvest_gt5_do)" node $D treo "$RA/s1.json" > "$RA/do.txt"; then cat "$RA/do.txt"; echo "ĐỎ: thước mù — xoá superseded_by của $ID mà vẫn xanh"; RC=1
else grep -qF "$ID" "$RA/do.txt" && echo "đạt: chiều đỏ ghim $ID" || { cat "$RA/do.txt"; echo "ĐỎ: chiều đỏ không ghim $ID"; RC=1; }; fi
echo "== tắt lại"
DATABASE_URL="$(U oneinvest_gt5_bat)" node $D cong-tac tat "tat lai"
DATABASE_URL="$(U oneinvest_gt5_bat)" node pipeline/transform-zalo.mjs > "$RA/log-tat.txt" 2>&1 || { tail -5 "$RA/log-tat.txt"; echo "ĐỎ: transform tắt lại lỗi"; RC=1; }
DATABASE_URL="$(U oneinvest_gt5_bat)" node $D treo "$RA/s1.json" || RC=1
DATABASE_URL="$(U oneinvest_gt5_bat)" node $D chup "$RA/s5.json"; node $D so-sanh "$RA/s4.json" "$RA/s5.json" khac >/dev/null && echo "  tắt lại: thành phần quay về khoá cũ (khác lượt bật)"
[ $RC = 0 ] && echo "XANH: duong-noi" || echo "ĐỎ: duong-noi"
exit $RC
