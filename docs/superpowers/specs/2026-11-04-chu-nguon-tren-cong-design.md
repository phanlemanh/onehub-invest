# Chữ về nguồn trên cổng Invest — thiết kế

Cổng Invest ra mắt 05/11. Luật 6 của AGENTS.md: tên nguồn thật là tầng A, ngoài `/ops/sources` chỉ dùng mã `S0x` kèm vai trò, và cổng Invest chỉ
nhãn tầng C. Giám sát đo production sáng 04/11, thấy tên S01, S02 trên năm trang. Việc này chỉ đổi chữ hiện trên `app/`, không đổi dữ liệu, route, tên
tệp hay lịch sử git: Mạnh chốt dọn tên nguồn trong kho sau 05/11. Giám sát mở rộng phạm vi từ năm trang lên toàn bộ trang công khai đo được ngày 04/11.

## Số đo 04/11

Đo trên bản `main` đang chạy ở :3456, bằng `scripts/quet-ten-nguon-html.mjs`, đếm theo mã:

| Trang | Chữ hiện | Toàn HTML |
|---|---|---|
| `/` | S01=6 | S01=10 |
| `/vn/hanoi` | S01=5 | S01=33 |
| `/vn/hanoi/listings/sale` | S01=3 | S01=7 |
| `/vn/hanoi/listings/rent` | S01=3 | S01=7 |
| `/vn/hanoi/listings/rent?term=short` | S01=3 | S01=7 |
| `/methodology` | S01=8, S02=2 | S01=19, S02=7 |
| `/vn` | S01=3 | S01=6 |
| `/vn/hanoi/map` | S01=3 | S01=6 |
| `/yield` | S01=7 | S01=11 |
| `/compare` | S01=2 | S01=4 |
| `/register` | S01=1 | S01=1 |

Ngoài chữ thấy được còn hai chỗ chỉ phép đo toàn HTML bắt: `id` ô của trang Phương pháp, và mã snapshot của `getSupplyHistory` trong dữ liệu nhúng của
`/vn/[market]`.

`market_asset_stats` tính từ `sale_offers` thật theo `pipeline/sql/500_asset_stats.sql`: 31.261 tin bán và 29.616 tin thuê trên 372 dòng phường, nguồn S03,
S05, S06, ba thị trường Hà Nội, TP. Hồ Chí Minh, Đà Nẵng. Không có S02, S08. Câu «tin rao giả lập» là sai hiện trạng. `docs/product/CONTEXT-PRODUCT.md` §3
còn ghi tập trung Hà Nội, nên chữ trên cổng không nêu tên thị trường, chỉ nói chưa phủ mọi thị trường.

## Cách làm

- **Nhãn trung tính.** Thêm hai thuật ngữ vào `CONTEXT.md`: «Nền tảng thuê ngắn hạn» cho S01, «Nguồn tham chiếu trả phí» cho S02. «Tự thu thập» thay chỗ
  nói về nguồn số liệu. Định danh trong mã không hiện ra (tên biến, tên bảng, tiền tố `abnb_`) để nguyên.
- **Chân trang.** Bỏ tên bộ dữ liệu cũ của S01: ADR-0003 ghi nó đã bỏ Việt Nam, ADR-0008 đã xoá Bangkok, nên không còn dữ liệu nào cần ghi công. Giữ
  OpenStreetMap vì giấy phép đòi ghi công và S04 không khớp sổ tên.
- **Mã snapshot.** Bỏ `snapshotId` khỏi `SupplyPoint`: trình duyệt chỉ dùng nó làm khoá React, giá trị có tên S01 trong chuỗi.
- **Giá rao.** Câu nói giá bán, thuê là dữ liệu mô phỏng trên `/`, `/methodology`, `/vn/[market]`, `/yield`, `/compare` đổi sang «trung vị giá rao của tin thật,
  chưa phải giá giao dịch». Số mô hình giữ nhãn MÔ PHỎNG, đúng định nghĩa của `CONTEXT.md`: bảng Lợi suất, đầu trang `/yield`, ô Yield ròng dài hạn và câu tóm tắt,
  nhóm Lợi suất của So sánh. Hai đầu mục bỏ chữ «DỮ LIỆU» vì đầu vào là thật.
