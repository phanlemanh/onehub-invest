---
slug: doc-so-m2-bi-sot
at: 2026-11-04T23:44:00Z
verdict: findings
p0: 0
p1: 4
p2: 1
---

## Findings

| Sev | Artifact | Thiếu gì | Kịch bản fail | Thước đo | Xử lý |
|---|---|---|---|---|---|
| P1 | evals | E3 chỉ in số bài đổi, không chặn trên, không kiểm giá trị, không ghim mẫu số toàn bộ bài | Luật mới đọc sai hàng trăm bài ngoài 19 tin mẫu mà E3 vẫn xanh | Danh sách đóng các bài đổi viết trước khi sửa, E3 đỏ khi tập đổi khác danh sách, assert số bài quét | fixed: thêm `mau-bai-doi.json` 141 bài, đọc tay 27 nhóm, E3 so khớp tập và assert 80.317 bài. Đo này còn bắt được một lỗi của bản nháp, bài có số 173 đổi thành 200, nên thiết kế đổi thứ tự đọc |
| P1 | contract | AC-5 thu hẹp ngưỡng thành tin không chứa bài đổi, và không đo gom tin, không có bảng tác động trên cổng | Tin đang có số bị đổi hoặc nhóm gom tách mà E4 vẫn xanh, Mạnh ký với hình dung sai | E4 assert trên mọi tin, so thành viên nhóm gom, đưa bảng số lên Cổng Phạm vi | fixed: AC-5 và E4 đo mọi tin và nhóm gom, bảng đo nháp nằm trong design doc và Notes. rejected phần tag (cross-layer): tag dành cho luồng giao diện đi qua backend, hồ sơ này không có giao diện và E3, E4 đã khai `layer: backend-effect` |
| P1 | evals | E4 thiếu đối chứng sau bản cũ, DB thử có thể đã nhiễm từ lượt trước, lệnh không ghim với lệnh chạy đêm | Lượt 2 chạy trên DB còn số của lượt 1 nên xanh dù bản sửa hỏng | Đối chứng bản cũ 15/15 rỗng, dựng lại DB mỗi lần, đối chiếu lệnh với cấu hình job | fixed: E4 dựng lại DB, có `ok doi chung: ban cu 15/15 rong`, đối chiếu `scripts/zalo-import-daily.sh`. Đã đọc code: `writeOffers` ghi đè `area_m2`, transform không có đối số và đọc toàn bộ bài |
| P1 | design | Câu luật để dấu cách lọt, thiếu ca có cách và biên, E2 thiếu đột biến cho từng chặn, đối chứng «hdt» không viết được | «Diện tích: 20 x 30» đọc thành 20, và mở nhãn sang «dt» không đột biến nào đỏ | Sửa câu luật, thêm ca âm và biên, mỗi chặn một đột biến, AC-3 ghi rõ đối chứng | fixed: thiết kế, AC-3, E6, E2 đều cập nhật |
| P2 | evals | E4 chỉ đo `sale_offers` của oneinvest, có nhánh miễn job nền, E3 chỉ SELECT theo lời hứa, đối chứng chưa nói phá trường nào | Tiến trình con ghi nhầm DB thật mà E4 vẫn báo ok | Kiểm DB của kết nối transform, E3 đặt chỉ đọc, phá riêng từng trường | fixed: mẫu `pg_stat_activity` theo application_name thay nhánh miễn, E3 đặt `default_transaction_read_only=on`, phá riêng từng trường |
