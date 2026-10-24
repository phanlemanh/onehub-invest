# Review findings: compare-saved-trang-thai (round 3)

## Trong hợp đồng

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Hình dạng 3 (assert 'giá trị có mặt' trong khi lời hứa là QUAN HỆ): số cột/thẻ của skeleton chỉ so với hằng 3 trên fixture cỡ 3 (r2 · tệp đã đổi)**
  Người dùng thấy gì: Màn hình chờ của So sánh và Đã lưu hiện đúng số cột và số thẻ hiện nay. Nếu sau này ai đó sửa sai, bộ kiểm có thể không báo, khiến màn hình chờ nhảy bố cục khi dữ liệu về.
  Căn cứ: Hiện người dùng không gặp lỗi nào, chỉ là lưới kiểm yếu cho lần sửa sau; nếu có lỗi thì cũng chỉ là nhảy bố cục thoáng qua, tự hết khi tải xong, và bổ sung thêm một cỡ kiểm sau này rất rẻ.
  file: `app/tests/compare-saved.test.tsx`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 4 (assert phủ định đứng một mình): 'không loading.tsx' chỉ là existsSync === false, không có đối chứng dương (r2 · tệp đã đổi)**
  Người dùng thấy gì: Việc kiểm rằng trang Đã lưu và So sánh không dùng màn chờ cấp segment có thể trượt nếu thư mục bị đổi tên, nhưng người dùng hiện không bị ảnh hưởng gì.
  Căn cứ: Không ảnh hưởng người dùng hiện tại; nếu có hồi quy thì việc chuyển hướng về đăng nhập của trang Đã lưu vẫn bị kiểm riêng bằng smoke, nên rủi ro thấp và không đáng mở việc.
  file: `app/tests/compare-saved.test.tsx`
  severity: low
  Đề xuất: wont-fix

- **design_pass toàn cục trong config.yaml bị ghim vào cổng 3460 riêng của dãy U1 (r1)**
  Người dùng thấy gì: Kiểm giao diện của các hồ sơ nghiệm thu khác có thể mở nhầm bản chạy của dãy U1 và chụp trên mã nguồn của cây làm việc khác. Người dùng cuối không bị ảnh hưởng, chỉ có bằng chứng kiểm giao diện của dãy khác có thể sai nguồn.
  Căn cứ: Chỉ ảnh hưởng người chấm nội bộ, không tới người dùng cổng Invest; nhận ra ngay khi chạy dãy khác và sửa sau rất rẻ.
  file: `_acceptance/config.yaml`
  severity: low
  Đề xuất: known-limits

- **Header So sánh đếm và khoá nút theo mã đã lọc qua chỉ mục, còn bảng âm thầm bỏ khu vực không có market_metrics (r1)**
  Người dùng thấy gì: Người dùng chọn một khu vực chưa có số liệu thì tiêu đề ghi «2/4 khu vực» nhưng bảng chỉ hiện 1 cột, hoặc trống. Nếu chọn đủ 4 khu vực như vậy, nút «Thêm khu vực» bị tắt, bảng trống và không có nút gỡ nào, người dùng phải tự sửa địa chỉ trang.
  Căn cứ: Gây kẹt và số hiển thị sai lệch với bảng, nhưng không mất dữ liệu và thoát được bằng cách sửa địa chỉ; đáng làm thành việc riêng vì chạm cách đếm và lọc khu vực.
  file: `app/src/components/compare/compare-body.tsx`
  severity: medium
  Đề xuất: new-contract

- **RegionError không reset khi đổi cột: catchError chỉ xoá lỗi khi pathname đổi, mà thêm cột chỉ đổi ?areas= (r1)**
  Người dùng thấy gì: Khi bảng So sánh đã báo lỗi, người dùng thêm hoặc đổi khu vực vẫn thấy thông báo lỗi cũ cho tới khi bấm «Thử lại». Bảng của bộ khu vực mới không hiện ngay.
  Căn cứ: Chỉ xảy ra sau một lỗi tải, và người dùng thoát được ngay bằng nút «Thử lại» hoặc tải lại trang; không mất dữ liệu.
  file: `app/src/components/compare/compare-body.tsx`
  severity: low
  Đề xuất: known-limits

## Chưa adversarial-verify (refuter chết)

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