- **Trang gốc.** Mạnh chốt 04/11 giữ nút mở trang gốc trên `/listing/[id]` cùng đường link trên miền S01, chữ trên nút dùng «Mở trang gốc». Prop đổi tên
  `originalUrl` vì lên dữ liệu nhúng của client component. Phép quét chỉ miễn đúng khuôn `https://www.<tên>.com/rooms/<số>` trên trang đó.
- **Nhãn «Chưa xác minh».** Nút ⓘ cạnh nhãn, bấm mở `ui/popover`. Không dùng tooltip vì điện thoại không mở được. Dòng `Badge` giữ nguyên từng chữ, nên
  các ca ghim của `s03-len-cong`, `so-ghep-s06-nhan-danh-ba` không đổi.
- **Hai thước.** `scripts/quet-ten-nguon-html.mjs` đo HTML thật, cần bản chạy. `scripts/check-invest-tier-a.mjs` đi theo import của năm trang, dùng lại bộ
  quét chữ hiển thị của Ops, cộng biến chuỗi trong `.tsx`, chạy được ở CI. Cả hai rút tên từ `db/migrations`, báo bằng mã.

## Đặc tả UX

<!-- <<<UX-SPEC-TEMPLATE -->
### 1. Luồng

- Suôn sẻ: thẻ tin có nhãn «Chưa xác minh» → bấm nút ⓘ → đọc một câu giải thích → bấm ra ngoài hay Esc để đóng (điểm ra: vẫn ở thẻ).
- Biên: thẻ không có nhãn thì không có nút; thẻ có cả hai nhãn thì có hai nút, mỗi nút một nghĩa.

### 2. Kiểm kê màn

| Màn | MỘT việc của màn | Vào từ / ra tới |
|---|---|---|
| Thẻ tin rao (`/vn/[market]/listings/sale`, `/rent`) | Cho biết tin và cách liên hệ, nay kèm nghĩa của nhãn | danh sách tin / liên hệ người đăng |

### 3. Bảng trạng thái

<!-- <<<UX-STATE-TABLE -->
| Trạng thái | Màn | Hiển thị gì | Người làm gì tiếp |
|---|---|---|---|
| ST-the-tin-dong | Thẻ tin rao | Nhãn cộng nút ⓘ; chữ giải thích không có trong HTML | bấm ⓘ |
| ST-the-tin-mo | Thẻ tin rao | Popover: «Tin từ nhóm cộng đồng, chưa đối chiếu với nguồn khác. Nên tự kiểm trước khi giao dịch.» | đọc, đóng |
| ST-the-so-mo | Ô liên hệ | Popover: «Số không lấy trực tiếp từ chính tin này, có thể suy từ tin khác cùng tài khoản. Nên hỏi lại khi gọi.» | đọc, đóng |
<!-- UX-STATE-TABLE>>> -->

### 4. Hành vi

- Nút có `aria-label`, mở được bằng bàn phím và chạm; Esc đóng; hẹp 375 không tràn ngang.

### 5. Xuất xứ component

| Component | Nấc (dùng / ghép / mở rộng / tạo) | Vì sao (1 dòng) |
|---|---|---|
| `ui/popover` + `ui/button` (ghost, `icon-xs`) | ghép | Có sẵn, đúng cách của nút ⓘ trên `slice-legend`, đổi tooltip thành popover để bấm được trên điện thoại |

### 6. Khuôn IA đã chọn + căn cứ

Khuôn IA: danh-sách-chi-tiết (giữ nguyên).
Căn cứ: nấc (ii), không đổi cấu trúc trang, chỉ thêm lời giải thích trong thẻ có sẵn.
<!-- UX-SPEC-TEMPLATE>>> -->
