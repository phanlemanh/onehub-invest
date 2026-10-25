---
schema_version: 1
feature: Nhà đầu tư mở So sánh ở /compare (301 từ /so-sanh) và Đã lưu, cả hai có PageHeader, trạng thái tải/trống/lỗi, Đã lưu trống dùng c-empty-11
slug: compare-saved-trang-thai
owner: phanlemanh@gmail.com
risk_tier: T2
surfaces: [ui, config]
status: signed-off
design_doc: docs/superpowers/specs/2026-10-24-compare-saved-trang-thai-design.md
approved_by: Mạnh
approved_at: 2026-10-24T14:45:10Z
---

# Acceptance Contract: compare-saved-trang-thai

## Context

Hàng UI4 (phủ GD6) của lộ trình giao diện 23/10, đợt I5 của `routes.md`: So sánh đổi slug sang `/compare` (301 từ
`/so-sanh`, mẫu redirect cho UI2/UI3) và cả hai trang So sánh, Đã lưu dùng PageHeader chuẩn, có đủ trạng thái tải
(skeleton đúng bố cục), trống (Đã lưu dùng `c-empty-11`) và lỗi tại chỗ có Thử lại; gỡ 4 vi phạm lint của nhóm.

Source input: `docs/plan/lo-trinh.json` hàng UI4; ô Cổng Đáng `_acceptance/compare-saved-trang-thai/opportunity.md`
(Mạnh quyết build 23/10; mở lại dãy U1 24/10).

## Criteria

- AC-1: Given app chạy từ cây này, When gọi `GET /so-sanh?areas=<a>,<b>` và `GET /so-sanh` không theo redirect, Then
  cả hai trả **301** với `Location` lần lượt là `/compare?areas=<a>,<b>` và `/compare`; cây route không còn đoạn
  `so-sanh`, `VIET_EXCEPTIONS` không còn dòng `so-sanh` và test slug URL xanh.
- AC-2: Given mã nguồn `app/src` và `scripts/audit-all.sh`, When tìm chuỗi `/so-sanh`, Then không còn chỗ nào (đường
  duy nhất còn nói `/so-sanh` là `source` của redirect trong `app/next.config.ts`); mục nav «So sánh» có `href`
  `/compare` và đang-chọn khi đường bắt đầu bằng `/compare`.
- AC-3: Given `/compare?areas=<thị trường>,<phường>` có số, When tải trang, Then trang có đúng một `<h1>` «So sánh
  khu vực» trong PageHeader với breadcrumb «Việt Nam › So sánh», stat «2/4 khu vực», nút «Thêm khu vực»; bảng có
  tên hai khu vực, hàng lợi suất ghi «Lợi suất ngắn hạn»/«Lợi suất dài hạn» (không còn «Yield ngắn hạn»), và mã lạ
  trong `areas` bị bỏ trước khi đếm (`?areas=<mã lạ>` → «0/4 khu vực»); chọn một khu vực trong hộp «Thêm khu vực» gọi
  `router.replace` sang `?areas=<a>,<b>,<c>` (không `push`), mã đã có không chọn lại được, đủ 4 cột thì nút tắt; ô đầu
  mỗi cột có ảnh đại diện = ảnh chính của một listing tự thu trong khu vực (≤ 3 ảnh ứng viên, ảnh đầu không trùng giữa
  các cột, ảnh chết trên CDN tự lùi sang ứng viên kế, hết ứng viên hoặc khu vực không có ảnh thì ô số RevPAR như cũ).
- AC-4: Given người dùng đã đăng nhập có 3 khu vực lưu (1 thị trường, 2 phường), When tải `/saved`, Then có đúng một
  `<h1>` «Đã lưu» trong PageHeader với breadcrumb «Việt Nam › Đã lưu», stat «3 khu vực», nút «So sánh 3 khu vực»
  trỏ `/compare?areas=` theo thứ tự mới lưu trước, tab «Tất cả 3 · Thị trường 1 · Phường 2» và 3 thẻ khu vực; bấm tab
  «Phường» thì nút thành «So sánh 2 khu vực» chỉ gồm 2 phường, tab «Thị trường» (1 khu vực) thì nút ẩn; khi chưa đăng
  nhập `GET /saved` vẫn trả **307** sang `/login?next=/saved`; thẻ có ảnh đại diện cùng luật AC-3, nhãn loại và nút bỏ lưu
  nằm trên ảnh (đọc được), RevPAR + công suất chuyển xuống dòng dưới tên. Gốc breadcrumb của Đã lưu theo Hỏi-1.
