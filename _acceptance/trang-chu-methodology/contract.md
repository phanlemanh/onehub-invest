---
schema_version: 1
feature: Khách mở trang chủ và /methodology (301 từ /phuong-phap) thấy định nghĩa dạng faq-3, hero và thẻ thị trường không còn màu cứng, lỗi nhóm marketing có error.tsx và lỗi toàn cục có global-error.tsx
slug: trang-chu-methodology
owner: phanlemanh@gmail.com
risk_tier: T2
surfaces: [ui, config]
status: draft
design_doc: docs/superpowers/specs/2026-10-25-trang-chu-methodology-design.md
---

# Acceptance Contract: trang-chu-methodology

## Context

Hàng UI2 (phủ GD7) của lộ trình giao diện 23/10, đợt I6 của `routes.md` (phần trang chủ + Phương pháp): trang
Phương pháp đổi slug sang `/methodology` (301 từ `/phuong-phap`, theo mẫu redirect của UI4) và trình định nghĩa
mở sẵn theo `faq-3`; nền hero và dải diện tích thẻ thị trường thôi dùng màu cứng; nhóm trang marketing có ranh giới
lỗi riêng và app có trang lỗi toàn cục tiếng Việt; gỡ 18 vi phạm lint của nhóm.

Source input: `docs/plan/lo-trinh.json` hàng UI2; ô Cổng Đáng `_acceptance/trang-chu-methodology/opportunity.md`
(Mạnh quyết build 23/10). Nhánh chồng lên UI4 (`feat/compare-saved-trang-thai`, PR #72) cho tới khi UI4 vào main.

## Criteria

- AC-1: Given app chạy từ cây này, When gọi `GET /phuong-phap` và `GET /phuong-phap?x=1` không theo redirect, Then
  cả hai trả **301** với `Location` lần lượt là `/methodology` và `/methodology?x=1`; `GET /methodology` trả 200;
  cây route không còn đoạn `phuong-phap`, `VIET_EXCEPTIONS` không còn dòng `phuong-phap` và test slug URL xanh.
- AC-2: Given mã nguồn `app/src` và `scripts/`, When tìm chuỗi `/phuong-phap`, Then không còn chỗ nào (đường dẫn duy
  nhất còn lại là `source` của redirect trong `app/next.config.ts`); trang chủ, navbar marketing, chân trang chung và
  trang đăng nhập đều có link `href="/methodology"`.
- AC-3: Given khách mở `/methodology`, When trang tải xong mà chưa bấm gì, Then đọc được MỌI câu hỏi và câu trả lời
  của ba mục Chỉ số (7), Mô hình lợi suất (4), Nguồn dữ liệu (4) — không có nút mở/đóng nào (`aria-expanded` vắng);
  có đúng một `h1`, mục lục trỏ `#chi-so`, `#loi-suat`, `#nguon` và mỗi mục mang đúng id ấy; mỗi ô định nghĩa mang id
  riêng (vd `#revpar`) để link sâu tới; Badge «Mô phỏng» vẫn ở câu «Giá bán và giá thuê dài hạn».
- AC-4: Given `/methodology` ở khổ ≥ 768 px, When nhìn lưới định nghĩa, Then mỗi mục là lưới hai cột kẻ mảnh của
  faq-3 (một cột ở 375 px, không cuộn ngang); cuối trang có hàng hai nút «Xem thị trường» → `/vn` và «Ước tính lợi
  suất» → `/yield`.
- AC-5: Given `frame-backdrop.tsx` và `hero.tsx`, When quét mã, Then không còn mã màu cứng (`#rgb`, `rgb(`, `hsl(`,
  `oklch(`); mọi màu của bản vẽ nền là `var(--color-<sắc>-<bậc>)` có thật trong palette Tailwind của app; hero ở
  sáng và tối vẫn là nền xanh có dải sáng như trước (ảnh trước/sau).
- AC-6: Given thẻ thị trường trang chủ, When vẽ với dữ liệu thật, Then dải diện tích vẫn vẽ từ doanh thu theo tháng
  của chính thị trường đó, mọi lớp màu palette có cặp `dark:` trong cùng chuỗi; When không có thị trường nào, Then
  vùng thẻ là `Empty` «Chưa có thị trường nào có số» với đúng một hành động trỏ `/methodology#nguon`.
- AC-7: Given một trang thuộc nhóm marketing ném lỗi khi dựng, When khách mở trang ấy, Then navbar và chân trang
  vẫn hiện, vùng nội dung là Alert lỗi «Không tải được dữ liệu» (kèm mã lỗi khi có) với nút «Thử lại»; bấm «Thử lại»
  gọi `retry()` (tải lại từ server), không gọi `reset()`.
- AC-8 (cross-layer): Given layout (gốc hoặc của một cổng) ném lỗi — vd DB sập làm layout marketing hỏng, When khách mở trang, Then thấy trang lỗi toàn cục tiếng Việt:
  tài liệu riêng `<html lang="vi">` + `<body>`, Alert «One Invest không mở được» kèm mã lỗi, nút «Thử lại» gọi
  `retry()` và link «Về trang chủ» `href="/"`; đọc được ở sáng và tối.
- AC-9: Given `npm run lint` + `tsc --noEmit` ở `app/`, When chạy, Then sạch; `app/eslint-suppressions.json` không
  còn khoá nào của `src/components/marketing/` hay `src/app/(marketing)/` (baseline giảm đúng 18: 13
  `no-hardcoded-color`, 4 `no-raw-palette`, 1 `no-banned-motion`); nút «Bắt đầu» của navbar không còn `transition-all`.
- AC-10: Given tài liệu chuẩn UI, When đọc, Then `routes.md` khớp cây route (dòng `(marketing)/methodology/page.tsx`
  với block `faq-3`; không còn `(marketing)/phuong-phap/page.tsx`) và nói nhất quán với `catalog.md`, `app/CLAUDE.md`
  rằng Phương pháp ở `/methodology` (301 từ `/phuong-phap`) dùng faq-3 mở sẵn, trang chủ giữ faq-6, có lỗi trang
  marketing và lỗi toàn cục.

## Coverage

Quét hình thái (preset entity-feature, chân sản phẩm: routes.md/catalog.md/CONTEXT.md [SUY-TỪ-REPO], chân ngành:
`@reui/faq-3` + Next 16 file-conventions/error.md [NGÀNH: ReUI, Next.js]):

- Trục **bề mặt**: trang chủ | `/methodology` | link cũ `/phuong-phap` | ranh giới lỗi nhóm | lỗi toàn cục
  [thước CE: routes.md hai dòng I6 + câu giao 4 vế] → AC-1..8.
- Trục **trạng thái**: mặc định | trống (0 thị trường) | lỗi trang | lỗi layout | link sâu / redirect
  [thước CE: luật ReUI «mỗi vùng dữ liệu có trống/tải/lỗi» + bảng ST trong design doc] → AC-3, AC-6, AC-7, AC-8;
  trạng thái **tải** của trang chủ: Later (descope có tên).
- Trục **khổ × giao diện**: 1280 sáng | 1280 tối | 375 sáng [thước CE: `onehub-ui/loop.md` bước nhìn] → AC-4, AC-5,
  AC-7, AC-8 (mỗi AC một eval ui-check: E16, E20, E21, E22); Empty thẻ thị trường chỉ đo ở jsdom (E9) — DB local
  luôn có thị trường nên không chụp được.
- Trục **lớp đo**: HTTP (redirect, HTML server, bản build với DB chết) | cây mã (quét chuỗi, lint) | DOM jsdom (lỗi,
  Empty) | mắt (ảnh) → mỗi AC có ít nhất một lớp máy; AC-4/5/7/8 thêm lớp mắt; AC-8 thêm lớp backend-effect (E19).
- Cross-cutting: luật cổng (Invest công khai, không số AirDNA, chỉ nhãn tầng C) — trang Phương pháp giữ nguyên câu
  «Có dùng AirDNA không?» (chỉ nội bộ).

## Out of scope

- Trạng thái tải (skeleton/Suspense) cho trang chủ — trang chờ đủ số rồi mới vẽ như trước; Later.
- `(app)/error.tsx` vẫn truyền `reset` (không tải lại từ server) — đổi sang `retry` là việc của nhóm trang app, không
  phải hàng này.
- Trang `/login`, `/register` (phần auth của đợt I6) — giữ auth-4/auth-5, chỉ đổi link Phương pháp.
- Gắn ⓘ trên ô KPI trỏ `/methodology#<id>` — hàng này chỉ dựng đích (id từng ô).
- Bản dịch/bố cục lại nội dung định nghĩa — chữ giữ nguyên văn.
- Màu bản vẽ nền hero khác nhau giữa sáng và tối — giữ một bản vẽ cho cả hai như trước.

## Notes

- Mẫu redirect: dòng `/so-sanh` của UI4 (`statusCode: 301`). Nhánh UI2 chồng trên nhánh UI4 để không đụng
  `next.config.ts` / `route-slugs.test.mjs`; khi UI4 vào main thì gộp main vào nhánh UI2 trước khi mở PR.
- Đường nền đầu vòng đỏ hai dòng có sẵn, không do vòng này: bộ kiểm báo thiếu `executors.design.ui_check` (bản kit
  2.32.0) dù tệp có trên đĩa — chưa rõ nguyên do, không eval nào của hồ sơ này dùng khoá ấy; và lưới so với merge-base cũ thấy bằng chứng UI4 hoá cũ (so với `origin/main` thì sạch).
