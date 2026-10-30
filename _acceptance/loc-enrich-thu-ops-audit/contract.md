---
schema_version: 1
feature: Nhật ký thao tác Ops (GET /api/v1/ops/audit) không trả dấu máy enrich:thu — thao tác của người không bị đẩy khỏi 100 dòng gần nhất
slug: loc-enrich-thu-ops-audit
owner: phanlemanh@gmail.com
risk_tier: T3
surfaces: [api]
status: draft
design_doc: docs/superpowers/specs/2026-10-30-loc-enrich-thu-ops-audit-design.md
---

# Acceptance Contract: loc-enrich-thu-ops-audit

## Context

Căn cứ: mục Ngoài-4 của Cổng Bằng chứng `enrich-chay-sau-nap` (PR #201) — Mạnh chọn «mở hợp đồng mới» 30/10
(`_acceptance/enrich-chay-sau-nap/decisions.jsonl` dòng `d-20261030T082925Z-25`). Từ 31/10 job đêm ghi tối đa 50 dòng
`ops_audit` action `enrich:thu` mỗi đêm; `GET /api/v1/ops/audit` trả 100 dòng mới nhất không lọc. Hạng T3 do route nằm dưới
`app/src/app/api/v1/ops/**` (`t3_paths`) — xem Hỏi-1.

## Criteria

- AC-1 (cross-layer): Given lược đồ tạm có 5 dòng thao tác của người (actor theo các khuôn đang có thật: `user:*`, `ops-user`, `usr_*`, `hitl`) cũ hơn và 150 dòng `enrich:thu` mới hơn, When admin gọi `GET /api/v1/ops/audit` bằng cookie phiên thật, Then cả 5 dòng của người có trong `rows` và không dòng nào có action `enrich:thu`.
- AC-2: Given 130 dòng không phải dấu máy xen với 60 dòng `enrich:thu` theo thời gian, When admin gọi GET, Then `rows` là đúng 100 dòng không phải dấu máy mới nhất theo `at` giảm dần (khớp từng dòng với danh sách tính trước), mỗi dòng đúng năm khoá `at, actor, action, env, detail`.
- AC-3: Given ma trận viết trước các action đang có thật trong `ops_audit` (đo 30/10) — `enrich:revert`, `enrich:reconcile`, `enrich:retire`, `bait-gap:loai-phi-ly`, `transform:reject-test`, `phat-bieu:cat-chuyen`, `review:decide`, `zalo.admin`, `source-group:toggle` — và một action giả `enrich:thu-lai` cùng tiền tố, When admin gọi GET, Then mọi action trong ma trận đều hiện; chỉ đúng action `enrich:thu` bị lọc.
- AC-4: Given ma trận người gọi {admin có phiên · vai ops · vai viewer · phiên hết hạn · không phiên · bearer `OPS_API_TOKEN`}, When gọi GET ở route trước vòng và route sau vòng trên cùng lược đồ, Then mã trạng thái từng ô bằng nhau (quyền không đổi); đối chứng: ô admin của route sau vòng nhận 200 kèm `rows`.
- AC-5: Given chuỗi action trong câu `INSERT INTO ops_audit` của `agent/src/enrich/run.ts`, When so với danh sách dấu máy phía app (`DAU_MAY` trong `app/src/lib/ops/audit-loc.ts`), Then chuỗi đó nằm trong danh sách; đổi tên ở một bên thì phép đo đỏ.

## Coverage

Quét tay bốn trục (dòng sổ «bỏ coverage-scan»), mỗi ô một AC:

| Trục | Giá trị | AC |
|---|---|---|
| Thành phần 100 dòng gần nhất | toàn dấu máy che người · xen kẽ quá 100 · ít hơn 100 (5 dòng người) | AC-1, AC-2 |
| Loại action | dấu máy `enrich:thu` · thao tác máy khác · thao tác người · cùng tiền tố | AC-3 |
| Người gọi | admin · ops · viewer · phiên hết hạn · không phiên · bearer | AC-4 |
| Bên ghi ↔ bên lọc | chuỗi agent ghi · danh sách app lọc | AC-5 |

## Đường đo

| Ngưỡng (opportunity.md) | Đo bằng |
|---|---|
| Nhật ký mặc định không có dòng `enrich:thu` | AC-1, AC-2 trên route thật |
| Thao tác của người hiện như trước đêm enrich | AC-1 (5 dòng người dưới 150 dấu máy), AC-3 |
| Dòng `enrich:thu` không chiếm chỗ trong 100 dòng | AC-2 (đủ 100 dòng không phải dấu) |

## Out of scope

- Dời dấu đã thử sang bảng riêng — cần migration và sửa làn enrich đã ký ở `enrich-chay-sau-nap`.
- Trang UI cho nhật ký thao tác — chưa có màn nào hiện nhật ký (theo Hỏi-3).
- Đổi cách enrich ghi dấu, hay lọc ở chỗ khác — không chỗ nào khác đọc «N dòng gần nhất» của `ops_audit`.
