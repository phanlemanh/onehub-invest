---
schema_version: 1
feature: Thước đồng bộ cloud (check-cloud-sync) chạy lại được trên máy thu đã áp 060 và 059 — sellers dựng thành bảng theo 022, bỏ trigger lịch sử khỏi bản dump
slug: check-cloud-sync-sellers-view
owner: phanlemanh@gmail.com
risk_tier: T2
surfaces: [cli]
status: draft
---

# Acceptance Contract: check-cloud-sync-sellers-view

## Context

Hàng P4 do giám sát tách (P4-123, 31/10) từ sellers-view-len-cloud (#256). `pipeline/scripts/check-cloud-sync.mjs` là thước của
ba hồ sơ đã ký (cloud-sync-atomic, leak-gate-kiem-anon, soat-tang-a-moi-duong-len-cloud). Nó dựng DB «local mô phỏng» và «cloud
mô phỏng» trong container Postgres tạm bằng pg_dump các bảng FILL từ DB máy thu. Từ khi 060 áp lên :5433 (31/10), `sellers` là
VIEW đọc `registry_aliases` + `sale_offer_records`; pg_dump -t sellers chỉ ra CREATE VIEW đọc bảng không được dump → psql chết,
cả mười ca của thước gãy (đo 31/10: EPIPE ở buildLocalSim). Sửa xong lộ thêm gãy thứ hai cùng lớp: trigger lịch sử của 059 trên
`sale_offer_records` gọi hàm `public.history_*()` không có trong bản dump (đo 01/11).

## Criteria

- AC-1: Given DB máy thu đã áp 060 (sellers là view) và 059 (trigger lịch sử), When chạy ca mới `sellers-view` của thước, Then
  DB mô phỏng dựng được; local mô phỏng có `sellers` là bảng, trọn bảy cột khớp view nguồn; cloud mô phỏng có `sellers` là
  bảng đúng cột cho phép; một lượt sync đổ đủ dòng, các cột cho phép khớp local; chỉ trigger lịch sử 059 đã biết bị bỏ khỏi
  dump; đối chứng: dump cũ (kéo view sellers / giữ CREATE TRIGGER) nạp vào DB trống thì gãy đúng vì phụ thuộc không được dump.
- AC-2: Given mười ca cũ của thước (stage, atomic, fail, fidelity, keep, pii, overlap, allow, anon, pii-cot), When chạy trên DB
  máy thu hiện tại, Then mỗi ca thoát 0 — ba hồ sơ đã ký trỏ thước này ghim lại được.
- AC-3: Given nhánh so merge-base, When liệt kê tệp đổi, Then chỉ `pipeline/scripts/check-cloud-sync.mjs`, hồ sơ này,
  `_acceptance/config.yaml`, tệp sinh và bản ghim lại của ba hồ sơ trỏ thước; không gọi cloud.

## Coverage

- Trục **hình nguồn** (sellers là view sau 060 · trigger lịch sử 059) — AC-1, AC-2.
- Trục **phía mô phỏng** (local mô phỏng có dữ liệu · cloud mô phỏng rỗng đúng cột) — AC-1.
- Trục **lời hứa cũ** (mười ca của ba hồ sơ đã ký) — AC-2.

## Out of scope

- Nguồn chưa áp 060/059 (nhánh dump như cũ): máy thu đã áp, không còn bản sao trước 060 để đo — nhánh đó giữ nguyên mã cũ.
- Dựng lại đúng view sellers (cùng registry_aliases, parties) trong local mô phỏng — sync đọc local bằng câu đọc cột, bảng cùng
  cột là đủ; đổi gì ở `pipeline/sync-cloud.mjs`; áp gì lên cloud.

## Notes

- Local mô phỏng mang `sellers` dạng BẢNG chép dòng của view (COPY), không phải view — ca không thử câu đọc view của máy thu
  (đã đo ở sellers-view-len-cloud E3).
- Bản dump bỏ câu `CREATE TRIGGER` — DB mô phỏng không có trigger lịch sử; thước không đo lịch sử tin.
