# od2-phim-va-loi-ghi — thiết kế

Hồ sơ: `_acceptance/od2-phim-va-loi-ghi/`. Sinh từ Ngoài-5 của OD2 (`ops-duyet-hop-hang-muc`, Mạnh ký «mở hợp đồng mới»
08/11) cộng hai lỗi phím lượt chấm 1 của OD2 mà lượt 2 không nêu lại. Ba lỗi đều ở chế độ duyệt `/ops/review`, trong hai
tệp `hang-gui.tsx` và `use-phim-duyet.ts`, cộng chỗ nối ở `review-queue.tsx`. Không route mới, không migration, route
decide (`app/src/app/api/v1/ops/review/**`, đường T3) không đổi một dòng.

## Ba lỗi và cách sửa

### 1. Lệnh xả khi rời Hàng duyệt nuốt kết quả (Ngoài-5)

Hiện tại `HangGuiProvider` có hai đường gửi:

- hết 5 giây → `gui(lenh)`: chờ kết quả, gọi `onXong` hay `onLoi`;
- rời trang (`pagehide`) hay gỡ thành phần (chuyển route trong app) → `xa()`: gọi `guiQuyet(lenh, true)` rồi bỏ kết quả.

Đường thứ hai làm lỗi 4xx/5xx và lỗi mạng biến mất. Người duyệt thấy «Đã ghi #id · nhãn» lúc bấm, chuyển sang trang Ops
khác, và không bao giờ biết lần ghi hỏng; nút «Hoàn tác» của toast còn trả lời «đã ghi — quá 5 giây».

Sửa:

- `xa()` đi chung `gui()` — mọi lệnh, dù gửi lúc 5 giây hay lúc rời, đều về `onXong`/`onLoi`. Cờ keepalive đi trên chính
  lệnh (`LenhQuyet.keepalive`, hàng chờ tự đặt khi xả), nên dòng gửi của `gui()` giữ nguyên.
- Hàng chờ nhớ tình trạng từng lệnh đã rời hàng chờ: `dang-gui` → `da-ghi` (route 200) hay `loi`. Nhịp `onXep` nhận thêm
  hàm `tinhTrang()`; «Hoàn tác» bấm khi lệnh đã rời hàng chờ báo đúng tình trạng:
  - đang gửi → «#id đang gửi — không hoàn tác được»;
  - đã ghi → «#id đã ghi — quá 5 giây, không hoàn tác được» (chữ OD2 giữ nguyên);
  - lỗi → «#id chưa ghi được — thẻ vẫn chờ duyệt» kèm «Mở thẻ».
- `ReviewQueue` biết mình còn gắn hay đã gỡ. Toast lỗi giữ chữ OD2 «Không ghi được #id: <lỗi>» kèm «Mở thẻ»; còn gắn thì
  «Mở thẻ» mở sheet như OD2, đã gỡ thì điều hướng tới `/ops/review?card=<id>` — đường liên kết thẻ mà OD2 AC-6 đã có. Hàm
  điều hướng là prop có mặc định `window.location.assign`, test truyền hàm ghi lại.
- Toaster nằm ở `components/providers.tsx` (gốc app), nên toast vẫn hiện sau khi Hàng duyệt bị gỡ.

Chữ tin lúc bấm là câu hỏi cho người (Hỏi-1 ở Cổng Phạm vi): giữ «Đã ghi #id · nhãn» như OD2 AC-5 đã ký (khuyên), hay
đổi thành «Đã xếp #id · nhãn — gửi sau 5 giây» (giá: sửa ca OD2-AC-5 đang ghim chữ ấy). Bản nháp theo khuyến nghị: giữ.

Đo trên bản chạy thật (E6): tab A bấm đáp án thẻ X, tab B quyết X qua route decide trong 5 giây (route tự trả 409 «đã
quyết»), tab A chuyển sang trang Ops khác → toast lỗi phải hiện trên trang mới, «Mở thẻ» về `/ops/review?card=X`.

### 2. Giữ phím số quyết liền nhiều thẻ (lượt chấm 1 của OD2)

Trình duyệt lặp `keydown` khi giữ phím; mỗi lần lặp của `1`–`4` bấm đáp án ở thẻ kế. Sửa: `keydown` có `e.repeat` của
`1`–`4` bị bỏ qua (không bấm, không `preventDefault`). `J`/`K`/`↓`/`↑` lặp vẫn đi thẻ như OD2 — đi thẻ không quyết gì.

### 3. Phím duyệt chạy khi hộp phóng ảnh đè sheet (lượt chấm 1 của OD2)

