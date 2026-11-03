## Trong hợp đồng

- **Bộ phán lý do PD-AC-8 chỉ thấy 3 trong 252 ô lệch, nên «lệch toàn ở block_raw» không được đo**
  file:line: `_acceptance/kiem-do-sau-ap-070-sua/probes/doi-chieu-that.mjs:22`
  severity: medium
  AC: AC-4
  source: bugs
  detail: `lechChiBlockRaw` đọc tập trường từ thông điệp lỗi của ca PD-AC-8, nhưng thông điệp đó chỉ in ba phần tử đầu: `cắt chuyển lệch: ${JSON.stringify(r.lech.slice(0, 3))}` (pipeline/scripts/phat-bieu-db.itest.mjs:500). Nhật ký thật tại .acceptance-runs/kiem-do-sau-ap-070-sua/doi-chieu/phat-bieu-db.itest.log (ghi lúc 15:07) có `actual: 252` và đúng 3 dòng `"field":"block_raw"`, tức 249 ô còn lại không được nhìn. Ba phần tử đó cũng không phải mẫu đại diện: `soMoc` duyệt Map theo thứ tự dòng của `SELECT ... FROM sale_offer_records` không có ORDER BY (pipeline/phat-bieu-cat-chuyen.mjs:23, 31-34, 61). Hệ quả: nếu cắt chuyển làm lệch thêm `seller_phone`-độc lập như `street_raw` hay `property_type` ở ô thứ 4 trở đi, `every(t === "block_raw")` vẫn đúng, xetBo báo đạt và E4 vẫn xanh. Số ca xanh cũng không chặn được vì đó vẫn là ca đã đỏ, và `actual` không được ghim. E4 hứa «mỗi ca đỏ mang đúng lý do đã đo» và chú thích dòng 21 nói «chỉ ghim tập trường», nhưng tập trường đầy đủ không có trong nhật ký. tuKiem (dòng 114-116) chỉ thử trường lạ nằm trong hai phần tử đầu nên không phát hiện được. Cách sửa: để phép đo lấy tập trường trên toàn bộ `r.lech`, ví dụ in tally theo field trong thông điệp, hoặc để probe tự tính từ `catChuyen`. Bản 174c302a của test không cần giữ nguyên thông điệp này, vì đây là tệp trong vùng vật được phép sửa.

