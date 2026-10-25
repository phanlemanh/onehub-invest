---
slug: ops-mobile-cot-trang-thai
at: 2026-10-24T22:55:00Z
verdict: findings
p0: 1
p1: 1
p2: 3
---

## Findings

| Sev | Artifact | Thiếu gì | Kịch bản fail | Thước đo | Xử lý |
|---|---|---|---|---|---|
| P0 | contract, design, sổ d-2 | Cắt hay xuống dòng ô tên Nhóm S03 ở 160px là lựa chọn nghĩa sản phẩm mà sổ ghi máy quyết; không AC nào đo ô tên đọc được | Hai nhóm cùng tiền tố bị cắt giống nhau, một hỏng — chạm không hiện title, người trực không biết nhóm nào; AC xanh | Tách d-2; câu hỏi cho Mạnh; vế đo ô tên không bị cắt + chiều đỏ | human-gate1: Hỏi-1 (khuyến nghị bỏ truncate, xuống dòng); dòng sổ mới thay d-2 (supersedes); AC-3 thêm vế ô tên Nhóm không bị cắt |
| P1 | contract AC-3, evals E3 | Chỉ đo mép ô hàng đầu, không đo nhãn trạng thái trọn trong ô | Nhãn «Im 5 ngày — kiểm tra …» tràn ô 150px mà E3 xanh | Mọi hàng, nhãn trọn trong ô, chiều đỏ ô 60px | fixed: AC-3/E3 đo mọi hàng trang đầu, nhãn trọn trong ô (scrollWidth ≤ clientWidth), chiều đỏ (b) ô 60px; rút nhãn Nhóm còn «Im N ngày» (sổ) |
| P2 | contract AC-4, evals E4 | Đếm th so với định nghĩa đang bị sửa, không có tập cột gốc ghim trước | Nhân đôi cột trạng thái + mất một cột vẫn n/n | Tập data-col-id gốc từ 4af4dd8, so tập | fixed: AC-4/E4 so tập data-col-id với tập gốc ghim ở design doc §3; chiều đỏ gỡ một cột, nhân đôi + gỡ |
| P2 | contract AC-3, evals E3 | Bảng 0 hàng thì vế đo ô dữ liệu không chạy mà vẫn ok | Nhóm S03 0 hàng trên DB local, gate xanh | Mỗi bảng ≥ 1 hàng hoặc thoát có tên | fixed: AC-3/E3 đòi ≥ 1 hàng, 0 hàng → báo «không có hàng để đo — <bảng>» |
| P2 | opportunity, contract AC-3 | So với khung cuộn chứ không với khung nhìn của trang | Phần tử khác làm trang rộng hơn 390, trạng thái vẫn ≤ mép khung | innerWidth + scrollWidth tài liệu ≤ 390, chiều đỏ phần tử 500px | fixed: AC-3/E3 thêm mép phải ≤ innerWidth, trang không cuộn ngang, chiều đỏ (c) phần tử 500px |
