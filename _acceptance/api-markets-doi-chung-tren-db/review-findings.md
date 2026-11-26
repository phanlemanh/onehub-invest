# Review findings: api-markets-doi-chung-tren-db (round 2)

## Trong hợp đồng

Không có finding nào.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **ht28_ac1/ht28_ac2 không theo khuôn `bash -o pipefail -c '…'` mà các executor «đòi pass N» khác đang dùng**
  Người dùng thấy gì: Hai bước kiểm tự động mới viết lệch cách các bước kiểm cũ vẫn viết. Trên máy chạy kiểm khác loại vỏ lệnh, chúng có thể báo đỏ dù kiểm thử vẫn xanh. Hiện chưa gây hại vì bước kiểm này chưa chạy trên máy chủ.
  Căn cứ: Hậu quả nhẹ: chỉ là báo đỏ giả ở bước kiểm nội bộ, không mất hay lộ dữ liệu người dùng, và sửa lại sau rất rẻ khi bật chạy trên máy chủ.
  file: `_acceptance/config.yaml`
  severity: low
  Đề xuất: known-limits

## Chưa adversarial-verify (refuter chết)

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
