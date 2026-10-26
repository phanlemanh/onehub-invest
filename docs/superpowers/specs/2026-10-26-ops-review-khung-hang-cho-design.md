# UI1 · ops-review-khung-hang-cho — thiết kế

Hàng UI1 (phủ GD9) của lộ trình giao diện 23/10: dựng lại **khung** trang `/ops/review` (Hàng duyệt) theo
`@reui/solution-agents-5` — hàng chờ dạng bảng, lọc theo loại thẻ, bấm một hàng mở sheet chi tiết có dải ảnh tin,
dùng được ở màn 390 px. Hạng T2 (không chạm `app/src/app/api/v1/ops/**`).

## Căn cứ đã khai (không hỏi lại)

- Câu giao hàng UI1 (`docs/plan/lo-trinh.json`) và ô Cổng Đáng `_acceptance/ops-review-khung-hang-cho/opportunity.md`
  (Mạnh quyết build 23/10).
- **Q9** (`docs/architecture/classification-enrich-review.md` §7, Mạnh duyệt «Hỏi-3: đồng ý Q4 Q9» 26/10 —
  `lat-ocp1-huong-tiep-can-2610.md`): thẻ duyệt **không hiện độ tự tin**, «áp ngay cho UI1».
- **X1** (lát OCP1, 26/10): UI1 chỉ làm khung; thẻ duyệt v2 (phát biểu theo bậc, đoạn trích, bất đồng mọi cặp) là
  PL23 (PL3 đã gộp vào). UI1 không dựng nội dung v2.
- `routes.md` dòng `/ops/review` (Frame, Table-backed management, Block đích `solution-agents-5`) và BOI-CANH §4 dòng
  UI1: «lọc theo loại thẻ/bậc, bỏ "theo độ tin"».
- `review_queue` là tầng A (ADR-0007, ADR-0014): nội dung chỉ ở máy local; cloud chỉ thấy số thẻ chờ theo loại (ON3).

## Phương án

**Chọn: khung master-detail trên trang hiện có, nội dung thẻ giữ nguyên chức năng.**

- `ReviewPageBody` bọc `ReviewContent` trong `RegionError > Suspense` (fallback giữ tiêu đề + khung bảng). Ranh giới đặt ở
  ngoài `ReviewContent` để `ReviewContent` vẫn là một hàm async trả cây đã đủ dữ liệu — ca RS-AC-3 của hồ sơ đã ký
  `ops-review-sources-500-tren-cloud` render nó bằng `renderToStaticMarkup` và không đổi thước.
- `ReviewContent` (server) giữ nguyên nhánh cloud; nhánh local truy vấn thêm `created_at`, **bỏ `ai_confidence` khỏi
  dữ liệu gửi xuống client** (Q9 — không chỉ ẩn chữ mà không đưa số tới trình duyệt), rồi render `ReviewQueue`.
- `ReviewQueue` (client, mới, `components/ops/review/`): một `Frame` chứa thanh lọc (hai `Select`: Loại thẻ ·
  Trạng thái) và `DataGrid` (cột Thẻ · Loại · Trạng thái · Tạo lúc), chuyển thể từ `approval-queue.tsx` của block,
  đổi `Card` sang `Frame` theo họ khung của trang (routes.md). Bấm một hàng (hoặc nút tên thẻ trong hàng — đường bàn
  phím) mở `ReviewDetailSheet`.
- `ReviewDetailSheet` (client, mới): `Sheet` phải, toàn bề ngang ở màn hẹp; đầu sheet = tên thẻ + badge loại +
  badge trạng thái; thân = nội dung thẻ hiện có (`ReviewCardBody`: hai tin A/B hoặc bảng trường bổ sung, kèm dải ảnh
  `ReviewPhotos` — ảnh nay sống trong sheet); chân = nút quyết định hiện có (cùng route, cùng body).
- `review-card.tsx` tách thân thẻ và nút quyết định để sheet ghép; dọn 20 vi phạm lint (nút tay → `Button`,
  `text-[10px]/[11px]` → `text-xs`, khối `rounded-lg border` → `Item`, bỏ emoji trên nút) và **bỏ mọi chỗ hiện độ
  tự tin** («AI tự tin N%», «AI: … (N%)»).

