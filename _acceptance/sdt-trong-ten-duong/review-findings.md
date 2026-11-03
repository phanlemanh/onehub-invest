# Review findings: sdt-trong-ten-duong (round 3)

## Trong hợp đồng

- **Cặp cờ --chay --chi-doc vượt rào DB thử, chạy transform + resolve thật trên DB dùng chung**
  file: `pipeline/scripts/do-sdt-trong-duong.mjs:33`
  severity: medium
  AC: AC-4
  source: conventions
  detail: Rào ở dòng 33 là `if (!CHI_DOC && !/\/oneinvest_[a-z0-9_]+$/.test(DB_URL)) exit(2)`, nên có --chi-doc là bỏ qua kiểm tra. Trong chay(), `if (CHAY) return await chayLuot(c)` (dòng 109) xét CHAY trước và không xét CHI_DOC. Vì vậy `--chay --chi-doc` chạy runTransformChotot + chayResolve rồi CREATE TABLE do_sdt_luot trên DB bất kỳ. Nếu DATABASE_URL rỗng, client dùng `connectionString: undefined` và đi theo biến môi trường PG. AC-4 ghi «thước từ chối chạy khi DATABASE_URL không phải DB thử», E5 ghi «trỏ vào DB oneinvest thì thoát 2, cả khi có --chay». db/db-thu.sh ra đời sau sự cố khoá DB dùng chung. Thước do-duong-s06.mjs dùng cùng mẫu rào nhưng --chi-doc của nó là chỉ đọc; tệp này thêm nhánh ghi --chay nên mẫu cũ không còn đủ. chungDo chỉ thử `[]` và `[--chay]`, không thử cặp cờ này. Hướng sửa: rào theo `CHAY || !CHI_DOC`, hoặc từ chối khi có cả hai cờ.

- **Rào DB của thước bị bỏ qua khi dùng --chay cùng --chi-doc, transform và resolve chạy thật trên DB dùng chung**
  file: `pipeline/scripts/do-sdt-trong-duong.mjs:33`
  severity: medium
  AC: AC-4
  source: bugs
  detail: Điều kiện rào là `if (!CHI_DOC && !/oneinvest_.../.test(DB_URL))`, nên có --chi-doc thì không kiểm tên DB. Nhánh ghi ở dòng 109 `if (CHAY) return await chayLuot(c)` không xét CHI_DOC. Lệnh `DATABASE_URL=.../oneinvest node scripts/do-sdt-trong-duong.mjs --chay --chi-doc` qua được rào, chạy runTransformChotot + chayResolve rồi CREATE TABLE do_sdt_luot trên DB máy thu. DATABASE_URL trống thì `connectionString` là undefined và pg kết nối theo biến môi trường PG*. Hợp đồng E5 ghi «Trỏ thước vào DB oneinvest thì thoát 2, cả khi có --chay», nhưng chungDo chỉ thử [] và [--chay] nên tổ hợp này không bị bắt. Phát hiện từ đọc mã, chưa chạy lệnh. Cách sửa: rào theo `(CHAY || !CHI_DOC)`, hoặc từ chối hai cờ đi cùng nhau.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Rút phát biểu lấy danh sách cần phân xử từ RETURNING: phân xử lỗi một lần thì tin ngoài lô giữ số điện thoại mãi**
  Người dùng thấy gì: Nếu job đêm bị đứt đúng giữa hai bước, một số tin cũ có thể giữ số điện thoại trong ô đường và vẫn lên cloud, mà log không báo lỗi.
  Căn cứ: Chỉ xảy ra khi job đứt đúng khoảng hẹp và tin nằm ngoài lượt; thước đo vẫn báo đỏ nên không mất dấu, nhưng sửa gốc cần đổi cách chọn tin.
  file: `pipeline/transform-chotot.mjs`
  severity: medium
  Đề xuất: known-limits

- **Transform đứt giữa bước rút và bước phân xử thì tin ngoài lượt giữ số điện thoại vĩnh viễn, không có đường tự sửa**
  Người dùng thấy gì: Nếu job đêm bị đứt giữa chừng, tin nằm ngoài lượt có thể giữ số điện thoại ở ô đường và tiếp tục lên cloud mà không ai hay.
  Căn cứ: Điều kiện kích hoạt hẹp và chưa đo được số tin bị ảnh hưởng; thước đo sẽ báo đỏ, người dùng cuối hầu như không gặp.
  file: `pipeline/transform-chotot.mjs`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 2 — Fixture viết tay: plan và columns của buildSwapSql không rút từ bên sinh thật**
  Người dùng thấy gì: Bài kiểm tra việc đồng bộ lên cloud dùng khuôn tự viết, nên chưa chứng minh chắc hai cột đường thật sự đi theo đường đồng bộ thực tế.
  Căn cứ: Rủi ro nằm ở độ tin của bài kiểm tra, không phải lỗi dữ liệu đã thấy; sửa sau rẻ và không ảnh hưởng người dùng ngay.
  file: `pipeline/scripts/sdt-trong-duong.itest.mjs`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 4 — Assertion âm tính một mình: «hoàn tác không trả số» ở ô log cũ không có đối chứng hoàn tác đã chạm ô đó**
  Người dùng thấy gì: Bài kiểm tra việc hoàn tác trên log cũ luôn xanh dù hoàn tác có chạm ô đó hay không, nên có thể che lỗi hoàn tác trả lại số.
  Căn cứ: Không có dữ liệu sai được thấy, chỉ là bài kiểm tra yếu ở một ô; hoàn tác là thao tác hiếm của người vận hành và sửa rẻ.
  file: `pipeline/scripts/sdt-trong-duong.itest.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 4 — Assertion âm tính một mình: tin «vừa về NULL» của AC-5 chưa từng có giá trị**
  Người dùng thấy gì: Bài kiểm tra việc đồng bộ ô đường vừa bị xoá số chưa dựng tin từng mang số, nên chưa chứng minh chuyển từ có số sang trống được ghi đè lên cloud.
  Căn cứ: Phía căn đã có chuyển trạng thái thật, còn phía tin chỉ thiếu tiền đề kiểm; không thấy lỗi dữ liệu và bổ sung sau rẻ.
  file: `pipeline/scripts/sdt-trong-duong.itest.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 4 — Assertion âm tính một mình: hai ca đỏ ghim thông điệp từ phép kiểm mà ca xanh không chạy**
  Người dùng thấy gì: Hai ca thử cố ý làm hỏng dùng thông điệp lỗi tự phát ra, nên chúng chứng minh bộ kiểm bắt được lỗi nhưng chưa khớp từng chữ với ca xanh.
  Căn cứ: Không ảnh hưởng người dùng hay dữ liệu; chi phí chỉnh vượt xa giá trị nhận lại.
  file: `pipeline/scripts/sdt-trong-duong.itest.mjs`
  severity: low
  Đề xuất: wont-fix

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
