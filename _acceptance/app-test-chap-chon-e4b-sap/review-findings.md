# Review findings: app-test-chap-chon-e4b-sap

## Trong hợp đồng

Không có finding nào map được vào AC.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **E2/E3 được khai vào feature_loop.model_evals dù không gọi model thật: dùng sai ngữ nghĩa khoá của kit**
  Người dùng thấy gì: Báo cáo cuối lượt chấm sẽ đếm hai ca đo thời gian này như ca gọi model thật, nên con số về ca model thật bị lệch. Kết quả chấm vẫn đúng.
  Căn cứ: Chỉ lệch một con số thống kê, không mất hay lộ dữ liệu; sửa đúng cách cần kit ra khoá mới nên không nên chữa tay bây giờ.
  file: `_acceptance/config.yaml`
  severity: medium
  Đề xuất: known-limits

- **E3 (CGT-DC) chạy quá 9 phút nhưng thiếu `long_running` trên eval**
  Người dùng thấy gì: Làn chấm không biết trước ca này chạy hơn 10 phút nên đôi khi có thể tính sai quỹ thời gian hoặc cắt sớm, buộc phải chấm lại.
  Căn cứ: Hậu quả nhẹ và tự khắc phục được bằng cách chấm lại; không ảnh hưởng người dùng cuối, sửa chỉ là thêm một dòng khai báo.
  file: `_acceptance/app-test-chap-chon-e4b-sap/evals.yaml`
  severity: low
  Đề xuất: known-limits

- **Chú thích nói «Năm lời đọc song song» nhưng mã chạy 8 lời**
  Người dùng thấy gì: Một dòng chú thích trong bài kiểm tra ghi sai số, có thể làm người đọc hiểu nhầm. Không ảnh hưởng kết quả hay người dùng.
  Căn cứ: Chỉ là chữ ghi chú sai, không có hậu quả với người dùng; sửa lúc nào cũng được nhưng không đáng mở việc riêng.
  file: `app/tests/anh-chup.test.tsx`
  severity: low
  Đề xuất: wont-fix

- **Snapshot pool: a single failed query poisons a worker client for the rest of the run, so thuLai retry and the 42P01 fallback both stop working**
  Người dùng thấy gì: Nếu một truy vấn lỗi giữa chừng khi đối chiếu, các lần đọc sau trên cùng kết nối cũng báo lỗi lạ, nên lượt chấm đỏ dây chuyền và khó thấy nguyên nhân gốc.
  Căn cứ: Chỉ làm bài kiểm tra đỏ sai lý do trong ca hiếm, không ảnh hưởng dữ liệu hay người dùng cuối; chấm lại là qua.
  file: `app/tests/helpers/anh-chup.ts`
  severity: medium
  Đề xuất: known-limits

- **giuAnhChup leaks connections if setup fails partway; the test process can hang until timeout**
  Người dùng thấy gì: Khi bước chuẩn bị đối chiếu hỏng giữa chừng, tiến trình kiểm tra có thể treo tới 20 phút thay vì báo lỗi ngay.
  Căn cứ: Chỉ làm chậm lượt chấm trong tình huống hiếm, tự hết sau hạn chờ và không đụng dữ liệu hay người dùng cuối.
  file: `app/tests/helpers/anh-chup.ts`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 5 — tuyên «mọi trần có tên» nhưng soTran chỉ khớp một danh sách cú pháp điểm-case, bỏ lọt trần số lượt `lan = 5` của thuLai**
  Người dùng thấy gì: Bộ kiểm không phát hiện nếu ai đó nâng số lần thử lại của ca đối chiếu giá tốt, nên có thể lặng lẽ cho ca này nhiều cơ hội hơn mà chấm vẫn xanh. Các trần chính (thời gian chờ, ngưỡng mili-giây, số ca chạy song song) vẫn được canh.
  Căn cứ: Hậu quả nhẹ: không mất hay lộ dữ liệu, chỉ là một trần phụ có thể bị đổi mà không báo, và người xem diff vẫn thấy được; ghi thành hạn chế đã biết là đủ, sửa sau cũng rẻ.
  file: `app/tests/suite-chung-bo-ca.test.tsx`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 4 — assertion âm tính «DB đổi sau đối chiếu» không thể đỏ sau khi bọc ảnh chụp, và không có đối chứng**
  Người dùng thấy gì: Một kiểm tra «dữ liệu không bị đổi sau khi đối chiếu» giờ luôn xanh nên không còn phát hiện được việc ghi nhầm vào dữ liệu.
  Căn cứ: Mất một lớp bảo vệ nhưng ca đối chiếu chạy chỉ đọc và tính nhất quán đã được đo riêng; không làm mất hay lộ dữ liệu.
  file: `app/tests/can-gia-tot-doi-chieu.test.tsx`
  severity: low
  Đề xuất: known-limits

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