- **Hình dạng 3 — lý do đỏ của PD-AC-8 hứa «mọi lệch chỉ ở block_raw» nhưng chỉ đọc được 3 trên 252 phần tử lệch**
  file:line: `_acceptance/kiem-do-sau-ap-070-sua/probes/doi-chieu-that.mjs:22`
  severity: high
  AC: AC-4
  source: measurement
  detail: lechChiBlockRaw (dòng 22-25) lấy mọi `"field":"…"` trong phần lỗi rồi đòi tất cả bằng block_raw. Comment dòng 21 ghi «PD-AC-8 đo được lệch toàn ở block_raw». Nhưng thông điệp nguồn là `cắt chuyển lệch: ${JSON.stringify(r.lech.slice(0, 3))}` (pipeline/scripts/phat-bieu-db.itest.mjs:500), nên regex chỉ thấy tối đa 3 phần tử đầu. Nhật ký đo thật .acceptance-runs/kiem-do-sau-ap-070-sua/doi-chieu/phat-bieu-db.itest.log có dòng 88 liệt 3 phần tử block_raw, còn dòng 100 ghi `actual: 252`. Vậy 249 ô còn lại không được chấm: lệch mới ở bedrooms, street_raw hay property_type nằm sau 3 phần tử đầu vẫn cho xetBo «đạt». Giá trị r.lech.length cũng không được ghim. Quan hệ E4 hứa là «mỗi ca đỏ mang đúng lý do đã đo», và nó được đo bằng một mẫu cắt cụt. Tự kiểm không lộ lỗ này: `lech(f)` ở dòng 114 và «PD trường lạ» ở dòng 116 dựng tay thông điệp hai phần tử, với trường lạ nằm ngay trong vùng nhìn thấy, tức fixture đúng khuôn bên đọc (cũng là hình dạng 2). Đây vẫn là lỗ cùng loại mà lần sửa S4-r1 (d-20261103T084009Z-20) nhắm đóng.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Hình dạng 2 — bí danh viết tay đúng khuôn SQL_N3, vế EXISTS của N3 chưa từng đọc dòng do dungNguoi ghi**
  Người dùng thấy gì: Kiểm tra danh bạ có thể báo đỏ giả trở lại với một số điện thoại đã có bí danh nhưng chỉ còn tin ghép, mà bộ kiểm tra hiện tại vẫn xanh. Chỉ ảnh hưởng công cụ kiểm nội bộ, không ảnh hưởng dữ liệu hay người dùng cổng.
  Căn cứ: Hậu quả nhẹ vì chỉ làm công cụ kiểm nội bộ báo sai chứ không mất hay lộ dữ liệu, và đỏ giả hiện ra ngay nên người vận hành tự nhận ra được.
  file: `pipeline/scripts/kiem-do-sau-070.test.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 4 — đối chứng cột của E5 và các nhánh bộ phán chỉ đếm số vi phạm, không ghim thông điệp như E5 khai**
  Người dùng thấy gì: Các phép tự kiểm của bộ đo chỉ đếm số lỗi chứ không xác nhận đúng loại lỗi, nên một nhánh sai có thể lọt mà vẫn xanh. Người dùng cổng không bị ảnh hưởng, chỉ giảm độ tin cậy của bộ đo nội bộ.
  Căn cứ: Rủi ro thấp vì chỉ làm bộ đo kém chặt hơn khai báo, không động đến dữ liệu, và có thể siết lại sau mà không tốn nhiều.
  file: `_acceptance/kiem-do-sau-ap-070-sua/probes/doi-chieu-that.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 4 — vế «không đổi migration có từ trước» của E5 âm tính một mình, không có đối chứng dương**
  Người dùng thấy gì: Phép kiểm «không sửa migration cũ» chưa từng được thử với một thay đổi thật, nên nếu bộ lọc sai nó vẫn báo sạch. Không ảnh hưởng người dùng cổng.
  Căn cứ: Nhẹ vì kết quả hiện tại đúng và kho còn có hook chặn sửa migration đã commit làm lớp bảo vệ thứ hai.
  file: `_acceptance/kiem-do-sau-ap-070-sua/probes/doi-chieu-that.mjs`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 1 — kiểm bộ chạy đúng DB thử bằng grep mã nguồn, không đo đầu ra**
  Người dùng thấy gì: Chưa có bằng chứng trực tiếp rằng cả năm bộ kiểm đều chạy trên DB thử thay vì DB chính trên máy, chỉ có kiểm gián tiếp. Nếu rơi nhầm thì phép đo hụt mà vẫn xanh, nhưng không làm hỏng dữ liệu thật.
  Căn cứ: Nhẹ vì hai trong năm bộ đã có đối chứng gián tiếp và phép đo chạy một lần trên máy nội bộ, nếu sai thì chạy lại được.
  file: `_acceptance/kiem-do-sau-ap-070-sua/probes/doi-chieu-that.mjs`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 5 — «bốn migration × hai trạng thái view» chỉ là ma trận văn bản, vế chạy thật là một điểm và 059 không được chạy qua sqlNapLai**
  Người dùng thấy gì: Một trong bốn migration cũ chưa được chạy thật trọn vẹn trên view mới, chỉ được chứng minh ở mức văn bản. Có thể còn đỏ khi nạp lại migration cũ, nhưng không ảnh hưởng người dùng cổng.
  Căn cứ: Nhẹ vì ba bộ dùng tệp này đã đỏ sẵn từ trước vì lý do khác và chỉ chạm công cụ kiểm nội bộ, không đụng dữ liệu thật.
  file: `pipeline/scripts/kiem-do-sau-070.test.mjs`
  severity: medium
  Đề xuất: known-limits

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
