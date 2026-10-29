---
schema_version: 1
slug: so-cuoc-goi-ai
feature: Người vận hành mở /ops và thấy chi phí, token, độ trễ của mọi cuộc gọi AI theo việc, model và ngày
owner: phanlemanh@gmail.com
stage: decided              # discovery | decided | archived
decision: build         # build | iterate | park | kill — người ký Cổng 0 điền
decided_by: giám sát đợt dieu-phoi-dot0-cam-mau (P4-73, theo kế hoạch đợt Mạnh đã duyệt ở thẻ khởi tạo)
decided_at: 2026-10-29T10:51:56Z     # ISO UTC
prototype:
  base_commit:     # điểm cắt nhánh proto khỏi nhánh chính — guard diffBase khi keep
  disposition:     # keep | archive
lo_trinh_ma: PL29
lo_trinh_tep: docs/plan/lo-trinh.json
---

## Vấn đề & ai gặp

Mở từ hàng PL29 của «Lộ trình onehub-invest» (`docs/plan/lo-trinh.json`).
Nguồn: `onehub-invest-tri-thuc:wiki/nen/nen-chung.md#a29a37b46e61d73aa661ebee868f6a753e1d8d52` · `onehub-invest-tri-thuc:wiki/nen/quyet-dinh.md#484c7d45fd05b60e832fdfec32e37e900c5a83b9` · `onehub-invest-tri-thuc:wiki/dot/phan-loai-2310.md#207e19a6bf1b5a1b08cf1f0316966df0fa292fa6` — chưa có trang: mã CM.1
Mốc: chưa gắn — việc này chưa thuộc mốc nào của kế hoạch; gắn nó vào một mốc, hoặc ghi vì sao chưa.

Người vận hành mở /ops và thấy chi phí, token, độ trễ của mọi cuộc gọi AI theo việc, model và ngày

Vì sao: D6/§0.4: Qwen chậm và chưa đo độ đúng; cần biết chi phí trước khi đổi model.

## Ngưỡng chết / ngưỡng UAT

- Câu hỏi phép đo trả lời: sổ cuộc gọi AI có ghi đủ mọi lượt agent runtime, với token đúng, để chọn model theo số đo?
- Kết quả nào là SỐNG: sau 7 ngày, mỗi việc đã chạy (judge-entity, enrich-text) có dòng trên /ops/ai-calls; số lượt và tổng token theo việc × ngày khớp trace (lệnh doi-chieu.mjs, lệch 0).
- Kết quả nào là CHẾT: có việc đã chạy mà trang không có dòng, hoặc lệch số lượt/token so với trace.
- Timebox: 7 ngày sau khi gộp và áp 052 lên DB local. (Ngưỡng do máy đề xuất — Hỏi-4 chờ Mạnh ở Cổng Phạm vi.)
