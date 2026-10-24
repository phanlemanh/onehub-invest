## Trong hợp đồng

- **Hình dạng 3 (và 1): lời hứa QUAN HỆ «bảng lẫn số qua cùng một nguồn» chỉ đo bằng regex «chuỗi có mặt» trên mã nguồn page.tsx, không đo đầu ra trang**
  file:line: `app/tests/dq-moi-nhat.test.tsx:96`
  severity: medium
  AC: AC-3
  source: measurement
  detail: Phần page của DQ-AC-3 chỉ kiểm chuỗi trong mã nguồn: `assert.match(page, /await loadDqChecks\(pool\)/)` và `assert.match(page, /stats=\{\[\.\.\.dqStat\.labels/)`, cộng với `page.includes("dq_check_results") === false`. AC-3 hứa một QUAN HỆ: số «<n> kiểm · <m> đối tượng» trên PageHeader và dòng của DqChecksTable lấy từ cùng một lần gọi loadDqChecks, với m = số dòng bảng. Các regex này không ràng buộc biến `dqStat` với biến `dq`/`dqShown` mà DqChecksTable nhận (dòng 27, 41, 73 của page.tsx). Ví dụ hai lần gọi loadDqChecks tách biệt, hoặc lọc `dqShown` khác `dq`, vẫn qua. Regex cũng khớp cả khi đoạn mã đó nằm trong comment. Không có lần vẽ PageHeader nào để so nhãn với số dòng bảng thực vẽ. Phần dùng loadDqChecks trên fixture thì đo đầu ra thật; riêng nửa «trang» thì chỉ đo văn bản nguồn.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **lib/ import kiểu từ components/ — chiều phụ thuộc mới, chưa có tiền lệ trong app/src/lib**
  Người dùng thấy gì: Người vận hành không thấy khác biệt nào: bảng Kiểm chất lượng vẫn hiện đúng. Chỉ là cách tổ chức mã hơi lệch so với phần còn lại, có thể làm người sửa sau này bối rối.
  Căn cứ: Không ảnh hưởng người dùng hay dữ liệu, chỉ là quy ước nội bộ; để sau dọn lúc rảnh thì rẻ, ghi lại là đủ.
  file: `app/src/lib/dq-checks.ts`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 5: AC-4 tuyên cả lớp «các kiểm khác», ma trận chỉ có một điểm đại diện là freshness**
  Người dùng thấy gì: Bài thử mới thử nhãn kết quả trên một loại kiểm khác (độ tươi), chưa thử từng loại còn lại. Nếu một loại kiểm khác hiện nhãn sai thì chưa có gì báo trước.
  Căn cứ: Chưa có bằng chứng nhãn nào sai và loại kiểm khác dùng chung cách gắn nhãn; lỗi nếu có chỉ là nhãn hiện sai, người dùng tải lại không đổi nhưng thấy ngay, sửa sau rẻ.
  file: `app/tests/dq-moi-nhat.test.tsx`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 4: phép đo dữ liệu thật AC-5 khẳng định âm tính một mình (không dòng tham chiếu nào xanh), không đối chứng dương cùng lượt**
  Người dùng thấy gì: Phép đo trên dữ liệu thật chỉ xác nhận không có dòng độ phủ nào hiện xanh, chưa xác nhận các kiểm khác vẫn hiện xanh khi đạt. Nếu nhãn xanh hỏng hẳn thì phép đo này vẫn báo ổn.
  Căn cứ: Phần nhãn xanh cho kiểm khác đã được thử riêng ở bài thử đơn vị nên rủi ro thấp; chỉ là phép đo thêm một lớp bảo đảm, thêm sau không tốn kém.
  file: `scripts/dq-moi-nhat-do.mjs`
  severity: low
  Đề xuất: known-limits

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
