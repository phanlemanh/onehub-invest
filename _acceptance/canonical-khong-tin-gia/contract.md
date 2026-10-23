---
schema_version: 1
feature: Bảng canonical không còn tin sinh từ dữ liệu thử, và transform từ chối post thử nếu lọt vào
slug: canonical-khong-tin-gia
owner: phanlemanh@gmail.com
risk_tier: T3
surfaces: [cli]
status: verified
design_doc: docs/superpowers/specs/2026-10-23-canonical-khong-tin-gia-design.md
approved_by: Mạnh
approved_at: 2026-10-23
---

# Acceptance Contract: canonical-khong-tin-gia

## Context

L19 (`docs/architecture/classification-enrich-review.md` §0.3): 1.020/1.102 tin S03 trong `sale_offers` sinh từ
snapshot `zalo-mock`, 153/155 tin S03 mang `bait_gap_pct` là tin giả, `sellers` chứa người bán giả, và FILL đã đưa
chúng lên cloud. Importer bỏ snapshot thử là PL1 (làn ZCode, không thuộc đợt) — nên transform phải tự từ chối post
thử, và dọn tồn đọng qua `reconcile_stale_offers` (039) để có `ops_audit`.

Source input: hàng PL2 `docs/plan/lo-trinh.json` (câu giao + `bat_khi`) · `opportunity.md` (Mạnh gõ «build duyệt»
23/10) · luật đợt dot0-cam-mau mục PL2. Hạng: lộ trình ghi T3 (máy suy từ đường dẫn ra T2 — giữ T3 vì vòng xoá dữ
liệu canonical và lan lên cloud).

## Criteria

- AC-1: Given một hàng `stg_zalo_posts`, When gọi `testMarker`, Then trả đúng tên dấu theo ma trận viết trước — `snapshot-source` cho nguồn snapshot `zalo-mock`/`example`/chứa `mock|test|e2e`, `agent` cho `agent_id` bắt đầu `e2e|test|mock`, `group` cho `group_name` bắt đầu `TEST` (hết chuỗi hoặc ký tự không phải chữ theo sau) — và `null` cho post thật (snapshot `zalo-agent` với `agent_id` `openclaw-hook` hoặc `apify-facebook`, nhóm có chữ «test» không ở đầu tên, nhóm mở đầu bằng một từ dài hơn như «TESTING…»).
- AC-2: Given stg có post thật và post thử lẫn nhau (kể cả một post thử cùng băm offer với một post thật), When transform S03 dựng offer qua `loadStgPosts` + `runTransformZalo`, Then không offer nào chứa `post_id` của post thử, offer trộn còn lại với `post_ids` và `n_reposts` chỉ tính post thật, và offer sinh từ post thật không đổi so với lượt không có post thử.
- AC-3: Given stg có post `apify-facebook` gắn dấu thử, When transform S05 đọc stg, Then nó đọc qua cùng `loadStgPosts` (kênh `facebook`) và post thử không vào offer S05 nào.
- AC-4: Given `sale_offers` S03 đang có offer sinh từ post thử (gồm offer có thẻ chờ `enrich:<offer>`), When lượt transform S03 chạy, Then các offer đó bị rút qua `writeOffers` → `reconcile_stale_offers` (không câu `DELETE FROM sale_offers` mới nào), thẻ chờ của chúng thành `rejected` kèm ghi chú, và `ops_audit` có dòng `enrich:reconcile` (số offer cũ) cùng dòng `transform:reject-test` `{source, rejected, by_marker}` của lượt đó.
- AC-5: Given lượt transform không gặp post thử nào, When chạy, Then không ghi dòng `transform:reject-test`; Given mọi post của kênh đều là post thử, When chạy, Then transform dừng có lỗi và không offer nào của nguồn bị xoá (lượt rỗng không đối soát).
- AC-6: Given offer giả đã bị rút, When `refreshBaitGap` chạy, Then không offer nào sinh từ post thử mang `bait_gap_pct`, offer P1 thật trong phường có thước vẫn được tính `bait_gap_pct`.
- AC-7: Given `sellers` có người bán không còn offer nào (vd chỉ đăng trong tin giả) và người bán còn offer thật, When `refreshBaitGap` chạy, Then người bán không còn offer bị xoá, người bán còn offer giữ nguyên `phone_hash` với cột tổng hợp làm mới, và `ops_audit` có dòng `bait-gap:sellers-orphan` `{deleted, remaining}` khi xoá ít nhất một (cách xử lý theo khuyến nghị Hỏi-2 — người chốt ở Cổng Phạm vi).
- AC-8: Given DB local thật (23/10), When chạy `test-data-residue.mjs --simulate`, Then trong giao dịch sau transform S03 + `refreshBaitGap`: `offers_from_test` = 0, `bait_gap_from_test` = 0, `sellers_from_test` = 0, `sellers_orphan` = 0, có dòng `enrich:reconcile` và `transform:reject-test` mới, `markers` báo số post thử theo dấu — rồi ROLLBACK, số dòng `sale_offers`/`sellers`/`ops_audit` sau lệnh bằng trước lệnh; và Given một offer dựng từ post thử (fixture trong giao dịch), When đo dư lượng, Then `offers_from_test` ≥ 1 và lệnh báo mã thoát 1.
- AC-9: Given lượt transform S03 và S05 chạy, When so `stg_zalo_posts` trước/sau, Then số dòng và nội dung stg không đổi (transform chỉ lọc ở đầu đọc, không xoá stg — tầng của importer).
- AC-10: Given `sellers` local tụt dưới 50% số dòng trên cloud vì lượt dọn người bán mồ côi, When `sync-cloud` soát chặn tụt, Then lượt sync chỉ cho `sellers` qua khi local có dòng `ops_audit` `bait-gap:sellers-orphan` trong 24 giờ mà `remaining` bằng đúng số dòng `sellers` đang gửi; thiếu dòng, dòng cũ hơn 24 giờ, lệch số, hay bảng khác tụt → vẫn dừng «shrink» như cũ (cách xử lý theo khuyến nghị Hỏi-4 — người chốt ở Cổng Phạm vi).

