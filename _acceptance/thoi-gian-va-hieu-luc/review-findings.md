## Trong hợp đồng

- **Hình dạng 4 (âm-tính-một-mình, thiếu đối chứng dương): kiểm điền lùi new_listing của AC-6 đúng cả khi không có tin nào và cả khi bước điền lùi không chạy**
  AC: AC-6
  file: `pipeline/scripts/trang-thai-chao.itest.mjs:324`
  severity: medium
  source: measurement
  detail: Dòng 324-328 kiểm `d.moi === d.tin` và `d.khac === d.tin` ("điền lùi: số new_listing phải bằng số tin có sẵn"). Cả hai đều là phép so số đếm, không có vế dương nào kiểu `d.tin > 0`. Ca này cũng không gieo tin đời cũ nào trước khi nạp 059 (gọi `trongGiaoDich` mà không có `truoc`, khác AC-1 có `fixtureLegacy`). Vì vậy: (a) trên DB không có tin thì phép so thành 0 = 0 và vẫn xanh; (b) trên DB đã áp 059 từ trước thì phép so vẫn đúng nhờ dòng new_listing cũ cộng trigger, dù lần nạp 059 trong giao dịch có điền lùi hay không. Trường hợp (b) đang xảy ra với chính DB của executor: `tg_roundtrip` (trang-thai-roundtrip.mjs dòng 43-45) áp 059 ở chế độ tự commit lên cùng DB `oneinvest_p2_tg` mà `tg_db` dùng. Đem bản 059 bỏ câu INSERT … 'new_listing' … FROM sale_offer_records vào ca này thì nó vẫn xanh. Thước idem-059.mjs (dòng 31) có đúng vế dương `mot.tin > 0` và tự gọi đó là «đối chứng dương»; itest của E6 thì thiếu vế này. Vế «điền lùi: số NewListing = số tin có sẵn» của E6 vì thế chưa được đo.
  rationale: AC-6 đòi mỗi tin có sẵn trước 059 có đúng một NewListing điền lùi, mà phép kiểm của nó xanh cả khi không có tin hoặc khi bước điền lùi bị bỏ, nên vế này chưa được chứng minh.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **napLai059 không khôi phục field_assertions_guard bản 059 sau khi nạp lại TOÀN BỘ 045**
  Người dùng thấy gì: Một bài kiểm tra tự động chạy với bản rào cũ hơn bản thật, nên có thể bỏ sót việc chặn giá trị trạng thái chào sai. Người dùng không gặp gì ở hệ thống thật.
  Căn cứ: Chỉ ảnh hưởng độ tin cậy của một bài kiểm tra nội bộ, không làm mất hay sai dữ liệu của ai, và ghi lại làm han chế đã biết là đủ.
  file: `pipeline/lib/nap-045.mjs`
  severity: low
  Đề xuất: known-limits

- **Hai itest nạp 059 (có DDL trên bảng dùng chung) dưới khoá 56056 chứ không phải 33033 như luật test nạp migration**
  Người dùng thấy gì: Nếu vài bài kiểm tra chạy song song trên cùng một cơ sở dữ liệu thì có thể treo lẫn nhau. Hiện chúng chạy lần lượt trên DB thử riêng nên người dùng không gặp.
  Căn cứ: Rủi ro chỉ nằm ở môi trường kiểm tra, không chạm dữ liệu thật, và nếu treo thì chạy lại là xong.
  file: `pipeline/scripts/trang-thai-chao.itest.mjs`
  severity: low
  Đề xuất: known-limits

- **property_price_history bỏ mất lịch sử giá của tin bị đổi khoá (superseded_by) và ghi new_listing giả cho tin kế**
  Người dùng thấy gì: Khi một tin rao đổi mã nguồn rồi được gắn vào căn, lịch sử giá của căn có thể mất các mốc trước đó và hiện tin như mới đăng. Hiện chưa có căn nào bị ảnh hưởng.
  Căn cứ: Chưa có căn thật nào dính, không mất dữ liệu gốc vì bằng chứng vẫn còn, và có thể xử lý trong một việc riêng khi tin đổi khoá bắt đầu được gắn căn.
  file: `db/migrations/059_thoi_gian_hieu_luc.sql`
  severity: low
  Đề xuất: known-limits

- **idem-059: chiều đỏ gãy khi DB oneinvest đã áp 059 (sau khi gộp)**
  Người dùng thấy gì: Sau khi bản cập nhật được áp lên máy thu, công cụ tự kiểm tra việc chạy lặp có thể báo đỏ oan dù dữ liệu vẫn đúng. Người dùng không thấy ảnh hưởng.
  Căn cứ: Chỉ gây báo động giả cho người vận hành, không đụng dữ liệu, và dựng lại bản chép sạch là chạy được.
  file: `pipeline/scripts/idem-059.mjs`
  severity: low
  Đề xuất: known-limits

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
