---
schema_version: 1
slug: dinh-danh-tai-khoan-thu-theo-vai
feature: Quyết một lần ai thấy định danh tài khoản thu và mã nhóm Zalo ở bề mặt Thu thập (API và trang) theo vai, rồi che theo quyết định
owner: phanlemanh@gmail.com
stage: decided              # discovery | decided | archived
decision: build         # build | iterate | park | kill — người ký Cổng 0 điền
decided_by: giám sát đợt dot0-cam-mau theo Mạnh 27/10 — Mạnh chọn «mở hàng riêng» ở Hỏi-1 Cổng Phạm vi viewer-khong-thay-the-duyet; trả lời P1-40
decided_at: 2026-10-27T05:45:48Z     # ISO UTC
prototype:
  base_commit:     # điểm cắt nhánh proto khỏi nhánh chính — guard diffBase khi keep
  disposition:     # keep | archive
---

## Vấn đề & ai gặp

`GET /api/v1/ops/collections` (quyền `ops.read`: phiên từ vai Người xem trở lên, HOẶC bearer chung của máy) trả nguyên
`zaloAccounts` (mã tài khoản thu, hồ sơ trình duyệt, danh sách nhóm bật của từng tài khoản), `zaloAllowlist[].groupId`
(mã nhóm Zalo đang bật) và `zaloGroups[].ownerAccount` (tài khoản đang giữ nhóm). Trang `/ops/collections` vẽ cùng dữ
liệu. Vai `viewer` (TV1) qua được cả hai. Trên cloud, bản tin máy thu (`push-ops-facts`) mang `zaloAccounts[].enabledGroups`
lên `ops_heartbeat`, và bộ soát tầng A miễn trừ trọn khối `zaloAccounts`. Luật 6 (AGENTS.md, ADR-0007): định danh tài
khoản thu là tầng A, không rời máy local; tên tài khoản thu đã chốt tầng A (hồ sơ `soat-tang-a-moi-duong-len-cloud`,
Hỏi-1 = A), mã tài khoản (bí danh cấu hình) được hiện. Nguồn: Hỏi-1 Cổng Phạm vi `viewer-khong-thay-the-duyet` (Mạnh
chọn «mở hàng riêng» 27/10); giám sát ghi mặc định an toàn «chỉ ops trở lên thấy ở máy thu; cloud/bearer không mang
định danh tài khoản thu». Hàng này chặn việc cấp vai viewer cho người thật.

## Ngưỡng chết / ngưỡng UAT

- Câu hỏi phép đo trả lời: một phiên vai Người xem, hay bearer chung của máy, có đọc được định danh tài khoản thu hoặc mã
  nhóm Zalo ở bề mặt Thu thập (API, trang) hay trong bản tin cloud không?
- Kết quả nào là SỐNG: 0 chỗ — mọi chỗ ấy che với Người xem và bearer theo quyết định ở Cổng Phạm vi; vai Vận hành trở
  lên ở máy thu thấy như hôm nay.
- Kết quả nào là CHẾT: còn một chỗ Người xem hay bearer đọc được thứ đã quyết là phải che.
- Timebox: trong đợt dot0-cam-mau, trước khi cấp vai viewer cho người thật.
