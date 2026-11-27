## Trong hợp đồng

- **Hình dạng 3 — AC-8 chỉ kiểm chuỗi giá có mặt trong HTML, trong khi lời hứa là quan hệ dòng ↔ giá; /5 tỷ/ còn được «4,25 tỷ» thoả**
  file: `app/tests/registry-quy-can.test.tsx:121`
  severity: high
  source: measurement
  AC: AC-8
  detail: Contract AC-8 và eval E8 hứa mỗi dòng bảng quỹ căn có đúng giá bán, đơn giá, trạng thái của căn đó. Test chỉ có `assert.match(html, /5 tỷ/)`, `/4,25 tỷ/`, `/69 tr\/m²/`, `/AVAILABLE/` trên toàn bộ HTML. Chữ «4,25 tỷ» đã chứa chuỗi con «5 tỷ», nên assert của căn A1.05.01 (5.000.000.000) không đo được gì: căn này mất giá hay bị gán giá sai thì test vẫn xanh. Giá 6,1 tỷ của B2.10.03, giá trống của A1.05.02, loại hình, PN·WC, diện tích đều không có assert nào. Mọi căn trong fixture đều là AVAILABLE/ON_STOCK, nên `/AVAILABLE/` không bắt được lỗi map trạng thái sang sai dòng. Số dòng thì đã kiểm qua `ma(html)`, nhưng việc giá nằm đúng dòng thì không.
  rationale: AC-8 hứa mỗi dòng hiện đúng giá bán, đơn giá, trạng thái của căn đó, mà phép kiểm không buộc giá nằm đúng dòng nên chưa chứng minh được AC.

- **Hình dạng 5 — AC-2 tuyên kiểm kê mọi khoá lá của quỹ căn VÀ căn cao tầng, nhưng chỉ có assert theo từng khoá cấp một của quy-can**
  file: `pipeline/lib/s09-danh-ba-v16.test.mjs:21`
  severity: medium
  source: measurement
  AC: AC-2
  detail: Contract AC-2 viết «bảng kiểm kê viết trước liệt kê MỌI khoá lá của một căn quỹ căn và của một item căn cao tầng… số assert bằng số khoá của bảng». Test chỉ lặp `Object.keys(KHOA_V16["quy-can"])`, ghim 46 khoá và đó đều là khoá cấp một (galleries[].urls hay geolocation.lat_cdnt không được kê là khoá lá). Bốn khoá `can-cao-tang` (code, id, increment_number, name) trong s09-danh-ba-v16-khoa.json không có assert giữ/bỏ riêng nào. Chỉ có một `deepEqual(payload, t.payload)` gộp ở ca «kind khác trả nguyên», và vì locTangA trả nguyên mọi kind khác quy-can nên assert đó không phụ thuộc bảng. Kết quả: ma trận toàn phần chỉ phủ một trong hai lớp mà hợp đồng tuyên quét, và `soAssert === khoa.length` chỉ đếm lại 46 khoá của quy-can.
  rationale: AC-2 đòi bảng kiểm kê phủ mọi khoá của cả quỹ căn lẫn căn cao tầng, mỗi khoá một assert; phần căn cao tầng chưa có assert riêng.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **View 130 ép kiểu số trên JSON nguồn mà không kiểm kiểu: một giá trị lạ làm hỏng cả view quỹ căn**
  Người dùng thấy gì: Nếu nguồn trả một giá hay diện tích không phải số ở một căn, cả ô tổng quỹ căn và khối quỹ căn của mọi dự án trên Danh bạ Ops sẽ cùng báo lỗi cho tới khi dữ liệu được sửa.
  Căn cứ: Chỉ xảy ra khi nguồn gửi dữ liệu bất thường, bản thu thật hiện tại đã đo đủ và không lỗi, người dùng chỉ thấy báo lỗi chứ không mất dữ liệu; sửa sau vẫn rẻ.
  file: `db/migrations/130_v_s09_db_quy_can.sql`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 4 — E6 chỉ so băm giữa các lượt với nhau, không ghim giá trị mong đợi, nên chiều đỏ «ORDER BY ngược» không thể làm nó đỏ**
  Người dùng thấy gì: Một lỗi âm thầm đổi cách chọn bản thu trong quỹ căn có thể không bị bộ kiểm chạy lại phát hiện, nên số căn hay giá hiện trên Danh bạ có thể lệch mà không có cảnh báo.
  Căn cứ: Bộ kiểm vẫn bắt được lỗi do thứ tự nạp hay nạp lại; phần còn hở chỉ là lỗi cố ý đổi cách chọn bản, ít xảy ra và sửa sau không ảnh hưởng người dùng hiện tại.
  file: `pipeline/scripts/s09-v16-that.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 2 — view v_s09_db_can_cao_tang chỉ được assert trên dòng stg viết tay, không đo vòng qua bộ nạp**
  Người dùng thấy gì: Chưa có phép thử tự động nối thẳng bước nạp căn cao tầng với bước đọc; nếu hai bước lệch dạng dữ liệu thì căn cao tầng có thể thiếu hay sai trên danh sách.
  Căn cứ: Phần căn cao tầng chưa hiện lên màn người dùng ở hàng này và đã có phép đo số trên bản thu thật, nên rủi ro thấp và bổ sung phép thử sau không tốn nhiều.
  file: `pipeline/scripts/s09-v16.itest.mjs`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 6 — E5/E6 mặc định đọc thư mục dữ liệu ghim cứng của checkout chính và của worktree phiên ZK**
  Người dùng thấy gì: Phép đo số quỹ căn thật chỉ chạy đúng trên máy thu hiện tại; ở máy khác nó bỏ qua bảng đối chiếu mà không báo to, nên có thể tưởng đã kiểm.
  Căn cứ: Phép đo này vốn chỉ dùng một lần trên máy thu khi áp, không ảnh hưởng người dùng cuối; chi phí làm cho chạy mọi máy vượt xa lợi ích.
  file: `pipeline/scripts/s09-v16-that.mjs`
  severity: low
  Đề xuất: wont-fix

## Chưa adversarial-verify (refuter chết)

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
