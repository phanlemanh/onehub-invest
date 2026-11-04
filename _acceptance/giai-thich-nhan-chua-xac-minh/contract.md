---
schema_version: 1
feature: giải thích hai nhãn «Chưa xác minh» ngay trên thẻ tin và trên trang Phương pháp
slug: giai-thich-nhan-chua-xac-minh
owner: phanlemanh@gmail.com
risk_tier: T1      # chỉ thêm lời giải thích quanh nhãn có sẵn và một mục chữ; không đổi dữ liệu, quyền, luồng hay cách lấy số
surfaces: [web]
status: draft      # T1: không qua Cổng Phạm vi / Cổng Bằng chứng; người gộp PR là người chốt
---

# Acceptance Contract: giai-thich-nhan-chua-xac-minh

## Context

Hồ sơ có mặt vì PR chạm `app/` (ngoài `t1_skip_globs`). Phiên lái thử `s03-len-cong` ngày 04/11/2026, vấp 4 và 5: nhãn vàng
chỉ là chữ, rê chuột hay bấm không ra gì, trang Phương pháp không nhắc tới, người xem không biết thẻ không nhãn nghĩa là gì.

Hai nhãn cùng chữ nói về hai thứ khác nhau (`CONTEXT.md`): một về tin, một về số. Chữ nhãn giữ nguyên vì `s03-len-cong` và
`so-ghep-s06-nhan-danh-ba` ghim nó; lời giải thích mới mang tên riêng «Tin chưa xác minh», «Số chưa xác minh».

## Criteria

- AC-1: Given thẻ có nhãn tin hoặc nhãn số, When bấm nhãn, Then ra lời giải thích đúng loại và liên kết tới đúng mục Phương pháp (`GT-AC-1`).
- AC-2: Given thẻ không nhãn, When dựng thẻ, Then không có nút giải thích; hai nhãn có hai lời khác nhau (`GT-AC-2`).
- AC-3: Given bản sao bỏ bọc giải thích, When chạy cùng phép đo, Then thước ra đỏ còn Badge vẫn còn (`GT-AC-3`).
- AC-4: Given các đích giải thích, When đối chiếu `OFFER_LABELS`, Then mỗi đích có mục, có mục thẻ không nhãn, và trang vẽ mục đó (`GT-AC-4`).

Lệnh: `cd app && node --import tsx --test tests/giai-thich-nhan-chua-xac-minh.test.tsx`.

## Out of scope

- OOS-1: Gỡ tên nguồn và chữ «giả lập» trên trang Phương pháp: phiên «Gỡ tên nguồn và chữ giả lập trên cổng công khai» làm.
- OOS-2: Trang chi tiết tin: hồ sơ `trang-chi-tiet-tin`.
- OOS-3: Gắn nhãn cho tin nhóm S05: hôm nay nhãn tin chỉ theo `OFFER_UNVERIFIED_SOURCE = "S03"`, S05 có 30 tin ở DB máy thu không nhãn. Chữ mới không khẳng định thẻ không nhãn đã kiểm chứng, nên vẫn đúng.

## Notes

- Rê chuột mở, đợi một giây rồi bấm thì lời giải thích đóng lại: bật, tắt mặc định của Base UI. Đo trên bản chạy: rê mở, rời chuột đóng, đi chuột tới liên kết vẫn mở, bấm khi chưa mở thì mở, Enter mở và Esc đóng, ở khổ 375 sáng và 800 tối. Chưa thử bằng chạm thật, chỉ chuột trên khổ giả lập.
