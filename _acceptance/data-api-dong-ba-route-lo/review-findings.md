# Review findings: data-api-dong-ba-route-lo (round 3)

## Trong hợp đồng

Không có finding.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

(Không có muc moi trong round nay; muc carried tu round truoc do may tu chen.)

- **README công khai khẳng định API không bao giờ đọc hay trả dữ liệu S02, nhưng /v1/markets* vẫn làm việc đó (r2)**
  Người dùng thấy gì: Tài liệu công khai của API nói rằng API không bao giờ trả số liệu của nguồn hiệu chuẩn, nhưng các trang thị trường vẫn trả. Người dùng API có thể hiểu sai về dữ liệu họ nhận được.
  Căn cứ: Chỉ là câu chữ mô tả sai, không làm lộ thêm dữ liệu so với hiện tại, và sẽ hết khi hàng gỡ số này khỏi các trang thị trường hoàn tất.
  file: `data-api/README.md`
  severity: medium
  Đề xuất: known-limits

## Chưa adversarial-verify (refuter chết)

Không có.

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
