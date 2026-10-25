# Trang Thu thập không có số S02 (ON6 · `collections-khong-so-s02`) — thiết kế

Hàng ON6 (`docs/plan/lo-trinh.json`, đợt `ops-noi-that-2410`, nhóm `ops-spl`, hạng T2). Câu giao: «Người vận hành mở
/ops/collections không thấy số S02 nào ở biểu đồ, bảng hay panel Rotation; số S02 chỉ ở /ops/quality và tiêu đề biểu
đồ nói rõ đang đếm gì». Ngưỡng (`bat_khi`): «Phép thử tĩnh + render: trang Thu thập không có số bản ghi S02; tab Listing
chỉ đếm tự thu; Rotation chỉ còn đếm job». Gốc OPS-14 (G5, luật 5: số AirDNA chỉ ở `/ops/quality` — AGENTS.md,
`onehub-ui/routes.md`).

## 1. Hiện trạng (main 9e759b4, sau ON5)

| Vùng (trang Thu thập) | Số S02 đang hiện |
|---|---|
| Biểu đồ «Luồng 7 ngày», tab «Listing» (`sync-activity.tsx`) | chồng «S02 — listing chạm» (`airdna_listings` theo ngày) lên «S01 — listing tươi»; tổng «N bản ghi» gộp cả hai |
| Bảng «Luồng 7 ngày qua» ở máy thu (`FlowTable`) | hai cột «S02 — thị trường», «S02 — listing (12 tháng qua)» (máy chủ đã bỏ ở ON5) |
| Panel «Vòng thu S02 kế tiếp» (`RotationPanel`) | liệt tên 6 thị trường S02 kế tiếp (ON12 đã đổi mã thành tên) |
| Lưới «Sức khoẻ nguồn» (`FeedsGrid`), hàng S02 | «24h» (số lượt chạy S02), «Staging» (đang lấy nhầm số dòng `stg_abnb_listings` của S01), «Tin rao» |
| Ô «Bản ghi 24h» (`CollectionsTiles`) | tổng cộng cả S02; «Nhiều nhất: S02 (n)» khi S02 nhiều nhất |

Độ tươi và trạng thái S02 (hàng S02 của lưới, ô «Sức khoẻ nguồn» x/y đạt SLO) là sức khoẻ vận hành, không phải số bản
ghi — giữ nguyên (AU6: cùng con số với `/ops`).

## 2. Thiết kế

1. **Biểu đồ**: tab «Listing» chỉ còn «S01 — listing tươi» (tự thu). Mô tả dưới tiêu đề nói rõ đang đếm gì theo tab:
   «Listing tự thu (S01) thấy theo ngày — N listing trong 7 ngày» / «Bài thô và tin rao S03 theo ngày đăng — N bản ghi
   trong 7 ngày» (ngày theo giờ VN).
2. **Bảng máy thu**: bỏ hai cột S02; `getFlowDays` thôi truy vấn `airdna_*`, kiểu `FlowDay` bỏ hai trường S02.
3. **Rotation**: theo Hỏi-2 (khuyến nghị: chỉ lịch chạy, «6 lượt thu mỗi đêm lúc 19:05», giờ cập nhật cuối — không số
   thị trường, không con trỏ, không tên thị trường).
4. **Lưới «Sức khoẻ nguồn»**, hàng S02: ba ô số theo Hỏi-1 (khuyến nghị: chữ «Xem Chất lượng» dẫn tới `/ops/quality`);
   trạng thái, lần chạy cuối, độ tươi giữ.
5. **Ô «Bản ghi 24h»**: tổng và «Nhiều nhất» không tính S02 (ở máy thu và máy chủ — khối `records24h` vẫn mang S02,
   ô lọc khi cộng). Chú thích chân ô «Không tính S02».
6. **Lưới tĩnh**: `scripts/check-portal-compliance.mjs` thêm luật: mã render của trang Thu thập
   (`components/ops/collections/**`, `collections-tables.tsx`, `ops/collections/page.tsx`) không đọc trường S02
   (`airdna*`) — giữ cho số S02 không quay lại.

## 3. Phép đo

1. **Render (SSR)** `app/tests/collections-khong-so-s02.test.tsx`: dựng `CollectionsView` (máy thu và máy chủ) với dữ liệu
   mang số S02 «lính canh» riêng biệt (vd 987 654 ở mọi trường S02) → số lính canh xuất hiện 0 lần; tab Listing của
   biểu đồ chỉ một chuỗi `airbnbListingsSeen`; Rotation không có tên thị trường lính canh; mô tả biểu đồ đúng chữ theo
   tab. Đếm mọi dạng in của lính canh (thô, vi-VN, rút gọn), 7 hàng ma trận viết trước trong hợp đồng; đối chứng dương
   trên bản sao gỡ phần ẩn của từng vùng. Phía máy chủ đi vòng trọn: bản tin bên ghi thật → `readOpsFacts` → trang.
   `getFlowDays` đo bằng các câu SQL thật sự chạy trên pool. Mỗi ca có bản sao đỏ báo đúng vùng.
