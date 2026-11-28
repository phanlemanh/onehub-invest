---
slug: s06-thu-duoi-lich-va-chon-snapshot
at: 2026-11-26T16:00:00Z
verdict: findings
p0: 0
p1: 4
p2: 1
---
## Findings
| Sev | Artifact | Thiếu gì | Kịch bản fail | Thước đo | Xử lý |
|---|---|---|---|---|---|
| P1 | design | Lời phán của GS về ba lối cho lỗi chọn-nạp không nằm trong sổ, contract không ghim sha sẽ chấm, và khuyến nghị Hỏi-1 «cài ngay» không dính điều kiện AC-5 xanh | Mạnh duyệt phạm vi khi AC-5 còn có thể bị rút sau cổng, rồi đáp Hỏi-1 theo khuyến nghị: launchd nạp lại snapshot cũ mỗi 300 s | Dòng sổ ghi lời GS và sha; khuyến nghị Hỏi-1 thêm điều kiện E5 CHON-NAP OK trên sha gộp | fixed: Notes của contract ghi lời GS 26/11 (trả ZCode, GIAO claudedp-2611-21, chỉ trình Cổng Phạm vi sau khi E5 chạy trên sha mới); Hỏi-1 hiệu lực (sổ, dòng mới nhất mang Hỏi-1) chỉ khuyên cài khi E5 CHON-NAP OK trên sha gộp, từ đường thật ~/dev/onehub-invest |
| P1 | evals | E3, E4, E6 đòi dòng do probe E5 in mà lệnh của chúng là s06tl_test, paths không có probe | Probe dừng ở ca NAP LAI thì các dòng kia không in; AC-3, AC-4, AC-6 qua cổng không ai đo hoặc đỏ theo E5 | Tách thành eval riêng chạy probe; ca điều khiển in trước ca chọn-nạp | fixed: bỏ tham chiếu probe khỏi E3, E4, E6; thêm E1c, E3c, E4c, E6c trỏ s06tl_chon_nap với probe trong paths; probe chạy ca điều khiển trước và không dừng sớm ở ca đỏ |
| P1 | evals | E5 không nói ai viết tệp snapshot | Fixture viết tay đúng khuôn bên đọc thì xanh dù bộ thu thật xếp thư mục khác | Dùng snapshot thật của phép đo, in dòng xác nhận | fixed: probe chép snapshot hcmc thật của phép đo 24 giờ (bộ thu đuôi ghi), in 'fixture tu writer that'; wrapper tự liệt snapshot theo glob của nó |
| P1 | contract | Vế __ROOT__ của AC-8, gỡ khoá của AC-1, không tạo thư mục của AC-4, ca không snapshot và đã nạp còn trong stg chưa có thước | Plist còn __ROOT__ làm job hỏng vòng đầu; vùng chưa có snapshot làm wrapper thoát 1 mỗi 5 phút | Thêm từng dòng vào probe tương ứng | fixed: E9 cài thử trong HOME giả và đòi 'plist cai thu: __ROOT__ da thay bang goc kho'; E1c đòi 'khoa go' sau vòng xanh và sau mã 3, 4, 5; E4c đòi 'khong tao thu muc'; E5 đòi 'khong snapshot: exit 0 · nap 0' và 'da nap con trong stg: nap 0'; AC-5 viết lại cho khớp |
| P2 | evals | Dòng âm của E9 không có đối chứng dương | launchctl list đọc sai domain hoặc bộ dò mạng không móc được thì dòng «không có» đúng vô nghĩa | Đối chứng thấy job com.oneinvest.* khác; bộ dò bắt một lời gọi cấy thử | fixed: E9 đòi 'doi chung launchctl: thay N job com.oneinvest.*' và 'tu kiem mang: bộ đếm bắt 1 lời (TRUNG)'; thiếu thì in DOI CHUNG HONG hay TU KIEM HONG |
