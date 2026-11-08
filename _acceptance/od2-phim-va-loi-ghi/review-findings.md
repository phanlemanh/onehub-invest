# Review findings: od2-phim-va-loi-ghi (round 2)

## Trong hợp đồng

(không có finding nào)

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Code sản phẩm import module nội bộ của Next (next/dist/...) chỉ để chiều bộ thử; kho đã có sẵn hai cách đúng hơn**
  Người dùng thấy gì: Nút «Mở thẻ» hiện dựa vào phần nội bộ của khung web; khi nâng phiên bản khung này nút có thể hỏng mà không báo trước. Hiện tại người dùng chưa thấy ảnh hưởng gì.
  Căn cứ: Hậu quả chỉ xuất hiện khi nâng phiên bản sau này, không mất dữ liệu, và phát hiện ngay qua bộ thử nên ghi lại rồi sửa sau là đủ.
  file: `app/src/components/ops/review/review-queue.tsx`
  severity: medium
  Đề xuất: known-limits

- **«Mở thẻ» sau khi gỡ hàng duyệt nay có thể không làm gì mà không báo lỗi, và bằng chứng E6 được chụp trước khi sửa đúng đường này**
  Người dùng thấy gì: Nếu vì lý do hiếm nào đó không có bộ điều hướng, bấm «Mở thẻ» trên tin lỗi sẽ không có phản ứng và không báo gì. Người dùng vẫn tìm lại thẻ được bằng cách vào Hàng duyệt.
  Căn cứ: Là tình huống hiếm, không mất dữ liệu, người dùng tự mở lại thẻ từ Hàng duyệt được; chỉ cần ghi lại và chạy lại bằng chứng khi có dịp.
  file: `app/src/components/ops/review/review-queue.tsx`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 6 (đo cây khác cây đang kiểm): bằng chứng E6 chụp trên bản code cũ, trước khi sửa đúng dòng điều hướng mà E6 đo**
  Người dùng thấy gì: Ảnh chứng cho nút «Mở thẻ» được chụp trên bản mã trước lần sửa cuối, nên chưa xác nhận bản mới nhất chạy đúng trên trang thật. Người dùng chưa gặp lỗi nào.
  Căn cứ: Không ảnh hưởng người dùng trực tiếp và chụp lại bằng chứng rẻ, nhưng đây là khoảng hở xác nhận nên ghi lại rõ để người ký biết.
  file: `_acceptance/od2-phim-va-loi-ghi/evidence/E6-step3.png`
  severity: medium
  Đề xuất: known-limits

- **ReviewQueue gọi useRouter() vô điều kiện: render không có AppRouterContext nay ném lỗi, làm đỏ test VT-AC-3 đang có (r1)**
  Người dùng thấy gì: (mục mang từ round 1, không chấm lại)
  Căn cứ: (xem round 1)
  file: `app/src/components/ops/review/review-queue.tsx`
  severity: n-a (mang từ round 1)
  Đề xuất: (xem round 1)

- **E2 trong evals.yaml ghi tin '#62 …' / '#63 …' nhưng ca máy chỉ dùng thẻ #61 cho cả ba tình trạng (r1)**
  Người dùng thấy gì: (mục mang từ round 1, không chấm lại)
  Căn cứ: (xem round 1)
  file: `_acceptance/od2-phim-va-loi-ghi/evals.yaml`
  severity: n-a (mang từ round 1)
  Đề xuất: (xem round 1)

## Chưa adversarial-verify (refuter chết)

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
