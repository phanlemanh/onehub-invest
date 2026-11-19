# Thiết kế: Căn cùng tiêu chí trên toàn tập (CG17)

Hồ sơ: `_acceptance/can-cung-tieu-chi-toan-tap/`. Cổng Đáng: Mạnh «Làm cả ba» 2026-11-19T04:57:19Z. Làm ngay sau CG3
(`can-gia-tot-loc-xep-hang`), cắt nhánh từ CG3 vì mã danh sách theo trang chưa lên main.

## 1. Vấn đề, đo trên DB máy thu ngày 19/11

Từ CG3, `/ops/deals` chỉ gửi xuống trình duyệt các căn của trang đang xem. Sheet một căn gọi `canCungTieuChi(d, rows)` với `rows`
là đúng trang ấy, nên tab «Căn cùng tiêu chí» và nút «Xem mọi căn trong phường» chỉ so trong 15 hay 50 căn.

Đo 19/11 (một snapshot `REPEATABLE READ READ ONLY`, cùng điều kiện với `tinNheSql`, mỗi căn một dòng):

| Kind | Căn | Trang 1 cỡ 15: dòng hiện 0 · đúng ra | Trang 1 cỡ 50: dòng hiện 0 · đúng ra | Tổng trang 1 cỡ 15: hiện · đúng | Trung vị · p90 · lớn nhất (toàn tập) |
|---|---:|---|---|---|---|
| Bán | 7.613 | 12 · 1 | 44 · 5 | 3 · 346 | 11 · 53 · 144 |
| Thuê | 9.711 | 15 · 0 | 33 · 0 | 0 · 223 | 12 · 49 · 720 |

Nới về cùng phường: trung vị 62 căn (bán), 104 (thuê). 736 căn thuê không có diện tích; 0 căn chưa gắn phường, 0 căn chưa rõ loại hình.

## 2. Hướng chọn

Tiêu chí giữ nguyên lời Mạnh ở hồ sơ `can-gia-tot-biet-can` (Cổng Phạm vi 02/11): cùng phường, cùng loại hình, diện tích ±25%,
«trong danh sách Căn giá tốt», nới được về cả phường. Vòng này chỉ đổi **tập** để so: từ trang đang xem sang toàn tập đã lọc.

| Việc | Cách làm |
|---|---|
| Tập so | Toàn tập của bước đọc nhẹ (`dealsNheSql`) với đúng `kind`, `type`, `location`, `project` trên URL, mọi tab, mỗi căn một dòng. Không theo tab: tab là cách xem, căn cần xác minh vẫn là căn để so, đứng cuối như hôm nay |
| Khoá so | `area_id` thay tên phường (hai phường trùng tên không bị gộp); loại trừ chính căn theo `can_key`, không theo mã tin |
| Số trên tab | Máy chủ đếm cho từng căn của trang, cùng lượt `getDealsTrang`, trên mảng đọc nhẹ đã có trong bộ nhớ: không thêm câu SQL. Gửi xuống trong `trang.cungTieuChi[offerId] = { tieuChi, phuong }` |
| Danh sách | Mở tab thì gọi một server action mới trong `app/src/app/ops/deals/` với mã căn và tham số URL. Action tự kiểm vai, đọc lại tập nhẹ, chọn căn cùng tiêu chí, xếp như hôm nay (không xác minh trước, giảm nhiều trước), đọc đầy đủ 20 căn đầu bằng `dealsTheoMaSql`, lọc theo vai bằng `dealTheoVai` + `dealHang` rồi trả về `{ tong, can }` |
| «Xem mọi căn trong phường» | Cùng action, cờ `chiPhuong`; số của nút đã có sẵn trong `trang.cungTieuChi` |
| Mở một căn trong danh sách | Căn có trong trang đang xem → mở sheet ở căn đó như hôm nay. Căn ngoài trang → mở trang một căn `/ops/deals/<mã>`, vì sheet cần ảnh, chữ bài, mặt bằng mà chỉ trang đang xem đã đọc |
| Crumb «Căn giá tốt» ở trang một căn (Ngoài-3 của CG3) | Thay `dealTrongDanhSach` (dò 30 căn đầu của danh sách cũ) bằng việc tìm căn trong tập đọc nhẹ của `getDealsTrang` theo `kind` của căn: còn trong tập → `/ops/deals?kind=…&page=<trang chứa căn>&can=<mã>`; rời tập → `/ops/deals`. Hôm nay căn ngoài 30 căn đầu bị crumb đưa về `?can=`, danh sách không thấy căn trên trang 1 nên chuyển ngược về trang một căn |
| Danh sách lùi (chưa có bảng hạng) | Giữ cách so trong `rows` như hôm nay; tab ghi rõ «trong danh sách đang tải» |

**Phương án đã loại.** Tính sẵn danh sách 20 căn cho mọi dòng của trang và gửi cùng trang: 50 × 20 dòng đầy đủ, kèm ảnh, chữ bài,
nặng gấp 20 lần trang và lộ dữ liệu của căn chưa xem. Bảng tính sẵn ở pipeline: chưa có số đo cho thấy cần (luật 11). Đếm bằng SQL
riêng cho từng căn: 50 lượt gọi DB mỗi trang, trong khi tập nhẹ đã nằm trong bộ nhớ.

## 3. AC-10 của CG3 trở lại

