# Review findings: data-api-don-ten-nguon (round 1)

## Trong hợp đồng

(không có)

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Còn tên miền CDN của S01 («muscache») trong chú thích lược đồ mẫu công khai, thước PB5 không bắt**
  Người dùng thấy gì: Bản công khai của API dữ liệu vẫn còn nhắc tên miền ảnh của một nguồn thật trong vài dòng chú thích và dữ liệu mẫu. Ai đọc kho công khai có thể suy ra nguồn nào đang được dùng, dù thước kiểm báo sạch.
  Căn cứ: Tên miền nguồn thuộc nhóm tên nguồn phải giữ kín và kho này công khai, nên nặng vừa; dòng đã đẩy ra thì khó thu hồi, còn sửa thêm một đợt dọn nhỏ thì rẻ.
  file: `data-api/db/020_s02_listing_media.sql`
  severity: medium
  Đề xuất: new-contract

- **Kiểm tên tệp chỉ xét basename: thư mục mang tên nguồn thật dưới data-api/ lọt qua, thước vẫn báo SẠCH**
  Người dùng thấy gì: Nếu sau này ai đó đặt tên một thư mục bằng tên nguồn thật, bộ kiểm vẫn báo sạch và tên đó đi thẳng ra kho công khai. Hiện chưa có thư mục nào như vậy.
  Căn cứ: Chưa có trường hợp thật trong cây hiện tại nên hậu quả hiện bằng không; ghi vào giới hạn đã biết là đủ cho tới khi có ai thêm thư mục mới.
  file: `scripts/data-api-ten-nguon.mjs`
  severity: medium
  Đề xuất: known-limits

- **Dấu nháy đơn lẻ trong template literal TS làm bộ phân loại mất đồng bộ: nuốt backtick đóng, chú thích và chuỗi TS phía sau bị tính là mã**
  Người dùng thấy gì: Trong một số kiểu viết đặc biệt, bộ kiểm có thể xếp sai loại hoặc bỏ sót một tên nguồn thật nằm sau đó. Cây hiện tại không dính trường hợp này.
  Căn cứ: Nhẹ vì chỉ xảy ra với cách viết hiếm, hiện chưa xảy ra, và người dùng cuối không thấy; sửa sau không tốn nhiều.
  file: `scripts/data-api-ten-nguon.mjs`
  severity: low
  Đề xuất: known-limits

- **Lỗi đọc tệp bị nuốt im lặng: tệp không đọc được bị bỏ qua mà vẫn được đếm là đã quét**
  Người dùng thấy gì: Nếu một tệp không đọc được, bộ kiểm vẫn báo sạch như thể đã soát xong tệp đó. Một tên nguồn thật nằm trong tệp ấy sẽ không bị phát hiện.
  Căn cứ: Hiếm gặp trên máy bình thường và chạy lại là thấy; hậu quả chỉ là bỏ sót tạm thời, không mất dữ liệu.
  file: `scripts/data-api-ten-nguon.mjs`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 5: tuyên «mỗi kiểu rò» nhưng chỉ có 8 ca điểm, bỏ trống các nhánh phân loại của loaiKyTu, gồm cả nhánh miễn trừ**
  Người dùng thấy gì: Bộ thử của thước kiểm mới chỉ cấy tám kiểu rò. Một số cách viết khác, như chú thích khối hoặc chuỗi nằm trong đoạn mã, chưa có ca thử riêng nên chưa chắc được bắt.
  Căn cứ: Tám ca khớp đúng điều đã hứa và cây hiện tại sạch, nên rủi ro thấp; bổ sung ca thử sau là việc rẻ, không cần chặn bản này.
  file: `scripts/data-api-ten-nguon.test.mjs`
  severity: medium
  Đề xuất: known-limits

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
