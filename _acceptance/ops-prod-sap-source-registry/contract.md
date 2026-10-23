---
schema_version: 1
feature: /ops và /ops/collections trên cloud không còn vỡ khi thiếu source_registry — nói rõ độ tươi chỉ đo ở máy local
slug: ops-prod-sap-source-registry
owner: phanlemanh@gmail.com
risk_tier: T2      # app/src/lib/ops-queries.ts, lib/freshness.ts, hai trang Ops + test; không đụng t3_paths
surfaces: [ui, api]
status: implemented
veto_state: mo
veto_opened_at: 2026-10-23T23:42:19Z
approved_by:
approved_at:
---

# Acceptance Contract: ops-prod-sap-source-registry

## Context

Sự cố prod 24/10 (giám sát đợt `dot0-cam-mau`, hàng phát sinh của dãy P3): sau khi PR #50 (AU6) lên Vercel, `/ops` và
`/ops/collections` trả 500 — `relation "source_registry" does not exist` (42P01) ở `app/src/lib/freshness.ts` và
`app/src/lib/ops-queries.ts`. Cloud không có `source_registry` và bảng nạp thô (tầng A — leak gate, drop 2026-10-21;
`app/src/lib/queries.ts` getMarketFreshness đã ghi điều này). Code trước AU6 cũng đọc `source_registry` ở cả hai hàm nên
revert không cứu được trang. AC-9 của AU6 thử bảng thô *rỗng*, không thử bảng *vắng* — lỗ phép đo là gốc sự cố.

Source input: lời giao của giám sát (cross-session 24/10) — «sửa tối thiểu để /ops và /ops/collections trên cloud không vỡ;
khi source_registry/bảng nạp vắng thì hiện trạng thái độ tươi chỉ đo ở máy local có tên, không 500; giữ hành vi local như AU6;
kèm test chạy trên schema không có source_registry».

## Criteria

- AC-1: Given lược đồ tạm trong DB local VẮNG HẲN `source_registry` và mọi bảng nạp (như cloud), When gọi `getCoverageOverview()`, `getSourceFeedHealth()` và `GET /api/v1/ops/coverage` (bearer thử), Then không ném lỗi, cả ba trả rỗng (route 200, `rows: []`); chiều đỏ: bỏ chốt `freshnessLocalOnly()` khỏi hai hàm → ca đỏ với mã 42P01 (tái hiện đúng lỗi prod).
- AC-2: Given cùng lược đồ, When render trọn trang `/ops` và trọn `CollectionsView` với cờ `localOnly` từ `freshnessLocalOnly()`, Then cả hai trang hiện «Độ tươi chỉ đo ở máy local» (đầu trang + thông báo có tên), không hiện «Chưa có nguồn nào», `data-slo-summary` là `0/0`; đối chứng: lược đồ CÓ `source_registry` (bảng rỗng) → không hiện câu chỉ-đo-ở-local, vẫn «Chưa có nguồn nào» như AU6 AC-9.
- AC-3: Given DB local đủ bảng, When chạy lại toàn bộ ca của AU6 (`app/tests/slo-mot-nguon.test.tsx`) và test khớp định nghĩa (`scripts/freshness-parity.test.mjs`), Then tất cả vẫn xanh — hành vi local không đổi.

## Coverage

Bỏ quét hình thái — sự cố một chiều (bảng vắng/có), xem dòng `bỏ coverage-scan` trong sổ. Ma trận: lược đồ {vắng bảng
(AC-1, AC-2) · có bảng rỗng (AC-2 đối chứng) · có bảng có dữ liệu (AC-3)} × bề mặt {hai hàm · route · hai trang}.

## Out of scope

- Đưa số độ tươi thật lên Ops ở cloud (từ fact `sourceRuns` của `push-ops-facts.mjs` hay heartbeat) — việc riêng, đã ghi sang đợt sau.
- Các vùng khác của `/ops/collections` trên cloud (lockdown, job, nhóm Zalo) — không thuộc lỗi 42P01 này.

## Notes

- Đo prod sau deploy (chỉ đọc, đăng nhập ops) theo lời giao — làm sau khi gộp, kết quả báo giám sát; không phải eval máy.
