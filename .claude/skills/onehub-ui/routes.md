# Bản đồ route → bề mặt → archetype → họ khung

Mỗi `page.tsx` dưới `app/src/app` đúng một dòng. Thêm, xoá hay dời trang thì sửa bảng
này **cùng commit**: `app/eslint-plugin-onehub-ui/tests/routes-map.test.mjs` đối chiếu
cột 2 với cây thư mục và đỏ khi lệch (chạy trong `npm run test:lint-rules` và CI `ui-lint`).

- Bề mặt và archetype: tên nguyên văn từ `.claude/skills/reui/rules/compose.md`.
- Họ khung là **đích**. Nếu khác hiện trạng, cột Ghi chú nói rõ, kèm đợt B dọn nó.
- "khung trang: PageHeader" = `components/page/page-header.tsx` (breadcrumb, tiêu đề 1–3 chữ,
  mô tả 1 mệnh đề, actions bên phải). Bắt buộc cho mọi trang operational ở cả hai cổng.
- Cổng: `/ops/**` là Ops (bắt buộc đăng nhập), còn lại là Invest. Xem `docs/architecture/portals.md`.

| Route | File (từ `app/src/app`) | Bề mặt | Archetype | Họ khung | Ghi chú |
|---|---|---|---|---|---|
| `/` | `(marketing)/page.tsx` | marketing | Marketing spine | Frame | Không PageHeader: navbar-12 + hero-8 là đầu trang. Sau đó card-29, how-it-works-1, faq-6. Frame vì hero-8, card-29, faq-6 gốc dùng Frame (how-it-works-1 đã đổi Card → Frame) |
| `/phuong-phap` | `(marketing)/phuong-phap/page.tsx` | marketing | Marketing spine | Frame | Không PageHeader. Badge eyebrow + tiêu đề + 3 khối faq-6 (định nghĩa) |
| `/login` | `(auth)/login/page.tsx` | flow | Auth card | Frame | Không PageHeader. auth-4 gốc là Frame, giữ nguyên. `?mode=register` chuyển sang `/register` |
| `/register` | `(auth)/register/page.tsx` | flow | Auth card | Frame | Không PageHeader. auth-5 (hero + form chia đôi), gốc là Frame |
| `/[country]` | `(app)/[country]/page.tsx` | operational | Dashboard grid | Frame | khung trang: PageHeader (chưa có, B2). Finder: xếp hạng `InsightGrid` + choropleth. Cấp chưa tự thu dùng biến thể "đang thu thập" |
| `/[country]/[market]` | `(app)/[country]/[market]/page.tsx` | operational | Record detail | Frame | khung trang: PageHeader (đã có, qua `InsightPage`). View track `InsightNav` |
| `/[country]/[market]/[submarket]` | `(app)/[country]/[market]/[submarket]/page.tsx` | operational | Record detail | Frame | khung trang: PageHeader (đã có, qua `InsightPage`). Cùng template thị trường, thêm benchmark với phường anh em |
| `/[country]/[market]/listings` | `(app)/[country]/[market]/listings/page.tsx` | operational | Table-backed management | Frame | khung trang: PageHeader (đã có). Danh sách thẻ product-grid-2 + `ListingsMap` thay cho data-grid |
| `/[country]/[market]/map` | `(app)/[country]/[market]/map/page.tsx` | redirect | — | — | Chỉ `redirect()` sang `/[country]?level=submarket&market=…&view=map` (giữ link cũ). Không có UI |
| `/[country]/[market]/dau-tu` | `(app)/[country]/[market]/dau-tu/page.tsx` | operational | Dashboard grid | Frame | khung trang: PageHeader (chưa có). Đừng sửa khi `fix/portal-deals-airdna` chưa merge; dọn ở B5 |
| `/listing/[id]` | `(app)/listing/[id]/page.tsx` | operational | Record detail | Frame | khung trang: PageHeader (đã có). `StatTiles` → heatmap form-5 → `CompsTable` |
| `/yield` | `(app)/yield/page.tsx` | operational | Dashboard grid | Frame | khung trang: PageHeader (đã có). form-11 → `StatTiles` → chart-36 → `CompsTable`. Luôn có badge "DỮ LIỆU MÔ PHỎNG" |
| `/so-sanh` | `(app)/so-sanh/page.tsx` | operational | Table-backed management | Frame | khung trang: PageHeader (chưa có, B2). Bảng là comparison-1, không phải data-grid. Thêm cột bằng hộp c-command-5 |
| `/saved` | `(app)/saved/page.tsx` | operational | Frame stack | Frame | khung trang: PageHeader (chưa có, B2). wishlist-2: Tabs theo loại + thẻ khu vực |
| `/deals` | `(app)/deals/page.tsx` | operational | Table-backed management | Frame | dense. khung trang: PageHeader (chưa có). Sẽ dời sang `/ops/deals` (nhánh `fix/portal-deals-airdna`). Đừng sửa trước khi merge; dọn ở B5 |
| `/ops` | `ops/page.tsx` | operational | Table-backed management | Frame | dense. khung trang: PageHeader (chưa có, B1). Bảng độ tươi theo nguồn |
| `/ops/collections` | `ops/collections/page.tsx` | operational | Table-backed management | Frame | dense. khung trang: PageHeader (chưa có, B1). Sửa section lồng trong header |
| `/ops/quality` | `ops/quality/page.tsx` | operational | Table-backed management | Frame | dense. khung trang: PageHeader (chưa có, B1). Số AirDNA chỉ được hiện ở trang này. Sửa h1 giữa trang |
| `/ops/review` | `ops/review/page.tsx` | operational | Frame stack | Frame | dense. khung trang: PageHeader (chưa có, B1). Hàng chờ `ReviewCard`: mỗi mục có bằng chứng và nút quyết |
| `/ops/sources` | `ops/sources/page.tsx` | operational | Frame stack | Frame | dense. khung trang: PageHeader (chưa có, B1). Chỉ admin. Gồm bảng registry, quản lý Zalo, nhóm thu |
| `/ops/design` | `ops/design/page.tsx` | operational | Frame stack | Frame | dense. khung trang: PageHeader (chưa có, B1). Trang trưng bày danh mục. Hiện đang là Card, B1 đổi sang Frame |
