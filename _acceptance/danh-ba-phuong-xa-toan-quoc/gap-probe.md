---
slug: danh-ba-phuong-xa-toan-quoc
at: 2026-11-07T23:29:38Z
verdict: findings
p0: 2
p1: 3
p2: 0
---

## Findings

| Sev | Artifact | Thiếu gì | Kịch bản fail | Thước đo | Xử lý |
|---|---|---|---|---|---|
| P0 | contract | Mốc «trước» của AC-9 tự tham chiếu: cả trước lẫn sau dựng bằng code mới, không so với area_id đang lưu; cột đổi xã không có ngưỡng | Tách hàm gán làm rơi một nhánh dự phòng, HCM còn 50.000 tin có xã cả trước lẫn sau, AC-9 xanh; lượt đêm sau gộp làm HCM mất khoảng 6.600 tin có xã | Lấy «trước» từ area_id đang lưu, đối chứng code mới với nó, chặn đổi xã ngoài danh sách khai trước | fixed: AC-9 và E9 lấy «trước» là area_id đang lưu (S06 theo list_id, S03 tin một bài theo post_ids); đối chứng code mới với area_id trước khi nạp phải lệch 0; đổi xã ngoài doi-xa-khai-truoc.json làm thước đỏ; sổ thêm dòng thay quyết định thước cũ |
| P0 | design | Không nói thứ tự gộp code và áp 084 trên máy thu | PR gộp trước khi áp 084, transform S03, S06 và reassign đêm đó gãy vì thiếu cột admin_code | AC + eval chạy code mới trên DB chưa có 084, đòi exit 0 và kết quả bằng nhánh chính | fixed: design §2.5b đọc có điều kiện; thêm AC-10 + E10 (DB thử đưa về trạng thái chưa 084 trong giao dịch, gán bằng area_id đang lưu, reassign mới bằng reassign nhánh chính) |
| P1 | evals | traXaCu tra theo tên nhưng E4 đòi đúng xã theo từng dòng mã cũ; tên cũ trùng giữa huyện cũ không có luật | Hai xã cũ cùng tên ở hai huyện cũ vào hai xã mới khác nhau, E4 đỏ dù đúng, hoặc thợ chọn đích đầu tiên là đoán xã | Ma trận theo khoá (tỉnh mới, tên chuẩn), hợp đích một mã thì trả xã, nhiều mã thì cần chọn | fixed: AC-4 và E4 tra theo khoá, ma trận rút từ xa-cu.json, báo cáo in số khoá ba lớp; design §2.4 sửa theo |
| P1 | design | Chưa có kết quả khớp cho 11 khu airbnb-discovery và luật khi hai khu trùng tên một xã; E6 chỉ chạy Hà Nội | Khu khác trùng tên phường OSM làm bộ nạp thoát 1 trên dữ liệu thật, hoặc chiều đỏ của E6 không đỏ được | Ghi đủ 11 khu, luật ưu tiên, E6 chạy HCM và ĐN | fixed: đo 08/11 — 11 khu là 7 tên quận cũ + 4 tên phường cũ, 0 tin; bộ khớp không bỏ tiền tố cấp huyện, ưu tiên phường OSM; AC-3, E3 ghim 11 khu; AC-6, E6 chạy HN, HCM, ĐN với Hưng Long, Hoàng Sa |
| P1 | contract | Vế dương của ngưỡng SỐNG không có đường đo; E7 dùng danh sách tên viết tay; dạng name của dòng chèn chưa ghim | Bộ nạp chèn «Xã Diễn Châu» còn fixture viết «Diễn Châu», E7 xanh mà thật không khớp | Thêm cột gắn mới qua tên hiện hành và qua bí danh; E7 dùng bộ nạp thật và bộ đọc tên thật; ghim dạng name | fixed: AC-9, E9 thêm hai cột gắn mới kèm tin mẫu và tập khai trước; E7 ca DB dùng bộ nạp thật, docPhuongHopLe, docThiTruongCoXa thật; AC-3, E3 ghim name bằng trường ten của xa.json |
