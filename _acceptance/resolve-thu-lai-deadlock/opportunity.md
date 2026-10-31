---
schema_version: 1
slug: resolve-thu-lai-deadlock
feature: resolve-properties tự thử lại có hạn khi Postgres báo deadlock (40P01), chotot-daily không còn thoát 1 vì va chạm khoá nhất thời
owner: phanlemanh@gmail.com
stage: decided
decision: build
decided_by: giám sát theo lời Mạnh 31/10 «Giao gói khuyến nghị» (gói dữ liệu ra mắt — S06 hai lượt/ngày)
decided_at: 2026-10-31T09:17:29Z
prototype:
  base_commit: 82a53e0a
  disposition: archive
---

## Vấn đề & ai gặp

Hàng phát sinh do giám sát thêm cho dãy P3 (đợt dot0-cam-mau, ưu tiên 1), không có trong `docs/plan/lo-trinh.json`.
Mốc: chưa gắn — hàng vá vận hành phát sinh; chặn việc nâng S06 lên hai lượt/ngày của gói dữ liệu ra mắt.

chotot-daily 30/10 ~22:3xZ thoát mã 1 ở bước `resolve-properties`: Postgres báo `deadlock detected` (40P01) giữa câu
`INSERT INTO property_offers … FROM sale_offers` của resolve và một phiên khác giữ khoá trên view `sale_offers` rồi xin
khoá độc quyền trên `property_offers`. Postgres huỷ một bên; phía bị huỷ là resolve → cả chuỗi đêm báo hỏng, Stage B
(cặp ứng viên) không chạy, dù chạy lại thì xanh. Nâng S06 lên hai lượt/ngày làm số lần va chạm tăng theo.

Vì sao: log `pipeline/logs/chotot.log` (JOB FAIL [chotot-daily] bước resolve-properties mã 1, code 40P01); `cloud-sync.log`
26/10 cũng có một lần `SYNC FAIL [read] … deadlock detected` (phía đọc).

Phạm vi sync-cloud: giám sát duyệt P3-134 (31/10 09:19Z) — bỏ `pipeline/sync-cloud.mjs` khỏi vùng của hàng, ghi Out of scope; sync-cloud chỉ đọc REPEATABLE READ READ ONLY, là phía nạn nhân; thử lại có hạn đặt ở resolve-properties.

## Ngưỡng chết / ngưỡng UAT

- Câu hỏi phép đo trả lời: một deadlock nhất thời còn làm chotot-daily thoát 1 ở bước resolve-properties không?
- Kết quả nào là SỐNG: deadlock dựng thật trên DB thử → resolve thử lại và hoàn tất, lỗi khác vẫn hỏng ngay; logic resolve không đổi.
- Kết quả nào là CHẾT: hết timebox mà resolve vẫn thoát ngay ở lần 40P01 đầu, hoặc thử lại vô hạn.
- Timebox: một vòng feature-loop (dãy P3, đợt dot0-cam-mau).

## Quyết định Cổng Đáng

- **decision = build** Căn cứ: nhật ký đợt 2026-10-31T09:17:29Z — giám sát thêm hàng theo lời Mạnh «Giao gói khuyến nghị» 31/10.
- **disposition = archive** Căn cứ: không có prototype.
- **Ngưỡng UAT chốt cùng lúc ký:** việc nền, không đo bằng người dùng; ngưỡng là các dòng SỐNG/CHẾT ở trên.
