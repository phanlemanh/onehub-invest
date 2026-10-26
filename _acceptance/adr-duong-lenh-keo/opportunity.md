---
schema_version: 1
slug: adr-duong-lenh-keo
feature: ADR-0015 «đường lệnh kéo một chiều cloud → máy thu» và bản sửa đổi ADR-0007, kèm thuật ngữ mới và ROADMAP §2.3–2.4 khớp thực tế
owner: phanlemanh@gmail.com
stage: decided              # discovery | decided | archived
decision: build         # build | iterate | park | kill — người ký Cổng 0 điền
decided_by: giám sát đợt dot0-cam-mau theo Mạnh 26/10 «Cắt 4 mốc Ops tự vận hành … vào dãy P1 và U2 …; TV0 (ADR-0015) đi trước, trình tôi duyệt»
decided_at: 2026-10-26T05:20:00Z     # ISO UTC
prototype:
  base_commit:     # điểm cắt nhánh proto khỏi nhánh chính — guard diffBase khi keep
  disposition:     # keep | archive
lo_trinh_ma: TV0
lo_trinh_tep: docs/plan/lo-trinh.json
---

## Vấn đề & ai gặp

Mở từ hàng TV0 của «Lộ trình onehub-invest» (`docs/plan/lo-trinh.json`), cửa của bốn mốc Ops tự vận hành (TV0–TV14,
PL12, ON19–21). Mạnh chốt 25/10 «làm từ xa qua cloud» và «nội dung/ảnh/thẻ duyệt lên cloud»
(`docs/research/ops-tu-van-hanh-nguon-saas.md` §3.1, §3.7, PR #79). Điều đó trái ADR-0014 (cloud không điều khiển máy thu)
và luật 6 hiện hành, nên phải thành luật trước khi hàng nào code.

## Ngưỡng chết / ngưỡng UAT

Không đo được — việc nền thành văn bản luật (ADR + thuật ngữ), không có người dùng cuối; đích là ADR-0015 ở trạng thái
accepted do Mạnh duyệt, CONTEXT.md có Đơn vị thu, Lệnh, Quy định ngữ cảnh, Mục tiêu phủ (nhãn · code · slug), và ROADMAP
§2.3–2.4 khớp launchctl và airdna_markets.
