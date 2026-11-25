---
slug: day-ban-chep-sang-may-phat-trien
at: 2026-11-25T09:58:00Z
verdict: findings
p0: 2
p1: 3
p2: 0
claims_input: ok
---

## Findings

| Sev | Artifact | Thiếu gì | Kịch bản fail | Thước đo | Xử lý |
|---|---|---|---|---|---|
| P0 | contract | Căn cứ d-2, d-3 trích câu AGENTS.md chỉ nói ai được hỏi, không chốt năm rào | Người ký tin rào đã có văn bản chốt, không soát rào thiếu AC | Trích nguyên văn lời GS hoặc đổi nguồn | fixed: d-2, d-3 thay bằng dòng mới, d-3 mới trích nguyên văn năm rào và chỗ lưu, ánh xạ từng rào sang AC |
| P0 | evals | E6, E7 chạy bước nhận trên Mac mini với tên container, DB cứng — có thể đổi tên, xoá DB oneinvest thật | Lượt chấm làm mất DB máy thu | Tên lấy từ biến của lượt, ca chặn, vân tay DB máy thu trước/sau | fixed: thêm AC-12, E12; bước nhận đọc vai máy và từ chối đích máy thu; E6 dùng DB oneinvest_suite_bcm_* |
| P1 | design | scp dưới command= hoặc khoá dựng máy trong agent phá rào 2 | Khoá đẩy ghi tệp bất kỳ, hoặc lượt đẩy xác thực bằng khoá toàn quyền | Một cách truyền, ca scp/sftp/ký tự lạ, ssh ghim khoá | fixed: stdin vào lệnh con nhan, IdentitiesOnly + không agent, E3 thêm ca, AC-3 thêm vế |
| P1 | evals | E7 thiếu các chặng nguy nhất (giữa hai lần đổi tên, còn kết nối) | App M5 chết vì không còn DB đúng tên | Ma trận chặng | fixed: E7 bảy chặng, mỗi ca kiểm DB chạy còn tồn tại, vân tay, lui |
| P1 | design | Design và E11 chứa chính địa chỉ cầu, tên khoá mà E11 cấm | E11 đỏ, hoặc thêm loại trừ để lọt | Chỗ giữ, danh sách loại trừ rỗng | fixed: thay bằng chỗ giữ, E11 in danh sách loại trừ rỗng |
