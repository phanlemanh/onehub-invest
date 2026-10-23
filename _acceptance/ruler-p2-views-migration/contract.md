---
schema_version: 1
feature: Đưa view ruler v_ruler_p2_area + v_ruler_p2 vào migration và hướng dẫn bắt kịp schema cloud
slug: ruler-p2-views-migration
owner: phanlemanh@gmail.com
risk_tier: T3      # db/migrations/** + pipeline/sync-cloud.mjs (dữ liệu rời máy)
surfaces: [config, docs]
status: signed-off
approved_by: Mạnh
approved_at: 2026-10-22
---

# Acceptance Contract: ruler-p2-views-migration

## Context

View `v_ruler_p2_area` và `v_ruler_p2` (ruler giá/m² "một căn một phiếu", commit 50005b7) chỉ được
tạo tay ở DB local, không có trong `db/migrations/`. DB dựng từ repo thiếu view → `/ops/deals`,
`/dau-tu`, `/api/v1/deals`, `pipeline/refresh-bait-gap.mjs` lỗi. Khi đo cloud (chỉ đọc) còn thấy
schema Supabase thiếu cột của 030/031/032 nên sync 15' gãy ở `sale_offers` (PGRST204) và cloud
đang trống `sale_offers`/`properties`/…; 031 thêm `properties.seller_name` (PII tầng A) mà
`sync-cloud.mjs` chưa loại.

Thay đổi: migration `034_ruler_p2_views.sql`; `PII_EXCLUDE.properties = ["seller_name"]` trong
`pipeline/sync-cloud.mjs`; `docs/ops/cloud-schema-catchup-2026-10-22.md` + `.sql` (Mạnh tự chạy);
`scripts/check-ruler-views.sh` (thước đo).

Source input: prompt (phiên `local_b06f552b…`, phát hiện từ E14 của `_acceptance/portal-deals-airdna`).

## Criteria

- AC-1: Given một DB trống, When áp lần lượt mọi file `db/migrations/*.sql`, Then `v_ruler_p2_area` tồn tại với đúng cột `area_id,m,n` và `v_ruler_p2` với đúng cột `area_id,property_type,m,n`.
- AC-2: Given DB local :5433 đang có hai view tạo tay, When áp `034` hai lần liên tiếp, Then cả hai lần exit 0 và kết quả của từng view (md5 toàn bộ dòng) giống hệt trước khi áp — không đổi logic ruler.
- AC-3: Given DB local sau khi áp 034, When đọc `v_ruler_p2_area`, Then view có ≥1 phường (không rỗng do định nghĩa sai) và KHÔNG phường nào dưới ngưỡng 5 căn có mặt.
- AC-4: Given `pipeline/sync-cloud.mjs`, When sync dựng danh sách cột cho `properties`, Then `seller_name` bị loại (PII tầng A không rời máy) — không có đường nào khác trong thay đổi này đưa cột đó lên cloud.
- AC-5: Given `docs/ops/cloud-catchup-2026-10-22.sql`, When đọc nội dung, Then file chỉ có DDL (không UPDATE/INSERT/DELETE/TRUNCATE) và KHÔNG tạo cột `seller_name`.
- AC-6: Given một DB mô phỏng cloud (migration 001–029, chưa có 030+), When chạy SQL catch-up hai lần, Then cả hai lần exit 0; cột các bảng sync khớp local trừ đúng `properties.seller_name`, không cột thừa; `asset_nodes.parent_id` cho phép NULL, không default; `v_ruler_p2` tồn tại.
- AC-7: Given module `pipeline/`, When chạy bộ test, Then xanh như trước (không hồi quy do sửa sync-cloud).
- AC-8: Given hướng dẫn `docs/ops/cloud-schema-catchup-2026-10-22.md`, When Mạnh đọc, Then biết vì sao, thứ tự bắt buộc (merge bản vá PII vào main trước, rồi chạy SQL), lệnh chạy, cách kiểm sau khi chạy — và không có bước nào để agent tự áp lên production. (judgment)

## Coverage

- Trục nơi chạy: DB trống từ repo (AC-1) | DB local có view tạo tay (AC-2, AC-3) | cloud mô phỏng (AC-6) | cloud thật — KHÔNG đo trong eval (Mạnh chạy; kiểm theo AC-8).
- Trục dữ liệu rời máy: cột PII qua sync (AC-4) | cột PII qua DDL cloud (AC-5) | đầu ra view là aggregate (AC-1 cột cố định).
- Trục hồi quy: logic ruler không đổi (AC-2) | test pipeline (AC-7).
- Bỏ quét morphological đầy đủ — thay đổi hẹp (2 view sao nguyên văn + 1 dòng loại cột), các trục trên đã liệt kê đủ nơi chạy.

## Out of scope

- KHÔNG tự áp bất cứ gì lên Supabase production (luật 2) — Mạnh chạy SQL catch-up.
- KHÔNG sửa lỗi tồn đọng khi dựng DB trống: 012 tham chiếu `area_sources` trước khi tạo; 031 bước 5 `WHERE properties.id` sai alias (cần migration sửa riêng).
- KHÔNG thêm bộ chạy migration tự động cho cloud.
- KHÔNG đổi logic ruler (ngưỡng 5tr–500tr/m², ≥5 căn) — chép nguyên văn từ `pg_get_viewdef`.
- KHÔNG đổi chỗ đọc view trong app/pipeline (`v_ruler_p2` hiện không nơi nào đọc; vẫn đưa vào migration vì commit gốc định nghĩa nó).
- KHÔNG mở rộng leak gate của sync-cloud để kiểm cột PII ở cloud (đề xuất làm sau).

## Notes

- Thứ tự thực tế: code (034, bản vá sync-cloud, docs) viết TRƯỚC contract trong cùng phiên — contract mô tả đúng cái đã làm, Gate 1 duyệt trên vật có sẵn.
- Sự cố trong phiên: một lệnh thử `import('./sync-cloud.mjs')` đã chạy `main()` thật lúc ~21:56 (TRUNCATE cloud, nạp lại areas/listings rồi chết EPIPE) → cloud thiếu `market_metrics`/`nights`/… ~3 phút; đã `launchctl kickstart com.oneinvest.cloud-sync` (đúng job theo lịch, code `main`) lúc 21:57, đếm lại cloud khớp như trước lúc 21:59.
- Số 033 đã bị nhánh `feat/enrich-qua-de-xuat` giữ (chưa vào main) → dùng 034.
