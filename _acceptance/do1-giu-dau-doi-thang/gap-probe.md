---
slug: do1-giu-dau-doi-thang
at: 2026-11-09T23:20:00Z
verdict: findings
p0: 0
p1: 4
p2: 1
---

## Findings

| Sev | Artifact | Thiếu gì | Kịch bản fail | Thước đo | Xử lý |
|---|---|---|---|---|---|
| P1 | design | Luật «ngày áp = D thì doi-thang» đứng trước luật «bảng rỗng thì lap-moc»; ô bảng rỗng × ngày áp = D chưa xét, E3 né ô ấy bằng fixture; Coverage chỉ là ánh xạ trục, chưa có ma trận ô viết trước [gan-can-dinh-danh-duy-nhat#F3] | DB mới dựng, ngày đầu DO1 chạy cũng là ngày có ảnh chụp thang mới nhỏ nhất → lượt đầu ghi doi-thang thay lap-moc, trái AC-3, E3 vẫn xanh | Ma trận viết trước bảng đơn vị × ngày áp × dấu → nhãn; E3 thêm ca bảng rỗng + ngày áp = D, ghim thông điệp riêng | fixed: design §2 xếp lại thứ tự (bảng rỗng trước ngày áp) + bảng 1 năm hàng; AC-3 thêm vế «kể cả khi ảnh chụp thang-0811 nhỏ nhất là chính ngày ấy»; Coverage chép bảng 1; E3 thêm biến thể (b), ca «DD bảng 1» đếm đủ ô và đột biến «ngay-ap-truoc-rong» ghim «DD-AC-3 bảng rỗng ngày áp thành doi-thang» |
| P1 | contract | AC-4, AC-8 ghi cứng việc xoá dòng có sẵn, chỉ AC-5 dẫn Hỏi-1; dòng sổ d-4 ghi kho_dao false cho lệnh có mục đích xoá dữ liệu, lối chết chưa loại «giữ dòng» và «dọn tay SQL» [gan-can-dinh-danh-duy-nhat#F1] | Mạnh chọn giữ ở Hỏi-1 → AC-4/AC-8/E4/E8 vẫn đòi xoá, hoặc ship lệnh xoá trái ý, hoặc ba eval đỏ không ai giao | Mỗi AC/eval có vế xoá dòng có sẵn phải dẫn tới Hỏi; d-4 thành câu hỏi khó đảo | fixed: AC-4 chỉ còn «không thêm dòng» và trỏ AC-5; AC-5 hai nhánh xoá/giữ; AC-8 nhánh theo Hỏi-2; dòng sổ mới thay d-4 (supersedes) là câu chỉ-người kho_dao true (Hỏi-2); E4 bỏ vế xoá dòng chèn sẵn; E5, E8 chạy cả hai nhánh qua hằng HOI1/HOI2 |
| P1 | design | Lệnh sửa lấy ngày từ tuNgayThang nhưng CE không đo giá trị ấy trên máy thu; bản chạy thử chỉ in số dòng | Ngày áp trên máy thu sớm hơn ngày đổi thang thật → --write xoá dòng hợp lệ của ngày khác, 1.364 dòng ngày 10/11 còn nguyên, bản thử không lộ | CE đo ngày áp máy thu; bản thử in ngày D; E8 thêm ca ngày áp lệch ngày có dấu → từ chối | fixed: design §1 ghi đo 06:19 máy thu chưa có ảnh chụp thang-0811 (ngày áp sẽ là ngày bac-du-lieu ghi ảnh chụp thang mới đầu tiên); AC-8 đòi in ngày D + số dòng và từ chối khi đã có dấu doi-thang ở ngày khác D; E8 thêm ca từ chối ghim «DD-AC-8 ngày áp D lệch ngày có dấu D-2» |
| P1 | evals | E7 ghi cứng bốn hàm, không suy từ 087 (cột, view); chiều đỏ gọi offer_located trực tiếp nên đúng trong mọi trường hợp | 087 thêm cột mà app đọc → giả lập vẫn có cột, E7 xanh mà cloud lỗi; app sau này gọi unit_data_level → chiều đỏ không bắt | Tập DROP suy từ tệp 087 so với tập viết trước; chiều đỏ là đột biến chính câu truy vấn của app | fixed: AC-7 và E7 suy tập đối tượng từ tệp (hàm 087 tạo mà migration trước không tạo + cột ADD COLUMN), so trọn tập viết trước sáu phần tử; chiều đỏ bọc hàm query của getDataFlow THẬT đổi `o.offer_id` đầu tiên thành `offer_located(o.offer_id)`, báo «đột biến không áp được» khi câu không có chuỗi ấy |
| P2 | evals | Chiều đỏ thứ hai của E7 dựa vào bản chép tình cờ có dòng DO1 mang thang | Bước DO1 bị tạm bỏ theo N1-54 → bản chép không có dòng mang thang, chiều đỏ không đỏ được | Chèn tường minh dòng mang thang làm đối chứng dương, in tiền đề | fixed: E7 chèn tường minh một dòng do1-chuyen-bac mang thang (đối chứng dương: HTML có data-do1-thang) trước dòng đời trước, và in tiền đề bản chép |
