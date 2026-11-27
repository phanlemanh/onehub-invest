---
slug: s02-map-listings-trang-ke
at: 2026-11-27T03:10:00Z
verdict: findings
p0: 1
p1: 1
p2: 3
---

## Findings

| Sev | Artifact | Thiếu gì | Kịch bản fail | Thước đo | Xử lý |
|---|---|---|---|---|---|
| P0 | contract | Ca test mới thêm dòng mang tên miền nguồn thật vào kho công khai; chỉ ghi ở Mục cho Cổng, không AC, không câu hỏi | PR gộp đẩy thêm tên nguồn thật lên kho công khai, trái lời chốt chỉ chặn tên mới, không lùi được | AC + eval đếm 0 dòng mới mang tên miền so với mốc, đột biến cấy một dòng đỏ | fixed: thêm AC-6 + probes/khong-ten-mien-moi.sh (E7), tên miền rút từ hằng của tệp bộ thu; ZCode viết lại ba dòng test bằng hằng API xuất từ tệp bộ thu @2b9e94afb, nay XANH 0 dòng |
| P1 | contract | Trần 11 lời không có dòng sổ lý do; AC-5 không nói kết cục lượt khi chạm trần; thiếu ca thị trường thật cần nhiều trang hơn trần | Thị trường trên 150 000 căn bị cắt ở lời 11 mà lượt vẫn báo xong, tái diễn lỗi thiếu căn im lặng | Dòng sổ cho trần; vế lượt lộ lỗi khi chạm trần; ca trang trùng dừng sau 2 lời nếu chọn phát hiện trùng | fixed: AC-5 thêm vế lượt lộ lỗi (ném hoặc coverage.failed > 0), phép đo kiểm cả vế này; fixed: ZCode chọn trần 10 trang (TRANG_MAP_TOIDA) @2b9e94afb, dòng sổ approach S1 ghi lý do; hai ca bất thường dừng ở lời thứ 10 |
| P2 | contract | Trục người đọc S01 chỉ có thước grep, không eval cho bộ dựng danh sách S01 | Bộ dựng danh sách S01 lọc snapshot theo đuôi map_listings, bỏ trang kế mà không ai thấy | Áp bộ lọc của đường S01 lên bản ghi trang kế | rejected: git grep 27/11 — sáu bên đọc ngoài transform (sync-cloud, dq, backfill ảnh, drill, audit, smoke) đều đọc bảng airdna_listings, không lọc snapshot theo sourceId; bảng do transform đổ (AC-4); ghi vào trục Coverage |
| P2 | evals | E3 dùng mốc cài cứng origin/fix/s02-cua-api, đỏ giả khi ZC22 đã vào main | Chấm lại sau khi ZC22 gộp thì E3 đỏ giả hoặc phải sửa tay | vung.sh tự chọn mốc và in mốc đã dùng | fixed: vung.sh và khong-ten-mien-moi.sh tự chọn mốc (ZC22 là tổ tiên origin/main → origin/main), in «mốc so: …»; expected E3 đòi dòng đó |
| P2 | contract | Trang kế lỗi (404, 500) mà lượt vẫn xong không có AC | Nguồn đổi cách phân trang lần nữa, lượt đêm thiếu 51% căn mà không ai hay | AC cho trạng thái hoặc dòng log đọc được bởi thước tươi | deferred: ghi Out of scope — lỗi lẻ đã đếm vào coverage.failed của manifest (có sẵn), bộ báo đọc số đó là việc của thước độ tươi cùng mục bộ đọc AUTH FAIL của ZC22 |
