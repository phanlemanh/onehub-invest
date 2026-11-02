# Tin rao trên cổng Invest: người bán lên cloud, API công khai, một trang Listing

Hồ sơ `_acceptance/tin-rao-tren-invest/`. Căn cứ: ROADMAP §3 mục 25 (Mạnh chốt 02/11), báo cáo
`docs/research/kiem-tin-dau-ra-toan-thi-truong-0211.md` §10.3, §10.5.

## Vì sao

Nhà đầu tư chưa thấy một tin rao nào trên cổng Invest: `/vn/[market]/listings` chỉ có listing thuê ngắn hạn, `/api/v1/offers` đóng cho ops,
tên và SĐT người bán ở lại máy thu. Vòng này mở trọn đường đi cho **các cột đang có**: SĐT từng kênh về tới đâu thì hiện tới đó, không phải sửa cổng thêm.

## Số đo lúc thiết kế (DB máy thu, 02/11)

| Nguồn | Tin hiện được (đủ điều kiện ở mục 4 của Phương án) | Trong đó có số |
|---|---|---|
| S06 | 39.823 | 0 |
| S03 | 4 | 3 |

Ngày đầu gần như mọi tin hiện «Chưa có số». Đây là trạng thái thật cho tới khi làn thu giao SĐT S06 (đầu việc đã chuyển điều phối liên làn).

## Phương án

1. **Sync.** `seller_name`, `seller_phone` của `sale_offers` vào `CLOUD_ALLOW`, bỏ khỏi `PII_EXCLUDE`. `sellers.name`, `properties.seller_name` ở lại: chưa có màn nào đọc. Phạm vi dòng là mọi dòng `sale_offers`, gồm cả tin cũ và tin thiếu trường, vì `/ops` vẫn đọc các dòng đó và định danh người bán là tầng C. Đo 02/11: bảng này có 0 dòng S02, S08 (S06 46.926, S03 2.772, S05 28). Anon không đọc được: sync đã có `gateAnon` dừng lượt nếu vai công khai đọc được cloud.
2. **Tên nguồn trong giá trị.** Đo được 1 tên người bán chứa định danh nguồn. Giá trị như vậy bị che (NULL) ngay ở câu đọc local, có dòng cảnh báo chỉ đếm. Bộ soát cũ giữ nguyên làm chốt cuối: mở cột mà không che thì lượt sync dừng mỗi đêm.
3. **Cloud.** Tệp catch-up chỉ `ADD COLUMN`. Thứ tự buộc: bật tường lửa, gộp, kéo về checkout chính, chạy catch-up, rồi sync. Trong khi cloud chưa có bốn cột, sync bản mới chỉ cảnh báo lệch schema và không gửi bốn cột đó, không dừng. Tường lửa đứng đầu vì trang Bán mặc định đọc bốn cột mới: gộp xong mà chưa catch-up thì Bán và Thuê dài hạn báo lỗi tại chỗ, Thuê ngắn hạn vẫn chạy. Nếu chờ tường lửa sau khi gộp mà gói Vercel không chặn được, cửa sổ lỗi đó kéo dài nhiều ngày. Xếp như trên thì cửa sổ chỉ còn vài phút từ lúc gộp tới lúc catch-up. Chạy catch-up trước khi kéo về thì bản sync cũ gặp cổng cột và dừng. Không chặn được cào ở tường lửa thì dừng ở bước đầu, chưa gộp gì, chọn lại cách chặn.
4. **Một chỗ quyết tin nào hiện:** `lib/offers-public.ts`. Điều kiện: đủ năm trường lõi của bậc B1 (`lib/data-level.ts`), cập nhật trong 30 ngày, giá không phi lý (bán từ 500 triệu; thuê từ 500 nghìn tới dưới 500 triệu một tháng), S02 và S08 không bao giờ. Đo 02/11: giá phi lý là 137 tin, nhưng sắp giá tăng ở TP.HCM cả 25 tin trang đầu thuộc nhóm này.
5. **API.** Một API Listing theo RESO: `GET /api/v1/listings?kind=sale|rent_lt` trả tin rao công khai, danh sách không mang SĐT, chỉ cờ `hasPhone`. Không truyền `kind` hoặc `kind=rent_st` đi nhánh cũ nguyên vẹn, kể cả trần `limit` 200 và mã thị trường cũ; `kind` lạ trả 400. Mô tả công cụ MCP ghi chưa hứa ổn định. `GET /api/v1/listings/<id>/contact` trả số từng tin, cùng một 404 cho mọi ca không có số. Không trả mã nguồn, `seller_ref`, liên kết gốc, `post_ids`. Riêng nhánh tin rao: `limit` tối đa 50, `offset` tối đa 960. `/api/v1/offers` giữ nguyên chế độ `ops` và khuôn trả về cũ, không mở ra ngoài.
6. **Giới hạn tần suất ở nền tảng** (Vercel Firewall trên đường contact), không viết trong mã: bộ đếm trong tiến trình không dùng chung giữa các instance serverless. Tài liệu Vercel ghi tính năng này có ở mọi gói, Hobby được một luật cho mỗi dự án. Một báo cáo cộng đồng nói chọn trả 429 trên Hobby lại đòi nâng Pro, và em chưa xác định được gói của tài khoản. Vì vậy phép thử vượt ngưỡng nhận 429 là bước đầu của thứ tự ở mục 3.
7. **Sổ bề mặt.** Giữ luật «public không đọc `sale_offers`», thêm khoá riêng `publicOffers` cho đúng ba thứ: `v1/listings`, `v1/listings/[id]/contact` và `lib/offers-public.ts`. Route public khác đọc bảng này vẫn đỏ. Thêm công cụ MCP `oneinvest_get_listings` chế độ `public`; `oneinvest_get_offers` vẫn `ops`.
8. **Tài khoản nhiều tên.** `seller_ref` có từ 3 tên khác nhau trở lên: ô người đăng ghi «Tài khoản nhiều tên». Đo: 1 tài khoản S06 đứng 72 tên trên 2.872 tin.
9. **Giao diện.** Header có Bán, Cho thuê thay mục Listing (Mạnh chốt 02/11): `/vn/<tt>/listings/sale`, `/vn/<tt>/listings/rent`, thuê ngắn hạn thêm `?term=short`; `/listings` chuyển 308 sang đó. Ô Dài hạn | Ngắn hạn đầu hàng lọc của Cho thuê. Cả ba dùng khung thẻ `ListingCardFrame` với các ô cố định: Ảnh · Giá · Thông số · Vị trí · hàng cuối gồm thông tin và một hành động. Giá/m² cùng hàng giá, thông số là một dòng chữ theo loại hình, tuổi tin cuối hàng vị trí, không ký hiệu ₫ (Mạnh chốt nhóm 1, 2 sau khi đối chiếu sàn ngoài 02/11). Tin rao lọc ở máy chủ, trạng thái nằm trên URL. Còn khác lúc ra mắt: bản đồ chỉ có ở thuê ngắn hạn; lọc thuê ngắn hạn chạy tại trình duyệt, không trên URL; trang chi tiết chỉ có ở thuê ngắn hạn.
10. **Dữ liệu chưa gộp.** Trang và API gom theo Listing, dữ liệu vẫn ở hai bảng. Gộp bảng là hàng `gop-bang-listing`, làm ngay sau ra mắt: 92 câu SQL ở 46 tệp đọc `sale_offers`, 49 câu ở 29 tệp đọc `listings`, không làm trong ba ngày.

