# Bảng phủ ca NB9 — lệnh đếm (DB máy thu, chỉ đọc, 24/11/2026 ~02:30Z)

Chạy qua `docker exec -e PGPASSWORD=… one-invest-db psql -h 127.0.0.1 -U oneinvest -d oneinvest` với
`SET default_transaction_read_only=on`.

```sql
-- 1. Trạng thái thẻ
SELECT status, count(*) FROM review_queue WHERE item_type='agent_output' GROUP BY 1;
-- approved 1 · deferred 4 · pending 1047 · rejected 4

-- 2. Đề xuất trỏ về thẻ chờ, theo trạng thái
SELECT ep.status, count(DISTINCT rq.id) the, count(*) de
FROM review_queue rq JOIN enrichment_proposals ep ON ep.review_id=rq.id
WHERE rq.item_type='agent_output' AND rq.status='pending' GROUP BY 1;
-- queued: 817 thẻ, 1121 đề xuất (không đề xuất trạng thái khác trỏ về thẻ chờ)

-- 3. Nhóm 1: thẻ chờ không còn đề xuất queued
SELECT count(*) FROM review_queue rq WHERE rq.item_type='agent_output' AND rq.status='pending'
  AND NOT EXISTS (SELECT 1 FROM enrichment_proposals ep WHERE ep.review_id=rq.id AND ep.status='queued');
-- 230 (cả 230 không có đề xuất nào trỏ review_id; theo tin: 142 tin 0 đề xuất, 60 có applied/corroborated,
--      30 có skipped/review, 1 có applied/direct)

-- 4. Ô × trùng/lệch của đề xuất chờ (so value_key/value với sale_offers.<ô>::text)
--    loại hình trùng 383 / lệch 235 · PN trùng 47 / lệch 12 / ô tin trống 8 · WC 237 · toà 181 (177 thẻ) · đường 18
--    tin vắng khỏi sale_offers: 0

-- 5. Nhóm 2: mọi đề xuất queued là property_type/bedrooms trùng
--    true 232 thẻ · false 585 thẻ

-- 6. evidence.ly_do của đề xuất chờ: rỗng 1121
```

Tổng: 230 + 232 = 462 thẻ đóng; còn 585 thẻ chờ.

## Vì sao 230 thẻ nhóm 1 không có đề xuất (GS 24/11, câu còn mở của mục 61)

Đo 24/11 ~02:55Z, DB máy thu, chỉ đọc. Kết luận: 230 thẻ này KHÔNG mất đề xuất — chúng chưa từng có đề xuất. Đây là thẻ
**đối chiếu**: `agent/src/enrich/run.ts:189` vẫn dựng thẻ khi tin không có đề xuất nhưng có khối `evidence.doi_chieu`.

```sql
-- g1 = thẻ chờ agent_output không có đề xuất queued nào trỏ về
SELECT (evidence ? 'doi_chieu'), jsonb_array_length(evidence->'doi_chieu') > 0, jsonb_array_length(coalesce(evidence->'fields','[]')), count(*) FROM g1 GROUP BY 1,2,3;
-- true | true | 0 | 230   → cả 230 có khối đối chiếu, 0 trường đề xuất trên thẻ
SELECT d->>'loai', count(DISTINCT id) FROM g1, jsonb_array_elements(evidence->'doi_chieu') d GROUP BY 1;
-- y_dinh 124 · gia 103 · dien_tich 5   (một thẻ có thể mang nhiều loại)
SELECT created_at::date, count(*) FROM g1 GROUP BY 1;
-- 2026-11-03: 196 · 2026-11-05: 34
-- Không đề xuất nào (mọi trạng thái) trỏ review_id về 230 thẻ; 0 dòng ops_audit nhắc tới chúng; 0 tin đã nghỉ.
```

Hệ quả: đóng nhóm 1 là bỏ 230 ca đối chiếu (lệch ý định 124, lệch giá 103, lệch diện tích 5) chưa ai xét. Route decide ghi dòng
`ops_audit enrich:doi-chieu` khi người quyết thẻ đối chiếu; lượt máy đóng KHÔNG ghi dòng đó (không phải phán quyết đối chiếu).
