---
schema_version: 1
feature: Sổ bề mặt API khai /api/zalo-media rộng bằng hoặc hơn quyền thật sau PL3 (ảnh snapshot cho vai Vận hành), route và hai bộ kiểm tĩnh khớp sổ
slug: api-surface-anh-vai-ops
owner: phanlemanh@gmail.com
risk_tier: T2
surfaces: [api]
status: draft
design_doc: docs/superpowers/specs/2026-10-30-api-surface-anh-vai-ops-design.md
---

# Acceptance Contract: api-surface-anh-vai-ops

## Context

Căn cứ: mục Ngoài-2 của PL3 the-duyet-du-can-cu — Mạnh chọn «mở hợp đồng mới» ở Cổng Bằng chứng 30/10
(`_acceptance/the-duyet-du-can-cu/decisions.jsonl` `d-20261030T071529Z-27`); giám sát xếp hàng cho dãy U1. Sổ
`app/src/lib/api-surface.ts` khai `zalo-media` là `admin` trong khi `serveZaloMedia` cho vai Vận hành xem ảnh snapshot
(PL3) — trái luật đầu tệp sổ «sổ phải rộng bằng hoặc hơn mã».

## Criteria

- AC-1: Given sổ bề mặt API, When đọc dòng `zalo-media`, Then chế độ là `ops-session`, phương thức `GET`, và `note` nêu
  phần mã chặt hơn sổ: `?snapshot=` cho vai Vận hành trở lên, `?path=` chỉ admin, vai Người xem nhận 404.
- AC-2: Given ma trận viết trước 6 người gọi (khách, user, viewer, ops, admin, bearer OPS_API_TOKEN không phiên) × 2 chế
  độ (`?snapshot=`, `?path=`) trên lõi `serveZaloMedia` với ảnh có thật trong thư mục tạm, When gọi, Then mọi ô mã trả
  ảnh (200) đều là người qua cổng của chế độ sổ (`canAccessOps`, không bearer) — sổ rộng bằng hoặc hơn mã; và ô
  viewer × 2 chế độ trả 404 (mã chặt hơn sổ, đúng như `note`).
- AC-3: Given route `app/src/app/api/zalo-media/route.ts`, When đọc mã, Then route đọc phiên đúng một lần, chặn
  `!canAccessOps(user)` bằng 404 trước khi chuyển phiên cho `serveZaloMedia(req, user)`, không đọc tệp; docstring nói
  đúng quyền (snapshot vai Vận hành trở lên, `?path=` admin), không còn «chỉ admin»; chạy handler GET với 5 vai ×
  `?snapshot=` thì khách, user, viewer nhận 404 trùng thân 404 của lõi, ops và admin nhận ảnh. (cross-layer)
- AC-4: Given `node scripts/check-api-surface.mjs static` và `mutation`, When chạy trên cây vòng, Then bản nguyên đạt; M13
  và M15 vẫn trượt đúng thông điệp trên route admin dựng giả; M20 mới (zalo-media bỏ `canAccessOps`) trượt với «chế độ
  ops-session mà mã thiếu canAccessOps».
- AC-5: Given `node scripts/check-portal-compliance.mjs`, When chạy, Then mục 6 (zalo-media: `xemNoiDungTin` chặn trước
  mọi đọc tệp, `?path=` chặn `isAdmin`, route chỉ chuyển phiên) xanh với route mới, và chiều đỏ của mục vẫn đỏ.

## Coverage

Quét hình thái tại chỗ (preset test-matrix của morphological-scan), hai trục:

- Người gọi: khách | user | viewer | ops | admin | bearer không phiên — [thước CE: bốn vai `BAC_VAI` của
  `app/src/lib/ops-access.ts` + bearer `OPS_API_TOKEN`]
- Chế độ route: `?snapshot=` | `?path=` — [thước CE: hai nhánh của `serveZaloMedia`]

Core → AC-1…AC-5. Never: đổi quyền thật của route (giữ quyết định PL3 Hỏi-1).

## Out of scope

- OOS-1: Đổi ai xem được ảnh nào ở `/api/zalo-media` — quyền thật giữ nguyên quyết định PL3.
- OOS-2: Thêm chế độ thứ sáu cho sổ, hay sửa dòng sổ của route khác.

## Notes
