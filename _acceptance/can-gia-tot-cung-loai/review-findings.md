## Trong hợp đồng

Không có finding.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

(Không có mục mới ở round 3; sáu mục của round trước được máy chèn kèm nhãn (r<N>).)

- **min_discount=0 bị đổi ngầm thành 5 ở cả hai API, nên phép đo AC-7 và ca AC-6 không chạy trên mẫu mà chúng tưởng (r2)**
  Người dùng thấy gì: Phép đo trên dữ liệu thật chỉ phủ các tin giảm từ 5% trở lên, các tin giảm ít hơn không được kiểm. Người dùng thấy danh sách giá tốt vẫn đúng như trước.
  Căn cứ: Không làm sai số hiển thị cho người dùng, chỉ làm mẫu kiểm hẹp hơn lời mô tả, và có thể ghi chú rõ rồi sửa sau với chi phí thấp.
  file: `pipeline/scripts/do-can-gia-cung-loai.mjs`
  severity: medium
  Đề xuất: known-limits

- **Bộ kiểm ranh giới AC-9 không quét nội dung tệp chưa track, dù chú thích nói «đếm cả thay đổi chưa commit» (r2)**
  Người dùng thấy gì: Công cụ rà tên nguồn thật có thể bỏ sót tệp mới chưa được thêm vào git. Hiện tại không có tên nguồn nào lọt ra, nhưng một tệp mới trong tương lai có thể không bị bắt.
  Căn cứ: Chưa có dữ liệu nào lộ, rủi ro chỉ xảy ra nếu sau này có tệp mới chưa thêm vào git, và khi commit thì bộ kiểm sẽ thấy.
  file: `pipeline/scripts/can-gia-cung-loai-ranh-gioi.mjs`
  severity: low
  Đề xuất: known-limits

- **data-api /v1/deals bị hỏng trên lược đồ độc lập của bản public (thiếu v_ruler_p2, properties, sale_offers.property_type) (r2)**
  Người dùng thấy gì: Ai cài API công khai theo hướng dẫn với dữ liệu mẫu sẽ nhận lỗi ở danh sách căn giá tốt sau lần đẩy bản public tới. Trên hệ thống của mình thì không bị.
  Căn cứ: Chỉ ảnh hưởng người ngoài tự cài bản mẫu sau khi Mạnh chủ động đẩy bản public, nên có thể ghi lại và xử lý trước lúc đẩy.
  file: `data-api/src/routes/deals.ts`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 4 (âm tính một mình): ca đột biến AC-6 không bao giờ đỏ, mọi đường hỏng đều thành null và assert vẫn qua (r2)**
  Người dùng thấy gì: Bài kiểm giả lập lỗi cho API công khai luôn báo qua, nên nếu sau này ai đó làm API tính số giảm sai thì bài kiểm này có thể không phát hiện. Số liệu hiện tại người dùng thấy vẫn đúng.
  Căn cứ: Không gây sai dữ liệu hôm nay, chỉ làm lưới an toàn cho thay đổi sau kém tin cậy, và các phép đo khác trong cùng hàng vẫn kiểm số giảm của API.
  file: `app/tests/can-gia-cung-loai-db.test.tsx`
  severity: high
  Đề xuất: known-limits

- **Hình dạng 1 (đo chỉ dẫn thay vì đầu ra): ca 401 của AC-5 grep mã nguồn route thay vì gọi GET không token (r2)**
  Người dùng thấy gì: Bài kiểm việc chặn người không có quyền chỉ kiểm cách viết mã chứ không thử gọi thật. Nếu cổng chặn bị làm hỏng sau này thì bài kiểm này có thể không báo.
  Căn cứ: Quyền truy cập hiện vẫn đúng và API này đang đóng với người ngoài, nên rủi ro thấp và sửa lại bài kiểm sau không tốn kém.
  file: `app/tests/can-gia-cung-loai-db.test.tsx`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 4 (âm tính một mình): ten_nguon=0 của bộ soát ranh giới không có đối chứng dương, danh sách tên rỗng vẫn cho 0 (r2)**
  Người dùng thấy gì: Công cụ rà tên nguồn thật có thể báo sạch trong khi thực ra không có danh sách tên nào để so. Chưa có bằng chứng tên nguồn nào bị lộ trong thay đổi này.
  Căn cứ: Không có dữ liệu bị lộ ở lượt này, và rủi ro chỉ xuất hiện khi môi trường chấm thiếu danh sách tên, có thể ghi chú để lần chạy sau kiểm kỹ hơn.
  file: `pipeline/scripts/can-gia-cung-loai-ranh-gioi.mjs`
  severity: medium
  Đề xuất: known-limits

## Chưa adversarial-verify (refuter chết)

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).

