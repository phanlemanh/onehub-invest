---
schema_version: 1
feature: "Nạp lại mọi nguồn không xoá hàng: khoá tin bền, retired_at thay DELETE, mọi khoá ngoại tới sale_offers và listings là RESTRICT"
slug: nap-lai-khong-xoa
owner: phanlemanh@gmail.com
risk_tier: T3
surfaces: [cli, config, docs]
status: implemented
design_doc: docs/superpowers/specs/2026-10-26-nap-lai-khong-xoa-design.md
approved_by: Mạnh
approved_at: 2026-10-26
---

# Acceptance Contract: nap-lai-khong-xoa

## Context

Mỗi lượt nạp lại hôm nay có thể xoá tin cũ, và CASCADE kéo theo liên kết căn, ứng viên ghép đã duyệt, lịch đêm (L03:
quyết định ghép căn đã mất thật một lần). Tin S03/S05 lại mang khoá băm nội dung, nên sửa giá hay sửa parser là ra tin
mới. Vòng này làm ba việc:
- khoá tin bền theo post neo;
- tin và listing không còn bị xoá, chỉ nghỉ (`retired_at`);
- mọi khoá ngoại tới tin và listing thành RESTRICT.

Chỗ đọc vẫn thấy đúng dữ liệu như hôm nay qua view «sống» (lối A, Hỏi-1). Nền cho PL15.

Cổng Đáng `build`: giám sát đợt `dot0-cam-mau` (P2-60) theo gói lát OCP1 Mạnh duyệt 26/10.

Source input: `_acceptance/nap-lai-khong-xoa/opportunity.md` (hàng PL14 của `docs/plan/lo-trinh.json`).

## Criteria

- AC-1: Given DB local ở trạng thái trước 044, When áp `db/migrations/044_nap_lai_khong_xoa.sql` hai lần trong một giao
  dịch rồi ROLLBACK, Then kết quả như sau.
  - Có bảng `sale_offer_records` và `listing_records` mang `retired_at`, `retired_reason` (CHECK ba giá trị), cùng
    `superseded_by` và `originating_system_key` cho tin.
  - `sale_offers` và `listings` là VIEW chỉ gồm hàng `retired_at IS NULL`.
  - Đúng 6 khoá ngoại trỏ hai bảng bản ghi đều là RESTRICT (`nights`, `listing_stats`, `property_offers`,
    `property_candidates` ×2, `enrichment_proposals`).
  - `v_ruler_p2` và `v_ruler_p2_area` còn chạy.
  - Tập view/matview đọc thẳng bảng bản ghi (pg_depend) bằng đúng {`sale_offers`, `listings`}; `v_ruler_p2*` đọc qua
    view sống; view phụ nào khác trỏ thẳng bảng bản ghi thì đỏ, nêu tên view.
  - Lần áp thứ hai không lỗi, không đổi số dòng.
- AC-2: Given 044 đã áp, When đếm hàng trước và sau trên cùng DB, Then `sale_offers` (view) và `listings` (view) trả đúng
  số dòng và tập khoá như hai bảng trước 044; người dùng app/data-api thấy cùng dữ liệu.
- AC-3: Given một lượt nạp S03/S05 thiếu một tin cũ, When `reconcile_stale_offers` chạy, Then tin cũ KHÔNG bị xoá.
  - Tin cũ nhận `retired_at`, `retired_reason = 'het_trong_luot'`, `superseded_by` trỏ offer kế (chung post nhiều nhất).
  - Chuyển sang offer kế: đề xuất enrich, `property_offers`, `property_candidates` merged/rejected, thẻ `pair:`.
  - Không có offer kế: mọi dòng giữ nguyên trỏ tin đã nghỉ, `ops_audit` có ảnh chụp.
  - Tin quay lại ở lượt sau thì gỡ `retired_at`.
- AC-4: Given transform S03/S05, When một tin đổi giá, diện tích, số phòng, hoặc parser đổi cách đọc, Then `offer_id` không
  đổi.
  - Khoá theo PL14-Hỏi-3 (khuyến nghị «khoá dính»: nhóm repost thừa kế `offer_id` của tin đang có chung nhiều post
    nhất; nhóm mới hoàn toàn mới băm `'<S0x>|' || <post neo>`).
  - Post đến sau mà `posted_at` sớm hơn post neo hiện tại (thu bù lịch sử) không đổi `offer_id`.
  - `originating_system_key` được điền cho mọi tin S03/S05/S06 và mọi listing.
- AC-5: Given DB local còn khoá băm nội dung, When lượt nạp đầu sau 044 chạy (trong giao dịch), Then đổi khoá xong mà
  không mất quyết định nào.
  - Mọi offer S03/S05 khoá cũ nghỉ với `retired_reason = 'doi_khoa'`.
  - `superseded_by` trỏ offer khoá mới khi có post chung.
  - Số quyết định và liên kết đếm theo khoá gốc không đổi, VÀ mọi dòng con trỏ tin sống khi đi theo chuỗi
    `superseded_by` (không treo trên tin đã nghỉ).
