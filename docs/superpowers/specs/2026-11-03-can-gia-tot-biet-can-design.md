# Căn giá tốt: biết căn nào, ở đâu, vì sao giá tốt (CG1)

Hàng CG1 của đợt `can-gia-tot-0311`, ô cơ hội `_acceptance/can-gia-tot-biet-can/opportunity.md` (Mạnh ký `build`).

## Bài toán

Phiên nghiệm thu `people-hien-so-goc` ngày 03/11, Mạnh chấm 3: không dùng được. Thẻ `/ops/deals` có số và nút gọi, nhưng
vai Vận hành không thấy ảnh hay chữ bài, nên không biết đó là căn gì. Số hôm nay: 4 căn, 3 căn có dòng ảnh trong bảng
`media`, cả 4 có chữ bài và SĐT, 3 căn loại hình `unknown`, 1 căn có mã toà, 0 căn có toạ độ hay tên đường.

## Hướng đã chọn

Bảng cộng sheet, Mạnh chốt 03/11. Người vận hành cần nhìn nhiều, so nhanh, chuyển nhanh, nên bảng thay lưới thẻ: mỗi hàng
trả lời «căn nào, rẻ bao nhiêu, gọi ai»; tab trả lời «việc gì tiếp»; chip lọc trả lời «trong đám nào». Bấm hàng mở sheet
trả lời đủ năm câu: căn nào, ở đâu, ảnh gì, vì sao giá tốt, gọi ai, cùng tab so với các căn cùng tiêu chí. Trang
`/ops/deals/<offerId>` dùng chung phần thân với sheet, để gửi đường dẫn và gắn kết quả xác minh ở CG5. Căn thiếu dữ liệu
ghi rõ thiếu gì. So sánh ba hướng và ba nguồn từng khối: `_acceptance/can-gia-tot-biet-can/phuong-an.md`.

Hướng bị loại:

- Lưới thẻ cộng trang riêng (bản S1 đầu): 3 căn trọn màn so với 9, không so thẳng cột, phải quay lại mỗi lần chuyển căn.
- Chia đôi màn: panel 576 px chỉ còn 464 px cho bảng, mất cột so sánh.
- Chỉ sheet, không trang riêng: không có chỗ gắn kết quả xác minh ở CG5. Lý do cũ «hộp thoại không có đường dẫn» nay giải bằng `?can=`.
- Nhồi hết vào hàng: 12 ảnh và chữ bài dài làm bảng không quét được.

## Phần dữ liệu

- Không migration, không thu thêm. Đọc cột `sale_offers` có sẵn: `property_type`, `block_raw`, `floor_raw`,
  `unit_number`, `street_number`, `street_raw`, `district_raw`, cùng `areas.name`. Không đọc `listing_url` (tầng A).
- `getDeal(offerId)` đọc tin P1 bán theo mã, không lọc theo mức giảm; tính lý do rời danh sách từ cùng các hằng số với
  `dealsSql` (45 ngày, giảm 5–50%, có thước). Căn rời danh sách vẫn mở, kèm nhãn lý do (Hỏi-1). Mã lạ mới «không tìm
  thấy». Chữ bài ở trang một căn không cắt.
- Bản cloud chỉ đọc cột có trong `CLOUD_ALLOW` của `pipeline/sync-cloud.mjs`; `unit_number`, `street_number` không lên
  cloud nên ở đó trang không hiện hai mục này. Liên hệ hiện trên cloud cho vai Vận hành (Hỏi-2).
- Ảnh: `loadOfferMedia` + `buildMediaImages` của `app/src/lib/ops/review-media.ts`, tối đa 12, qua `?media=` hay
  `?snapshot=`. Bỏ `dealMediaSrc` và `?path=` khỏi Căn giá tốt, nên URL gốc không xuống trình duyệt.
- Vai: `dealTheoVai` đổi `noiDung` từ `isAdmin` sang `xemNoiDungTin`. Vai Người xem không nhận ảnh, chữ bài, liên hệ
  trong dữ liệu trang. Sửa cùng vòng: `scripts/check-portal-compliance.mjs` mục 4,
  `app/tests/danh-ba-nguoi-deals-lien-he.test.tsx`, `.claude/skills/onehub-ui/routes.md`.
- Chứng minh giá tốt: giá/m² của tin, thước phường, số tin dựng thước, mức giảm, đặt cạnh ba ngưỡng đọc từ hằng số trong
  `deals.ts`, câu SQL đọc cùng hằng đó: vào danh sách từ 5%, cần xác minh trên 35% (`NGHI_NGO_PCT`), bị loại trên 50%.
- Thiếu gì: hàm thuần `thieuGi(d, { xemNoiDung, mayThu })` trả danh sách nhãn. Chỉ nêu ảnh, chữ bài khi vai được xem và
  đang ở máy thu; SĐT khi vai được xem; trên cloud nói «Ảnh, chữ bài chỉ có ở máy thu», không nói căn thiếu.
