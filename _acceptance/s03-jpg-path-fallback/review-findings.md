## Trong hợp đồng

- **Assert chuỗi có mặt trong khi lời hứa là quan hệ (hình dạng 3): ca 2511-3 không kiểm đuôi .jpg suy theo byte, khác header image/jxl**
  AC: AC-4
  file: `collector/src/test/media-fetch.test.ts:401`
  severity: medium
  source: measurement
  detail: E4 của _acceptance/s03-jpg-path-fallback/evals.yaml hứa: «ca 2511-3: CDN giả trả header image/jxl với byte JPEG_A → tệp đuôi .jpg (đoán theo byte, không theo header)». Ca 2511-3 chỉ kiểm tiền tố `mf.file.startsWith(\`media/${bam(...)}.\`)` và độ dài byte, không assert đuôi nào. Nếu mã đặt đuôi theo content-type (.jxl) thì ca vẫn xanh. Ca ZC15 về JPEG XL chỉ phủ trường hợp byte JPEG đi với header image/jpeg. Bộ sinh round-trip sinh-dong-that.mjs (dòng 33) cũng luôn trả content-type image/jpeg, trái với chú thích dòng 9 («header image/jxl như CDN thật»). Vì vậy quan hệ «đuôi theo byte chứ không theo header» không được đo ở đâu. AC-4 đòi byte JPEG ra .jpg bất kể content-type, nhưng ca test không assert đuôi nên AC chưa được chứng minh.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Phần expected của E8 trong evals.yaml lệch với chuỗi kiem.sh thật sự kiểm**
  Người dùng thấy gì: Mô tả kỳ vọng trong hồ sơ nghiệm thu còn ghi theo tiêu chí cũ, nên người chấm đối chiếu có thể thấy chữ lệch dù kết quả kiểm vẫn đúng. Người dùng cuối không bị ảnh hưởng.
  Căn cứ: Chỉ lệch chữ trong tài liệu nghiệm thu, không đổi hành vi hay dữ liệu, sửa lại sau rất rẻ.
  file: `_acceptance/s03-jpg-path-fallback/evals.yaml`
  severity: medium
  Đề xuất: known-limits

- **E8 so với ZC15 qua một nhánh chỉ có ở máy này, sẽ gãy trên máy khác hoặc sau khi ZC15 gộp**
  Người dùng thấy gì: Bước so sánh với bản trước chỉ chạy được trên máy này; ở máy khác nó sẽ báo đỏ vì thiếu nhánh chứ không phải vì ảnh tải sai. Ảnh của người dùng không bị ảnh hưởng.
  Căn cứ: Chỉ làm bước kiểm báo đỏ giả ở môi trường khác, không mất dữ liệu, chạy lại hay sửa tham chiếu là xong.
  file: `_acceptance/s03-jpg-path-fallback/ap-may-thu/kiem.sh`
  severity: medium
  Đề xuất: known-limits

- **Tên tệp media giờ băm theo URL đã tải, nhưng DATA-CONTRACT vẫn ghi «tên = sha256(URL)» và gate lại cấm sửa văn bản này**
  Người dùng thấy gì: Tài liệu giao diện giữa bộ thu và đường ống mô tả cách đặt tên tệp ảnh chưa khớp cho ảnh tải lại. Hiện chưa có chỗ nào đọc ngược tên nên người dùng không thấy lỗi.
  Căn cứ: Chỉ là tài liệu mô tả lệch ở một ca hẹp, chưa có bên nào dựa vào, sửa sau bằng một hàng riêng vẫn rẻ.
  file: `collector/src/core/media-fetch.ts`
  severity: low
  Đề xuất: known-limits

- **parseHostSuffixes vẫn nhận hậu tố công cộng hai nhãn như 'com.vn'**
  Người dùng thấy gì: Nếu người vận hành tự ghi một đuôi miền quá rộng vào cấu hình máy thu, bộ tải sẽ cho tải ảnh từ mọi trang thuộc đuôi đó. Chỉ xảy ra khi cấu hình sai.
  Căn cứ: Chỉ người vận hành máy thu mới chạm được cấu hình này nên rủi ro thấp, và sửa sau rẻ.
  file: `collector/src/core/media-fetch.ts`
  severity: low
  Đề xuất: known-limits

- **Đọc tệp hậu tố host ảnh nuốt mọi lỗi, không riêng ENOENT**
  Người dùng thấy gì: Nếu tệp cấu hình danh sách host ảnh có mà đọc lỗi, máy thu chạy tiếp mà không báo, một số ảnh sẽ lại bị bỏ như cũ. Người dùng chỉ thấy ảnh thiếu, không có cảnh báo.
  Căn cứ: Hiếm xảy ra, không mất dữ liệu gốc và thu lại được, nhưng khó phát hiện nên nên ghi nhận.
  file: `collector/src/api/server.ts`
  severity: low
  Đề xuất: known-limits

- **Assertion âm tính không có thông điệp ghim thật (hình dạng 4): đột biến thu-moi-loi ghim chuỗi trùng tên test**
  Người dùng thấy gì: Phép tự thử cho trường hợp thử lại sai chỗ chỉ chứng minh có ca đỏ chứ chưa chắc đúng ca. Hành vi tải ảnh của người dùng không đổi.
  Căn cứ: Chỉ làm bằng chứng nghiệm thu yếu hơn, không ảnh hưởng người dùng, sửa sau rẻ.
  file: `_acceptance/s03-jpg-path-fallback/probes/tu-thu.sh`
  severity: medium
  Đề xuất: known-limits

- **Assertion âm tính một mình (hình dạng 4): phép soát rò tên host trên mẫu canh-gac không có đối chứng dương**
  Người dùng thấy gì: Phép soát không lộ tên host có thể báo xanh dù bộ kiểm hỏng. Hiện bộ kiểm không in địa chỉ nên người dùng không bị lộ gì.
  Căn cứ: Chỉ làm phép soát kém chắc chắn, chưa có lộ thật, sửa sau rẻ.
  file: `_acceptance/s03-jpg-path-fallback/ap-may-thu/kiem.sh`
  severity: medium
  Đề xuất: known-limits

- **Đo chỉ dẫn thay vì đầu ra (hình dạng 1): ca ZC9 chỉ regex trên mã nguồn, trong khi E1 hứa có file và sha256 qua server thật**
  Người dùng thấy gì: Kiểm thử cho việc cho phép tải ảnh từ một host mới mới chỉ đọc chữ trong mã, chưa chạy tải thật đầu cuối. Nếu cấu hình hỏng, ảnh từ host đó có thể lại bị bỏ.
  Căn cứ: Hành vi hiện đúng, chỉ là bằng chứng kiểm thử yếu; nếu hỏng thì thu lại được, sửa sau rẻ.
  file: `collector/src/test/media-fetch.test.ts`
  severity: medium
  Đề xuất: known-limits

⚠ Cụm ngoài vùng phủ: 2/9 lỗi rơi vào file không bộ đo nào phủ (_acceptance/s03-jpg-path-fallback/evals.yaml, _acceptance/s03-jpg-path-fallback/probes/tu-thu.sh) — dừng và quyết: mở rộng hợp đồng hay rút phạm vi.
