# PL14 · Nạp lại không xoá — thiết kế (26/10)

Hàng PL14 `nap-lai-khong-xoa` (T3) của `docs/plan/lo-trinh.json`, làn A lát OCP1 (PL6 → **PL14** → PL15).
Cổng Đáng: giám sát `dot0-cam-mau` (P2-60). Migration 044 theo sổ SO-MIGRATION.

Câu giao:
- Nạp lại mọi nguồn không xoá hàng.
- Khoá tin bền.
- `retired_at` thay DELETE.
- Mọi khoá ngoại tới `sale_offers` và `listings` là RESTRICT.

Bật khi: ba lượt nạp lại liên tiếp cho 0 quyết định người mất, 0 liên kết mất.

Căn cứ:
- review phân loại §3.4 «Phân loại bền qua nạp lại» và lỗi L03 (`docs/architecture/classification-enrich-review.md`);
- ADR-0013 §3 (khoá tin = `OriginatingSystemKey`; `ListingKey` không suy từ nội dung đổi được);
- kiểm kê 26/10 trong ghi chú `p2-pl14-kiem-ke-2610.md` của thư mục ghi chú đợt.

## 1. Hiện trạng (đo 26/10, DB local)

**Khoá ngoại còn CASCADE (5):**
- `nights` → `listings`;
- `listing_stats` → `listings`;
- `property_offers` → `sale_offers`;
- `property_candidates.offer_a` và `.offer_b` → `sale_offers`.

Chỉ `enrichment_proposals` → `sale_offers` đã là RESTRICT (039).

**Đường xoá cứng:**
- `reconcile_stale_offers` (039:130) xoá offer cũ. CASCADE kéo theo liên kết căn và ứng viên ghép.
- `transform-airbnb.mjs:142` và `reassign-areas.mjs:199` xoá listing ngoài phường. CASCADE kéo theo lịch đêm.
- `200_transform.sql:64` xoá cả bảng `nights` (đường Inside Airbnb cũ).

**Khoá:**
- `offer_id` của S03/S05 là băm nội dung (`kind|phường|giá|DT|PN`). Sửa giá hoặc sửa parser thì ra id mới. Đây là gốc L03.
- S06 (`S06|list_id`) và `listings.id` (`abnb_<id>`) đã là khoá nguồn bền.
- `sale_offers` không có cột khoá nguồn, chỉ có `post_ids text[]`.

**Người đọc:**
- 26 tệp đọc `sale_offers`, 24 tệp đọc `listings` (app, data-api, pipeline, scripts).
- Hôm nay mọi chỗ đọc chỉ thấy hàng sống, vì hàng chết đã bị xoá.

**Quyết định người tựa vào tin:**
- `enrichment_proposals` (FK RESTRICT);
- `property_candidates` (merged/rejected — FK CASCADE, đã mất thật một lần);
- `property_offers` (FK CASCADE);
- thẻ `review_queue` `enrich:<offer>` và `pair:<a>|<b>` (text, không FK);
- `ops_audit` (ảnh chụp).

## 2. Lối chọn chính: chỗ đọc thấy hàng đã nghỉ thế nào (Hỏi-1)

| Lối | Làm gì | Giá |
|---|---|---|
| **A · Bảng bản ghi + view sống** (khuyến nghị) | Đổi tên bảng: `sale_offers` → `sale_offer_records`, `listings` → `listing_records`, thêm `retired_at`. Tạo lại `sale_offers` và `listings` là VIEW `WHERE retired_at IS NULL`. Khoá ngoại trỏ bảng bản ghi, RESTRICT. | 50 chỗ đọc không đổi, app/data-api/cloud thấy đúng như hôm nay. View đơn bảng là auto-updatable, upsert qua view chạy được (đã thử trên PG local). Chỉ đường ghi biết bảng bản ghi. `sync-cloud` vẫn chép từ view; bảng con chỉ chép dòng có cha sống. |
| B · Cột `retired_at` + mọi chỗ đọc tự lọc | Giữ tên bảng; sửa khoảng 50 tệp thêm `retired_at IS NULL`; cloud cần cột và lọc. | Đụng app/data-api/cloud. Quên một chỗ là tin ma lên cổng. Cần thêm một lint quét chỗ đọc thiếu lọc. |

Khuyến nghị A:
- phạm vi đổi nhỏ nhất ở mặt người dùng;
- cloud giữ nguyên lược đồ;
- PL15 (bảng phát biểu) đọc thẳng bảng bản ghi.

Đây là đổi lược đồ khó đảo, nên đưa ra Cổng Phạm vi.

## 3. Thiết kế (theo lối A)

