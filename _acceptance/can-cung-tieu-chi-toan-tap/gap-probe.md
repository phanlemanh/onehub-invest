---
slug: can-cung-tieu-chi-toan-tap
at: 2026-11-19T09:18:00Z
verdict: findings
p0: 0
p1: 3
p2: 2
---

## Findings

| Sev | Artifact | Thiếu gì | Kịch bản fail | Thước đo | Xử lý |
|---|---|---|---|---|---|
| P1 | contract | AC-3 hứa «mọi căn cùng phường» mà không có trần, trong khi tab giữ trần 20; E3 không có ca vượt 20 (cùng phường trung vị 62, lớn nhất 730) | S3 theo đúng chữ AC-3 gửi đủ 730 căn kèm ảnh, chữ bài xuống trình duyệt, đúng phương án thiết kế đã loại; E3 vẫn xanh | Trần 20 kèm «Hiện 20 / M»; ca (d) 27 căn cùng phường; đột biến trả đủ danh sách đỏ | fixed: AC-3 ghi trần 20 kèm «Hiện 20 / M căn»; E3 thêm căn (d) và đột biến trả đủ danh sách |
| P1 | contract | Chưa ghim luật cho căn ứng viên thiếu diện tích (736 căn thuê) hay chưa rõ loại hình khi căn đang xem có đủ trường | Mã và lệnh đếm của E9 tự chọn mỗi bên một luật; E9 đỏ hay xanh mà không có căn cứ [thuoc-tinh-can-s16#F1] | Dòng sổ chốt luật; ứng viên thiếu trường trong fixture E1 | fixed: dòng sổ giữ luật hiện có của canCungTieuChi (ứng viên thiếu trường không được tính), ghi vào AC-1; E1 thêm hai ứng viên thiếu trường |
| P1 | design | Dòng sổ d-2 khai mục tiêu nhưng câu trích 02/11 không quyết tập so theo tab và theo bộ lọc | Người duyệt không được hỏi; Mạnh hiểu «danh sách» là toàn danh sách thì AC-5 lộ ở phiên nghiệm thu | Chuyển thành câu hỏi người | fixed: Hỏi-2 thay d-2 (supersedes), khuyến nghị theo bộ lọc, mọi tab |
| P2 | evals | Danh sách E2 không có căn hai tin, thứ tự thiếu khoá phá hoà | Bảng 20 dòng lặp một căn hay đổi thứ tự giữa hai lần chạy mà E2 vẫn xanh | Căn hai tin trong top 20, hai căn bằng mức giảm ở vị trí 20, 21; đột biến khử trùng theo mã tin | fixed: AC-2 thêm khoá mã căn; E2 thêm căn hai tin, hai căn bằng mức giảm và đột biến khử trùng theo mã tin |
| P2 | evals | AC-9 hứa màn tải 3 giây nhưng E9 chỉ đo hàm đọc; nhịp mở tab không có ngưỡng | Màn thật hay tab trên tin thuê chậm vài giây mà không bằng chứng nào báo | Hai số đo riêng, ba lần, ghi tải máy | fixed: AC-9 và E9 đo thời gian trả HTML (dưới 3 giây) và action trên căn thuê lớn nhất (dưới 1,5 giây) |
