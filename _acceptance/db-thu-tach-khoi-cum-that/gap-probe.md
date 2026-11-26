---
slug: db-thu-tach-khoi-cum-that
at: 2026-11-25T04:10:00Z
verdict: findings
p0: 1
p1: 3
p2: 1
claims_input: ok
---

## Findings

| Sev | Artifact | Thiếu gì | Kịch bản fail | Thước đo | Xử lý |
|---|---|---|---|---|---|
| P0 | design | Dòng sổ d-2 ghi nguồn mục tiêu nhưng câu trích danh-ba-s16 chỉ đòi chạy THÊM trên DB dựng từ migration, không quyết việc bỏ bản chép; design gọi đó là «lời Mạnh» trong khi Hỏi-1 hỏi chính câu này | Mạnh duyệt Hỏi-1 như thủ tục vì tưởng đã có lời mình; rủi ro mất phủ dữ liệu thật không được cân | Không dòng mục tiêu nào có câu trích không quyết đúng lựa chọn | fixed: dòng S1 mới thay d-2 (supersedes), nguồn chỉ-người, phụ thuộc Hỏi-1; design bỏ chữ «lời Mạnh», ghi rõ đây là câu hỏi |
| P1 | contract | Số nền 99/174 tính theo luật khác với định nghĩa «phút giữ khoá»; nhật ký không ghi lần nhả nên cấp → cấp kế tính cả khe trống | Lệnh đo ra số khác 99, hoặc khớp 99 nhưng đo khoảng cấp chứ không phải phút giữ | Một luật duy nhất, tính lại trên fixture thật | fixed: AC-8 và Đường đo gọi đúng tên «khoảng cấp s4» (cấp → cấp hay thu hồi kế, cận trên phút giữ, sát khi hàng chờ không rỗng); tính lại hai luật trên tệp thật cho cùng n=15, trung vị 99, p75 174 (cửa sổ không có thu hồi); E8 thêm ca tay thu hồi, chiều đỏ đổi thành bỏ lọc cửa sổ |
| P1 | evals | AC-2 dùng duration_ms của test runner, không tính dựng container, migration, xoá | E2 xanh ở 18′ trong khi thời gian thật trong khoá là 26′+ | Đo thời gian thật từ gọi tới thoát lệnh suite | fixed: AC-2 và E2b đo thời gian thật từ .bat-dau/.xong của s4-lenh-dai (gồm dựng, migration, xoá), db-thu.sh in riêng giây dựng cụm + migration |
| P1 | evals | E4 suy tập tệp phụ thuộc bằng chính phép quét tĩnh; tệp nạp động (glob SQL, đường ghép, .sh gọi .mjs) lọt | Nhánh sửa SQL transform nạp động, pipeline_that bị bỏ, 30 ca dữ liệu thật không chạy | Fixture tệp mở rút từ một lượt chạy thật | fixed: E4 dùng fixture pipeline-that-tep-mo.json ghi từ một lượt chạy thật có hook fs/child_process (ghi ở S3), thêm ca đồ thị import hiện tại ⊆ vùng, chiều đỏ trên tệp nạp động; hàng 2 của E5 gọi tên tệp lấy từ fixture |
| P2 | evals | AC-2 hứa quan hệ tập nhưng E2a/E2b chỉ đếm 30 | Mục khớp hụt + ca có t.skip sẵn vẫn cho đếm 30 | Bóc tên ca bỏ qua từ đầu ra thật, deepEqual 30 tên | fixed: E2a/E2b bóc tên ca SKIP từ đầu ra thật, E2b deepEqual với 30 tên của ci-bo-qua.json |
