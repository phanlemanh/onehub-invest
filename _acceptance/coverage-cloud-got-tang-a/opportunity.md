---
schema_version: 1
slug: coverage-cloud-got-tang-a
feature: /api/v1/ops/coverage trên cloud trả độ tươi từng nguồn S0x từ khối độ tươi máy local đẩy lên (ADR-0014), không trường nào chứa tên nguồn thật
owner: phanlemanh@gmail.com
stage: decided              # discovery | decided | archived
decision: build        # build | iterate | park | kill — người ký Cổng 0 điền
decided_by: Mạnh
decided_at: 2026-10-24T10:20:11Z     # ISO UTC — «Cổng Đáng các hàng này = build» (LUAT đợt dot0-cam-mau dòng 172; giám sát trả P2-50)
prototype:
  base_commit:     # điểm cắt nhánh proto khỏi nhánh chính — guard diffBase khi keep
  disposition:     # keep | archive
lo_trinh_ma: AU12
lo_trinh_tep: docs/plan/lo-trinh.json
---

## Vấn đề & ai gặp

Mở từ hàng AU12 của «Lộ trình onehub-invest» (`docs/plan/lo-trinh.json`).
Mốc: chưa gắn — việc này chưa thuộc mốc nào của kế hoạch; gắn nó vào một mốc, hoặc ghi vì sao chưa.

/api/v1/ops/coverage trên cloud trả độ tươi từng nguồn S0x từ khối độ tươi máy local đẩy lên (ADR-0014), không trường nào chứa tên nguồn thật

Vì sao: Audit P2: coverage cloud 500 vì source_registry có cột tầng A.

## Ngưỡng chết / ngưỡng UAT

- Câu hỏi phép đo trả lời: [đề xuất] đã đạt «Gọi bằng token ops: 200, không trường nào chứa tên nguồn thật» chưa?
- Kết quả nào là SỐNG: [đề xuất] Gọi bằng token ops: 200, không trường nào chứa tên nguồn thật
- Kết quả nào là CHẾT: [đề xuất] chưa đạt «Gọi bằng token ops: 200, không trường nào chứa tên nguồn thật» khi hết timebox
- Timebox: …
