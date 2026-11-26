# Review findings: yeu-cau-khong-thanh-tin-thue (round 1)

## Trong hợp đồng

(không có finding nào)

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **pl42_loai_tin so với origin/main thay vì một sha ghim, khác mẫu có sẵn**
  Người dùng thấy gì: Phép kiểm «bộ test cũ không bị sửa» có thể báo đỏ oan nếu nhánh chính đổi hai tệp đó vì việc khác, và sau khi gộp thì luôn xanh nên không còn bắt được gì. Người dùng cuối không thấy ảnh hưởng nào, chỉ đội phát triển có thể gặp báo động giả.
  Căn cứ: Hậu quả nhẹ: không mất hay lộ dữ liệu của người dùng, chỉ có nguy cơ báo đỏ nhầm trong khâu kiểm, và chạy lại hay ghim lại sau này đều rẻ.
  file: `_acceptance/config.yaml`
  severity: low
  Đề xuất: known-limits

## Chưa adversarial-verify (refuter chết)

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
