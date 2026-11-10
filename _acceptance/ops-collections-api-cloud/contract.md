---
schema_version: 1
feature: API Thu thập trên cloud không đọc bảng chỉ có ở máy thu — gỡ 500 của /api/v1/ops/collections
slug: ops-collections-api-cloud
owner: phanlemanh@gmail.com
risk_tier: T1      # một nhánh rẽ theo nơi chạy trong collections-api (chép đúng nhánh cloud của trang Thu thập) + một dòng chặn đọc stg trên cloud; không đổi quyền, che định danh, lược đồ hay dữ liệu
surfaces: [api]
status: draft      # T1: không qua Cổng Phạm vi / Cổng Bằng chứng; người gộp PR là người chốt
---

# Acceptance Contract: ops-collections-api-cloud

## Context

`scripts/audit-all.sh` ngày 07/11: prod `GET /api/v1/ops/collections?days=1` trả 500 (cả `days=7` và không tham số). Nguyên nhân đo
bằng Management API (chỉ đọc): `docThuThap()` gọi `getFlowDays()` vô điều kiện, mà hàm này đếm thẳng `stg_zalo_posts` và
`airbnb_snapshots`; bảng stg trên cloud không đồng bộ lược đồ — câu đếm bài S03 lọc theo `agent_id`, cột không có trên cloud
(`42703`). Trang `/ops/collections` đã rẽ nhánh cloud từ ON3/ON5 (`collections-content.tsx`: khối `luong7` của bản tin +
`getCloudFlowDays`); API thì chưa. Giám sát đợt `dieu-phoi-dot0-cam-mau` giao 07/11.

Thay đổi:
- `app/src/lib/collections-api.ts`: «Luồng N ngày» theo nơi chạy — máy thu như cũ; cloud (bảng tầng A vắng,
  `freshnessLocalOnly`) dựng từ bản tin bằng `getCloudFlowDays`, chưa có bản tin thì rỗng.
- `app/src/lib/collections-queries.ts`: `getZaloGroups` trên cloud chưa có bản tin trả rỗng thay vì đọc bảng stg.
- `app/tests/ops-collections-api-cloud.test.tsx`: ghi mọi câu SQL qua pool; ở chế độ cloud (`VERCEL=1`) không câu nào chạm
  `stg_*` hay `airbnb_snapshots`; đối chứng dương ở máy thu.

## Cắt / hoãn

- Không đổi khuôn trả về ở máy thu; trên cloud phần tử `flow` theo khuôn `CloudFlowDay` của trang (không có `airbnbSnapshots`,
  hai cột S03 null ngoài 7 ngày của khối `luong7`).
- Không đổi `scripts/audit-all.sh`.

## Acceptance Criteria

- AC-1: ở chế độ cloud, `docThuThap` không đọc bảng chỉ có ở máy thu; ở máy thu vẫn đếm thẳng bảng thô.
- AC-2: sau khi triển khai, `GET /api/v1/ops/collections?days=1` với bearer ops trả 200 (audit-all mục cloud API).
