# Review findings: e4b-danh-sach-tin-nhanh (round 2)

## Trong hợp đồng

Không có.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **AC-3/AC-4 giờ có thể bỏ qua với exit 0, nên E4/E5 chạy lại ở vòng sau có thể ra «đạt» dù không so gì**
  Người dùng thấy gì: Sau này nếu mã danh sách tin bị sửa ở hàng khác, phép so tốc độ và so kết quả với bản cũ có thể bị bỏ qua mà vẫn báo xanh. Hôm nay chúng vẫn chạy và đạt, nên người dùng chưa chịu ảnh hưởng gì.
  Căn cứ: Chỉ là rủi ro cho lần chấm sau, không làm người dùng thấy sai số liệu hay chậm hôm nay, và hợp đồng đã chủ ý cho phép bỏ qua kiểu này.
  file: `app/tests/tin-rao-doi-chieu.test.tsx`
  severity: medium
  Đề xuất: known-limits

- **Một tệp ghim bị đổi tên hay xoá làm sập cả tệp test lúc nạp, không chỉ bỏ qua ca so một lần**
  Người dùng thấy gì: Nếu sau này có người đổi tên hoặc xoá một tệp mã liên quan, cả bộ kiểm tra danh sách tin sẽ sập thay vì chỉ bỏ qua một phép so. Người dùng cuối không thấy gì, chỉ làm đội phát triển bị đỏ giả.
  Căn cứ: Hậu quả chỉ rơi vào đội phát triển, báo lỗi ngay và rõ nên tự gỡ được, không ảnh hưởng dữ liệu hay trang người dùng.
  file: `app/tests/tin-rao-doi-chieu.test.tsx`
  severity: low
  Đề xuất: known-limits

- **AC-7 vẫn ghim vào gốc nhánh e21a151e ở mọi máy ngoài CI: làm theo hướng dẫn «cập nhật BAM_KHOI_E4B» thì ca vẫn đỏ**
  Người dùng thấy gì: Nếu sau này cố ý đổi cách đo thời gian của danh sách tin, bộ kiểm tra vẫn báo đỏ dù đã làm đúng hướng dẫn, và phải sửa thêm một chỗ. Người dùng cuối không bị ảnh hưởng.
  Căn cứ: Chỉ gây vướng cho người sửa bộ kiểm tra về sau, lỗi lộ ngay khi chạy và gỡ được bằng một chỉnh sửa nhỏ, không chạm tới dữ liệu hay trang người dùng.
  file: `app/tests/tin-rao-doi-chieu.test.tsx`
  severity: medium
  Đề xuất: known-limits

- **E4/E5 (AC-3, AC-4) qua lặng lẽ với exit 0 khi offers-public.ts hay một tệp nó import đổi trong các vòng sửa còn lại của chính hồ sơ này**
  Người dùng thấy gì: Nếu vòng sửa sau lại đụng vào mã danh sách tin, hai phép so tốc độ và kết quả có thể bị bỏ qua mà vẫn báo đạt. Hiện tại chúng chạy thật và đạt.
  Căn cứ: Rủi ro chỉ xảy ra có điều kiện ở vòng sau, không làm người dùng mất hay thấy sai dữ liệu hôm nay, và người ký có thể tự đọc dòng bỏ qua để phát hiện.
  file: `app/tests/tin-rao-doi-chieu.test.tsx`
  severity: medium
  Đề xuất: known-limits

- **Ca AC-4/AC-3/AC-7 ghim cứng vào gốc nhánh e21a151e nhưng nằm trong suite chạy mỗi lượt, nên lần sửa hợp lệ sau này sẽ làm suite đỏ (r1 · tệp đã đổi)**
  Người dùng thấy gì: Tính năng chạy đúng cho người dùng hôm nay. Nhưng về sau, khi đội cố ý đổi cách danh sách tin hoạt động, bộ kiểm tra sẽ báo đỏ dù không có lỗi thật, và phải có người gỡ hoặc sửa các ca so sánh cũ mới tiếp tục được.
  Căn cứ: Không ảnh hưởng người dùng cuối và không mất dữ liệu; chỉ làm chậm đội phát triển ở vòng sau, và người sửa tự gỡ được khi chạm vào đúng chỗ đó nên ghi lại hạn chế là đủ.
  file: `app/tests/tin-rao-doi-chieu.test.tsx`
  severity: medium
  Đề xuất: known-limits

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
