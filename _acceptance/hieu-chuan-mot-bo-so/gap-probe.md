---
slug: hieu-chuan-mot-bo-so
at: 2026-10-24T23:05:00Z
verdict: findings
p0: 3
p1: 2
p2: 0
---
## Findings

| Sev | Artifact | Thiếu gì | Kịch bản fail | Thước đo | Xử lý |
|---|---|---|---|---|---|
| P0 | contract | Ngưỡng mẫu mỏng dưới 5 ghi máy quyết nhưng câu trích chỉ nói về thước giá | Khu vực 6 listing công suất 95% không cờ, người ký tưởng từ điển đã chốt | Dòng Hỏi cho người | human-gate1: Hỏi-2 (thay d-…-3), kèm cỡ mẫu metrics |
| P0 | contract | Định nghĩa «tự thu» chung ghi máy quyết; lối ba nhãn riêng vẫn sống | Bảng toàn quốc mất số tháng cuối mà không ai hỏi | Dòng Hỏi cho người | human-gate1: Hỏi-3 (thay d-…-1) |
| P0 | design | Nhãn mới người dùng thấy («Chưa có số», «n thị trường hiệu chuẩn», «đại diện cho k market S02», «mẫu mỏng», câu định nghĩa) không có dòng sổ | Cổng duyệt chữ máy tự chọn; «khu vực»/«thị trường» lẫn | Dòng sổ nhãn + ghim eval | human-gate1: Hỏi-4 liệt bộ chữ; E1 ghim «đại diện cho 2 market S02» |
| P1 | design | Cờ mẫu mỏng tính trên số listing trong cây, không trên cỡ mẫu sinh ADR/công suất | Ca Đồng Nai (cây ≥5, metrics 1) không cờ mà E4 xanh | Cờ theo cỡ mẫu metrics + ca fixture | fixed (theo khuyến nghị Hỏi-2): cờ tính trên listing_count metrics; E7 in mẫu mỏng theo cỡ mẫu ấy |
| P1 | evals | E2/E7 so qua hàm trợ giúp chung (luôn đúng); E5 thiếu ca toàn 0; E1 không đo chữ thẻ | Trang vẫn vẽ số cũ mà E2/E7 xanh; thị trường toàn 0 vẫn có thẻ | So số đã vẽ; ca toàn 0; SQL độc lập; ghim chữ | fixed: E2 gọi ba hàm truy vấn thật + vẽ ba bảng; E5 thêm ca toàn 0; E7 đếm có-số bằng SQL độc lập; E1 vẽ thẻ ghim chữ |
