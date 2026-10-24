---
schema_version: 1
slug: mcp-tools-theo-so-be-mat
feature: "Bản khai công cụ app/docs/api/mcp-tools.json khớp sổ bề mặt API: công cụ tin rao đòi bearer ops hoặc bị gỡ, không công cụ nào ghi «public» trái sổ"
owner: phanlemanh@gmail.com
stage: decided                # discovery | decided | archived
decision: build         # build | iterate | park | kill — người ký Cổng 0 điền
decided_by: giám sát đợt dot0-cam-mau (P4-8) theo lệnh Mạnh 24/10
decided_at: 2026-10-24T10:21:56Z   # ISO UTC
prototype:
  base_commit:     # điểm cắt nhánh proto khỏi nhánh chính — guard diffBase khi keep
  disposition:     # keep | archive
lo_trinh_ma: ON15
lo_trinh_tep: docs/plan/lo-trinh.json
---

## Vấn đề & ai gặp

Mở từ hàng ON15 của «Lộ trình onehub-invest» (`docs/plan/lo-trinh.json`).
Mốc: chưa gắn — việc này chưa thuộc mốc nào của kế hoạch; gắn nó vào một mốc, hoặc ghi vì sao chưa.

Bản khai công cụ app/docs/api/mcp-tools.json khớp sổ bề mặt API: công cụ tin rao đòi bearer ops hoặc bị gỡ, không công cụ nào ghi «public» trái sổ

Vì sao: YC3 — NT4 Ngoài-6 (Mạnh chọn mở hợp đồng mới 23/10): oneinvest_get_offers khai công khai, «auth: public», trong khi /api/v1/offers đã đóng theo sổ bề mặt.

## Ngưỡng chết / ngưỡng UAT

- Câu hỏi phép đo trả lời: [đề xuất] đã đạt «Test so từng tool trong mcp-tools.json với sổ bề mặt: lệch chế độ một tool → đỏ; bản hiện tại xanh» chưa?
- Kết quả nào là SỐNG: [đề xuất] Test so từng tool trong mcp-tools.json với sổ bề mặt: lệch chế độ một tool → đỏ; bản hiện tại xanh
- Kết quả nào là CHẾT: [đề xuất] chưa đạt «Test so từng tool trong mcp-tools.json với sổ bề mặt: lệch chế độ một tool → đỏ; bản hiện tại xanh» khi hết timebox
- Timebox: …
