---
slug: model-may-sang-haiku
at: 2026-11-21T07:10:00Z
verdict: findings
p0: 1
p1: 4
p2: 0
---

## Findings

| Sev | Artifact | Thiếu gì | Kịch bản fail | Thước đo | Xử lý |
|---|---|---|---|---|---|
| P0 | contract | Dòng sổ Hỏi-2 (lượt đo AC-8 gửi 130 chữ bài S03 ra Gateway) ghi kho_dao false, ngược với Hỏi-3 cùng loại việc | Mạnh duyệt Hỏi-2 như việc lùi được mà không biết dữ liệu rời máy không thu lại được | Dòng Hỏi-2 mang kho_dao true và nêu chữ bài rời máy trong giá | fixed: dòng sổ mới thay d-20261121T064043Z-8, kho_dao true, cost_if_wrong nêu 130 chữ bài rời máy không thu lại được |
| P1 | contract | AC-1 đòi scripts không còn qwen27b nhưng Out of scope giữ chữ ấy trong scripts/smoke-review-queue.mjs, không có danh sách loại trừ ghim | E1 luôn đỏ, hoặc probe lặng lẽ loại tệp và một chỗ gọi thật trong tệp loại bị lọt | Danh sách loại trừ đóng trong AC-1 và E1, E1 in số tệp loại, chiều đỏ cấy vào tệp khác | fixed: AC-1 và E1 ghim danh sách loại trừ đóng (tệp test, scripts/smoke-review-queue.mjs), E1 in «loại k tệp», thêm chiều đỏ cấy qwen27b vào tệp tạm khác dưới scripts/ |
| P1 | contract | AC-8 không có ngưỡng độ trùng từng trường trong khi Hỏi-3 lấy AC-8 làm căn cứ chất lượng | Haiku trùng 20 % trường dự án với Qwen mà AC-8 vẫn đạt, Mạnh tưởng chất lượng đã được chặn | Ngưỡng từng trường, hoặc nói rõ AC-8 không chặn độ trùng và có lối khác «xem bảng rồi mới bật» | fixed: AC-8 nói rõ độ trùng với Qwen là số báo không phải ngưỡng (Qwen không phải đáp án đúng); dòng sổ thay Hỏi-3 nêu điều đó và đặt lối khác «Mạnh xem so-truoc-sau.md rồi mới bật enrich-run» |
| P1 | evals | Trục người đọc đầu ra không có AC; không eval nào chạy đường ghi enrich-run → enrichment_proposals → apply_enrichment với đầu ra dạng Haiku; zalo-import-daily.sh vắng khỏi bảng phủ ca | Haiku bọc JSON trong khối mã hay model ghi khác giá trị bị lọc, lượt 00:00 ghi 0 đề xuất mà E1–E8 xanh; hoặc chuỗi còn kiểm sức khoẻ :8000 | AC mới chạy đường ghi trên DB thử với đầu ra thô dạng Haiku, đếm đề xuất và lần áp so số kỳ vọng | fixed: thêm AC-10 và E10 (năm đầu ra thô viết trước gồm JSON trong khối mã và một đầu ra hỏng, đếm đề xuất và lần áp); soát mã 21/11: zalo-import-daily.sh không kiểm :8000, không chỗ nào lọc đề xuất theo tên model — thêm dòng zalo-import-daily.sh vào bảng phủ ca |
| P1 | evals | E4 dùng fixture viết tay vào buildJudgeInput, không rút qua queryPair trên DB thử; lý do luật có thể mang SĐT | Dữ liệu thật qua queryPair hay lý do luật mang người bán vào thân yêu cầu mà E4 vẫn xanh | E4 chạy trên DB thử qua OFFER_SELECT, queryPair, cấy người bán vào cột ngoài chữ bài | fixed: E4 thành itest trên DB thử (agent/tests/du-lieu-gui-agent.itest.ts) chạy enrich-run và judge-run thật; soát mã: buildJudgeInput chỉ in chữ `cau` của lý do luật, không in số đo `so` — ghi vào design doc |
