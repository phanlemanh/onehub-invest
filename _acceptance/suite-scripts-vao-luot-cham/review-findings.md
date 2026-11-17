## Trong hợp đồng

- **Dòng tổng kết bị mất số ca khi một mẩu stdout cắt giữa ký tự UTF-8 «ℹ»**
  AC: AC-2
  file: `scripts/suite-neu-doi.mjs:239`
  severity: medium
  source: bugs
  detail: Ở bước test, `con.stdout` không gọi setEncoding nên mỗi sự kiện 'data' nhận về một Buffer, và mỗi Buffer bị `tongKet.nap(String(b))` giải mã riêng lẻ. Ký tự «ℹ» mà reporter spec in ở đầu mọi dòng tổng kết (`ℹ tests N`, `ℹ pass N`, `ℹ fail N`) dài 3 byte UTF-8. Khi ranh giới mẩu đọc từ pipe rơi vào giữa 3 byte đó, hai nửa bị đổi thành U+FFFD. Dòng ghép lại trong `du` khi đó không còn khớp MAU_TONG_KET, nên tomTatScripts trả `tests`/`pass`/`fail` = null, hoặc lấy một dòng trùng mẫu in sớm hơn. Hậu quả: dòng `scripts-ci` ghi vào run-log có `fail: null` dù lượt chạy đỏ, trong khi E5 và AC-2 đọc đúng các trường này. Ca test SSL-AC-2 cắt mẫu theo chuỗi JS (`ra.slice`), không cắt theo byte, nên không bắt được lỗi này. Cách sửa: gọi `con.stdout.setEncoding('utf8')` (dùng StringDecoder bên trong), hoặc giữ phần byte dở dang giữa hai mẩu.
  rationale: AC-2 đòi dòng cuối là JSON có tests, pass, fail là số; lỗi này làm các trường thành null dù lượt đỏ, và AC-5 đọc fail:0 cũng bị ảnh hưởng.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **E3/E4/E5 khai executor: script nhưng lệnh đặt ở executors.test, lệch cách đặt lệnh của cả kho**
  Người dùng thấy gì: Ba lệnh kiểm được xếp nhầm nhóm trong tệp cấu hình, nhưng vẫn chạy đúng. Người dùng không thấy khác biệt nào.
  Căn cứ: Chỉ là chuyện xếp gọn, không ảnh hưởng kết quả hay dữ liệu; sửa sau cũng rẻ nhưng không đáng mở việc.
  file: `_acceptance/config.yaml`
  severity: low
  Đề xuất: wont-fix

- **tai-hien.sh bỏ qua lỗi của dung-worktree-cham.sh nên báo đỏ sai lý do**
  Người dùng thấy gì: Khi môi trường kiểm tra hỏng, phép kiểm có thể báo kết quả sai lý do mà người xem không nhận ra ngay. Sản phẩm cho người dùng không bị ảnh hưởng.
  Căn cứ: Chỉ làm giảm độ tin cậy của bằng chứng nội bộ, không mất dữ liệu; người ký có thể chạy lại để thấy rõ.
  file: `_acceptance/suite-scripts-vao-luot-cham/probes/tai-hien.sh`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 2 — fixture viết tay đúng khuôn bên đọc: lượt đỏ dài của boTongKet/tomTatScripts không được đo khứ hồi**
  Người dùng thấy gì: Phép kiểm chưa thử với đầu ra dài thật của một lượt đỏ, nên nếu định dạng khác dự kiến thì sổ ghi có thể thiếu số ca mà test vẫn xanh.
  Căn cứ: Chỉ ảnh hưởng độ tin cậy của sổ kiểm nội bộ, không ảnh hưởng người dùng; chạy lại là thấy ngay.
  file: `scripts/suite-neu-doi.test.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 5 — tuyên quét mọi phần tử job CI nhưng phanTu chỉ liệt kê một phần**
  Người dùng thấy gì: Nếu ai đó đổi một số thiết lập nhỏ của quy trình kiểm tự động, lệnh chạy thử cục bộ có thể không phát hiện sự lệch. Người dùng cuối không thấy ảnh hưởng.
  Căn cứ: Chỉ làm lệnh chạy thử tại máy lệch khỏi CI ở vài chi tiết hiếm; CI thật vẫn bắt được, nên hậu quả nhẹ.
  file: `scripts/suite-neu-doi.test.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 4 — tái hiện đỏ chỉ khẳng định «ca nằm trong danh sách đỏ», không có đối chứng dương trong cùng môi trường**
  Người dùng thấy gì: Phép tái hiện lỗi cũ chưa có đối chứng chứng minh ca đỏ do đúng lỗi chứ không do môi trường. Người dùng cuối không bị ảnh hưởng.
  Căn cứ: Chỉ giảm độ chắc của bằng chứng nội bộ; số đo thật ở vòng trước đã thấy đúng ca đỏ nên rủi ro thấp.
  file: `_acceptance/suite-scripts-vao-luot-cham/probes/tai-hien.sh`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 3 — E5 hứa «dòng tóm tắt có "fail":0» nhưng chỉ đo mã thoát**
  Người dùng thấy gì: Phép kiểm cây xanh chỉ nhìn kết quả chạy, chưa soi số ca hỏng ghi trong dòng tóm tắt. Người dùng cuối không bị ảnh hưởng.
  Căn cứ: Mã thoát 0 đã gần như bảo đảm không có ca hỏng; thiếu sót chỉ là chưa đối chiếu thêm một con số.
  file: `_acceptance/config.yaml`
  severity: low
  Đề xuất: known-limits

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
