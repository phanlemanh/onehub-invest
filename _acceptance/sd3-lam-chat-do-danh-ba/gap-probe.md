---
slug: sd3-lam-chat-do-danh-ba
at: 2026-10-31T12:40:00Z
verdict: findings
p0: 2
p1: 2
p2: 1
---
## Findings
| Sev | Artifact | Thiếu gì | Kịch bản fail | Thước đo | Xử lý |
|---|---|---|---|---|---|
| P0 | evals | E7 nạp 060 trong giao dịch trên DB oneinvest dùng chung; E8 không quét tệp test app | 060 tự commit hoặc giữ khoá sellers làm kẹt bước đêm mà phạm vi vẫn xanh | E7 chạy trên DB thử; test từ chối DB oneinvest; E8 quét test mới | fixed: E7 thành script probes/people.sh dựng DB thử, test ném «DB DUNG CHUNG» khi trỏ oneinvest; E8 quét app/tests/people-che-so-loader.test.tsx; AC-7, AC-8 sửa chữ |
| P0 | contract | AC-6 đòi mọi người mang sdt có ten trong khi bộ dựng chỉ gắn ten cho người theo tài khoản | Người theo SĐT sinh sau 060 không có ten → E6 đỏ oan | Khoanh miền người đã có trước 060; người mới đếm riêng | fixed: AC-6 và E6 khoanh người mang sdt_bam của số trước 060; người sinh sau 060 đếm, in riêng; đối chứng dương người mới không ten không làm đỏ |
| P1 | evals | Ánh xạ trước 060 của E5 chỉ dựng từ sdt_bam khớp tin — mồ côi rơi cả hai phía | Người chỉ mang sdt_bam mồ côi biến mất sau 060 mà E5 vẫn xanh | Đếm thẳng sdt_bam mồ côi từ bảng bí danh | fixed: E5 đếm mồ côi thẳng từ bảng, assert người trước = khớp + mồ côi, đối chứng chèn một mồ côi bắt «MO COI KHONG DEM» |
| P1 | evals | E5 không chạy bước đêm đời trước trước khi chụp ánh xạ cũ | Tin mới thu sau lượt dựng cuối làm lệch khoá hai phía, đỏ giả | Chạy bước đêm đời trước rồi mới chụp; số khoá một phía = 0 | fixed: E5, E6 chạy bước đêm của commit cha thứ nhất của merge SD3 trước khi chụp; assert khoá một phía = 0 |
| P2 | evals | Ma trận N6 thiếu ô bí danh sdt đã nghỉ | Code tính cả bí danh đã nghỉ mà ma trận vẫn xanh | Thêm hai ô bí danh đã nghỉ | fixed: thêm ô nghỉ-trùng-hiệu-lực (trung=0) và ô số chỉ ở bí danh nghỉ (thieu=1) |
