---
slug: so-nhom-mot-noi
at: 2026-10-26T11:55:00Z
verdict: findings
p0: 3
p1: 2
p2: 0
---
## Findings
| Sev | Artifact | Thiếu gì | Kịch bản fail | Thước đo | Xử lý |
|---|---|---|---|---|---|
| P0 | evals | AC-2 không đo test C7 và test vòng đời trên public sau gộp (view); E2 khoá cứng 5 tệp | sau gộp, LIKE public.source_groups chép từ view mất default và CHECK, test hay script khác gãy mà eval xanh | chạy test C7 trên lược đồ mô phỏng public sau gộp; tập tệp git grep phải khớp danh sách | fixed: E3 thành ca SN-AC-2b chạy bản chép nguyên văn test C7 trên lược đồ mô phỏng; E2 thêm tập tệp git grep; E13 cho test vòng đời với fixture cập nhật khuôn 048 |
| P0 | design | dòng sổ dự án nhóm chuyên ghi mục tiêu nhưng câu trích không quyết loại node | admin không khai được nhóm chuyên một chung cư | dòng chỉ-người Hỏi-3 | human-gate1: Hỏi-3 (khuyên chỉ khu đô thị); AC-4 và E5 trỏ Hỏi-3 |
| P0 | design | luật biến khỏi gateway → retired không ghi sổ, thiếu ca quay lại và tệp thiếu/hỏng | tệp đọc rỗng đốt mã mọi nhóm; nhóm quay lại kẹt retired | dòng chỉ-người + ca E6 | human-gate1: Hỏi-4 (khuyên paused giữ mã); AC-5, E6 thêm ca quay lại, tệp vắng, tệp hỏng |
| P1 | evals | bản .mjs của hàm đọc nhóm không có ca so khớp với bản TS | bản soi S03 sai mà E6 xanh | ma trận fixture so TS và .mjs | fixed: ca SN-AC-5b, có fixture sinh bằng hàm ghi thật |
| P1 | contract | AC-8 không đo nhãn theo gateway và ba trạng thái trống, lỗi, lưu lỗi | người vận hành tưởng trạng thái S03 là công tắc; lỗi bị nuốt | thêm vế vào AC-8, E9, E10 | fixed: AC-8, E9, E10 bổ sung |
