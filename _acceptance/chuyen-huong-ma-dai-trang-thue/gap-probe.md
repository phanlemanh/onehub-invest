---
slug: chuyen-huong-ma-dai-trang-thue
at: 2026-11-02T22:09:52Z
verdict: findings
p0: 0
p1: 4
p2: 1
claims_input: ok
---

## Findings

| Sev | Artifact | Thiếu gì | Kịch bản fail | Thước đo | Xử lý |
|---|---|---|---|---|---|
| P1 | contract, evals | Sau 064 phép đo dừng ở nhịp 308, không mở trang đích | Mã ngắn không giải ra hoặc term=short không ra rent_st, người xem gặp 404 mà eval vẫn xanh | Gọi trang rent bằng đích cho 32 mã và 4 query | fixed: thêm ca mở đích, dòng «đích rent mở được 32/32». rejected phần tag cross-layer: surfaces chỉ có api, không có lớp UI để ghép |
| P1 | evals, design | Bằng chứng là dòng chữ tự in, 8 ô không liệt kê | Vòng lặp chạy 0 lần mà dòng vẫn in 8/8 | Bộ đếm trong vòng lặp, liệt kê ô trong contract | fixed: số in từ bộ đếm và assert bằng độ dài; AC-2 liệt kê 4 trang × 2 query |
| P1 | contract, design, evals | 32 mã đọc từ DB máy thu, không ghim; đích có thể tự chứng minh | Áp 064 lên máy thu thì bộ kiểm dừng | Fixture 32 cặp mã | rejected phần tự chứng minh: đích tính bằng hàm ngan viết trong test, chm_ma đối chiếu luật 064. deferred phần hạn dùng: maDai dừng khi 064 áp lên máy thu là việc của hồ sơ gốc, ghi ở Out of scope và báo giám sát |
| P1 | evals, contract | Chiều đỏ khai mà chưa có lần chạy; hai đột biến cùng thông điệp | Khớp lỏng hoặc đỏ vì lỗi khác mà vẫn báo đạt | Chạy thử đỏ, ghim đích thực nhận | fixed: ghim e.actual cho nhầm segment và rơi query; đã chạy phá thật rent/page.tsx và phá dòng ô, cả hai đỏ. Đột biến tra thêm nằm ở AC-4, design đã ghi |
| P2 | design, sổ | Dòng sổ 6 nêu lối chết sai; căn cứ dòng 2 không quyết chuyện chung tệp | Duyệt với hiểu lầm là không đo được URL thật | Sửa căn cứ hoặc thêm ca HTTP | fixed: hai dòng sổ mới mang supersedes; giới hạn đo ghi ở design và Out of scope |
