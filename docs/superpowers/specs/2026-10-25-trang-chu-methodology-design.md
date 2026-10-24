# UI2 — Trang chủ và `/methodology`: định nghĩa faq-3, bỏ màu cứng, ranh giới lỗi

> Hồ sơ nghiệm thu: `_acceptance/trang-chu-methodology/` (T2). Hàng lộ trình `UI2` (`docs/plan/lo-trinh.json`,
> phủ `GD7`). Cổng Đáng: Mạnh quyết `build` (23/10). Đợt I6 của `routes.md` (phần trang chủ + Phương pháp; auth
> giữ nguyên). Dãy U1, nối sau UI4 (`compare-saved-trang-thai`, PR #72) — dùng lại mẫu redirect 301 của UI4.

## Câu giao

Khách mở trang chủ và `/methodology` (301 từ `/phuong-phap`) thấy định nghĩa dạng faq-3, hero và thẻ thị trường
không còn màu cứng, lỗi nhóm marketing có `error.tsx` và lỗi toàn cục có `global-error.tsx`.

## Hiện trạng (nhánh UI4 `e852a9e`)

- `/phuong-phap` sống nhờ ngoại lệ có hạn trong `route-slugs.test.mjs`; navbar marketing (2 chỗ), «Cách dùng»
  trang chủ (2), chân hỏi đáp trang chủ, chân trang chung và form đăng nhập trỏ `/phuong-phap`.
- Trang Phương pháp dùng `faq-6` (accordion): mỗi định nghĩa phải bấm mới đọc; routes.md đã chốt đích là `faq-3`
  (mở sẵn, không accordion).
- Baseline lint mang 18 vi phạm của nhóm: `frame-backdrop.tsx` 13 × `no-hardcoded-color` (hex trong bản vẽ nền hero),
  `market-cards.tsx` 4 × `no-raw-palette` (thang chàm không cặp `dark:`), `marketing-navbar.tsx` 1 × `no-banned-motion`
  (`transition-all` ở nút «Bắt đầu»). (Câu giao ghi 19: số đếm lúc cắt lượt; baseline hiện tại là 18.)
- Nhóm `(marketing)` không có `error.tsx`; app không có `global-error.tsx` — lỗi ở layout rơi về trang 500 mặc định
  tiếng Anh của Next.
- Thẻ thị trường không có trạng thái trống: 0 thị trường thì khung rỗng.

## Thiết kế

1. **Slug (mẫu UI4).** Dời `(marketing)/phuong-phap` → `(marketing)/methodology`; `next.config.ts` thêm
   `{ source: "/phuong-phap", destination: "/methodology", statusCode: 301 }` ngay dưới dòng `/so-sanh`; xoá dòng
   `phuong-phap` khỏi `VIET_EXCEPTIONS`; sửa 7 link nội bộ. Hash (`#revpar`) do trình duyệt giữ qua redirect.
2. **Định nghĩa dạng faq-3.** `marketing/definition-grid.tsx` chuyển thể lưới câu hỏi của `@reui/faq-3`: mọi câu
   trả lời mở sẵn, lưới hai cột kẻ mảnh từ `md`, một cột ở màn hẹp. Khác bản gốc: tiêu đề mục là `h2` có id (đích
   của mục lục `#chi-so`, `#loi-suat`, `#nguon`), mỗi ô mang id riêng (`#revpar`, `#adr`…) để ⓘ định nghĩa trên ô KPI
   trỏ thẳng; câu trả lời nhận ReactNode (giữ Badge «Mô phỏng»). Server component — không cần JS để đọc.
   Đầu trang giữ Badge eyebrow + `h1` + mục lục (routes.md: không PageHeader). Hàng hỗ trợ hai nút của faq-3 →
   «Xem thị trường» (`/vn`) và «Ước tính lợi suất» (`/yield`): sản phẩm không có bàn hỗ trợ hay tài liệu riêng.
   Trang chủ GIỮ hỏi đáp accordion `faq-6` (routes.md: `/` giữ `faq-6`).
3. **Nền hero không hex.** 16 mã hex của `frame-backdrop.tsx` thay bằng biến palette Tailwind gần nhất (tính bằng
   khoảng cách màu: blue-600/700/800/900, ribbon sky-500), viết nguyên văn `var(--color-…)` để Tailwind giữ biến;
   SVG không đọc `var()` ở thuộc tính trình bày nên màu đi qua `style`. Hình gần như không đổi (ảnh trước/sau trong
   `evidence/design-pass/home-truoc--*` và `home--*`). Bản vẽ giống nhau ở sáng và tối như trước.
4. **Thẻ thị trường.** Dải diện tích vẫn vẽ từ doanh thu theo tháng thật; thang chàm giữ (doanh thu = chàm,
   `data-color.md`), mỗi chuỗi lớp có cặp `dark:` lùi một bậc sáng hơn (như `revenue` của `charts/palette.ts`).
   0 thị trường → `Empty` «Chưa có thị trường nào có số» + MỘT nút «Cách thu thập số liệu» → `/methodology#nguon`.
5. **Navbar.** Nút «Bắt đầu»: `transition-all` → `transition-[translate,opacity]` + đường cong reveal của ReUI;
   `motion-reduce`: chữ đứng yên, mũi tên chỉ hiện dần.
6. **Lỗi trang marketing.** `(marketing)/error.tsx` nằm TRONG layout marketing → navbar + chân trang vẫn đứng, vùng
   nội dung là `PageError` (Alert destructive + «Thử lại»). «Thử lại» gọi `retry()` của Next 16 (tải lại từ server),
   không `reset()` (chỉ vẽ lại phía client — lỗi dữ liệu sẽ lặp lại).
7. **Lỗi toàn cục.** `app/global-error.tsx` thay cả layout gốc nên tự có `<html lang="vi">`, `<body>`, `globals.css`,
   font Geist/Geist Mono và `ThemeProvider` (sáng/tối như phần còn lại của app). Nội dung `states/app-crash.tsx`:
   Alert destructive «One Invest không mở được» + mã lỗi + «Thử lại» (`retry()`) + «Về trang chủ» bằng thẻ `<a>`
   thường (tải lại cả tài liệu; router phía client có thể chính là thứ hỏng — ngoại lệ lint có lý do).
   Layout marketing đọc DB (phiên + chỉ mục tìm kiếm): DB sập hẳn thì layout hỏng trước trang → `global-error`
   bắt; `(marketing)/error.tsx` bắt lỗi của riêng trang khi layout còn sống.
8. **Lint.** `--prune-suppressions` → baseline giảm đúng 18 (3 khoá của nhóm biến mất).
9. **Tài liệu.** routes.md (dòng `/methodology`, ghi chú `/`), catalog.md (`faq-3`, hero, card-29, dòng «Lỗi» thêm
   `app-crash`), `app/CLAUDE.md`, IA doc, ROADMAP §2/§4 (I6 phần trang chủ/Phương pháp).

## Phương án đã loại

- **Layout marketing chịu lỗi DB** (bắt lỗi phiên/chỉ mục, hiện navbar rỗng) để `(marketing)/error.tsx` bắt được cả
  khi DB sập: loại — người đã đăng nhập sẽ thấy mình như bị đăng xuất, ô tìm kiếm rỗng không lời giải thích; trang lỗi
  toàn cục nói thật hơn.
- **Token màu riêng cho hero trong `globals.css`** (giữ đúng 16 hex): loại — chỉ dời hex sang chỗ khác, thêm token
  chỉ một bản vẽ dùng; palette Tailwind đã có sắc gần như trùng.
- **Bỏ hẳn nền vẽ hero** (`bg-muted`): loại — đổi gu nhìn của trang chủ, ngoài câu giao.
- **Một màu `revenue` cho mọi thẻ** thay thang chàm theo thứ tự: loại — đổi hình card-29 đã duyệt ở P5, không cần
  cho mục tiêu «không màu cứng».

<!-- <<<UX-SPEC-TEMPLATE -->
## Đặc tả UX

### 1. Luồng

- Suôn sẻ: trang chủ → «Phương pháp» (navbar / «Cách số liệu được tính» / «Đọc phương pháp» / chân trang) →
  `/methodology` → đọc lướt ba lưới định nghĩa, nhảy mục bằng mục lục → «Xem thị trường» / «Ước tính lợi suất»
  (điểm ra: Finder `/vn`, Lợi suất `/yield`).
- Biên: link cũ `/phuong-phap` (kể cả `#revpar`) → 301 sang `/methodology`; deep link `/methodology#revpar` cuộn
  tới đúng ô; 0 thị trường có số → Empty trong vùng thẻ thị trường.
- Lỗi & quay lại: trang chủ hỏng khi đọc số (layout còn sống) → Alert + «Thử lại» dưới navbar; layout hỏng (DB sập)
  → trang lỗi toàn cục + «Thử lại» / «Về trang chủ».

### 2. Kiểm kê màn

| Màn | MỘT việc của màn | Vào từ / ra tới |
|---|---|---|
| Trang chủ `/` | cho khách thấy sản phẩm trả lời câu hỏi gì, bằng số thật | trực tiếp, logo / Finder, Phương pháp |
| Phương pháp `/methodology` | giải nghĩa mọi chỉ số và nguồn, đọc được không cần bấm | navbar, trang chủ, chân trang, đăng nhập, link cũ `/phuong-phap` / Finder, Lợi suất |
| Lỗi trang marketing | báo phần trang hỏng, cho thử lại, giữ điều hướng | lỗi khi đọc số / thử lại, navbar |
| Lỗi toàn cục | báo app không mở được, cho thử lại hoặc về trang chủ | lỗi ở layout / thử lại, `/` |

### 3. Bảng trạng thái

<!-- <<<UX-STATE-TABLE -->
| Trạng thái | Màn | Hiển thị gì | Người làm gì tiếp |
|---|---|---|---|
| ST-methodology-default | Phương pháp | Eyebrow «Phương pháp», h1, mục lục 3 mục, 3 lưới (7 + 4 + 4 ô) mở sẵn, hàng hai nút | đọc, nhảy mục, «Xem thị trường» |
| ST-methodology-deeplink | Phương pháp | `#revpar` → trang cuộn tới ô RevPAR (scroll-mt dưới navbar) | đọc định nghĩa |
| ST-methodology-redirect | `/phuong-phap` | 301 → `/methodology` (giữ hash) | như default |
| ST-home-default | Trang chủ | hero nền xanh (palette), thẻ thị trường dải chàm, cách dùng, hỏi đáp | tìm khu vực, xem thị trường |
| ST-home-markets-empty | Trang chủ | Empty «Chưa có thị trường nào có số» + «Cách thu thập số liệu» | đọc `/methodology#nguon` |
| ST-marketing-error | Lỗi trang marketing | navbar + Alert «Không tải được dữ liệu» + mã lỗi + «Thử lại» + chân trang | Thử lại / điều hướng |
| ST-global-error | Lỗi toàn cục | Alert «One Invest không mở được» + mã lỗi + «Thử lại» + «Về trang chủ», theo sáng/tối | Thử lại / về `/` |
<!-- UX-STATE-TABLE>>> -->

Trang chủ không có trạng thái tải riêng (trang chờ đủ số rồi mới vẽ, như trước) — ngoài phạm vi, xem Out of scope.

### 4. Hành vi

- Lưới định nghĩa: 1 cột < 768 px, 2 cột ≥ 768 px; số ô lẻ thì ô cuối đứng một mình bên trái (như faq-3 gốc).
- Mục lục và deep link dùng anchor thường (`<a href="#…">`); `scroll-mt-20` để tiêu đề không bị navbar dính che.
- Nút «Bắt đầu»: hover trượt chữ + hiện mũi tên 300 ms đường cong reveal; `prefers-reduced-motion`: chỉ hiện dần.

### 5. Xuất xứ component

| Component | Nấc (dùng / ghép / mở rộng / tạo) | Vì sao (1 dòng) |
|---|---|---|
| `@reui/faq-3` → `marketing/definition-grid.tsx` | mở rộng | id mục/ô cho mục lục và ⓘ, câu trả lời ReactNode |
| `PageError` (`states/page-error.tsx`, c-alert-1) | dùng | lỗi trang marketing, cùng Alert với cổng app |
| `states/app-crash.tsx` | ghép | Alert + Button có sẵn, thêm «Về trang chủ» cho lỗi toàn cục |
| `ui/empty` | dùng | thẻ thị trường trống |
| `hero-8` / `card-29` / `navbar-12` (đã chuyển thể) | dùng | chỉ đổi màu/chuyển động, giữ cấu trúc |

### 6. Khuôn IA đã chọn + căn cứ

Khuôn IA: một-cột-cuộn
Căn cứ: trang tham chiếu đọc từ trên xuống, ba mục cùng cấp nhảy bằng mục lục; block đích (`faq-3`) đã chốt ở
routes.md (bản đồ đích duyệt 23/10) nên không có hai khuôn khả dĩ — không tra Mobbin.
<!-- UX-SPEC-TEMPLATE>>> -->
