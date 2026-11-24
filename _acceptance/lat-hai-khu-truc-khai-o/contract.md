---
schema_version: 1
feature: Lát nhãn trục hai-khu-truc của PL36 trên /ops/labels chỉ hiện hai ô Toà và Trục, như lát có khai ô, để Mạnh duyệt 110 bài nhanh
slug: lat-hai-khu-truc-khai-o
owner: phanlemanh@gmail.com
risk_tier: T2
surfaces: [ui]
status: implemented
veto_state: mo
veto_opened_at: 2026-11-24T14:49:27Z
approved_by:
approved_at:
design_doc: docs/superpowers/specs/2026-11-24-lat-hai-khu-truc-khai-o-design.md
---

# Acceptance Contract: lat-hai-khu-truc-khai-o

## Context

Hàng HT21, hàng nền của PL36 AC-10 (GS giao 24/11). Lát `hai-khu-truc` đã nạp lên DB máy thu nhưng chưa khai ô, nên màn hiện đủ 17
ô kèm căn cứ (≈ 5,5 giờ cho 110 bài). Khuôn lát có khai ô đã ký ở hồ sơ `lat-khai-o-can-gan`.

## Acceptance Criteria

- **AC-1** Given lát `hai-khu-truc`, When đọc khai ô của lát, Then ra đúng `building`, `stack`, nhãn ô Trục «Trục (hai số cuối của
  số căn)», nhãn ô Toà như cũ; lát `hai-khu-ghep-b` vẫn `building`, `subzone`. Chiều đỏ: bản bỏ dòng khai thì lát không còn khai ô
  và ca đỏ, thông điệp gọi tên lát.
- **AC-2** (ui-observed) Given biểu mẫu `/ops/labels` dựng thật cho một bài của lát, When hiện, Then chỉ có hai ô Toà, Trục, mỗi ô
  có «Không suy ra được», không ô căn cứ, không ô Lý do, bộ đếm 0/2; lát không khai vẫn đủ ô.
- **AC-3** Given mọi lát khác, When đọc khai ô, Then không đổi gì so với trước (một dòng thêm, không sửa dòng cũ).

## Coverage

- Bỏ quét không gian AC — xem dòng sổ `descope` «bỏ coverage-scan»: một dòng khai theo khuôn đã ký, trục duy nhất là lát.

## Out of scope

- Sửa luật «căn cứ Chữ bài phải đọc được trong chữ» để nhận trục theo quy ước Mã căn (lát có khai không đòi căn cứ nên không cần).
- Trợ lý điền nháp, thẻ cài lỗi, chấm Wilson — thuộc PL36 và phiên gắn nhãn.

## Notes
