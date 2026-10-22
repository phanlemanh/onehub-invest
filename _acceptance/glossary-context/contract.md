---
schema_version: 1
feature: Ngôn ngữ chuẩn — CONTEXT.md, luật đặt tên, bối cảnh sản phẩm, test slug route
slug: glossary-context
owner: phanlemanh@gmail.com
risk_tier: T2
surfaces: [cli]
status: draft
approved_by:
approved_at:
---

# Acceptance Contract: glossary-context

## Context

Tên trong onehub-invest đang lẫn Anh/Việt ở URL (`/so-sanh` cạnh `/yield`), nhãn UI (menu "Listing",
"Yield ngắn hạn") và tài liệu (occupancy 40 file / công suất 33; yield 20 / lợi suất 17 — đo
2026-10-23). Kit nghiệm thu đã có ổ đọc `CONTEXT.md` (lint W6, khối Từ vựng trên thẻ duyệt) nhưng
repo chưa có file này. Mạnh chốt 2026-10-23: URL tiếng Anh toàn bộ. Việc này dựng bộ từ vựng chuẩn
(`CONTEXT.md`), luật đặt tên trong `AGENTS.md`, một trang bối cảnh sản phẩm cho agent, và test chặn
route tiếng Việt mới — không đụng code trang.

Source input: prompt (phiên điều phối "Setup project Invest" giao việc 2026-10-23).
Gate 1: bảng chốt thuật ngữ `_acceptance/glossary-context/bang-chot.html` (8 câu Q1–Q8).

## Criteria

- AC-1: Given `CONTEXT.md` ở gốc repo, When `lib/context-glossary.js` của kit đọc nó, Then ra ≥ 1 thuật ngữ cho mỗi nhóm trong 7 nhóm (Địa lý, Tài sản & tin, Giá, Chỉ số, Chiến lược đầu tư, Dữ liệu & nguồn, Cổng & tính năng), mỗi thuật ngữ có định nghĩa, và không tên nào trong `_Avoid_` trùng một thuật ngữ chuẩn.
- AC-2: Given `CONTEXT.md` và một hồ sơ mẫu có tiêu chí dùng tên bị loại ("tỷ lệ lấp đầy"), When chạy `eval-coverage-lint.js --slug <hồ sơ mẫu>`, Then in W6 chỉ đúng thuật ngữ "Công suất"; và trên ba hồ sơ có sẵn (`portal-deals-airdna`, `ops-access-hardening`, `ui-standards-reui`) không có dòng W6 nào.
- AC-3: Given câu trả lời Q1–Q8 của Mạnh ghi trong `decisions.jsonl`, When dựng lại từ `terms.mjs` (`build.mjs --context --out <tạm>`), Then bản dựng trùng từng byte với `CONTEXT.md` đã commit, và nhãn chuẩn của Q1–Q5 là phương án Mạnh chọn.
- AC-4: Given cây `app/src/app`, When chạy test slug route, Then mọi đoạn URL tĩnh của `page.tsx` (bỏ nhóm `(…)` và tham số `[…]`) là ASCII kebab-case và có trong dòng `Slug URL` của `CONTEXT.md` hoặc trong danh sách ngoại lệ còn hạn.
- AC-5: Given một route tiếng Việt MỚI (đoạn không có trong `Slug URL`, vd. `tim-kiem`), When chạy test slug route, Then test đỏ và nêu đúng đoạn đó; route tiếng Việt đang chạy (`so-sanh`, `phuong-phap`, `dau-tu`) không làm đỏ khi còn trong hạn.
- AC-6: Given một ngoại lệ đã quá hạn, hoặc một slug cũ đã không còn route mà `app/next.config.ts` thiếu redirect vĩnh viễn từ slug cũ sang slug đích, When chạy test slug route, Then test đỏ với lời nhắc tương ứng; mỗi ngoại lệ có slug đích nằm trong `Slug URL`.
- AC-7: Given `AGENTS.md` mục Quy ước, When đọc, Then có luật đặt tên 4 vế (code/API tiếng Anh, RESO khi có · chữ UI tiếng Việt lấy từ `CONTEXT.md` · URL tiếng Anh toàn bộ, ASCII kebab, trừ slug địa lý tên riêng và mã quốc gia · đổi slug kèm redirect vĩnh viễn trong `app/next.config.ts`, làm trong đợt dọn nhóm trang), câu cũ "URL ASCII không dấu (`slugifyName()`)" không còn, và `AGENTS.md`, `.claude/skills/onehub-ui/copy-vi.md`, `docs/architecture/portals.md` đều trỏ tới `CONTEXT.md`.
- AC-8: Given `docs/product/CONTEXT-PRODUCT.md`, When đọc, Then dài ≤ 80 dòng, có đủ 5 mục (người dùng · pipeline 4 giai đoạn · thị trường đang phủ · hai cổng · nguồn dữ liệu và SPL), mỗi mục trỏ ≥ 1 tài liệu nguồn có thật trong repo, và `AGENTS.md` trỏ tới trang này.
- AC-9: Given `CONTEXT.md` và nguồn công thức (`pipeline/sql/300_metrics.sql`, `db/migrations/001_init.sql`, `app/src/lib/yield.ts`), When đối chiếu định nghĩa ADR, Công suất, RevPAR, Doanh thu, Lợi suất gộp/ròng, Then công thức trong định nghĩa khớp cách pipeline/app tính. (judgment)
- AC-10: Given `app/package.json` và `_acceptance/config.yaml`, When chạy `npm run test:lint-rules`, Then test slug route nằm trong bộ chạy (cùng CI `ui-lint`) và có executor riêng trong config.

## Coverage

- Trục vật: CONTEXT.md | AGENTS.md | CONTEXT-PRODUCT.md | test slug route | các tệp trỏ (copy-vi, portals) [thước CE: danh sách giao việc 5 mục]
- Trục người đọc CONTEXT.md: kit (parser + W6) | agent/người viết UI | test slug [thước CE: ba bên gọi `CONTEXT.md` trong repo + kit]
- Trục đoạn URL: tĩnh tiếng Anh | tĩnh tiếng Việt đang chạy (ngoại lệ) | tĩnh tiếng Việt mới | động `[…]` | nhóm `(…)` [thước CE: cây `app/src/app`]
- Trục vòng đời ngoại lệ: còn hạn | quá hạn | đã đổi có redirect | đã đổi thiếu redirect

## Out of scope

- Không đổi code trang, nhãn UI hay route: đổi `/so-sanh`, `/phuong-phap`, `/dau-tu` và chữ lẫn tiếng Anh làm trong đợt dọn của từng nhóm trang (B2/B5).
- Không đổi route API (`/api/zalo-media`, `/api/v1/ops/zalo/*`) — test chỉ phủ route trang.
- Không đổi tên bảng/cột DB hay field code (luật RESO đã có ở ADR-0011).
- Không sửa các chỗ ghi tên nguồn thật trên UI phát hiện khi quét — ghi thành việc tiếp theo.
- Không sửa `routes.md` của skill onehub-ui (phiên Bản đồ đích Invest đang giữ).

## Notes

- Hạng T2: đổi test + docs + `AGENTS.md`; không chạm `t3_paths`.
- `CONTEXT.md` dựng máy từ `_acceptance/glossary-context/terms.mjs` (một nguồn cho bảng chốt và CONTEXT.md); sửa thuật ngữ về sau thì sửa thẳng `CONTEXT.md` — `terms.mjs` chỉ là vật của hồ sơ này.
