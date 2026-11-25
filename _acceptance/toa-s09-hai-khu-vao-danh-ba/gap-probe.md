---
slug: toa-s09-hai-khu-vao-danh-ba
at: 2026-11-13T13:40:14Z
verdict: findings
p0: 1
p1: 2
p2: 1
---

## Findings

| Sev | Artifact | Thiếu gì | Kịch bản fail | Thước đo | Xử lý |
|---|---|---|---|---|---|
| P0 | contract (sổ dòng 5, AC-3, Đường đo) | Ngưỡng ghi «không khớp thì lên thẻ» nhưng máy tự đọc «không khớp» là «khớp mơ hồ» rồi đúc thẳng 129 toà, căn cứ trích không quyết lựa chọn | Cổng 1 duyệt Đường đo «không khớp thì lên thẻ → AC-3» trong khi AC-3 đo điều ngược lại; Mạnh chưa được hỏi có muốn 129 toà qua /ops/review | Dòng sổ mới supersedes, chi-nguoi, thành câu hỏi trên thẻ; AC-3, AC-6 viết theo câu trả lời, có chiều đỏ cho lối thẻ | human-gate1: thành Hỏi-3 (dòng sổ 15 supersedes dòng 5); AC-3 ghi hai lối, lối thẻ có chiều đỏ đột biến đúc thẳng |
| P1 | contract (Đường đo, Coverage) + Hỏi cấp cụm | Vế «bài ghi phân khu thay toà phân giải được» chỉ có AC-4 đo nút tồn tại; cụm không có AC, không có descope cho lối hàng sau | Mạnh chọn cụm trong hàng, cụm dựng không eval nào kiểm; chọn hàng sau thì vế ngưỡng không đường đo | AC-10 có điều kiện + ma trận cụm + chiều đỏ; AC-7 đếm bài chỉ nêu phân khu/cụm phân giải được | fixed: thêm AC-10 (có điều kiện theo Hỏi-1) + E10 ma trận bốn ô có chiều đỏ; AC-7 và E7 đếm thêm bài nêu phân khu/cụm; lối hàng sau → bỏ AC-10 có tên, ghi giới hạn |
| P1 | contract (AC-6) + evals (E6) + sổ dòng 4 | Gộp OS2 (61 → 60) dựa trên câu trích chỉ cấm hai UPI; AC-6 viết ≥ trong khi E6 viết = | Mạnh hiểu 61 là số toà; AC-6 với ≥ cho qua lỗi đúc trùng | Dòng sổ mới đổi căn cứ; AC-6 đổi ≥ thành = | fixed: dòng sổ 14 supersedes dòng 4 (căn cứ một-lối: giữ hai OS2 làm mọi bài «OS2» mơ hồ); AC-6 viết «đúng 115», «đúng 60 (61 bản ghi)» |
| P2 | contract (AC-6) + evals (E6) | Hỏi dãy thấp tầng còn mở nhưng AC-6, E6 ghim kỳ vọng theo khuyến nghị, không có nhánh cho lối khác | Mạnh chọn chỉ cao tầng, E6 đỏ hoặc máy sửa kỳ vọng sau Cổng 1 không qua sổ | Hai nhánh, hoặc ghi rõ chọn lối khác thì mở lại S1 | fixed: Notes của hợp đồng ghi rõ chọn lối khác ở Hỏi-2 hay Hỏi-3 thì máy viết lại AC, eval và trình lại thẻ Cổng Phạm vi trước khi code |
