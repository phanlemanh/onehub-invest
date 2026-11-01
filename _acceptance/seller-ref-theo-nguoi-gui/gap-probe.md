---
slug: seller-ref-theo-nguoi-gui
at: 2026-11-01T09:10:00Z
verdict: findings
p0: 1
p1: 3
p2: 1
---

## Findings

| Sev | Artifact | Thiếu gì | Kịch bản fail | Thước đo | Xử lý |
|---|---|---|---|---|---|
| P0 | contract | Dòng sổ d-5 (không sửa sync-cloud, giữ T2) ghi nguồn mục-tiêu nhưng câu trích audit chỉ mô tả hai lối, không quyết; hạ T3 xuống T2 là lựa chọn phạm vi | Cổng 1 duyệt OOS-1 tưởng đã có căn cứ trong khi máy tự hạ hạng; tin S05 người gửi đuôi không số lên cloud NULL mà không ai có quyền chấp nhận | Dòng thay d-5 trích câu loại sync-cloud khỏi hàng (vùng hàng HD4 ở lo-trinh.json) hoặc thành câu hỏi kho_dao, kèm số tin S05 NULL | fixed: dòng d-20261101T083327Z-13 thay d-5 (qua d-10): audit đặt sync-cloud.mjs vào vùng chỉ khi đổi cách che, lượt cắt đã duyệt chọn nhánh không đổi (hàng HD4 hạng T2, vùng chỉ có hai transform); số đo 7/100 bài S05 đuôi không số; thước in số tin S05 NULL trên cloud |
| P1 | design | Không nêu bên đọc «tin cùng người đăng»; không AC đo đầu ra mà lời hứa nhắm tới | Có bên đọc ngoài vùng thì E1–E8 xanh mà H15 còn; không có bên đọc thì Cổng 1 duyệt lời hứa không bên nhận | Nêu đích danh bên đọc + AC; hoặc dòng sổ ghi kết quả quét bên đọc | fixed: quét git grep seller_ref trên agent, app, data-api, scripts, db — chỉ sổ từ vựng sinh và migration 022; dòng sổ d-20261101T*-12 ghi đích là cột canonical (vai nen, Bật khi ở AC-7); thêm OOS-6 |
| P1 | evals | E8 so bảy cột viết tay, không so mọi cột trừ danh sách loại | Cột khác đọc authorHash đổi theo mà E8 vẫn báo 0 ô khác | So mọi cột từ information_schema trừ seller_ref + mốc giờ ghi; đối chứng đổi cột ngoài bảy cột cũ | fixed: AC-8 và E8 so mọi cột đọc từ information_schema trừ seller_ref và mốc giờ ghi khai cứng, in số cột; đối chứng đổi n_reposts |
| P1 | evals | Không đo lời hứa nạp đêm ghi đè giá trị hằng; E7 không nói có xoá tin cũ trước lượt | Thước xoá rồi dựng lại nên xanh, máy thu thật tin cũ giữ hằng | E7 giữ nguyên sale_offers hiện có, gọi đúng lối đêm, đếm tin còn hằng cũ = 0 | fixed: AC-7 và E7 giữ nguyên tin đang có, gọi runTransformZalo/runTransformFb, đếm tin sống còn seller_ref hằng cũ = 0, in số được ghi đè |
| P2 | contract | Dòng d-3 ngụ ý seller_phone và seller_ref cùng người; hai luật chọn khác nhau | Tin ba bài: SĐT của Y cạnh mã của X | Sửa chữ d-3 + design, hoặc AC khoá quan hệ | fixed: dòng d-20261101T*-11 thay d-3 nói rõ hai cột có thể thuộc hai người; thêm OOS-5 |
