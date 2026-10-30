## Trong hợp đồng

Không có finding nào map được vào AC.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Docstring của dq-labels.ts chưa thêm bên ghi mới và dạng entity mới**
  Người dùng thấy gì: Người dùng không thấy gì khác trên trang Kiểm chất lượng, nhãn tiếng Việt vẫn hiện đúng. Chỉ người sửa mã sau này có thể đọc phần ghi chú trong tệp và không biết có thêm một nơi ghi dòng kiểm ảnh tin.
  Căn cứ: Hậu quả nhẹ, không mất hay lộ dữ liệu, không ảnh hưởng người dùng cuối. Sửa lúc nào cũng rẻ, nên ghi lại là đủ.
  file: `app/src/lib/dq-labels.ts`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 2 — fixture viết tay đúng khuôn bên đọc; phép round-trip duy nhất (E4) không ghim rằng có dòng của writer**
  Người dùng thấy gì: Hôm nay bảng Kiểm chất lượng hiện đúng nhãn cho dòng ảnh tin. Nếu sau này bên ghi đổi cách ghi chi tiết, hoặc bước ghi ảnh tin ngừng chạy, bộ kiểm có thể vẫn báo xanh trong khi bảng hiện «chưa diễn giải». Khi đó chỉ người xem bảng mới phát hiện ra.
  Căn cứ: Rủi ro chỉ xảy ra khi bên ghi đổi khuôn, và khi đó việc đổi khuôn nằm ngoài phạm vi vòng này. Hậu quả là nhãn hiển thị tạm sai, không mất dữ liệu, và bảng tải lại là thấy ngay. Thêm kiểm chứng sau này khá rẻ nên ghi hạn chế đã biết là hợp lý.
  file: `app/tests/dq-media-label.test.tsx`
  severity: medium
  Đề xuất: known-limits

## Chưa adversarial-verify (refuter chết)

Không có.

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
