---
schema_version: 1
feature: Mọi route API của app nằm trong một sổ bề mặt và chỉ trả đúng thứ sổ cho phép
slug: so-be-mat-api
owner: phanlemanh@gmail.com
risk_tier: T2
surfaces: [api]
status: approved
design_doc: docs/superpowers/specs/2026-10-23-so-be-mat-api-design.md
approved_by: Mạnh
approved_at: 2026-10-23T10:58:00Z
---

# Acceptance Contract: so-be-mat-api

## Context

AU2 đã đóng `/api/v1/deals`, nhưng `/api/v1/offers` vẫn công khai và đọc cùng bảng `sale_offers` lẫn tin mock; beacon
`user-events` trả 401 cho mọi khách; `/api/zalo-media` cho admin tải ảnh QR đăng nhập Zalo. Không có chỗ nào khai route
nào được công khai. Vòng này dựng một sổ bề mặt API và rào máy giữ mã khớp sổ, rồi đóng ba lỗ trên. Mạnh gõ `build` cho
hàng NT4 ở thẻ khởi tạo đợt `dot0-cam-mau`; kèm vá Ngoài-1 của AU2 theo lời giao của giám sát.

Source input: `docs/plan/lo-trinh.json` hàng NT4 · `_acceptance/so-be-mat-api/opportunity.md` ·
`docs/plan/dot/dot0-cam-mau/LUAT-rieng.md` ghi chú NT4 · `_acceptance/deals-api-tam-dong/review-findings.md` Ngoài-1

## Criteria

- AC-1: Given cây mã, When chạy kiểm sổ bề mặt, Then mỗi `route.ts` dưới `app/src/app/api` có đúng một dòng sổ với đúng
  các phương thức nó export; route chưa khai, dòng sổ trỏ route không còn, hay phương thức lệch đều trượt có tên.
- AC-2: Given một route (hoặc module `@/lib` nó import) đọc bảng `sale_offers`, When sổ khai route ấy `public`, Then kiểm
  sổ trượt có tên route; trên cây thật không route `public` nào đọc `sale_offers`.
- AC-3: Given chế độ sổ khai cho từng route, When kiểm sổ chạy, Then cổng trong mã phải khớp chế độ (`ops`, `ops-session`,
  `admin`, `session-or-noop`), và route dùng `canCallOpsApi` phải gọi nó có `await`, trả 401, trước `pool.query`; lệch
  thì trượt có tên.
- AC-4: Given người gọi `GET /api/v1/offers`, When không có bearer đúng hay phiên ops (khách, bearer sai, role `user`),
  Then nhận 401 `{"error":"unauthorized"}` trước khi truy vấn; bearer `OPS_API_TOKEN` hoặc phiên ops nhận 200 với khuôn
  `{generatedAt, kind, count, rows}` như cũ; `scripts/audit-all.sh` đo đúng chế độ mới (khách 401, bearer 200).
- AC-5: Given khách không phiên, When trang gửi beacon `POST /api/v1/user-events`, Then nhận 204 và không dòng
  `user_events` nào được ghi; người đăng nhập vẫn nhận 200 và ghi đúng một dòng.
- AC-6: Given admin gọi `/api/zalo-media`, When tệp là ảnh QR đăng nhập Zalo (tên do `zalo-admin.ts` đặt,
  `openclaw-zalouser-qr-<acc>.png`) — trực tiếp hay qua symlink tên vô hại trỏ tới nó — Then nhận 403; ảnh tin tên thường
  trong gốc cho phép vẫn 200; luồng đăng nhập Zalo ở /ops (đọc tệp QR trực tiếp) không đổi.
- AC-7: Given `DATABASE_URL` trỏ máy không phải local, When chạy `scripts/smoke-deals-api.mjs` không cờ `--chi-doc`, Then
  script từ chối trước khi tạo phiên hay tài khoản nào; `--chi-doc` vẫn chạy không cần DB.
