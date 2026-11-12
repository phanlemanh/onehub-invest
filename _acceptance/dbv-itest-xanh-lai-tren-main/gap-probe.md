---
slug: dbv-itest-xanh-lai-tren-main
at: 2026-11-12T05:10:00Z
verdict: findings
p0: 0
p1: 1
p2: 3
---

## Findings

| Sev | Artifact | Thiếu gì | Kịch bản fail | Thước đo | Xử lý |
|---|---|---|---|---|---|
| P1 | evals | AC-2 hứa kỳ vọng số giữ nguyên nhưng E4 chỉ soi dòng bị xoá có chữ assert và đếm số assert. | Đổi số kỳ vọng ở dòng thứ hai của một assert.deepEqual nhiều dòng: dòng không chứa chữ assert nên E4 vẫn PASS, thước bị nới mà Cổng không thấy. | So trọn tham số từng lời gọi assert.* giữa merge-base và HEAD, trừ chỗ khai trước; chiều đỏ sửa số ở dòng sau của assert nhiều dòng. | fixed: AC-3 và E4 so trọn lời gọi assert.*(…) tới ngoặc đóng, ngoại lệ đúng một lời gọi so dấu DBV-AC-1; chiều đỏ đổi số ở dòng hai của assert nhiều dòng |
| P2 | contract | Danh sách tệp được phép đổi của AC-3 và E4 lệch nhau (PRODUCT-MAP.md, LO-TRINH.html). | Lượt chấm sinh lại bản đồ, E4 PASS nhưng câu GWT của AC-3 sai theo chữ. | Một danh sách duy nhất, probe in danh sách diff. | fixed: AC-3 ghi cả PRODUCT-MAP.md và LO-TRINH.html; E4 in danh sách tệp diff |
| P2 | evals | Dọn DB thử chỉ đo bằng dòng chữ probe tự in; DB _082 ở after không có eval nào kiểm. | Bản merge-base chết giữa chừng hay after quên drop _082, DB thử dồn lại trên :5433 mà mọi eval vẫn xanh. | Đếm pg_database oneinvest_dbv_% trước và sau. | fixed: AC-4 và E5 đếm pg_database trước và sau probe, gồm lượt chạy DBV-AC-1 dựng và xoá DB _082 |
| P2 | evals | E4 so merge-base..HEAD, bỏ qua thay đổi chưa commit trong khi E1–E3 chạy trên cây làm việc. | Tệp kiểm sửa dở chưa commit: E1–E3 xanh trên cây làm việc, E4 so HEAD cũ nên PASS rỗng. | E4 dừng khác 0 khi tệp kiểm bẩn; in sha HEAD. | fixed: E4 dừng khác 0 khi tệp kiểm có thay đổi chưa commit và in sha HEAD |
