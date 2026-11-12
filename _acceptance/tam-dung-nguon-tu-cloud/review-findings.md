## Trong hợp đồng

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Nút Tạm dừng/Bật lại trên đường máy thu ghi lệnh vào DB local, bộ áp không bao giờ kéo lệnh này**
  Người dùng thấy gì: Trên màn của máy thu, người vận hành vẫn thấy nút Tạm dừng/Bật lại và bấm được. Lệnh gửi từ đó không bao giờ tới nguồn thu, nằm mãi ở «Chờ máy thu nhận», trong khi người bấm tưởng nguồn đã dừng.
  Căn cứ: Nguồn vẫn tiếp tục thu dù người dùng tin là đã dừng, nhưng lệnh hiện rõ trạng thái chờ nên không mất dữ liệu; việc dùng đúng chỗ (cloud) là cách tránh, và chỉnh nút máy thu là việc nhỏ có thể làm ở hàng riêng.
  file: `app/src/components/ops/collections/collections-view.tsx`
  severity: high
  Đề xuất: new-contract

- **Duyệt/Từ chối trong «Lệnh gần đây» nuốt lỗi, không có lỗi hiện tại chỗ**
  Người dùng thấy gì: Khi bấm Duyệt hoặc Từ chối mà bị từ chối (người khác đã quyết trước, hết quyền, lỗi mạng), màn không báo gì, người bấm không biết lần bấm của mình không có tác dụng.
  Căn cứ: Không mất hay lộ dữ liệu, danh sách tải lại nên người dùng thấy trạng thái thật và có thể bấm lại; chỉ gây khó hiểu nhẹ.
  file: `app/src/components/ops/collections/lenh-gan-day.tsx`
  severity: medium
  Đề xuất: known-limits

- **Duyệt/Từ chối nuốt mọi lỗi: không kiểm res.ok, catch trả null, người bấm không thấy gì**
  Người dùng thấy gì: Bấm Duyệt hoặc Từ chối thất bại thì không có thông báo nào; quản trị viên không biết lệnh vẫn chưa được quyết.
  Căn cứ: Không mất dữ liệu và tự khắc phục được bằng cách đọc lại danh sách rồi bấm lại; hậu quả chỉ là thiếu phản hồi.
  file: `app/src/components/ops/collections/lenh-gan-day.tsx`
  severity: medium
  Đề xuất: known-limits

- **Duyệt lệnh S03 xoá lý do: route decide ghi đè cột note bằng null, mà lý do của lệnh Bật lại chỉ nằm ở note**
  Người dùng thấy gì: Sau khi người thứ hai duyệt lệnh Bật lại nguồn S03, lý do người gửi đã nhập biến mất khỏi sổ lệnh, cột Lý do chỉ còn dấu gạch.
  Căn cứ: Mất vĩnh viễn một dòng giải thích trong sổ lệnh, ảnh hưởng truy vết nhưng không đổi hành vi thu; chỉ gặp với lệnh nhắm S03 và sửa nhỏ nên nên làm ở hàng kế.
  file: `app/src/app/api/v1/ops/change-requests/[id]/decide/route.ts`
  severity: medium
  Đề xuất: new-contract

- **Một lần tải lỗi trong nhịp 30″ thay danh sách lệnh bằng Alert và dừng luôn vòng tự tải**
  Người dùng thấy gì: Khi mạng chập chờn lúc vùng Lệnh gần đây đang tự làm mới, danh sách bị thay bằng thông báo lỗi và ngừng tự cập nhật; người dùng phải bấm Thử lại.
  Căn cứ: Chỉ xảy ra khi có lỗi mạng tạm thời, người dùng tự khắc phục bằng Thử lại hoặc tải lại trang, không mất dữ liệu.
  file: `app/src/components/ops/collections/lenh-gan-day.tsx`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 2: fixture viết tay đúng khuôn bên đọc, không đi qua đường ghi. E10 dựng FeedsGrid với thaoTac.lenh và factsPushedAt bơm thẳng, bỏ qua NguonVaLenh/LenhGanDay và CloudCollections**
  Người dùng thấy gì: Bài kiểm tự động chưa chứng minh được danh sách lệnh tải về thực sự làm hàng nguồn đổi sang «Đang có lệnh chờ»; nếu nối dây này hỏng, kiểm tự động vẫn báo xanh.
  Căn cứ: Người dùng chưa gặp lỗi nào, chỉ là lưới an toàn mỏng; lỗi nếu có sẽ lộ ra ở bước xem màn thật và vá sau rẻ.
  file: `app/tests/tam-dung-nguon-ui.test.tsx`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 3: chỉ assert chuỗi có mặt (tiền tố 'user:') trong khi lời hứa là quan hệ: actor phải bằng mã của chính người xem**
  Người dùng thấy gì: Bài kiểm tự động chỉ kiểm mã người xem có dạng đúng, chưa kiểm đúng là mã của chính người đó; nếu ghép sai mã, nút Duyệt có thể hiện nhầm cho người gửi lệnh mà kiểm tự động không bắt được.
  Căn cứ: Rủi ro thấp, đường mã này đã có kiểm ở route phía máy chủ chặn tự duyệt lệnh S03, và siết lại câu kiểm là việc rất rẻ nếu muốn.
  file: `app/tests/dinh-danh-thu.test.tsx`
  severity: low
  Đề xuất: wont-fix

## Chưa adversarial-verify (refuter chết)

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
