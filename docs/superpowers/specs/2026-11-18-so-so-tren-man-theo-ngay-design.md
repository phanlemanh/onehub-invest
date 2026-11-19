# Số mốc S03 theo ngày trên Dòng chảy dữ liệu (SM1) — thiết kế

Hàng SM1 của `docs/plan/lo-trinh.json`, hồ sơ `_acceptance/so-so-tren-man-theo-ngay/`. Cổng Đáng: Mạnh «build» 18/11.
Hạng T2: không thêm migration, số ghi vào bảng đo có sẵn `dq_check_results`.

## 1. Vấn đề

Luật 15/11: hàng trên đường găng xong khi con số trên màn đổi. Màn hôm nay chỉ có số của lượt làm tươi mới nhất, nên không
ai biết hàng nào làm số tăng. Biểu đồ «Chặng theo ngày» đếm bài và tin MỚI theo ngày đăng, không phải tổng số tin đạt mốc.

## 2. Bốn số mốc

Mọi số đếm trên tin S03 đang rao (view `sale_offers`), tại lượt làm tươi của màn.

| Số mốc | Cột | Định nghĩa | Hôm nay |
|---|---|---|---|
| Tin đang rao (mẫu số) | `offers_total` | tin S03 đang rao | 7.070 |
| Có dự án | `project_linked` | đúng ô «Định vị» của S03 (`muc.located`) | 6.890 |
| Khớp toà | `building_linked` | `muc.toa_khop` của 600, tự có số khi `toa_link` được nối | 0 |
| Có hạng cấp dự án | `project_ranked` | có điểm hạng (`hang_pct` khác rỗng) ở cấp dự án trở xuống: `cap` thuộc `du_an`, `phan_khu`, `toa` | 5.432 |
| Có hạng cấp toà | `building_ranked` | có điểm hạng và `cap = 'toa'` | 0 |

`project_ranked` gồm cả cấp sâu hơn vì mỗi tin chỉ giữ một dòng hạng ở cấp mịn nhất: đếm đúng `cap = 'du_an'` thì số sẽ tụt
đúng ngày hạng cấp toà ra đời, dù không tin nào mất hạng.

## 3. Lưu và ghi

- Mỗi ngày VN một dòng `dq_check_results`: `check_name = 's03-moc-ngay'`, `entity = 'S03'`, `status = 'pass'`, `detail` là JSON gồm
  `ngay` và năm số ở bảng trên. Đây là nếp của DO1, DO3 và SD5: bảng chỉ có khoá `id`, nên «một dòng mỗi ngày» do bên ghi giữ
  bằng cách xoá dòng cùng `detail.ngay` rồi ghi lại trong một giao dịch.
- `600_data_flow.sql` xoá và ghi dòng của hôm nay trong CÙNG câu lệnh dựng `data_flow_snapshot`, sau khi lấy khoá advisory của
  giao dịch để hai lượt đồng thời không nhân dòng. Số trên biểu đồ và số của màn chặng vì thế đọc cùng một ảnh dữ liệu.
- `ngay` lấy từ CTE `today` (giờ VN, ghim được bằng `oneinvest.flow_now`), không suy từ `checked_at`.
- Lượt làm tươi chạy mỗi 15 phút, nên dòng của ngày D là số của lượt cuối trước nửa đêm giờ VN. Ngày máy không chạy là ngày trống.
- `facts.milestones` mang 30 ngày gần nhất, tăng dần theo ngày: các dòng cũ hơn hôm nay cộng dòng vừa tính.
- `/ops/quality`: bảng chung loại `s03-moc-ngay` như `do1-*`, `do3-*` để không lặp JSON thô; `dq-labels` vẫn có nhãn tiếng Việt
  theo luật đợt 30/10.

## 4. Lên cloud

`push-ops-facts` đã chở nguyên `facts` của ba cửa sổ trong khối `dataFlow`, nên số mốc lên cloud mà không đổi tệp đó và không
thêm bảng hay cột cloud. Khối cũ không có khoá `milestones` thì app đọc thành mảng rỗng.

Dòng `s03-moc-ngay` cũng lên bảng `dq_check_results` của cloud qua `sync-cloud` có sẵn (bảng nằm trong `FILL`). Lượt đồng bộ tráo trọn bảng theo máy thu nên xoá rồi ghi ở máy thu không làm cloud tích dòng. Màn đọc số từ `facts`, không đọc dòng này ở cloud. Cho lên cloud hay không là câu Hỏi-4 của Cổng Phạm vi.

## 5. Mức đổi và cờ đứng yên

Hàm thuần `milestoneTiles` (`milestone-trend-data.ts`), React chỉ đọc kết quả.

- Mức đổi = số hôm nay − số của đúng ngày hôm trước. Thiếu dòng ngày hôm trước thì ghi «Chưa có số hôm trước», không so với
  ngày cũ hơn.
- Đứng yên = ba ngày đã chốt liền nhau (hôm qua, hôm kia, hôm kìa) có cùng một số, tức hai ngày liền không đổi. Hôm nay chưa
  chốt nên không tính: sáng sớm trước lượt đêm số nào cũng bằng hôm qua. Thiếu một trong ba ngày thì không đánh dấu.

