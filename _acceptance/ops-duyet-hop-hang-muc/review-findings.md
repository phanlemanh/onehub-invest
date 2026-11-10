# Review findings: ops-duyet-hop-hang-muc (round 2)

## Trong hợp đồng

(không có)

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Thêm nguyên block ReUI Pro solution-agents-9 (kèm reui/icon-stack) vào kho đã công khai, trong khi việc giấy phép Pro trên repo public Mạnh đang hoãn quyết**
  Người dùng thấy gì: Mã mẫu trả phí của bên thứ ba có thể nằm lộ trên kho công khai. Người dùng cuối không thấy gì, nhưng chủ dự án có thể vướng điều khoản giấy phép.
  Căn cứ: Không ảnh hưởng người dùng cuối và không mất dữ liệu; đây là rủi ro pháp lý đã nằm trong việc Mạnh đang hoãn quyết, gỡ sau rẻ.
  file: `app/src/components/blocks/solution-agents-9/components/memory-manager.tsx`
  severity: medium
  Đề xuất: known-limits

- **Skeleton của /ops/review không đổi theo bố cục mới: vẫn tiêu đề h1 cũ, không PageHeader ba số, không hộp hạng mục, không Frame Quyết định gần đây**
  Người dùng thấy gì: Trong lúc trang Hàng duyệt đang tải, người duyệt thấy khung cũ rồi bố cục nhảy sang khung mới khi tải xong.
  Căn cứ: Chỉ là giật hình thoáng qua, tải lại hay chờ là hết, không mất dữ liệu; sửa sau không tốn kém.
  file: `app/src/components/ops/review-content.tsx`
  severity: medium
  Đề xuất: known-limits

- **Định nghĩa Hộp hạng mục trong CONTEXT.md ghi chỉ hạng mục đang có thẻ chờ, trái với code liệt mọi hạng mục có thẻ (kể cả 0 thẻ chờ)**
  Người dùng thấy gì: Người đọc từ vựng dự án sẽ hiểu sai hộp hạng mục chỉ liệt hạng mục còn thẻ chờ, trong khi thực tế còn hiện cả hạng mục đã hết thẻ chờ.
  Căn cứ: Giao diện người dùng đúng, chỉ tài liệu nội bộ lệch; không mất dữ liệu và sửa một câu là xong.
  file: `CONTEXT.md`
  severity: low
  Đề xuất: known-limits

- **Đặt padding lên component đã cài (Empty p-0) trong Quyết định gần đây**
  Người dùng thấy gì: Ô trống của mục Quyết định gần đây có khoảng đệm khác chuẩn một chút so với các ô trống khác.
  Căn cứ: Chỉ lệch thẩm mỹ rất nhẹ, không ảnh hưởng thao tác hay dữ liệu; công sửa không đáng kể nhưng cũng không đáng mở việc.
  file: `app/src/components/ops/review/review-gan-day.tsx`
  severity: low
  Đề xuất: wont-fix

- **Lệnh quyết bị xả khi gỡ HangGuiProvider (chuyển route trong app) bỏ qua mọi kết quả: lỗi 4xx/5xx và lỗi mạng bị nuốt im lặng**
  Người dùng thấy gì: Nếu người duyệt bấm đáp án rồi chuyển ngay sang mục khác trong 5 giây và lần ghi đó lỗi, họ vẫn thấy thông báo đã ghi nên tin là xong. Thẻ thực tế vẫn chờ duyệt, và nút Hoàn tác còn báo sai là đã ghi.
  Căn cứ: Gây hiểu nhầm là đã duyệt xong nhưng chỉ xảy ra khi vừa chuyển trang vừa gặp lỗi; thẻ không mất, vẫn còn trong hàng chờ và người duyệt tự làm lại được.
  file: `app/src/components/ops/review/hang-gui.tsx`
  severity: medium
  Đề xuất: new-contract

