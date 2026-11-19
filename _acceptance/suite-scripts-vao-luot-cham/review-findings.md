## Trong hợp đồng

- **Tín hiệu đến trước khi cài trình xử lý thì lượt thoát mà không có dòng scripts-ci, trái lời «luôn để lại dòng kết quả» của AC-2**
  AC: AC-2
  file: `scripts/suite-neu-doi.mjs:240`
  severity: low
  source: conventions
  detail: Ba trình xử lý SIGHUP, SIGINT, SIGTERM chỉ được cài ở `ngat("SIGHUP", 1); ngat("SIGINT", 2); ngat("SIGTERM", 15);`. Lời cài nằm SAU `git rev-parse HEAD`, `git status --porcelain -z` và `buocSuite(root)` (gồm createRequire js-yaml rồi parse ci-test.yml), trong khi hàm `ket` đã sẵn sàng từ trước đó. Tín hiệu đến trong khoảng này đi theo hành vi mặc định của Node: tiến trình chết ngay, không in dòng JSON `scripts-ci` ra stdout và không nối run-log, dù `--ho-so` đã qua kiểm. Commit 8cfb13ffd («lượt scripts-ci luôn để lại dòng kết quả») và expected của E2 («sau SIGTERM/SIGINT … stdout thật có dòng cuối scripts-ci») đều tuyên bố mọi đường ra sau khi hồ sơ hợp lệ phải để lại dòng, nên đây đúng là kiểu lỗi mà vòng này định sửa: luật gộp đọc dòng mới nhất, lượt bị ngắt không để dấu thì dòng xanh cũ vẫn thắng. Cửa sổ lỗi chỉ cỡ vài chục ms nên mức nhẹ. Cách sửa: cài trình xử lý ngay sau khi `ket` được định nghĩa, trước khi đọc trạng thái cây. Khi đó trình xử lý đặt `maNgat`, và các đường ra sớm (cây bẩn, buocSuite lỗi) phải trả `ket(maNgat || 2)`.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Cây bẩn được miễn cho mọi tệp trong _acceptance/, nhưng bộ scripts đọc chính những tệp ấy, nên dòng scripts-ci gắn sha HEAD cho một cây khác cây đã chạy**
  Người dùng thấy gì: Sau khi sửa cấu hình nghiệm thu mà chưa chạy lại, lệnh chạy khô vẫn có thể báo xanh cho một bản khác bản đã chạy. Người ký có thể tin nhầm là bộ test đã đạt trên bản cuối.
  Căn cứ: Chỉ lệch khi có sửa tay đúng vào vài tệp cấu hình nghiệm thu, người dùng cuối không thấy, và chạy lại lệnh là gỡ được; sửa thì phải đổi luật gộp nên đáng bàn riêng.
  file: `scripts/suite-neu-doi.mjs`
  severity: medium
  Đề xuất: known-limits

- **DB mồ côi trùng pid của chính lượt hiện tại không được xoá, nên createdb thất bại và lệnh thoát 2**
  Người dùng thấy gì: Rất hiếm khi, một lượt chạy thử bị chết đột ngột có thể làm lượt kế tiếp báo lỗi dựng cơ sở dữ liệu dù không có gì hỏng thật. Chạy lại lệnh là qua.
  Căn cứ: Cần trùng số tiến trình sau một lượt chết đột ngột nên gần như không xảy ra, không mất dữ liệu, và chạy lại là tự hết.
  file: `scripts/suite-neu-doi.mjs`
  severity: low
  Đề xuất: wont-fix

- **Hình dạng 1 (đo chỉ dẫn/môi trường của bên đo thay vì đầu ra): bản chính Node đo trên tiến trình chạy test, không đo trên Node mà các bước của lệnh dùng**
  Người dùng thấy gì: Bước kiểm bản Node có thể báo khớp trong khi bộ test thật chạy trên một bản Node khác, nên một lệch phiên bản có thể lọt qua cổng chạy khô.
  Căn cứ: Chỉ lệch khi máy có nhiều bản Node, hậu quả là một lần đỏ lạ ở CI chứ không mất dữ liệu, và dễ thấy ngay khi đó.
  file: `scripts/suite-neu-doi.test.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 5 (tuyên quét LỚP nhưng bộ liệt kê chỉ bốc một phần): phanTu không liệt kê env, working-directory, if hay continue-on-error ở cấp bước**
  Người dùng thấy gì: Nếu CI đổi cách chạy một bước theo kiểu không nằm trong danh sách theo dõi, lệnh chạy khô sẽ không phát hiện và có thể lệch với CI.
  Căn cứ: Lệch chỉ xuất hiện khi ai đó sửa file CI theo kiểu hiếm, hậu quả là một lần đỏ ở CI và thêm phần tử theo dõi sau này rẻ.
  file: `scripts/suite-neu-doi.test.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 4 (assert âm tính một mình): lượt đỏ đọc lại ra.json cũ của lượt xanh để kết luận DB đã bị xoá**
  Người dùng thấy gì: Phép kiểm việc dọn cơ sở dữ liệu sau lượt đỏ có thể xanh dù lượt đỏ chưa dựng được DB, nên một lỗi dọn rác về sau có thể không bị bắt.
  Căn cứ: Chỉ làm bài test yếu đi, không ảnh hưởng người dùng, và việc dọn DB hiện vẫn đúng.
  file: `scripts/suite-neu-doi.test.mjs`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 3 (assert thuộc tính riêng lẻ khi lời hứa là quan hệ): lượt đỏ không ghim exit trong dòng scripts-ci bằng mã thoát thật**
  Người dùng thấy gì: Nếu dòng tóm tắt ghi sai kết quả so với kết quả thật của lệnh, bài test hiện tại có thể không phát hiện, và luật gộp có thể đọc sai.
  Căn cứ: Hiện chưa thấy lệch thật, hậu quả chỉ xảy ra nếu code đổi về sau, và thêm một phép so sánh là rẻ.
  file: `scripts/suite-neu-doi.test.mjs`
  severity: low
  Đề xuất: known-limits