2. **Tĩnh**: luật mới của `check-portal-compliance` + chiều đỏ trên bản sao có `airdnaListings`.
3. **Trang chạy thật** `scripts/smoke-collections-khong-so-s02.mjs` (khuôn ON13): 1280px, `/ops/collections` ở máy thu —
   DOM không cột S02, tab Listing một chuỗi, Rotation không tên, ô S02 theo Hỏi-1; ảnh chụp cho người ký.

## 4. Hỏi

- **Hỏi-1 — ba ô số của hàng S02 trong «Sức khoẻ nguồn» hiện gì?** Khuyến nghị (a): chữ mờ «Xem Chất lượng» dẫn tới
  `/ops/quality` — người trực biết số S02 nằm ở đâu, không đọc nhầm là «chưa đo». Lối khác: (b) giữ ô «24h» (số lượt
  chạy là số vận hành) và chỉ ẩn «Staging», «Tin rao» — trái chữ ngưỡng «không có số bản ghi S02»; (c) «—» kèm chú thích
  chân bảng — «—» trên cổng Ops nghĩa là «chưa có số» (ON3), dễ đọc nhầm.

- **Hỏi-2 — «Rotation chỉ còn đếm job» là đếm gì?** Khuyến nghị (a): panel chỉ còn lịch chạy, số lượt thu mỗi đêm và
  giờ cập nhật cuối — không số thị trường, không con trỏ, không tên. Lối khác: (b) giữ số thị trường trong vòng / con
  trỏ / số chờ thu như số đếm tác vụ — còn số lượng S02 trên trang; (c) bỏ hẳn panel — trạng thái tác vụ S02 đã ở lưới
  «Máy móc», nhưng mất dòng lịch vòng thu.

## 5. Không làm

- Trang `/ops` (Tổng quan) và các trang Ops khác — chỉ trang Thu thập.
- Sửa số «Staging» S02 đang lấy nhầm bảng S01 — ô bị ẩn ở vòng này; sửa nguồn số là việc riêng.
- Khối `records24h` / `rotation` trong bản tin máy thu (`push-ops-facts.mjs`, T3 — ON7).

## Đặc tả UX

<!-- <<<UX-SPEC-TEMPLATE -->
### 1. Luồng

- Suôn sẻ: người trực mở `/ops/collections` → đọc biểu đồ «Luồng 7 ngày» (tab Listing = tự thu) → lưới nguồn → Rotation
  (điểm ra: `/ops/quality` khi cần số S02, qua ô «Xem Chất lượng»).
- Biên: tab Listing 7 ngày không có listing tự thu → Empty «Chưa có luồng» như hiện nay.
- Lỗi & quay lại: không thêm đường lỗi mới — vùng giữ trạng thái lỗi/rỗng hiện có.

### 2. Kiểm kê màn

| Màn | MỘT việc của màn | Vào từ / ra tới |
|---|---|---|
| `/ops/collections` | hôm nay chảy vào gì (không tính S02) | nav Ops / `/ops/quality` |

### 3. Bảng trạng thái

<!-- <<<UX-STATE-TABLE -->
| Trạng thái | Màn | Hiển thị gì | Người làm gì tiếp |
|---|---|---|---|
| ST-thu-thap-listing | `/ops/collections` | tab Listing một chuỗi «S01 — listing tươi», mô tả «Listing tự thu (S01)…» | đọc |
| ST-thu-thap-s02-hang | `/ops/collections` | hàng S02 của lưới nguồn: trạng thái + độ tươi, ba ô số theo Hỏi-1 | bấm sang Chất lượng |
| ST-thu-thap-rotation | `/ops/collections` | Rotation chỉ số đếm, không tên thị trường | đọc |
<!-- UX-STATE-TABLE>>> -->

### 4. Hành vi

- Ô «Xem Chất lượng» là liên kết chữ trong ô bảng, `text-muted-foreground`, canh phải như ô số.

### 5. Xuất xứ component

| Component | Nấc (dùng / ghép / mở rộng / tạo) | Vì sao (1 dòng) |
|---|---|---|
| `SyncActivity`, `FlowTable`, `RotationPanel`, `FeedsGrid`, `CollectionsTiles` | mở rộng | bớt chuỗi/cột/ô, đổi chữ — không component mới |

### 6. Khuôn IA đã chọn + căn cứ

Khuôn IA: bảng-điều-khiển (dashboard-first)
Căn cứ: luồng hiển nhiên — `/ops/collections` là Dashboard grid theo `onehub-ui/routes.md`; vòng chỉ bớt số của một nguồn.
<!-- UX-SPEC-TEMPLATE>>> -->
