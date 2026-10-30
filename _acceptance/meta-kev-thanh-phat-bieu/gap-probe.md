---
slug: meta-kev-thanh-phat-bieu
at: 2026-10-30T08:05:00Z
verdict: findings
p0: 2
p1: 2
p2: 1
---

## Findings

| Sev | Artifact | Thiếu gì | Kịch bản fail | Thước đo | Xử lý |
|---|---|---|---|---|---|
| P0 | design | Dòng sổ «kev chỉ đi với inferred» trích rationale assertion_method nói ngược («còn lại lớp quan sát»); lối observed và lối e2_llm chưa chết; tách enrich_field không có câu trích | Gate 1 duyệt hàm canh trên câu trích ngược; PL21 lọc theo observed thấy tập rỗng | Dòng supersedes có câu định nghĩa inferred quyết được, hoặc Hỏi; sửa rationale sổ cùng commit; E2 kiểm rationale khớp hàm canh | fixed: hai dòng sổ mới supersedes — lớp inferred căn cứ thiết kế PL15 («E2 không trích dẫn xuống đây»; sổ gọi observed là «Quan sát có trích dẫn»), phương pháp kev và trục assertion_field căn cứ PL18 «E2 là bộ đọc có trích dẫn»; design ghi rationale assertion_method sửa cùng commit |
| P0 | design | Dòng sổ «lớp cao nhất làm value, hoà theo thứ tự sổ» ghi máy quyết dù là lựa chọn biểu diễn | Bài «khách tìm…» mang offer làm value; hoà offer/inquiry lặng lẽ thành offer | Dòng sổ riêng có căn cứ hoặc Hỏi; ghim dòng hoà | fixed: liên làn chốt bộ cột 30/10 (claudedp-3010-2) — Kev chỉ trả một lớp kèm một xác suất mỗi câu, không có phân phối, nên không còn chọn lớp cao nhất hay hoà; dòng sổ mới supersedes (một lối: hình dạng v5 chỉ có lớp được chọn); AC-3 viết lại theo bộ cột |
| P1 | evals | Trường kind không được đo ở tầng DB; ma trận AC-1 thiếu kind | replaceOwn khoá sai làm kind bị rút, hay CHECK từ chối kind mà E4 vẫn xanh | E1 INSERT kind; E4 đếm phát biểu kind; ca đỏ replaceOwn khoá (chủ thể, phương pháp) | fixed: AC-1/E1 thêm INSERT (kind, kev, inferred); AC-4/E4 đếm phát biểu kind (sale, rent_lt), lượt hai rút 0; ca đỏ replaceOwn bỏ trường ghim «kind bị rút» |
| P1 | contract | Đường đo «số tin rao không giảm so với khi chưa có Kev» chỉ so có Kev với xoá trắng Kev trên cùng mã — đúng theo cấu trúc, không so với trước v5 | Hook/importer v5 rớt 30% bài mà E9 vẫn xanh | So số bài/offer ngày v5 với trung vị 7 ngày, hoặc ghi rõ chỉ đo bất biến transform | fixed: AC-9/E9 in số bài stg và số offer ngày v5 cạnh trung vị 7 ngày trước; Đường đo ghi rõ có Kev = xoá trắng là bất biến của transform, rớt bài thượng nguồn là nghiệm thu phần (1); dòng sổ descope «không đặt ngưỡng tụt» |
| P2 | contract | Ô cơ hội nói «một ngày v3», hợp đồng nói v5; khoá nhận diện ngày v5 chưa khai | E9 treo «chưa có dữ liệu v5» hoặc chọn nhầm ngày lẫn bài trước v5 | Khai khoá nhận diện, dòng sổ đối chiếu v3/v5, E9 in khoá | fixed: ngày v5 = ngày (giờ VN) có bài mang kev_intent, chỉ xét bài có kev_at, gate down đếm riêng; dòng sổ đối chiếu v3/v5; E9 in khoá nhận diện |
