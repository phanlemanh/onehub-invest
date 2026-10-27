# Review findings: dong-chay-len-cloud (round 3)

## Trong hợp đồng

Không có.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Khối dataFlow từ ops_heartbeat được ép kiểu thẳng thành FlowFacts, không kiểm khuôn ở ranh giới cloud (lệch mẫu toCloudS03/toCloudLockdown)**
  Người dùng thấy gì: Nếu máy thu đẩy lên một khối số dòng chảy bị thiếu hoặc sai khuôn, cả trang Dòng chảy trên cloud có thể rơi vào màn hình lỗi, hoặc đầu trang ghi «0 thẻ chờ duyệt» thay vì «không đo được».
  Căn cứ: Chỉ xảy ra khi máy thu đẩy dữ liệu hỏng hoặc hai bên lệch phiên bản; người vận hành tải lại hoặc chờ lượt đẩy sau là hết, nhưng trong lúc đó có thể thấy số 0 sai.
  file: `app/src/lib/data-flow-queries.ts`
  severity: medium
  Đề xuất: known-limits

- **On the collector machine the precomputed numbers always count as 'fresh', so a refresh that keeps failing shows old numbers with no warning**
  Người dùng thấy gì: Trên máy thu, nếu bước làm tươi số dòng chảy hỏng kéo dài, trang vẫn vẽ số cũ mà không có cảnh báo nào, chỉ có giờ tính nhỏ ở đầu trang.
  Căn cứ: Người vận hành có thể tin nhầm số cũ là số hiện tại trong nhiều giờ hoặc nhiều ngày, nhưng giờ tính vẫn hiện nên tự phát hiện được nếu để ý; sửa sau không đắt.
  file: `app/src/lib/data-flow-queries.ts`
  severity: medium
  Đề xuất: new-contract

- **A missing table (migration 051 not applied) is turned into 'none', and the page says 'not refreshed yet' instead of the real cause**
  Người dùng thấy gì: Ngay sau khi gộp, nếu máy thu chưa áp bản cập nhật cơ sở dữ liệu, trang báo «chưa làm tươi» và bảo chờ, trong khi chờ mãi cũng không có số.
  Căn cứ: Chỉ gặp một lần quanh lúc triển khai và hết ngay khi áp bản cập nhật; hậu quả là thông điệp gây hiểu nhầm chứ không mất hay lộ dữ liệu.
  file: `app/src/lib/data-flow-queries.ts`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 3: assert chuỗi có mặt thay cho quan hệ. DC-AC-8 so bậc trên lưới với chính levelOf mà renderer gọi**
  Người dùng thấy gì: Bài kiểm của bảng «Tin mới nhất» trên cloud có thể vẫn xanh dù bậc B0/B1/B2 của từng tin hiển thị sai, nên một lỗi về bậc có thể lọt mà không ai biết.
  Căn cứ: Không ảnh hưởng người dùng ngay vì hiện chưa có lỗi thật, chỉ làm mất một lớp bảo vệ về sau; bổ sung bảng bậc mong đợi sau này rẻ.
  file: `app/tests/dong-chay-cloud.test.tsx`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 2: fixture viết tay đúng khuôn bên đọc. Khối lỗi ở DC-AC-7 không rút từ writer**
  Người dùng thấy gì: Bài kiểm trạng thái «không đo được» dùng khối lỗi gõ tay, nên nếu máy thu đổi dạng báo lỗi mà trang chưa đổi theo thì bài kiểm vẫn xanh.
  Căn cứ: Rủi ro nhỏ vì phần ghi lỗi của máy thu đã có bài kiểm riêng; lỗi nếu có chỉ làm trang hiện sai chữ trạng thái và sửa dễ.
  file: `app/tests/dong-chay-cloud.test.tsx`
  severity: low
  Đề xuất: wont-fix

- **Hình dạng 1: đo chỉ dẫn thay vì đầu ra. Chiều đỏ «bỏ điều kiện bài thử» của DF-AC-2 chạy câu tự viết, không chạy 600**
  Người dùng thấy gì: Một ca kiểm số bài nhận chạy câu đếm tự dựng thay vì bước tính thật, nên ca đó không bắt được việc số bài thử lọt vào số bài nhận.
  Căn cứ: Đã có ca kiểm khác bắt đúng lỗi này trên đầu ra thật, nên hậu quả với người dùng gần như không có và sửa không đáng chi phí.
  file: `app/tests/ops-dong-chay.test.tsx`
  severity: low
  Đề xuất: wont-fix

- **Hình dạng 4: assertion âm tính một mình. numericRegions của DC-AC-7 thiếu đối chứng dương cho ba trong bốn bộ dò**
  Người dùng thấy gì: Bài kiểm khẳng định trang không ghi «0 bài» khi vắng hoặc lỗi có thể xanh một cách vô nghĩa nếu bộ dò viết sai, nên lỗi vẽ số 0 giả có thể lọt.
  Căn cứ: Chỉ mất một lớp bảo vệ, không ảnh hưởng người dùng hôm nay; thêm ca đối chứng có số rất rẻ và làm sau được.
  file: `app/tests/dong-chay-cloud.test.tsx`
  severity: low
  Đề xuất: known-limits

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
