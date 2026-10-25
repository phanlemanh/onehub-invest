---
schema_version: 1
feature: Nhà đầu tư mở /listing/[id] thấy đầu trang product-detail-5, ảnh tự thu khi có (không có thì ẩn gallery), lịch form-5 không còn điều khiển thô, vùng dữ liệu có Skeleton và Empty
slug: listing-detail-product-detail-5
owner: phanlemanh@gmail.com
risk_tier: T2
surfaces: [ui]
status: signed-off
design_doc: docs/superpowers/specs/2026-10-25-listing-detail-product-detail-5-design.md
approved_by: Mạnh
approved_at: 2026-10-25T10:40:01Z
---

# Acceptance Contract: listing-detail-product-detail-5

## Context

Hàng UI5 (phủ GD3) của lộ trình giao diện 23/10, đợt I3 của `routes.md`: trang chi tiết listing `/listing/[id]` thay
lưới ảnh vẽ tay bằng đầu trang `@reui/product-detail-5` (gallery ảnh tự thu + hộp Đặc điểm), gỡ 3 vi phạm lint của
lịch `form-5` (2 nút tay + cỡ chữ 9px), và cho mọi vùng dữ liệu đủ trạng thái tải (skeleton), trống (Empty có hành
động), lỗi tại chỗ (Thử lại). Ảnh AirDNA đã gỡ khỏi Invest ở hồ sơ `listing-airdna-photos` (luật 5) — giữ nguyên.

Source input: `docs/plan/lo-trinh.json` hàng UI5; ô Cổng Đáng `_acceptance/listing-detail-product-detail-5/opportunity.md`
(Mạnh quyết build 23/10); `.claude/skills/onehub-ui/routes.md` dòng `/listing/[id]`.

## Criteria

- AC-1: Given listing có ≥ 2 ảnh tự thu (`listings.photo_urls`), When mở `/listing/<id>` ở 1280 px, Then dưới
  PageHeader là đầu trang hai cột — trái gallery (ảnh chính khung 3:2 bản lớn `?aki_policy=x_large` — ảnh ngang phủ kín, ảnh dọc/vuông (rộng/cao < 1,2) hiện trọn trên nền không cắt — + dải thumbnail
  ≤ 10 ảnh bản `?im_w=480`, ảnh 1 chọn sẵn), phải hộp «Đặc điểm»; dải thumbnail luôn là MỘT hàng trượt ngang ô vuông 1:1 (thấy 5
  ảnh vừa khung, nhiều hơn thì cuộn ngang trong khung, không xuống dòng — Mạnh sửa ở Cổng Phạm vi); bấm thumbnail thứ
  k hay dùng phím mũi tên trong nhóm thumbnail thì ảnh chính đổi sang ảnh đó (alt «Ảnh k/N — <tên>»), đúng một
  thumbnail mang `aria-checked=true`, và dải tự trượt để thumbnail đang chọn nằm trọn trong khung mà trang không cuộn
  dọc; ở 375 px hai khối xếp dọc. Một ảnh thì không có dải thumbnail.
- AC-2: Given listing không có ảnh tự thu (`photo_urls` null hoặc rỗng), When mở trang, Then không có gallery, không có
  `<img>` nào trong đầu trang, không khung giữ chỗ hay ảnh giả; hộp Đặc điểm chiếm cả bề ngang (bảng hai cột từ `sm`).
- AC-3: Given một ảnh của gallery trả lỗi từ CDN (kể cả lỗi xảy ra trước khi hydrate), When trang chạy, Then ảnh đó rời
  gallery (thumbnail còn N−1, ảnh chính lùi về ảnh sống đầu tiên với alt «Ảnh 1/N−1 — …»); mọi ảnh đều lỗi thì đầu
  trang về đúng bố cục của AC-2.
- AC-4: Given bản ghi listing, When đọc hộp Đặc điểm, Then có các dòng Loại phòng · Phòng ngủ («Studio» khi 0) ·
  Phòng tắm · Sức chứa · Đặt tối thiểu · Đánh giá · Phường · Thị trường theo thứ tự đó, trường null thì không có dòng;
  Phường/Thị trường là link Insight; có đúng một nút «Mở trên Airbnb» trỏ `https://www.airbnb.com/rooms/<số>` khi id dạng
  `abnb_<số>` (không có thì không nút); PageHeader chỉ còn một badge loại phòng (không lặp các đặc điểm khác).
