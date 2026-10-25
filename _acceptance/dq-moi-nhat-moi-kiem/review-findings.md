# Review findings: dq-moi-nhat-moi-kiem (round 2)

## Trong hợp đồng

Không có finding trong hợp đồng ở round này.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **loadDqChecks vẫn tự tính stats và docstring vẫn gọi nó là «nguồn DUY NHẤT» dù trang đã chuyển sang dqSection**
  Người dùng thấy gì: Người vận hành mở «Kiểm chất lượng» vẫn thấy bảng và số đầu trang đúng, khớp nhau. Chỉ có phần mã phía sau còn một đoạn tính số thừa và lời chú thích cũ, có thể làm người sửa sau này hiểu nhầm.
  Căn cứ: Không ảnh hưởng gì tới người dùng hôm nay, không mất hay sai dữ liệu; chỉ gây nhầm cho người sửa sau và dọn lại lúc nào cũng rẻ.
  file: `app/src/lib/dq-checks.ts`
  severity: low
  Đề xuất: known-limits

- **lib/ import kiểu từ components/ — chiều phụ thuộc mới, chưa có tiền lệ trong app/src/lib (r1 · tệp đã đổi)**
  Người dùng thấy gì: Người vận hành không thấy khác biệt nào: bảng Kiểm chất lượng vẫn hiện đúng. Chỉ là cách tổ chức mã hơi lệch so với phần còn lại, có thể làm người sửa sau này bối rối.
  Căn cứ: Không ảnh hưởng người dùng hay dữ liệu, chỉ là quy ước nội bộ; để sau dọn lúc rảnh thì rẻ, ghi lại là đủ.
  file: `app/src/lib/dq-checks.ts`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 5: AC-4 tuyên cả lớp «các kiểm khác», ma trận chỉ có một điểm đại diện là freshness (r1 · tệp đã đổi)**
  Người dùng thấy gì: Bài thử mới thử nhãn kết quả trên một loại kiểm khác (độ tươi), chưa thử từng loại còn lại. Nếu một loại kiểm khác hiện nhãn sai thì chưa có gì báo trước.
  Căn cứ: Chưa có bằng chứng nhãn nào sai và loại kiểm khác dùng chung cách gắn nhãn; lỗi nếu có chỉ là nhãn hiện sai, người dùng tải lại không đổi nhưng thấy ngay, sửa sau rẻ.
  file: `app/tests/dq-moi-nhat.test.tsx`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 4: phép đo dữ liệu thật AC-5 khẳng định âm tính một mình (không dòng tham chiếu nào xanh), không đối chứng dương cùng lượt (r1)**
  Người dùng thấy gì: Phép đo trên dữ liệu thật chỉ xác nhận không có dòng độ phủ nào hiện xanh, chưa xác nhận các kiểm khác vẫn hiện xanh khi đạt. Nếu nhãn xanh hỏng hẳn thì phép đo này vẫn báo ổn.
  Căn cứ: Phần nhãn xanh cho kiểm khác đã được thử riêng ở bài thử đơn vị nên rủi ro thấp; chỉ là phép đo thêm một lớp bảo đảm, thêm sau không tốn kém.
  file: `scripts/dq-moi-nhat-do.mjs`
  severity: low
  Đề xuất: known-limits

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
