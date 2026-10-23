---
schema_version: 1
feature: /api/v1/deals chỉ trả dữ liệu cho token ops cho tới khi tin mock được rút khỏi canonical
slug: deals-api-tam-dong
owner: phanlemanh@gmail.com
risk_tier: T3
surfaces: [api]
status: draft
design_doc: docs/superpowers/specs/2026-10-23-deals-api-tam-dong-design.md
approved_by:
approved_at:
---

# Acceptance Contract: deals-api-tam-dong

## Context

`GET /api/v1/deals` đang công khai trên prod và trả tin mock (audit 23/10 P7: 29/30 deal là mock của S03). Mạnh đã
gõ `build` ở thẻ khởi tạo đợt `dot0-cam-mau` trên hàng AU2 «chỉ trả dữ liệu cho token ops cho tới khi tin mock được
rút khỏi canonical» — câu trả lời audit Q3. Bản nháp này theo khuyến nghị của máy: token ops (`Bearer OPS_API_TOKEN`)
VÀ phiên ops đều qua, giống các route `/api/v1/ops/*`; có cho phiên ops qua hay không là Hỏi-2 ở Cổng Phạm vi
(chọn «chỉ bearer» thì AC-4 đổi thành «phiên ops → 401»). Hạng T3 vì đổi cổng quyền của một API.

Source input: `docs/plan/lo-trinh.json` hàng AU2 · `_acceptance/deals-api-tam-dong/opportunity.md` ·
`docs/audit/2026-10-23-hien-trang-va-lo-trinh.md` P7, Q3, 0.5

## Criteria

- AC-1: Given người gọi không có `Authorization` và không có phiên, When `GET /api/v1/deals`, Then trả `401` với thân
  đúng `{"error":"unauthorized"}` (không khoá `data`, không `meta`), và cổng quyền chạy trước truy vấn `sale_offers`.
- AC-2: Given `Authorization: Bearer <OPS_API_TOKEN>` đúng, When `GET /api/v1/deals`, Then trả `200` với `data` là mảng
  và `meta` giữ các khoá `total`, `minDiscount`, `ruler`; cổng không đọc phiên khi bearer đúng.
- AC-3: Given bearer sai, hoặc `OPS_API_TOKEN` trống/thiếu trên máy chủ mà người gọi gửi `Bearer ` rỗng hay
  `Bearer undefined`, và không có phiên ops, When `GET /api/v1/deals`, Then trả `401`; token được đọc lúc gọi, nên
  xoá env trong lúc chạy thì bearer cũ không còn qua.
- AC-4: Given phiên còn hạn, When `GET /api/v1/deals`, Then role `ops`, role `admin`, hoặc email trong `OPS_EMAILS` →
  `200`; role `user` (ngoài `OPS_EMAILS`) và phiên hết hạn → `401`.
- AC-5: Given cây mã, When chạy kiểm tĩnh ranh giới cổng, Then trượt có tên khi route deals không gọi cổng ops, gọi
  cổng sau truy vấn DB, gọi cổng không `await`, hoặc gọi mà không trả 401 khi cổng sai; và đạt trên cây thật.
- AC-6: Given tài liệu của kho, When người đọc docstring route và ROADMAP, Then thấy `/api/v1/deals` đang tạm đóng chỉ
  cho ops, vì sao (tin mock, audit P7/Q3), và điều kiện mở lại (PL2 rút tin mock, quyết riêng) — không còn chữ «public
  API» cho route này. (judgment)

## Coverage

Quét bằng morphological-scan (preset test-matrix), ba trục:

- Trục A — bằng chứng người gọi: không có · bearer · phiên cookie [thước CE: các nhánh của `canAccessOps` và khuôn
  bearer ở `app/src/app/api/v1/ops/coverage/route.ts` — SUY-TỪ-REPO; NGÀNH: OWASP API Security Top 10 2023 API2
  «Broken Authentication»]
- Trục B — hiệu lực: đúng/được phép · sai/không quyền · rỗng hoặc env thiếu · hết hạn [thước CE: `app/src/lib/auth.ts`
  `getSessionUser` lọc `expires_at`, `ops-access.ts` — SUY-TỪ-REPO]
- Trục C — lớp đo: hàm cổng (đơn vị) · cây mã (tĩnh) · HTTP trên app đang chạy (sống) [thước CE: khuôn ba lớp của
  hồ sơ `ops-access-hardening` — SUY-TỪ-REPO]
- Core: A×B mọi ô có nghĩa (AC-1…AC-4) ở lớp đơn vị + sống; thứ tự cổng-trước-truy-vấn ở lớp tĩnh (AC-5).
- Later: `WWW-Authenticate: Bearer` theo RFC 6750 [NGÀNH: RFC 6750 §3] — các route ops chưa có, để NT4 chuẩn hoá chung.
- Never: bearer + phiên cùng lúc (bearer đúng đã đủ, phiên không đọc — đã nằm trong AC-2); prod/project cũ `app` (ngoài kho).

## Đường đo

- Thước: «gọi không token: 401; gọi bằng token ops: 200» · số từ: mã HTTP của `GET /api/v1/deals` trên app đang chạy (smoke `scripts/smoke-deals-api.mjs`) · bảo đảm bởi: AC-1, AC-2
- Thước: cùng thước trên prod sau merge · số từ: `scripts/smoke-deals-api.mjs --chi-doc` với `BASE_URL=https://onehub-invest.vercel.app` (khách 401; bearer 200 khi có `OPS_API_TOKEN` của cloud trong env), chạy ở S5 sau deploy — project cũ `app` không tính (audit Q2, ngoài kho) · bảo đảm bởi: AC-1, AC-2 (chế độ `--chi-doc` không tạo phiên, không ghi DB)

## Out of scope

- Gom 5 route `/api/v1/ops/*` về hàm cổng mới — NT4 (sổ bề mặt API) làm chung cho mọi route.
- `/api/v1/offers` (cùng lỗ mock) — NT4, chạy sau AU2 theo đúng chế độ này.
- Cờ env để mở lại API — mở lại sau PL2 là quyết riêng, hàng riêng (LUAT đợt, ghi chú AU2).
- Project Vercel cũ `app` vẫn phục vụ `/api/v1/deals` bản 22/10 — audit Q2, việc của Mạnh (ngoài kho).
- data-api `/v1/deals` — chưa có bản chạy (audit P11), thuộc AH2.
- Header `WWW-Authenticate` — NT4.

## Notes

- Merge vào `main` = Vercel deploy prod = API đóng với người gọi công khai ngay (khó-đảo nhẹ; đảo bằng `git revert`).
- Smoke sống cần app chạy TỪ worktree đang kiểm ở `:3456` (hoặc `BASE_URL`) + DB local `:5433`; token lấy từ env
  `OPS_API_TOKEN`, thiếu thì `app/.env.local`.