- AC-6: Given một listing có lịch đêm nằm ngoài mọi phường, When `transform-airbnb` hoặc `reassign-areas` chạy, Then
  listing nghỉ (`retired_reason = 'ngoai_phuong'`), `nights` và `listing_stats` của nó còn nguyên. Listing quay lại phường
  thì gỡ `retired_at`.
  - Đo cả hai đường (`transform-airbnb` và `reassign-areas`), và đường cũ `200_transform.sql` không xoá đêm của listing
    đã nghỉ.
- AC-7: Given DB local, When chạy thước `pipeline/scripts/nap-lai-ba-luot.mjs` (trong giao dịch ROLLBACK), Then 0 quyết định
  người mất và 0 liên kết mất.
  - Ba lượt nạp S03 → S05 → S06 → airbnb.
  - Mỗi lượt đổi một biến: giá một tin, `rule_id` parser, một listing ra ngoài phường.
  - Ma trận đếm viết trước (7 hàng): đề xuất enrich đã quyết · thẻ review đã quyết · ứng viên ghép merged/rejected ·
    `property_offers` · thẻ `pair:` · `nights` · `listing_stats`; mỗi hàng hai cột: có mặt theo khoá gốc, và trỏ cha
    sống theo chuỗi `superseded_by`.
  - Hai đối chứng, mỗi cái báo mất > 0 và nêu tên hàng: (a) giả lập hàm 039 cũ (DELETE + CASCADE); (b) hàm đối soát chỉ
    cho tin nghỉ mà không chuyển dòng con.
- AC-8: Given cây sau vòng, When quét `pipeline/` (trừ `db/migrations` cũ và test), Then không còn câu `DELETE FROM` /
  `TRUNCATE` nhắm `sale_offers`, `sale_offer_records`, `listings`, `listing_records`.
  - Bộ quét có cặp hai chiều: cấy một câu DELETE thì đỏ.
- AC-9: Given `sync-cloud`, When dựng tập chép, Then kết quả như sau.
  - `sale_offers`/`listings` chép từ view sống.
  - `nights`, `listing_stats`, `property_offers` chỉ gồm dòng có cha còn sống.
  - Ca listing đã nghỉ có đêm: đêm ấy không vào tập chép.
  - Suite `sync-cloud` hiện có vẫn xanh.
- AC-10: Given cloud (chỉ đọc), When đo lược đồ cloud của `sale_offers`, `listings`, các bảng con, Then có tệp SQL bắt kịp
  trong `docs/ops/` cho 043 (bản giám sát đã áp) và tệp riêng cho phần 044 cần trên cloud.
  - Mỗi tệp có phần «đo trước» và «áp».
  - Không áp gì lên cloud trong vòng này.

## Coverage

- Trục nơi xoá: hàm đối soát tin (039) | listing ngoài phường (transform-airbnb, reassign-areas) | đêm (200_transform) |
  ứng viên ghép chưa quyết (resolve-properties, giữ nguyên — không phải quyết định người).
  - Thước CE: kiểm kê DELETE/TRUNCATE 26/10 [SUY-TỪ-REPO: docs/architecture/classification-enrich-review.md].
  - AC-3, AC-6, AC-8.
- Trục quyết định và liên kết tựa vào tin: đề xuất enrich | thẻ review `enrich:` | thẻ `pair:` | ứng viên ghép đã quyết |
  `property_offers` | lịch đêm.
  - Thước CE: bảng quét L03 của review §2.1 [SUY-TỪ-REPO: docs/architecture/classification-enrich-review.md].
  - AC-3, AC-5, AC-7.
- Trục nguồn: S03 | S05 | S06 | S01 (listings).
  - Thước CE: `source_registry` + bốn transform đang chạy.
  - AC-4, AC-6, AC-7.
- Trục mặt đọc: app | data-api | pipeline sql | sync-cloud | cloud.
  - Thước CE: 50 tệp đọc hai bảng (đếm 26/10).
  - AC-2, AC-9, AC-10.

## Đường đo

- Thước: «Ba lượt nạp lại liên tiếp: 0 quyết định người mất, 0 liên kết mất» · số từ: ma trận đếm của
  `pipeline/scripts/nap-lai-ba-luot.mjs` trên DB local · bảo đảm bởi: AC-7.

## Out of scope

- Bảng phát biểu `FieldAssertion` và bộ phân xử: PL15.
- Hiệu lực tin S06 và `offer_status`: PL19. S06 vẫn tích luỹ, không đối soát.
- Gỡ đóng băng `ENRICH_COLS`: đi cùng phân xử ở PL15.
- Áp 044 lên Supabase: chỉ đo và soạn SQL, Mạnh duyệt áp sau.
- Sửa importer `stg_*` (làn ZCode) và đường Inside Airbnb Bangkok ngoài việc thôi xoá cha.

## Notes

- Ba câu riêng của PL14, khác «Hỏi-1..7» của gói OCP1: PL14-Hỏi-1 (lối A bảng bản ghi + view sống, hay lối B lọc ở mọi
  chỗ đọc — khó đảo), PL14-Hỏi-2 (đổi khoá S03/S05 một lần), PL14-Hỏi-3 (khoá neo sớm nhất hay khoá dính).
- Cổng Phạm vi và Cổng Bằng chứng do Mạnh ký (T3); giám sát không ký thay.
- Cột mới không lên cloud trừ khi thêm vào `CLOUD_ALLOW` (`sync-cloud.mjs`). Vòng này không thêm.
