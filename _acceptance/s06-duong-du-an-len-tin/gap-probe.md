---
slug: s06-duong-du-an-len-tin
at: 2026-11-02T16:23:04Z
verdict: findings
p0: 1
p1: 4
p2: 0
---

## Findings

| Sev | Artifact | Thiếu gì | Kịch bản fail | Thước đo | Xử lý |
|---|---|---|---|---|---|
| P0 | design | Căn cứ dòng căn nhận đường ghi lối migration đã chết trong khi nó chỉ đắt; không có đường hoàn tác ô căn; E4 chấp nhận tin về giá trị thấp hơn hoặc trống | Quy tắc chọn tin sai, gộp rồi job đêm điền ô căn và lên cloud; gỡ mã không rút được ô nào | Lệnh hoàn tác theo log; E4 tách hai ca | fixed: thêm --hoan-tac-duong vào AC-5, E4 tách hai ca; human-gate1: lựa chọn thành Hỏi-2 |
| P1 | evals | E7 chỉ in số cặp đổi nhãn, tên nguồn là phép âm tính không đối chứng; E6, E3, E4 thiếu ca đỏ; thiếu cặp Phố, Ngõ | «Ngõ 5 X» × «X» ra Lệch oan mà E7 vẫn thoát 0; danh sách tên rỗng luôn ra 0 | Thoát 1 khi vi phạm, định nghĩa độc lập khoaDuong, danh sách ≥ 1, cờ gài | fixed: viết lại E3, E4, E6, E7 và AC-6, AC-7 |
| P1 | contract | Ma trận AC-1 chưa viết trước; kết quả để ngỏ; Xã Đàn, Tỉnh lộ 10, P. Hòa Quý chưa chốt | Người làm viết ma trận cùng lúc với mã; Xã Đàn bị bỏ, P. Hòa Quý thành tên đường | Bảng đầu vào → đầu ra trong contract; đột biến bỏ neo | fixed: bảng 27 hàng trong contract, đổi luật tiền tố, hai ca đỏ ở E1 |
| P1 | contract | Hỏi-1 đã ghi dạng khẳng định; ngưỡng dự án ở opportunity không có chủ khi tách | Ký xong hàng hiện xong trong khi dự án vẫn 0 và không hàng nào giữ việc | Dòng trả lời Hỏi-1; mã hàng T3 trong lo-trinh.json | fixed: dòng sổ đổi thành câu hỏi, Đường đo đòi mã hàng trước Cổng Bằng chứng; human-gate1: Hỏi-1 |
| P1 | evals | Ngưỡng chỉ đo trong giao dịch, không đo sau gộp; giao dịch dài trên DB dùng chung giữ khoá | Job hay đồng bộ hỏng thì cloud không có đường, không ai được báo | Chạy trên bản chép; bước đo sau gộp có tên | fixed: E7 chạy trên db-thu; Notes và Rollout nêu --chi-doc và đối chiếu cloud |