- AC-5: Given vùng số liệu đang chờ, When trang render, Then PageHeader đứng ngoài vùng chờ và vùng hiện skeleton
  đúng bố cục: So sánh = `<Suspense>` có `key` theo danh sách cột, fallback `CompareSkeleton` với cột nhãn + một cột
  mỗi khu vực; Đã lưu = fallback `SavedSkeleton` có hàng tab + đúng số thẻ đã lưu; không có `loading.tsx` ở hai
  segment.
- AC-6: Given truy vấn số liệu trong vùng ném lỗi, When trang render, Then vùng đó hiện Alert «Không tải được …» có
  nút «Thử lại» (gọi `retry()` của `catchError`) trong khi PageHeader vẫn hiện; ranh giới lỗi bọc đúng vùng Suspense
  của mỗi trang (không phải cả trang); `notFound()`/`redirect()` ném trong vùng KHÔNG bị bắt thành Alert. Vế «trên Next
  thật» (lỗi DB trong server component async) theo Hỏi-3.
- AC-7: Given không có khu vực nào, When tải So sánh (`/compare`) hoặc Đã lưu (người dùng chưa lưu gì), Then So sánh
  hiện Empty «Chưa chọn khu vực nào» + nút sang `/vn` và KHÔNG hiện chú thích «Ô xanh…»; Đã lưu hiện `c-empty-11`
  chuyển thể: ô bookmark, «Chưa lưu khu vực nào», ĐÚNG MỘT nút outline «Tìm thị trường» trỏ `/vn`, không có hàng tab.
- AC-8: Given lint baseline `app/eslint-suppressions.json`, When chạy `npx tsc --noEmit && npm run lint` ở `app/`,
  Then cả hai sạch và baseline không còn mục nào cho tệp dưới `components/compare/`, `components/saved/`,
  `app/(app)/compare/`, `app/(app)/saved/`; `<table>` của comparison-1 mang ngoại lệ tại chỗ
  `onehub-ui/no-raw-table -- <lý do>`.
- AC-9: Given tài liệu bản đồ trang, When đọc `routes.md`, `catalog.md`, `CONTEXT.md`, `docs/architecture/portals.md`,
  `.claude/rules/portals.md`, Then dòng `/compare` (đường tệp `(app)/compare/page.tsx`) và `/saved` ghi PageHeader đã
  có + trạng thái mới, catalog có `c-empty-11` → `saved/saved-empty.tsx` và `RegionError`, cổng Invest liệt `/compare`
  thay `/so-sanh`, và test bản đồ route xanh. (judgment)
- AC-10: Given bản chạy ở :3460, When người chấm mở `/compare?areas=…` (3 cột), `/compare` và `/saved` (có dữ liệu, rồi
  trống) ở 1280 px sáng, 1280 px tối và 375 px, Then PageHeader đọc được ở mọi khổ, trang không cuộn ngang (bảng cuộn
  trong khung), ô tốt nhất đọc rõ ở cả hai chế độ, trạng thái trống có đúng một hành động. (judgment)

## Coverage

- Trục A — trang: So sánh | Đã lưu | lối vào (nav, Insight, navbar marketing, nút So sánh của Đã lưu, link cũ
  `/so-sanh`) [thước CE: `routes.md` dòng `/so-sanh`, `/saved` + grep `/so-sanh` trên `app/src`, `scripts/` —
  SUY-TỪ-REPO: `.claude/skills/onehub-ui/routes.md`]
- Trục B — trạng thái vùng: có dữ liệu | đang tải | trống | trống theo tab | lỗi | chưa đăng nhập | mã lạ
  [thước CE: luật trạng thái ReUI «Every data region: empty state with an action, Skeleton loading, inline error with
  Retry» (AGENTS.md › ReUI design rules 5) + bảng trạng thái của design doc; NGÀNH: Nielsen Norman Group «Designing
  Empty States in Complex Applications» — trống phải nói lý do + một hành động]
