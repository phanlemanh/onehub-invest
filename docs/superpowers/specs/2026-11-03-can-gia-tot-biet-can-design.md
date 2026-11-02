# Căn giá tốt: biết căn nào, ở đâu, vì sao giá tốt (CG1)

Hàng CG1 của đợt `can-gia-tot-0311`, ô cơ hội `_acceptance/can-gia-tot-biet-can/opportunity.md` (Mạnh ký `build`).

## Bài toán

Phiên nghiệm thu `people-hien-so-goc` ngày 03/11, Mạnh chấm 3: không dùng được. Thẻ `/ops/deals` có số và nút gọi, nhưng
vai Vận hành không thấy ảnh hay chữ bài, nên không biết đó là căn gì. Số hôm nay: 4 căn, 3 căn có dòng ảnh trong bảng
`media`, cả 4 có chữ bài và SĐT, 3 căn loại hình `unknown`, 1 căn có mã toà, 0 căn có toạ độ hay tên đường.

## Hướng đã chọn

Danh sách + trang một căn. Thẻ danh sách trả lời nhanh «căn nào, rẻ bao nhiêu» và dẫn tới `/ops/deals/<offerId>`. Trang
một căn trả lời đủ năm câu: căn nào, ở đâu, ảnh gì, vì sao giá tốt, gọi ai. Căn thiếu dữ liệu ghi rõ thiếu gì.

Hướng bị loại:

- Mở hộp thoại ngay trên danh sách: không có đường dẫn riêng để gửi cho đồng đội hay gắn kết quả xác minh ở CG5.
- Nhồi hết vào thẻ: 12 ảnh và chữ bài dài làm lưới 30 thẻ không quét được.

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

- Suôn sẻ: `/ops/deals` → bấm thẻ → `/ops/deals/<offerId>` → xem ảnh, đọc chứng minh → bấm số để gọi (điểm ra: cuộc gọi).
- Biên: căn không ảnh, loại hình chưa rõ, chỉ biết phường, căn đã rời danh sách, vai Người xem, chạy trên cloud.
- Lỗi & quay lại: DB lỗi → khối lỗi có Thử lại; mã căn sai → «không tìm thấy» kèm liên kết về danh sách.

### 2. Kiểm kê màn

| Màn | MỘT việc của màn | Vào từ / ra tới |
|---|---|---|
| Căn giá tốt | Chọn căn đáng xem | Menu Ops / trang một căn |
| Một căn | Biết đủ để quyết có gọi không | Thẻ, đường dẫn gửi nhau / cuộc gọi, về danh sách |

### 3. Bảng trạng thái

<!-- <<<UX-STATE-TABLE -->
| Trạng thái | Màn | Hiển thị gì | Người làm gì tiếp |
|---|---|---|---|
| ST-ds-loading | Căn giá tốt | Skeleton lưới thẻ | Chờ |
| ST-ds-empty | Căn giá tốt | «Chưa có căn nào giảm từ 5% so với thước phường» | Mở Chất lượng dữ liệu |
| ST-ds-error | Căn giá tốt | Khối lỗi có Thử lại | Thử lại |
| ST-ds-du | Căn giá tốt | Thẻ có ảnh đầu, tên căn, giá, mức giảm, số mục thiếu | Bấm thẻ |
| ST-ds-khong-anh | Căn giá tốt | Ô «Chưa có ảnh» cùng cỡ ảnh | Bấm thẻ |
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

### 5. Xuất xứ component

| Component | Nấc | Vì sao |
|---|---|---|
| `ReviewPhotos` | dùng | Dải ảnh, phóng to, ảnh hỏng đã có ở thẻ duyệt |
| `reui/frame`, `ui/table`, `reui/badge` | dùng | Khuôn trang chi tiết của `/ops/people/[partyKey]` |
| `ui/card` | dùng | Thay khối tự vẽ `rounded-xl border` của thẻ cũ |
| `ui/empty`, `RegionError`, `ui/skeleton` | dùng | Trạng thái chuẩn của kho; `NotFoundState` không dùng vì nó dẫn về Invest, không về danh sách |

### 6. Khuôn IA đã chọn + căn cứ

Khuôn IA: danh-sách-chi-tiết (master-detail).
Căn cứ: danh bạ `/ops/people` → `/ops/people/[partyKey]` của chính kho, vai này đã quen; đường dẫn riêng là chỗ gắn kết quả xác minh của CG5.

## Ngoài hàng này

Lọc và bảng xếp hạng (CG3), tin S06 vào danh sách (CG2), cho thuê (CG4), ghi xác minh (CG5), nhãn biên tập (CG6), Invest
(CG7). Ảnh và chữ bài trên cloud thuộc TV9, TV10. Bản đồ: 0 căn có toạ độ nên chưa có gì để vẽ.
