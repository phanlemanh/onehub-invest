---
schema_version: 1
slug: ops-nhan-ma-nguon
feature: Người vận hành đọc /ops/collections và /ops/quality chỉ thấy mã S0x kèm vai trò, không tên nguồn thật — kể cả nhãn job đẩy từ máy thu
owner: phanlemanh@gmail.com
stage: decided              # discovery | decided | archived
decision: build           # Mạnh 24/10 ở phiên giám sát dot0: «Duyệt, mở» — mở dãy chạy chuỗi AU13 → ON7 → NT2 → ON22 (ADR-0014)
decided_by: Mạnh
decided_at: 2026-10-24T04:43:02Z
prototype:
  base_commit:     # điểm cắt nhánh proto khỏi nhánh chính — guard diffBase khi keep
  disposition:     # keep | archive
lo_trinh_ma: ON7
lo_trinh_tep: docs/plan/lo-trinh.json
---

## Vấn đề & ai gặp

Mở từ hàng ON7 của «Lộ trình onehub-invest» (`docs/plan/lo-trinh.json`).
Mốc: chưa gắn — việc này chưa thuộc mốc nào của kế hoạch; gắn nó vào một mốc, hoặc ghi vì sao chưa.

Người vận hành đọc /ops/collections và /ops/quality chỉ thấy mã S0x kèm vai trò, không tên nguồn thật — kể cả nhãn job đẩy từ máy thu

Vì sao: OPS-13 + Mạnh 24/10 Câu 2: giữ luật tên nguồn thật là tầng A — tên thật chỉ ở local (/ops/sources). Nhãn cứng ở components/ops/collections/*, /ops/quality, nhãn job ở push-ops-facts.mjs và readSchedulerStatus. Gốc G5.

## Ngưỡng chết / ngưỡng UAT

- Câu hỏi phép đo trả lời: [đề xuất] đã đạt «Quét tĩnh app/src/components/ops/** (trừ sources/), app/src/app/ops/quality và payload facts: 0 tên nguồn thật; nhãn dạng «S02 · hiệu chuẩn»» chưa?
- Kết quả nào là SỐNG: [đề xuất] Quét tĩnh app/src/components/ops/** (trừ sources/), app/src/app/ops/quality và payload facts: 0 tên nguồn thật; nhãn dạng «S02 · hiệu chuẩn»
- Kết quả nào là CHẾT: [đề xuất] chưa đạt «Quét tĩnh app/src/components/ops/** (trừ sources/), app/src/app/ops/quality và payload facts: 0 tên nguồn thật; nhãn dạng «S02 · hiệu chuẩn»» khi hết timebox
- Timebox: …
