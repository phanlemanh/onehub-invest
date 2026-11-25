# Thiết kế: Căn giá tốt lọc theo vị trí và xếp hạng (CG3)

Hồ sơ: `_acceptance/can-gia-tot-loc-xep-hang/`. Mốc MS2. Vòng này gánh phần còn nợ của UI10 và OH2.

## 1. Vấn đề, đo trên màn thật ngày 18/11

Mở `/ops/deals` không lọc, người vận hành thấy 30 căn S06 cấp phường, cùng mức −35%. Tập thật có 7.385 căn bán, trong đó 832 căn
«Giá tốt» cấp dự án (254 căn S03), và không căn nào trong số đó hiện ra. Tab «Tất cả» ghi 30 trong khi «Cần xác minh» ghi 2.390.
Dòng trong bảng không ghi nhãn hạng hay nhóm so sánh. Muốn xem một dự án phải tìm được nút «Xem cả dự án» trong sheet của một căn
cấp dự án, mà 30 căn mặc định đều cấp phường.

## 2. Hướng chọn

Danh sách chuyển sang đọc **theo trang ở máy chủ**, mọi điều kiện nằm trên URL. Truy vấn chỉ chọn tin nào hiện, không tính lại
điểm (luật 10): hạng, nhãn, trung vị đọc nguyên từ `offer_price_rank`.

| Việc | Cách làm |
|---|---|
| Tham số URL | `location` (mã khu vực), `project` (mã dự án, giữ nguyên), `type`, `kind` (`sale`, `rent`), `tab`, `page`, `size`, `can` (giữ nguyên) |
| Thứ tự mặc định | Tin không cần xác minh trước; trong đó cấp dự án trước cấp phường; rồi hạng phần trăm tăng dần; rồi mức dưới trung vị giảm dần; rồi mã tin |
| Bước 1, đọc nhẹ | Một câu trên toàn tập đã lọc, đã gộp mỗi căn một dòng, đã sắp đúng thứ tự mặc định. Câu này trả đủ đầu vào của `thieuGi`: loại hình, diện tích, toà, đường, thước, SĐT, có ảnh hay không, có chữ bài hay không |
| Bước 2, xếp tab | Máy chủ áp đúng `thieuGi` và `tabCua` lên từng căn của bước 1, theo vai đang xem. Số trên tab đếm ở đây |
| Bước 3, cắt trang | Lọc danh sách mã theo tab đang mở rồi cắt đúng trang. Không dùng `LIMIT`/`OFFSET` trong SQL, nên tab và trang luôn khớp nhau |
| Bước 4, đọc đầy đủ | Câu đầy đủ chỉ cho các mã của trang, gắn ảnh, chữ bài, mặt bằng S06, giữ thứ tự của bước 1 |
| Cây vị trí | Tỉnh → Phường, và Tỉnh → Dự án là hai nhánh song song, dựng từ chính tập căn đang lọc theo bán hay thuê, loại hình; mọi mục đều có căn và có số đếm |
| Chọn dự án | Lấy cả dự án, không giới hạn theo phường. Đo 18/11: 174/189 căn của Ocean Park 1 chỉ gắn tới tỉnh, 4/140 dự án trải nhiều phường, 0 dự án trải nhiều tỉnh |
| Căn gắn thẳng tỉnh | Thuộc tỉnh đó, không thuộc phường nào (đo 18/11: 260 căn bán). Tổng số căn của các tỉnh bằng tổng tập |
| Đổi điều kiện | Về trang 1, đóng sheet, giữ các điều kiện khác |

Đo 18/11: tập có 8.065 tin, gộp còn 7.385 căn (493 căn có từ hai tin trở lên); câu đọc tin mất 23 ms, câu gộp căn dưới 50 ms, nên đếm toàn tập ở máy chủ không cần bảng tính sẵn mới. Việc gộp nằm trước bước cắt trang.

**Phương án đã loại.** Tải hết về trình duyệt rồi lọc phía client: 7.385 dòng kèm ảnh, chữ bài là quá nặng, và lộ dữ liệu của căn
chưa xem. Bảng tính sẵn số đếm ở pipeline: chưa có số đo nào cho thấy cần (luật 11), lại phải đồng bộ luật «thiếu gì» sang SQL.

## 3. Giới hạn đã biết của dữ liệu

- Bảng hạng hiện chỉ có cấp phường và cấp dự án. Phân khu, toà chưa có hạng và tin chưa gắn toà tới khi PL20 xong.
- Phủ bộ lọc trên 9.841 tin bán có nhãn: diện tích 100%, đường 93%, số phòng ngủ 84%, toà 6%, tầng 1%.
- Tin S06 không có chữ bài nên luôn thuộc «Còn thiếu» ở máy thu. Luật này giữ nguyên trong vòng này.

