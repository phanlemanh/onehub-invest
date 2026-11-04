---
slug: sdt-s06-khoi-phuc-xuat-xu
at: 2026-11-03T15:20:00Z
verdict: findings
p0: 3
p1: 1
p2: 1
---

## Findings

| Sev | Artifact | Thiếu gì | Kịch bản fail | Thước đo | Xử lý |
|---|---|---|---|---|---|
| P0 | contract | Giới hạn nằm trong design, không lên hợp đồng; thiếu trục stg đổi trong lúc bị ghi đè | Tin nguồn đổi số trong lúc hàm bị ghi đè: số cũ không khớp stg, tin ẩn giữ số ghép mà mọi eval xanh, Mạnh ký với hiểu biết sai | Mục giới hạn trên hợp đồng; AC đo ca stg đổi | fixed: thêm mục G1–G4, AC-10, E11, trục Coverage, sửa tên tính năng, Hỏi-1 nêu đủ giá. Phần #294: rejected, dòng của #294 nằm sau hai nhánh ẩn số nên tin ẩn vẫn bị rút (đọc diff `origin/claude/sdt-s06-danh-ba`), ghi vào Notes |
| P0 | contract | Dòng sổ về cột riêng trích câu không quyết lựa chọn; lối ba chưa lên thẻ [s06-duong-du-an-len-tin#F1] | Mạnh tưởng chỉ có hai lối, máy đã tự chốt kiến trúc dài hạn | Mọi lối trong bảng so sánh có mặt trên thẻ | fixed: Hỏi-2 dòng `chi-nguoi` thay dòng cũ; design sửa thành «chưa chết mà đắt» |
| P0 | contract | Ghi đè đo bằng bản hàm của bộ test, không round-trip từ tệp migration [guard-edits-goc-theo-tep#F2] | Migration thật mất khoá khác bản test: eval xanh mà sự cố thật không tái hiện | Lấy định nghĩa từ tệp migration trước 068 | fixed: dùng phần hàm trích từ tệp 061 đã commit; dòng sổ thay thế; AC-1, E1 sửa |
| P1 | evals | Vế `--thu` của AC-8 chạy trên DB không có tin mang số; chiều đỏ không đo đầu ra này; thiếu hai dạng số | `--thu` in cứng số 0 hay lộ số khi có tin khôi phục mà E8b vẫn xanh | Đo dòng in trên fixture, đỏ riêng từng dạng | fixed: `dongGan` dùng chung, E8a đo trên fixture với hai ca đỏ; E8b khai chỉ đo sự có mặt; design sửa khớp |
| P2 | evals | E4 thiếu vế `tu_tin` và tổng số đếm; E5 không chuyển trạng thái | `tu_tin` trỏ sai tin hoặc tin khoá lạ bị rút khi ẩn số mà eval xanh | Truy vấn quan hệ, tổng 12 và 14, hai bước When | fixed: AC-4, AC-5, E4, E5 sửa |
