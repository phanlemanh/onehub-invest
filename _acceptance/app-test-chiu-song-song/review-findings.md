## Trong hợp đồng

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Hình dạng 4 (âm-tính-một-mình, không ghim thông điệp): đối chứng DP-AC-5 «bản đầy đủ phải lỗi» lỗi vì thiếu bảng, không phải vì đã xoá cột PII**
  Người dùng thấy gì: Phép thử xác nhận bản đầy đủ của truy vấn cloud bị lỗi, nhưng nó lỗi vì bảng không còn chứ chưa chắc vì cột nhạy cảm đã bị xoá. Nếu bước xoá cột hỏng thì phép thử vẫn xanh, nên có thể lọt một lỗi lộ cột.
  Căn cứ: Ảnh hưởng nhẹ vì chỉ làm phép thử kém nhạy, không làm sai dữ liệu của người dùng, và các phép kiểm khác vẫn bảo vệ phần cloud.
  file: `app/tests/deals-phi-ly.test.tsx`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 5 (tuyên quét LỚP nhưng bộ rút bỏ sót một phần lớp): E3 so «đa tập thông điệp DP/DQ» nhưng bỏ mọi thông điệp template có ${}**
  Người dùng thấy gì: Phép kiểm xem thông điệp của các ca test có bị đổi hay không bỏ sót những câu có chèn biến. Ai đó sửa hoặc xoá các câu này thì bước nghiệm thu không báo.
  Căn cứ: Hậu quả nhẹ: chỉ là khe hở trong công cụ kiểm của nhóm phát triển, không chạm người dùng cuối, và sửa lại sau cũng rẻ.
  file: `_acceptance/app-test-chiu-song-song/probes/song-song.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 1 (đo bản dựng lại / chỉ dẫn thay vì đầu ra của tệp): E2 'khoa' không chạy ba tệp test mà dựng lại phần việc bằng regex và câu viết tay**
  Người dùng thấy gì: Phép đo khoá chạy trên bản mô phỏng phần việc của ba tệp test chứ không chạy chính các tệp ấy. Nếu tệp thật sau này xin khoá mạnh trên bảng dùng chung, phép đo này không thấy.
  Căn cứ: Hậu quả nhẹ với người dùng vì chỉ ảnh hưởng độ chắc của kiểm chứng nội bộ, và phép đo chạy cả ba tệp thật ở AC-1 vẫn bắt phần lớn rủi ro.
  file: `_acceptance/app-test-chiu-song-song/probes/song-song.mjs`
  severity: medium
  Đề xuất: known-limits

- **chepBang lỗi với cột GENERATED: pg_get_expr(adbin, 0) ném 'expression contains variables' (r1)**
  Người dùng thấy gì: Công cụ dựng bản chép tạm cho test sẽ báo lỗi nếu bảng có cột tính tự động. Hiện chưa test nào dùng bảng như vậy nên không ảnh hưởng người dùng, chỉ vướng khi mở rộng sang test khác.
  Căn cứ: Không ảnh hưởng dữ liệu hay người dùng cuối, lỗi hiện rõ ngay khi gặp nên không bị bỏ sót, và chỉ cần xử lý khi thật sự chuyển thêm test sang dùng.
  file: `pipeline/lib/luoc-do-rieng.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 2 (dựng lại theo khuôn bên đọc): E2 đo khoá trên phần việc probe tự viết, không chạy câu thật của ba tệp test (r1)**
  Người dùng thấy gì: Phép đo khoá dùng bản mô phỏng việc của test chứ không chạy đúng từng câu thật. Nếu sau này ai thêm một câu gọi thẳng vào dữ liệu dùng chung thì phép đo có thể không phát hiện.
  Căn cứ: Hiện chưa có câu nào như vậy, hậu quả chỉ là test có thể chậm lại chứ không mất dữ liệu, và có thể bổ sung phép đo sau mà không ảnh hưởng người dùng.
  file: `_acceptance/app-test-chiu-song-song/probes/song-song.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 4 (âm tính đứng một mình): «hai phiên không chờ nhau» không có đối chứng dương (r1)**
  Người dùng thấy gì: Kiểm tra hai phiên dựng song song không chờ nhau chưa được chứng minh là thật sự bắt được trường hợp chờ. Nếu có hồi quy tinh vi, test có thể vẫn xanh.
  Căn cứ: Chỉ làm test kém nhạy hơn, không ảnh hưởng người dùng hay dữ liệu, và phần chính đã có kiểm tra bằng bản đột biến khác.
  file: `pipeline/scripts/luoc-do-rieng.test.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 3 (đo cái có mặt thay vì quan hệ): «đủ ràng buộc» chỉ so số lượng theo contype (r1)**
  Người dùng thấy gì: Test chỉ so số lượng ràng buộc và chỉ mục của bản chép, chưa so nội dung từng cái. Một ràng buộc chép sai nội dung vẫn có thể qua mặt test.
  Căn cứ: Bản chép chỉ dùng trong test, không chạm dữ liệu thật, nên sai lệch nếu có chỉ làm test kém chặt; sửa sau không tốn nhiều.
  file: `pipeline/scripts/luoc-do-rieng.test.mjs`
  severity: low
  Đề xuất: known-limits

## Chưa adversarial-verify (refuter chết)

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
