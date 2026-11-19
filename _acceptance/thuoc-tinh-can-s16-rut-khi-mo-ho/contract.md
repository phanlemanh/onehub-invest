---
schema_version: 1
feature: Căn S16 đã có thuộc tính mà lần thu sau chuyển sang nhóm mơ hồ toà thì phát biểu thuộc tính cũ bị rút với lý do riêng và trang dự án Danh bạ không còn hiện thuộc tính cũ
slug: thuoc-tinh-can-s16-rut-khi-mo-ho
owner: phanlemanh@gmail.com
risk_tier: T2
surfaces: [cli]
status: implemented
design_doc: docs/superpowers/specs/2026-11-19-thuoc-tinh-can-s16-rut-khi-mo-ho-design.md
veto_state: mo
veto_opened_at: 2026-11-19T01:27:22Z
---

# Acceptance Contract: thuoc-tinh-can-s16-rut-khi-mo-ho

## Context

Hàng DA48, mở từ Ngoài-7 ở Cổng Bằng chứng DA40. Hàng kèm việc sửa phép đo của DA40 đỏ sau gộp. Không có migration.

## Criteria

### AC-1 — Căn thành mơ hồ toà thì mất thuộc tính cũ
Given căn đã có phát biểu S16 còn sống do chính lệnh `--ghi` ghi ở lần thu trước, và lần thu sau mã căn nằm trong nhóm `mo_ho` của `v_s16_can`, hoặc mã ở hai toà trong snapshot mà không có trong `mo_ho`,
When chạy `--ghi`,
Then ở cả hai nhánh, mọi phát biểu S16 còn sống của căn bị rút với `retract_reason = 'chuyen-mo-ho-toa'` và `v_unit_thuoc_tinh` không còn dòng của căn. Ca này đỏ trên mã trước khi sửa.

### AC-2 — Chỉ rút đúng phần của S16 trên đúng căn
Given cùng lượt có căn không đổi nhóm, căn thành mơ hồ có thêm phát biểu của nguồn khác, và căn đổi giá trị ở lần thu sau,
When chạy `--ghi`,
Then căn không đổi nhóm giữ nguyên số phát biểu sống; phát biểu nguồn khác của căn mơ hồ còn sống; căn đổi giá trị vẫn rút với lý do `thay-boi-lan-thu-sau`, khác lý do của căn mơ hồ.

### AC-3 — Chạy lại không rút thêm
Given đã chạy `--ghi` cho một lần thu,
When chạy lại cùng lần thu, hoặc chạy lần thu mới mà căn vẫn mơ hồ,
Then rút 0 phát biểu và chèn 0 dòng cho căn đó.

### AC-4 — Chạy thử báo trước, lỗi thì không rút dở
Given có căn thành mơ hồ,
When chạy không có `--ghi`, Then đầu ra có số căn và số phát biểu sẽ rút, bằng phép đếm thẳng, chỉ tính căn còn phát biểu S16 sống, và DB không đổi.
When bước chèn lỗi trong lượt `--ghi`, Then phát biểu đã rút được hoàn lại.

### AC-5 — Hết mơ hồ thì có lại thuộc tính
Given căn đã bị rút vì mơ hồ,
When lần thu sau mã căn không còn mơ hồ và chạy `--ghi`,
Then căn có lại phát biểu S16 còn sống và `v_unit_thuoc_tinh` có dòng của căn.

### AC-6 — Trang dự án không còn đọc thuộc tính cũ
Given căn đã bị rút vì mơ hồ,
When lớp đọc của trang dự án Danh bạ đọc thuộc tính và ô phủ của toà,
Then căn đó không có thuộc tính và số căn có thuộc tính của ô phủ giảm đúng một.

### AC-7 — Phép đo của DA40 không phụ thuộc trạng thái nhánh
Given ca `TTC-AC-1` chạy trên nhánh không có migration, trên nhánh có thêm migration mới, trên `main` sau gộp và trên DB có thêm trường CHECK,
When chạy ca,
Then ca xanh; dữ liệu cấy một dòng migration bị sửa, bị xoá hoặc bị đổi tên làm phép đo migration đỏ với thông điệp nêu tên tệp, và dữ liệu cấy thiếu một trường bắt buộc làm phép đo CHECK đỏ với thông điệp nêu tên trường.

### AC-8 — Số thật trên máy thu không đổi
Given DA40 đã áp trên DB máy thu,
When chạy thử bằng mã của hàng này,
Then số căn sẽ rút bằng 0; số phát biểu sống khớp bộ lọc rút lớn hơn 0 và bằng phép đếm độc lập; số căn có thuộc tính lớn hơn 0 và bằng số đã có trên DB máy thu.

## Đường đo

- Số căn và số phát biểu bị rút vì mơ hồ toà: dòng `rut_mo_ho` của lệnh, đếm lại bằng `retract_reason = 'chuyen-mo-ho-toa'` · AC-1, AC-4, AC-8.

## Coverage

Quét hình thái làm tay. Trục **chuyển nhóm** (thường → mơ hồ · mơ hồ → thường · thường giữ nguyên · mơ hồ giữ nguyên) × **nguồn phát biểu** (S16 · nguồn khác) × **chế độ** (chạy thử · ghi · chạy lại · lỗi giữa chừng) × **lớp đọc** (view · trang dự án). Core → AC-1…AC-6, AC-8. AC-7 là việc sửa phép đo đi kèm.

## Out of scope

- Căn biến mất khỏi snapshot mà không thành mơ hồ.
- Lỗi đọc `v_s16_can` bị nuốt ở lệnh chạy thử (Ngoài-3, Ngoài-6 của DA40).
- Lịch chạy tự động cho lệnh `--ghi`.

## Notes

- Known limits: (trống tới S4)
