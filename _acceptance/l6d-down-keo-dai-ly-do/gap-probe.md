---
slug: l6d-down-keo-dai-ly-do
at: 2026-11-17T07:05:00Z
verdict: findings
p0: 1
p1: 3
p2: 1
---
## Findings
| Sev | Artifact | Thiếu gì | Kịch bản fail | Thước đo | Xử lý |
|---|---|---|---|---|---|
| P0 | design | Cách ly chỉ bằng HOME giả và ZALO_OPENCLAW_CLI, không thay PATH; luật zalo-safety đòi PATH/HOME giả | Lượt gỡ CLI giả mà mã tìm openclaw qua PATH thì CLI thật trong PATH chạy lên gateway đang thu, sổ lời gọi vẫn rỗng nên PASS | PATH = thư mục giả + /usr/bin:/bin; chốt command -v openclaw trong thư mục tạm; ca -DO PATH có openclaw ngoài thư mục tạm thì harness từ chối | fixed: AC-6 viết lại (PATH lượt, chốt command -v, ca PATH-THAT-DO), E8 thêm CO-LAP và PATH-THAT-DO |
| P1 | design | Chưa nói alerts log và pipe log thật được cách ly thế nào | Harness ghi dòng L6(d) giả vào alerts log của checkout; số đếm 0/1/1 lệch ở lượt chạy thứ hai | Alerts log riêng mỗi lượt (biến ZALO_HEARTBEAT_ALERTS); băm alerts log và pipe log thật trước = sau cả bộ | fixed: AC-6 thêm chốt băm hai log thật, E8 CO-LAP |
| P1 | evals | Đổi khớp connected sang nguyên từ mà mọi fixture status viết tay | Đầu ra thật khác khuôn thì mọi nhịp thành DOWN, L6(d) báo giả, lệnh nhóm gọi lên gateway mỗi giờ | Phát lại đầu ra status thật của một nhịp UP | fixed: lấy một mẫu status thật 17/11 bằng lệnh chỉ đọc (dòng tài khoản «enabled, configured, linked, running, connected, in:just now», định danh thay default; pipe log cùng giờ ghi up accs=1/1); AC-1 + E1 UP-MAU-THAT và UP-MAU-THAT-DO |
| P1 | evals | MA-CHI-DOC và UP-KHONG-GOI không có ca -DO hay đối chứng dương | Lời gọi CLI qua biến khác hoặc ghi cấu hình trong s03-song.sh lọt; ca UP thoát sớm cho 0 lời gọi và PASS rỗng | MA-CHI-DOC-DO chèn lệnh ghi và lời gọi lạ; vùng quét gồm s03-song.sh; UP-KHONG-GOI kèm chốt dương | fixed: AC-4, AC-5 viết lại; E6 thêm 3 lời gọi status + drift giả được gọi; E7 thêm MA-CHI-DOC-DO, vùng quét gồm s03-song.sh |
| P2 | contract | AC-3 và AC-4 mâu thuẫn ở nhịp status treo; thiếu ca session → status treo → nhịp kế | Status treo ghi đè session thành unknown, VHZ2 đọc không phải session và khởi động lại vô ích | Chốt một quy tắc; ca TREO-SAU-SESSION kèm ca -DO | fixed: chốt theo mã làn thu (status treo ghi đè thành unknown) ở AC-3, AC-4, AC-7; E9 thêm TREO-SAU-SESSION và KHUON-DO; hệ quả cho VHZ2 ghi sổ (dòng S1) |
