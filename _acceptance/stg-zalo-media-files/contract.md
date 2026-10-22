---
schema_version: 1
feature: Nạp ảnh Zalo N1 (meta.mediaFiles) xuống stg_zalo_posts.media_files
slug: stg-zalo-media-files
owner: phanlemanh@gmail.com
risk_tier: T3
surfaces: [cli]
status: implemented
approved_by:
approved_at:
gate1_skipped: true
---

# Acceptance Contract: stg-zalo-media-files

## Context

N1 (ZCode, đã merge main 605a837) tải ảnh zdn.vn — URL có hạn — vào thư mục raw
snapshot lúc flush và ghi mapping ở `RawItem.meta.mediaFiles` (DATA-CONTRACT
schemaVersion 2). Việc này đưa mapping đó xuống tầng staging (`stg_zalo_posts.media_files`,
migration 035) để transform và `/ops` dùng được về sau. Ảnh là PII tầng A (ADR-0007): chỉ
máy local, không bao giờ lên cloud. Bốn tiêu chí do Mạnh chốt qua phiên điều phối
«Phân chia công việc Claude/Zcode» (23/10/2026), chọn «nghiệm thu gọn».

Source input: prompt (brief phiên điều phối local_5d0e32a0…, 23/10/2026)

## Criteria

- AC-1: Given DB local đã có hoặc chưa có cột `media_files`, When áp `db/migrations/035_stg_zalo_media_files.sql` hai lần liên tiếp, Then cả hai lần không lỗi, schema sau lần 2 trùng sau lần 1, số dòng `stg_zalo_posts` không giảm và không có dòng trùng; một migration không idempotent đưa vào cùng bộ kiểm thì bị bắt.
- AC-2: Given một snapshot `zalo-agent` schemaVersion 2 có bài mang `meta.mediaFiles` và một snapshot v1 không có, When chạy `pipeline/import-airbnb.mjs` (kể cả nạp lại cùng snapshot), Then bài v2 có ảnh mang `media_files` = mảng hợp đồng `{url,file,sha256,bytes,error}` kèm `snapshotId`, bài không ảnh và bài v1 mới có `media_files` NULL, nạp lại không nhân đôi, và bài lặp lại ở snapshot v1 sau giữ nguyên `media_files` đã có.
- AC-3: Given luồng sync cloud chỉ đẩy các bảng trong `FILL` của `pipeline/sync-cloud.mjs`, When chạy `pipeline/sync-pii.test.mjs`, Then test xanh với code hiện tại, và ĐỎ khi `stg_zalo_posts` (bảng mang `media_files`) bị cấy vào `FILL` — kể cả khi chỉ chạy riêng ca đọc schema DB (không bảng nào trong FILL có cột `media`/`media_files`).
- AC-4: Given các snapshot `zalo-agent` thật trong `~/dev/onehub-invest/collector/snapshots`, When chạy backfill (`pipeline/backfill-zalo-media.mjs`) rồi `--check`, Then báo cáo in ra số snapshot (tổng, v2), số bài có ảnh trong raw v2, số chưa nạp = 0 và số dòng `stg_zalo_posts` mang `media_files`; `--check` đỏ khi còn bài có ảnh chưa nạp.

## Coverage

- Bỏ coverage-scan — phạm vi gọn do Mạnh chọn (4 AC theo brief); trục chính đã phủ bằng tay: phiên bản snapshot (v1 | v2), trạng thái ảnh (có file | lỗi tải | không ảnh), lần nạp (đầu | lặp cùng snapshot | lặp ở snapshot sau), đường rời máy (FILL tĩnh | schema DB).

## Out of scope

- Transform (`transform-zalo.mjs`) và trang `/ops` đọc `media_files` — chỉ chuẩn bị tầng stg.
- Đẩy bytes ảnh hay `media_files` lên cloud dưới bất kỳ dạng nào (kể cả hash) — cấm theo ADR-0007.
- Restart collector API :9210 để sinh snapshot v2 thật — việc của Mạnh/ZCode; hiện 0 snapshot v2 thật nên số backfill thật là 0.
- Map `media_files` sang resource RESO Media ở canonical (ADR-0011) — khi lên canonical.
- Sửa cột `media` cũ (019) đang nhận jsonb `'null'` thay vì SQL NULL.
- Áp migration 035 lên Supabase prod — bảng stg không có ở cloud.

## Notes

- Hợp đồng dựng SAU khi code xong (commit 68d4af1) theo quyết định nghiệm thu gọn của Mạnh → `gate1_skipped: true`; Cổng 1 không diễn ra, chữ ký Cổng 2 là điểm duyệt duy nhất.
- T3 vì chạm `db/migrations/**` và `pipeline/sync-cloud.mjs` (t3_paths).
- `pipeline/import-airbnb.mjs` thuộc làn ZCode — sửa tích hợp, ghi rõ trong commit.
- Mọi eval máy cần DB local :5433 (container `one-invest-db`). Dữ liệu giả của eval mang tiền tố riêng mỗi lần chạy và luôn được xoá.
