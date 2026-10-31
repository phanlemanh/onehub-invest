## Trong hợp đồng

Không có finding nào map được vào AC.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **transform-chotot: tin ánh xạ được thị trường nhưng thị trường chưa có phường (vd vn-da-nang trước khi áp 064) bị gán area_id NULL mà không có dòng cảnh báo nào**
  Người dùng thấy gì: Nếu tin Đà Nẵng được chuyển đổi trước khi dữ liệu thị trường mới được áp, các tin đó sẽ không có phường và hệ thống không báo gì. Sau khi áp xong và chạy lại thì phường được gán đúng.
  Căn cứ: Hậu quả nhẹ: chỉ là thiếu phường tạm thời, không mất dữ liệu, chạy lại sau khi áp là tự hết, và thứ tự triển khai đã được ghi rõ trong hợp đồng.
  file: `pipeline/transform-chotot.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 5: tuyên quét cả LỚP chuỗi thành phố viết cứng, nhưng bộ quét chỉ bắt một dạng và đối chứng chỉ có một điểm**
  Người dùng thấy gì: Phép kiểm tra tự động chỉ phát hiện được một số kiểu viết cứng tên thành phố, nên sau này ai đó thêm thành phố theo kiểu khác có thể không bị cảnh báo. Người dùng cuối hiện không bị ảnh hưởng.
  Căn cứ: Không gây lỗi dữ liệu nào hôm nay, chỉ là lưới an toàn cho thay đổi tương lai hơi thưa; có thể siết lại bất cứ lúc nào mà không ảnh hưởng người dùng.
  file: `pipeline/lib/thi-truong.test.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 5: ma trận AC-3 ghim số phần tử của SAP_NHAP nhưng không ghim số khoá THANH_PHO**
  Người dùng thấy gì: Nếu sau này thêm thành phố thứ năm, bộ kiểm tra có thể vẫn xanh dù chưa có ca thử riêng cho thành phố đó. Không ảnh hưởng dữ liệu hiện tại.
  Căn cứ: Rủi ro rất thấp và chỉ xảy ra khi có người chủ động thêm thành phố; chi phí sửa nhỏ nhưng lợi ích cho người dùng gần như bằng không.
  file: `pipeline/lib/thi-truong.test.mjs`
  severity: low
  Đề xuất: wont-fix

- **Hình dạng 1: test đo chữ trong mã nguồn transform-chotot thay vì đo đầu ra**
  Người dùng thấy gì: Một phép kiểm tra phụ chỉ xác nhận đoạn mã có mặt chứ không xác nhận kết quả, nên giá trị chứng minh của nó thấp. Kết quả thật cho người dùng đã có phép đo khác kiểm.
  Căn cứ: Không có lỗi nào đến tay người dùng vì hành vi đã được kiểm bằng phép đo chạy thật; sửa chỉ để gọn bộ kiểm tra nên không đáng công.
  file: `pipeline/lib/thi-truong.test.mjs`
  severity: low
  Đề xuất: wont-fix

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
