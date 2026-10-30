---
schema_version: 1
slug: de-xuat-thanh-phat-bieu-bac
feature: Đề xuất enrich cũ và quyết định người thành phát biểu; mỗi căn có bậc B0–B5 tính được
owner: phanlemanh@gmail.com
stage: decided              # discovery | decided | archived
decision: build         # build | iterate | park | kill — người ký Cổng 0 điền
decided_by: Mạnh
decided_at: 2026-10-30T04:47:57Z     # ISO UTC
prototype:
  base_commit:     # điểm cắt nhánh proto khỏi nhánh chính — guard diffBase khi keep
  disposition:     # keep | archive
lo_trinh_ma: PL16
lo_trinh_tep: docs/plan/lo-trinh.json
---

## Vấn đề & ai gặp

Mở từ hàng PL16 của «Lộ trình onehub-invest» (`docs/plan/lo-trinh.json`).
Nguồn: `onehub-invest-tri-thuc:wiki/nen/nen-chung.md#a29a37b46e61d73aa661ebee868f6a753e1d8d52` · `onehub-invest-tri-thuc:wiki/nen/quyet-dinh.md#484c7d45fd05b60e832fdfec32e37e900c5a83b9` · `onehub-invest-tri-thuc:wiki/dot/phan-loai-2310.md#207e19a6bf1b5a1b08cf1f0316966df0fa292fa6` — chưa có trang: mã C2.3
Mốc: chưa gắn — việc này chưa thuộc mốc nào của kế hoạch; gắn nó vào một mốc, hoặc ghi vì sao chưa.

Đề xuất enrich cũ và quyết định người thành phát biểu; mỗi căn có bậc B0–B5 tính được

Vì sao: C2.3 + thang bậc FRAMING §3.4.

Cổng Đáng: build — Mạnh duyệt «Xếp theo bốn làn» (30/10), LUAT đợt dot0-cam-mau mục «Bốn làn lõi»: làn P2 enrich nền PL16 → PL19.

## Ngưỡng chết / ngưỡng UAT

- Câu hỏi phép đo trả lời: [đề xuất] đã đạt «Mọi đề xuất cũ có phát biểu tương ứng; phân bố bậc in ra được theo phân khúc» chưa?
- Kết quả nào là SỐNG: [đề xuất] Mọi đề xuất cũ có phát biểu tương ứng; phân bố bậc in ra được theo phân khúc
- Kết quả nào là CHẾT: [đề xuất] chưa đạt «Mọi đề xuất cũ có phát biểu tương ứng; phân bố bậc in ra được theo phân khúc» khi hết timebox
- Timebox: …
