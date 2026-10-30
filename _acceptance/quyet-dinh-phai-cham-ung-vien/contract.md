---
schema_version: 1
feature: Quyết định trên thẻ ghép căn chỉ ghi khi chạm đúng một ứng viên còn chờ; không chạm được thì route trả lỗi có tên, thẻ vẫn chờ, không dòng nào được ghi
slug: quyet-dinh-phai-cham-ung-vien
owner: phanlemanh@gmail.com
risk_tier: T3      # app/src/app/api/v1/ops/review/** — đường ghi quyết định (t3_paths)
surfaces: [api]
status: implemented
approved_by: Mạnh
approved_at: 2026-10-31
design_doc: docs/superpowers/specs/2026-10-31-quyet-dinh-phai-cham-ung-vien-design.md
---

# Acceptance Contract: quyet-dinh-phai-cham-ung-vien

## Context

Hàng HD9 (audit hàng duyệt 30/10, H2): 11 quyết định ngày 30/10 trên thẻ ghép căn chạm 0 dòng `property_candidates` mà thẻ
vẫn đóng, vì route ghi `review_queue` trước rồi mới cập nhật ứng viên theo cặp khoá, không đếm số dòng đổi. Đo 31/10 trên
DB máy thu: 7 thẻ chờ đều có ứng viên; 12 thẻ đã quyết không có ứng viên nào.

Căn cứ: AUDIT-H2 · LO-TRINH-HD9 · TRI-THUC hang-duyet-ghep-can.

## Criteria

- AC-1: Given thẻ ghép căn chờ mà cặp khoá không khớp dòng ứng viên nào, When người vận hành gửi Cùng căn, Khác căn hay
  Để sau (Để sau theo Hỏi-1) kèm lý do hợp lệ, Then route trả 422 với `code: "khong-cham-ung-vien"`, `so_dong: 0` và câu lỗi tiếng Việt nêu cặp
  khoá, và bốn bảng `review_queue`, `property_candidates`, `enrichment_proposals`, `ops_audit` không đổi một byte.
- AC-2: Given thẻ chờ mà ứng viên khớp cặp đã ở `merged` hoặc `rejected`, When gửi bất kỳ quyết định nào, Then 422 như AC-1
  và ứng viên giữ nguyên trạng thái cũ (không bị quyết đè).
- AC-3: Given thẻ chờ có đúng một ứng viên `pending` hoặc `needs_llm`, When gửi Cùng căn / Khác căn / Để sau, Then đúng một
  dòng ứng viên đổi sang `merged` / `rejected` / `pending` với `decided_by = hitl:<id người>`, thẻ sang trạng thái tương ứng
  kèm lý do, và đúng một dòng audit `review.decide` mang id ứng viên đã chạm.
- AC-4: Given ứng viên lưu theo chiều ngược với `item_id` của thẻ (`offer_a` = bên B), When quyết, Then vẫn chạm đúng dòng
  ấy như AC-3.
- AC-5: Given hai dòng ứng viên còn chờ khớp cùng cặp theo hai chiều, When quyết, Then 422 với `so_dong: 2`, không dòng nào
  đổi; Given một dòng còn chờ và một dòng đã quyết khớp cùng cặp theo hai chiều, When quyết, Then chạm đúng dòng còn chờ
  như ở AC-3.
- AC-6: Given thẻ ghép căn có `item_id` sai khuôn (không tiền tố `pair:`, hoặc thiếu một bên), When quyết, Then 422 với
  `code: "khong-cham-ung-vien"`, không dòng nào đổi.
- AC-7: Given route trả 422 của AC-1, When thẻ trên `/ops/review` nhận phản hồi, Then dòng lỗi của thẻ hiện nguyên câu lỗi của
  route và ô lý do giữ nguyên chữ người đã gõ.
- AC-8: Given bản chép DB máy thu, When dựng lại 12 thẻ đã quyết thành thẻ chờ rồi quyết lại, và quyết 7 thẻ chờ thật, Then
  12/12 nhận 422 và không ghi dòng nào; 7/7 đổi đúng một ứng viên mỗi thẻ; bộ thẻ duyệt của PL3 (lý do bắt buộc, audit cùng
  giao dịch, nhánh bổ sung tin) và bộ test app, typecheck, lint đều xanh.

## Coverage

Quét không gian (preset test-matrix) trên ba trục, thước CE ghi cạnh mỗi trục. Mọi ô dưới quét đủ ba quyết định (Cùng căn,
Khác căn, Để sau):
- Trạng thái ứng viên khớp × quyết định: {không dòng, `pending`, `needs_llm`, `merged`, `rejected`, hai dòng còn chờ, một
  còn chờ + một đã quyết} × {Cùng căn, Khác căn, Để sau} — AC-1…AC-5. [thước CE: bốn giá trị `status` của `property_candidates` trên DB máy thu 31/10 + khoá duy
  nhất một chiều]
- Khuôn khoá thẻ: {đúng chiều, ngược chiều, sai khuôn: không tiền tố · thiếu một bên · thừa phần `pair:A|B|C`} — AC-4,
  AC-6. [thước CE: cách `judge-run` ghi `item_id` và
  `resolve-properties` ghi ứng viên]
- Đường ra: route → thẻ → dữ liệu thật — AC-7, AC-8. [thước CE: H2 của audit, 12 thẻ đã quyết + 7 thẻ chờ]

Ô bị cắt có lý do ở Out of scope.

## Out of scope

- Đóng hay rút thẻ trỏ khoá chết (hàng `the-ghep-can-tin-roi-kho`, H1).
- Khoá nút quyết trước khi bấm khi một bên đã rời kho (hàng `the-so-doc-gia-tri-song`, U1).
- Sửa vòng đời ứng viên trong `resolve-properties` (xoá và dựng lại `pending`/`needs_llm` mỗi lượt).
- Khôi phục 11 quyết định ngày 30/10 (Mạnh chọn bỏ, audit §7.1 dòng 2).

## Đường đo

- Ngưỡng SỐNG «Thử quyết trên thẻ trỏ ứng viên đã mất: route trả lỗi có tên, thẻ vẫn chờ, 0 dòng ghi; quyết trên thẻ hợp
  lệ: đúng một ứng viên đổi trạng thái, có audit»: vế đầu đo bằng AC-1 và nửa đầu AC-8 (12 thẻ thật), vế sau bằng AC-3 và
  nửa sau AC-8 (7 thẻ thật).

## Notes
