---
slug: e4b-danh-sach-tin-nhanh
at: 2026-11-08T02:12:00Z
verdict: findings
p0: 1
p1: 3
p2: 1
---

## Findings

| Sev | Artifact | Thiếu gì | Kịch bản fail | Thước đo | Xử lý |
|---|---|---|---|---|---|
| P0 | contract | Độ rộng «biên an toàn» (500 ms, 70% câu cũ) ghi máy quyết theo một-lối, nhưng các ngưỡng lỏng hơn không bị ràng buộc nào loại; câu giao không cho số, đây là khẩu vị rủi ro và quyết luôn việc có kéo index 085 | Máy tự đặt ngưỡng nằm trong dải đo 325–566 ms: AC-3 chập chờn và vòng bị đẩy sang 085 mà người giao không chọn, hoặc ngưỡng bị nới lặng lẽ ở vòng sửa | Thay dòng sổ bằng câu Hỏi tới giám sát hay Mạnh kèm các mức và số đo | human-gate1: sổ d-20261108T021344Z-8 rồi d-20261108T021459Z-11 (thay d-20261108T020049Z-4) thành câu Hỏi; giám sát trả P2-133 «700 ms, cả chạy riêng lẫn trong suite, trần 1000 giữ, chưa làm 085»; Mạnh chốt con số ở Cổng Phạm vi; bỏ ngưỡng tương đối 70% |
| P1 | evals | Biên chỉ đo ở ca chạy riêng, không đo dưới tải suite (đúng điều kiện làm E4b đỏ 1032 ms); tỉ lệ cũ/mới ở máy rảnh chưa đo; design nói AC-1 đo trong suite còn contract nói chạy riêng | E4 đỏ KHONG NHANH HON ở máy rảnh dù mã đúng, hoặc E4 xanh khi chạy riêng còn trong suite E4b nằm 900–990 ms | Đo cả trong suite; thống nhất design và contract | fixed: AC-3 đo ở cả hai điều kiện (ca nằm trong tệp mà suite app chạy, E2), bỏ ngưỡng tương đối; contract AC-1 chạy riêng, AC-2 và AC-3 trong suite |
| P1 | evals | E8 đo chuỗi có mặt trong chính tệp test, ca kiểm chứa đúng các chuỗi cần tìm; bản phá chỉ đổi 1000 thành 1500 | Thợ đổi trần hay thêm lối thoát sớm, E8 vẫn xanh vì chuỗi còn trong ca kiểm hoặc nằm ở nhánh chết | So khối E4b với commit gốc ghim sha | fixed: AC-7 và E8 cắt khối đo thời gian ở HEAD và ở e21a151e, so bằng nhau từng ký tự; không cắt được mốc thì đỏ KHONG CAT DUOC; bản phá áp vào khối đã cắt |
| P1 | evals | Đáp án «câu cũ» là bản chép tay; ma trận bỏ đường không thị trường; so trên DB đang sống không ghim | Bản chép lệch câu gốc mà vẫn khớp câu mới; đường /api/v1/listings không market đổi tập dòng mà không ca nào đo; transform ghi giữa hai lượt đọc làm đỏ giả | Nạp câu cũ từ git show; thêm đường không thị trường; đọc lại khi lệch | fixed: câu cũ là offers-public.ts của e21a151e nạp thành module tạm (sổ d-20261108T021344Z-9); ma trận 20 tổ hợp gồm không thị trường; tổ hợp lệch đọc lại cả hai một lần |
| P2 | evals | Ca «offset vượt cuối» limit 2 offset 4 trên năm tin trả một dòng, mâu thuẫn «không dòng» | E7 đỏ dù mã đúng, thợ sửa fixture ngoài hồ sơ | Tách trang cuối một dòng và trang rỗng | fixed: limit 2 offset 4 là trang cuối một dòng; trang rỗng là limit 2 offset 6 và offset 960 |
