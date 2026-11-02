---
slug: the-duyet-nguoi-nhieu-nhieu
at: 2026-11-01T06:45:00Z
verdict: findings
p0: 1
p1: 3
p2: 1
---
## Findings
| Sev | Artifact | Thiếu gì | Kịch bản fail | Thước đo | Xử lý |
|---|---|---|---|---|---|
| P0 | design | Dòng sổ d-6 gói hai lựa chọn dưới nguồn mục-tiêu; câu trích không quyết đích gộp, còn coi sự kiện the-duyet là «bí danh nối» là diễn giải lại ngưỡng đã ký của HD13 | Thước HD13 bị nới qua dòng máy tự quyết; người hai SĐT gộp nhầm lọt qua | Tách d-6 thành hai dòng; ngoại lệ bất biến HD13 thành câu chỉ-người | human-gate1: tách thành d-9 (đích gộp, một-lối) và Hỏi-4 d-10 (chỉ-người, anh quyết ở Cổng Phạm vi); cả hai supersedes d-6 |
| P1 | contract | Chưa định nghĩa thẻ approved áp lên thành viên nào khi nhóm đổi giữa lúc duyệt và lượt dựng | Duyệt A+B, chiều C nối vào: gộp một phần hoặc quyết định mất lặng lẽ | Vế mới trong AC-5 + hình (d) của E5 | fixed: AC-5 áp đúng thành viên ghi trong evidence; E5 hình (d) — nhóm mới có thẻ chờ riêng |
| P1 | contract | Luật chống trùng mọi trạng thái gặp luật máy tự đóng thẻ: nhóm co rồi giãn về mã cũ không còn thẻ chờ | Ca nhiều–nhiều không có thẻ nào trên /ops/review | Vòng co–giãn trong E2, chiều đỏ ghim «nhóm sống không có thẻ hiệu lực» | fixed: AC-2 định nghĩa thẻ hiệu lực (chờ hoặc người đã quyết); thẻ máy đóng không tính; E2 thêm vòng co–giãn |
| P1 | contract | AC-5 «mọi Người về một» chống câu design «người split không bị gộp»; chưa định nghĩa đích khi ứng viên nhỏ nhất đang split | Gộp người đã tách, hoặc cả nhóm treo vào người split | Ma trận viết trước 3 hình split trong E5 | fixed: AC-5 loại thành viên split, đích là người tài khoản active nhỏ nhất, không còn ai thì không gộp và in số thẻ không áp được; E5 hình (a)–(c) |
| P2 | evals | ST-nguoi-dang-gui, ST-nguoi-loi và biên vai viewer không có phép đo | Lỗi route xoá lý do, hoặc viewer thấy bảng SĐT, E8 vẫn xanh | Hai ca thêm trong E8 | fixed: E8 thêm ca fetch lỗi + đang gửi và ca vai viewer có đối chứng dương vai ops |
