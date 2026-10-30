# Review findings: eval-classify-wilson (round 1)

## Trong hợp đồng

(không có)

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Hình dạng 4 (âm tính một mình, không ghim thông điệp): ca hoàn tác ở ô thứ 5 của E7 dùng assert.rejects mà không có matcher**
  Người dùng thấy gì: Phép kiểm tra việc huỷ cả lượt khi ghi lỗi giữa chừng có thể báo xanh dù lỗi không đúng chỗ dự định. Bản thân lệnh vẫn chạy, chỉ là bằng chứng kiểm chưa chặt.
  Căn cứ: Hậu quả nhẹ vì chỉ làm bằng chứng kiểm yếu đi chứ không làm mất hay sai dữ liệu của người dùng, và có thể siết lại sau với chi phí thấp.
  file: `_acceptance/eval-classify-wilson/probes/db.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 3 (assert 'chuỗi có mặt' trong khi lời hứa là quan hệ/giá trị): lượt --dry trên oneinvest chỉ kiểm có dòng ô, không kiểm ô là skip**
  Người dùng thấy gì: Phép kiểm lượt chạy thử chỉ xác nhận có đủ 9 dòng ô chứ không xác nhận cả 9 đều là bỏ qua. Nếu lệnh in sai trạng thái thì phép kiểm vẫn có thể xanh.
  Căn cứ: Hậu quả nhẹ vì không ảnh hưởng dữ liệu người dùng, chỉ là phép kiểm lỏng; hiện lát OCP1 chưa có nhãn nên rủi ro sai trạng thái thấp và người vận hành nhìn bảng in là thấy ngay.
  file: `_acceptance/eval-classify-wilson/probes/db.mjs`
  severity: low
  Đề xuất: known-limits

## Chưa adversarial-verify (refuter chết)

(không có)

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