Đã loại:
- *Giữ danh sách thẻ dài, chỉ thêm lọc* — trái câu giao (bảng + sheet) và routes.md.
- *Dựng thẻ v2 ngay trong sheet* — trái X1; PL23 dựng lại một lần sau PL15.
- *Duyệt/trả lại hàng loạt (checkbox của block)* — trả lại hàng loạt có lý do là hàng UI12 (GD10, T3, đứng trên UI1),
  không duyệt hàng loạt; UI1 bỏ cột chọn.
- *Lọc theo bậc căn cứ* — dữ liệu bậc (phát biểu theo bậc) chưa tồn tại tới PL23; UI1 lọc theo loại thẻ + trạng thái,
  `routes.md` ghi «theo bậc» là phần của PL23.

## Đụng chạm hồ sơ khác

- `enrich-qua-de-xuat` (đã ký) AC-9 viết «bảng field · giá trị · độ tin cậy»; ca test `AC-9 thẻ agent_output` trong
  `app/tests/review-card.test.tsx` kiểm chữ «85%». Q9 lật vế «độ tin cậy» → ca đó đổi thành kiểm **vắng** «%» — câu
  hỏi Hỏi-1 ở Cổng Phạm vi (sửa thước của một hồ sơ đã ký).
- Các hồ sơ đã ký có `paths` chạm `components/ops/review-*`, `review-content.tsx`, `tests/review-card.test.tsx`
  (`enrich-qua-de-xuat`, `review-card-photos`, `ui-clean-b1-ops`, `ops-nhan-theo-context`, `o-kpi-chi-do-local`,
  `ops-review-sources-500-tren-cloud`) sẽ cần một lượt ghim lại sau khi UI1 xong (xin `ghim-lai` qua lõi đợt).
- PL23 đứng sau UI1 trên cùng `review-card.tsx`/sheet.

<!-- <<<UX-SPEC-TEMPLATE -->
## Đặc tả UX

### 1. Luồng

- Suôn sẻ: thanh bên Ops «Hàng duyệt» → `/ops/review` (mặc định lọc «Chờ duyệt») → chọn Loại thẻ → bấm một hàng →
  sheet chi tiết (tin A/B hoặc trường đề xuất + ảnh) → bấm quyết định → bảng làm mới, sheet hiện kết quả (điểm ra:
  đóng sheet, về bảng).
- Biên: hàng duyệt trống; lọc ra 0 thẻ; thẻ loại lạ (`source_decision`…) — sheet hiện dòng «chưa có giao diện
  duyệt», không nút; người không phải admin — không có dải ảnh; trên cloud — chỉ số thẻ chờ theo loại (ON3, giữ).
- Lỗi & quay lại: truy vấn hàng duyệt lỗi → khối lỗi tại chỗ (`RegionError`, mẫu UI6) có «Thử lại»; route quyết định trả lỗi → dòng lỗi trong
  chân sheet, sheet vẫn mở để bấm lại.

### 2. Kiểm kê màn

| Màn | MỘT việc của màn | Vào từ / ra tới |
|---|---|---|
| Bảng hàng duyệt | Chọn thẻ cần phán | thanh bên Ops / sheet chi tiết |
| Sheet chi tiết thẻ | Xem căn cứ của một thẻ và quyết | một hàng của bảng / về bảng |

### 3. Bảng trạng thái

