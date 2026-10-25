---
slug: trang-chu-methodology
at: 2026-10-24T23:05:00Z
verdict: findings
p0: 2
p1: 3
p2: 0
claims_input: ok
---

## Findings

| Sev | Artifact | Thiếu gì | Kịch bản fail | Thước đo | Xử lý |
|---|---|---|---|---|---|
| P0 | design | Sổ ghi lựa chọn «layout marketing không nuốt lỗi DB, để global-error bắt» là một-lối, nhưng lối kia chết vì một nhận định giá trị chứ không vì ràng buộc — đây là đánh đổi giữ điều hướng với nói thật trạng thái | DB sập trên prod: khách mất navbar và chân trang mà Mạnh chưa từng chọn; E10, E11 xanh trên lựa chọn chưa ai duyệt | Đổi dòng sổ thành câu chỉ-người ở Cổng 1, kèm khuyến nghị và lối khác | human-gate1: dòng mới d-20261024T230728Z-11 thay d-…-6 thành Hỏi-2 (khuyến nghị giữ global-error); design doc mục «Câu hỏi cho người»; hình loi-roi-ve-dau đổi nhãn |
| P0 | design | Đích hàng hai nút cuối /methodology (/vn, /yield) và đích nút thẻ thị trường trống (/methodology#nguon) là nghĩa sản phẩm mà sổ ghi máy quyết | E7, E9 ghim chữ và đích trên lựa chọn chưa ai duyệt; đổi ý sau Cổng 1 phải mở lại AC-4, AC-6 [compare-saved-trang-thai#F1] | Ghi thành câu chỉ-người ở Cổng 1, chỉ ghim vào E7/E9 sau khi người chọn | human-gate1: d-20261024T230728Z-12 thay d-…-8 thành Hỏi-3; d-20261024T230728Z-13 thay d-…-5 (Empty một hành động giữ căn cứ ReUI, đích theo Hỏi-3) |
| P1 | evals | Chưa eval nào dựng đúng Given của AC-8 (layout ném lỗi) trên bản build, AC-8 thiếu tag cross-layer | Một ranh giới khác bắt lỗi layout trước global-error, hoặc bản build khác dev → khách thấy trang 500 tiếng Anh trong khi E11 và ảnh dev đều xanh | Smoke bản build với DATABASE_URL trỏ cổng chết, đối chứng dương khi DB sống; gắn cross-layer | fixed: AC-8 gắn (cross-layer); thêm E19 (layer backend-effect, executor script.trang_chu_loi_db_smoke: next build + next start :3462, DB chết → / và /methodology ra trang lỗi toàn cục; đối chứng dương ở dev :3460) |
| P1 | evals | Mặt người nhìn của AC-5, AC-7, AC-8 chỉ nằm trong E16 (khai AC-4); phần navbar/chân trang đứng của AC-7 chỉ đo vị trí tệp; trạng thái Empty không có ảnh | Bước lỗi của E16 hỏng mà AC-7, AC-8 vẫn xanh nhờ E10, E11 cô lập; lỗi trang mất navbar không eval nào đỏ | Tách ui-check theo từng AC, đo quan hệ thứ tự header < alert < footer | fixed: E16 chỉ còn /methodology (AC-4); thêm E20 (AC-5 hero trước/sau), E21 (AC-7, ghi thứ tự DOM header < alert < footer), E22 (AC-8 sáng/tối/375). Empty: deferred — DB local luôn có thị trường, không chụp được; đo ở jsdom (E9), ghi trong Coverage |
| P1 | contract | Ô cơ hội để trống ngưỡng, contract không có Đường đo, sổ không có dòng bỏ có tên [compare-saved-trang-thai#F2] | Cổng Giá trị đọc bảng ngưỡng toàn ô CHƯA ĐO, quyết giữ/sửa/bỏ không có căn cứ | Dòng descope chỉ-người hoặc mục Đường đo | human-gate1: d-20261024T230728Z-14 — Hỏi-4 «bỏ đường đo cho hàng dọn giao diện» (khuyến nghị bỏ) |