<!-- <<<UX-SPEC-TEMPLATE -->
## Đặc tả UX

### 1. Luồng

- Suôn sẻ: mở `/ops/deals` → thấy căn «Giá tốt» cấp dự án đứng đầu → chọn vị trí trên cây → lọc loại hình, Bán hoặc Cho thuê → bấm một dòng mở sheet (điểm ra: gọi người bán, hoặc trang một căn).
- Biên: vị trí không có căn ở tab đang mở; đường dẫn cũ `?project=<id>`; `?can=` trỏ căn ngoài trang đang xem; số trang vượt cuối.
- Lỗi & quay lại: truy vấn hỏng → khối lỗi có «Thử lại» trong vùng bảng, PageHeader và bộ lọc vẫn đứng; tham số sai khuôn → bỏ tham số đó, không lỗi trang.

### 2. Kiểm kê màn

| Màn | MỘT việc của màn | Vào từ / ra tới |
|---|---|---|
| Căn giá tốt `/ops/deals` | Tìm căn giá tốt ở một vị trí để gọi | Thanh bên Ops / sheet một căn, trang một căn |

### 3. Bảng trạng thái

<!-- <<<UX-STATE-TABLE -->
| Trạng thái | Màn | Hiển thị gì | Người làm gì tiếp |
|---|---|---|---|
| ST-deals-loading | Căn giá tốt | Skeleton đúng bố cục bảng, thanh lọc vẫn đứng | Chờ |
| ST-deals-default | Căn giá tốt | Căn cấp dự án đứng đầu, chân bảng «1–15 / 7.385» | Lọc, bấm dòng |
| ST-deals-filtered | Căn giá tốt | Tiêu đề và số đếm theo vị trí đã chọn | Đổi vị trí, xoá lọc |
| ST-deals-tab-empty | Căn giá tốt | «Mục này chưa có căn.» kèm nút «Xem tất cả» | Về tab Tất cả |
| ST-deals-filter-empty | Căn giá tốt | «Không có căn nào khớp bộ lọc.» kèm nút «Xoá bộ lọc» | Xoá lọc |
| ST-deals-all-empty | Căn giá tốt | Tập căn rỗng, nút «Xem chất lượng dữ liệu» | Sang `/ops/quality` |
| ST-deals-error | Căn giá tốt | Khối lỗi kèm «Thử lại» | Thử lại |
| ST-deals-viewer | Căn giá tốt | Không cột «Gọi ai», không ảnh, không chữ bài | Đọc số |
<!-- UX-STATE-TABLE>>> -->

### 4. Hành vi

- Bộ chọn vị trí tìm được theo tên, không phân biệt dấu; mỗi mục ghi số căn.
- Màn hẹp 390 px: thanh lọc xuống hàng, bảng giữ hai cột Căn và Giá, nhãn hạng nằm dưới tên căn; trang không cuộn ngang.
- Back của trình duyệt trả về đúng điều kiện trước vì mọi điều kiện nằm trên URL.

### 5. Xuất xứ component

| Component | Nấc (dùng / ghép / mở rộng / tạo) | Vì sao (1 dòng) |
|---|---|---|
| `reui/data-grid` chế độ phân trang máy chủ | dùng | Bảng đang có, thêm `recordCount` và trạng thái trang |
| `reui/cascader` | dùng | Đúng việc chọn một nút trên cây nhiều cấp |
| `ui/tabs`, `reui/badge`, `ui/empty`, `reui/frame` | dùng | Đang có trên màn |
| `RegionError`, `DealsSkeleton`, `PageHeader` | dùng | Trạng thái lỗi, tải và đầu trang đang có |

### 6. Khuôn IA đã chọn + căn cứ

Khuôn IA: danh-sách-chi-tiết (master-detail)
Căn cứ: màn đã là bảng kèm sheet ở CG8–CG10; vòng này chỉ thêm điều kiện lọc trên URL. Không cần tra thêm mẫu vì chỉ có một khuôn khả dĩ.

### 7. Thẻ việc

| Trường | Giá trị |
|---|---|
| Ai dùng | Người vận hành |
| Việc chính | Tìm căn giá tốt ở một vị trí để gọi xác minh |
| Tần suất | mỗi ngày |
| Số bản ghi | hàng trăm trở lên |
| Thiết bị | máy tính |
<!-- UX-SPEC-TEMPLATE>>> -->
