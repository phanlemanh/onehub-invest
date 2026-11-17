# Review findings: nhan-du-an-thay-khu-do-thi-ops (round 2)

## Trong hợp đồng

(không có)

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Hình dạng 1 (đo chỉ dẫn/chú thích thay vì đầu ra): ô ma trận NDT-AC-2 cho tiêu đề hộp khai vẫn xanh nhờ dòng comment**
  Người dùng thấy gì: Phép kiểm tiêu đề hộp «Khai thị trường, dự án» hiện vẫn báo xanh nếu ai đó đổi tiêu đề nhưng còn sót chữ đó trong chú thích. Người dùng thấy tiêu đề đúng ở thời điểm này; chỉ có nguy cơ về sau là một lần đổi chữ nhầm có thể lọt mà không bị bắt.
  Căn cứ: Hiện không ai thấy sai gì trên màn, nguy cơ chỉ xảy ra nếu sau này có người sửa tiêu đề nhầm, và nếu lọt thì chỉ là một dòng chữ hiển thị lệch, dễ sửa lại sau, không mất hay lộ dữ liệu.
  file: `scripts/nhan-du-an-thay-khu-do-thi.test.mjs`
  severity: low
  Đề xuất: known-limits

## Chưa adversarial-verify (refuter chết)

(không có)

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).

