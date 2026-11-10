---
slug: nut-du-an-tro-xa-moi
at: 2026-11-09T23:12:00Z
verdict: findings
p0: 0
p1: 2
p2: 3
---

## Findings

| Sev | Artifact | Thiếu gì | Kịch bản fail | Thước đo | Xử lý |
|---|---|---|---|---|---|
| P1 | evals | E3, E7 lấy giá trị đúng từ xaMoiCuaNut trên chính tệp thật nên tự khép vòng; chỉ Grand Park có giá trị tuyệt đối (E5) | old_code của Smart City gõ nhầm sang xã cũ liền kề → phường có thật khác Tây Mỗ, mọi eval vẫn xanh, DA9 lan phường sai | Bảng vàng 15 dòng slug → tên phường mới viết trước trong test, chiều đỏ sửa một old_code | fixed: E3 thêm ca «DV1-AC-3 vàng» với bảng vàng 15 dòng và chiều đỏ ghim |
| P1 | evals | Ngưỡng «dựng lại danh bạ ra cùng số toà, 0 UPI đổi» chỉ đo trên fixture tổng hợp (E6), không trên 69 toà thật; dòng bỏ đường-đo dẫn sai eval | Toà thật dưới nút có meta khác fixture, bước áp ra số toà hay UPI khác sau khi Cổng Bằng chứng đã ký | Dựng lại trên bản chép toàn DB, hoặc ghi rõ ngưỡng đo ở bước áp kèm lệnh | deferred: Hỏi-1 (d-20261110T023136Z-16) ghi lệnh đo demTheoKhu + (building_key, upi) trước–sau trên 69 toà thật ở bước áp; dòng bỏ đường-đo thay bằng d-20261109T230829Z-15 |
| P2 | design | Luật rút chỉ rút giá trị không còn trong tập mã; nút từ một phường sang nhiều phường giữ phát biểu kế thừa cũ | Phú Mỹ Hưng kiểu {X} → {X, Y}: toà giữ X như phường duy nhất, DA9 truyền X cho mọi tin | Ô nhiều phường trong E6, toà còn 0 phát biểu kế thừa sống | fixed: thiết kế §2 bước 4 tính lại phuongCuaToa và rút mọi giá trị khác kết quả; AC-6 và E6 thêm ô nhiều phường có chiều đỏ ghim |
| P2 | evals | Vế «không mở kết nối» của E4 đo bằng vắng ECONNREFUSED; đích 10.0.0.1 treo chứ không ra chuỗi ấy; «.../oneinvest» không ghim máy chủ | Rào kiemDich hỏng, ca vẫn xanh; hoặc chiều đỏ ghi thẳng lên DB máy thu | Bộ nghe TCP giả đếm kết nối, không URL nào trỏ :5433 | fixed: E4 dùng bộ nghe TCP giả trên 127.0.0.1 và host .invalid, assert 0 kết nối và thông điệp nguyên văn của THONG_DIEP |
| P2 | contract | Dòng sổ chọn tệp + lệnh thay migration ghi máy quyết với câu trích chỉ liệt kê vùng; lựa chọn có giá cho DB dựng từ migration và cloud | Cổng Phạm vi duyệt mà không thấy giá «DB dựng từ migration mang mã cũ» | Đổi thành câu hỏi nêu hai lối và giá | fixed: Hỏi-3 (d-20261110T023136Z-18) thay d-12, kho_dao true, khuyến nghị và lối khác có giá |
