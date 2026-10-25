## Trong hợp đồng

(không có)

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **evals.yaml E3/E6 trỏ paths vào tệp không tồn tại scripts/ci-db-init.sh (tệp thật là .mjs); E4/E6 thiếu scripts/ci-bo-qua.json**
  Người dùng thấy gì: Khi sau này có người sửa bước dựng cơ sở dữ liệu hoặc danh sách ca bỏ qua của CI, hồ sơ nghiệm thu cũ vẫn trông như còn hiệu lực dù chưa được kiểm lại. Người dùng cuối không bị ảnh hưởng, chỉ có nguy cơ tin nhầm vào bằng chứng đã cũ.
  Căn cứ: Nhẹ với người dùng vì chỉ ảnh hưởng độ tin cậy của hồ sơ nghiệm thu nội bộ, không mất dữ liệu; sửa lúc nào cũng được bằng một chỉnh sửa nhỏ nên ghi lại là hạn chế đã biết.
  file: `_acceptance/ci-test-module/evals.yaml`
  severity: medium
  Đề xuất: known-limits

- **qwenParams.maxTokens bị AI SDK 7 lặng lẽ bỏ qua: đợt chuyển sang API ai 7 còn sót**
  Người dùng thấy gì: Trợ lý AI có thể trả lời dài quá hoặc bị cắt giữa chừng vì giới hạn độ dài câu trả lời không được gửi đi, và không có thông báo lỗi nào. Người dùng chỉ thấy câu trả lời cụt hoặc lạ, khó hiểu nguyên nhân.
  Căn cứ: Hậu quả vừa: không mất dữ liệu, người dùng thử lại được, nhưng lỗi im lặng khó phát hiện; sửa rẻ nhưng thuộc phần trợ lý AI chứ không thuộc CI nên nên mở việc riêng.
  file: `agent/src/runtime/models.ts`
  severity: medium
  Đề xuất: new-contract

- **Mã thoát của helper ci-can-du-lieu bị bash nuốt: rào «danh sách cũ / ca cấm → thoát 1» không bao giờ làm bước CI đỏ**
  Người dùng thấy gì: Nếu danh sách ca bỏ qua của CI bị lỗi thời, CI vẫn chạy tiếp mà không báo đỏ, nên người duyệt có thể thấy xanh trong khi danh sách đã sai. Hậu quả là cảnh báo cần có không bao giờ xuất hiện.
  Căn cứ: Hậu quả vừa: không mất dữ liệu người dùng và chỉ xảy ra khi danh sách bị cũ, nhưng làm yếu một hàng rào đã hứa; sửa rẻ nên nên làm thành việc riêng ngay sau vòng này.
  file: `.github/workflows/ci-test.yml`
  severity: medium
  Đề xuất: new-contract

- **qwenParams.maxTokens bị AI SDK 7 bỏ qua trong im lặng: giới hạn token của MTPLX không được gửi đi**
  Người dùng thấy gì: Trợ lý AI có thể trả lời dài quá hoặc bị cắt giữa chừng vì giới hạn độ dài câu trả lời không được gửi đi, và không có thông báo lỗi nào. Người dùng chỉ thấy câu trả lời cụt hoặc lạ.
  Căn cứ: Hậu quả vừa: không mất dữ liệu, thử lại được, nhưng lỗi im lặng; sửa rẻ, gộp cùng việc với phát hiện trùng về giới hạn token của trợ lý AI.
  file: `agent/src/runtime/models.ts`
  severity: medium
  Đề xuất: new-contract

- **Migration đã khai lỗi (031) chấp nhận mọi lỗi; thông điệp đã khai không bao giờ được so, lỗi mới ở các câu sau bị nuốt**
  Người dùng thấy gì: Cơ sở dữ liệu dựng cho CI có thể thiếu một số đối tượng mà không ai hay biết, nên vài bài kiểm có thể chạy trên cấu trúc chưa đầy đủ. Người dùng cuối không thấy gì, chỉ có nguy cơ CI xanh giả ở phần cơ sở dữ liệu.
  Căn cứ: Nhẹ vì chỉ liên quan một tệp đã biết là lỗi và nằm ngoài phạm vi; không mất dữ liệu, sẽ tự lộ khi vá tệp đó nên ghi là hạn chế đã biết.
  file: `scripts/ci-db-init.mjs`
  severity: low
  Đề xuất: known-limits