- AC-5: Given `app/src/components/listing/booking-heatmap.tsx`, When chạy `npx tsc --noEmit && npm run lint` ở `app/`,
  Then cả hai sạch, tệp không còn `<button>` tay hay cỡ chữ `text-[…]`, `app/eslint-suppressions.json` không còn khoá
  nào dưới `src/components/listing/` hay `src/app/(app)/listing/` (baseline giảm 3); mỗi đêm vẫn là một nút có nhãn
  «<Thứ>, <ngày>: <trạng thái>» nhận focus bằng Tab, ba mục tóm tắt vẫn mở tooltip bằng bàn phím.
- AC-6: Given listing có 0 đêm lịch, When mở trang, Then khung «Lịch 0 đêm tới» hiện Empty «Chưa có lịch cho listing
  này» với đúng một hành động «Xem lịch trên Airbnb» (không có link Airbnb → «Tìm thị trường» `/vn`); có lịch thì vẽ
  heatmap như cũ.
- AC-7: Given hai vùng số liệu phụ — hàng KPI (truy vấn peers) và «Listing tương tự» (truy vấn comps), When trang render,
  Then mỗi vùng là `RegionError > Suspense` với skeleton đúng bố cục (4 ô KPI; khung bảng có tiêu đề «Listing tương
  tự») và lỗi trong vùng hiện Alert «Không tải được chỉ số của listing» / «Không tải được listing tương tự» + «Thử lại» chỉ tại vùng đó (vùng kia và đầu trang vẫn đứng); PageHeader, đầu trang và lịch nằm
  ngoài mọi ranh giới lỗi; comps 0 dòng hiện Empty «Chưa có listing tương tự» với đúng một hành động «Duyệt listing ở
  <thị trường>» trỏ `<marketPath>/listings` (thiếu thị trường → «Tìm thị trường» `/vn`) thay vì ẩn vùng.
- AC-8: Given cùng bản ghi và cùng peers, When dựng bốn ô KPI, Then giá trị, bậc và footer giữ đúng công thức trước
  UI5 (bậc giá ≥ p90 Cao cấp · ≥ p60 Trên trung vị · ≥ p30 Tầm trung · dưới Giá thấp; công suất ghi chú «chưa báo giá»
  khi giá null; doanh thu 0 → «—»); mọi `<img>` của đầu trang thuộc `photo_urls` tự thu, `getListingDetail` không đọc
  bảng `airdna_*` và trang không có chữ AirDNA (luật 5).
- AC-9: Given tài liệu chuẩn UI, When đọc `routes.md` và `catalog.md` của `onehub-ui`, Then dòng `/listing/[id]` ghi đầu
  trang product-detail-5 đã xong cùng các tệp mới và trạng thái vùng, catalog có dòng `@reui/product-detail-5` → tệp
  chuyển thể (kèm lý do không giữ bản gốc trong `blocks/`) và dòng `form-5` ghi việc gỡ nút tay; test bản đồ route xanh.
  (judgment)
- AC-10: Given bản chạy ở :3460, When người chấm mở một listing có ảnh, một listing không ảnh và một listing chưa có
  lịch ở 1280 px sáng, 1280 px tối và 375 px, Then đầu trang đọc được (ảnh, Đặc điểm, nút), thumbnail đang chọn phân
  biệt rõ ở cả hai chế độ, trang không cuộn ngang, Empty lịch có đúng một hành động; sàn a11y/contrast của design-gate
  trên `listing-hero.tsx` không có P0. (judgment)

## Coverage

- Trục A — dữ liệu ảnh: ≥ 2 ảnh | 1 ảnh | 0 ảnh (null/rỗng) | một ảnh chết | mọi ảnh chết [thước CE: câu giao UI5
  «ảnh tự thu khi có (không có thì ẩn gallery)» — SUY-TỪ-REPO: `docs/plan/lo-trinh.json` hàng UI5 + `routes.md` dòng
  `/listing/[id]`; đo mẫu DB local 25/10: 495/508 listing có ảnh, ảnh CDN chết đo được ở hồ sơ compare-saved (6/25)]
