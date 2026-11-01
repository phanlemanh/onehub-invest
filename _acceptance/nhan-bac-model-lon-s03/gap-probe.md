---
slug: nhan-bac-model-lon-s03
at: 2026-10-31T16:45:00Z
verdict: findings
p0: 0
p1: 4
p2: 1
---
## Findings
| Sev | Artifact | Thiếu gì | Kịch bản fail | Thước đo | Xử lý |
|---|---|---|---|---|---|
| P1 | design | Gửi chữ bài ra hai bên ngoài (Anthropic, OpenAI) là việc khó đảo mà sổ S1 không có dòng quyết kèm căn cứ trích nguyên văn | Người ký tin việc gửi đã có gốc trong sổ; nếu lời bỏ luật chỉ áp một bên thì chữ đã rời máy | Dòng sổ S1 chi-nguoi kho_dao true nêu hai nhà cung cấp và trường được gửi | fixed: thêm Hỏi-5 (chi-nguoi, kho_dao true) cho Mạnh xác nhận ở Cổng Phạm vi |
| P1 | design | Design nêu đường Batch API mà AC-4/7/9 chỉ đo đường gửi từng yêu cầu | Đường Batch bỏ sót stripPII hay vượt trần mà E4/E9 vẫn xanh | Out of scope hoặc thêm ô Batch | fixed: Batch đưa vào Out of scope, design ghi vòng sau |
| P1 | evals | Mẫu trả lời Decisions và tệp vàng viết tay theo khuôn chính bên đọc tự định | Trả lời thật hay tệp ZCode khác khuôn — E7/E8 xanh mà AC-10 trượt | Mẫu theo tài liệu; khuôn tệp vàng ghi vào contract | fixed: E7 dựng trả lời Decisions theo hình tài liệu 31/10 kèm trích chỗ; khuôn tệp vàng JSONL ghi vào contract làm giao diện với ZCode (Hỏi-1) |
| P1 | contract | Ngưỡng sống của ô cơ hội có ba vế, AC-10 chỉ so ý định | Backend đạt ý định mà hụt bán/thuê hay đắt — vẫn kết luận sống | Ngưỡng số cho bán/thuê và chi phí trong AC-10 và E10 | fixed: AC-10/E10 thêm bán/thuê trên offer ≥ 95% và chi phí hết bài cũ ≤ 10 USD, mỗi vế một ô đạt/không |
| P2 | evals | E10 hỏi điều ngoài inputs (tên nguồn thật, cùng tập vàng); E3 thiếu sale_offers/properties | Người chấm trả lời cảm tính; ghi lạc vào sale_offers lọt | Bỏ vế tên nguồn khỏi judgment, băm danh sách post_id, thêm bảng vào E3 | fixed: E10 hỏi băm post_id ghi trong tệp + đoạn trông như chữ bài; E3 thêm sale_offers, properties |
