---
slug: tang-tren-tin-s03
at: 2026-11-11T03:22:06Z
verdict: findings
p0: 2
p1: 2
p2: 1
---

## Findings

| Sev | Artifact | Thiếu gì | Kịch bản fail | Thước đo | Xử lý |
|---|---|---|---|---|---|
| P0 | design | Không có AC cho tin S06 MỚI sau khi áp 095; Coverage «dữ liệu cũ» chỉ phủ 747 tin đã có | Phân xử dựng floor_raw chỉ từ phát biểu; tin S06 thu sau 095 có tầng về null mỗi đêm mà mọi eval vẫn xanh | AC + eval nạp tin S06 mới qua transform thật, floor_raw còn nguyên | fixed: đo lại 11/11 — S06 không ghi floor_raw ở transform, tin S06 cuối có tầng vào 21/10, tin mới trống cả trước và sau 095 nên không có hồi quy; design thêm mục «Tin S06 mới», Out of scope thêm việc ghi phát biểu tầng S06 từ stg |
| P0 | design | Dòng d-7 trích lộ trình nhưng câu trích chỉ quyết «T4/2027», không quyết bỏ mọi «T<số>» trần; số đo 6.388 chỉ đếm «/20xx» | Cổng Phạm vi duyệt luật đọc như đã chốt; nếu «căn T12» là tầng phổ biến thì sót bị đẩy sang AC-5 chỉ in | Thay d-7 bằng dòng một-lối có số đo, hoặc đổi thành câu hỏi; AC-5 in riêng sót do «T<số>» trần | fixed: dòng d-20261111T032443Z-14 thay d-7, nguồn một-lối với số đo 986 bài và mẫu 40 bài 0/40 là tầng; AC-5 và E6 in riêng sót do «T<số>» trần |
| P1 | design | «tang» không dấu là từ dẫn mà ma trận không có ca nào; mẫu AC-5 không rút bài không dấu | «gia tang 5 trieu» đọc thành tầng 5, E4 và E6 vẫn xanh | Thêm ca «tang 12», «gia tang 5 trieu» và đột biến; mẫu thêm bài không dấu | fixed: đo 0 bài S03 có «tang» không dấu đứng trước số, nên bỏ «tang» khỏi từ dẫn; ma trận thêm M26 «tang 12» và M27 «gia tang 5 trieu» đều null |
| P1 | evals | E8 bỏ vocab --check-db; fixture DQ s03-floor-fill dựng tay theo khuôn bên đọc | Fixture ghi chủ thể là offer_id nên DQ pass, trên đầu ra thật thiếu nối bài sang tin thì DQ skip hay fail | Thêm --check-db có đối chứng; chạy DQ trên đúng đầu ra transform của E10, tỉ lệ khớp co_tang | fixed: E8 thêm --check-db xanh trên DB thử đã áp 095, đỏ trên DB chưa áp; AC-8 và E10 chạy DQ trên chính đầu ra transform, tỉ lệ khớp co_tang |
| P2 | evals | Ma trận gộp nhiều câu một dòng bằng «·»; E4 đếm theo dòng | Test chỉ assert câu đầu mỗi dòng vẫn khớp số dòng | Tách mỗi câu một ca có mã, đếm theo câu | fixed: ma trận tách thành 28 ca M1…M28; AC-3 và E4 đòi mỗi mã một assert và in danh sách mã đã chạy |
