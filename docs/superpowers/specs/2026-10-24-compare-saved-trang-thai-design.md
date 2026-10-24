# UI4 — So sánh ở `/compare` và Đã lưu: PageHeader + trạng thái tải/trống/lỗi

> Hồ sơ nghiệm thu: `_acceptance/compare-saved-trang-thai/` (T2). Hàng lộ trình `UI4` (`docs/plan/lo-trinh.json`,
> phủ `GD6`). Cổng Đáng: Mạnh quyết `build` (23/10, mở lại dãy U1 24/10). Đợt I5 của `routes.md`.

## Câu giao

Nhà đầu tư mở So sánh ở `/compare` (301 từ `/so-sanh`) và Đã lưu, cả hai có PageHeader, trạng thái
tải/trống/lỗi, Đã lưu trống dùng `c-empty-11`. Hàng đầu tiên thêm redirect 301 vào `next.config.ts` — làm mẫu
cho UI2 (`/phuong-phap` → `/methodology`), UI3 (`/dau-tu` → `/yield`). 4 vi phạm lint của nhóm trang.

## Hiện trạng (main `c622ee9`)

- `/so-sanh` sống nhờ ngoại lệ có hạn trong `route-slugs.test.mjs`; nav, nút So sánh trên Insight, navbar
  marketing, nút So sánh trong Đã lưu và `scripts/audit-all.sh` đều trỏ `/so-sanh`.
- Hai trang tự vẽ `<h1>` (không PageHeader); không trang nào có Suspense — DB chậm thì trang đứng trắng tới khi
  đủ số; lỗi DB rơi về `(app)/error.tsx` thay cả trang.
- Lint baseline mang 4 vi phạm của nhóm: `no-raw-table` (bảng comparison-1), `no-banned-motion` (nút bỏ lưu),
  2 × `no-arbitrary-text-size` (tiêu đề + ô đếm của Đã lưu).

## Thiết kế

1. **Slug.** Dời `(app)/so-sanh` → `(app)/compare`. `next.config.ts` thêm
   `{ source: "/so-sanh", destination: "/compare", statusCode: 301 }` — `statusCode: 301` thay `permanent: true`
   (308) vì câu giao ghi 301; `hasPermanentRedirect` của `route-slugs.mjs` đã nhận dạng này. Query đi theo
   (Next giữ `?areas=`). Xoá dòng `so-sanh` khỏi `VIET_EXCEPTIONS` (test tự đỏ nếu còn). Sửa mọi link nội bộ.
   Đây là MẪU cho UI2/UI3: một dòng redirect + chú thích, xoá ngoại lệ, sửa link, cập nhật `routes.md`.
2. **PageHeader** (`components/page/page-header.tsx`, như Yield/Listing). Breadcrumb gốc `Việt Nam` (`/vn`) —
   IA L1 «phân cấp địa lý là xương sống». So sánh: tiêu đề «So sánh khu vực», stat `n/4 khu vực`, mô tả một mệnh
   đề, action «Thêm khu vực». Đã lưu: tiêu đề «Đã lưu», stat `n khu vực`, mô tả kèm email, action «So sánh N khu
   vực» (≥ 2, theo tab đang chọn).
3. **Tách nhanh/chậm.** Phần đọc nhẹ đứng ngay, phần nặng vào `<Suspense>`:
   - So sánh: chỉ mục khu vực (`getSearchIndex`, một truy vấn) đọc ở đầu trang → header có số cột ĐÚNG (mã lạ
     bị bỏ trước khi đếm) và nút Thêm; bảng số (`getFinderAreas` + `getYieldRows` từng thị trường) trong
     Suspense, `key` theo danh sách cột để thêm/bớt cột hiện lại skeleton.
   - Đã lưu: phiên + danh sách lưu (`getSavedAreas`) đọc ở đầu trang → `redirect()` sang đăng nhập giữ mã 307
     (không dùng `loading.tsx`: catalog «Đang tải» — mất mã 404/307); số liệu thẻ trong Suspense.
   - Tab lọc dùng chung giữa nút So sánh trên header và lưới thẻ qua `SavedFilterProvider` (context client nhỏ)
     — header nằm ngoài Suspense nên hai bên không chung một component; giữ được hành vi cũ «So sánh theo tab».
4. **Tải:** skeleton theo đúng bố cục vùng — `compare-skeleton.tsx` (cột nhãn + một cột mỗi khu vực),
   `saved-skeleton.tsx` (hàng tab + đúng số thẻ).
