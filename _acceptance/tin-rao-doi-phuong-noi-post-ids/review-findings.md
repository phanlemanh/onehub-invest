# Review findings: tin-rao-doi-phuong-noi-post-ids (round 1)

## Trong hợp đồng

- **Hình dạng 4 — assertion âm tính một mình: chiều đỏ «thước cũ nối theo offer_id không thấy» không có đối chứng dương trên chính hai lần chụp của nó**
  file: `scripts/lib/doi-phuong.test.mjs:89`
  severity: medium
  source: measurement
  AC: AC-2
  detail: Test 'DP-AC-2 thước cũ nối theo offer_id không thấy' (dòng 86-91) chạy quaHaiLuot trong một transaction RIÊNG, rồi chỉ assert `assert.deepEqual(lechCu(c1, c2), [])`. Trong test này không có assert nào xác nhận ở c1 tin của bài mồi đã mang MOI.area (hop_le = true), cũng không có assert nào xác nhận offer_id của tin mồi trong c1 đã biến mất khỏi c2 (tức là mã tin thật sự đổi). Assert dương duy nhất cho mồi (`t?.area_id === MOI.area`, dòng 77-78) nằm ở test kia, chạy trên transaction và hai lần chụp khác. Nếu mồi không gắn được phường, hoặc tin mồi rơi khỏi sale_offers vì một lý do khác, thì lechCu vẫn trả [] (vì nó lọc `o.hop_le && sau.has(o.offer_id)`), và chiều đỏ vẫn xanh mà không chứng minh gì. Contract AC-2 yêu cầu chiều đỏ chạy «trên cùng hai lần chụp», nhưng code dựng một cặp chụp mới, nên mảng rỗng của lechCu không được ghim vào chuyện «mã tin đổi» như lời hứa. Thông điệp lỗi cũng chỉ kêu «đối chứng sai» khi thước cũ tìm THẤY lệch, còn ca chiều đỏ xanh một cách rỗng thì không bị bắt.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Test mới đặt ở scripts/lib/ nên nằm ngoài glob test của scripts/ (CI và executors.test.scripts không chạy)**
  Người dùng thấy gì: Phép kiểm tra «không tin rao nào mất hay đổi phường» chạy được khi có người nghiệm thu, nhưng không tự chạy mỗi lần có thay đổi mới. Nếu sau này thước đo này hỏng thì sẽ không có gì chặn lại trước khi nhập vào bản chính.
  Căn cứ: Không làm mất dữ liệu hay sai số cho người dùng ngay lúc này, chỉ làm mất một lớp chặn tự động về sau; sửa lại sau cũng rẻ và không để lại hậu quả.
  file: `scripts/lib/doi-phuong.test.mjs`
  severity: medium
  Đề xuất: known-limits

- **evals.yaml E2/E3 khai `paths` thiếu các transform mà lệnh đo thật sự chạy, lệch mẫu của hàng trước**
  Người dùng thấy gì: Sau này nếu có người sửa các bước xử lý tin rao, kết quả đo cũ vẫn có thể bị coi là còn hiệu lực dù đã lỗi thời. Người dùng không thấy ngay, nhưng có thể tin vào một kết quả nghiệm thu đã cũ.
  Căn cứ: Chỉ ảnh hưởng độ tin cậy của bằng chứng nghiệm thu về sau, không đụng dữ liệu của người dùng; đọc lại hay chạy lại bằng chứng là xử lý được, và sửa danh sách rất rẻ.
  file: `_acceptance/tin-rao-doi-phuong-noi-post-ids/evals.yaml`
  severity: medium
  Đề xuất: known-limits

- **Chú thích executor và evals ghi AC-2 chỉ «mồi qua runTransformFb», trong khi test chạy cả S03 qua runTransformZalo**
  Người dùng thấy gì: Một dòng ghi chú trong cấu hình nghiệm thu mô tả thiếu: nói chỉ kiểm một nguồn trong khi thực tế kiểm hai nguồn. Người dùng sản phẩm không bị ảnh hưởng.
  Căn cứ: Chỉ là chữ ghi chú nội bộ, không ảnh hưởng dữ liệu hay kết quả đo nào; chấp nhận để nguyên, không đáng mở việc.
  file: `_acceptance/config.yaml`
  severity: low
  Đề xuất: wont-fix

- **Chặn «nối hỏng» dựa trên giả định sai: chụp 0 không được tính từ stg hiện tại, nên có thể báo FAIL sai**
  Người dùng thấy gì: Phép đo có thể báo đỏ nhầm là «nối hỏng» khi dữ liệu thu về mới được nạp mà chưa xử lý lại. Người nghiệm thu sẽ thấy một cảnh báo sai và phải chạy lại hoặc điều tra, nhưng không có tin rao nào bị mất hay sai.
  Căn cứ: Lỗi ồn ào chứ không im lặng, không làm mất hay sai dữ liệu người dùng, và chạy lại sau khi xử lý xong là hết; chỉ gây tốn công kiểm tra.
  file: `scripts/kiem-tin-rao-gan-khu-vuc.mjs`
  severity: low
  Đề xuất: known-limits

⚠ Cụm ngoài vùng phủ: 2/5 lỗi rơi vào file không bộ đo nào phủ (_acceptance/tin-rao-doi-phuong-noi-post-ids/evals.yaml, _acceptance/config.yaml) — dừng và quyết: mở rộng hợp đồng hay rút phạm vi.
