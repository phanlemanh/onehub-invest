---
slug: db-volume-live-ban-lui
at: 2026-10-29T10:45:00Z
verdict: findings
p0: 2
p1: 3
p2: 0
---

## Findings

| Sev | Artifact | Thiếu gì | Kịch bản fail | Thước đo | Xử lý |
|---|---|---|---|---|---|
| P0 | design | Dòng sổ d-2 ghi nguồn mục-tiêu nhưng câu trích không chọn giữa «vắng bản lùi luôn xanh» và «vẫn đòi trong hạn giữ, qua hạn mới thôi» | Bản lùi bị xoá nhầm 31/10 trước hạn giữ; live in PASS không còn bản lùi, không ai biết mất đường lùi | Dòng sổ mới nguồn chỉ-người đưa Mạnh chọn ở Cổng Phạm vi; chọn b thì thêm hai ô vắng trước/sau hạn | human-gate1: Hỏi-1 (dòng thay d-2), nháp theo khuyến nghị b — design, AC-1, E1 có trục hạn giữ |
| P0 | evals | Ô «vắng» chỉ cho bộ chấm ăn mảng rỗng viết tay; đường gom thật của live_doc không chạy với 0 hay nhiều container | Sau khi xoá bản lùi, live_doc gọi docker inspect với danh sách rỗng, lỗi; E1 vẫn xanh vì chỉ đo bộ chấm | Ô round-trip qua docker thật: mẫu không khớp → mảng rỗng exit 0; mẫu khớp → đủ phần tử | fixed: hàm gom_ban_lui + hai ô round-trip (design, AC-4, E4) |
| P1 | evals | «MỌI bản lùi» chỉ đo ở một vị trí (bản nhỏ running); thiếu bản lớn running và đối chứng dương hai bản đều đúng | Cài sai chỉ soi phần tử đầu, hay «từ hai bản là FAIL», vẫn qua 10 ô | Thêm hai ô mỗi hàng, ma trận 16 ô | fixed: 16 ô (design, AC-3, E3, E4 đếm đủ 16) |
| P1 | contract | AC-4/E4 ghim tên bản lùi one-invest-db-cu-20261029 vào expected | Sau khi xoá bản lùi, E4 của chính hồ sơ này đỏ mãi — lặp đúng lỗi Ngoài-4 | Expected theo trạng thái lúc chạy, không ghim tên | fixed: AC-4, E4 |
| P1 | evals | AC-5 hứa làn ghim lại của db-vao-volume xanh mà không eval nào đo; E5/E6 trỏ «như hồ sơ …» thay vì ghim đầu ra | Đổi chữ/chiều ca vắng làm hồ sơ đã ký lùi mà E5–E7 vẫn xanh | Eval đo lượt ghim lại của db-vao-volume; ghim dòng đầu ra vào E5/E6 | fixed: E8 (judgment trên run-log + evidence-report của db-vao-volume sau lượt ghim lại ở S3); E5/E6 ghim dòng thật |
