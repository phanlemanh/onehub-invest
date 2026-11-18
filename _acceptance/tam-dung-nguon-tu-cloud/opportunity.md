---
schema_version: 1
slug: tam-dung-nguon-tu-cloud
feature: Người vận hành bấm tạm dừng hoặc bật lại một nguồn trên /ops ở cloud, ghi lý do, và thấy lệnh đi tới «đã áp lúc HH:MM» kèm trạng thái trước và sau
owner: phanlemanh@gmail.com
stage: decided                # discovery | decided | archived
decision: build           # Mạnh 10/11 ở phiên giám sát dot0 (~13:15Z): «Đẩy mốc TVM1 trước» và «Build cả bốn» — Cổng Đáng TV4, TV4b, TV5, ON19
decided_by: Mạnh
decided_at: 2026-11-10T13:15:48Z
prototype:
  base_commit:     # điểm cắt nhánh proto khỏi nhánh chính — guard diffBase khi keep
  disposition:     # keep | archive
lo_trinh_ma: TV4b
lo_trinh_tep: docs/plan/lo-trinh.json
---

## Vấn đề & ai gặp

Mở từ hàng TV4b của «Lộ trình onehub-invest» (`docs/plan/lo-trinh.json`).
Nguồn: `onehub-invest-tri-thuc:wiki/nen/nen-chung.md#a29a37b46e61d73aa661ebee868f6a753e1d8d52` · `onehub-invest-tri-thuc:wiki/nen/quyet-dinh.md#484c7d45fd05b60e832fdfec32e37e900c5a83b9` · `onehub-invest-tri-thuc:wiki/dot/tu-van-hanh-2510.md#184faf35bf93aff337c2bac27575ef6075040f52`
Mốc: Đội vận hành tạm dừng/bật nguồn và quản nhóm S05/S06 từ cloud, có nhật ký người thật — chưa có ngày.

Người vận hành bấm tạm dừng hoặc bật lại một nguồn trên /ops ở cloud, ghi lý do, và thấy lệnh đi tới «đã áp lúc HH:MM» kèm trạng thái trước và sau

Vì sao: Ca thật 21–24/10: S05 hết credit, chỉ Mạnh tạm dừng được bằng UPDATE tay. Mốc TVM1.

## Ngưỡng chết / ngưỡng UAT

- Câu hỏi phép đo trả lời: [đề xuất] đã đạt «Tạm dừng S05 từ cloud: lượt thu kế tiếp không chạy; bật lại: lượt kế tiếp chạy; thiếu lý do: không gửi được» chưa?
- Kết quả nào là SỐNG: [đề xuất] Tạm dừng S05 từ cloud: lượt thu kế tiếp không chạy; bật lại: lượt kế tiếp chạy; thiếu lý do: không gửi được
- Kết quả nào là CHẾT: [đề xuất] chưa đạt «Tạm dừng S05 từ cloud: lượt thu kế tiếp không chạy; bật lại: lượt kế tiếp chạy; thiếu lý do: không gửi được» khi hết timebox
- Timebox: …
