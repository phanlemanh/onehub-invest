---
schema_version: 1
slug: ci-test-module
feature: CI chạy typecheck và test của app, pipeline, agent, data-api trên mọi PR
owner: phanlemanh@gmail.com
stage: discovery              # discovery | decided | archived
decision:         # build | iterate | park | kill — người ký Cổng 0 điền
decided_by: 
decided_at:     # ISO UTC
prototype:
  base_commit:     # điểm cắt nhánh proto khỏi nhánh chính — guard diffBase khi keep
  disposition:     # keep | archive
lo_trinh_ma: AU11
lo_trinh_tep: docs/plan/lo-trinh.json
---

## Vấn đề & ai gặp

Mở từ hàng AU11 của «Lộ trình onehub-invest» (`docs/plan/lo-trinh.json`).
Mốc: chưa gắn — việc này chưa thuộc mốc nào của kế hoạch; gắn nó vào một mốc, hoặc ghi vì sao chưa.

CI chạy typecheck và test của app, pipeline, agent, data-api trên mọi PR

Vì sao: Audit P21: CI chỉ có gate và ui-lint.

## Ngưỡng chết / ngưỡng UAT

- Câu hỏi phép đo trả lời: [đề xuất] đã đạt «Cấy một lỗi kiểu ở mỗi module: CI đỏ đúng job» chưa?
- Kết quả nào là SỐNG: [đề xuất] Cấy một lỗi kiểu ở mỗi module: CI đỏ đúng job
- Kết quả nào là CHẾT: [đề xuất] chưa đạt «Cấy một lỗi kiểu ở mỗi module: CI đỏ đúng job» khi hết timebox
- Timebox: …
