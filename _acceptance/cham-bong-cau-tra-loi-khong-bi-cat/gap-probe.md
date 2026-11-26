---
slug: cham-bong-cau-tra-loi-khong-bi-cat
at: 2026-11-22T05:38:25Z
verdict: findings
p0: 1
p1: 3
p2: 1
---

## Findings

| Sev | Artifact | Thiếu gì | Kịch bản fail | Thước đo | Xử lý |
|---|---|---|---|---|---|
| P0 | design (sổ d-2, d-3) | Hai dòng sổ ghi «một lối» nhưng lối còn lại không chết, chỉ đắt hơn (bài học [thuoc-tinh-can-s16-rut-khi-mo-ho#F2]): trần hằng cao và ép lý do ngắn đều làm được, giá vài xu | Người duyệt tưởng không còn đường khác; đánh đổi độ chắc lượt 2 với tiền và một vòng đọc lại không ai đứng tên | Dòng có căn cứ trích lời giao, hoặc chuyển thành câu hỏi | human-gate1: thay bằng Hỏi-1 (trần theo số ô hay hằng cao) và Hỏi-2 (ép lý do ngắn ngay hay sau lượt 2), mỗi câu có khuyến nghị và lối khác kèm giá, mang supersedes |
| P1 | contract AC-6 / evals E6 | Chưa đo kho dùng lại THẬT có 57 lần đọc lượt 1 | Kho nằm chỗ khác hay chế độ thử không ghi kho thì lượt 2 gọi lại đủ 60, tiền đề «chỉ gọi lại 3 cặp» sai | Eval chỉ đọc trên máy thu: khoaDung 30 thẻ × 2 model tra đúng kho lượt 2 đọc, đích 57 | fixed: thêm E8 (probes/khoa-trung.sh) — kho ở state/cham-bong-bo-sung-tin/kho.jsonl, chung mọi lượt, chế độ thử vẫn ghi kho |
| P1 | contract Đường đo, AC-7 / evals E7 | Lượt 2 lấy 30 thẻ đầu lúc chạy; lượt nạp có thể đưa thẻ mới lên đầu, tập thẻ khác lượt 1 | Lượt 2 gọi nhiều cặp mới, số «30/30» và «bi-cat» không so được với lượt 1 | Ghim lượt 2 vào 30 thẻ lượt 1, hoặc đo số thẻ trùng đầu lượt 2 | deferred: lệnh lượt 2 là probe E11 đã ký (không đổi cờ); trước lượt 2 chạy lại E8 để in số thẻ trùng và số cặp mới, báo GS cùng kết quả; trần tiền lượt vẫn 0,1 USD |
| P1 | evals E2 | Không assert vế «không sinh kết cục» khi câu bị cắt mà JSON tách được | Kết cục giả «khớp» từ câu cụt lọt vào tệp NB5 đọc trong khi E2 xanh | Thẻ có lần đọc bi-cat (JSON tách được) + lần đọc ok → không kết cục; đột biến dùng JSON đã tách đỏ | fixed: E2 thêm ca lượt trên Truy giả (kho 1 dòng, kết cục null), đột biến «bỏ kiểm cat» là đúng đột biến dùng JSON đã tách khi bị cắt |
| P2 | design / contract AC-1 | Công thức chưa đối chiếu với chính ba lời gọi bị cắt | Thẻ 2 ô cần ~1.800 token, lại bị cắt, lượt 2 ra 29/30 | Ngoại suy token cần từ chữ đã lưu của 3 lời gọi bị cắt | rejected: chữ của lời gọi lỗi không được lưu (kho chỉ nhận lần đọc thành công, sổ gọi chỉ có token) — không ngoại suy được; lượt 2 đo trực tiếp bằng loi_theo_ly_do.bi-cat (AC-4), rủi ro nằm ở Hỏi-1 |