- Vai Người xem chỉ thấy phường, không thấy toà, tầng, số căn, số nhà (Hỏi-4).

## Đặc tả UX

### 1. Luồng

- Suôn sẻ: `/ops/deals` → chọn tab, thêm chip nếu cần → bấm hàng mở sheet → xem ảnh, đọc chứng minh, so căn cùng tiêu chí → bấm số để gọi (điểm ra: cuộc gọi) → J sang căn kế.
- Gọi ngay: nút gọi trong hàng, không mở sheet.
- Gửi đường dẫn: `?can=<offerId>` hoặc trang `/ops/deals/<offerId>`.
- Biên: căn không ảnh, loại hình chưa rõ, chỉ biết phường, căn đã rời danh sách, vai Người xem, chạy trên cloud.
- Lỗi & quay lại: DB lỗi → khối lỗi có Thử lại; mã căn sai → «không tìm thấy» kèm liên kết về danh sách.

### 2. Kiểm kê màn

| Màn | MỘT việc của màn | Vào từ / ra tới |
|---|---|---|
| Căn giá tốt | Quét và chọn căn đáng xem | Menu Ops / sheet một căn, cuộc gọi |
| Sheet một căn | Biết đủ để quyết có gọi không, so với căn cùng tiêu chí | Hàng bảng, `?can=` / cuộc gọi, căn khác, trang một căn, về bảng |
| Một căn | Cùng phần thân với sheet, có đường dẫn riêng | Sheet, đường dẫn gửi nhau / cuộc gọi, về danh sách |

### 3. Bảng trạng thái

<!-- <<<UX-STATE-TABLE -->
| Trạng thái | Màn | Hiển thị gì | Người làm gì tiếp |
|---|---|---|---|
| ST-ds-loading | Căn giá tốt | Skeleton bảng | Chờ |
| ST-ds-empty | Căn giá tốt | «Chưa có căn nào giảm từ 5% so với thước phường» | Mở Chất lượng dữ liệu |
| ST-ds-error | Căn giá tốt | Khối lỗi có Thử lại | Thử lại |
| ST-ds-du | Căn giá tốt | Tab có đếm, chip lọc, bảng: ảnh, tên, giá, thanh giảm, tình trạng, nút gọi, ngày thấy | Bấm hàng hoặc gọi |
| ST-ds-khong-anh | Căn giá tốt | Ô biểu tượng không ảnh cùng cỡ ảnh | Bấm hàng |
| ST-ds-tab-trong | Căn giá tốt | Tab không có căn: câu nói tab này chưa có căn | Chọn tab khác |
| ST-ds-cloud | Căn giá tốt | Bảng không có ô ảnh, trường lọc Ảnh; câu «Ảnh, chữ bài chỉ có ở máy thu»; ảnh, chữ bài không tính là thiếu | Bấm hàng hoặc gọi |
| ST-ds-loc-trong | Căn giá tốt | «Không có căn nào khớp bộ lọc», nút Xoá của chip | Xoá chip |
| ST-ds-nguoi-xem | Căn giá tốt | Bảng không có ảnh, cột Gọi ai, trường lọc Ảnh | Bấm hàng |
| ST-sheet-du | Sheet một căn | Đầu ghim giá, thanh giảm; tab Chi tiết đủ mục; chân ghim người đăng, nút gọi | Gọi, hoặc J sang căn kế |
| ST-sheet-cung | Sheet một căn | Nhãn tiêu chí, hàng «Căn này», các căn kèm chênh tr/m² | Bấm hàng chuyển căn |
| ST-sheet-cung-trong | Sheet một căn | «Chưa có căn nào cùng tiêu chí», nút «Xem mọi căn trong phường» | Nới về phường |
| ST-sheet-thieu, ST-sheet-can-xac-minh, ST-sheet-nguoi-xem, ST-sheet-cloud | Sheet một căn | Như bốn trạng thái cùng tên của Một căn | Như Một căn |
| ST-can-loading | Một căn | Skeleton theo bố cục hai cột | Chờ |
| ST-can-du | Một căn | Ảnh, chữ bài, chứng minh, nơi ở, liên hệ, không có khối thiếu | Gọi |
| ST-can-thieu | Một căn | Khối «Còn thiếu» nêu từng mục | Gọi hỏi phần thiếu |
| ST-can-can-xac-minh | Một căn | Nhãn «Cần xác minh» và câu giảm trên 35% | Gọi xác minh |
| ST-can-roi-danh-sach | Một căn | Nhãn «Đã rời danh sách» nêu lý do, phần còn lại như thường | Về danh sách hoặc gọi |
| ST-can-nguoi-xem | Một căn | Số chứng minh và phường, không ảnh, chữ, liên hệ, địa chỉ chi tiết; câu nói cần vai Vận hành | Về danh sách |
| ST-can-cloud | Một căn | Số chứng minh, liên hệ, câu «Ảnh, chữ bài chỉ có ở máy thu» | Gọi, hoặc mở ở máy thu |
| ST-can-khong-tim-thay | Một căn | «Không tìm thấy căn này» | Về danh sách |
| ST-can-error | Một căn | Khối lỗi có Thử lại | Thử lại |
<!-- UX-STATE-TABLE>>> -->