Lời hứa cũ nằm ở mục «Known limits» của hợp đồng CG3. Trở lại thành AC-9 của hồ sơ này, với bốn sửa đổi rút từ lượt 5 của CG3:
mọi phép so trên DB máy thu đọc trong MỘT snapshot nhất quán (`REPEATABLE READ READ ONLY`, `pg_export_snapshot` cho tiến trình con);
đo thời gian tải chạy riêng khi máy yên và ghi tải máy; lint không quét tệp chép tạm của test; ảnh xem màn thật quay lại (cổng 3461).

## 4. Giới hạn đã biết của dữ liệu

- Tiêu chí chưa có số phòng ngủ, toà, tầng: theo lời Mạnh 18/11 các bộ lọc này sang hàng sau.
- Tập 45 ngày thay đổi trong ngày (job đêm S03, quét S06 05:30): số trên tab là số của lần tải trang; mở tab sau một lượt nạp có thể
  lệch vài căn so với số trên tab. Danh sách ghi tổng của chính nó.

<!-- <<<UX-SPEC-TEMPLATE -->
## Đặc tả UX

### 1. Luồng

- Suôn sẻ: bảng `/ops/deals` → bấm một dòng → sheet mở tab «Chi tiết», nhãn tab «Căn cùng tiêu chí» mang số trên toàn tập → bấm tab
  → khung tải → bảng 20 căn đầu kèm câu «Hiện 20 / N căn cùng tiêu chí» → bấm một căn (điểm ra: sheet căn đó, hoặc trang một căn).
- Biên: căn có 0 căn cùng tiêu chí → trạng thái trống có nút «Xem mọi căn trong phường» (kèm số); phường cũng 0 → trống không nút,
  câu «Phường này chưa có căn giá tốt nào khác»; căn thiếu diện tích hay loại hình → bỏ tiêu chí ấy và nói rõ.
- Lỗi & quay lại: action lỗi → lỗi tại chỗ trong tab, nút «Thử lại»; tab «Chi tiết» vẫn dùng được.

### 2. Kiểm kê màn

| Màn | MỘT việc của màn | Vào từ / ra tới |
|---|---|---|
| Sheet một căn, tab «Căn cùng tiêu chí» | So căn đang xem với căn cùng phường, cùng loại, cùng cỡ trên toàn tập đã lọc | Từ dòng bảng / tới sheet căn khác hoặc trang một căn |

### 3. Bảng trạng thái

<!-- <<<UX-STATE-TABLE -->
| Trạng thái | Màn | Hiển thị gì | Người làm gì tiếp |
|---|---|---|---|
| ST-cung-tieu-chi-loading | Tab «Căn cùng tiêu chí» | `Skeleton` khuôn bảng 4 cột, giữ hàng «Căn này» | Chờ |
| ST-cung-tieu-chi-co | Tab «Căn cùng tiêu chí» | Huy hiệu tiêu chí, «Hiện 20 / N căn cùng tiêu chí» khi N > 20, bảng | Bấm một căn; «Xem mọi căn trong phường (M)» |
| ST-cung-tieu-chi-empty | Tab «Căn cùng tiêu chí» | «Chưa có căn nào cùng tiêu chí» + nút «Xem mọi căn trong phường (M)» | Nới về phường |
| ST-cung-tieu-chi-empty-phuong | Tab «Căn cùng tiêu chí» | «Phường này chưa có căn giá tốt nào khác» | Đóng sheet |
| ST-cung-tieu-chi-error | Tab «Căn cùng tiêu chí» | «Chưa tải được căn cùng tiêu chí» + «Thử lại» | Thử lại |
<!-- UX-STATE-TABLE>>> -->

### 4. Hành vi

- Số trên nhãn tab có ngay khi mở sheet, không chờ action.
- Đổi căn bằng J/K giữ tab đang mở; tab gọi action cho căn mới, kết quả của căn cũ về muộn thì bỏ.
- Đổi điều kiện lọc đóng sheet (luật CG3), nên không có danh sách cũ treo trên tập mới.

### 5. Xuất xứ component

| Component | Nấc (dùng / ghép / mở rộng / tạo) | Vì sao (1 dòng) |
|---|---|---|
| `DealSimilar` | mở rộng | Thêm tải từ action, trạng thái tải và lỗi; giữ bảng, hàng, trạng thái trống |
| `Skeleton`, `Empty`, `RegionError`-dạng tại chỗ | dùng | Trạng thái chuẩn của kho (luật ReUI 5) |
| `DealSheet` | mở rộng | Số trên nhãn tab đọc từ `trang.cungTieuChi` thay vì đếm trong trang |

### 6. Khuôn IA đã chọn + căn cứ

Khuôn IA: danh-sách-chi-tiết (master-detail)
Căn cứ: giữ nguyên khuôn bảng + sheet đã duyệt ở `can-gia-tot-biet-can`; vòng này không đổi cấu trúc, chỉ đổi tập dữ liệu của một tab.

### 7. Thẻ việc

Năm trường để máy so với `nhan_viec` của nhóm trong bản đồ khuôn (`design/patterns/<nhóm>.md`) — kho không khai bản đồ thì vẫn điền, đó là căn cứ chọn khuôn IA ở mục 6.

| Trường | Giá trị |
|---|---|
| Ai dùng | Người vận hành (vai Vận hành, Quản trị); vai Người xem đọc không liên hệ |
| Việc chính | So một căn giá tốt với các căn tương tự để quyết gọi căn nào trước |
| Tần suất | mỗi ngày nhiều lần |
| Số bản ghi | hàng trăm trở lên |
| Thiết bị | máy tính |
<!-- UX-SPEC-TEMPLATE>>> -->
