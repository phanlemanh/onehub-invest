# Ảnh trên thẻ gắn nhãn — thiết kế (`anh-tren-the-gan-nhan`)

## Vì sao

Mạnh báo khi gắn nhãn (05/11): ảnh hiện thành một dòng link, người gắn phải mở từng link. Đo trên lát `s03-theo-nhom`, 367 bài:

| Đo | Số |
|---|---|
| Bài chỉ có link, không có chữ | 180 |
| Bài có chữ lẫn link | 109 |
| Bài có ảnh khai trong `media`, `media_files` | 283, mỗi bài một ảnh |
| Có tệp đã lưu ở snapshot | 199, cả 199 tệp còn trên đĩa |
| Chỉ có URL gốc | 84 |
| Dòng lỗi tải (`error`) | 56 |
| Bài có link không phải ảnh của bài | 8 |
| Không chữ link, không ảnh | 78 |

Đo đường lấy hộ trên 84 bài chỉ có URL, chỉ báo số: 48 lấy được, 36 không. Cả 36 ca đó URL gốc cũng trả 400 khi gọi thẳng, nên ảnh đã mất ở nguồn, đi đường nào cũng hỏng; 36/367 bài sẽ hiện «Ảnh không tải được». Sau khi bỏ `http(s)://` còn 2 bài có `www.` và 3 bài có dạng tên miền trong chữ, nên phải bỏ cả hai dạng này.

## Cách làm

1. **Hàm thuần `app/src/lib/labels-anh.ts`**: `chuKhongLink(text, urlAnh)` bỏ mọi URL, `www.` và dạng tên miền khỏi chữ hiện, trả số link không thuộc ảnh của bài; `danhSachAnh(media, media_files)` xếp tệp đã lưu trước, rồi URL gốc, không trùng. Chữ lưu trong DB và băm chữ không đổi.
2. **`tinKe`, `doiChieu`** đọc thêm hai cột `media`, `media_files`; trả xuống trình duyệt `chu` đã bỏ link, `anh` chỉ là đường `/api/zalo-media?nhan=<item_id>&anh=<thứ tự>`, `soLinkKhac`. Không có URL gốc trong dữ liệu trang. Vẫn gắn mù: không đọc bảng nào mang giá trị máy đọc, kể cả kết quả đọc ảnh.
3. **Chế độ `?nhan=&anh=` của `/api/zalo-media`** cùng cửa vai với `?media=`: tra bài theo `item_id` của `eval_label_items`, chỉ nhận hai số. Có tệp thì đi đúng đường `snapshotMediaPath` + `sendImage` (hai lớp kiểm đường dẫn), không thì `layAnhGoc` (chặn SSRF, không lộ URL). Chỉ đọc snapshot. Bảng vắng trên cloud trả 404; màn trên cloud vẫn hiện «chỉ ở máy thu» như cũ.
4. **Thành phần `app/src/components/ops/labels/anh-bai.tsx`**: dải ảnh trong đầu thẻ, bấm để xem lớn. Dựa trên `ui/attachment` và `Dialog` như `ops/review-photos.tsx`, thêm trạng thái tải và nút thử lại mà thành phần kia không có; không sửa thành phần kia vì `/ops/review` đang dùng.

## Hỏi-2: ảnh chỉ có URL đi qua máy chủ

Giao việc ghi «không có tệp thì mới dùng URL gốc». Khuyến nghị dùng URL gốc ở máy chủ, không đưa xuống trình duyệt: luật 6 cấm tên miền nguồn tới trình duyệt, và đo trên đây cho thấy đi đường nào cũng cùng 48 được, 36 hỏng. Lối khác là để trình duyệt tải thẳng: nhanh hơn chút, nhưng lộ tên miền nguồn trong dữ liệu trang và ảnh chứng, trái lời giao.

## Hỏi-3: duyệt giao diện bằng chữ

Khuyến nghị bỏ bản mẫu bấm được ở cổng này vì việc gấp: Mạnh duyệt bằng chữ, nhìn bản thật ở Cổng Bằng chứng. Phần mới so với `/ops/review`: dải ảnh nằm trong đầu thẻ dính, ô tải, nút Thử lại. Lối khác là dựng bản mẫu trước, chậm thêm một lượt.

## Hỏi-1: căn cứ «Ảnh»

`basis` có `chu_bai`, `ngu_canh_nhom`, `kien_thuc_nghe`. Số đọc từ ảnh không thuộc loại nào, trong khi 180/367 bài chỉ có ảnh, nên người gắn sẽ chọn «Chữ» và bảng so sai căn cứ. Khuyến nghị thêm `anh`: migration 075 đổi CHECK, thêm nút thứ tư, nhãn đã lưu không đổi; 075 phải áp trên DB thật trước khi gộp, xin giám sát kèm `pg_dump`, không thì bấm «Ảnh» bị CHECK từ chối. Lối khác là không thêm: không có migration, nhưng ô đọc từ ảnh ghi sai căn cứ và phải sửa dữ liệu về sau.

## Đặc tả UX

<!-- <<<UX-SPEC-TEMPLATE -->
### 1. Luồng

- Suôn sẻ: `/ops/labels` → thấy ảnh trong đầu thẻ, chữ bên cạnh → bấm ảnh xem lớn, đọc chữ trên ảnh → đóng, điền biểu mẫu.
- Biên: bài chỉ có ảnh thì không có dòng chữ; bài không chữ không ảnh hiện một câu; bài có link khác hiện «Bài có N liên kết khác», không hiện link, kể cả khi không có chữ và ảnh.
- Lỗi & quay lại: ảnh không tải được → ô báo lỗi + «Thử lại», vẫn gắn tiếp được bằng «Không suy ra được».

### 2. Kiểm kê màn

| Màn | MỘT việc của màn | Vào từ / ra tới |
|---|---|---|
| `/ops/labels` đầu thẻ | Cho người gắn thấy đủ nội dung bài | giữ nguyên |
| Hộp xem lớn | Đọc chữ trên ảnh | từ ô ảnh / đóng về thẻ |

### 3. Bảng trạng thái

<!-- <<<UX-STATE-TABLE -->
| Trạng thái | Màn | Hiển thị gì | Người làm gì tiếp |
|---|---|---|---|
| ST-anh-tai | đầu thẻ | Skeleton đúng cỡ ô ảnh | chờ |
| ST-anh-co | đầu thẻ | Ảnh, bấm được | xem lớn |
| ST-anh-loi | đầu thẻ | «Ảnh không tải được» + Thử lại | thử lại hoặc gắn tiếp |
| ST-anh-trong | đầu thẻ | «Bài không có chữ và không có ảnh.» | bấm «Không suy ra được» |
| ST-anh-lon | hộp xem lớn | Ảnh trọn khung, không cắt | đóng bằng Esc hoặc nút |
<!-- UX-STATE-TABLE>>> -->

### 4. Hành vi

- Ô ảnh bấm được bằng bàn phím, có tên «Xem lớn ảnh 1». Đầu thẻ vẫn dính khi cuộn, nên ô ảnh giữ cỡ nhỏ, không che biểu mẫu trên điện thoại.

### 5. Xuất xứ component

| Component | Nấc | Vì sao |
|---|---|---|
| `ui/attachment`, `ui/dialog`, `ui/skeleton`, `ui/button` | ghép | theo `@reui/c-attachment-3` đang dùng ở `/ops/review` |
<!-- UX-SPEC-TEMPLATE>>> -->
