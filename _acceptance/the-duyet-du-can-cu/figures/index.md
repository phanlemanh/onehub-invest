# Hình tại điểm quyết định — the-duyet-du-can-cu

| Điểm | Đếm | Hình |
|---|---|---|
| Hỏi-1 ảnh tin tới vai nào | ba nhánh rẽ theo vai (quản trị · Vận hành · viewer) × hai loại ảnh | anh-theo-vai |
| Hỏi-2 lý do bắt buộc + ghi cùng giao dịch | năm bước nối tiếp (gõ → bấm → kiểm → ghi → COMMIT/ROLLBACK) | quyet-kem-ly-do |
| Hỏi-3 ngưỡng nghiệm thu | dưới ngưỡng: 1 câu, ba vế song song không nối bước | — |
| Phạm vi PL3 ↔ PL23 (d-…-2, d-…-3) | dưới ngưỡng: 1 ranh giới, hai phía | — |
| Các dòng máy quyết còn lại (căn cứ từ field_provenance, bỏ Điểm B, ai_suggestion NULL, không sửa evidence cũ, không migration, design-pass) | dưới ngưỡng: mỗi dòng 1 bước | — |

## Đề bài

### anh-theo-vai

- Loại: sơ đồ rẽ nhánh (disposition map), trái → phải.
- Nút: «Ảnh của một tin» (bảng `media` ở máy thu) → hai loại: «Ảnh đã tải về máy thu (local_file)» và «Chỉ có URL gốc (mang
  tên miền nguồn — tầng A)» → ba vai: «Quản trị viên», «Vận hành», «Viewer».
- Nhãn kết quả: Quản trị: thấy cả hai · Vận hành: thấy ảnh đã tải; ảnh chỉ có URL gốc thành câu «N ảnh chỉ có ở nguồn — quản
  trị viên xem được» · Viewer: không thấy ảnh (chỉ số thẻ chờ).
- Đánh dấu «khuyến nghị (Hỏi-1)» trên nhánh Vận hành; ghi chú nhỏ: hôm nay chỉ quản trị viên thấy ảnh.
- AC liên quan: AC-4, AC-9.

### quyet-kem-ly-do

- Loại: luồng (flowchart), trên → dưới, một nhánh lỗi.
- Nút: «Người duyệt gõ Lý do» → «Bấm quyết (nút tắt khi trống)» → «Route kiểm lý do (thiếu/trắng/> 1.000 ký tự → 400, không
  đổi gì)» → «MỘT transaction: review_queue.status + decision_note · bảng đích (property_candidates / enrichment_proposals) ·
  ops_audit review.decide có ly_do» → «COMMIT».
- Nhánh lỗi: «INSERT ops_audit hỏng» → «ROLLBACK: thẻ vẫn chờ, decision_note trống, 500».
- Ghi chú bên: Hỏi-2 — bắt buộc cho MỌI quyết định (khuyến nghị) hay chỉ khi bác/hoãn.
- AC liên quan: AC-7, AC-8.
