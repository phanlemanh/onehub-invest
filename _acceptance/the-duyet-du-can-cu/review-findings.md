# Review findings: the-duyet-du-can-cu (round 1)

## Trong hợp đồng

Không có finding nào map được vào AC.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Sổ bề mặt API vẫn khai /api/zalo-media là 'admin' trong khi mã đã mở chế độ ?snapshot= cho vai ops**
  Người dùng thấy gì: Bảng khai quyền truy cập của hệ thống vẫn ghi ảnh tin chỉ dành cho quản trị, trong khi thực tế vai Vận hành cũng xem được. Người rà soát quyền dựa vào bảng này sẽ hiểu sai ai đang xem được ảnh.
  Căn cứ: Ảnh vẫn tới đúng người, không mất hay lộ dữ liệu; chỉ tài liệu khai quyền sai nên dễ gây hiểu nhầm về sau, và sửa rất rẻ nhưng phải làm thành việc riêng ngoài hợp đồng này.
  file: `app/src/lib/api-surface.ts`
  severity: medium
  Đề xuất: new-contract

- **Hình dạng 5 (tuyên quét LỚP nhưng chỉ có điểm-case): design gate E15 hứa «từng tệp giao diện mới/đổi» mà danh sách viết tay sót tệp đã đổi**
  Người dùng thấy gì: Hai màn hình của thẻ duyệt (khung chi tiết và hàng chờ) đã đổi nhưng chưa qua bước kiểm tra giao diện tự động, nên lỗi trình bày nếu có sẽ không bị bắt trước khi ra.
  Căn cứ: Chỉ là khe hở của bước kiểm tra, người dùng không bị mất dữ liệu và lỗi giao diện nếu có thì thấy ngay, sửa được ở lần sau mà không tốn kém.
  file: `_acceptance/config.yaml`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 4 (assertion âm-tính-một-mình): ca vai ops ở NH-AC-5 xanh suông khi loader trả {}**
  Người dùng thấy gì: Phép kiểm tự động chưa chắc bắt được trường hợp vai Vận hành mất ảnh đã tải, nên nếu lỗi đó xảy ra về sau có thể không ai báo.
  Căn cứ: Hiện chưa có bằng chứng sản phẩm hỏng; rủi ro chỉ là bỏ sót lỗi tương lai, người dùng tải lại là thấy và sửa phép kiểm sau rất rẻ.
  file: `app/tests/media-canonical.test.tsx`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 4 (assertion âm-tính-một-mình): TD-AC-5 hàng chờ ReviewQueue chỉ kiểm vắng, không đối chứng dương**
  Người dùng thấy gì: Phép kiểm xác nhận hàng chờ không hiện điểm tự tin có thể xanh dù hàng chờ không hiển thị gì, nên chưa chắc đã chứng minh được điều đó.
  Căn cứ: Không có hậu quả đã xảy ra với người duyệt, chỉ là phép kiểm chưa đủ chặt, và có thể siết lại sau với chi phí thấp.
  file: `app/tests/the-duyet-du-can-cu.test.tsx`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 4 (assertion âm-tính-một-mình): probe TD-AC-3 có thể không đo toàn văn lần nào mà vẫn xanh**
  Người dùng thấy gì: Phép kiểm toàn văn tin có thể đo trên dữ liệu rỗng và vẫn báo xanh, nên chưa chắc đã xác nhận mọi thẻ có bài đều hiện đủ toàn văn.
  Căn cứ: Hậu quả chỉ là độ tin cậy của phép kiểm thấp hơn, không làm hỏng việc duyệt; người duyệt thấy ngay nếu thiếu toàn văn và phép kiểm có thể bổ sung sau.
  file: `app/tests/the-duyet-du-can-cu.test.tsx`
  severity: low
  Đề xuất: known-limits

⚠ Cụm ngoài vùng phủ: 2/5 lỗi rơi vào file không bộ đo nào phủ (_acceptance/config.yaml, app/tests/media-canonical.test.tsx) — dừng và quyết: mở rộng hợp đồng hay rút phạm vi.