## Không làm ở vòng này

Chốt nghĩa «sống», chuyển tiêu đề/đường/dự án từ thô lên tin chuẩn, gộp tin đăng lại (việc 1–3 §8.3), lấy số S03 theo người gửi, kiểm phủ theo nguồn: vòng riêng, không chặn nhau. Trang chi tiết tin, mô tả, bản đồ tin rao, tìm theo chữ. `street_raw` chỉ phủ 20% nên chưa đủ để tìm.

Ảnh tin rao là hàng `anh-tin-cong-khai`, chạy song song (Mạnh duyệt 02/11, kèm sửa ADR-0007 và AGENTS luật 6 trong chính hàng đó). Vòng này chỉ chừa ô ảnh: thẻ không ảnh thì không có panel ảnh, ảnh về thì không đổi bố cục. Luật ảnh chưa đổi cho tới khi hàng đó vào.

## Đặc tả UX

<!-- <<<UX-SPEC-TEMPLATE -->
### 1. Luồng

- Suôn sẻ: header Bán hoặc Cho thuê (giữ thị trường đang xem) → lọc → bấm «Xem số» → số thành link gọi (điểm ra: ứng dụng gọi điện).
- Biên: tin chưa có số; lọc ra 0; thị trường chưa có tin; quá 984 tin đầu thì dòng đếm bảo thu hẹp bộ lọc; ảnh hỏng hay chưa có ảnh thì thẻ không có ô ảnh.
- Lỗi & quay lại: tải vùng lỗi → cảnh báo tại chỗ có Thử lại, đầu trang và ô thời hạn vẫn đứng; lấy số lỗi → nút thành Thử lại; số vừa bị rút (404) → «Chưa có số».

### 2. Kiểm kê màn

| Màn | MỘT việc của màn | Vào từ / ra tới |
|---|---|---|
| Duyệt Listing · Bán, Thuê dài hạn | Tìm tin và lấy số người đăng | Header, trang thị trường / ứng dụng gọi điện |
| Duyệt Listing · Thuê ngắn hạn | Như cũ, đổi khung thẻ | `/listings/rent?term=short` / trang listing |

