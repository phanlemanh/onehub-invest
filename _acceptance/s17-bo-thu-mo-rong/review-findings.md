# Review findings: s17-bo-thu-mo-rong (round 2)

## Trong hợp đồng

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Bộ thu ghi snapshot schemaVersion 17/18 (kind mới anh_du_an, tệp media/*) trong khi DATA-CONTRACT trên main không khai hai số này (r1)**
  Người dùng thấy gì: Bộ thu mới có thể ghi dữ liệu theo số phiên bản mà tài liệu hợp đồng dữ liệu chưa khai, nên nếu gộp sai thứ tự thì phía nạp dữ liệu có thể không hiểu các bản ghi mới.
  Căn cứ: Chỉ là lệch thứ tự gộp, không mất hay lộ dữ liệu, và đã có nhánh hợp đồng riêng được giao để gộp trước hoặc cùng lúc.
  file: `collector/src/collectors/s17-thua-dinh-gia/store.ts`
  severity: medium
  Đề xuất: known-limits

- **Pha ảnh: bộ đếm byte «đang tải» dùng chung biến daNhan cho mọi luồng, nên số báo sai khi chạy song song (r1)**
  Người dùng thấy gì: Dòng nhật ký báo số byte ảnh đang tải có thể sai khi tải nhiều ảnh cùng lúc, nên người vận hành khó phân biệt đang tải với bị treo. Dữ liệu thu được không bị ảnh hưởng.
  Căn cứ: Chỉ sai con số trong nhật ký, không mất hay lộ dữ liệu, người vận hành vẫn tự kiểm tra bằng cách khác được và sửa sau cũng không đắt.
  file: `collector/src/collectors/s17-thua-dinh-gia/pha-anh.ts`
  severity: low
  Đề xuất: known-limits

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
