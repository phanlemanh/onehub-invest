# Review findings: hieu-chuan-mot-bo-so

## Trong hợp đồng

Không có.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Tên nguồn thật (tầng A) bị in ra stderr khi lệnh eval che tầng A lỗi**
  Người dùng thấy gì: Nếu bước che tên nguồn thật gặp lỗi lúc chụp trang, thông báo lỗi có thể in ra chính danh sách tên thật. Người vận hành dán kết quả đó vào hồ sơ nghiệm thu trong kho công khai sẽ vô tình để lộ tên nguồn.
  Căn cứ: Hậu quả nặng vì là dữ liệu tầng A có thể ra kho công khai, nhưng chỉ xảy ra khi bước chụp gặp lỗi; sửa sau rẻ và nên làm trong một việc riêng về an toàn bước chụp.
  file: `scripts/ui-capture-login.mjs`
  severity: medium
  Đề xuất: new-contract

- **getAirdnaComparison đếm lại listing của toàn bảng cho mỗi thị trường**
  Người dùng thấy gì: Trang Chất lượng có thể tải chậm hơn cần thiết vì cùng một phép đếm listing bị lặp lại cho từng thị trường. Số hiển thị vẫn đúng.
  Căn cứ: Chỉ làm chậm trang vận hành nội bộ, không sai số liệu, người dùng tải lại là xong; chưa có số đo chậm thật nên ghi nhận và chờ.
  file: `app/src/lib/queries.ts`
  severity: low
  Đề xuất: known-limits

- **capture.ui bỏ mất bước kiểm tệp ảnh đã được ghi**
  Người dùng thấy gì: Hiếm khi bước chụp có thể báo thành công và in đường dẫn ảnh dù ảnh không hề được tạo. Người nghiệm thu sẽ nhận bằng chứng rỗng mà không có cảnh báo.
  Căn cứ: Nhẹ vì người ký mở hồ sơ sẽ thấy ngay thiếu ảnh và chạy lại được, không mất hay lộ dữ liệu; sửa sau rẻ.
  file: `scripts/ui-capture-login.mjs`
  severity: low
  Đề xuất: known-limits

- **Mật khẩu tài khoản ops thử gửi tới bất kỳ origin nào có đường /ops**
  Người dùng thấy gì: Nếu ai chụp nhầm một địa chỉ thật (bản chạy chính thức hay bản xem trước) có trang /ops, mật khẩu của tài khoản thử trên máy sẽ bị gửi ra ngoài máy.
  Căn cứ: Tài khoản này chỉ tồn tại trên DB máy local và khó dùng được ở nơi khác nên rủi ro thấp; chỉ xảy ra khi gõ nhầm địa chỉ, và đổi mật khẩu thử là khắc phục được.
  file: `scripts/ui-capture-login.mjs`
  severity: low
  Đề xuất: known-limits

- **Tỉ lệ «Listing» của thẻ hiệu chuẩn chia số của cả khu vực cho số S02 của một market đại diện, nên lệch với bảng Độ phủ**
  Người dùng thấy gì: Với khu vực có nhiều thị trường S02 như Cần Thơ, tỉ lệ listing trên thẻ hiệu chuẩn có thể bị thổi lên và hiện cờ lệch lớn sai, trong khi bảng Độ phủ cho tỉ lệ khác cho cùng khu vực.
  Căn cứ: Gây hiểu nhầm về độ phủ ở các khu vực gộp nhiều thị trường và làm hai bảng mâu thuẫn nhau, nhưng chỉ ở màn vận hành nội bộ và số gốc vẫn đúng; nên xử lý trong một việc riêng cùng quyết định cách tính tỉ lệ.
  file: `app/src/lib/queries.ts`
  severity: medium
  Đề xuất: new-contract

- **Bước chụp không còn kiểm tệp ảnh đã được ghi: trả 0 và in đường dẫn dù không có ảnh**
  Người dùng thấy gì: Bước chụp có thể báo xong và in đường dẫn dù ảnh không có thật, khiến hồ sơ nghiệm thu thiếu ảnh mà không ai được báo.
  Căn cứ: Nhẹ vì lỗi lộ ra ngay khi mở hồ sơ và chụp lại được, không mất hay lộ dữ liệu; sửa sau rẻ.
  file: `scripts/ui-capture-login.mjs`
  severity: medium
  Đề xuất: known-limits

- **Phép đo E7 «tự thu bằng nhau ở ba nguồn» luôn đúng vì cả ba hàm cùng đọc một helper**
  Người dùng thấy gì: Dòng báo «tự thu bằng nhau ở ba nguồn» luôn xanh nên không phát hiện được nếu cách đếm listing tự thu bị sai ở các khu vực nhiều tầng. Người đọc có thể tin hơn mức bằng chứng cho phép.
  Căn cứ: Không làm sai số hiển thị cho người dùng, chỉ làm bằng chứng kiểm yếu hơn vẻ ngoài; ghi nhận để người ký biết, bổ sung phép đo độc lập khi có dịp.
  file: `scripts/hieu-chuan-do.mjs`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 3 (assert chuỗi có mặt thay cho quan hệ): HC-AC-6 quét mã nguồn page.tsx thay vì so số đầu trang với số thẻ đã vẽ**
  Người dùng thấy gì: Bài kiểm tự động cho việc «số thị trường ở đầu trang bằng số thẻ vẽ» chỉ đọc mã nguồn, nên nếu sau này sửa trang làm hai con số lệch nhau thì bài kiểm vẫn có thể xanh.
  Căn cứ: Hiện trang vẫn đúng, rủi ro chỉ là bắt chậm một lỗi tương lai ở màn vận hành nội bộ; người vận hành thấy lệch là báo được, sửa sau rẻ.
  file: `app/tests/hieu-chuan.test.tsx`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 2 (fixture viết tay đúng khuôn bên đọc): chiều đỏ của UC-AC-9 bị runner giả quyết định sẵn, không chạy bản cũ của ui-capture.sh**
  Người dùng thấy gì: Bài kiểm «bản cũ không đăng nhập thì bị đưa về trang đăng nhập» dùng bản giả tự trả kết quả định sẵn, nên chưa đo hành vi thật của bản cũ. Ảnh chụp thật mới là bằng chứng đăng nhập thành công.
  Căn cứ: Không ảnh hưởng người dùng cuối, chỉ làm bằng chứng tự động yếu hơn; ảnh chụp thật bù lại phần chính nên chấp nhận và ghi vết.
  file: `scripts/ui-capture-login.test.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 4 (assertion âm tính một mình): đối chứng định nghĩa cũ ở HC-AC-2 chỉ assert notEqual 7, không ghim giá trị cũ**
  Người dùng thấy gì: Bài kiểm đối chiếu «cách đếm cũ ra số khác» có thể xanh ngay cả khi truy vấn cũ trả rỗng, nên chứng minh yếu hơn mong muốn. Số mà người vận hành thấy trên trang không bị ảnh hưởng.
  Căn cứ: Chỉ là phép đối chiếu minh hoạ cho định nghĩa đã bỏ, không tác động đến số hay trang người dùng; chi phí siết lại vượt xa lợi ích nên ghi vết, không mở việc.
  file: `app/tests/hieu-chuan.test.tsx`
  severity: low
  Đề xuất: wont-fix

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
