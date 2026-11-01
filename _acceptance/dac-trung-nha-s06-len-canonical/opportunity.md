---
schema_version: 1
slug: dac-trung-nha-s06-len-canonical
feature: Đặc trưng nhà của tin S06 (số nhà, ngang, dài, số tầng, số phòng, số WC, toạ độ, mã căn) lên canonical qua phát biểu trường, có căn cứ
owner: phanlemanh@gmail.com
stage: decided              # discovery | decided | archived
decision: build        # build | iterate | park | kill — người ký Cổng 0 điền
decided_by: Mạnh
decided_at: 2026-10-30T15:00:00Z    # ISO UTC
prototype:
  base_commit:     # điểm cắt nhánh proto khỏi nhánh chính — guard diffBase khi keep
  disposition:     # keep | archive
lo_trinh_ma: HD5
lo_trinh_tep: docs/plan/lo-trinh.json
---

## Vấn đề & ai gặp

Mở từ hàng HD5 của «Lộ trình onehub-invest» (`docs/plan/lo-trinh.json`).
Nguồn: `onehub-invest-tri-thuc:wiki/nen/nen-chung.md#a29a37b46e61d73aa661ebee868f6a753e1d8d52` · `onehub-invest-tri-thuc:wiki/nen/quyet-dinh.md#484c7d45fd05b60e832fdfec32e37e900c5a83b9` · `onehub-invest-tri-thuc:wiki/chu-de/hang-duyet-ghep-can.md#e02a9b3cd0d995c8c8045119584ea278658de6a1` — chưa có trang: trang đợt hang-duyet-3010
Mốc: chưa gắn — việc này chưa thuộc mốc nào của kế hoạch; gắn nó vào một mốc, hoặc ghi vì sao chưa.

Đặc trưng nhà của tin S06 (số nhà, ngang, dài, số tầng, số phòng, số WC, toạ độ, mã căn) lên canonical qua phát biểu trường, có căn cứ

Vì sao: Audit hàng duyệt 30/10 (docs/research/audit-hang-duyet-3010.md §7, Q12): stg S06 có sẵn số nhà, ngang×dài, tầng, phòng cho phần lớn ~6,3 nghìn căn nhưng canonical không có — bộ đánh giá và thẻ không dùng được.

## Ngưỡng chết / ngưỡng UAT

- Câu hỏi phép đo trả lời: [đề xuất] đã đạt «Nạp lại S06: mỗi đặc trưng lên canonical ở ít nhất 95% số tin có trường ấy ở stg; mỗi giá trị có phát biểu với căn cứ; field mới khai RESO-first trong mappings.yaml» chưa?
- Kết quả nào là SỐNG: [đề xuất] Nạp lại S06: mỗi đặc trưng lên canonical ở ít nhất 95% số tin có trường ấy ở stg; mỗi giá trị có phát biểu với căn cứ; field mới khai RESO-first trong mappings.yaml
- Kết quả nào là CHẾT: [đề xuất] chưa đạt «Nạp lại S06: mỗi đặc trưng lên canonical ở ít nhất 95% số tin có trường ấy ở stg; mỗi giá trị có phát biểu với căn cứ; field mới khai RESO-first trong mappings.yaml» khi hết timebox
- Timebox: …
