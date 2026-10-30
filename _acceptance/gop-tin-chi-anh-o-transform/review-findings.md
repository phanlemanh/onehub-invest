## Trong hợp đồng

- **Ảnh của bài chỉ-ảnh không luôn xếp SAU ảnh của bài chữ (trái AC-3) khi trộn ảnh đã tải và ảnh từ xa; ca DB không bắt được**
  file: `pipeline/transform-media.mjs:98`
  severity: medium
  AC: AC-3
  source: bugs
  detail: dungDong nối bài chỉ-ảnh vào cuối `posts` rồi gọi mediaRowsFromPosts. Hàm này chạy hai lượt trên TOÀN BỘ danh sách: lượt 1 lấy mọi ảnh đã tải (media_files có local file) của mọi bài, lượt 2 mới lấy URL từ xa. Hệ quả: khi bài chữ của offer chỉ có ảnh từ xa (cột media, hoặc media_files tải lỗi) còn bài chỉ-ảnh có ảnh đã tải, ảnh của bài chỉ-ảnh nhận media_order NHỎ HƠN ảnh của bài chữ và thành ảnh bìa. Điều này trái AC-3 («xếp SAU ảnh của chính hai bài chữ», E3: «media_order của chúng lớn hơn mọi ảnh của hai bài chữ») và trái comment ở dòng 97. Tình huống có trên dữ liệu thật: media_files chỉ có từ 26/10 (DB local có 6.960 bài có media_files, 4.283 bài chỉ có cột media), và offer gom bài đăng lại qua nhiều ngày, nên bài chữ cũ chỉ có ảnh từ xa, bài chỉ-ảnh mới có ảnh đã tải. gop-anh.itest.mjs (themBai) chỉ chèn cột `media` (URL từ xa), không có media_files, nên ca GA-AC-3 xanh dù lỗi vẫn còn. Cách sửa: gọi mediaRowsFromPosts riêng cho phần ảnh gộp, đặt media_order nối tiếp sau phần của bài chữ (bỏ trùng theo URL/local đã thấy); hoặc thêm ca test trộn local và remote.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Thước do-gop-anh tính «đã gộp» khi bài ảnh không có phần tử nào trong cột media (đúng một cách rỗng tuếch, có thể che cặp thiếu)**
  Người dùng thấy gì: Con số tỉ lệ offer có ảnh có thể đẹp hơn thực tế nếu sau này xuất hiện loại tin ảnh có danh sách ảnh rỗng, nhưng hiện chưa có tin nào như vậy nên số đang báo vẫn đúng.
  Căn cứ: Hiện chưa ảnh hưởng ai vì dữ liệu thật chưa có loại tin này, chỉ làm số đo kém tin cậy nếu về sau xuất hiện, và ghi lại để xử lý khi nó thật sự xuất hiện thì rẻ hơn sửa ngay.
  file: `pipeline/scripts/do-gop-anh.mjs`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 4 (assertion âm-tính-một-mình): băm sale_offers 'không đổi' không có đối chứng dương**
  Người dùng thấy gì: Bài kiểm tra việc danh sách offer không bị đổi chưa tự chứng minh được là nó sẽ phát hiện thay đổi, nên nếu sau này ai đó vô tình sửa offer thì kiểm tra có thể không báo.
  Căn cứ: Người dùng không gặp lỗi nào, tính năng không hề ghi vào danh sách offer, và thêm một ca đối chứng chỉ để làm chắc bài kiểm tra thì tốn công hơn nhiều so với rủi ro còn lại.
  file: `pipeline/scripts/gop-anh.itest.mjs`
  severity: low
  Đề xuất: wont-fix

- **Hình dạng 5 (tuyên quét LỚP nhưng chỉ có điểm-case): bảo 'băm toàn bộ stg_zalo_posts' mà chỉ băm 6 cột tự chọn**
  Người dùng thấy gì: Bài kiểm tra bảo đảm bảng tin gốc không bị đổi nhưng chỉ nhìn vài cột, nên một thay đổi ở cột khác sẽ không bị phát hiện, dù tính năng hiện không ghi vào bảng này.
  Căn cứ: Người dùng không bị ảnh hưởng và dữ liệu gốc không mất, chỉ là mức bảo đảm của bài kiểm tra hẹp hơn mô tả, nên ghi rõ phạm vi thật là đủ, mở rộng sau khi cần thì rẻ.
  file: `pipeline/scripts/gop-anh.itest.mjs`
  severity: low
  Đề xuất: known-limits

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
