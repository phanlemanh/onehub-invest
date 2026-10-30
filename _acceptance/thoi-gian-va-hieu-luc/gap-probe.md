---
slug: thoi-gian-va-hieu-luc
at: 2026-10-30T09:05:00Z
verdict: findings
p0: 2
p1: 2
p2: 1
---

## Findings

| Sev | Artifact | Thiếu gì | Kịch bản fail | Thước đo | Xử lý |
|---|---|---|---|---|---|
| P0 | design | «Căn có lịch sử giá» của B5 là lựa chọn chỉ người có mà máy tự chốt; điền lùi NewListing làm vế này luôn đúng | Vế lịch sử giá của B5 không lọc căn nào trên DB thật trong khi ca fixture vẫn xanh | Thêm Hỏi-3 chi-nguoi; AC-7 theo lối chọn; E8 in số căn bị vế lịch sử loại | human-gate1: Hỏi-3 (khuyến nghị ít nhất hai mốc giá); AC-7, E7, E8 đã sửa |
| P0 | design | Dòng d-6 ghi mot-loi nhưng lối «045 + rút đối nghịch» vẫn sống | Cổng 1 duyệt như máy quyết một luật phân xử riêng, lệch PL15; observed mới thắng fact cũ mà chưa ai chọn | Viết lại d-6 thành chi-nguoi; AC-5 thêm ca observed mới vs fact cũ | human-gate1: Hỏi-4 thay d-6 (khuyến nghị mới nhất thắng); AC-5, E5 đã thêm ca |
| P1 | design + evals | Không định observed_at của phát biểu active; quan hệ tin nghỉ → withdrawn chỉ đo từng nửa | Ghi active bằng now() thì withdrawn (retired_at sớm hơn) thua, tin đã gỡ vẫn đang chào | Luật observed_at = last_seen; ca đầu–cuối có chiều đỏ now(); E8 so withdrawn với het_trong_luot | fixed: design §2 luật observed_at; AC-4, E4 ca đầu–cuối + chiều đỏ; E8 dòng đối chiếu withdrawn |
| P1 | contract | Đường đo cắt vế «tự về hết hạn» của ngưỡng; vế hạ bậc trên dữ liệu thật không có eval đọc ảnh chụp | Ngưỡng SỐNG không bao giờ đạt nếu Hỏi-1 theo khuyến nghị; hạ bậc chỉ có bằng chứng fixture | Trích nguyên văn; ngưỡng opportunity sửa theo Hỏi-1; eval ảnh chụp B5 −1 B4 +1 | fixed: Đường đo trích nguyên văn và nêu phụ thuộc Hỏi-1; AC-7, E7 thêm ảnh chụp trước/sau |
| P2 | contract | AC-7 chỉ có căn một tin, không định lượng từ «có tin đạt» hay «mọi tin đạt» | Hai bản cài đặt đều qua E7; phân bố bậc lệch trên căn nhiều tin | Thêm hai ô căn hai tin, chiều đỏ lượng từ ngược | fixed: AC-7, E7 thêm hai ô căn hai tin, căn lấy tin tốt nhất như PL16, chiều đỏ «mọi tin» |
