## Trong hợp đồng

- **Hình dạng 4 (âm-tính không ghim thông điệp): probe E6 chấm ca đỏ mà không đòi thông điệp ghim**
  file: `_acceptance/data-api-markets-khong-doc-s02/probes/ban-cu.mjs:35`
  severity: medium
  AC: AC-6
  detail: evals E6 hứa «markets.ts ở merge-base đỏ ở đủ năm ca HT20-AC-1 … HT20-AC-5, mỗi ca với thông điệp ghim riêng của nó». Nhưng `dung` ở dòng 35 chỉ cần `doCa.length === CA.length && r.status !== 0`, tức chỉ cần thấy dòng `✖ HT20-AC-n`. Dòng 39–40 có dò thông điệp ghim, nhưng chỉ in ra. Khi không tìm thấy, nó in «(đỏ do lỗi, không có thông điệp ghim)» và vẫn không tăng `sai`. Vậy một ca đỏ vì lý do không liên quan (văng lỗi, timeout, SQL hỏng ở before) vẫn được tính là đỏ đúng chỗ, và probe vẫn thoát 0.
  source: measurement

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Hình dạng 4 (âm-tính-một-mình, không có đối chứng dương): phép soát chuỗi canh S02 chưa lần nào được thấy bắn**
  Người dùng thấy gì: Rào chặn số liệu S02 lộ ra API chưa từng được thấy bắn trong một ca thật, nên nếu dữ liệu mẫu lệch so với thực tế thì rào có thể im lặng bỏ sót. Hiện tại các kiểm tra khác vẫn chặn được đường lộ chính.
  Căn cứ: Không ảnh hưởng người dùng ngay vì API chưa mở ra ngoài và các phép kiểm khác vẫn bắt được lỗi chính; sửa sau vẫn rẻ và không mất dữ liệu.
  file: `data-api/test/markets-khong-s02.test.ts`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 1 (đo sự có mặt thay vì đầu ra): E7 hứa dong-ba-route, auth-dong xanh nhưng probe chỉ kiểm tệp có tồn tại**
  Người dùng thấy gì: Phần kiểm ranh giới chỉ xác nhận hai bộ kiểm tra cũ còn nằm trong dự án chứ không tự chạy chúng. Kết quả chạy thật vẫn được ghi ở các bước kiểm khác.
  Căn cứ: Hậu quả nhẹ vì hai bộ kiểm tra đó vẫn được chạy ở chỗ khác trong cùng hồ sơ, người dùng không bị ảnh hưởng và việc siết lại sau rất rẻ.
  file: `_acceptance/data-api-markets-khong-doc-s02/probes/ranh.mjs`
  severity: medium
  Đề xuất: known-limits

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
