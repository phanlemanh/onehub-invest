# Thiết kế — hieu-chuan-mot-bo-so (ON10)

Căn cứ: `docs/plan/lo-trinh.json` ON10 · `docs/plan/pham-vi-ops-noi-that-2410.md` OPS-11, OPS-15.

## Vấn đề

Vùng «Hiệu chuẩn» của `/ops/quality` (số S02 được phép ở đây — luật 5):

- `getAirdnaComparison` lấy crosswalk `area_sources … LIMIT 1` không `ORDER BY`: khu vực gộp nhiều market S02 (sau sáp
  nhập tỉnh) bốc ngẫu nhiên một market, có khi market rỗng → thẻ Cần Thơ «score 0» cạnh bảng toàn quốc 97,14.
- Ba bảng dùng ba định nghĩa «tự thu» cùng nhãn: thẻ hiệu chuẩn `max(listing_count)` của `market_metrics`, bảng Độ phủ
  `count(listings)` của cây khu vực, bảng toàn quốc `listing_count` tháng cuối — Hà Nội 257 / 267 / 39.
- Mẫu 1 listing (Đồng Nai, công suất 96,7%) không cờ.
- 10/29 thẻ toàn «—», header vẫn đếm 29.

## Cách làm

1. **Một bộ số «tự thu»** (Hỏi-3, khuyến nghị): hàm `ourListingCounts()` trong `app/src/lib/calibration.ts` = số listing tự thu đang có trong
   bảng `listings` của cả cây khu vực (đúng định nghĩa bảng Độ phủ đang dùng). Thẻ hiệu chuẩn, bảng Độ phủ và bảng toàn quốc
   cùng đọc số này cho dòng «Listing tự thu» → cùng một khu vực ra cùng một số ở mọi bảng. ADR và công suất tự thu của thẻ
   giữ nguồn `market_metrics` (cả cửa sổ) nhưng được ghi định nghĩa riêng.
2. **Crosswalk xác định**: khu vực có nhiều market S02 → chọn market đại diện theo luật cố định — nhiều `listing_count`
   S02 nhất, hoà thì `airdna_id` nhỏ nhất (`ORDER BY`). Thẻ ghi «đại diện cho k market S02». Chạy hai lần ra cùng số.
3. **Định nghĩa ghi rõ ở từng bảng**: mỗi bảng (thẻ hiệu chuẩn, Độ phủ, toàn quốc) có một dòng mô tả nói «tự thu» là gì
   (listing đang theo dõi trong cây khu vực; ADR/công suất trên cửa sổ lịch đã thu).
4. **Mẫu mỏng** (Hỏi-2): cờ tính trên cỡ mẫu sinh ADR/công suất của thẻ (`listing_count` của `market_metrics`), không
   trên số listing trong cây — ca Đồng Nai: cây ≥ 5 nhưng metrics 1. Khuyến nghị ngưỡng < 5 → thẻ mang nhãn «mẫu mỏng»
   (`Badge warning-light`) cạnh số ấy; số vẫn hiện.
5. **Thị trường chưa có số**: thị trường mà mọi số (cả hai phía và điểm thị trường) đều trống → không vẽ thẻ; gộp thành MỘT
   dòng «Chưa có số: A, B, …». Đầu trang đếm «n thị trường hiệu chuẩn» chỉ tính thị trường có số.
6. Logic chọn/gộp nằm trong hàm thuần (`pickRepresentative`, `isEmptyComparison`, `splitCalibrated`) để test được; truy
   vấn trong `calibration.ts`, trang chỉ đọc.

## Chữ trên trang (Hỏi-4)

«Chưa có số: A, B, …» · «<n> thị trường hiệu chuẩn» · «đại diện cho <k> market S02» · Badge «mẫu mỏng» · câu định nghĩa
«Listing tự thu: số listing đang theo dõi trong cả khu vực (gồm phường con)». Vùng gọi đối tượng là «thị trường». Evals
ghim nguyên văn; `CONTEXT.md` thêm «Listing tự thu», «Mẫu mỏng», «Thị trường hiệu chuẩn».

## Phép đo

- App `npm test`: hàm thuần bằng ma trận viết trước; truy vấn chạy trên fixture trong BEGIN…ROLLBACK (khuôn ON9/ON11);
  bảng/thẻ vẽ trong jsdom.
- Dữ liệu thật: `scripts/hieu-chuan-do.mjs` (tsx của app, chỉ đọc) — mỗi khu vực «tự thu» bằng nhau ở ba bảng, chạy hai lần
  ra cùng số, đếm hiệu chuẩn = số thị trường có số, in danh sách mẫu mỏng.
- Ảnh chụp trang đang chạy: theo Hỏi-1 — khuyến nghị bỏ ở vòng này (bước chụp hiện không đăng nhập được `/ops`) và mở
  việc phụ «chụp /ops có phiên ops»; lối khác dựng bước chụp có phiên ngay trong vòng (+1 tiêu chí, +1 eval ui-check).

## Không làm

- Đổi vùng thẻ sang một data-grid (OPS-15 «cân nhắc») — đổi bố cục, để đợt UI.
- Gộp ADR/công suất/điểm của nhiều market S02 thành một số (điểm không cộng được) — dùng market đại diện.
- Số S02 lên cổng Invest (luật 5).
