## Trong hợp đồng

- **Lượt bị ngắt hoặc không dựng được DB thoát mà không có dòng JSON scripts-ci, trái AC-2**
  AC: AC-2
  file: `scripts/suite-neu-doi.mjs:226`
  severity: medium
  source: bugs
  detail: AC-2 ghi «Given lệnh chạy xong (xanh hay đỏ) hoặc bị ngắt», dòng cuối stdout phải là JSON `scripts-ci`, và với `--ho-so` cùng dòng ấy được nối vào run-log. Trình xử lý tín hiệu ở dòng 224-227 chỉ ngắt nhóm tiến trình, xoá DB rồi `process.exit(128 + so)`, không in tóm tắt và không ghi run-log. Đường createdb lỗi ở dòng 212 cũng `return 2` mà không có dòng nào. Tái hiện bằng docker giả với `--ho-so`: SIGTERM giữa bước test thoát 143, stdout chỉ có ba dòng «bước …», run-log 0 dòng; createdb lỗi thoát 2, run-log 0 dòng. Hậu quả: luật gộp đọc dòng `scripts-ci` MỚI NHẤT, nên lượt hỏng không để lại dấu vết và dòng xanh cũ vẫn là dòng mới nhất. Ca SSL-AC-2 không bắt được vì tiến trình SIGTERM chạy với `stdio: "ignore"` và chỉ kiểm mã thoát cùng việc dọn DB. Cách sửa: trong trình xử lý tín hiệu và đường lỗi dựng DB, phát cùng dòng tóm tắt (`exit` khác 0, số ca null) ra stdout và run-log trước khi thoát, rồi thêm assert cho ca SIGTERM.

- **Hình dạng 5 — AC-2 tuyên ba kết cục xanh, đỏ, bị ngắt nhưng ô «bị ngắt» không đo dòng JSON cuối**
  AC: AC-2
  file: `scripts/suite-neu-doi.test.mjs:431`
  severity: high
  source: measurement
  detail: AC-2 ghi «Given lệnh chạy xong (xanh hay đỏ) hoặc bị ngắt», dòng cuối stdout là JSON scripts-ci. Ca SIGTERM spawn với stdio: "ignore" (dòng 431) nên không đọc được stdout, chỉ assert mã 143 và DB đã xoá (dòng 436-437). Ô thiếu này đang che một lệch thật: trình xử lý tín hiệu ở scripts/suite-neu-doi.mjs:224-226 gọi xoa() rồi process.exit(128 + so), thoát trước khi tới chỗ in dòng tóm tắt và nối run-log. Lượt bị ngắt vì vậy không có dòng JSON nào.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Dòng scripts-ci ghi sha không phải cây đã chạy test: đọc HEAD sau khi chạy xong và bỏ qua cây bẩn**
  Người dùng thấy gì: Nếu có commit mới hoặc sửa chưa commit trong lúc chạy kiểm tra, kết quả xanh có thể bị ghi cho một bản mã chưa hề được kiểm. Người gộp có thể tin nhầm là bản đó đã qua kiểm.
  Căn cứ: Chỉ xảy ra khi người chạy sửa mã giữa lượt, CI thật vẫn chặn sau đó và chạy lại là thấy, nên hậu quả nhẹ, không mất dữ liệu.
  file: `scripts/suite-neu-doi.mjs`
  severity: high
  Đề xuất: known-limits

- **Hình dạng 2 — ca «đọc pipe theo byte» tự dựng bộ đọc trong test, không đi qua đường đọc thật của mainScripts**
  Người dùng thấy gì: Nếu lỗi mất số ca khi đầu ra bị cắt giữa ký tự quay lại, bộ kiểm hiện tại có thể không báo đỏ. Người dùng sẽ thấy số ca sai trong dòng tóm tắt mà không có cảnh báo.
  Căn cứ: Lỗi đã được sửa và chỉ làm sai con số tóm tắt, không mất dữ liệu; thêm phép đo thật có thể làm sau mà không gấp.
  file: `scripts/suite-neu-doi.test.mjs`
  severity: high
  Đề xuất: known-limits

- **Hình dạng 4 — E6 chạy --test-name-pattern=S4V-AC-6 trần: không ca nào khớp vẫn thoát 0, không có đối chứng dương**
  Người dùng thấy gì: Nếu sau này ca kiểm cấu hình bị đổi tên hay xoá, bước kiểm vẫn báo xanh dù không kiểm gì. Cấu hình lượt chấm có thể bị đổi mà không ai hay.
  Căn cứ: Chưa có lỗi thật hôm nay, chỉ là lưới an toàn mỏng đi khi có người sửa tên ca; dễ phát hiện và sửa sau.
  file: `_acceptance/config.yaml`
  severity: high
  Đề xuất: known-limits