- Trục B — trạng thái vùng: có dữ liệu | đang tải | trống | lỗi, trên ba vùng KPI · lịch · comps [thước CE: AGENTS.md
  › ReUI design rules 5 «Every data region: empty state with an action, Skeleton loading, inline error with Retry»]
- Trục C — tương tác gallery: chuột | phím (mũi tên, Tab) [thước CE: block gốc product-gallery dùng radiogroup + roving
  tabindex + phím mũi tên — SUY-TỪ-REPO: bản cài thử `@reui/product-detail-5` 25/10]
- Trục D — khổ × giao diện: 1280 sáng | 1280 tối | 375 sáng [thước CE: `onehub-ui/loop.md` bước 8]
- Ô Core → AC: A×≥2/1 → AC-1 · A×0 → AC-2 · A×chết → AC-3 · Đặc điểm → AC-4 · lịch×lint → AC-5 · lịch×trống → AC-6 ·
  B×(KPI, comps)×(tải, lỗi, trống) → AC-7 · số + luật 5 → AC-8 · tài liệu → AC-9 · D → AC-10.
- Later: lịch đang tải / lỗi riêng — lịch đi cùng bản ghi listing (một truy vấn), không phải vùng tải riêng; lỗi bản
  ghi rơi về `(app)/error.tsx` như cũ. Tối ở 375 px không chụp riêng.
- Never: giữ bản gốc block trong `blocks/` (kéo `ui/carousel.tsx` đỏ lint) — xem sổ quyết định.

## Đường đo

- bỏ đường-đo — ô Cổng Đáng không khai ngưỡng sống/chết (các ô «…» để trống), hàng giao diện ship thẳng; entry descope trong sổ quyết định.

## Out of scope

- Trang Duyệt listing `/[country]/[market]/listings` và thẻ listing (UI6).
- Nút Chia sẻ trên Listing (GD14), lưu listing vào Đã lưu (GD15).
- Giá theo đêm trong hộp Đặc điểm — giữ ở ô KPI «Giá niêm yết» (Hỏi-1).
- Hiển thị `propertyType` (chuỗi tiếng Anh thô của Airbnb, chưa có bảng dịch).
- Trạng thái tải/lỗi riêng cho lịch (đi cùng bản ghi listing).
- Áp quy định khung ảnh (3:2 + 1:1) cho Đã lưu, So sánh, thẻ deal Ops — theo dần ở hàng của từng trang (Mạnh 25/10); UI5 chỉ ghi luật vào catalog và áp cho gallery listing.

## Notes

- Known limits — chọn ở Cổng Bằng chứng 2026-10-26:
  - Ngoài-1: Bảng so sánh trên trang listing tên «Listing tương tự», từ điển sản phẩm gọi là «Listing so sánh» — hai tên cho một thứ tới khi đổi nhãn đồng loạt.
  - Ngoài-2: Cùng trang viết số phòng ngủ hai kiểu: «2 phòng ngủ» ở hộp Đặc điểm, «2 PN» ở bảng so sánh.
  - Ngoài-4: Rê chuột lên ảnh nhỏ thì ảnh sáng dần (mờ → rõ) thay vì đổi màu theo chuẩn hệ thiết kế.
  - Ngoài-5: Smoke trình duyệt đo bản chạy ở cổng 3460 mà không kiểm đó có phải bản của nhánh này.
  - Trong hợp đồng (S4-r2, AC-5): Test jsdom không bắt được nút đêm bị đưa ra khỏi thứ tự Tab; chỉ smoke Chromium chứng phím Tab vào được ô đêm (một ô).

- Bản chạy cho bằng chứng: dev server cổng riêng **3460** của dãy U1 (`.claude/launch.json` cấu hình `app-3460`); smoke
  `scripts/smoke-listing-detail.mjs` mặc định `BASE_URL=http://localhost:3460`.
- Ảnh chết được dựng bằng chặn mạng trong Chromium (CDN trả 404 cho đúng ảnh chọn) — không sửa DB.
- Hồ sơ đã ký có `paths` chạm trang listing (vd `listing-airdna-photos`) sẽ cần ghim lại sau khi gộp main — xin khoá
  `ghim-lai` theo LUAT đợt.
