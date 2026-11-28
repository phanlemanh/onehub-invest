---
slug: s02-cua-api
at: 2026-11-27T03:00:00Z
verdict: findings
p0: 0
p1: 3
p2: 2
---

## Findings

| Sev | Artifact | Thiếu gì | Kịch bản fail | Thước đo | Xử lý |
|---|---|---|---|---|---|
| P1 | contract | Không AC nào đo «dừng cả lượt» ở mức lượt thu: AC-6 chỉ đo call() ném LoiBiChan; AC-12 cấm test gọi .collect(), nên đường lỗi từ call() lên vòng thu và mã thoát không có ca nào phủ | collect() bọc mỗi thị trường trong try/catch rồi đi tiếp: gặp 429 ở thị trường đầu vẫn gửi lời cho thị trường sau, lượt có thể thoát 0, mọi eval vẫn xanh | Ca gọi collect() với profile tạm và fetch giả: sau 429/thử thách ở thị trường 1 không còn lời fetch; bản đột biến vòng thu nuốt LoiBiChan | fixed: thêm AC-13 + probes/dung-ca-luot.mjs (E16) — collect() hai thị trường trên profile tạm dựng bằng số, 429/thử thách/403 → LoiBiChan, 1 lời dữ liệu, 0 lời cho thị trường 2; vế không bắn 500; bản đột biến call() nuốt LoiBiChan bị bắt; mã thoát khác 0 do scheduler.ts (không đổi) ghi FAILED rồi ném lại |
| P1 | contract | Đường đo chỉ đo đêm đầu; refresh mới nguồn xoay về chỉ ở bộ nhớ, mất khi tiến trình kết thúc; không ô Coverage cho refresh trên đĩa đã bị xoay | Nguồn xoay refresh ở lượt 19:05 đầu; đêm đầu xanh nên coi là xong, từ đêm hai mỗi đêm một AUTH FAIL, Mạnh phải login hằng ngày | Đường đo hai hoặc ba lượt liên tiếp; ô Coverage refresh trên đĩa đã bị xoay với kết cục ghi rõ | fixed: Đường đo đổi thành BA lượt 19:05 liên tiếp; thêm hàng Coverage «refresh trên đĩa đã bị nguồn xoay» → lời đầu 401 → 1 AUTH FAIL chỉ lệnh login (đã đo ở AC-3, AC-4(c)); ghi lưu refresh xuống đĩa thì không làm vì mô-đun không được ghi giá trị phiên (AC-11) — ZCode ghi refresh không đổi 24–26/11 |
| P1 | contract | Đổi token thẳng bằng phiên trên đĩa để không chạm trang thử thách — sổ d-1 dựa vào lời chung «Tiến hành S02 như mọi người», không có câu hỏi riêng ở Cổng Phạm vi [db-thu-tach-khoi-cum-that#F1] | Mạnh duyệt vì tưởng đây là cách thu thường đã cho phép; lựa chọn tuân thủ đối với nguồn ngoài do ZCode và máy quyết | Thêm Hỏi ở Cổng Phạm vi kèm khuyến nghị và lối khác | human-gate1: thêm Hỏi ở Notes của hợp đồng, kèm khuyến nghị «có» và lối khác «dừng S02 khi nguồn bật thử thách»; Mạnh trả lời ở Cổng Phạm vi |
| P2 | evals | AC-8 chỉ đo hằng requestsPerSecond, không đo mỗi lời gửi trong call() lấy đúng một take() | call() hoặc nhánh thử lại gửi không qua take(): hằng 0,2 vẫn đúng nhưng lưu lượng dồn chùm lúc nguồn lỗi 5xx | Đếm take() bằng số fetch trong call(); bản đột biến call() bỏ take() | fixed: AC-8 thêm vế đếm; E18 trong dung-ca-luot.mjs đếm take() = số lời (20 = 20 trên lượt 500), bản đột biến call() bỏ take() bị bắt; nhánh thử lại của cửa xác thực đã có ca «mỗi lần gửi kể cả thử lại đúng một take()» ở E2 |
| P2 | contract | AC-2(f) nói tệp hỏng thì ném, design nói tệp ghi dở thì dừng như LevelDB; không AC nào phân biệt đuôi .log ghi dở với tệp hỏng | Chrome đang mở profile lúc 19:05, đuôi tệp ghi dở: mô-đun ném → AUTH FAIL oan, hoặc lặng lẽ dùng bản cũ | AC-2(g) đuôi bị cắt thì bỏ đuôi, dùng bản nguyên vẹn; ca fixture cắt đuôi | fixed: AC-2(g) + E17 trong dung-ca-luot.mjs — đuôi hứa dài hơn phần còn trong tệp → đọc bản nguyên vẹn, không ném (bản thật đạt) |
