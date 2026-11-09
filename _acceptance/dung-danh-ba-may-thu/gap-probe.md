---
slug: dung-danh-ba-may-thu
at: 2026-11-07T23:40:00Z
verdict: findings
p0: 1
p1: 4
p2: 0
---

## Findings

| Sev | Artifact | Thiếu gì | Kịch bản fail | Thước đo | Xử lý |
|---|---|---|---|---|---|
| P0 | contract | Dòng sổ bỏ «lệnh tự pg_dump» ghi máy quyết bằng lối chết sai (đêm không chạy main của lệnh tay); cách giữ điều kiện «sao lưu trước» của Mạnh là lựa chọn chỉ người có | Một phiên chạy --db-that trên máy thu trước khi giám sát pg_dump, ghi registry_aliases và field_assertions không có sao lưu, không eval nào đỏ | Dòng chi-nguoi thay thế; nếu chọn rào trong lệnh thì thêm vế AC-1 và ca E1b | fixed: dòng d-20261107T232228Z-12 (Hỏi-2, chi-nguoi, supersedes d-20261107T231645Z-7) khuyến nghị rào --sao-luu ở lần đầu; d-20261107T232228Z-13 thay d-20261107T231645Z-11 với lối chết đúng; AC-1 thêm vế --sao-luu; E1b thêm ca (c)(d)(e)(f) và chiều đỏ «DBM-AC-1 lần đầu không sao lưu» |
| P1 | evals | AC-4/E4 chỉ đo 0 bí danh; chưa đo có bí danh mà 0 toà, chưa đo đường cha của phân khu | Đêm qua rào bí danh, tập khu rỗng, dung() rơi về KHU_MAC_DINH và tự dựng lần đầu; phân khu suy sai mà vẫn xanh | E4 ca (c) có bí danh và 0 toà; chiều đỏ «đêm rơi khu mặc định»; E5 có toà gắn phân khu | fixed: rào đổi sang đếm toà (d-20261107T232228Z-14); dung() từ chối khu rỗng; AC-4, E4 ca (c) và ca hàm; AC-5, E5 chuyển sang khu hai có phân khu, chiều đỏ «phân khu không được giữ tươi» |
| P1 | evals | E2 kiểm URL tự phân tích; ?host=, PGHOST, socket không có ô; client giả viết tay | URL localhost?host=supabase cho ghi không cờ, pg nối lên đám mây | Ô ?host=, PGHOST, socket, đối chứng dương; đọc connectionParameters của pg.Client thật; ca đêm dùng client thật chưa nối | fixed: kiemDich đọc connectionParameters (d-20261107T232228Z-15); AC-2 và E2 thêm các ô (18 assert), chiều đỏ «kiểm khác máy pg nối», ca đêm dùng pg.Client thật |
| P1 | evals | E6 xanh đo giao dịch của bản chép; biến DBV_BUOC_DEM trong tệp launchd là đường vòng | buocVatTheDem thật để lại toà không trục mà E6 vẫn xanh; biến sót trong môi trường job chạy mô-đun không rào | Ép hỏng bên trong mã thật; ca tĩnh không biến thay mô-đun | fixed: E6 ép hỏng bằng trigger trên units trong DB thử, chạy mã thật; ca tĩnh refresh-bait-gap không đọc process.env.DBV_; mọi chiều đỏ dùng bản chép tệp gọi trực tiếp; bỏ DBV_BUOC_DEM khỏi E4, E5, E6 |
| P1 | contract | Đường đo hai ngưỡng không đọc trong vòng; nhánh «đã dựng» không có đối chứng dương; timebox hết trước lần đầu | Hàm chọn nhánh đọc nhầm, E8b xanh mãi ở «chưa so»; ký trên lần xanh rỗng | E8 ca DB thử đóng vai máy thu vào nhánh so; Đường đo ghi bước đo sau gộp; sửa timebox | fixed: AC-8 và E8 thêm hàm chọn nhánh hai chiều, chiều đỏ «bỏ so khi máy thu đã dựng»; Đường đo ghi bước đo sau gộp (dbv_that nhánh so, chạy lại khoa_moi = 0) và nơi ghi; timebox ô cơ hội tính tới lần đo sau gộp |