## 6. Đo trên dữ liệu thật

Ô đổi: vùng «Số mốc S03 theo ngày» từ chưa có lên có bốn ô. Lệnh đo: `probes/do-may-thu.sh` trên bản chép DB máy thu (AC-9).

| Chiều | Giá trị | Số tin S03 (18/11) | Ai đọc phía sau |
|---|---|---|---|
| Có dự án × hạng | có dự án, cấp dự án có điểm | 5.432 | `project_ranked` |
| | có dự án, chưa có hạng | 1.442 | chỉ `project_linked` |
| | có dự án, cấp phường | 27 | chỉ `project_linked` |
| | không dự án, cấp phường | 52 | không số mốc nào |
| | không dự án, không hạng | 131 | không số mốc nào |
| Bán, thuê | thuê dài hạn có hạng dự án | 3.944 | gộp vào `project_ranked` |
| | bán có hạng dự án | 1.488 | gộp vào `project_ranked` |
| Cấp hạng chưa có dòng | `phan_khu`, `toa` | 0 | ca viết trước trong AC-2 |

Ngoài phạm vi: S05, S06 (thước của đợt đếm trên S03, ROADMAP §3 mục 51); dựng lại số các ngày trước (`offer_project` và
`offer_price_rank` chỉ giữ trạng thái hiện tại).

## Đặc tả UX

<!-- <<<UX-SPEC-TEMPLATE -->
### 1. Luồng

- Suôn sẻ: mở `/ops/data-flow` → đọc bốn ô số mốc đầu trang → rê chuột trên đường để xem số từng ngày (điểm ra: cùng trang).
- Biên: lần đầu chưa có dòng nào; mới có một ngày; ngày máy không chạy; khối cloud cũ chưa mang số mốc.
- Lỗi & quay lại: số dòng chảy không đo được thì vùng không hiện, cảnh báo đầu trang có sẵn nói rõ lỗi; tải lại trang để thử lại.

### 2. Kiểm kê màn

| Màn | MỘT việc của màn | Vào từ / ra tới |
|---|---|---|
| Dòng chảy dữ liệu, vùng «Số mốc S03 theo ngày» | Cho biết mỗi mốc hôm nay đạt bao nhiêu, đổi ra sao so với hôm qua | Thanh bên Ops / các vùng khác của trang |

### 3. Bảng trạng thái

<!-- <<<UX-STATE-TABLE -->
| Trạng thái | Màn | Hiển thị gì | Người làm gì tiếp |
|---|---|---|---|
| ST-somoc-loading | Dòng chảy | `Skeleton` đúng bố cục bốn ô trong khung tải của trang | Chờ |
| ST-somoc-empty | Dòng chảy | «Chưa có số mốc theo ngày. Số đầu tiên xuất hiện sau lượt làm tươi kế.» kèm nút «Tải lại» | Bấm «Tải lại» |
| ST-somoc-motngay | Dòng chảy | Bốn ô có số, dòng phụ «Chưa có số hôm trước», một điểm trên đường | Đọc số |
| ST-somoc-du | Dòng chảy | Bốn ô có số, phần trăm trên tin đang rao, mức đổi, đường theo ngày | Rê chuột xem từng ngày |
| ST-somoc-dungyen | Dòng chảy | Ô có `Badge` cảnh báo «Đứng yên 2 ngày» | Tìm hàng đang chặn mốc |
| ST-somoc-loi | Dòng chảy | Vùng không hiện, `Alert` lỗi có sẵn của trang kèm nút «Thử lại» | Bấm «Thử lại» |
<!-- UX-STATE-TABLE>>> -->

### 4. Hành vi

- Bốn ô một hàng từ `xl`, hai cột ở `md`, một cột trên điện thoại.
- Đường theo khoảng 7 ngày hoặc 30 ngày của nút đầu trang; «Toàn kho» vẽ 30 ngày như «Chặng theo ngày».
- Mỗi ô một trục riêng vì các số chênh nhau hàng nghìn lần. Bảng ẩn cho trình đọc màn hình mang số từng ngày.

### 5. Xuất xứ component

| Component | Nấc | Vì sao |
|---|---|---|
| `reui/frame` | dùng | Họ khung của trang |
| `ui/chart` + `LineChart` | ghép | Cùng bộ biểu đồ với «Chặng theo ngày» |
| `reui/badge` | dùng | Trạng thái «Đứng yên» |
| `ui/empty`, `ui/button` | ghép | Trạng thái trống có hành động |

### 6. Khuôn IA đã chọn + căn cứ

Khuôn IA: bảng-điều-khiển (dashboard-first)
Căn cứ: trang đã là Dashboard grid theo `routes.md`; vùng mới là một dải trên cùng của khuôn đó, luồng hiển nhiên nên không tra mẫu.

### 7. Thẻ việc

| Trường | Giá trị |
|---|---|
| Ai dùng | Người vận hành, giám sát đợt |
| Việc chính | Xem mốc S03 hôm nay đạt bao nhiêu và có đang nhích không |
| Tần suất | mỗi ngày |
| Số bản ghi | vài chục |
| Thiết bị | cả hai |
<!-- UX-SPEC-TEMPLATE>>> -->
