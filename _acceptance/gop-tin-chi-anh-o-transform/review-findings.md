# Review findings: gop-tin-chi-anh-o-transform (round 2)

## Trong hợp đồng

(không có)

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Hình dạng 4 (một assertion âm tính đứng một mình): nửa sale_offers của GA-AC-5 không có đối chứng dương**
  Người dùng thấy gì: Tính năng vẫn không đổi danh sách tin rao như đã hứa. Điểm yếu nằm ở phép kiểm tự động: nếu sau này vô tình sửa tin rao, phép kiểm này có thể không báo.
  Căn cứ: Không ảnh hưởng người dùng hôm nay và không làm mất hay lộ dữ liệu; đây chỉ là lưới an toàn cho các lần sửa sau, nên ghi nhận là hạn chế đã biết.
  file: `pipeline/scripts/gop-anh.itest.mjs`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 4 (một assertion âm tính đứng một mình): nhánh «không offer» (a2) của GA-AC-3b không có trạng thái trước và không có ca đỏ ghim**
  Người dùng thấy gì: Ảnh của tin chỉ-ảnh khi có một tin chữ không thuộc tin rao nào chen vào gần hơn vẫn được gỡ đúng như thiết kế. Phép kiểm tự động cho nhánh này chưa chứng minh chắc là ảnh từng được gắn trước đó.
  Căn cứ: Hành vi cho người dùng không sai và không mất dữ liệu; điểm yếu chỉ là phép kiểm có thể báo xanh dù nhánh này hỏng sau này, chỉ gặp khi có người sửa tiếp phần gộp ảnh.
  file: `pipeline/scripts/gop-anh.itest.mjs`
  severity: low
  Đề xuất: known-limits

- **Thước do-gop-anh tính «đã gộp» khi bài ảnh không có phần tử nào trong cột media (đúng một cách rỗng tuếch, có thể che cặp thiếu) (r1)**
  Người dùng thấy gì: Con số tỉ lệ offer có ảnh có thể đẹp hơn thực tế nếu sau này xuất hiện loại tin ảnh có danh sách ảnh rỗng, nhưng hiện chưa có tin nào như vậy nên số đang báo vẫn đúng.
  Căn cứ: Hiện chưa ảnh hưởng ai vì dữ liệu thật chưa có loại tin này, chỉ làm số đo kém tin cậy nếu về sau xuất hiện, và ghi lại để xử lý khi nó thật sự xuất hiện thì rẻ hơn sửa ngay.
  file: `pipeline/scripts/do-gop-anh.mjs`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 4 (assertion âm-tính-một-mình): băm sale_offers 'không đổi' không có đối chứng dương (r1 · tệp đã đổi)**
  Người dùng thấy gì: Bài kiểm tra việc danh sách offer không bị đổi chưa tự chứng minh được là nó sẽ phát hiện thay đổi, nên nếu sau này ai đó vô tình sửa offer thì kiểm tra có thể không báo.
  Căn cứ: Người dùng không gặp lỗi nào, tính năng không hề ghi vào danh sách offer, và thêm một ca đối chứng chỉ để làm chắc bài kiểm tra thì tốn công hơn nhiều so với rủi ro còn lại.
  file: `pipeline/scripts/gop-anh.itest.mjs`
  severity: low
  Đề xuất: wont-fix

- **Hình dạng 5 (tuyên quét LỚP nhưng chỉ có điểm-case): bảo 'băm toàn bộ stg_zalo_posts' mà chỉ băm 6 cột tự chọn (r1 · tệp đã đổi)**
  Người dùng thấy gì: Bài kiểm tra bảo đảm bảng tin gốc không bị đổi nhưng chỉ nhìn vài cột, nên một thay đổi ở cột khác sẽ không bị phát hiện, dù tính năng hiện không ghi vào bảng này.
  Căn cứ: Người dùng không bị ảnh hưởng và dữ liệu gốc không mất, chỉ là mức bảo đảm của bài kiểm tra hẹp hơn mô tả, nên ghi rõ phạm vi thật là đủ, mở rộng sau khi cần thì rẻ.
  file: `pipeline/scripts/gop-anh.itest.mjs`
  severity: low
  Đề xuất: known-limits

## Chưa adversarial-verify (refuter chết)

(không có)

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
