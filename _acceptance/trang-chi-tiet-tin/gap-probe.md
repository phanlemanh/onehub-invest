---
slug: trang-chi-tiet-tin
at: 2026-11-04T02:49:44Z
verdict: findings
p0: 2
p1: 3
p2: 0
---

## Findings

| Sev | Artifact | Thiếu gì | Kịch bản fail | Thước đo | Xử lý |
|---|---|---|---|---|---|
| P0 | design | Dòng sổ về URL ghi máy quyết, câu trích không quyết URL, URL là cam kết ra ngoài kho. Phần lo `/listing` ngoài `/vn/**`: đã đo, `portals.md` xếp `/listing/**` vào Invest công khai. | Mạnh duyệt mà không biết URL là lựa chọn của mình; đổi sau phải redirect. | Dòng sổ `chi-nguoi`, `kho_dao: true`. | fixed: thành Hỏi-3; AC-4 quét phản hồi HTTP chưa đăng nhập của chính đường này. |
| P0 | contract | Vài dòng máy quyết có căn cứ yếu (bản đồ, ảnh, tin hết hạn); hợp đồng không có mục Hỏi. | Mạnh tưởng bản đồ, ảnh không có lối khác; đường dẫn đã gửi thành 404 trơn. | Dòng sổ mới, mục Hỏi trong hợp đồng. | fixed: thêm mục Hỏi, Hỏi-4 gộp ảnh và bản đồ, tin hết hạn thêm câu chung và ghi lý do một lối. rejected phần `kho_dao` của dòng Xem số: cách cũ không đổi; việc ship ra người dùng vẫn dừng ở Cổng Bằng chứng theo luật khó-đảo. |
| P1 | evals | AC-1 chỉ đo ở jsdom, không đo được đích bấm thật. | Lớp phủ đè lên Xem số mà E1 vẫn xanh. | ui-check bấm toạ độ thật theo ma trận. | fixed: thêm E1u. |
| P1 | evals | AC-2 thiếu tag cross-layer, fixture viết tay; E4 không bắt lộ qua props, thiếu `floor_raw`, meta description. | Câu đọc quên block, hoặc `source` nằm trong payload RSC mà test vẫn xanh. | Eval DB, phản hồi HTTP thật gồm `__next_f`, bản sao chỉ truyền props. | fixed: thêm E2b; E3, E4 đo phản hồi HTTP; AC-4 thêm các cột và bản sao props. |
| P1 | design | Chưa xét `market_asset_stats`: khoá dòng, loại hình; không eval đo cột trang đọc có trên cloud. | Đo lại: bảng có lên cloud nhưng không có loại hình, một căn hộ bị so với trung vị phần lớn là nhà; đọc cột không có trên cloud thì production trả 500. | Ghi số đo, eval cột là tập con `CLOUD_ALLOW`. | fixed: dời so phường thành Hỏi-5 và OOS-7, E2b đo tập con `CLOUD_ALLOW`. |
