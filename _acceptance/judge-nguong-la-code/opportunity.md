---
schema_version: 1
slug: judge-nguong-la-code
feature: judge-entity áp ngưỡng bằng code, LLM chỉ giải thích; mọi lần chấm lưu model và trace; ứng viên sinh thẻ ghép căn
owner: phanlemanh@gmail.com
stage: decided                # discovery | decided | archived
decision: build   # Cổng Đáng — Mạnh duyệt «Xếp theo bốn làn» (nhật ký đợt dot0-cam-mau 2026-10-30T04:47:57Z)
decided_by: Mạnh
decided_at: 2026-10-30T04:47:57Z
prototype:
  base_commit:     # điểm cắt nhánh proto khỏi nhánh chính — guard diffBase khi keep
  disposition:     # keep | archive
lo_trinh_ma: PL25
lo_trinh_tep: docs/plan/lo-trinh.json
---

## Vấn đề & ai gặp

Mở từ hàng PL25 của «Lộ trình onehub-invest» (`docs/plan/lo-trinh.json`).
Nguồn: `onehub-invest-tri-thuc:wiki/nen/nen-chung.md#a29a37b46e61d73aa661ebee868f6a753e1d8d52` · `onehub-invest-tri-thuc:wiki/nen/quyet-dinh.md#484c7d45fd05b60e832fdfec32e37e900c5a83b9` · `onehub-invest-tri-thuc:wiki/dot/phan-loai-2310.md#207e19a6bf1b5a1b08cf1f0316966df0fa292fa6` — chưa có trang: mã C3.2b
Mốc: chưa gắn — việc này chưa thuộc mốc nào của kế hoạch; gắn nó vào một mốc, hoặc ghi vì sao chưa.

judge-entity áp ngưỡng bằng code, LLM chỉ giải thích; mọi lần chấm lưu model và trace; ứng viên sinh thẻ ghép căn

Vì sao: L14: luật xác định nằm trong prompt; 134 cặp needs_llm không có thẻ.

## Ngưỡng chết / ngưỡng UAT

- Câu hỏi phép đo trả lời: [đề xuất] đã đạt «Mọi ứng viên needs_llm có thẻ; không prompt nào chứa ngưỡng số» chưa?
- Kết quả nào là SỐNG: [đề xuất] Mọi ứng viên needs_llm có thẻ; không prompt nào chứa ngưỡng số
- Kết quả nào là CHẾT: [đề xuất] chưa đạt «Mọi ứng viên needs_llm có thẻ; không prompt nào chứa ngưỡng số» khi hết timebox
- Timebox: …
