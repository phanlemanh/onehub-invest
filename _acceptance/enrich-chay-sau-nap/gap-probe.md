---
slug: enrich-chay-sau-nap
at: 2026-10-30T06:20:00Z
verdict: findings
p0: 2
p1: 2
p2: 1
---

## Findings

| Sev | Artifact | Thiếu gì | Kịch bản fail | Thước đo | Xử lý |
|---|---|---|---|---|---|
| P0 | design | Ngưỡng «LLM chết» (dòng d-4) là khẩu vị rủi ro mà sổ ghi máy quyết. Parse null không tính là lỗi. Câu trích AU3 chỉ liên quan, không quyết ngưỡng | 49/50 lời gọi hết thời gian chờ, hoặc 50/50 parse hỏng → job thoát 0, phần E2 tắt nhiều đêm mà không ai biết | Dòng sổ người quyết ngưỡng + parse null; AC-3 thêm hàng parse hỏng | human-gate1: Hỏi-1 (khuyến nghị: «LLM hỏng» = lỗi + không đọc được; hỏng từ một nửa số lời gọi → thoát 3). Dòng S1 mới supersedes d-4; AC-3 và E3 sửa theo nháp khuyến nghị |
| P0 | design | Job đêm ÁP giá trị E1 lên `sale_offers` thật qua `apply_enrichment`, mà d-6 ghi kho_dao false. Tên feature lại nói «chỉ ghi đề xuất» | Luật E1 sai → giá trị sai tự lên cloud mỗi đêm; người ký tưởng mọi giá trị qua `/ops/review` | kho_dao true + dòng người quyết «tự áp mỗi đêm»; tên feature tả đúng | human-gate1: Hỏi-2 (khuyến nghị: giữ áp luật xác định như thiết kế M-3 đã ký; hoàn tác bằng enrich-revert). Dòng S1 mới supersedes d-6 với kho_dao true; tên feature ở contract và ô cơ hội sửa thành «ghi đề xuất, áp luật xác định» |
| P1 | evals | Đường lỗi ghi chỉ đo bằng SAVEPOINT và stub; BEGIN/ROLLBACK của CLI chỉ chạy ca lành | CLI ROLLBACK sai kết nối → mọi tin sau tin hỏng đều hỏng, E2 vẫn xanh | Ca CLI thật trên DB thử, trigger raise theo offer_id, kiểm mức tiến trình | fixed: thêm E12 (AC-2, cross-layer) — CLI thật, trigger trên DB thử, exit 2, tin 1 và 3 đọc được từ phiên khác, tin 2 trống; chiều đỏ là bản sao bỏ ROLLBACK |
| P1 | contract | Đường bốc tin mỗi đêm (không `--offers`, `random()`) chưa có AC đo. Tin đã thử mà vẫn thiếu trường bị bốc lại, nên «8 đêm» không có căn cứ | Các đêm sau bốc lại cùng tin → `deXuatMoi` về 0 → ngưỡng CHẾT kích dù chuỗi vẫn lành | AC hai lượt liên tiếp không `--offers`, lượt hai không bốc lại tin của lượt một | fixed: thêm AC-9 + E13. Mỗi tin thử xong (LLM không lỗi) ghi một dòng `ops_audit` `enrich:thu` trong giao dịch của tin; bốc tin bỏ qua tin đã thử trong cửa sổ (Hỏi-3, khuyến nghị 30 ngày). Con số «8 đêm» đổi thành ước lượng có điều kiện |
| P2 | evals | Ma trận LLM × ghi có 8 ô mà E3 chỉ đo 4; ô «ghi hỏng + LLM chết» chưa có eval | `maThoat` xét LLM trước nên trả 3 → lỗi ghi bị giấu | E3 đủ 8 ô, ô ghi hỏng + chết hết ra mã 2 | fixed: E3 viết trước đủ ma trận (6 hàng LLM × 2 trạng thái ghi), chiều đỏ là bản sao đảo ưu tiên |
