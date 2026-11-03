---
slug: so-ghep-s06-nhan-danh-ba
at: 2026-11-02T22:16:22Z
verdict: findings
p0: 2
p1: 3
p2: 0
---

## Findings

| Sev | Artifact | Thiếu gì | Kịch bản fail | Thước đo | Xử lý |
|---|---|---|---|---|---|
| P0 | contract | Sổ S1 ghi `kho_dao:false` cho danh bạ, lúc hiện nhãn, chữ nhãn, cột trong view dù chạm người dùng thật; `loi_chet` của cột view chỉ nêu giá; lý do không nối người S06 trích hằng code; bỏ design-pass không có trong mục quyết định [sdt-s06-ghep-tai-khoan#F1] [people-hien-so-goc#F3] | Mạnh duyệt mà chỉ thấy câu làm nhãn ở vòng này chạm ra ngoài, không biết mình bỏ design-pass và chấp nhận 590 người không có tin ở /ops/people | Dòng supersedes đổi `kho_dao`, đổi nguồn sang chi-nguoi, thêm Hỏi vào hợp đồng | fixed + human-gate1: thêm sáu dòng supersedes; hợp đồng có Hỏi-1 đến Hỏi-7, mỗi Hỏi chạm ra ngoài nói rõ |
| P0 | design | Mất dấu xuất xứ làm nhãn hỏng theo hướng mở, không eval nào thấy; descope Ngoài-5 không có dòng sổ; cách trang Bán hỏng không có dòng sổ | Hàm phân xử bị ghi đè, khoảng 11.762 tin hiện số ghép không Badge, `dungNguoi` sinh bí danh không rút được, mọi eval xanh | Hỏng theo hướng đóng hoặc ca đo; ghi sổ và trình Hỏi | fixed + human-gate1: đổi thành danh sách dương `s06-so-tren-tin` ở view và danh bạ, thêm ô mất dấu vào E1, E4; đọc cột khoan dung; dòng descope Ngoài-5; Hỏi-5 |
| P1 | evals | E9 không có cận dương, không phân biệt có hay không có bản sửa, không chạy gán và dựng người, không báo số người không có tin [sdt-s06-ghep-tai-khoan#F2] | Lệnh chỉ áp migration: mọi số bằng 0, PASS; bỏ nhánh sửa vẫn xanh | Chạy gán, dựng người; cận dưới; chỉ tiêu đếm `rutDinhDanh` với đối chứng bỏ nhánh | fixed: AC-9, E9 có `so_ghep_ra_so=0` và `so_ghep_ra_so_neu_bo_nhanh` lớn hơn 0, cận trên dưới, số người không có tin |
| P1 | evals | Đường nhãn tới mắt người không có eval xuyên suốt; năm mốc không được liệt kê; thiếu ô NULL; E8u chỉ route sale; E8 không kiểm biến thể | Cột chưa điền thì thẻ không Badge; trang Cho thuê không truyền prop; sync gãy mà không ai thấy | Năm mốc trong thiết kế, itest sync thật, ô NULL, ảnh route thuê, assert biến thể | fixed: năm mốc ở thiết kế, E6 sync thật và thiếu cột, E7 năm ô, E8 dùng OfferCard và kiểm biến thể, E8u thêm trang thuê |
| P1 | evals | E1 thiếu vai và nguồn fixture; E2 đếm dòng thay vì quan hệ; E4 fixture chưa qua writer, không so giá trị cột cũ; E10 thiếu ADR-0011 trong inputs [sdt-s06-ghep-tai-khoan#F3] [sdt-s06-ghep-tai-khoan#F4] | Tin mất vai mà E1 xanh; E2 đỏ giả ở ca số thứ hai; view đọc sai khoá mà E4 xanh; hội đồng phán theo suy đoán | So tập cặp, ghi bằng writer thật, md5 cột cũ của view, thêm input | fixed: sửa `expected` của E1, E2, E4, thêm ADR-0011 vào `inputs` của E10 |
