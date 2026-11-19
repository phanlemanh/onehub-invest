# Review findings: noi-phan-khu-trung-s16

## Trong hợp đồng

Không có finding nào map được vào AC.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Lượt đóng dấu địa chỉ S03 vẫn nhận nút phân khu đã nghỉ từ thẻ địa chỉ nhóm đã duyệt**
  Người dùng thấy gì: Nếu một thẻ địa chỉ nhóm đã duyệt trỏ vào phân khu đã được nối đi, các bài mới nạp vẫn có thể bị gắn vào phân khu ẩn đó nên không hiện đúng chỗ trên danh bạ.
  Căn cứ: Chỉ xảy ra khi có thẻ đã duyệt trỏ đúng vào phân khu bị nối; ít gặp, nhưng dữ liệu sai được ghi sẵn lên bài và phải sửa bằng một hàng riêng. Đếm trên DB máy thu ngày 19/11 (chỉ đọc): hiện có 0 thẻ địa chỉ nhóm và 0 tin trỏ vào bảy phân khu sắp nối (cả DB chỉ có 1 thẻ chọn phân khu, 464 phát biểu phân khu trên tin, đều trỏ nơi khác), nên hôm nay chưa có tin nào dính.
  file: `pipeline/lib/dia-chi-the-nhom.mjs`
  severity: medium
  Đề xuất: new-contract

- **docBangChung chép tay luật khớp của view v_toa_nut_vung nhưng thiếu điều kiện khuôn bí danh S16**
  Người dùng thấy gì: Số toà có bằng chứng ghi trên thẻ nối có thể đếm dư một vài toà có mã bí danh dạng bất thường, khiến thẻ hiển thị hơi khác vị trí toà thật.
  Căn cứ: Hậu quả nhẹ, chỉ lệch con số hiển thị trên thẻ trước khi người ký xem, và không làm mất dữ liệu; ghi lại là đủ.
  file: `pipeline/phan-khu-s16.mjs`
  severity: low
  Đề xuất: known-limits

- **kiemNoi báo «toa-treo» cho mọi toà S16 nằm dưới dự án, kể cả toà không thuộc cặp đã nối**
  Người dùng thấy gì: Lệnh kiểm sau khi nối có thể báo lỗi dù việc nối đúng, vì còn vài toà vốn không thuộc cặp nào đang nằm dưới dự án, làm người vận hành phải bỏ qua cảnh báo.
  Căn cứ: Chỉ gây báo động giả và không làm sai dữ liệu; người vận hành tự đối chiếu được với danh sách ca đã loại.
  file: `pipeline/phan-khu-s16.mjs`
  severity: low
  Đề xuất: known-limits

- **Sau khi nối, đảo luật phân khu S16 gốc (--dao) không gỡ được các khu đã chuyển sang nút giữ lại; đảo lượt nối sau đó lại làm sống những khu ấy**
  Người dùng thấy gì: Nếu sau khi nối người vận hành lại đảo luật phân khu gốc, các khu vẫn dính vào phân khu cũ dù hệ thống báo đã đảo xong, và đảo tiếp lượt nối có thể làm chúng sống lại.
  Căn cứ: Đây là thao tác hiếm của người vận hành, có thể gây dữ liệu lệch âm thầm nhưng sửa được bằng cách ghi rõ thứ tự đảo; không ảnh hưởng người dùng cuối thường ngày.
  file: `pipeline/phan-khu-s16.mjs`
  severity: medium
  Đề xuất: known-limits

- **`--dao` nhận cả rule_id của lượt nối: gỡ khoá ở nút giữ lại nhưng để nút nghỉ mồ côi, sau đó không còn đảo nối được**
  Người dùng thấy gì: Nếu người vận hành gõ nhầm lệnh đảo cho mã của lượt nối, các khu bị gỡ khỏi phân khu giữ lại mà không báo lỗi, rồi không đảo nối lại được nữa.
  Căn cứ: Chỉ xảy ra khi gõ nhầm lệnh và không có người dùng cuối nào bị ảnh hưởng ngay; có thể ghi rõ trong hướng dẫn áp, sửa mã sau cũng rẻ.
  file: `pipeline/phan-khu-s16.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 4 (assertion âm tính một mình, không có đối chứng dương): phép kiểm API công khai chỉ đọc nút dự án luôn qua vì không có dòng nào để xét**
  Người dùng thấy gì: Phép kiểm tự động nói API công khai chỉ đọc nút dự án nhưng thực tế không bắt được lỗi nếu sau này ai đó thêm truy vấn đọc cả phân khu nghỉ.
  Căn cứ: Hiện chưa có lỗi nào xuất hiện cho người dùng, chỉ là rào kiểm yếu cho tương lai; thêm đối chứng sau này rẻ nên ghi lại là đủ.
  file: `app/tests/nut-nghi-tren-ops.test.tsx`
  severity: medium
  Đề xuất: known-limits

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).

