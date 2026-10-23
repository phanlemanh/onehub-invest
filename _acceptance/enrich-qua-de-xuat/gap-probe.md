---
slug: enrich-qua-de-xuat
at: 2026-10-23T00:20:00Z
verdict: findings
p0: 0
p1: 3
p2: 2
---

# Phản biện context sạch — enrich-qua-de-xuat (nâng phạm vi 2026-10-23)

Tác tử mới, chỉ đọc 4 tệp (design doc · contract.md · evals.yaml · decisions.jsonl) + input thứ 5
(claim-scan). Tập trung phần nâng phạm vi: AC-7 viết lại, AC-11 mới, E8/E14–E17, sổ từ d-…-15.
Phản biện lần 1 (Cổng Phạm vi 22/10, 0 P0 · 4 P1 · 1 P2) nằm trong lịch sử git của tệp này.

## Findings

| Sev | Artifact | Thiếu gì | Kịch bản fail | Thước đo | Xử lý |
|---|---|---|---|---|---|
| P1 | contract AC-7 + evals E14 | Chưa nói lượt SAU làm gì khi field đã có thẻ xung đột đang chờ | Lượt 2 LLM vắng/lỗi → E1 direct → land áp vượt thẻ, chọn LLM sau đó bị skipped | Vế mới trong AC-7; ca E14 lượt 2 LLM vắng + LLM lỗi, chiều đỏ ghim 'AC-7 lượt sau áp E1 vượt thẻ' | fixed: AC-7 thêm vế giữ field đang xung đột; design §3.2 thêm luật tập field đang giữ; E14 thêm hai ca + chiều đỏ |
| P1 | evals E7, E14 | Không ca nào đo evidence dựng lại còn giữ cờ conflict | Thẻ xung đột «Để sau» → thẻ mới mất conflict → «Áp dụng» không chọn → E1 thắng | Ca để-sau thẻ xung đột, chiều đỏ ghim 'AC-7 dựng lại mất xung đột' | fixed: E14 thêm ca deferred + kiểm conflict ở lượt 2 |
| P1 | design + sổ d-16 | d-16 ghi một-lối trong khi sổ nêu lối migration sau 035; lệch d-2 là đánh đổi người quyết | Cổng duyệt với nhãn «máy quyết» mà Mạnh không được hỏi TS hay hàm SQL | Không còn dòng S1 một-lối có lối khác trong sổ | fixed: dòng mới thay d-16, nguồn chỉ-người (khuyến nghị TS + hai hàm 033; lối khác hàm SQL ở migration mới) |
| P2 | evals E16 | Fixture thẻ xung đột phía app dựng tay, không ghim khớp khoá writer | Writer ghi khoá khác tên → E16 xanh, thẻ thật không hiện lựa chọn | Tệp chung agent/tests/fixtures/e1-conflict-card.json, E14 ghim khuôn, E16 nạp; chiều đỏ 'AC-11 lệch khoá evidence' | fixed: E14 + E16 + paths |
| P2 | contract AC-5 + evals E6, E17 | AC-5 không giới hạn thẻ không xung đột; E6 «đúng status» va AC-11; E17 hỏi «hành vi cũ» ngoài inputs | Hội đồng chấm E6 FAIL hoặc E17 INCONCLUSIVE | Sửa AC-5, câu hỏi E6, E17 mô tả hành vi đọc được từ route.ts | fixed: AC-5 «không có field xung đột (thẻ có xung đột: AC-11)», E6 giới hạn thẻ không xung đột, E17 mô tả cụ thể |
