---
slug: judge-nguong-la-code
at: 2026-10-30T07:37:20Z
verdict: findings
p0: 1
p1: 4
p2: 0
---

## Findings

| Sev | Artifact | Thiếu gì | Kịch bản fail | Thước đo | Xử lý |
|---|---|---|---|---|---|
| P0 | design | Dòng sổ d-3 ghi nguồn một-lối cho mẫu số max(a,b), nhưng ràng buộc nó nêu (đối xứng A↔B) chỉ loại công thức chia một bên; mẫu số min hay trung bình vẫn sống — chọn mẫu số là chọn nghĩa ngưỡng ([s03-gia-ty-sau-khoang-trang#F1]) | Giá/m² 100 vs 140: theo max lệch 28,6% → unsure, theo min 40% → no; ngưỡng no thực chất thành tỉ 1,43 lần, Cổng Phạm vi không thấy đây là lựa chọn | Dòng sổ mới supersedes d-3 trích câu quyết mẫu số hoặc thành câu hỏi; E1 thêm ô phân biệt mẫu số kèm đối chứng đỏ | fixed: dòng sổ d-20261030T073813Z-11 supersedes d-3, căn cứ mục tiêu trích bộ lọc Stage B của pipeline/resolve-properties.mjs (abs/GREATEST) — thẻ dùng cùng phép đo với bộ sinh ứng viên; E1 ô (11) 100 vs 140 kèm đối chứng đỏ mẫu số min; AC-1 và design ghi rõ công thức |
| P1 | evals | E6 không đo bộ khoá evidence của thẻ mới so với writer thật (seed 029); AC-4 hứa lời căn cứ «hiện» trên /ops/review mà E4 chỉ đo chuỗi con | judge-run ghi offer_a theo bộ khoá riêng → /ops/review hiện trống giá, diện tích, phường; «mọi ứng viên có thẻ» vẫn đạt | E6 so tập khoá với seed 029 thật kèm đối chứng đỏ; AC-4 hẹp lời về ai_reasoning hoặc cho đi qua hàm căn cứ của app | fixed: E6 rút tập khoá từ jsonb_build_object của seed trong db/migrations/029_review_queue.sql (đọc tệp thật), đối chứng đỏ thiếu khoá 'phuong'; AC-4 hẹp lời thành «ai_reasoning kết bằng LLM <model> · trace <tệp>» |
| P1 | evals | E4 tiêm recordCall chép bản ghi thay cho recordCallDb thật, DB thử không có ai_calls — không eval nào đo quan hệ thẻ ↔ dòng sổ, cũng không đo sổ vẫn được ghi | Bản bọc thay hẳn recordCallDb → sổ ai_calls (PL29) ngừng có dòng cho judge; E4 vẫn xanh | DB thử nạp 052_ai_calls.sql thật, bọc recordCallDb thật, assert +1 dòng và cham.model/trace bằng cột dòng ấy; đối chứng đỏ bản bọc không gọi tiếp | fixed: E4 viết lại đúng thước đề xuất; AC-4 nói rõ «sổ ai_calls có đúng một dòng … thẻ mang model id và đường trace bằng đúng cột của dòng sổ đó»; design §3 ghi bản bọc GỌI TIẾP recordCallDb |
| P1 | contract | Đường đo trỏ «câu SQL ở design §4» mà §4 không có câu nào; E2 đo buildJudgeInput chứ không đo prompt model thật nhận | Sau gộp không ai có câu đếm để chấm ngưỡng trên dữ liệu thật; chamMotLuot dựng tin nhắn đường khác có ngưỡng mà E2 vẫn xanh | Ghi câu SQL vào design §4, nói rõ chạy ở đâu; judge-run.test bắt prompt mock doGenerate nhận rồi soi | fixed: design §4 có câu đếm; Đường đo nói rõ chạy trong test AC-6 trên DB thử và trên DB local là bước vận hành sau gộp; E2 thêm ca (b) bắt nguyên văn prompt model giả nhận trong chamMotLuot kèm đối chứng đỏ; AC-2 đổi lời thành «nội dung model THẬT SỰ nhận» |
| P1 | evals | Ma trận E1 thiếu ô «chỉ một bên có phường» và các ô sát ngưỡng dù AC-1 so chặt | Code so chuanHoa(null) với tên phường → khác → no; hoặc dùng <= nên lệch đúng 15% ra yes; E1 vẫn xanh | E1 thêm ô (9) một bên có phường → unsure, (10) đúng 15% không yes, (11) đúng 30% không no; số assert = 11 | fixed: E1 thành 12 ô — (9) một bên có phường → unsure, (10) lệch đúng 0,15 → không yes, (11) ô mẫu số (100 vs 140) → unsure, (12) lệch đúng 0,30 → không no; AC-1 và design ghi «so chặt» và «thiếu không bao giờ thành khác»; ô 10–12 để ngoài fixture của E2 |
