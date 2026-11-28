---
slug: thu-duoi-nhuong-luot-khong-dung-may-that
at: 2026-11-28T07:41:57Z
verdict: findings
p0: 0
p1: 3
p2: 2
---
## Findings
| Sev | Artifact | Thiếu gì | Kịch bản fail | Thước đo | Xử lý |
|---|---|---|---|---|---|
| P1 | evals | E3 không ghim lý do đỏ; vế «0 lời gọi node» của AC-2 không có đối chứng dương | shim node không đếm được lời gọi hoặc bản chép đỏ vì lỗi đường dẫn, E3 vẫn in «test do (dung)» | E3 đòi thông điệp ghim THIEU DONG NHUONG LUOT và bản đột biến có ≥1 lời gọi node | fixed: dot-bien-nhuong.mjs đòi thông điệp ghim + so loi goi node ≥1 trên bản tắt và = 0 trên bản thật; AC-3, E3 cập nhật |
| P1 | design | Tệp test mới chưa khai cách ly khoá của wrapper | lượt thu đuôi thật giữ khoá ở gốc thật → test mới đỏ oan hoặc chạm khoá thật | AC-2 Given gốc tạm; E2 đòi dòng «khoa chi o goc tam» | fixed: AC-2 thêm bản chép trong cây tạm + THU_DUOI_S06_GOC và HOME tạm; E2 đòi dòng khoá ở gốc tạm; bảng soát cập nhật |
| P1 | contract (sổ S1) | Hai dòng căn cứ mục-tiêu trích lời chốt của hồ sơ khác hoặc một comment code | người duyệt tưởng lựa chọn đã có lời chốt; gợi ý của GS bị bác không qua người phán cách làm | mỗi dòng mục-tiêu trích câu quyết đúng lựa chọn HT46 | fixed: dòng bỏ coverage-scan thay bằng căn cứ một-lối (supersedes); lựa chọn shim gửi GS hỏi cách làm, ghi dòng sổ theo lời phán |
| P2 | evals | Chiều đỏ E1 không có đối chứng nguyên nhân | bản 2beb7d6ba đỏ vì wrapper hay schema trôi, không vì nhường lượt | bản cũ + pgrep giả thoát 1 phải xanh | fixed: e2e-khi-quet-du-song.mjs chạy đối chứng bản cũ với pgrep giả, chiều đỏ chỉ tính khi đối chứng xanh |
| P2 | evals | E6 không kiểm cột kết luận; trục khoá không có máy đo | dòng soát rỗng kết luận vẫn xanh; test đọc khoá thật lọt phép rút | E6 đòi cột kết luận khác rỗng | fixed: soat.mjs đòi kết luận khác rỗng và khác «—»; Coverage ghi trục khoá chỉ soát tay |