5. **Lỗi tại chỗ:** `states/region-error.tsx` = `catchError` của `next/error` (Next 16) + Alert destructive
   + «Thử lại» gọi `retry()` (tải lại vùng từ server, không tải lại trang; redirect/notFound không bị bắt
   nhầm). Bọc quanh Suspense của mỗi trang; PageHeader vẫn đứng. Lỗi ở phần đọc nhẹ đầu trang vẫn rơi về
   `(app)/error.tsx` (cả trang không dùng được khi không có chỉ mục/danh sách lưu).
6. **Trống:** So sánh giữ Empty cũ (thêm chữ «ở trên» trỏ nút header), ẩn chú thích «Ô xanh…» khi chưa có cột.
   Đã lưu trống = `c-empty-11` chuyển thể (`saved/saved-empty.tsx`): ô bookmark + MỘT nút outline «Tìm thị
   trường» → `/vn`. Trống-theo-tab giữ Empty «Không có khu vực nào ở mục này» + «Xem tất cả».
7. **Lint:** ngoại lệ tại chỗ có lý do cho `<table>` của comparison-1 (đúng chữ routes.md chỉ định); chuyển động
   nút bỏ lưu theo đường cong reveal của ReUI + `motion-reduce`; tiêu đề tự vẽ đi theo PageHeader; ô đếm tab
   thành `Badge` cỡ mặc định. `--prune-suppressions` → baseline giảm đúng 4.
8. **Chữ:** hàng lợi suất của bảng đổi «Yield …» → «Lợi suất ngắn hạn/dài hạn» kèm chú thích «Gộp: …» (CONTEXT.md
   «Lợi suất» ghi đổi khi dọn nhóm trang). Ô tốt nhất đổi `text-success` → `text-success-foreground
   dark:text-success` (luật màu ReUI: `text-success` làm chữ ở chế độ sáng chỉ đạt tương phản ~2,4).

9. **Ảnh đại diện (góp ý Mạnh ở Cổng Phạm vi 24/10, Hỏi-4).** Kho chưa có ảnh khu vực; dùng ảnh chính của một listing
   tự thu trong khu vực (`getAreaThumbnails`: thị trường gồm phường con, xếp theo đêm đặt 90 ngày tới rồi số đánh giá,
   ≤ 3 ứng viên, ảnh đầu không trùng giữa các khu vực cùng trang). ~1/4 ảnh chính trên CDN đã chết (mẫu 25 ảnh: 6 trả
   404) → `AreaThumbnail` lùi sang ứng viên kế khi lỗi, hết thì cha về ô số; `<img>` chỉ gắn sau hydrate vì lỗi ảnh xảy
   ra giữa HTML server và hydrate bị mất. Thẻ Đã lưu: ảnh đứng đầu khung (nằm dưới nhãn loại + nút ✕), nhãn dùng Badge
   nền đặc, RevPAR + công suất xuống dòng dưới tên. Chữ thay thế «Ảnh một listing ở …» để không hiểu nhầm là ảnh khu vực.

<!-- <<<UX-SPEC-TEMPLATE -->
## Đặc tả UX

### 1. Luồng

- Suôn sẻ: Insight (nút «So sánh») / Đã lưu («So sánh N khu vực») / nav «So sánh» → `/compare?areas=…` → đọc bảng,
  thêm cột bằng «Thêm khu vực», bỏ cột bằng ✕ → «Xem Insight» (điểm ra: Insight khu vực).
- Đã lưu: nút «Lưu» trên Insight → menu/footer «Đã lưu» → `/saved` → lọc tab → «So sánh N khu vực» hoặc «Xem
  Insight»; ✕ bỏ lưu tại chỗ (tab đang chọn giữ nguyên).
- Biên: link cũ `/so-sanh?areas=…` → 301 sang `/compare?areas=…`; mã khu vực lạ/trùng bị bỏ; đủ 4 cột thì «Thêm
  khu vực» tắt; chưa đăng nhập mở `/saved` → 307 `/login?next=/saved`.
- Lỗi & quay lại: truy vấn số liệu hỏng → Alert tại vùng + «Thử lại» (header, nút Thêm/So sánh vẫn dùng được).

### 2. Kiểm kê màn

| Màn | MỘT việc của màn | Vào từ / ra tới |
|---|---|---|
| So sánh `/compare` | đặt 1–4 khu vực cạnh nhau theo cùng thước số | nav, Insight, Đã lưu, link cũ `/so-sanh` / Insight |
| Đã lưu `/saved` | xem lại khu vực đang theo dõi | nút Lưu, menu avatar, footer / Insight, So sánh |

### 3. Bảng trạng thái