### 4. Hành vi

- Ảnh hiện lưới lớn (biến thể `lon` mới của `ReviewPhotos`, thẻ duyệt giữ dải ảnh nhỏ). Bấm ảnh mở hộp phóng to có sẵn, duyệt bằng nút trước, sau. Ảnh hỏng hiện «Ảnh hỏng», không có ảnh vỡ.
- Từ 1024 px hai cột; hẹp hơn thì một cột, thứ tự: tên căn, ảnh, vì sao giá tốt, gọi ai, ở đâu, chữ bài. «Gọi ai» đứng trước «Ở đâu» để nút gọi không bị đẩy xuống dưới màn hình.
- Liên kết gọi là `tel:+84…`, chữ `0912 345 678`.
- Thứ tự mặc định của bảng là thứ tự `dealsSql`, căn «Cần xác minh» đứng cuối (ON11); bấm tiêu đề cột mới đổi. Trang 15 hàng.
- Tab mặc định «Tất cả». Mỗi căn thuộc đúng một tab: giảm trên 35% là «Cần xác minh», còn lại thiếu mục là «Còn thiếu», còn lại «Đủ để gọi». Số trên tab tính sau chip lọc.
- Chip: Phường, Loại hình, Nguồn, Ảnh; lọc phía trình duyệt trên các căn đã tải.
- J, K chuyển căn theo thứ tự đang thấy, dời trang theo; giữ nguyên tab trong sheet. `?can=` giữ căn đang mở; căn không có trong danh sách đã tải thì máy chủ chuyển sang `/ops/deals/<offerId>`, nơi đã xử lý mã lạ và căn rời danh sách. Đóng sheet thì hàng vừa xem giữ nền chọn.
- Căn cùng tiêu chí: cùng phường, cùng loại hình, diện tích ±25%, lấy trong danh sách; không biết loại hình hay diện tích thì bỏ tiêu chí đó và nhãn nói rõ; hiện tối đa 20 căn, cần xác minh đứng cuối. Mạnh yêu cầu danh sách; bộ tiêu chí là máy đề xuất.
- Từ 768 px có cột Giảm, Tình trạng; từ 1024 px cột Gọi ai; từ 1280 px cột Thấy. Dưới 768 px mức giảm nằm dưới giá.

### 5. Xuất xứ component

| Component | Nấc | Vì sao |
|---|---|---|
| `ReviewPhotos` | dùng | Dải ảnh, phóng to, ảnh hỏng đã có ở thẻ duyệt |
| `reui/frame`, `ui/table`, `reui/badge` | dùng | Khuôn trang chi tiết của `/ops/people/[partyKey]` |
| `reui/data-grid`, `reui/filters`, `reui/frame` | dùng | Khuôn `records-grid`, `records-filter` ở `/ops/data-flow` |
| `ui/sheet`, `ui/scroll-area` | dùng | Khuôn `record-sheet`, sheet hàng duyệt |
| `ui/tabs` | dùng | Tab có đếm như lưới mục tiêu ở `/ops` |
| `ui/progress`, `ui/hover-card` | dùng | Ô thanh theo finder; rê xem ảnh lớn |
| `DiscountBar`, `DealThumb`, `DealSimilar` | mới | Chưa có; ghép từ phần trên, thêm vào `catalog.md` |
| `ui/empty`, `RegionError`, `ui/skeleton` | dùng | Trạng thái chuẩn của kho; `NotFoundState` không dùng vì nó dẫn về Invest, không về danh sách |

### 6. Khuôn IA đã chọn + căn cứ

Khuôn IA: danh-sách-chi-tiết (master-detail), chi tiết mở bằng sheet.
Căn cứ: `/ops/data-flow` và `/ops/review` của chính kho đã dùng bảng cộng sheet, vai này đã quen; số đo so với lưới thẻ ở `phuong-an.md`; trang riêng theo `/ops/people/[partyKey]` là chỗ gắn kết quả xác minh của CG5.

## Ngoài hàng này

Lọc theo toà, dự án, đường, lọc phía máy chủ và xếp hạng theo độ tin, khu vực (CG3); tin S06 vào danh sách, phân trang phía máy chủ, sheet tải theo căn (CG2), cho thuê (CG4), ghi xác minh (CG5), nhãn biên tập (CG6), Invest
(CG7). Ảnh và chữ bài trên cloud thuộc TV9, TV10. Bản đồ: 0 căn có toạ độ nên chưa có gì để vẽ.
