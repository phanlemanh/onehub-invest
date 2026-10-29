## Trong hợp đồng

- **Hình dạng 3 (chuỗi có mặt thay cho quan hệ): ca AC-3 bớt dòng không ghim đúng dòng bị bớt**
  AC: AC-3
  file: `scripts/design-floor/fresh.test.mjs:113`
  severity: medium
  source: measurement
  detail: AC-3 hứa một quan hệ: «bản sau bớt một dòng có sẵn → hàm ném lỗi nêu ĐÚNG dòng đó». Hai assert trong ca 'M2-AC-10 hàm kiểm cặp' chỉ kiểm chuỗi có mặt, không kiểm quan hệ giữa đột biến và thông điệp. (1) Ca bỏ dòng design_floor_fresh khớp regex /cặp config thêm 1 dòng, chờ đúng design_floor_gen, design_floor_fresh/. Chữ 'design_floor_fresh' trong thông điệp lấy từ hằng M2_EXECUTOR_KEYS.join(', ') trong kiemCapM2 (test-helpers.mjs), không phải dòng bị bớt. Nếu bỏ design_floor_gen thay vì design_floor_fresh, thông điệp vẫn khớp đúng regex này, nên assert không phân biệt được dòng nào bị bớt. (2) Ca `lost = after.replace(/^.*\n/, '')` (bỏ dòng đầu) chỉ assert /cặp config bớt dòng: -/ và không ghim nội dung dòng bị bớt. Vì vậy một thông điệp nêu sai dòng vẫn qua. Eval E3 cũng hứa «ném lỗi nêu dòng bớt đó». Ca đột biến thêm dòng thì đã ghim đúng (`\+    x: 1`), nên chỉ nhánh bớt dòng bị hở.
  rationale: AC-3 hứa hàm ném lỗi nêu ĐÚNG dòng bị bớt; các assert chỉ kiểm chuỗi có mặt nên không chứng minh được lời hứa đó cho nhánh bớt dòng.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Clone tạm ~118MB mỗi trạng thái không bao giờ bị xoá, mỗi lượt chạy design_floor_gen bỏ lại khoảng 350MB trong TMPDIR**
  Người dùng thấy gì: Mỗi lần chạy bộ kiểm tra này để lại khoảng 350MB rác trên máy người chạy. Dùng lâu ngày ổ đĩa đầy dần mà không có cảnh báo nào, nhưng không ảnh hưởng kết quả kiểm tra.
  Căn cứ: Hậu quả nhẹ và chỉ xảy ra trên máy dev, không mất hay lộ dữ liệu; người dùng tự xoá thư mục tạm được bất cứ lúc nào, và sửa sau không đắt.
  file: `scripts/design-floor/fresh-sau-gop.test.mjs`
  severity: medium
  Đề xuất: known-limits

- **caseBody không kiểm indexOf trả -1, thiếu dấu đóng `});` thì thân ca thành chuỗi rỗng và phép so byte xanh lặng**
  Người dùng thấy gì: Nếu sau này ai đó đổi cách viết cuối tệp kiểm tra, phép so 'không đổi thân ca' có thể báo xanh mà thật ra không so gì. Hiện tại chưa xảy ra.
  Căn cứ: Chưa gây sai lệch nào hôm nay, chỉ là rủi ro tiềm ẩn nếu định dạng tệp đổi; phát hiện được khi đọc lại và sửa sau không tốn kém.
  file: `scripts/design-floor/fresh.test.mjs`
  severity: low
  Đề xuất: known-limits

- **blobAt chỉ kiểm commit ghim, không kiểm cha của nó: kho nông cắt đúng tại 3b3a33e5 thì lỗi là git show thô, không có lời «thiếu commit ghim … git fetch --unshallow»**
  Người dùng thấy gì: Trên máy tải kho dạng nông và cắt đúng tại một điểm hiếm, người chạy thấy lỗi git khó hiểu thay vì lời nhắc chạy lệnh tải đầy đủ. Kiểm tra vẫn báo đỏ, không bị bỏ qua.
  Căn cứ: Chỉ làm thông báo lỗi kém thân thiện trong một tình huống hiếm; kết quả vẫn đỏ nên không che lỗi, người dùng tự khắc phục được bằng cách tải đầy đủ kho.
  file: `scripts/design-floor/test-helpers.mjs`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 5 (tuyên quét lớp nhưng đếm theo khuôn tên): 'không hạ thước' gộp các ca sinh từ vòng lặp thành một tên thô**
  Người dùng thấy gì: Nếu sau này ai đó xoá một hàng trong bảng ca kiểm tra sinh tự động, phép canh 'không hạ chuẩn' sẽ không phát hiện. Hiện chưa có ca nào bị mất.
  Căn cứ: Rủi ro chỉ hiện ra nếu có người vô tình xoá hàng bảng trong tương lai, không ảnh hưởng người dùng cuối; ghi lại hạn chế là đủ và sửa sau không gấp.
  file: `scripts/design-floor/fresh.test.mjs`
  severity: low
  Đề xuất: known-limits

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
