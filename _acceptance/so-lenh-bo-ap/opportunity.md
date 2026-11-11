---
schema_version: 1
slug: so-lenh-bo-ap
feature: Lệnh có khuôn đã duyệt trên cloud được máy thu kéo về bằng token máy riêng, áp đúng một lần và báo kết quả cùng giá trị trước/sau lên cloud
owner: phanlemanh@gmail.com
stage: decided              # discovery | decided | archived
decision: build           # Mạnh 10/11 ở phiên giám sát dot0 (~13:15Z): «Đẩy mốc TVM1 trước» và «Build cả bốn» — Cổng Đáng TV4, TV4b, TV5, ON19
decided_by: Mạnh
decided_at: 2026-11-10T13:15:48Z
prototype:
  base_commit:     # điểm cắt nhánh proto khỏi nhánh chính — guard diffBase khi keep
  disposition:     # keep | archive
lo_trinh_ma: TV4
lo_trinh_tep: docs/plan/lo-trinh.json
---

## Vấn đề & ai gặp

Mở từ hàng TV4 của «Lộ trình onehub-invest» (`docs/plan/lo-trinh.json`).
Nguồn: `onehub-invest-tri-thuc:wiki/nen/nen-chung.md#a29a37b46e61d73aa661ebee868f6a753e1d8d52` · `onehub-invest-tri-thuc:wiki/nen/quyet-dinh.md#484c7d45fd05b60e832fdfec32e37e900c5a83b9` · `onehub-invest-tri-thuc:wiki/dot/tu-van-hanh-2510.md#184faf35bf93aff337c2bac27575ef6075040f52` — chưa có trang: mã TV4, mã TVN5
Mốc: Đội vận hành tạm dừng/bật nguồn và quản nhóm S05/S06 từ cloud, có nhật ký người thật — chưa có ngày.

Lệnh có khuôn đã duyệt trên cloud được máy thu kéo về bằng token máy riêng, áp đúng một lần và báo kết quả cùng giá trị trước/sau lên cloud

Vì sao: G4: không có đường nào từ cloud xuống máy thu — mọi thao tác ghi chỉ chạy khi ngồi máy thu; Mạnh chốt 25/10 đội làm từ xa. UH7 /ops/console (chân trời) mở lại bằng hàng này.

## Ngưỡng chết / ngưỡng UAT

- Câu hỏi phép đo trả lời: [đề xuất] đã đạt «Lệnh đã duyệt: áp trong ≤ 5′; mười lượt kéo lặp: áp đúng một lần; máy thu tắt: lệnh nằm chờ, cloud hiện mốc lần kéo cuối; token chung hoặc thiếu scope ops:pull: từ chối; ops_heartbeat có migration» chưa?
- Kết quả nào là SỐNG: [đề xuất] Lệnh đã duyệt: áp trong ≤ 5′; mười lượt kéo lặp: áp đúng một lần; máy thu tắt: lệnh nằm chờ, cloud hiện mốc lần kéo cuối; token chung hoặc thiếu scope ops:pull: từ chối; ops_heartbeat có migration
- Kết quả nào là CHẾT: [đề xuất] chưa đạt «Lệnh đã duyệt: áp trong ≤ 5′; mười lượt kéo lặp: áp đúng một lần; máy thu tắt: lệnh nằm chờ, cloud hiện mốc lần kéo cuối; token chung hoặc thiếu scope ops:pull: từ chối; ops_heartbeat có migration» khi hết timebox
- Timebox: …