- **Dòng scripts-ci ghi sha không phải cây đã chạy test: đọc HEAD sau khi chạy xong và bỏ qua cây bẩn (r4 · tệp đã đổi)**
  Người dùng thấy gì: Nếu có commit mới hoặc sửa chưa commit trong lúc chạy kiểm tra, kết quả xanh có thể bị ghi cho một bản mã chưa hề được kiểm. Người gộp có thể tin nhầm là bản đó đã qua kiểm.
  Căn cứ: Chỉ xảy ra khi người chạy sửa mã giữa lượt, CI thật vẫn chặn sau đó và chạy lại là thấy, nên hậu quả nhẹ, không mất dữ liệu.
  file: `scripts/suite-neu-doi.mjs`
  severity: high
  Đề xuất: known-limits

- **Hình dạng 2 — ca «đọc pipe theo byte» tự dựng bộ đọc trong test, không đi qua đường đọc thật của mainScripts (r4 · tệp đã đổi)**
  Người dùng thấy gì: Nếu lỗi mất số ca khi đầu ra bị cắt giữa ký tự quay lại, bộ kiểm hiện tại có thể không báo đỏ. Người dùng sẽ thấy số ca sai trong dòng tóm tắt mà không có cảnh báo.
  Căn cứ: Lỗi đã được sửa và chỉ làm sai con số tóm tắt, không mất dữ liệu; thêm phép đo thật có thể làm sau mà không gấp.
  file: `scripts/suite-neu-doi.test.mjs`
  severity: high
  Đề xuất: known-limits

- **Hình dạng 4 — E6 chạy --test-name-pattern=S4V-AC-6 trần: không ca nào khớp vẫn thoát 0, không có đối chứng dương (r4)**
  Người dùng thấy gì: Nếu sau này ca kiểm cấu hình bị đổi tên hay xoá, bước kiểm vẫn báo xanh dù không kiểm gì. Cấu hình lượt chấm có thể bị đổi mà không ai hay.
  Căn cứ: Chưa có lỗi thật hôm nay, chỉ là lưới an toàn mỏng đi khi có người sửa tên ca; dễ phát hiện và sửa sau.
  file: `_acceptance/config.yaml`
  severity: high
  Đề xuất: known-limits

- **Hình dạng 5 — ma trận dọn DB thiếu ô «lượt đỏ»: chỉ đo sau lượt xanh và sau SIGTERM (r4 · tệp đã đổi)**
  Người dùng thấy gì: Nếu lượt kiểm đỏ làm rò cơ sở dữ liệu tạm, bộ kiểm không phát hiện. Các DB tạm thừa có thể tích lại trên máy.
  Căn cứ: Chỉ tốn chỗ trên máy, không mất dữ liệu thật, và lượt sau có bước dọn DB mồ côi.
  file: `scripts/suite-neu-doi.test.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 1 — đo hằng SHELL_CI thay vì shell mà bước CI thực sự chạy (r4 · tệp đã đổi)**
  Người dùng thấy gì: Nếu ai đó đổi cách chạy các bước, lệnh cục bộ có thể chạy tiếp khi CI đã dừng. Kết quả cục bộ có thể xanh trong khi CI đỏ.
  Căn cứ: Chỉ là khe hở kiểm thử, hiện chưa gây sai; nếu xảy ra, CI thật vẫn chặn nên người dùng không bị ảnh hưởng.
  file: `scripts/suite-neu-doi.test.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 3 — «danh sách ca bị bỏ bằng ci-bo-qua.json» chỉ so chuỗi NODE_OPTIONS với chính bộ sinh ra nó (r4 · tệp đã đổi)**
  Người dùng thấy gì: Nếu bộ sinh danh sách ca bỏ qua làm rơi mục, bộ kiểm vẫn báo xanh. Có thể chạy nhầm các ca cần dữ liệu thật và đỏ giả.
  Căn cứ: Hậu quả chỉ là báo đỏ giả hoặc xanh giả ở lượt kiểm cục bộ, chạy lại là thấy, không ảnh hưởng dữ liệu.
  file: `scripts/suite-neu-doi.test.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 2 — dbMoCoi đo trên danh sách viết tay, đường đọc pg_database và xoá DB mồ côi không được chạy (r4 · tệp đã đổi)**
  Người dùng thấy gì: Bước tự dọn các DB tạm bị bỏ lại từ lượt trước chưa được kiểm thử đầu-cuối. Nếu nó hỏng, DB tạm thừa tích dần trên máy.
  Căn cứ: Mức nhẹ, chỉ tốn chỗ chứa, người dùng tự xoá được bằng tay.
  file: `scripts/suite-neu-doi.test.mjs`
  severity: low
  Đề xuất: known-limits

- **E3/E4/E5 khai executor: script nhưng lệnh đặt ở executors.test, lệch cách đặt lệnh của cả kho (r3)**
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

- **Hình dạng 3 — E5 hứa «dòng tóm tắt có "fail":0» nhưng chỉ đo mã thoát (r3)**
  Người dùng thấy gì: Phép kiểm cây xanh chỉ nhìn kết quả chạy, chưa soi số ca hỏng ghi trong dòng tóm tắt. Người dùng cuối không bị ảnh hưởng.
  Căn cứ: Mã thoát 0 đã gần như bảo đảm không có ca hỏng; thiếu sót chỉ là chưa đối chiếu thêm một con số.
  file: `_acceptance/config.yaml`
  severity: low
  Đề xuất: known-limits

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).