- **Hình dạng 5 — ma trận dọn DB thiếu ô «lượt đỏ»: chỉ đo sau lượt xanh và sau SIGTERM**
  Người dùng thấy gì: Nếu lượt kiểm đỏ làm rò cơ sở dữ liệu tạm, bộ kiểm không phát hiện. Các DB tạm thừa có thể tích lại trên máy.
  Căn cứ: Chỉ tốn chỗ trên máy, không mất dữ liệu thật, và lượt sau có bước dọn DB mồ côi.
  file: `scripts/suite-neu-doi.test.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 1 — đo hằng SHELL_CI thay vì shell mà bước CI thực sự chạy**
  Người dùng thấy gì: Nếu ai đó đổi cách chạy các bước, lệnh cục bộ có thể chạy tiếp khi CI đã dừng. Kết quả cục bộ có thể xanh trong khi CI đỏ.
  Căn cứ: Chỉ là khe hở kiểm thử, hiện chưa gây sai; nếu xảy ra, CI thật vẫn chặn nên người dùng không bị ảnh hưởng.
  file: `scripts/suite-neu-doi.test.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 3 — «danh sách ca bị bỏ bằng ci-bo-qua.json» chỉ so chuỗi NODE_OPTIONS với chính bộ sinh ra nó**
  Người dùng thấy gì: Nếu bộ sinh danh sách ca bỏ qua làm rơi mục, bộ kiểm vẫn báo xanh. Có thể chạy nhầm các ca cần dữ liệu thật và đỏ giả.
  Căn cứ: Hậu quả chỉ là báo đỏ giả hoặc xanh giả ở lượt kiểm cục bộ, chạy lại là thấy, không ảnh hưởng dữ liệu.
  file: `scripts/suite-neu-doi.test.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 2 — dbMoCoi đo trên danh sách viết tay, đường đọc pg_database và xoá DB mồ côi không được chạy**
  Người dùng thấy gì: Bước tự dọn các DB tạm bị bỏ lại từ lượt trước chưa được kiểm thử đầu-cuối. Nếu nó hỏng, DB tạm thừa tích dần trên máy.
  Căn cứ: Mức nhẹ, chỉ tốn chỗ chứa, người dùng tự xoá được bằng tay.
  file: `scripts/suite-neu-doi.test.mjs`
  severity: low
  Đề xuất: known-limits

- **E3/E4/E5 khai executor: script nhưng lệnh đặt ở executors.test, lệch cách đặt lệnh của cả kho (r3 · tệp đã đổi)**
  Người dùng thấy gì: Ba lệnh kiểm được xếp nhầm nhóm trong tệp cấu hình, nhưng vẫn chạy đúng. Người dùng không thấy khác biệt nào.
  Căn cứ: Chỉ là chuyện xếp gọn, không ảnh hưởng kết quả hay dữ liệu; sửa sau cũng rẻ nhưng không đáng mở việc.
  file: `_acceptance/config.yaml`
  severity: low
  Đề xuất: wont-fix

- **tai-hien.sh bỏ qua lỗi của dung-worktree-cham.sh nên báo đỏ sai lý do (r3)**
  Người dùng thấy gì: Khi môi trường kiểm tra hỏng, phép kiểm có thể báo kết quả sai lý do mà người xem không nhận ra ngay. Sản phẩm cho người dùng không bị ảnh hưởng.
  Căn cứ: Chỉ làm giảm độ tin cậy của bằng chứng nội bộ, không mất dữ liệu; người ký có thể chạy lại để thấy rõ.
  file: `_acceptance/suite-scripts-vao-luot-cham/probes/tai-hien.sh`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 2 — fixture viết tay đúng khuôn bên đọc: lượt đỏ dài của boTongKet/tomTatScripts không được đo khứ hồi (r3 · tệp đã đổi)**
  Người dùng thấy gì: Phép kiểm chưa thử với đầu ra dài thật của một lượt đỏ, nên nếu định dạng khác dự kiến thì sổ ghi có thể thiếu số ca mà test vẫn xanh.
  Căn cứ: Chỉ ảnh hưởng độ tin cậy của sổ kiểm nội bộ, không ảnh hưởng người dùng; chạy lại là thấy ngay.
  file: `scripts/suite-neu-doi.test.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 5 — tuyên quét mọi phần tử job CI nhưng phanTu chỉ liệt kê một phần (r3 · tệp đã đổi)**
  Người dùng thấy gì: Nếu ai đó đổi một số thiết lập nhỏ của quy trình kiểm tự động, lệnh chạy thử cục bộ có thể không phát hiện sự lệch. Người dùng cuối không thấy ảnh hưởng.
  Căn cứ: Chỉ làm lệnh chạy thử tại máy lệch khỏi CI ở vài chi tiết hiếm; CI thật vẫn bắt được, nên hậu quả nhẹ.
  file: `scripts/suite-neu-doi.test.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 4 — tái hiện đỏ chỉ khẳng định «ca nằm trong danh sách đỏ», không có đối chứng dương trong cùng môi trường (r3)**
  Người dùng thấy gì: Phép tái hiện lỗi cũ chưa có đối chứng chứng minh ca đỏ do đúng lỗi chứ không do môi trường. Người dùng cuối không bị ảnh hưởng.
  Căn cứ: Chỉ giảm độ chắc của bằng chứng nội bộ; số đo thật ở vòng trước đã thấy đúng ca đỏ nên rủi ro thấp.
  file: `_acceptance/suite-scripts-vao-luot-cham/probes/tai-hien.sh`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 3 — E5 hứa «dòng tóm tắt có "fail":0» nhưng chỉ đo mã thoát (r3 · tệp đã đổi)**
  Người dùng thấy gì: Phép kiểm cây xanh chỉ nhìn kết quả chạy, chưa soi số ca hỏng ghi trong dòng tóm tắt. Người dùng cuối không bị ảnh hưởng.
  Căn cứ: Mã thoát 0 đã gần như bảo đảm không có ca hỏng; thiếu sót chỉ là chưa đối chiếu thêm một con số.
  file: `_acceptance/config.yaml`
  severity: low
  Đề xuất: known-limits

## Chưa adversarial-verify (refuter chết)

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).

