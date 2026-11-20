# Phá thử các phép đo (S3, 20/11)

Mỗi dòng: sửa đúng một nhánh trong bản làm việc, chạy `pipeline/scripts/bi-danh-viet-tat-phan-khu.itest.mjs`, ghi ca đỏ và thông
điệp ghim, rồi `git checkout` trả tệp. Vật lành: 9/9 ca xanh (commit e1e3c5816 và commit sửa ca kế tiếp).

| Eval | Phá | Ca đỏ | Thông điệp ghim |
|---|---|---|---|
| E1 | `chonDich` bỏ lọc nút nghỉ | BDV-1 (và BDV-2) | nút nghỉ không là ứng viên, còn lại một nút |
| E2 | băm thẻ không phủ `node_id` | BDV-2 | băm phải đổi khi đích của một tên đổi |
| E3 | ghi cả tên đã có vào `them` | BDV-3 (và BDV-4) | tên đã có không lặp |
| E4 | bỏ kiểm `can_cu` khi đảo | BDV-4 | Missing expected rejection (khong-phai-luot-bi-danh) |
| E4 | đảo gỡ mọi tên của bảng thay vì `them` | BDV-4 | đảo phải trả nguyên aliases và meta, kể cả tên tắt đã có sẵn trước khi áp |
| E5 | bỏ ưu tiên nút không do luật đúc | BDV-5 (và BDV-1, BDV-6) | áp trước rồi nối: nút giữ lại mang gh |
| E6 | `docTenPhanKhu` bỏ lọc nghỉ | BDV-6 | nút nghỉ <id> không được vào từ điển |
| E7 | áp không ghi tên vào `aliases` | BDV-3, BDV-5, BDV-6 (lượt phá chỉ in ba ca đỏ đầu) | tên nối vào cuối, bí danh cũ giữ thứ tự |
| E8 | lệnh kiểm không đọc `aliases` | BDV-8 | thiếu tên phải nêu đúng nút |
| E9 (fixture) | lệnh đo không bỏ tên tắt ở vế «trước» | BDV-9 | hai tin chỉ đọc được nhờ tên tắt |