- **paths của E3/E6 trỏ tới scripts/ci-db-init.sh không tồn tại (tệp thật là .mjs)**
  Người dùng thấy gì: Hồ sơ nghiệm thu không tự hết hạn khi bước dựng cơ sở dữ liệu của CI đổi, nên có thể tin nhầm vào bằng chứng cũ. Người dùng cuối không bị ảnh hưởng.
  Căn cứ: Nhẹ với người dùng vì chỉ là hồ sơ nội bộ, không mất dữ liệu, sửa một dòng bất cứ lúc nào nên ghi là hạn chế đã biết.
  file: `_acceptance/ci-test-module/evals.yaml`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 5 (tuyên quét LỚP nhưng chỉ có điểm-case): chiều đỏ của check-ci-test chỉ phủ 7/10 luật**
  Người dùng thấy gì: Bộ kiểm cấu hình CI chưa được thử với ba kiểu sai (chèn bước bỏ qua lỗi, thêm điều kiện, đổi tập kích hoạt), nên một thay đổi sai kiểu đó sau này có thể lọt mà không bị bắt. Người dùng cuối chưa bị ảnh hưởng.
  Căn cứ: Nhẹ vì các kiểu sai mà hợp đồng hứa bắt đã được thử; phần thiếu chỉ là độ phủ phụ, không mất dữ liệu, bổ sung sau rẻ.
  file: `scripts/check-ci-test.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 1 (đo CHỈ DẪN thay vì ĐẦU RA): «tập ca bỏ qua khớp» so số helper tự khai với chính độ dài danh sách**
  Người dùng thấy gì: Dòng báo các ca bỏ qua khớp danh sách có thể báo khớp dù bộ chạy test thực tế không lọc đúng, nên có thể cho cảm giác yên tâm chưa đủ vững. Người dùng cuối không thấy ảnh hưởng.
  Căn cứ: Nhẹ vì lỗi chỉ làm bằng chứng yếu đi chứ không làm hỏng sản phẩm; không mất dữ liệu, củng cố sau được nên ghi là hạn chế đã biết.
  file: `scripts/ci-test-local.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 4 (assertion âm-tính-một-mình): `vanChay` chỉ kiểm VẮNG dòng ✔/✖, không có đối chứng dương**
  Người dùng thấy gì: Phép kiểm xác nhận ca bị bỏ qua có thể báo đạt cả khi ca không chạy vì lý do khác, nên có khả năng báo đạt sai. Người dùng cuối không thấy ảnh hưởng.
  Căn cứ: Nhẹ vì chỉ làm yếu bằng chứng nội bộ, không mất dữ liệu; có thể bổ sung đối chứng sau với chi phí nhỏ.
  file: `scripts/ci-test-local.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 5 (tuyên quét LỚP nhưng chỉ có điểm-case): chiều đỏ của loiDanhSach chỉ thử 1/3 mẫu CAM và 2/4 nhánh lỗi**
  Người dùng thấy gì: Bộ kiểm cho danh sách ca bỏ qua mới thử một phần các kiểu sai, nên vài kiểu danh sách sai sau này có thể không bị phát hiện. Người dùng cuối không bị ảnh hưởng.
  Căn cứ: Nhẹ vì các kiểu sai chính đã được thử, không mất dữ liệu, bổ sung sau rẻ nên ghi là hạn chế đã biết.
  file: `scripts/ci-test-module.test.mjs`
  severity: low
  Đề xuất: known-limits

⚠ Cụm ngoài vùng phủ: 5/10 lỗi rơi vào file không bộ đo nào phủ (_acceptance/ci-test-module/evals.yaml, agent/src/runtime/models.ts, scripts/ci-db-init.mjs) — dừng và quyết: mở rộng hợp đồng hay rút phạm vi.

