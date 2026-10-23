---
schema_version: 1
slug: freshness-theo-nguon-that
feature: check-freshness đo độ tươi theo bảng thật của từng nguồn, có SLO cho S05 và S06, không còn dòng quá hạn giả
owner: phanlemanh@gmail.com
stage: decided              # discovery | decided | archived
decision: build           # Mạnh gõ «build duyệt» ở thẻ khởi tạo đợt dot0-cam-mau
decided_by: Mạnh
decided_at: 2026-10-23T09:02:39Z
prototype:
  base_commit:     # điểm cắt nhánh proto khỏi nhánh chính — guard diffBase khi keep
  disposition:     # keep | archive
lo_trinh_ma: AU4
lo_trinh_tep: docs/plan/lo-trinh.json
---

## Vấn đề & ai gặp

Mở từ hàng AU4 của «Lộ trình onehub-invest» (`docs/plan/lo-trinh.json`).

check-freshness đo độ tươi theo bảng thật của từng nguồn, có SLO cho S05 và S06, không còn dòng quá hạn giả

Vì sao: Audit L5: 8/8 dòng quá hạn là giả; S05/S06 không có SLO.

## Ngưỡng chết / ngưỡng UAT

- Câu hỏi phép đo trả lời: [đề xuất] đã đạt «Trên DB hiện tại: chỉ S05 (đứng từ 21/10) báo quá hạn» chưa?
- Kết quả nào là SỐNG: [đề xuất] Trên DB hiện tại: chỉ S05 (đứng từ 21/10) báo quá hạn
- Kết quả nào là CHẾT: [đề xuất] chưa đạt «Trên DB hiện tại: chỉ S05 (đứng từ 21/10) báo quá hạn» khi hết timebox
- Timebox: …
