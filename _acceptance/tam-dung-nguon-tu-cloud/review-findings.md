# Review findings: tam-dung-nguon-tu-cloud (round 1)

## Trong hợp đồng

Không có.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Đường máy thu (không phải cloud) hiện nút Tạm dừng/Bật lại, nhưng lệnh được ghi vào DB local và bộ áp không bao giờ kéo**
  Người dùng thấy gì: Trên màn của máy thu, người vận hành vẫn thấy nút Tạm dừng/Bật lại và bấm được, nhưng lệnh không bao giờ được áp. Nguồn vẫn chạy trong khi người bấm tưởng đã dừng.
  Căn cứ: Chỉ xảy ra khi mở trang trên máy thu thay vì cloud, người dùng thấy dòng «Máy thu chưa kéo lệnh» nên tự nhận ra được, và không mất dữ liệu.
  file: `app/src/components/ops/collections/collections-view.tsx`
  severity: high
  Đề xuất: known-limits

- **Nút Duyệt/Từ chối nuốt mọi lỗi của route decide, người bấm không được báo**
  Người dùng thấy gì: Khi bấm Duyệt hoặc Từ chối mà bị từ chối (đã có người khác xử lý, mất quyền, mất mạng), màn không báo gì. Người bấm không biết lệnh chưa được duyệt.
  Căn cứ: Không mất dữ liệu và bảng tự tải lại nên người dùng thấy trạng thái thật, nhưng thiếu thông báo dễ gây nhầm; sửa nhỏ nên mở thành việc riêng.
  file: `app/src/components/ops/collections/lenh-gan-day.tsx`
  severity: medium
  Đề xuất: new-contract

- **Duyệt/Từ chối nuốt lỗi: decide 403/409/500 hay lỗi mạng không báo gì cho người bấm**
  Người dùng thấy gì: Bấm Duyệt hoặc Từ chối bị lỗi thì bảng chỉ tải lại, không có thông báo. Quản trị viên không biết lần duyệt của mình không có tác dụng.
  Căn cứ: Không mất dữ liệu và người dùng bấm lại hay tải lại được, nhưng thiếu thông báo dễ gây nhầm; gộp chung việc với lỗi cùng loại ở nút Duyệt.
  file: `app/src/components/ops/collections/lenh-gan-day.tsx`
  severity: medium
  Đề xuất: new-contract

- **Danh sách lệnh đang tải hoặc tải lỗi thì cột Thao tác coi như không có lệnh chờ, nên vẫn hiện nút Tạm dừng/Bật lại**
  Người dùng thấy gì: Khi danh sách lệnh chưa tải xong hoặc tải lỗi, nguồn đang có lệnh chờ vẫn hiện nút Tạm dừng/Bật lại. Người dùng có thể gửi thêm một lệnh trùng.
  Căn cứ: Chỉ xảy ra khi tải lỗi hoặc trong chốc lát lúc tải; lệnh trùng không gây mất dữ liệu và tải lại trang là hết.
  file: `app/src/components/ops/collections/nguon-va-lenh.tsx`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 3 (assert «chuỗi có mặt» thay cho quan hệ): actor chỉ được khớp tiền tố /^user:/ chứ không so với id của phiên**
  Người dùng thấy gì: Phép kiểm định danh người thao tác còn lỏng: nếu mã người thao tác bị ghi sai, test vẫn qua. Luật người gửi không tự duyệt có thể hỏng mà không bị phát hiện.
  Căn cứ: Chỉ là phép kiểm lỏng, hành vi thật chưa thấy sai; người dùng không bị ảnh hưởng và siết lại test sau rất rẻ.
  file: `app/tests/dinh-danh-thu.test.tsx`
  severity: medium
  Đề xuất: known-limits

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).

