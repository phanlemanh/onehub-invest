---
slug: ops-review-khung-hang-cho
at: 2026-10-26T05:05:00Z
verdict: findings
p0: 3
p1: 2
p2: 0
---
# Gap-probe — ops-review-khung-hang-cho

Tác tử context sạch (feature-loop:cham-doc) đọc design + contract + evals + decisions + claims (input 5) + opportunity
(input 6). Không đọc code.

## Findings

| Sev | Artifact | Thiếu gì | Kịch bản fail | Thước đo | Xử lý |
|---|---|---|---|---|---|
| P0 | contract | Bộ lọc Trạng thái + mặc định «Chờ duyệt» là lựa chọn người dùng thấy mà sổ ghi máy quyết (dòng bậc mot-loi chỉ loại được lọc theo bậc) [listings-filters-store-locator#F1] | Hàng duyệt chỉ còn thẻ đã quyết → mặc định 0 dòng, «Xoá lọc» về đúng mặc định đó (ngõ cụt) | Dòng sổ chi-nguoi + ca «chỉ còn thẻ đã quyết» có lối thoát tới dòng thật | fixed: dòng sổ Hỏi-2 (chi-nguoi, khuyến nghị giữ mặc định Chờ duyệt) → human-gate1; code hiện «Không còn thẻ chờ duyệt» + nút «Xem thẻ đã quyết»; AC-2 + E3 thêm ca chỉ-còn-thẻ-đã-quyết kèm chiều đỏ |
| P0 | contract | Dòng sổ smoke-chỉ-GET ghi mot-loi nhưng lối «bấm thật, chặn route decide» vẫn sống; AC-5 (cross-layer) chỉ đo ở jsdom | Nút trong sheet mất handler trên bản dựng thật mà E7 vẫn xanh | Smoke chặn route decide, so trọn ma trận body, đếm DB trước/sau | fixed: dòng sổ mới supersedes d-8 (smoke bấm với page.route); E19 layer backend-effect; AC-5 + Notes sửa |
| P0 | contract | Dòng bỏ thao tác hàng loạt trích routes.md — câu đó không quyết việc dời khỏi UI1 | Người ký không biết UI1 bỏ một chức năng tệp trích ghi là của trang | Trích câu giao của hàng tách riêng | fixed: dòng sổ mới supersedes d-5, trích câu giao UI12 (ops-review-tra-lai-hang-loat, đứng trên UI1) trong lo-trinh.json |
| P1 | evals | E7 chỉ kiểm router.refresh được gọi — đo chỉ dẫn, không đo sheet sau khi refresh | Thẻ vừa quyết rời bộ lọc → sheet tra danh sách đã lọc ra undefined, đóng/trắng | Rerender với thẻ đang mở đã approved: còn dialog, badge «Đã duyệt», 0 nút | fixed: E7 thêm ca rerender + chiều đỏ; sheet tra thẻ trong `items` (không phải `rows`) |
| P1 | evals | Vế ảnh 390 px của AC-7 có hai đường đo dựa nhau, đều có nhánh ok khi không có ảnh | DB không thẻ nào có ảnh → vế ảnh không được đo ở đâu | E10 FAIL khi không có thẻ chờ có ảnh; đo đáy ảnh ≤ đỉnh chân sheet | fixed: E10 bỏ nhánh ok thay thế, thêm kiểm chân sheet không che ảnh |