<!-- <<<UX-STATE-TABLE -->
| Trạng thái | Màn | Hiển thị gì | Người làm gì tiếp |
|---|---|---|---|
| ST-bang-tai | Bảng hàng duyệt | fallback `Suspense` trong trang (không `loading.tsx` — PageSkeleton đã ghi lý do): Skeleton Frame có thanh lọc và 6 dòng | chờ |
| ST-bang-trong | Bảng hàng duyệt | `Empty` «Hàng duyệt trống» · «Không có thẻ nào chờ phán quyết.» · nút «Xem thu thập» (`/ops/collections`) | mở trang thu thập |
| ST-bang-loc-rong | Bảng hàng duyệt | trong lưới: «Không có thẻ khớp bộ lọc» + nút «Xoá lọc» | xoá lọc |
| ST-bang-het-cho | Bảng hàng duyệt | còn thẻ nhưng đều đã quyết: «Không còn thẻ chờ duyệt» + nút «Xem thẻ đã quyết» | xem thẻ đã quyết |
| ST-bang-loi | Bảng hàng duyệt | `RegionError` «Không tải được hàng duyệt» + «Thử lại» thay nội dung trang, vỏ Ops vẫn đứng | thử lại |
| ST-bang-cloud | Bảng hàng duyệt | số thẻ chờ theo loại + mốc đo + LocalOnlyAlert (ON3, không đổi) | duyệt trên máy thu |
| ST-sheet-cho | Sheet chi tiết | thân thẻ + dải ảnh + nút quyết định | quyết |
| ST-sheet-dang-gui | Sheet chi tiết | nút quyết định khoá trong lúc gửi | chờ |
| ST-sheet-loi-gui | Sheet chi tiết | dòng lỗi từ route trong chân sheet | bấm lại |
| ST-sheet-da-quyet | Sheet chi tiết | badge kết quả («Đã duyệt», «Đã áp»…), không nút — cả ngay sau khi vừa quyết (sheet giữ thẻ dù thẻ rời bộ lọc) | đóng |
| ST-sheet-loai-la | Sheet chi tiết | «Loại thẻ khác (…) chưa có giao diện duyệt.» | đóng |
<!-- UX-STATE-TABLE>>> -->

### 4. Hành vi

- Hàng của bảng bấm được bằng chuột; tên thẻ trong hàng là `button` (Tab + Enter mở sheet); `Esc` đóng sheet, focus
  về lại bảng (Base UI Sheet).
- Bộ lọc mặc định «Chờ duyệt» + «Mọi loại» (Hỏi-2 ở Cổng Phạm vi); số thẻ trong tiêu đề Frame theo bộ lọc.
- Màn hẹp: badge loại + trạng thái nhắc lại ngay dưới tên thẻ (cột Loại/Trạng thái nằm ngoài khung nhìn khi bảng cuộn ngang).
- ≥ 768 px: sheet rộng tối đa `max-w-2xl` bên phải; < 768 px: sheet toàn bề ngang, thân cuộn trong sheet, chân ghim;
  bảng cuộn ngang trong Frame, trang không cuộn ngang ở 390 px. Tin A/B xếp chồng ở màn hẹp.
- Không hiện độ tự tin ở bất kỳ đâu (Q9); «Điểm B» (điểm ghép đo được của Stage B) giữ trong sheet thẻ ghép căn.

### 5. Xuất xứ component

| Component | Nấc | Vì sao (1 dòng) |
|---|---|---|
| `@reui/solution-agents-5` (approval-queue, request-detail-sheet) | ghép | khuôn hàng chờ + sheet đúng câu giao; đổi Card → Frame, bỏ chọn hàng loạt/SLA/xuất |
| `@reui/data-grid`, `@reui/frame`, `@reui/badge`, `@reui/alert` | dùng | chủ việc bảng, khung, trạng thái |
| shadcn `Sheet`, `Select`, `Empty`, `Skeleton`, `Item`, `Button` | dùng | ngăn chi tiết, lọc, trạng thái |
| `ReviewPhotos` (c-attachment-3 chuyển thể, có sẵn) | dùng | dải ảnh tin, dời vào sheet |
| `ReviewCardBody` (từ `review-card.tsx`) | mở rộng | giữ nội dung thẻ hiện có, dọn lint, bỏ độ tự tin |

### 6. Khuôn IA đã chọn + căn cứ

Khuôn IA: danh-sách-chi-tiết (master-detail)
Căn cứ: câu giao đã chỉ đích danh «bảng + bấm hàng mở sheet» và block `solution-agents-5` (Action Approval Inbox —
hàng chờ + sheet chi tiết); không có khuôn thứ hai khả dĩ nên không tra Mobbin.
<!-- UX-SPEC-TEMPLATE>>> -->
