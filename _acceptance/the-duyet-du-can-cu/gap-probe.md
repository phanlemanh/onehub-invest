---
slug: the-duyet-du-can-cu
at: 2026-10-30T05:13:57Z
verdict: findings
p0: 1
p1: 4
p2: 0
---

## Findings

| Sev | Artifact | Thiếu gì | Kịch bản fail | Thước đo | Xử lý |
|---|---|---|---|---|---|
| P0 | decisions | Dòng d-7 ghi căn cứ mot-loi «cần Mạnh gật từng lệnh (F6)» — ràng buộc chỉ đẩy lối UPDATE ai_suggestion về NULL sang người chứ không giết nó; cost_if_wrong bỏ sót hệ quả người dùng thấy. Cùng lớp [db-volume-check-volume-khac-ten#F1]. | Thẻ bổ sung tin chờ lúc gộp vẫn mang 'apply'; chỗ nào còn đọc cột vẫn mồi người bấm Áp (đúng lỗ L04); Mạnh chưa được hỏi có dọn hàng chờ. | Đổi d-7 thành Hỏi kèm số đếm thẻ chờ mang 'apply' ở DB local, hoặc nêu căn cứ thật. | fixed: đo DB local 30/10 — 0 thẻ bổ sung tin đang chờ, 4 dòng 'apply' đều đã bác; dòng mới supersedes d-7 với căn cứ mot-loi (UPDATE không đổi thẻ chờ nào) và AC-6 thêm vế thẻ bổ sung tin không đọc ai_suggestion |
| P1 | contract | AC-6 và E7 chỉ khoá vùng nút thẻ ghép căn; thẻ bổ sung tin không có AC đo việc không đọc ai_suggestion. | review-card tô nút Áp theo 'apply'; E7 xanh, E8 xanh, Cổng 2 ký đạt mà thẻ bổ sung tin vẫn mồi Áp. | Thêm vế bổ sung tin 'apply'/NULL vào AC-6; E7 so outerHTML vùng nút; chiều đỏ ghim. | fixed: AC-6 thêm vế thẻ bổ sung tin 'apply' vs NULL; E7 so outerHTML [data-review-actions], không có 'nên áp', chiều đỏ 'TD-AC-6: nút Áp đổi theo gợi ý apply' |
| P1 | evals | Ma trận nhãn căn cứ của E2 lấy theo fixture (3 cặp) chứ không viết trước từ tập giá trị bên ghi phát ra được. | Cặp khác trên dữ liệu thật rơi về nhánh mặc định, ô căn cứ hiện mã thô; E2 vẫn xanh. | Ma trận viết trước mọi evidence_tier × assertion_method + probe DISTINCT trên DB local. | fixed: E2 ma trận 3 × 6 = 18 phần tử từ VOCAB của vocab.generated.ts + probe chỉ đọc SELECT DISTINCT cặp trên DB local, 0 cặp không nhãn |
| P1 | evals | Fixture E4 (khoá nối toàn văn) và E5 (bảng media) viết tay đúng khuôn bên đọc, không round-trip từ bên ghi thật. | Khoá thật lệch (list_id vs originating_system_key, post_ids); mọi thẻ thật hiện «Không có toàn văn»; E4/E5 xanh, ngưỡng chết ở nghiệm thu. | Fixture qua importer/transform thật, hoặc probe tỉ lệ trên DB local. | fixed: E4 thêm probe chỉ đọc trên DB local (dữ liệu importer + transform thật ghi): thẻ chờ S03/S06 có bài ở stg → loader trả toàn văn 100%; E5 thêm probe đếm ảnh local_file thật = ảnh vai ops nhận |
| P1 | contract | Đường đo đếm review.decide «sau ngày gộp» và giả định route là chỗ ghi duy nhất mà không đo. | Máy thu chưa khởi động lại theo bản mới, hay một đường ghi review.decide khác → dòng thiếu ly_do kích hoạt điều kiện CHẾT dù feature đúng. | Mốc đếm = lúc bản mới chạy ở máy thu; eval quét mọi chỗ ghi review.decide. | fixed: Đường đo và opportunity đổi mốc sang lúc app máy thu chạy bản đã gộp (ghi sha + giờ); AC-8/E10 thêm quét tĩnh: đúng một chỗ ghi review.decide (route decide), chiều đỏ ghim |
