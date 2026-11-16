---
slug: s10-bang-hang-vao-danh-ba
at: 2026-11-11T16:05:00Z
verdict: findings
p0: 2
p1: 1
p2: 1
---

## Findings

| Sev | Artifact | Thiếu gì | Kịch bản fail | Thước đo | Xử lý |
|---|---|---|---|---|---|
| P0 | design | Dòng d-…-2 trích ROADMAP Q3 «S10 vào stg» làm căn cứ mục tiêu cho cả khuôn `stg_s10_project` (bảng do bộ nạp v11 làn ZCode ghi), trong khi luật làn đòi ZCode đề xuất trước. | Cổng duyệt khuôn như đã chốt; ZCode ra v11 khác khuôn → phải thêm migration sau 089, bộ nạp gãy lần ghi đầu. | Dòng S1 mới supersedes d-2: tách bảng, hoặc dẫn lời đồng ý, hoặc thành câu hỏi. | human-gate1: dòng mới thay d-2 thành câu hỏi (khuyến nghị giữ trong 089 theo khuôn GS duyệt, LL đã giao ZCode ghi theo; lối khác tách sang migration sau). |
| P0 | design | Dòng d-…-3 (một-lối) chốt bảng nối riêng `s10_project_links` mà lối bảng chung hay chờ DA3 chưa chết. | Mạnh không được hỏi; S11, DA3 sinh thêm bảng nối, sau phải gộp. | Dòng mới supersedes d-3 nêu vì sao lối khác chết, hoặc thành câu hỏi. | human-gate1: dòng mới thay d-3 thành câu hỏi (khuyến nghị bảng riêng như S08, DA3 gộp vào registry_aliases sau; lối khác chờ DA3). |
| P1 | contract | Khoá cho phép một `project_id` nhiều dòng mà AC-3 không nói chọn tên nào; mồi chỉ một tên. | Bộ nạp v11 ghi hai dòng một dự án → tín hiệu lúc khớp lúc không, «chạy lại không đổi» vỡ, lỗi giả. | Khai luật chọn tên; ca mồi hai dòng cùng `project_id`. | fixed: AC-3 lấy `du_an` duy nhất của snapshot mới nhất (khác nhau → lỗi `du-an-nhieu-ten`, không ghi), phân khu và nhãn gộp theo thứ tự chữ; E3 thêm ca hai dòng chạy hai lượt cùng kết quả, cùng `updated_at`, và ca hai `du_an`. |
| P2 | evals | Chiều đỏ E5 chỉ phủ `pipeline/sql`, bốn gốc còn lại không có đối chứng dương. | Lọc sai glob ở `app/**`, `data-api/**` hay `transform-*` → tệp đọc view vẫn PASS. | Chiều đỏ lặp trên từng gốc, cộng ca tên trong `transform-s10.mjs` không đỏ. | fixed: E5 có năm ca đỏ (mỗi gốc một ca, gọi đúng tệp) và ca thứ sáu tên trong `transform-s10.mjs` vẫn xanh; AC-5 nói rõ. |
