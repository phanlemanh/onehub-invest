---
slug: can-gia-tot-loc-xep-hang
at: 2026-11-18T05:14:38Z
verdict: findings
p0: 1
p1: 4
p2: 0
---
## Findings
| Sev | Artifact | Thiếu gì | Kịch bản fail | Thước đo | Xử lý |
|---|---|---|---|---|---|
| P0 | design | Cắt trang trong SQL không khớp luật tab chỉ có ở hàm thieuGi | Tab ghi 100 căn nhưng trang chỉ còn 3 dòng, hợp các trang không bằng số trên tab | E4 đi hết trang theo từng tab, vai, lược đồ; đột biến lọc tab sau khi cắt trang đỏ | fixed: thiết kế bốn bước, cắt trang trên danh sách mã sau khi xếp tab; sửa AC-4, E4 |
| P1 | contract | Chưa định nghĩa dự án trải nhiều phường; 260 căn mang hai cách gọi | Mục dưới phường ghi 40, bấm ra 100 căn | E5 thêm dự án hai phường, cây × kind × type, tổng các tỉnh bằng tổng tập | fixed: tỉnh có hai nhánh Phường và Dự án; đo xác nhận 260 căn gắn thẳng tỉnh; sửa AC-5, E5, E11 |
| P1 | evals | E8 chưa phủ ?can= của vai Người xem, cột Gọi ai, lời báo cloud | Người xem mở ?can= và nhận SĐT trong dữ liệu trang | E8 quét HTML và RSC thật, đối chứng vai Vận hành | fixed: thêm các ca vào E8, thêm khung vai Người xem vào E10 |
| P1 | evals | Chưa giải thích 8.065 và 7.385, chưa ghim căn nhiều tin ở biên trang | Trang chỉ còn 13 dòng, căn lặp qua trang | Fixture có căn hai tin ở biên trang; E11 đi hết trang trên DB máy thu | fixed: 8.065 tin gộp còn 7.385 căn, 493 căn nhiều tin; sửa thiết kế, AC-4, E4, E11 |
| P1 | contract | Số nền nghi mâu thuẫn; AC-10 không rõ 15/15 áp cho màn nào | Người duyệt ký mốc sai | Đo cấp × nhãn; tách AC-10 thành hai màn | fixed: đo xác nhận 832 đều mang nhãn Giá tốt; sửa thước thuê thành 8.527 và 696 (cộng đủ 9.223); viết lại AC-10 |
