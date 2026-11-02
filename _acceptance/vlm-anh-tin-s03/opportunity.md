---
schema_version: 1
slug: vlm-anh-tin-s03
feature: VLM đọc ảnh tin S03 cho bài mà chữ không đủ (thiếu giá, thiếu dấu hiệu BĐS, thiếu loại hình) và ghi thêm vào bảng nhãn bạc với nguồn «ảnh» — ảnh tải về máy trước, gửi base64, không kèm tầng A
owner: phanlemanh@gmail.com
stage: decided                # discovery | decided | archived
decision: build         # build | iterate | park | kill — người ký Cổng 0 điền
decided_by: Mạnh 02/11 «Đồng ý theo khuyến nghị», nói rõ thêm «Đồng ý với U1 làm» (U1-86, giám sát chuyển lời): làm với ngưỡng U1 đề xuất
decided_at: 2026-11-01T22:09:34Z     # ISO UTC
prototype:
  base_commit:     # điểm cắt nhánh proto khỏi nhánh chính — guard diffBase khi keep
  disposition:     # keep | archive
lo_trinh_ma: KC3
lo_trinh_tep: docs/plan/lo-trinh.json
---

## Vấn đề & ai gặp

Mở từ hàng KC3 của «Lộ trình onehub-invest» (`docs/plan/lo-trinh.json`).
Nguồn: `onehub-invest-tri-thuc:wiki/nen/nen-chung.md#a29a37b46e61d73aa661ebee868f6a753e1d8d52` · `onehub-invest-tri-thuc:wiki/nen/quyet-dinh.md#484c7d45fd05b60e832fdfec32e37e900c5a83b9` — chưa có trang: trang đợt kev-chung-cat-3110, mã KC3
Mốc: chưa gắn — việc này chưa thuộc mốc nào của kế hoạch; gắn nó vào một mốc, hoặc ghi vì sao chưa.

VLM đọc ảnh tin S03 cho bài mà chữ không đủ (thiếu giá, thiếu dấu hiệu BĐS, thiếu loại hình) và ghi thêm vào bảng nhãn bạc với nguồn «ảnh» — ảnh tải về máy trước, gửi base64, không kèm tầng A

Vì sao: 20.292/39.367 bài S03 có ảnh (DB 31/10); mô phỏng RM1 còn ~16.000 bài chữ thiếu giá hay dấu hiệu BĐS — ảnh rao thường chứa giá, số phòng, mã căn. Mạnh chốt đo Haiku 5.5 và Decisions API 31/10.

## Ngưỡng chết / ngưỡng UAT

- Câu hỏi phép đo trả lời: đã đạt «Trên một mẫu bài có ảnh đã gắn tay: Haiku 5.5 hoặc Decisions API đọc đúng giá/loại hình ≥ 90%; số bài «chữ không đủ» có nhãn bạc tăng; 0 URL zdn hết hạn bị gửi» chưa?
- Kết quả nào là SỐNG: Trên một mẫu bài có ảnh đã gắn tay: Haiku 5.5 hoặc Decisions API đọc đúng giá/loại hình ≥ 90%; số bài «chữ không đủ» có nhãn bạc tăng; 0 URL zdn hết hạn bị gửi
- Kết quả nào là CHẾT: chưa đạt «Trên một mẫu bài có ảnh đã gắn tay: Haiku 5.5 hoặc Decisions API đọc đúng giá/loại hình ≥ 90%; số bài «chữ không đủ» có nhãn bạc tăng; 0 URL zdn hết hạn bị gửi» khi hết timebox
- Ngưỡng đề xuất thay (máy đề xuất 02/11 theo lời Mạnh «Sửa theo bốn đề xuất», chỉ có hiệu lực khi Mạnh duyệt Hỏi-3 và Hỏi-6 ở Cổng Phạm vi, trước khi có số): đo trên mẫu ảnh khác nhau đã gắn tay; Qwen local, Haiku 5.5 hoặc DeepSeek V4.1 Flash 1017 đạt khi một model đọc đúng ≥ 90% cả giá lẫn loại hình; hai vế còn lại giữ nguyên.
- Timebox: 7 ngày từ khi Mạnh duyệt Cổng Phạm vi; quá hạn chưa có phiếu gắn tay thì báo giám sát (máy đề xuất 02/11, Mạnh sửa được ở Cổng Phạm vi)
