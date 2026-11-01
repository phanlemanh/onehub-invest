---
schema_version: 1
feature: Căn của tin chung bài đăng nhận theo khi đề xuất làm giàu được áp hay hoàn tác — migration 066 mở rộng chuỗi cập nhật căn của 063, kèm sửa một lần phần lệch đã có
slug: can-theo-tin-khi-phan-xu-lai
owner: phanlemanh@gmail.com
risk_tier: T3
surfaces: [api]
status: draft
design_doc: docs/superpowers/specs/2026-11-01-can-theo-tin-khi-phan-xu-lai-design.md
approved_by:
approved_at:
---

# Acceptance Contract: can-theo-tin-khi-phan-xu-lai

## Context

Ngoài-8 của `phat-bieu-db-do-tren-main` (Mạnh «mở hợp đồng mới», 31/10): 063 phân xử lại mọi tin chung bài đăng khi áp/hoàn
tác đề xuất, nhưng căn (`properties`) của các tin chung ấy không nhận theo — chỉ căn của tin trong đề xuất được điền ô trống
(`063:92-114`) hay gỡ giá trị (`063:169-194`). Bước dựng căn hằng đêm không ghi `bedrooms`/`bathrooms`/`street`, nên căn lệch
tin mãi, không nhật ký. Migration 066 (sổ liên làn). Hạng T3: `db/migrations/**`.

## Criteria

- AC-1: Given tin A và B chung một bài đăng, B gắn căn PB (khác hoặc cùng căn PA của A), PB còn trống `bedrooms`, When áp
  một đề xuất `bedrooms` của A (máy hoặc người, B sống hoặc đã nghỉ), Then PB nhận `max()` giá trị phân xử của các tin trong
  tập (đề xuất ∪ chung bài đăng) gắn PB, `enrichment_log` của PB có một dòng `enrich-proposals` mang `offer_ids` chứa B; ô PB
  đã có giá trị thì giữ nguyên. Khi PB khác căn PA, bản hàm 063 để PB trống; khi PB = PA, giá trị như 063, chỉ khác dòng log.
- AC-2: Given trạng thái sau AC-1, When hoàn tác đề xuất đó, Then PB mất giá trị khi không tin nào khác của PB còn mang nó
  (và giữ khi còn tin mang — kể cả chính B còn mang giá trị đó từ nguồn riêng sau phân xử lại), PB có một dòng
  `enrich-revert`; khi PB khác căn PA, bản hàm 063 để PB giữ giá trị đã rút.
- AC-3: Given tin C không chung bài đăng với ai, When áp + hoàn tác đề xuất của C, Then mọi căn (md5 bảng `properties`) và
  cột của C bằng đúng kết quả của bản 063.
- AC-4: Given lệch dựng bằng chính bản 063 (áp đề xuất của A bằng `apply_enrichment` 063 nên căn PB của B chung bài còn
  trống), When chạy khối sửa một lần của 066, Then đúng các ô lệch ấy được điền (số ô = đếm độc lập trước/sau), `ops_audit`
  có đúng một dòng `can-theo-tin:sua-mot-lan-066` ghi số căn và số ô; chạy lần hai 0 ô, không thêm dòng; đề xuất đã hoàn
  tác thì 0 ô; căn không gắn tin chung bài thì không đổi; ô căn đã có giá trị thì giữ nguyên.
- AC-5: Given DB thử dựng lại từ đủ migration của nhánh (gồm 066), When áp 066 lần hai, Then thoát 0 và không đổi định nghĩa
  hàm hay nhật ký; itest chung bài đăng (063) và bộ test pipeline xanh; DB `oneinvest` dùng chung không bị chạm.

## Coverage

Bỏ quét không gian — ba trục liệt tay (dòng `descope` trong sổ):

- Trục A — thao tác: áp · hoàn tác · sửa một lần → AC-1, AC-2, AC-4
- Trục B — tin chung: sống · đã nghỉ; cùng căn · khác căn với A; máy · người → AC-1, AC-2 (ma trận viết trước)
- Trục C — không chung bài đăng (không hồi quy) → AC-3
- Later: tin đổi `property_type` bị nối sang căn mới, liên kết cũ không gỡ (Hỏi-4).
- Never: ghi đè ô căn đã có giá trị khi áp.

## Out of scope

- Liên kết tin → căn khi `property_type` đổi (`resolve-properties.mjs`) — hàng riêng.
- Áp 066 lên DB máy thu :5433 — bước triển khai riêng, Mạnh duyệt, pg_dump trước.
- Đẩy Supabase.

## Notes
