## Trong hợp đồng

Không có finding nào.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **JSDoc của docCuTaiCommit bị tách khỏi hàm do chèn const bam vào giữa**
  Người dùng thấy gì: Chú thích mô tả bộ đọc ngân sách đang nằm nhầm chỗ trong mã nguồn. Người dùng cuối không thấy gì khác và kết quả đo vẫn đúng, chỉ người đọc mã sau này dễ hiểu nhầm.
  Căn cứ: Không ảnh hưởng dữ liệu hay người dùng, không mất gì; chỉ gây khó hiểu nhẹ cho người bảo trì và sửa lại về sau rất rẻ.
  file: `pipeline/scripts/do-ngan-sach-yeu-cau.mjs`
  severity: low
  Đề xuất: known-limits

## Chưa adversarial-verify (refuter chết)

Không có.

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
