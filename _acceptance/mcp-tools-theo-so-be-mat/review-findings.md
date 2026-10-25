# Review findings: mcp-tools-theo-so-be-mat

## Trong hợp đồng

Không có finding nào.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **loadHistoric: mọi lỗi git show bị gộp thành 'thiếu lịch sử git', mất lỗi gốc**
  Người dùng thấy gì: Khi phép kiểm bản cũ gặp sự cố git khác (ví dụ đường dẫn không có ở bản cũ), nó vẫn báo đỏ nhưng chỉ nói chung là thiếu lịch sử. Người bảo trì có thể mất thời gian tìm sai hướng, còn kết quả kiểm vẫn đúng.
  Căn cứ: Hậu quả nhẹ: phép kiểm vẫn báo đỏ đúng chỗ, không mất hay lộ dữ liệu, chỉ làm người đọc lỗi tốn thêm thời gian chẩn đoán; sửa sau rẻ và không gấp.
  file: `scripts/check-mcp-tools.mjs`
  severity: low
  Đề xuất: known-limits

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
