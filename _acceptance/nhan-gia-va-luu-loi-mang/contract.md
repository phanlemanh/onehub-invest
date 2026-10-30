---
schema_version: 1
feature: Người gắn nhãn gõ giá có dấu chấm ngăn nghìn hay gửi đơn vị lạ thì bị chặn với lỗi dưới ô thay vì lưu sai 1000 lần, và mất mạng khi Lưu thì thấy thông báo
slug: nhan-gia-va-luu-loi-mang
owner: phanlemanh@gmail.com
risk_tier: T2
surfaces: [ui, api]
status: verified
design_doc: docs/superpowers/specs/2026-10-30-nhan-gia-va-luu-loi-mang-design.md
approved_by: Mạnh
approved_at: 2026-10-30
---

# Acceptance Contract: nhan-gia-va-luu-loi-mang

## Context

Hàng sửa Ngoài-3, Ngoài-5, Ngoài-7 của PL7 `man-gan-nhan-mu` (đã gộp, PR #190). Cổng Đáng `build`: Mạnh 30/10 «P4 làm cả
hai: nhan-gia-va-luu-loi-mang trước, rồi PL8». Không có hàng lộ trình (giám sát P4-92). Nhãn là đáp án chuẩn của PL9 nên
giá trị mơ hồ phải bị từ chối, không được đoán.

## Criteria

- AC-1: Given một lượt ghi đủ chín ô hợp lệ, When đơn vị của giá là `"tỷ"`, `"TY"`, `"billion"`, chuỗi rỗng, hoặc vắng, Then
  chuẩn hoá trả lỗi ở ô giá «Đơn vị giá không hợp lệ» và route trả 400, không ghi dòng nào; đơn vị `"ty"` và `"trieu"` vẫn qua.
- AC-2: Given ô giá (tỷ và triệu) hoặc ô diện tích, When người gõ số có một dấu `.` hoặc `,` theo sau đúng ba chữ số
  (`4.350`, `1.200`, `12.500`, `4,350`), Then lỗi ở đúng ô đó «Dấu ngăn nghìn không được nhận — gõ 4350 hoặc 4,35», không
  ghi dòng nào.
  - Số có hơn một dấu (`4.350.000`, `1.200,5`, `4.350,5`): lỗi đúng ô «phải là số», không ghi dòng nào.
  - Vẫn nhận và đổi đúng: `3.5`, `3.85`, `4,35`, `4350`, `64.5`, `64,5`, `4.3500`.
  - Khứ hồi cũ giữ nguyên: «4,35 tỷ» và «4350 triệu» cùng ra `4350000000`.
- AC-3 (cross-layer): Given biểu mẫu đã điền và lời gọi lưu không tới được máy thu (lỗi mạng), When bấm «Lưu và sang tin
  kế», Then trong khung biểu mẫu hiện Alert «Không chắc đã lưu — mất kết nối tới máy thu. Chữ đã gõ còn nguyên.» kèm nút «Lưu
  lại»; trang không tải lại, chữ đã gõ còn nguyên; bấm «Lưu lại» khi có mạng thì lưu và sang tin kế.
  - Năm kết cục của lời gọi lưu (đã lưu, lỗi theo trường, đã có người gắn, lỗi máy chủ, mất kết nối) được phân đúng trên
    phản hồi của route thật (lược đồ tạm), trừ lỗi máy chủ và mất kết nối được giả lập.
  - Lượt trước đã ghi nhưng phản hồi bị mất: «Lưu lại» nhận 409 «Anh đã gắn tin này» → coi là đã lưu, sang tin kế; bảng
    nhãn có đúng một lượt của người này cho tin đó.
- AC-4: Given màn đang chạy, When gõ «4.350» ở ô giá rồi Lưu, Then lỗi hiện dưới ô giá, các ô khác còn nguyên chữ, không sang
  tin khác.
- AC-5: Given nhánh so với merge-base, When liệt kê tệp đổi, Then chỉ trong `app/src/lib/labels-normalize.ts`,
  `app/src/lib/labels-queries.ts` (chỉ dời hằng chữ lỗi), `app/src/components/ops/labels/label-form.tsx`, `app/tests/labels*.test.tsx`, `_acceptance/config.yaml`, hồ sơ này,
  design doc, tệp máy sinh (`PRODUCT-MAP.md`, `LO-TRINH.html`).

## Coverage

- Ba lỗi đã khai, mỗi lỗi một trục: **đơn vị giá** (AC-1) · **dấu ngăn nghìn** (AC-2, AC-4 vế màn) · **lỗi mạng khi
  Lưu** (AC-3) · **phạm vi** (AC-5). Bỏ quét hình thái — sổ quyết định, dòng `descope` «bỏ coverage-scan».

## Đường đo

- Ngưỡng ở `opportunity.md`: 0 nhãn giá lệch bậc trên lát gắn đầu. Số từ: sau buổi gắn đầu, quét TOÀN BỘ nhãn giá của lát
  bằng một câu SQL cờ mọi giá ngoài dải căn hộ OCP1 (dưới 300 triệu hoặc trên 100 tỷ):
  `SELECT l.item_id, l.field, l.value FROM eval_labels l JOIN eval_label_items i USING (item_id) WHERE i.lat = 'ocp1' AND
  l.field IN ('price_min_vnd','price_max_vnd') AND NOT l.not_stated AND (l.value::numeric < 3e8 OR l.value::numeric > 1e11)`,
  rồi đọc tay mọi dòng bị cờ đối chiếu chữ tin. SỐNG khi sau đọc tay còn 0 nhãn lệch bậc. AC bảo đảm: AC-1, AC-2 (bộ chuẩn
  hoá từ chối dạng mơ hồ thay vì đoán).
- Giới hạn: dải giá bắt lệch 1000 lần (4,35 triệu ≪ 300 triệu) nhưng không bắt lệch nhỏ hơn bậc trong dải.

## Out of scope

- Ngoài-4 (ô sai kiểu → lỗi 500 thay vì 400 nêu ô) và Ngoài-6 (lấy mẫu bổ sung lệch cơ cấu) của PL7.
- Ngoài-1/2/8/9/10 của PL7 (phép đo nghiệm thu, không phải hành vi màn).
- Đổi cách nhập giá (ô số có định dạng, chọn đơn vị khác).

## Notes

- Câu chờ Mạnh ở Cổng Phạm vi: Hỏi-1 (dấu chấm ngăn nghìn), Hỏi-2 (dấu phẩy + đúng ba chữ số) — sổ quyết định.
