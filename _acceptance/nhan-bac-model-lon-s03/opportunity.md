---
schema_version: 1
slug: nhan-bac-model-lon-s03
feature: "Lệnh nhãn bạc: model lớn đọc mọi bài S03 và ghi ý định tin, bán/thuê, xác suất và câu trích nguyên văn vào bảng nhãn bạc riêng (mỗi dòng ghi model đã gắn) — không ghi dữ liệu canonical"
owner: phanlemanh@gmail.com
stage: discovery              # discovery | decided | archived
decision:         # build | iterate | park | kill — người ký Cổng 0 điền
decided_by: 
decided_at:     # ISO UTC
prototype:
  base_commit:     # điểm cắt nhánh proto khỏi nhánh chính — guard diffBase khi keep
  disposition:     # keep | archive
lo_trinh_ma: KC1
lo_trinh_tep: docs/plan/lo-trinh.json
---

## Vấn đề & ai gặp

Mở từ hàng KC1 của «Lộ trình onehub-invest» (`docs/plan/lo-trinh.json`).
Nguồn: `onehub-invest-tri-thuc:wiki/nen/nen-chung.md#a29a37b46e61d73aa661ebee868f6a753e1d8d52` · `onehub-invest-tri-thuc:wiki/nen/quyet-dinh.md#484c7d45fd05b60e832fdfec32e37e900c5a83b9` — chưa có trang: trang đợt kev-chung-cat-3110, mã KC1
Mốc: chưa gắn — việc này chưa thuộc mốc nào của kế hoạch; gắn nó vào một mốc, hoặc ghi vì sao chưa.

Lệnh nhãn bạc: model lớn đọc mọi bài S03 và ghi ý định tin, bán/thuê, xác suất và câu trích nguyên văn vào bảng nhãn bạc riêng (mỗi dòng ghi model đã gắn) — không ghi dữ liệu canonical

Vì sao: Mạnh 31/10: dùng một model lớn vừa phân loại vừa gắn nhãn để cải thiện Kev. Qwen 27B local đạt 95% trên 61 bài (s03-boc-tach-cau-truc-3010 §8.2); nhãn bạc là dữ liệu huấn luyện cho KC2 và đề xuất cho PL5.

## Ngưỡng chết / ngưỡng UAT

- Câu hỏi phép đo trả lời: [đề xuất] đã đạt «Đo trên mẫu 61 bài đã gắn tay: Claude Haiku 5.5 và OpenAI Decisions API so với Qwen 27B local (ý định 98%, bán/thuê 97%); bên cloud đạt ≥ 95% và rẻ hơn chạy hết bài cũ, Qwen local chạy hằng ngày; câu trích giả bị loại bằng so chuỗi; 0 dòng ghi vào sale_offers» chưa?
- Kết quả nào là SỐNG: [đề xuất] Đo trên mẫu 61 bài đã gắn tay: Claude Haiku 5.5 và OpenAI Decisions API so với Qwen 27B local (ý định 98%, bán/thuê 97%); bên cloud đạt ≥ 95% và rẻ hơn chạy hết bài cũ, Qwen local chạy hằng ngày; câu trích giả bị loại bằng so chuỗi; 0 dòng ghi vào sale_offers
- Kết quả nào là CHẾT: [đề xuất] chưa đạt «Đo trên mẫu 61 bài đã gắn tay: Claude Haiku 5.5 và OpenAI Decisions API so với Qwen 27B local (ý định 98%, bán/thuê 97%); bên cloud đạt ≥ 95% và rẻ hơn chạy hết bài cũ, Qwen local chạy hằng ngày; câu trích giả bị loại bằng so chuỗi; 0 dòng ghi vào sale_offers» khi hết timebox
- Timebox: …
