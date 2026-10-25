# Review findings: s05-slo-theo-lich (round 2)

## Trong hợp đồng

(không có)

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Hình dạng 5 (tuyên quét cả lớp nhưng ma trận thiếu phần tử): ma trận «các dạng ghi SLO S05 có trong kho» của S5-AC-6 bỏ sót dạng «S05 = N giờ», dạng mà chính diff này thêm vào cả hai bản chép**
  Người dùng thấy gì: Hiện không có chỗ nào ghi sai hạn tươi của nguồn S05, nên màn hình và lệnh kiểm tra vẫn báo đúng. Nhưng nếu sau này có người ghi lại hạn cũ bằng một kiểu chữ khác, bước kiểm tự động sẽ không phát hiện và bảng độ tươi có thể báo lệch mà không ai hay.
  Căn cứ: Hậu quả nhẹ vì chưa có số liệu sai nào đang hiển thị, chỉ là lưới an toàn cho tương lai còn hở; không mất dữ liệu và khi lệch xảy ra thì người dùng nhìn ra qua trạng thái S05 và sửa được ngay, nên ghi lại làm hạn chế đã biết là đủ.
  file: `scripts/s05-slo.test.mjs`
  severity: medium
  Đề xuất: known-limits

- **E5 hứa «không ca nào bị bỏ qua vì thiếu DB» nhưng executor vẫn exit 0 khi DB không tới (r1)**
  Người dùng thấy gì: Nếu máy chấm không có cơ sở dữ liệu local, phép đo độ tươi vẫn báo xanh dù các ca quanh mốc 96/97 giờ không chạy. Người ký có thể tin nhầm là đã kiểm đủ.
  Căn cứ: Chỉ xảy ra khi máy chấm thiếu DB, không ảnh hưởng người dùng cuối, và chạy lại trên máy có DB là thấy ngay; ghi lại điều kiện chấm là đủ.
  file: `_acceptance/config.yaml`
  severity: low
  Đề xuất: known-limits

- **Chú thích lịch trong test ghi sai thứ: 4/11/2026 là thứ Tư, không phải thứ Ba (r1 · tệp đã đổi)**
  Người dùng thấy gì: Một dòng ghi chú trong phép đo ghi sai thứ trong tuần của ngày mốc; kết quả đo và những gì người dùng thấy trên màn hình không đổi.
  Căn cứ: Không ảnh hưởng kết quả đo hay người dùng; chỉ có thể gây nhầm nhẹ cho người đọc sau này và sửa lúc nào cũng được, nên chấp nhận và ghi vết.
  file: `scripts/s05-slo.test.mjs`
  severity: low
  Đề xuất: wont-fix

## Chưa adversarial-verify (refuter chết)

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
