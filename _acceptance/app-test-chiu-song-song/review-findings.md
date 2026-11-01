# Review findings: app-test-chiu-song-song (round 3)

## Trong hợp đồng

Không có finding.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

Không có finding mới ở round này. Bốn mục ngoài hợp đồng từ round trước được máy tự chèn, mang nhãn (r<N>).

Lưu ý ngoài finding: lệnh suite `cd agent && npm test` đỏ ở test KD-AC-7 (agent/tests/judge-entity-khong-dau.test.ts), không gắn eval nào. Đây là lý do verdict REJECT.

- **chepBang lỗi với cột GENERATED: pg_get_expr(adbin, 0) ném 'expression contains variables' (r1)**
  Người dùng thấy gì: Công cụ dựng bản chép tạm cho test sẽ báo lỗi nếu bảng có cột tính tự động. Hiện chưa test nào dùng bảng như vậy nên không ảnh hưởng người dùng, chỉ vướng khi mở rộng sang test khác.
  Căn cứ: Không ảnh hưởng dữ liệu hay người dùng cuối, lỗi hiện rõ ngay khi gặp nên không bị bỏ sót, và chỉ cần xử lý khi thật sự chuyển thêm test sang dùng.
  file: `pipeline/lib/luoc-do-rieng.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 2 (dựng lại theo khuôn bên đọc): E2 đo khoá trên phần việc probe tự viết, không chạy câu thật của ba tệp test (r1 · tệp đã đổi)**
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

Không có.

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
