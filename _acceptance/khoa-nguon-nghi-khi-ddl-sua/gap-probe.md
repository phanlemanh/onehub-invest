---
slug: khoa-nguon-nghi-khi-ddl-sua
at: 2026-11-09T08:40:00Z
verdict: findings
p0: 1
p1: 1
p2: 3
---
## Findings

| Sev | Artifact | Thiếu gì | Kịch bản fail | Thước đo | Xử lý |
|---|---|---|---|---|---|
| P0 | contract | Căn cứ của dòng sổ bỏ coverage-scan không quyết việc bỏ quét [do-lam-giau#F1]; bảng trục sót mã lỗi khác 55P03, sót nhiều bảng nguồn (bảng bị chặn đứng sau), và ô lock_timeout ghi có AC dù Ngoài-6 ngoài phạm vi | Bản cài thử lại mọi mã lỗi treo 5 phút với 42P01 mà E1–E6 vẫn xanh; người duyệt tưởng ô lock_timeout đã đo | Dòng sổ thay; AC và eval lỗi khác ném ngay; ca hai bảng; sửa ô lock_timeout | fixed: AC-6 + E7 (42P01 dưới 250 ms, đột biến thử lại mọi mã lỗi trong E4), AC-1 gọi hai bảng với bảng bị chặn đứng sau, ô lock_timeout ghi ngoài phạm vi (Ngoài-6), dòng sổ descope mới supersedes căn cứ cũ |
| P1 | design | Ngưỡng 20% của AC-3 chưa có số đo, dễ đỏ oan dưới tải; mẫu ngoài khoảng gọi–trả làm loãng tỉ lệ bản đột biến | E3 đỏ chập chờn trên mã đúng, hoặc E4 chiều đỏ có lúc không đỏ | Chỉ đếm mẫu trong khoảng gọi–trả, in tỉ lệ, ngưỡng ở giữa hai chiều | fixed: mẫu chỉ trong khoảng gọi–trả, in tỉ lệ, ngưỡng mã đúng 50% (bản đột biến ~95%) |
| P2 | evals | Chiều đỏ mã cũ của E1 chỉ ghim nhánh hết 40 lượt; dưới tải mã cũ có thể trả về ở lan 30–40 với thông điệp khác | E4 đỏ dù đột biến đã bị bắt | Ghim cùng một thông điệp cho hai nhánh đỏ | fixed: ném 55P03 hay lan > 25 cùng thông điệp 'KN KHOA NGOAI 33033 QUAY KHONG NGHI' |
| P2 | evals | Phép âm «không giữ 33033» thiếu đối chứng dương; vế ACCESS SHARE chưa ghim relation | Truy vấn pg_locks lọc sai khoá → mọi vế không-giữ xanh vô điều kiện | Phiên đối chứng giữ 33033 mà hàm đo phải thấy; ghim relation; đột biến quên nhả 33033 | fixed: đối chứng dương 'KN do khoa 33033 hong', relation ghim bằng regclass, đột biến 'quên nhả 33033 khi vào được' → 'KN CON GIU 33033' |
| P2 | contract | Tập hồi quy không nhất quán (sáu so với mười tệp); sổ hứa E5, E6 bắt chiều chậm mà E5, E6 không đo thời gian | Tệp mới dùng thư viện không được chạy; người duyệt tin chiều chậm đã có thước | Đối chiếu danh sách bằng grep; hoặc rút lời hứa | fixed: Context và design ghi mười tệp, probe E4 đối chiếu danh sách import với AC-5 ('DANH SACH HOI QUY LECH'); dòng sổ approach mới rút lời hứa đo thời gian, Notes ghi chiều chậm không có thước |
