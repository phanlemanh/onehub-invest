---
schema_version: 1
slug: so-nhom-mot-noi
feature: Người vận hành khai mọi đơn vị thu (nhóm S03, nhóm S05, vùng S06, market S02) trong một sổ trên /ops, mỗi đơn vị có mã ổn định dạng S03-N012, thị trường, dự án nhóm chuyên và trạng thái vòng đời
owner: phanlemanh@gmail.com
stage: decided              # discovery | decided | archived
decision: build         # build | iterate | park | kill — người ký Cổng 0 điền
decided_by: giám sát đợt dot0-cam-mau theo Mạnh 26/10 (cắt mốc Ops) — «Cắt 4 mốc Ops tự vận hành … vào dãy P1 và U2», ADR-0015 (#124), TV2a đã merge (#129)
decided_at: 2026-10-26T11:15:00Z     # ISO UTC
prototype:
  base_commit:     # điểm cắt nhánh proto khỏi nhánh chính — guard diffBase khi keep
  disposition:     # keep | archive
lo_trinh_ma: PL12
lo_trinh_tep: docs/plan/lo-trinh.json
---

## Vấn đề & ai gặp

Mở từ hàng PL12 của «Lộ trình onehub-invest» (`docs/plan/lo-trinh.json`).
Nguồn: `onehub-invest-tri-thuc:wiki/nen/nen-chung.md#a29a37b46e61d73aa661ebee868f6a753e1d8d52` · `onehub-invest-tri-thuc:wiki/nen/quyet-dinh.md#484c7d45fd05b60e832fdfec32e37e900c5a83b9` · `onehub-invest-tri-thuc:wiki/dot/phan-loai-2310.md#207e19a6bf1b5a1b08cf1f0316966df0fa292fa6` — chưa có trang: mã SN
Mốc: Đội vận hành tạm dừng/bật nguồn và quản nhóm S05/S06 từ cloud, có nhật ký người thật — chưa có ngày.

Người vận hành khai mọi đơn vị thu (nhóm S03, nhóm S05, vùng S06, market S02) trong một sổ trên /ops, mỗi đơn vị có mã ổn định dạng S03-N012, thị trường, dự án nhóm chuyên và trạng thái vòng đời

Vì sao: F1: nhóm Zalo đang ở sổ riêng (zalo.group.toggle), nhóm khác ở source_groups.

## Ngưỡng chết / ngưỡng UAT

- Câu hỏi phép đo trả lời: …
- Kết quả nào là SỐNG: …
- Kết quả nào là CHẾT: …
- Timebox: …