- **Hình dạng 4 (không ghim thông điệp): chiều đỏ chấp nhận mọi assert của ca qua nhánh «|OD2-AC-n»**
  Người dùng thấy gì: Phép thử bắt lỗi lệch thẻ giữa các hạng mục có thể báo đỏ vì lý do khác nên khó biết đúng lỗi đó có bị bắt không. Lỗi thật có thể lọt mà không ai để ý.
  Căn cứ: Không ảnh hưởng người dùng trực tiếp, chỉ làm lưới an toàn của bộ thử yếu hơn; siết lại sau không tốn nhiều.
  file: `app/tests/ops-duyet-hop-hang-muc.test.tsx`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 3 (chuỗi/hiệu ứng có mặt thay cho quan hệ): phím '1' chỉ kiểm thẻ đổi, không kiểm đúng nút số 1**
  Người dùng thấy gì: Bộ thử chưa chắc chắn phím 1 bấm đúng đáp án số 1. Nếu sau này phím bấm nhầm đáp án khác, thẻ có thể bị quyết sai mà thử nghiệm vẫn xanh.
  Căn cứ: Hiện chưa có bằng chứng phím sai; rủi ro chỉ xuất hiện khi mã đổi về sau, và bổ sung một phép kiểm là rẻ.
  file: `app/tests/ops-duyet-hop-hang-muc.test.tsx`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 5 (tuyên ma trận nhưng chỉ có điểm-case): «ma trận 12 phím × vị trí tiêu điểm» là bộ đếm tự tăng**
  Người dùng thấy gì: Một số phím tắt như 2, 3, 4 hay khi đang gõ ở ô lý do chưa được thử nghiệm kiểm hết, nên có thể có lỗi phím tắt chưa ai thấy.
  Căn cứ: Không có lỗi thật được chỉ ra; người duyệt vẫn bấm chuột được nếu phím hỏng, và bổ sung ca thử sau không đắt.
  file: `app/tests/ops-duyet-hop-hang-muc.test.tsx`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 4 (âm tính một mình): Meta+k «không bị bắt» không có đối chứng dương phím k trần bị bắt**
  Người dùng thấy gì: Bộ thử có thể không phát hiện nếu phím K thường ngừng hoạt động. Người duyệt khi đó mất phím tắt đi lùi thẻ.
  Căn cứ: Đường chiếm phím vỏ Ops vẫn được ca khác bảo vệ, hậu quả nhẹ và người dùng vẫn dùng chuột được.
  file: `app/tests/ops-duyet-hop-hang-muc.test.tsx`
  severity: low
  Đề xuất: wont-fix

- **Hình dạng 3 (đếm/thứ tự thay cho quan hệ «20 lượt MỚI NHẤT»)**
  Người dùng thấy gì: Bộ thử chưa chứng minh mục Quyết định gần đây chọn đúng 20 lượt mới nhất. Nếu sai, người duyệt có thể thấy lượt cũ thay vì lượt mới.
  Căn cứ: Chỉ là khoảng hở trong thử nghiệm, chưa thấy lỗi thật; người duyệt chỉ xem lại nên không mất dữ liệu, bổ sung phép kiểm rẻ.
  file: `app/tests/ops-duyet-hop-hang-muc.test.tsx`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 4 (âm tính một mình): nhánh lỗi route của RQ-AC-5 không còn đối chứng dương nào**
  Người dùng thấy gì: Bộ thử không còn xác nhận rằng khi ghi lỗi thì người duyệt thấy thông báo lỗi và thẻ quay lại hàng chờ. Lỗi nuốt im lặng có thể lọt qua.
  Căn cứ: Chưa có bằng chứng lỗi thật; rủi ro nằm ở việc phát hiện muộn, và dựng lại phép kiểm không tốn nhiều.
  file: `app/tests/review-queue.test.tsx`
  severity: low
  Đề xuất: known-limits

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
