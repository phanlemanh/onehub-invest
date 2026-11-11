---
slug: danh-ba-vat-the-toan-quoc
at: 2026-11-10T07:57:53Z
verdict: findings
p0: 0
p1: 3
p2: 2
---

## Findings

| Sev | Artifact | Thiếu gì | Kịch bản fail | Thước đo | Xử lý |
|---|---|---|---|---|---|
| P1 | design | Đường cũ khi chưa áp 088 không chặn dựng lần đầu khu mới theo meta.city | Lệnh tay dựng Ocean Park 2 hay Ecopark trước khi Mạnh áp 088 đúc UPI VN-HN vĩnh viễn | Vế chặn trong AC-7, E7: khu chưa có toà bị từ chối, 0 toà mới | fixed: thiết kế §2 chỉ dựng lại khu đã có toà khi chưa áp 088; AC-7, E7 thêm vế chặn; dòng sổ d-20261110T075752Z-11 thay d-20261110T075444Z-5 |
| P1 | evals | Bảng vàng E1 viết tay cùng nguồn với migration, không chặn được hiểu sai luật tên | Lấy nhầm mã tỉnh bị nhập, cả migration lẫn bảng vàng sai, E1 vẫn xanh | Rút bảng vàng bằng máy từ bản chụp ISO 63 mã nối tinh.json theo tên; bảng 34 dòng lên thẻ | fixed: E1 nối pipeline/data/iso-3166-2-vn.json với tinh.json theo chuanTen, ngoại lệ duy nhất Huế; bảng 34 dòng trong thiết kế §2 |
| P1 | evals | AC-4 chỉ đo trên bảng tổng hợp, chưa chạy trên cây areas thật | area_ids thật của Ecopark trỏ cấp khác, hàm thật ra lỗi trong khi E4 xanh | Ca isoCuaKhu cho mọi nút trên DB lượt, ghim ba khu Hưng Yên VN-66 | fixed: thêm E4c (sau suaXaNut, 20/20 nút ra ISO, ghim năm khu); E4b chọn mã bằng truy vấn |
| P2 | evals | Chưa ca nào dựng toà ở tỉnh thứ ba qua lệnh dựng | Chỗ khác trong lib vẫn chỉ nhận HN/SG, dung() không dựng được tỉnh thứ ba | dung() trên khu Hưng Yên với fixture S08 tối thiểu | fixed: thêm E5b (Ocean Park 2 → toà VN-66) có đối chứng meta.city |
| P2 | evals | Chiều đỏ E3 không đạt được vì ON CONFLICT DO NOTHING | Người làm không dựng được chiều đỏ như đã ghim | Chiều đỏ đạt được: thêm dòng 35, bỏ guard | fixed: E3 chiều đỏ thêm dòng thứ 35 và bỏ guard IF NOT EXISTS |