- AC-8: Given tài liệu cổng, When người thêm route API mới đọc `docs/architecture/portals.md`, Then thấy sổ nằm ở đâu, năm
  chế độ nghĩa là gì, và luật «route đọc `sale_offers` không được `public`». (judgment)

## Coverage

Quét bằng morphological-scan (preset test-matrix), ba trục:

- Trục A — lớp lỗ: sổ lệch đĩa · route đọc bảng nhạy khai công khai · chế độ lệch cổng · lỗ cụ thể (offers, beacon, QR)
  [thước CE: ba lỗ ở câu giao NT4 + audit 23/10 P7 — SUY-TỪ-REPO `docs/plan/lo-trinh.json`; NGÀNH: OWASP API Security
  Top 10 2023 API9 «Improper Inventory Management»]
- Trục B — người gọi: khách · bearer sai · bearer đúng · phiên role user · phiên ops · phiên admin [thước CE:
  `app/src/lib/ops-access.ts` — SUY-TỪ-REPO]
- Trục C — lớp đo: tĩnh (cây mã, có bản đột biến) · đơn vị (hàm thuần) · HTTP trên app đang chạy [thước CE: khuôn ba
  lớp của AU2 — SUY-TỪ-REPO `_acceptance/deals-api-tam-dong/evals.yaml`]
- Core: AC-1…AC-3 lớp tĩnh với bảng đột biến M1–M14 viết trước (mỗi chế độ, mỗi điều kiện cổng, import bắc cầu); AC-4, AC-5 lớp sống (+ tĩnh qua AC-3); AC-6 lớp sống + đơn vị; AC-7 vá Ngoài-1 AU2.
- Later: luật «không công khai» cho bảng tầng A khác (users, sessions, review_queue) — hôm nay không route public nào đọc.
- Never: gom 5 route `/api/v1/ops/*` về một hàm (đường T3, hàng riêng); `WWW-Authenticate`.

## Đường đo

- Thước: «thêm route đọc sale_offers công khai chưa khai: test đỏ» · số từ: `node scripts/check-api-surface.mjs mutation` (bản đột biến route mới đọc `sale_offers` khai public) · bảo đảm bởi: AC-1, AC-2
- Thước: «gọi /api/v1/offers không token theo đúng chế độ AU2» · số từ: mã HTTP của `scripts/smoke-api-surface.mjs` trên app đang chạy; sau merge `scripts/smoke-api-surface.mjs --chi-doc` với `BASE_URL=https://onehub-invest.vercel.app` (chỉ HTTP: khách 401, bearer 200) · bảo đảm bởi: AC-4
- Thước: «khách không gây 401 ở beacon» · số từ: mã HTTP beacon khách trong smoke · bảo đảm bởi: AC-5
- Thước: «ảnh QR không tải được qua /api/zalo-media» · số từ: mã HTTP ảnh thử tên QR trong smoke + test đơn vị · bảo đảm bởi: AC-6

## Out of scope

- Gom 5 route `/api/v1/ops/*` về `canCallOpsApi` — đường T3 (`app/src/app/api/v1/ops/**`); sổ chỉ đọc và bắt lệch chế độ.
- Luật «không công khai» cho bảng tầng A khác ngoài `sale_offers` — chưa route public nào đọc chúng.
- Header `WWW-Authenticate` (RFC 6750).
- Sửa test độ nhạy Ngoài-2 của AU2 — hồ sơ đã ký, không ai yêu cầu.
- Project Vercel cũ `app` (audit Q2) — việc của Mạnh.

## Notes

- Merge vào `main` = Vercel prod đóng `/api/v1/offers` với người gọi công khai ngay (khó-đảo nhẹ; đảo bằng `git revert`).
- Smoke cần app chạy TỪ worktree đang kiểm ở `:3456` (hoặc `BASE_URL`), DB local `:5433`, ít nhất một user `admin`
  trong DB local, và `OPS_API_TOKEN` (env hoặc `app/.env.local`).
