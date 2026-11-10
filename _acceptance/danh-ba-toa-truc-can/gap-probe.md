---
slug: danh-ba-toa-truc-can
at: 2026-11-06T22:14:00Z
verdict: findings
p0: 1
p1: 4
p2: 0
---

## Findings

| Sev | Artifact | Thiếu gì | Kịch bản fail | Thước đo | Xử lý |
|---|---|---|---|---|---|
| P0 | design | Dòng sổ d-…-5 máy quyết hai việc (S08 bậc xác minh; đúc toà từ tin khi ≥ 3 người đăng khác nhóm) bằng câu F2, nhưng F2 chỉ nói gắn tin vào trục khi DT, PN khớp — không quyết đúc khoá toà hay xếp bậc S08 | Ba môi giới ba nhóm gõ sai cùng một tên toà, bộ dựng đúc toà ma bậc suy_ra_manh, bảng chỉ thêm giữ nó vĩnh viễn, PL20 gắn tin vào; mọi eval xanh vì E8 ca (d) đòi đúc | Thay d-5 bằng câu chỉ-người; E8 ca (d) đổi thành chỉ ứng viên, chiều đỏ «DBV-AC-8 đúc toà từ tin» | human-gate1: Hỏi-4 (d-…-17 supersedes d-…-5), khuyến nghị S08 xác minh, toà từ tin chỉ ứng viên; AC-8, E8 ca (d) và design §4.3 bước 5 đã sửa theo khuyến nghị |
| P1 | contract | Ngưỡng SỐNG đã ký có vế «3 dòng toà cũ sang bảng toà, khoá cũ giữ làm bí danh»; hợp đồng đổi thành «xử lý theo Hỏi-1» mà không nói đó là sửa ngưỡng đã ký | Mạnh duyệt Hỏi-1 theo khuyến nghị, Cổng Giá trị đặt số cạnh ngưỡng đã ký và chấm trượt vế đó, hoặc ngưỡng bị sửa sau khi thấy số | Thẻ Hỏi-1 nói rõ chọn khuyến nghị là sửa ngưỡng; dòng sửa ghi vào opportunity.md cùng lượt duyệt | fixed: Hỏi-1 viết lại (d-…-18 supersedes d-…-9) nêu việc sửa ngưỡng; mục Đường đo của hợp đồng ghi câu sửa sẽ vào opportunity.md cùng lượt duyệt |
| P1 | evals | «Mọi toà có khoá» và «0 căn không bằng chứng» chỉ đo trên fixture; mẫu số Đường đo bỏ qua toà có toàn bộ mã không tách; chưa có ca hai dự án cùng khu cùng mã toà | Một dự án dùng khuôn chưa khai (dưới 10% mã) — E7 vẫn ≥ 90% mà mọi toà của dự án đó không có khoá; hai phân khu cùng mã toà va bí danh, căn dự án hai nhận khoá dự án một | E7 rút tập (dự án, toà) độc lập và đếm unt_ không bí danh trên bản chép; E3 thêm ca hai dự án cùng khu cùng mã | fixed: bí danh S08 mang phạm vi dự án (d-…-19, mot-loi); AC-3 thêm vế phạm vi dự án và mọi dự án có toà; E3 thêm ca, chiều đỏ «DBV-AC-3 hai dự án chung khoá»; E7 thêm hai assert và đếm ứng viên gộp |
| P1 | evals | E11 chỉ kiểm tên ba bảng mới trong FILL; bí danh ma_nguon và phát biểu Building nằm trong hai bảng có sẵn, cần lọc theo dòng nếu hai bảng ấy lên cloud | registry_aliases vào FILL vì danh bạ Người, lần sync kế đẩy bí danh mang mã S08 thật lên Supabase, E11 vẫn xanh | E11 chạy bộ chọn dòng thật trên fixture, đòi 0 dòng vật thể, đủ dòng Người; chiều đỏ «DBV-AC-11 vật thể lên cloud: registry_aliases ma_nguon» | fixed: AC-11 và E11 thêm vế lọc dòng cho registry_aliases, field_assertions (hôm nay hai bảng không có trong FILL — đo 07/11) |
| P1 | evals | AC-1 hứa «đúng kết quả như trước 082» (quan hệ) mà E1 chỉ đếm số dòng; chưa đo hàm phân xử tin không thấy phát biểu vật thể; index bí danh mới có thể mở đường chèn trùng bí danh Người qua cột NULL | Index mới có cột phạm vi NULL cho bí danh Người, cùng sdt_bam chèn hai lần, /ops/people lệch, E1 vẫn xanh | E1 so băm tập dòng của ca Người và hàm phân xử trước, sau 082 và sau khi ghi phát biểu Building; ca chèn bí danh Người trùng bị từ chối | fixed: AC-1 viết lại thành quan hệ (băm tập dòng, gồm hàm phân xử); E1 thêm ca bí danh Người trùng; design §4.1 dùng index riêng `WHERE kind = 'ma_nguon'`, phạm vi nằm trong giá trị, không cột NULL |
