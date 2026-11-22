#!/usr/bin/env bash
# thu-30.sh — NB1 cham-bong-bo-sung-tin E11: lượt thử THẬT 30 thẻ trên DB máy thu (chỉ đọc), hai model thật, sổ gọi vào tệp. Tốn tiền
# (~0,03 USD, trần lệnh 0,1 USD) nên chạy MỘT lần ở S4 sau khi Cổng Phạm vi duyệt tiền; không lặp ở làn ghim lại (evals: not-run).
# Đỏ khi: băm ba bảng tin/đề xuất/thẻ hay số dòng field_assertions, ai_calls đổi; chi phí > 0,1 USD; có thẻ chưa đủ hai kết quả.
set -euo pipefail
GOC="$(cd "$(dirname "$0")/../../.." && pwd)"
ENV_FILE=()
[ -f "$GOC/.env" ] && ENV_FILE=(--env-file="$GOC/.env")
DOC=(docker exec -i -e PGPASSWORD=oneinvest -e "PGOPTIONS=-c default_transaction_read_only=on" one-invest-db psql -U oneinvest -h localhost -q -At -d oneinvest)
dau() {
  "${DOC[@]}" -c "SELECT md5(coalesce(string_agg(t::text, '|' ORDER BY t.offer_id), '')) FROM sale_offers t WHERE t.offer_id IN (SELECT offer_id FROM enrichment_proposals WHERE status = 'queued')" \
    -c "SELECT md5(coalesce(string_agg(t::text, '|' ORDER BY t.id), '')) FROM enrichment_proposals t WHERE t.review_id IS NOT NULL" \
    -c "SELECT md5(coalesce(string_agg(t.id || ':' || t.status, ',' ORDER BY t.id), '')) FROM review_queue t WHERE t.item_type = 'agent_output'" \
    -c "SELECT count(*) FROM field_assertions" -c "SELECT count(*) FROM ai_calls WHERE viec = 'cham-bong-bo-sung-tin'"
}
TRUOC="$(dau)"
cd "$GOC/agent"
set +e
node ${ENV_FILE[@]+"${ENV_FILE[@]}"} --import tsx scripts/cham-bong-bo-sung-tin.ts chay --che-do thu --gioi-han 30 --tran 0.1 | tee /tmp/nb1-thu-30.$$.log
MA=${PIPESTATUS[0]}
set -e
SAU="$(dau)"
RUN=$(grep -o 'lượt cb-[0-9TZ-]*' /tmp/nb1-thu-30.$$.log | head -1 | cut -d' ' -f2); rm -f /tmp/nb1-thu-30.$$.log
[ "$MA" = 0 ] || { echo "ĐỎ: lệnh chạy thoát $MA"; exit 1; }
[ "$TRUOC" = "$SAU" ] || { echo "ĐỎ: DB máy thu đổi sau lượt thử"; diff <(echo "$TRUOC") <(echo "$SAU") || true; exit 1; }
node -e '
const t = JSON.parse(require("fs").readFileSync(process.argv[1], "utf8"));
const loi = [];
if (t.usd > 0.1) loi.push(`chi phí ${t.usd} > 0,1 USD`);
if (t.the_du !== t.so_the) loi.push(`thẻ đủ hai kết quả ${t.the_du}/${t.so_the}`);
if (t.so_the !== 30) loi.push(`số thẻ ${t.so_the}, mong 30`);
console.log(loi.length ? "ĐỎ: " + loi.join("; ") : `XANH: 30/30 thẻ đủ hai kết quả, ${t.goi_moi} lời gọi, ${t.usd.toFixed(4)} USD, DB máy thu không đổi`);
process.exit(loi.length ? 1 : 0);
' "$GOC/state/cham-bong-bo-sung-tin/$RUN/tong-ket.json"
