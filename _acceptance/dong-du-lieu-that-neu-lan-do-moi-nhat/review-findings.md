## Trong hợp đồng

(không có)

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **duongSo giờ có thể trả null nhưng bên ghi sổ pipeline-that-hang-ngay.mjs vẫn dùng như chuỗi**
  Người dùng thấy gì: Trong một ca hiếm (máy có phiên bản git cũ), lượt soát hằng ngày chạy xong nhưng kết quả không được ghi vào sổ và lượt đó báo lỗi. Người dùng không thấy dòng kết quả của ngày ấy.
  Căn cứ: Hậu quả nhẹ và hiếm: chỉ mất kết quả một lượt soát nội bộ, chạy lại hôm sau là có lại, không mất hay lộ dữ liệu người dùng; sửa sau không đắt.
  file: `scripts/pipeline-that-hang-ngay.mjs`
  severity: low
  Đề xuất: known-limits

## Chưa adversarial-verify (refuter chết)

(không có)

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
