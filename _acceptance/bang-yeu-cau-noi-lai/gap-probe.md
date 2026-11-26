---
slug: bang-yeu-cau-noi-lai
at: 2026-11-26T06:10:00Z
verdict: findings
p0: 0
p1: 2
p2: 3
---

## Findings

| Sev | Artifact | Thiếu gì | Kịch bản fail | Thước đo | Xử lý |
|---|---|---|---|---|---|
| P1 | decisions · contract | Bản v2 ghi thẳng intent_status từ luật, lệch ADR-0013 câu 4 mà không dòng sổ nào ghi | Cổng duyệt một lệch kiến trúc không biết; YC9 phải đổi luồng ghi ý định | Dòng sổ thay lối hoặc đưa ý định qua phát biểu | fixed: ý định qua phát biểu listing_intent + resolve_inquiry_fields (khuôn GS đồng ý 26/11), dòng sổ approach mới |
| P1 | contract AC-5 · evals E5 | Không ca nào chạy transform trên tập con để chặn nghỉ nhầm bài ngoài lượt | Lượt nạp chỉ bài mới cho nghỉ hàng chục nghìn dòng cũ | Ca lượt một phần hai chiều | fixed: AC-5 (i) lượt không chứa A giữ A sống, E5 |
| P2 | contract AC-8 · evals E8 | Kiểm sync-cloud chỉ âm tính, không đối chứng dương, bỏ sót view | Bộ đọc danh sách ra rỗng thì xanh suông | Danh sách có sale_offers; vắng cả bảng lẫn view; cấy view thì đỏ | fixed: AC-9, E9 |
| P2 | contract AC-4 · evals E4 | Câu SQL đọc nhãn chưa đo ở tầng DB; ô chỉ-model không có sàn | Bộ đọc SQL sai đường lọc json_ok mà AC-3 vẫn xanh | Chèn nhãn thật vào silver_labels trên DB thử; sàn chỉ-model | fixed: AC-4 chèn nhãn bằng khuôn bộ ghi thật + đối chứng bỏ lọc json_ok; AC-9 sàn chỉ-model 90% của 1.243 |
| P2 | contract AC-5 · evals E5 | Răng quét DELETE chỉ quét yeu-cau.mjs | DELETE thêm ở transform-zalo hay tệp SQL lọt qua | Quét trọn pipeline/** và 136, cấy hai chỗ | fixed: AC-5, E5 |