**Migration 044 `nap_lai_khong_xoa`** (idempotent, một giao dịch):
1. `ALTER TABLE sale_offers RENAME TO sale_offer_records`; thêm cột:
   - `retired_at timestamptz`;
   - `retired_reason text` (CHECK: `het_trong_luot` · `ngoai_phuong` · `doi_khoa`);
   - `superseded_by text` (FK tự trỏ, RESTRICT);
   - `originating_system_key text` (khoá gốc nguồn, ADR-0013 §3).
   Cùng làm cho `listings` → `listing_records` với `retired_at` + `retired_reason`.
2. `CREATE VIEW sale_offers AS SELECT * FROM sale_offer_records WHERE retired_at IS NULL`; tương tự `listings`.
   - View `v_ruler_p2*` (034) dựng lại trên view mới.
   - Quyền cho anon/authenticated giữ như cũ.
3. Đổi 5 khoá ngoại CASCADE sang RESTRICT, trỏ bảng bản ghi. `enrichment_proposals` trỏ lại bảng bản ghi, vẫn RESTRICT.
4. `reconcile_stale_offers` (thay 039):
   - không DELETE: đặt `retired_at = now()`, `retired_reason = 'het_trong_luot'`, `superseded_by = <offer kế>`;
   - ngoài phần đề xuất enrich đã có, chuyển sang offer kế cả `property_offers`, `property_candidates` (merged/rejected) và thẻ `pair:` (đổi `item_id`);
   - không có offer kế thì giữ nguyên dòng ở offer đã nghỉ. RESTRICT bảo đảm không mất, `ops_audit` ghi ảnh chụp.
5. Điền `originating_system_key`:
   - S06 = `list_id`;
   - S03/S05 = `post_ids` sớm nhất (khoá neo);
   - listings = id Airbnb.

**Khoá tin bền cho S03/S05:**
- `offer_id = 'offer_' || sha256('<S0x>|' || <post_id neo>)[:16]`;
- post neo = post có `posted_at` sớm nhất trong nhóm repost, hoà thì `post_id` nhỏ nhất;
- sửa giá hay sửa parser không đổi id khi post neo còn đó;
- lượt nạp đầu sau 044 đổi khoá hàng loạt (S03 269, S05 28): đối soát cho offer cũ nghỉ với lý do `doi_khoa`, quyết định chuyển sang offer kế.

**Đường ghi:**
- `write-offers.mjs` upsert vào bảng bản ghi, và gỡ `retired_at` khi tin quay lại.
- `transform-chotot.mjs` upsert vào bảng bản ghi, chưa đối soát (S06 tích luỹ — hiệu lực tin là PL19).
- `transform-airbnb.mjs` và `reassign-areas.mjs` đặt `retired_at`, `retired_reason = 'ngoai_phuong'` thay cho DELETE.
- `200_transform.sql` (đường cũ) chỉ xoá đêm của listing sống. Xoá đêm không phải xoá cha.

**sync-cloud:** chép `sale_offers`/`listings` từ view như cũ; bảng con (`nights`, `listing_stats`, `property_offers`) chỉ chép dòng có cha sống. Cloud giữ nguyên lược đồ, không cần migration cloud cho đổi tên.

**Thước bật** `pipeline/scripts/nap-lai-ba-luot.mjs`:
- chạy trong một giao dịch ROLLBACK trên DB local;
- chụp ma trận quyết định và liên kết: đề xuất enrich đã quyết, thẻ review đã quyết, ứng viên ghép merged/rejected, `property_offers`, thẻ `pair:`;
- chạy transform S03 → S05 → S06 → airbnb ba lượt, mỗi lượt đổi một biến (giá một tin S03, parser `rule_id`, một listing ra ngoài phường);
- đếm quyết định và liên kết theo khoá gốc trước và sau. Đạt khi mất = 0.

## 4. Không làm

- Bảng phát biểu và bộ phân xử (PL15).
- Hiệu lực tin S06 và `offer_status` (PL19).
- Gỡ đóng băng `ENRICH_COLS` (đi cùng phân xử ở PL15).
- Áp 044 lên Supabase: đo cloud trước, soạn SQL bắt kịp, trình Mạnh — không tự áp.
- Sửa làn ZCode (importer `stg_*`).

## 5. ADR-0013 — 8 câu

1. **Lớp**: tin.
2. **DD**: `OriginatingSystemKey`, `ListingKey` không suy từ nội dung.
3. **Khoá bền**: đúng mục tiêu hàng này.
4. **Ai ghi**: transform và hàm đối soát; không UPDATE cột chuẩn từ agent.
5. **Nguồn gốc**: giữ `post_ids`.
6. **Thời gian**: `retired_at`, `superseded_by`, có ảnh chụp `ops_audit`.
7. **Nâng bậc**: giữ B2 (gắn căn) qua nạp lại.
8. **SPL**: không cột tên nguồn thật; `originating_system_key` là id bài/tin công khai ở nguồn (tầng C).