`usePhimDuyet` chỉ tắt khi bảng phím mở (`phimMo`). Hộp phóng ảnh (`ReviewPhotos`, `Dialog`) mở trên sheet thì `1`–`4`,
`J`/`K` vẫn chạy ở sheet bên dưới. Sửa trong hook: có hộp thoại nào đang mở mà không phải sheet duyệt (`[role=dialog]` hay
`[role=alertdialog]` không mang `data-review-sheet`) → mọi phím của chế độ duyệt im. Luật chung, không riêng hộp ảnh: bảng
phím, ⌘K của vỏ Ops hay hộp thoại sau này đều được phủ. `review-photos.tsx` nằm ngoài vùng của hàng nên không sửa.

## Ràng buộc với hồ sơ OD2 đã ký

`app/tests/ops-duyet-hop-hang-muc.test.tsx` đột biến mã nguồn bằng cách thay chuỗi nguyên văn. Vòng này giữ nguyên mọi
chuỗi các ca ấy thay (trong `hang-gui.tsx`, `use-phim-duyet.ts`, `review-queue.tsx`), không sửa tệp test của OD2. Vì
`paths` của E3/E4 OD2 phủ `app/src/components/ops/review/**`, hồ sơ OD2 sẽ hoá cũ theo `stale_scope: paths` — ghim lại
OD2 bằng làn máy (repin-lane) trước khi mở PR.

<!-- <<<UX-SPEC-TEMPLATE -->
## Đặc tả UX

### 1. Luồng

- Suôn sẻ: chế độ duyệt (sheet) → bấm đáp án → toast «Đã ghi» → 5 giây sau lệnh gửi (điểm ra: thẻ kế trong cùng sheet)
- Biên: bấm đáp án rồi chuyển trang Ops khác trong 5 giây → lệnh gửi ngay (keepalive); giữ phím số → chỉ một lệnh; hộp phóng ảnh mở → phím duyệt im
- Lỗi & quay lại: lệnh gửi lúc rời trả lỗi → toast lỗi «Không ghi được #id: …» trên trang Ops đang đứng → «Mở thẻ» về `/ops/review?card=<id>`

### 2. Kiểm kê màn

| Màn | MỘT việc của màn | Vào từ / ra tới |
|---|---|---|
| Sheet chế độ duyệt (`/ops/review`) | quyết liền từng thẻ bằng phím hay chuột | «Duyệt liền» / thẻ kế, Empty hết thẻ |
| Toast (gốc app) | báo lệnh đã xếp, lỗi ghi, hoàn tác không được | sau mỗi lần bấm / tự tắt |

### 3. Bảng trạng thái

<!-- <<<UX-STATE-TABLE -->
| Trạng thái | Màn | Hiển thị gì | Người làm gì tiếp |
|---|---|---|---|
| ST-toast-loi-sau-khi-roi | Toast | «Không ghi được #id: <lỗi>» + nút «Mở thẻ» | bấm «Mở thẻ» → `/ops/review?card=<id>` quyết lại |
| ST-toast-hoan-tac-dang-gui | Toast | «#id đang gửi — không hoàn tác được» | chờ kết quả |
| ST-toast-hoan-tac-loi | Toast | «#id chưa ghi được — thẻ vẫn chờ duyệt» + «Mở thẻ» | mở thẻ quyết lại |
| ST-sheet-hop-anh-mo | Sheet | hộp phóng ảnh đè sheet, phím duyệt im | xem ảnh, đóng hộp rồi dùng phím |
<!-- UX-STATE-TABLE>>> -->

### 4. Hành vi

- Phím `1`–`4` lặp (`e.repeat`) bị bỏ qua; `J`/`K`/`↓`/`↑` lặp vẫn đi thẻ.
- Có hộp thoại khác sheet duyệt đang mở → mọi phím của chế độ duyệt im, không `preventDefault`.

### 5. Xuất xứ component

| Component | Nấc (dùng / ghép / mở rộng / tạo) | Vì sao (1 dòng) |
|---|---|---|
| toast sonner (`baoTin`) | dùng | kênh báo tin sẵn của chế độ duyệt OD2 |
| `HangGuiProvider`, `usePhimDuyet` | mở rộng | sửa hành vi trong mã của OD2, không thành phần mới |

### 6. Khuôn IA đã chọn + căn cứ

Khuôn IA: danh-sách-chi-tiết (master-detail)
Căn cứ: giữ khuôn của OD2 (bảng Hàng duyệt + sheet chi tiết); vòng này không đổi cấu trúc, chỉ đổi hành vi phím và tin báo.
### 7. Thẻ việc

Năm trường để máy so với `nhan_viec` của nhóm trong bản đồ khuôn (`design/patterns/<nhóm>.md`) — kho không khai bản đồ thì vẫn điền, đó là căn cứ chọn khuôn IA ở mục 6.

| Trường | Giá trị |
|---|---|
| Ai dùng | người Vận hành duyệt thẻ |
| Việc chính | quyết liền từng thẻ chờ ở một hạng mục mà không quyết nhầm |
| Tần suất | mỗi ngày nhiều lần |
| Số bản ghi | hàng trăm trở lên |
| Thiết bị | máy tính |
<!-- UX-SPEC-TEMPLATE>>> -->
