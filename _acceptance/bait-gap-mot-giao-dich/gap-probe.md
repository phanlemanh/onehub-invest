---
slug: bait-gap-mot-giao-dich
at: 2026-11-10T10:05:00Z
verdict: findings
p0: 3
p1: 2
p2: 0
---

## Findings

| Sev | Artifact | Thiếu gì | Kịch bản fail | Thước đo | Xử lý |
|---|---|---|---|---|---|
| P0 | evals (E1) | E1 so ảnh chụp P1 với giá trị vừa tính lại. Tính lại ra cùng số, nên phép so không phân biệt được hai ca: lượt đã ROLLBACK, hay lượt đã COMMIT bait gap rồi mới chết ở bước danh bạ Người. | Bản cài chỉ khoá ở giao dịch danh bạ Người vẫn qua E1, vì bait gap đã chạy xong rồi mới kẹt khoá. | Dùng giá trị canh 999.9, cộng dòng ops_audit; chiều đỏ là bản chỉ khoá ở giao dịch danh bạ Người. | fixed: AC-1 và E1 nay dùng giá trị canh 999.9 và kiểm không có dòng ops_audit bait-gap mới. Thêm hai chiều đỏ: bỏ khoá ở giao dịch bait gap nhưng giữ ở giao dịch danh bạ Người; bỏ cả hai khoá. |
| P0 | design (sổ d-2) | Căn cứ «một lối» chỉ loại được lối BEGIN vô điều kiện, còn bỏ ngỏ lối SAVEPOINT trong thân và lối thêm tham số. | Cổng Phạm vi khoá cứng lỗ «người gọi mới ngoài giao dịch». | Viết lại căn cứ, hoặc thêm AC quét các đường gọi. | fixed: d-4 supersedes d-2, nêu vì sao từng lối kia chết: SAVEPOINT chỉ chạy được trong khối giao dịch; tham số mới trùng cờ savepoint sẵn có của buocDem. Thêm AC-8 và E8: quét mọi đường gọi, có đối chứng dương. |
| P0 | design (sổ d-3) | Câu trích về khoá theo tên chỉ là tiền lệ, không phải lời quyết. | Lựa chọn được đọc như thể đã chốt từ trước. | Đổi nguồn căn cứ. | fixed: d-5 supersedes d-3, đổi sang nguồn «một lối»: kho không có sổ đăng ký số khoá advisory nên số chọn tay có thể trùng. |
| P1 | contract + evals | Chưa có AC nào đo ca lượt chết giữa câu đặt rỗng và câu tính lại. | Bản COMMIT riêng câu 1 vẫn qua hết các eval. | Thêm AC-7: bản chép chèn lỗi ngay sau câu đặt rỗng, kèm giá trị canh. | fixed: thêm AC-7 và E7, chiều đỏ là bản chép bỏ giao dịch. Trục «Kết cục» thêm nhánh «chết giữa hai câu». |
| P1 | evals (E3) | E3 thiếu chiều đỏ, và chỉ đo trạng thái cuối. | Mã không khoá cũng hội tụ về cùng một kết quả nên vẫn xanh. | Đo quan hệ xếp hàng thật. | fixed: E3 nay kiểm pg_locks có ít nhất một lần chờ (granted = false) trên khoá chung. Chiều đỏ: bản chép bỏ khoá thì không thấy lần chờ nào. |