### 3. Bảng trạng thái

<!-- <<<UX-STATE-TABLE -->
| Trạng thái | Màn | Hiển thị gì | Người làm gì tiếp |
|---|---|---|---|
| ST-tin-rao-loading | Bán, Thuê dài hạn | Skeleton hàng công cụ, dòng đếm, sáu thẻ | Chờ |
| ST-tin-rao-co-tin | Bán, Thuê dài hạn | «3.374 tin bán · 1 tin có số · cập nhật trong 30 ngày», lưới thẻ | Lọc, xem số, sang trang |
| ST-tin-rao-loc-ra-0 | Bán, Thuê dài hạn | «Không có tin khớp bộ lọc» | Bấm «Xoá bộ lọc» |
| ST-tin-rao-dang-thu | Bán, Thuê dài hạn | «Đang thu thập tin rao ở <thị trường>» | Bấm «Xem Insight» |
| ST-tin-rao-loi | Bán, Thuê dài hạn | Cảnh báo «Không tải được tin rao của thị trường» | Bấm «Thử lại» |
| ST-nhieu-ten | Thẻ tin | «Tài khoản nhiều tên» thay cho tên | Xem số hoặc tin khác |
| ST-tran-984 | Dòng đếm | «Hiện 984 tin đầu, thu hẹp bộ lọc để xem thêm» khi quá trần | Thu hẹp bộ lọc |
| ST-ten-trong | Thẻ tin | «Chưa có tên» khi tên trống hoặc bị che | Xem số hoặc tin khác |
| ST-so-chua-co | Thẻ tin | Chữ mờ «Chưa có số» | Xem tin khác |
| ST-so-chua-bam | Thẻ tin | Nút «Xem số» | Bấm |
| ST-so-dang-lay | Thẻ tin | «Đang lấy…», nút khoá | Chờ |
| ST-so-da-hien | Thẻ tin | Link gọi `0912 345 678` | Gọi |
| ST-so-loi | Thẻ tin | Nút «Thử lại» | Bấm |
| ST-the-khong-anh | Mọi thẻ | Không có ô ảnh, các ô khác giữ thứ tự | Không cần làm gì |
<!-- UX-STATE-TABLE>>> -->

### 4. Hành vi

- Link nội bộ từ Insight và trang chi tiết thuê ngắn hạn trỏ `/listings/rent?term=short`; header và trang chủ trỏ thẳng `sale`, `rent`.
- Đổi bộ lọc, sắp xếp về trang đầu. Đổi thời hạn thuê bỏ mọi bộ lọc vì trường lọc và đơn vị giá hai bên khác nhau.
- Điều kiện chip đang soạn dở không đổi URL.
- Màn 375: không cuộn ngang trang, thẻ một cột, Giá ở đầu thẻ và nút lấy số ở hàng cuối.
- Giá viết một kiểu: `3,2 tỷ ₫`, `12 tr ₫/tháng`, `1,4 tr ₫/đêm`.

### 5. Xuất xứ component

| Component | Nấc (dùng / ghép / mở rộng / tạo) | Vì sao (1 dòng) |
|---|---|---|
| `ListingCardFrame` | mở rộng | Tách khung từ `ListingCard` (`@reui/product-grid-2`) để ba loại dùng chung |
| `OfferCard` | ghép | Khung thẻ cộng `OfferContact` |
| `reui/filters` + nhãn của `listings-filter-bar` | dùng | Cùng bộ lọc thuê ngắn hạn |
| `ui/toggle-group` | dùng | Thời hạn thuê, cùng kiểu Danh sách, Bản đồ |
| `ui/pagination` | dùng | Cài mới, khuôn `c-pagination-15`; `DataGridPagination` đòi bảng |
| `offers-filter-sheet` | mở rộng | Ngăn lọc màn hẹp, chuyển thể `@reui/filter-sidebar-5` |
| `RegionError`, `Empty`, `Skeleton` | dùng | Ba trạng thái chuẩn |
| `OfferContact` | ghép | `ui/button` + `reui/badge`, thêm logic lấy số |

### 6. Khuôn IA đã chọn + căn cứ

Khuôn IA: danh-sách-chi-tiết (master-detail), khuôn «Duyệt Listing» trong `routes.md`, phần chi tiết tin rao để vòng sau.
Căn cứ: `routes.md` đã ghi thẻ thay cho data-grid ở trang này; Listing là khái niệm cha (ROADMAP §3 mục 21), nên một trang và một thẻ. Ảnh về sau chỉ lấp ô đã chừa.
<!-- UX-SPEC-TEMPLATE>>> -->