<!-- <<<UX-STATE-TABLE -->
| Trạng thái | Màn | Hiển thị gì | Người làm gì tiếp |
|---|---|---|---|
| ST-compare-du-lieu | So sánh | PageHeader (`n/4 khu vực`, Thêm khu vực) + bảng comparison-1, ô tốt nhất xanh đậm | bỏ/thêm cột, Xem Insight |
| ST-compare-tai | So sánh | PageHeader đứng + skeleton cột nhãn và từng cột khu vực | chờ |
| ST-compare-trong | So sánh | Empty «Chưa chọn khu vực nào» + «Xem thị trường Việt Nam»; không chú thích Ô xanh | Thêm khu vực / sang Finder |
| ST-compare-loi | So sánh | Alert «Không tải được bảng so sánh» + Mã lỗi + Thử lại; header đứng | Thử lại |
| ST-saved-du-lieu | Đã lưu | PageHeader (`n khu vực`, So sánh N khu vực) + tab có đếm + lưới thẻ | lọc, So sánh, bỏ lưu, Xem Insight |
| ST-saved-tai | Đã lưu | PageHeader đứng + skeleton hàng tab + đúng số thẻ | chờ |
| ST-saved-trong | Đã lưu | c-empty-11: ô bookmark, «Chưa lưu khu vực nào», nút outline «Tìm thị trường» | sang Finder |
| ST-saved-loc-trong | Đã lưu | Empty «Không có khu vực nào ở mục này» + «Xem tất cả» | Xem tất cả |
| ST-saved-loi | Đã lưu | Alert «Không tải được số liệu khu vực đã lưu» + Thử lại; header đứng | Thử lại |
| ST-saved-chua-dang-nhap | Đã lưu | 307 sang `/login?next=/saved` | đăng nhập |
<!-- UX-STATE-TABLE>>> -->

### 4. Hành vi

- 390/375 px: header xếp dọc (action xuống dưới), bảng so sánh cuộn ngang TRONG khung, trang không cuộn ngang.
- Thêm/bớt cột đổi `?areas=` (router.replace, không cuộn); Suspense theo key cột → skeleton khi đổi cột.
- «So sánh N khu vực» lấy tối đa 4 khu vực đầu của tab đang chọn (mới lưu trước); < 2 thì ẩn.

### 5. Xuất xứ component

| Component | Nấc (dùng / ghép / mở rộng / tạo) | Vì sao (1 dòng) |
|---|---|---|
| PageHeader | dùng | khung trang chuẩn cho mọi trang operational (routes.md) |
| comparison-1 (`compare/comparison.tsx`) | dùng (bỏ header tự vẽ) | block đích đã chốt, header chuyển lên PageHeader |
| wishlist-2 (`saved/saved-list.tsx`) | dùng | block đích đã chốt; ô đếm thành Badge |
| c-empty-11 (`saved/saved-empty.tsx`) | ghép | block trống đã chốt cho `/saved` (IA §3.4) |
| AreaThumbnail (`page/area-thumbnail.tsx`) | tạo | chưa có ảnh khu vực; ảnh listing tự thu + đường lùi ảnh chết |
| RegionError (`states/region-error.tsx`) | tạo | chưa có lỗi-tại-vùng; `catchError` của Next + c-alert-1 như PageError |
| CompareSkeleton, SavedSkeleton | tạo | skeleton theo bố cục vùng (catalog «Đang tải») |
| SavedFilterProvider | tạo | tab dùng chung giữa header ngoài Suspense và lưới thẻ |

### 6. Khuôn IA đã chọn + căn cứ

Khuôn IA: một-cột-cuộn
Căn cứ: (ii) không tra Mobbin — luồng hiển nhiên: hai trang đã có block đích chốt (routes.md: comparison-1 /
wishlist-2 + c-empty-11, archetype Table-backed management / Frame stack), việc này chỉ thêm PageHeader và trạng
thái, không đổi bố cục.
<!-- UX-SPEC-TEMPLATE>>> -->

## Ngoài phạm vi

- Khay So sánh từ bảng xếp hạng Finder (GD13), Đã lưu thêm listing và báo cáo lợi suất (GD15), nút Chia sẻ (GD14).
- Đổi «Yield …» trên bảng Insight (`insight-tables.tsx`) — thuộc nhóm trang Insight (UI khác).
- Chuyển bảng so sánh sang data-grid (routes.md chốt giữ comparison-1).
- `shadow-xs`/`text-xs` trên nút của `insight-actions.tsx` — chỉ đổi đường dẫn, phần còn lại thuộc nhóm Insight.