- Trục C — khổ × giao diện: 1280 sáng | 1280 tối | 375 sáng [thước CE: `onehub-ui/loop.md` bước 8 (sáng, tối, 390)]
- Ô Core → AC: A×redirect → AC-1, AC-2 · So sánh×có dữ liệu → AC-3 · Đã lưu×có dữ liệu/chưa đăng nhập → AC-4 ·
  B×tải → AC-5 · B×lỗi → AC-6 · B×trống → AC-7 · C × mọi trang → AC-10; AC-8/AC-9 là cross-cutting (lint, tài liệu).
- Later: trống theo tab của Đã lưu chỉ có máy kiểm gián tiếp (không AC riêng — hành vi có sẵn, chỉ đổi Badge); tối
  ở 375 px không chụp riêng.
- Never: skeleton bằng `loading.tsx` cấp segment (mất mã 307 của `/saved`) — xem sổ quyết định.

## Đường đo

- bỏ đường-đo — ô Cổng Đáng không khai ngưỡng sống/chết (các ô «…» để trống); chờ Mạnh quyết ở Hỏi-2 (entry d-20261024T141037Z-15)

## Out of scope

- Khay So sánh từ bảng xếp hạng Finder (GD13), Đã lưu thêm listing + báo cáo lợi suất (GD15), nút Chia sẻ (GD14).
- Đổi «Yield …» trên bảng Insight (`components/insight/insight-tables.tsx`) — nhóm trang Insight.
- Chuyển bảng so sánh sang data-grid (routes.md chốt giữ comparison-1).
- Lỗi ở phần đọc nhẹ đầu trang (chỉ mục khu vực, danh sách lưu) — vẫn rơi về `(app)/error.tsx` cả trang.
- Dọn `shadow-xs`/`text-xs` trên nút của `insight-actions.tsx` (chỉ đổi đường dẫn ở đây).
- Ảnh đại diện ở các trang khác (Finder, Insight, Duyệt listing) và ảnh cho dự án, tin đăng — đề xuất hàng mới (yêu cầu
  U1-3); ảnh dự án không lấy từ S08 vì S08 không lên cổng Invest (AGENTS.md luật 5).

## Notes

- Known limits — chọn ở Cổng Bằng chứng 2026-10-25:
  - Ngoài-1: Bộ kiểm khung chờ chỉ thử một cỡ (3 cột/thẻ); một lần sửa sau làm khung chờ sai số cột có thể không bị bắt.
  - Ngoài-3: Cấu hình design-pass dùng chung ghim cổng 3460 của dãy U1; design-pass của dãy khác phải tự truyền bản chạy của mình.
  - Ngoài-5: Khi bảng So sánh đã báo lỗi, đổi khu vực vẫn hiện lỗi cũ cho tới khi bấm «Thử lại».
- Bản chạy cho bằng chứng: dev server cổng riêng **3460** (`.claude/launch.json` cấu hình `app-3460`) — 3456 dùng
  chung giữa các dãy (LUAT đợt dot0, mục «Dãy giao diện U1, U2»).
- `/saved` cần đăng nhập: smoke tự tạo người dùng thử + session ghi thẳng DB local (mẫu `smoke-review-photos.mjs`),
  xoá sau mỗi lượt; người chấm giao diện dùng tài khoản thử riêng của dãy U1 ở `state/compare-saved-trang-thai/u1-test-account.json`
  (gitignored, DB local; không xoay `ops-test@local.test` đang dùng chung).
- Bốn câu chờ Mạnh ở Cổng Phạm vi: Hỏi-1 gốc breadcrumb Đã lưu · Hỏi-2 bỏ đường-đo · Hỏi-3 chứng lỗi tại vùng trên Next
  thật bằng design-pass · Hỏi-4 ảnh đại diện khu vực = ảnh một listing tự thu (góp ý của Mạnh ở cổng, 24/10).
- Ảnh CDN: đo mẫu 25 ảnh chính ngày 24/10 thì 6 ảnh trả 404 — lý do có 3 ứng viên + đường lùi.
