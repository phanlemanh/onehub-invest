---
slug: do-san-sl1-kdm
at: 2026-11-10T19:55:00Z
verdict: findings
p0: 1
p1: 3
p2: 1
---
## Findings
| Sev | Artifact | Thiếu gì | Kịch bản fail | Thước đo | Xử lý |
|---|---|---|---|---|---|
| P0 | design | Sổ d-4 ghi máy quyết việc đọc lại câu SL1-AC-5 «mọi tin hiện có» của hồ sơ đã ký s03-len-cong thành «tin lúc 069 ra đời»; câu trích là tiền lệ của hồ sơ khác, không quyết được lựa chọn này | Cổng Phạm vi duyệt mà Mạnh không được hỏi; hai ca xanh nhờ gỡ 37.977 phát biểu inferred — nới tiêu chí đã ký mà không ai thấy | Thành câu hỏi chỉ-người, AC SL1 chỉ vào sau khi Mạnh trả lời | fixed: tách hai ca SL1 khỏi vòng (dòng descope thay d-4), gửi câu hỏi cho Mạnh qua giám sát; hợp đồng còn KDM (AC-1…AC-5) |
| P1 | evals | AC-4 gỡ phát biểu theo bậc inferred, không theo thời điểm áp 069 | Phát biểu inferred có trước 069 bị gỡ oan, thế giới dựng hẹp hơn thật | Assert thời điểm tạo sau 069 | rejected: hai ca SL1 đã tách khỏi vòng (P0) — chuyển ghi chú sang câu hỏi cho Mạnh |
| P1 | evals | AC-6 hứa không ghi DB dùng chung nhưng probe chỉ quét script, không quét tệp test và itest | Ca KDM-PX1 ghi ngoài giao dịch để lại mồi trong DB oneinvest mà probe vẫn xanh | Probe quét cả test, kiểm BEGIN…ROLLBACK, đếm mồi sau ROLLBACK, chiều đỏ trên bản sao | fixed: AC-4 + probe quét cả script lẫn test (mỗi câu ghi có BEGIN trước, ROLLBACK sau), chiều đỏ trên bản sao từng tệp; AC-2/E2 đếm khu vực mồi = 0 sau ROLLBACK |
| P1 | evals | Không ô nào thử xã có admin_code mang meta.lac | Thước nhận xã lạc có mã mà không ai biết, mất chiều phát hiện lạc | Ô thứ ba trong ca KDM-PX1 | fixed: AC-2/E2 thêm ô xã có mã mang lac, so thẳng từng ô với câu SQL khuVucKhopTen của bên ghi (round-trip); sổ ghi lựa chọn thước = bên ghi |
| P2 | evals | View trước 070 viết tay, không rút từ migration thật | Ma trận xanh trên view chưa từng tồn tại | Dựng view từ CREATE VIEW cuối cùng trước 070 | rejected: hai ca SL1 đã tách khỏi vòng (P0) — chuyển sang hồ sơ SL1 riêng |
