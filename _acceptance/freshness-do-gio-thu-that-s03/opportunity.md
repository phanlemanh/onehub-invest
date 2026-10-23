---
schema_version: 1
slug: freshness-do-gio-thu-that-s03
feature: check-freshness đo S03/S05/S06 theo giờ THU thật của snapshot thay vì giờ NẠP — nguồn ngừng thu mà bị nạp lại bản cũ phải báo quá hạn
owner: phanlemanh@gmail.com
stage: decided              # discovery | decided | archived
decision: build           # Mạnh chọn «mở hợp đồng mới» cho Ngoài-3 ở Cổng Bằng chứng AU4 23/10; giám sát duyệt hàng (P3-13)
decided_by: Mạnh
decided_at: 2026-10-23T11:32:34Z
prototype:
  base_commit:
  disposition:
lo_trinh_ma:              # giám sát cắt vào lộ trình ở mốc khép (đề xuất AU14)
lo_trinh_tep: docs/plan/lo-trinh.json
---

## Vấn đề & ai gặp

Người vận hành đọc `check-freshness` để biết nguồn nào đứng. Từ AU4, S03/S05/S06 đo `captured_at` của bảng nạp
(`stg_zalo_posts`, `stg_chotot_ads`) — cột này là giờ NẠP: `pipeline/import-chotot.mjs` và `pipeline/import-airbnb.mjs`
ghi `captured_at = now()` mỗi lần upsert. Nguồn ngừng thu mà job vẫn nạp lại snapshot cũ thì vẫn báo «tươi» — đúng lớp
lỗi im lặng mà lệnh sinh ra để bắt. Gom thêm Ngoài-5 (thiếu ca S03 cũ + S05 mới) và Ngoài-6 (thiếu ô quá hạn) của AU4.

## Ngưỡng chết / ngưỡng UAT

- Câu hỏi phép đo trả lời: snapshot cũ bị nạp lại (captured_at mới, collected_at cũ) có làm nguồn báo quá hạn không?
- Kết quả nào là SỐNG: S03/S05/S06 tính tuổi theo `airbnb_snapshots.collected_at`; ca nạp-lại-bản-cũ ra quá hạn; trên DB hiện tại vẫn chỉ S05 quá hạn
- Kết quả nào là CHẾT: còn một mã nào tính tuổi theo giờ nạp
- Timebox: trong đợt dot0-cam-mau
