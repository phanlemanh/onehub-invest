---
slug: trang-danh-ba-chi-doc
at: 2026-11-17T00:30:00Z
verdict: findings
p0: 0
p1: 3
p2: 2
claims_input: ok
---

## Findings

| Sev | Artifact | Thiếu gì | Kịch bản fail | Thước đo | Xử lý |
|---|---|---|---|---|---|
| P1 | evals | E14 chỉ quét HTML trang danh sách; E7 không cài tên nguồn vào bí danh toà, mã toà, trục, căn, mã đã nối | Bí danh toà S09 hay mã tại nguồn chứa tên miền thật lộ trên trang dự án, E7 và E14 vẫn xanh | E14 quét thêm trang mọi dự án có toà; E7 cài tên giả vào các trường ấy, đột biến bỏ che ở trang dự án | fixed: du-an-content che mọi mã (toà, trục, căn, mã nối); E7 thêm trường và đột biến «TDB-AC-7 toà lộ tên nguồn»; E14 quét trang mọi dự án có toà |
| P1 | design | Chưa nói tin của phân khu có cộng lên dự án gốc | Tin gắn phân khu thiếu ở hàng dự án hoặc E14 đếm trùng | Ghi quy tắc; E2 thêm tin gắn K2; E14 tổng trên gốc | fixed: design, AC-2 ghi view quy mọi tin về gốc; E2 có tin S03 gắn K2 quy về D1; E14 tổng trên gốc và tin trên nút không gốc = 0 |
| P1 | contract | Hỏi-1 chưa có lời Mạnh mà AC-3 đã cài lối khuyến nghị; câu chú S09 không có AC; số ở opportunity lệch định nghĩa | Mạnh đọc «S09 344/344 chưa nối» không chú, hoặc so 357 với 180 và thấy lệch | Hỏi-1 mở ở Cổng Phạm vi; AC-3 thêm câu chú đo độc lập; opportunity đếm cùng định nghĩa | human-gate1: Hỏi-1 lên thẻ; nháp theo khuyến nghị (câu chú «S09 đã cấp tên N toà» đã dựng, AC-3 và E3, E14 đo N); opportunity sửa về 180 dự án S08 / 344 dự án S09 |
| P2 | evals | E2 ghi bảy nút nhưng chỉ có sáu; hai vế âm không có đột biến | Số assert cố định không khớp; bỏ lọc mot_du_an hay căn active vẫn xanh | Liệt kê đủ nút và số; thêm hai đột biến | fixed: E2 liệt sáu nút, bảng kỳ vọng 30 assert, thêm đột biến «tin xung_dot được đếm» và «căn không active được đếm» |
| P2 | evals | E4 chỉ đo lọc chỗ thiếu; ma trận không có areas hai tỉnh | Tỉnh tính sai, lọc nguồn/bậc sai mà E4 vẫn xanh | Ma trận hai cây areas; lọc tỉnh, nguồn, bậc với nhãn đếm viết trước; đột biến tỉnh | fixed: E4 thêm hai cây areas, ba lọc với nhãn kỳ vọng, đột biến «TDB-AC-4 tỉnh không leo gốc» |
