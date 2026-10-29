# Review findings: m2-ac10-so-cap-co-dinh (round 2)

## Trong hợp đồng

Không có finding nào trong hợp đồng ở round này.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Clone tạm ~118MB mỗi trạng thái không bao giờ bị xoá, mỗi lượt chạy design_floor_gen bỏ lại khoảng 350MB trong TMPDIR (r1)**
  Người dùng thấy gì: Mỗi lần chạy bộ kiểm tra này để lại khoảng 350MB rác trên máy người chạy. Dùng lâu ngày ổ đĩa đầy dần mà không có cảnh báo nào, nhưng không ảnh hưởng kết quả kiểm tra.
  Căn cứ: Hậu quả nhẹ và chỉ xảy ra trên máy dev, không mất hay lộ dữ liệu; người dùng tự xoá thư mục tạm được bất cứ lúc nào, và sửa sau không đắt.
  file: `scripts/design-floor/fresh-sau-gop.test.mjs`
  severity: medium
  Đề xuất: known-limits

- **caseBody không kiểm indexOf trả -1, thiếu dấu đóng `});` thì thân ca thành chuỗi rỗng và phép so byte xanh lặng (r1 · tệp đã đổi)**
  Người dùng thấy gì: Nếu sau này ai đó đổi cách viết cuối tệp kiểm tra, phép so 'không đổi thân ca' có thể báo xanh mà thật ra không so gì. Hiện tại chưa xảy ra.
  Căn cứ: Chưa gây sai lệch nào hôm nay, chỉ là rủi ro tiềm ẩn nếu định dạng tệp đổi; phát hiện được khi đọc lại và sửa sau không tốn kém.
  file: `scripts/design-floor/fresh.test.mjs`
  severity: low
  Đề xuất: known-limits

- **blobAt chỉ kiểm commit ghim, không kiểm cha của nó: kho nông cắt đúng tại 3b3a33e5 thì lỗi là git show thô, không có lời «thiếu commit ghim … git fetch --unshallow» (r1 · tệp đã đổi)**
  Người dùng thấy gì: Trên máy tải kho dạng nông và cắt đúng tại một điểm hiếm, người chạy thấy lỗi git khó hiểu thay vì lời nhắc chạy lệnh tải đầy đủ. Kiểm tra vẫn báo đỏ, không bị bỏ qua.
  Căn cứ: Chỉ làm thông báo lỗi kém thân thiện trong một tình huống hiếm; kết quả vẫn đỏ nên không che lỗi, người dùng tự khắc phục được bằng cách tải đầy đủ kho.
  file: `scripts/design-floor/test-helpers.mjs`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 5 (tuyên quét lớp nhưng đếm theo khuôn tên): 'không hạ thước' gộp các ca sinh từ vòng lặp thành một tên thô (r1 · tệp đã đổi)**
  Người dùng thấy gì: Nếu sau này ai đó xoá một hàng trong bảng ca kiểm tra sinh tự động, phép canh 'không hạ chuẩn' sẽ không phát hiện. Hiện chưa có ca nào bị mất.
  Căn cứ: Rủi ro chỉ hiện ra nếu có người vô tình xoá hàng bảng trong tương lai, không ảnh hưởng người dùng cuối; ghi lại hạn chế là đủ và sửa sau không gấp.
  file: `scripts/design-floor/fresh.test.mjs`
  severity: low
  Đề xuất: known-limits

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