## Coverage

- Trục A — Dấu post thử: nguồn snapshot giả | agent thử | nhóm thử | post thật (đối chứng) [thước CE: đếm `stg_zalo_posts` DB local 23/10 (1.260 · 1 · 2 · 967 thật) + câu giao PL1 «zalo-mock, e2e, TEST» + manifest `zalo-mock`/`example`]
- Trục B — Nơi tin thử lan tới: `sale_offers` S03 | `sale_offers` S05 | `bait_gap_pct` | `sellers` | thẻ chờ + đề xuất enrich | `property_offers`/`property_candidates` | `ops_audit` | cloud [thước CE: khoá ngoại `pg_constraint` tới `sale_offers` + `refresh-bait-gap.mjs` + FILL của `sync-cloud.mjs`]
- Trục C — Tình huống lượt: lượt đêm có post thử | lượt không post thử | lượt toàn post thử | offer trộn | mô phỏng ROLLBACK [thước CE: `writeOffers` (lượt rỗng ném lỗi) + băm offer bước 4 của transform-zalo]
- Core 10 ô → AC-1…AC-10. Khoá ngoại tới `sellers`: 0 (`pg_constraint`, đo 23/10) — xoá người bán không kéo bảng nào theo.
- Chặn tụt của `sync-cloud.mjs` (`SHRINK_MIN` 0,5, mọi bảng FILL): sau dọn `sale_offers` còn ~92%, `sellers` còn ~5% → AC-10. Later/Never: design doc §3.
- `property_offers`/`property_candidates` không thành AC: 0 liên kết tới offer giả (đo 23/10) và CASCADE sẵn; cloud không thành AC: FILL thay toàn bảng, kiểm sau merge là bước triển khai.
- [GIẢ ĐỊNH] Ba dấu ở AC-1 phủ mọi dữ liệu thử đang có trong stg; nguồn thử mới đặt tên khác (vd `staging-…`) sẽ lọt — thước là đếm DB local 23/10, không phải danh sách khai của collector.
- [GIẢ ĐỊNH] Người bán không còn offer nào là người bán giả hoặc người bán không còn đăng — xoá khỏi registry dẫn xuất không mất thông tin không dựng lại được (registry không có cột người nhập tay ngoài `name` lấy từ offer).

## Đường đo

- Ngưỡng «0 dòng sale_offers và sellers sinh từ snapshot thử» → `pipeline/scripts/test-data-residue.mjs` (`offers_from_test`, `sellers_from_test`, `sellers_orphan`) · AC-8 bảo đảm.
- Ngưỡng «ops_audit có dòng dọn» → dòng `enrich:reconcile` + `transform:reject-test` · AC-4, AC-8.
- Ngưỡng «tính lại bait gap» → `bait_gap_from_test` = 0 và offer P1 thật còn bait gap · AC-6, AC-8.
- Trong vòng đo bằng `--simulate` (ROLLBACK); số sau dọn thật đọc bằng cùng lệnh không cờ sau lượt 00:00 đầu tiên kể từ merge.

## Out of scope

- Importer bỏ snapshot thử và dọn `stg_*` (PL1, làn ZCode).
- Sửa tay DB prod hay chạy sync cloud trong vòng — lượt sync 15′ kế (qua AC-10) tự thay `sale_offers`/`sellers` trên cloud.
- Dọn thật DB local trước merge (theo khuyến nghị Hỏi-1).
- Độ tươi S03 trong `450_dq_checks.sql` đang tính bằng snapshot `zalo-mock`; `source_registry` S03 ghi `zalo-mock,zalo-groups`.
- Đường INSERT người bán mới vào `sellers` (mất từ 907f4bd, 21/10).

## Notes

- Kiểm thử DB chạy trong BEGIN…ROLLBACK trên Postgres local :5433 (khuôn `pipeline/scripts/write-offers.test.mjs`).
