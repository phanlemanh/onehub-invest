## Trong hợp đồng

Không có finding nào map được vào AC ở round này.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Hình dạng 3 (assert chuỗi có mặt thay cho quan hệ): dòng 'không tạo phiên' ở lần đăng ký trùng in ra mà không có phép đo nào**
  Người dùng thấy gì: Khi ai đó đăng ký lại bằng email đã có, bước kiểm tự động chỉ xác nhận bị đưa về trang đăng ký kèm lỗi, chưa chứng minh là không có phiên đăng nhập nào được cấp ngầm. Hiện hành vi thật không đổi; chỉ là phép kiểm lỏng hơn lời nó tuyên bố.
  Căn cứ: Không ảnh hưởng người dùng hiện tại vì logic đăng ký không bị đổi, chỉ thiếu lưới an toàn nếu sau này ai đó vô tình sửa hỏng; bổ sung phép đo sau này rẻ và không gấp.
  file: `scripts/dev-register-check.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 4 (assertion âm tính đứng một mình): /ops/sources chỉ kiểm '≠ 200', không có đối chứng dương rằng cookie vừa nhận là phiên hợp lệ**
  Người dùng thấy gì: Bước kiểm xác nhận người mới đăng ký không vào được khu Ops, nhưng không phân biệt được là do bị từ chối quyền hay do phiên đăng nhập hỏng. Người dùng thật không bị ảnh hưởng; chỉ là bằng chứng kiểm tra yếu hơn mức cần.
  Căn cứ: Khu Ops vẫn được chặn đúng với người dùng thường, nên không lộ dữ liệu; chỉ làm kết quả kiểm có thể xanh nhầm, sửa sau không tốn kém.
  file: `scripts/dev-register-check.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 4 (assertion âm tính đứng một mình): AH-AC-4 'không có nav/aside' không có đối chứng dương nên không thể đỏ vì đúng rủi ro nó nêu**
  Người dùng thấy gì: Khi trang đăng nhập hoặc đăng ký gặp lỗi, khách thấy cảnh báo với nút Thử lại; bài kiểm tự động xác nhận không có thanh điều hướng nhưng không thể tự đỏ nếu sau này vỏ cổng lọt vào trang lỗi. Hiện khách không gặp vấn đề gì.
  Căn cứ: Không có hậu quả hiện tại cho khách; rủi ro chỉ là bài kiểm không bắt được lỗi giao diện tương lai, khách tải lại được và sửa sau không đắt.
  file: `app/tests/auth-hop-chuan.test.tsx`
  severity: low
  Đề xuất: known-limits

- **Smoke đăng ký chỉ chặn DATABASE_URL, không chặn BASE_URL: trỏ vào máy khác sẽ tạo tài khoản thật ở đó mà không dọn (r1 · tệp đã đổi)**
  Người dùng thấy gì: Nếu ai đó chạy kiểm thử đăng ký nhầm vào bản chạy thật hoặc máy khác, một tài khoản thử sẽ bị tạo ở đó và không ai dọn. Khách dùng không bị ảnh hưởng trực tiếp, chỉ để lại tài khoản rác.
  Căn cứ: Chỉ xảy ra khi người dev tự trỏ nhầm địa chỉ, hậu quả nhẹ là một tài khoản rác xoá tay được, và việc thêm rào kiểm địa chỉ có thể làm riêng sau.
  file: `scripts/dev-register-check.mjs`
  severity: medium
  Đề xuất: known-limits

- **(auth)/error.tsx gọi reset() trong khi trang /register và /login lỗi ở phía server; kho đã có mẫu retry() cho đúng tình huống này (r1)**
  Người dùng thấy gì: Khi trang đăng nhập hoặc đăng ký lỗi vì dữ liệu tạm thời, bấm «Thử lại» có thể không khôi phục được và khách phải tự tải lại trang.
  Căn cứ: Khách tải lại trang là thoát được nên không mất dữ liệu, nhưng nút bấm không làm đúng việc nó hứa; sửa cần đổi cả hợp đồng lẫn kiểm thử nên nên mở việc riêng.
  file: `app/src/app/(auth)/error.tsx`
  severity: medium
  Đề xuất: new-contract

- **Bước kiểm vai `user` bị chặn khỏi Ops đạt với mọi mã khác 200, nên phiên hỏng hoặc server lỗi vẫn báo xanh (r1 · tệp đã đổi)**
  Người dùng thấy gì: Bài kiểm đăng ký đầu-cuối có thể báo đạt dù phiên vừa đăng ký không dùng được hoặc trang Ops đang lỗi. Khách không thấy gì khác, nhưng đội có thể tin nhầm là mọi thứ ổn.
  Căn cứ: Chỉ làm bài kiểm bớt nhạy, không ảnh hưởng khách và không mất dữ liệu; có thể siết lại sau mà không tốn nhiều.
  file: `scripts/dev-register-check.mjs`
  severity: medium
  Đề xuất: known-limits

- **Bước email trùng in 'không tạo phiên' nhưng không kiểm điều đó (r1 · tệp đã đổi)**
  Người dùng thấy gì: Bài kiểm in ra rằng đăng ký lại cùng email không tạo phiên nhưng thực ra không kiểm điều đó. Hiện app vẫn chạy đúng, chỉ là sau này nếu hỏng thì bài kiểm không báo.
  Căn cứ: App đang đúng nên khách không gặp gì; rủi ro chỉ là bỏ sót lỗi trong tương lai và sửa rất rẻ khi cần.
  file: `scripts/dev-register-check.mjs`
  severity: low
  Đề xuất: known-limits

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
