---
schema_version: 1
feature: Route công khai /api/v1/markets thôi trả và thôi xếp theo số S02; bộ soát sổ bề mặt chặn route public đọc bảng S02
slug: api-markets-khong-tra-so-s02
owner: phanlemanh@gmail.com
risk_tier: T2
surfaces: [api, cli]
status: implemented
design_doc: docs/superpowers/specs/2026-11-25-api-markets-khong-tra-so-s02-design.md
veto_state: mo
veto_opened_at: 2026-11-25T02:43:09Z
---

# Acceptance Contract: api-markets-khong-tra-so-s02

## Context

Giám sát giao HT23 ngày 25/11: `GET /api/v1/markets` là route `public`, không kiểm quyền, nhưng trả `marketScore` lấy từ
bảng điểm của S02 (nối `area_sources` source `S02`) và xếp theo điểm ấy. Trên prod mỗi thị trường VN mang `marketScore`
khác null. AGENTS.md luật 5: số S02 chỉ ở `/ops/quality`. Không UI nào gọi route này. `scripts/check-api-surface.mjs` với
route public chỉ cấm `sale_offers`, nên không bộ soát nào canh.

Vùng: `app/src/app/api/v1/markets/route.ts`, `app/src/lib/api-surface.ts`, `scripts/check-api-surface.mjs`,
`scripts/check-api-surface.test.mjs`, `app/tests/api-markets-khong-s02.test.tsx`, `_acceptance/api-markets-khong-tra-so-s02/**`.

## Criteria

### AC-1 — Phản hồi không mang khoá nào suy từ S02
Given DB thử có ba thị trường VN, một thị trường có điểm S02 nối qua `area_sources`,
When gọi `GET /api/v1/markets?country=vn&limit=5`,
Then 200; mọi dòng có đúng bốn khoá `id`, `name`, `countryCode`, `listingCount` và không dòng nào có khoá `marketScore`;
`meta` giữ `total`, `limit`. Chiều đỏ: route cũ trên cùng DB thử trả khoá `marketScore` với số của S02.

### AC-2 — Thứ tự theo số tin, không theo S02
Given cùng DB thử, thị trường có điểm S02 cao nhất lại có ít tin nhất,
When gọi route,
Then thứ tự là `listingCount` giảm dần, bằng nhau thì theo tên; thị trường có điểm S02 không bị đẩy lên đầu.
Chiều đỏ: route cũ đặt thị trường có điểm S02 lên đầu.

### AC-3 — Rào: route public đọc bảng S02 thì đỏ
Given sổ bề mặt thật và mã cây,
When chạy `checkApiSurface`,
Then 0 vi phạm; và route khai `public` mà bao đóng import (route và mọi module `app/src/lib` nó kéo theo, bỏ chú thích)
có tên bảng `airdna_*` hoặc `ref_calib_*` thì có vi phạm mang đúng thông điệp `MSG.publicS02`. `app/src/lib/db.ts` bị quét
trọn, không ngoại lệ: bộ đổi tên bảng cho cloud trong đó không mang tên bảng nào khớp mẫu.

### AC-4 — Đột biến của rào đều đỏ
Given bốn đột biến: cấy lại câu JOIN bảng điểm S02 vào route markets; route public mới import `@/lib/queries`; route
public mới đọc thẳng `ref_calib_scores`; cấy một câu `FROM airdna_scores` vào `app/src/lib/db.ts` ngoài biểu thức đổi tên,
When chạy bộ soát trên từng đột biến,
Then mỗi đột biến cho vi phạm `MSG.publicS02`; bản không đột biến 0 vi phạm. Bộ đột biến cũ (`mutation`) vẫn xanh.

### AC-5 — Soát mọi route public bằng rào mới
Given mọi dòng sổ khai `public`,
When chạy rào mới trên cây sau khi sửa,
Then 0 route đỏ; đối chứng trong test: cấy lại câu JOIN cũ vào route markets (văn bản ghim trong test, không đọc git) thì
đúng một route `v1/markets` đỏ.

### AC-6 — Sổ nói thật
Given `app/src/lib/api-surface.ts`,
When đọc dòng `v1/markets`,
Then `note` nói «danh sách thị trường và số tin; không mang số S02», chế độ vẫn `public`, phương thức vẫn `GET`.

### AC-7 — Hồi quy
Given cây sau khi sửa,
When chạy bộ test app (`app_ui`), `tsc` + lint (`app`) và `portal_static`,
Then tất cả thoát 0.

## Coverage

Trục (thước CE: AGENTS.md luật 5, sổ `api-surface.ts`, bao đóng import của bộ soát):

- Khoá phản hồi: có khoá S02 · không có. [AC-1]
- Thứ tự: theo S02 · theo số tin. [AC-2]
- Đường S02 vào route public: trực tiếp trong route · gián tiếp qua `app/src/lib` · tên bảng cloud `ref_calib_*` · tệp đổi tên bảng (trừ). [AC-3, AC-4]
- Route public trong sổ: bốn route hiện có. [AC-5]
- Sổ: chế độ · phương thức · ghi chú. [AC-6]

Core → AC-1…AC-7. Later: rào cho chuỗi `'S02'` trong SQL của route public (không bảng S02 nào khác lên public hôm nay).
Never: sửa `/ops/quality`, `lib/queries.ts`, `data-api/**`.

## Đường đo

Đích trên màn (sau khi Vercel triển khai bản gộp, không có bước áp DB):
`curl -s -w '\n%{http_code}' '<miền prod>/api/v1/markets?country=vn&limit=5'` rồi `jq`: đạt khi mã 200, `.data | length == 5`,
mọi dòng có đủ `id`, `name`, `countryCode`, `listingCount`, và số dòng có khoá `marketScore` = 0 (trước gộp: 5).
Thiếu một trong ba điều đầu thì phép đo không hợp lệ, không ghi «đạt».
Bước kiểm sau gộp là chính lệnh này; giám sát đo.

## Out of scope

- `/ops/quality`, `app/src/lib/queries.ts` và mọi màn Ops dùng điểm S02 (đúng chỗ theo luật 5).
- `pipeline/sync-cloud.mjs`, DDL, ghi cloud.
- `data-api/**` (M5 giữ HT19/HT20).

## Notes

- Đổi khuôn phản hồi: bỏ `marketScore` khỏi `/api/v1/markets` (GS phán 25/11, Hỏi-1 cũ; không UI nào gọi route, chưa có
  khách API ngoài được công bố hợp đồng).
