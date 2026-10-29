---
schema_version: 1
feature: Vai người xem (viewer) vào được Cổng Ops nhưng không thấy nội dung thẻ duyệt và bài gốc — chỉ vai vận hành trở lên thấy
slug: viewer-khong-thay-the-duyet
owner: phanlemanh@gmail.com
risk_tier: T3      # máy suy: app/src/lib/ops-access.ts (t3_paths)
surfaces: [ui]
status: verified
approved_by: Mạnh
approved_at: 2026-10-29
design_doc: docs/superpowers/specs/2026-10-27-viewer-khong-thay-the-duyet-design.md
---

# Acceptance Contract: viewer-khong-thay-the-duyet

## Context

Ngoài-9 của TV1: vai `viewer` qua `canAccessOps` nên `/ops/review` vẽ nội dung thẻ duyệt và `/ops/data-flow` đưa bài gốc
xuống trình duyệt cho nó, trái luật 6 («thẻ duyệt … cho vai `ops` trở lên»). Vòng này che hai chỗ ấy theo một hàm bậc vai.

Source input: `_acceptance/viewer-khong-thay-the-duyet/opportunity.md`.

## Criteria

- AC-1: Given người ở các vai user, viewer, ops, admin, owner và email trong `OPS_EMAILS`, When gọi `xemNoiDungTin`, Then user và viewer nhận false, ops, admin, owner và email `OPS_EMAILS` nhận true.
- AC-2: Given lược đồ tạm có ba thẻ chờ thuộc hai loại, mỗi thẻ mang chuỗi nhận diện riêng trong tiêu đề, bằng chứng, gợi ý và lý giải, When dựng `/ops/review` (ReviewContent) cho vai viewer, Then trang hiện tổng 3 thẻ chờ và số theo từng loại cùng câu «Nội dung thẻ chỉ hiện cho vai Vận hành trở lên.»; không chuỗi nhận diện nào có trong HTML, trong props của mọi phần tử của cây trả về, hay trong các dòng mà DB trả cho trang. (cross-layer)
- AC-3: Given cùng dữ liệu thẻ và bản ghi dòng chảy có bài gốc, When dựng hai trang (/ops/review, thân /ops/data-flow) cho sáu kiểu người (user, viewer, ops, admin, owner, email `OPS_EMAILS` với role user), Then nội dung thẻ và bài gốc có mặt đúng ở bốn kiểu ops trở lên và vắng ở user, viewer (ma trận 6 × 2 viết trước); cờ xem bài gốc trao cho DataFlowView bằng false ở user, viewer và true ở bốn kiểu còn lại.
- AC-4: Given bản ghi dòng chảy có bài gốc, When dựng thân `/ops/data-flow` cho vai viewer, Then dữ liệu trao cho thành phần client có `postText` và `postGroup` bằng null ở mọi bản ghi và không chuỗi bài gốc nào có trong props; thân trang tự đọc người đang đăng nhập (`getUser` mặc định là phiên đăng nhập thật). (cross-layer)
- AC-5: Given sheet của một bản ghi có bài gốc, When mở sheet với cờ không xem bài gốc, Then sheet hiện «Bài gốc chỉ hiện cho vai Vận hành trở lên.» và không hiện bài; với cờ được xem thì hiện bài và tên nhóm.
- AC-6: Given lược đồ «như máy chủ» (vắng review_queue và bảng nạp), When dựng hai trang cho vai viewer và vai ops, Then cả hai vai nhận đúng khuôn cloud như hôm nay: /ops/review có số thẻ chờ + thông báo «chỉ có ở máy thu»; /ops/data-flow (khuôn cloud của DF1) trao cùng dữ liệu tin cho hai vai, không bản ghi nào mang bài gốc, sheet bản ghi ghi «Bài gốc chỉ xem ở máy thu.», và HTML của viewer trùng HTML của ops.
- AC-7: Given cây sau sửa, When chạy bộ test app (gồm bộ quét chữ hiển thị của cổng Ops ops-nhan-theo-context và các ca thử cũ ops-dong-chay, review-media, o-kpi-chi-do-local, ops-review-sources-cloud), Then tất cả xanh.
- AC-8: Given mọi `page.tsx` dưới `app/src/app/ops/` và mọi `route.ts` dưới `app/src/app/api/` của cổng Ops, When đối chiếu với bảng kiểm kê viết trước (route → có đọc thẻ duyệt, bài gốc hay ảnh tin không → cách che với vai dưới Vận hành), Then mỗi route trong cây có đúng một dòng trong bảng, mỗi route đọc nội dung đi qua `xemNoiDungTin` hoặc `isAdmin`; một route mới đọc `review_queue` mà không khai thì ca đỏ, nêu tên route.
- AC-9: Given tài khoản thử vai viewer trên DB local và app dev chạy từ worktree, When đăng nhập và mở `/ops/review` rồi `/ops/data-flow` (mở sheet một bản ghi có bài gốc), Then màn hình hiện hai câu chú thích và không hiện tiêu đề thẻ hay bài gốc nào; cùng màn với tài khoản thử admin hiện nội dung. (cross-layer)

## Coverage

Quét bằng morphological-scan, preset test-matrix:
- Trục A — vai: user | viewer | ops | admin | owner | OPS_EMAILS [thước CE: BAC_VAI của ops-access.ts]
- Trục B — chỗ đưa nội dung: /ops/review thẻ | /ops/data-flow bài gốc | sheet bản ghi | mọi route Ops khác (kiểm kê) [thước CE: khảo sát 27/10 trong design doc + bảng kiểm kê AC-8]
- Trục C — môi trường: máy thu (có bảng tầng A) | cloud (vắng bảng; /ops/data-flow theo khuôn cloud DF1) [thước CE: localOnlyTable ở /ops/review, flow.mode ở /ops/data-flow]
- Cắt ngang: dữ liệu bị che không xuống trình duyệt (props client), chữ chú thích theo CONTEXT.md.

## Out of scope

- Định danh tài khoản thu trong `GET /api/v1/ops/collections` và cột tài khoản ở `/ops/collections` (Hỏi-1 — khuyến nghị mở hàng riêng).
- `group_key` nhóm S05 ở `GET source-groups`; khoá `airdna*` ở `truthful-coverage`.
- Đưa nội dung thẻ, bài gốc lên cloud.

## Notes

- Chưa ai mang vai viewer (đo 27/10): local user=1, admin=2; cloud admin=1. Tài khoản thử vai viewer `viewer-test@local.test` chỉ trên DB local (khuôn `scripts/dev-ops-account.mjs`, không lên cloud).
