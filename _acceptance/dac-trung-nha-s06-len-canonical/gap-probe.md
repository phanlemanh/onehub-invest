---
slug: dac-trung-nha-s06-len-canonical
at: 2026-10-31T00:05:00Z
verdict: findings
p0: 2
p1: 2
p2: 1
---

## Findings

| Sev | Artifact | Thiếu gì | Kịch bản fail | Thước đo | Xử lý |
|---|---|---|---|---|---|
| P0 | contract | Mâu thuẫn số trường: thiết kế §1 có bathrooms (đã có) đọc từ toilets nhưng §3 chỉ thêm 7 mã; AC-8 không giữ bathrooms của S03/S05. | Phát biểu bathrooms bị CHECK chặn, hoặc phân xử đặt NULL bathrooms của S03/S05 mà AC-8 không bắt. | Chốt một nghĩa; AC-8 thêm bathrooms của S03/S05. | fixed: bathrooms đã nằm trong sáu mã của 059 (field CHECK và resolve_offer_fields 059 đã có), nên không thêm mã thứ tám; AC-8/E8 thêm bathrooms của tin S03/S05 vào cột không đổi, 0 tin miễn. |
| P0 | contract | Dòng sổ mẫu số 95% (d-…-5) ghi máy quyết nhưng câu trích không quyết việc loại rác; mẫu số dùng chung bộ lọc với bộ đọc nên vòng tròn. | Bộ đọc coi «4,5» hay «3 tầng» là rác, mẫu số co theo, tỉ lệ vẫn ≥ 95%. | Hỏi người chọn mẫu số; thước in ba số bằng SQL độc lập; ma trận E3 gồm dạng giá trị thật. | fixed: thành Hỏi-1 (dòng sổ thay d-…-5, nguồn chỉ-người); AC-7/E7 in có khoá · rác kèm ba giá trị phổ biến · có ô bằng SQL độc lập; AC-3/E3 thêm dạng giá trị thật đếm ở stg. |
| P1 | design | Trigger 061 chỉ kiểm kiểu, phát biểu hitl ngoài miền lọt rồi làm phân xử vi phạm CHECK. | hitl frontage_length=0 hay latitude=91 làm resolve_offer_fields ném lỗi, transform đứng. | Ma trận 4 trường số × (chữ, ngoài miền) × phương pháp, ca dương mỗi trường. | fixed: trigger kiểm kiểu và miền ở mọi phương pháp (thiết kế §3.3); AC-4/E4 ma trận 4 trường × (chữ, ngoài miền) × (source_field, hitl) + ca dương. |
| P1 | evals | Ca đỏ E7/E8 chạy merge-base khi 7 cột chưa có — lỗi SQL khớp ghim tên trường. | Thước ném «column does not exist», ca đỏ tính đạt rỗng. | Ca đỏ trên DB đã áp 061 với code transform merge-base, ghim dòng tỉ lệ, assert không lỗi SQL. | fixed: AC-7/E7, E8 và thiết kế §4 chạy merge-base trên DB đã áp 061, ghim «<trường>: X/Y < 95%», lệnh kết thúc bình thường. |
| P2 | contract | AC-8 miễn bedrooms cho «tin có phát biểu mới» không trần. | Lỗi sinh phát biểu bedrooms mới hàng loạt vẫn xanh. | 0 tin miễn hoặc trần viết trước. | fixed: bỏ miễn — bedrooms của mọi tin không đổi (vòng này không thêm phát biểu bedrooms). |
