## Trong hợp đồng

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Hình dạng 6 (đo checkout khác thay vì cây đang kiểm): bước định danh bản chạy của E10 chỉ so HEAD, không phát hiện sửa chưa commit ở worktree đang phục vụ :3461**
  Người dùng thấy gì: Ảnh và số chụp ở màn số mốc có thể đến từ bản chạy của phiên khác, nếu phiên đó đang sửa dở mà chưa lưu vào lịch sử. Lúc kiểm tra hai bản đang giống nhau nên ảnh hiện tại vẫn đúng, nhưng cách kiểm chưa đảm bảo điều đó cho lần chấm sau.
  Căn cứ: Hiện chưa có sai lệch thật, màn người dùng không bị ảnh hưởng, chỉ làm bằng chứng nghiệm thu kém chặt; chụp lại ảnh từ đúng bản đang kiểm là gỡ được ngay và rẻ.
  file: `_acceptance/so-so-tren-man-theo-ngay/evals.yaml`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 6 (đo checkout của tác giả thay vì cây đang kiểm): E10 chấm trên server :3461 của phiên khác, không bước nào buộc server đó vào cây đang kiểm (r1 · tệp đã đổi)**
  Người dùng thấy gì: Ảnh chụp màn Số mốc được chụp từ một bản chạy của phiên khác. Hiện bản đó giống hệt mã đang kiểm nên màn đúng, nhưng nếu sau này sửa giao diện mà chấm lại thì ảnh vẫn có thể là của bản cũ.
  Căn cứ: Hiện chưa có sai lệch thật trên màn, chỉ là phép chụp chưa đảm bảo cho lần sửa sau; chạy lại chụp trên đúng bản mã khi cần là việc rẻ.
  file: `_acceptance/so-so-tren-man-theo-ngay/evals.yaml`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 4 (assertion âm tính một mình): ca lỗi khẳng định không có [data-milestone-trend], nhưng không ca nào khẳng định DataFlowView hiện vùng này khi số tốt (r1)**
  Người dùng thấy gì: Nếu ai đó vô tình gỡ vùng Số mốc khỏi trang Luồng dữ liệu, bộ test tự động vẫn xanh và không báo. Người vận hành sẽ chỉ biết khi mở trang và thấy vùng biến mất.
  Căn cứ: Rủi ro là một lần gỡ nhầm không bị bắt sớm, nhưng người dùng tự thấy ngay khi mở trang và mã không mất dữ liệu; thêm một ca kiểm sau này là việc rẻ.
  file: `app/tests/so-moc-s03.test.tsx`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 3 (assert chuỗi có mặt trong khi lời hứa là quan hệ): «bốn nhãn lấy từ CONTEXT.md» chỉ được so với literal viết trong test (r1)**
  Người dùng thấy gì: Bốn nhãn trên màn được kiểm với bản chép tay trong test, không kiểm trực tiếp với bảng thuật ngữ. Nếu sau này đổi thuật ngữ mà quên đổi màn, nhãn trên màn có thể lệch mà không ai được báo.
  Căn cứ: Hậu quả chỉ là nhãn chữ lệch nhẹ, không mất hay lộ dữ liệu, tải lại và sửa chữ là xong, nhưng cũng chưa có sai lệch nào xảy ra.
  file: `app/tests/so-moc-s03.test.tsx`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 3 (quan hệ bị thay bằng hằng số): building_linked của AC-9 so với số 0 gán cứng, không phải đếm độc lập (r1)**
  Người dùng thấy gì: Trong bốn số của màn Số mốc, số tin gắn toà chưa được đối chiếu độc lập với dữ liệu thật, vì hiện chưa có tin nào gắn toà. Ba số còn lại được đối chiếu đầy đủ.
  Căn cứ: Số này hiện luôn bằng 0 vì chức năng gắn toà chưa làm, nên không có số sai nào hiện cho người dùng; sẽ cần đối chiếu thật khi hàng gắn toà hoàn thành.
  file: `_acceptance/so-so-tren-man-theo-ngay/probes/do-may-thu.mjs`
  severity: low
  Đề xuất: known-limits

## Chưa adversarial-verify (refuter chết)

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
