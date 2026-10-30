---
schema_version: 1
slug: thoi-gian-va-hieu-luc
feature: Mọi phát biểu có observed_at; offer_status (đang chào · hết hạn · đã bán) được phân xử; căn giữ lịch sử giá
owner: phanlemanh@gmail.com
stage: decided              # discovery | decided | archived
decision: build         # build | iterate | park | kill — người ký Cổng 0 điền
decided_by: Mạnh
decided_at: 2026-10-30T04:47:57Z     # ISO UTC
prototype:
  base_commit:     # điểm cắt nhánh proto khỏi nhánh chính — guard diffBase khi keep
  disposition:     # keep | archive
lo_trinh_ma: PL19
lo_trinh_tep: docs/plan/lo-trinh.json
---

## Vấn đề & ai gặp

Mở từ hàng PL19 của «Lộ trình onehub-invest» (`docs/plan/lo-trinh.json`).
Nguồn: `onehub-invest-tri-thuc:wiki/nen/nen-chung.md#a29a37b46e61d73aa661ebee868f6a753e1d8d52` · `onehub-invest-tri-thuc:wiki/nen/quyet-dinh.md#484c7d45fd05b60e832fdfec32e37e900c5a83b9` · `onehub-invest-tri-thuc:wiki/dot/phan-loai-2310.md#207e19a6bf1b5a1b08cf1f0316966df0fa292fa6` — chưa có trang: mã C2.8
Mốc: chưa gắn — việc này chưa thuộc mốc nào của kế hoạch; gắn nó vào một mốc, hoặc ghi vì sao chưa.

Mọi phát biểu có observed_at; offer_status (đang chào · hết hạn · đã bán) được phân xử; căn giữ lịch sử giá

Vì sao: L18: không có mô hình thời gian; FRAMING «còn hiệu lực», B5.

Cổng Đáng: build — Mạnh duyệt «Xếp theo bốn làn» (30/10), LUAT đợt dot0-cam-mau mục «Bốn làn lõi»: làn P2 enrich nền PL16 → PL19.

## Ngưỡng chết / ngưỡng UAT

- Câu hỏi phép đo trả lời: [đề xuất] đã đạt «Tin quá cửa sổ hiệu lực tự về hết hạn; căn tụt B5 về B4» chưa?
- Kết quả nào là SỐNG: [đề xuất] Tin quá cửa sổ hiệu lực tự về hết hạn; căn tụt B5 về B4
- Kết quả nào là CHẾT: [đề xuất] chưa đạt «Tin quá cửa sổ hiệu lực tự về hết hạn; căn tụt B5 về B4» khi hết timebox
- Timebox: …
