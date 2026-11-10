## Trong hợp đồng

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Hình dạng 2 — fixture VIẾT TAY đúng khuôn bên đọc: cột result của SL-AC-8 ghim applied_at=null cho failed/reverted, khuôn mà bộ ghi apLenh không bao giờ sinh ra**
  Người dùng thấy gì: Người dùng không thấy gì sai: lệnh vẫn được áp và báo kết quả đúng. Chỉ có một phép kiểm tự động dùng dữ liệu mẫu viết tay khác với dữ liệu thật, nên nếu sau này cách ghi thời điểm áp của lệnh lỗi hay đảo ngược thì phép kiểm này có thể không báo.
  Căn cứ: Không ảnh hưởng người dùng hay dữ liệu hiện tại; chỉ làm lưới kiểm lỏng hơn ở một cột phụ, và có thể siết lại sau mà không mất gì.
  file: `app/tests/so-lenh.test.tsx`
  severity: medium
  Đề xuất: known-limits

- **Plist ops-apply gọi `/usr/bin/env node` trực tiếp, nhưng launchd không có node trong PATH (r1)**
  Người dùng thấy gì: Khi nạp lịch chạy 60 giây trên máy thu, mỗi lượt sẽ hỏng ngay vì không tìm thấy node. Máy thu không bao giờ nhận lệnh và màn Ops chỉ thấy mốc kéo cuối đứng yên.
  Căn cứ: Chưa gây hại vì chưa nạp lịch, và chỉ lộ ra khi triển khai, nhưng nếu không sửa thì tính năng không chạy được; sửa rẻ và an toàn trước khi nạp.
  file: `pipeline/cron/com.oneinvest.ops-apply.plist`
  severity: medium
  Đề xuất: new-contract

- **Route ingest khai chế độ `ops` trong sổ bề mặt nhưng nay nhận cả token máy theo tên, tức là sổ hẹp hơn mã (r1)**
  Người dùng thấy gì: Danh sách khai báo các cổng API ghi hẹp hơn thực tế: đường báo kết quả lệnh nhận thêm loại token máy mà danh sách không nêu. Người dùng không thấy khác biệt nào, chỉ là tài liệu lệch.
  Căn cứ: Không mất dữ liệu và không mở quyền ngoài ý muốn vì token máy vẫn bị kiểm scope; chỉ là sổ ghi chưa đủ, ghi lại rồi sửa sau.
  file: `app/src/app/api/v1/ops/ingest/route.ts`
  severity: medium
  Đề xuất: known-limits

- **A non-string resume_when passes validation, then makes apLenh throw and blocks the queue (r1 · tệp đã đổi)**
  Người dùng thấy gì: Một lệnh tạm dừng nguồn có trường hẹn bật lại sai kiểu vẫn được nhận và duyệt, rồi làm bộ áp trên máy thu hỏng mỗi lượt. Cả hàng lệnh sau nó bị kẹt cho tới khi ai đó sửa tay.
  Căn cứ: Hậu quả nặng vì chặn toàn bộ hàng lệnh và không tự gỡ được, nhưng cần người có quyền ops gửi lệnh sai khuôn; nên sửa sớm trước khi mở cho người dùng.
  file: `pipeline/lib/lenh.mjs`
  severity: high
  Đề xuất: new-contract

- **One result that trips the tier-A check blocks reporting for the whole batch, every run (r1)**
  Người dùng thấy gì: Nếu một kết quả lệnh chứa tên nguồn thật, cả đợt kết quả bị giữ lại và các lệnh khác trong đợt cũng không được báo lên cloud. Tên nguồn thật vẫn không rời máy.
  Căn cứ: Thiên về an toàn: không lộ dữ liệu tầng A, chỉ làm chậm báo cáo và hiếm xảy ra, nên ghi lại là giới hạn đã biết.
  file: `pipeline/push-ops-facts.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 4 (âm tính một mình): đối chứng «khuôn lệnh» của SL-NOI chỉ kiểm lệnh vẫn queued, bỏ qua mã thoát và thông điệp của ops-apply (r1 · tệp đã đổi)**
  Người dùng thấy gì: Bài kiểm phụ cho mối nối khuôn lệnh có thể xanh vì lý do khác với lý do dự định. Người dùng không thấy ảnh hưởng gì khi dùng tính năng.
  Căn cứ: Chỉ là độ chặt của một phép thử phụ, không ảnh hưởng dữ liệu hay người dùng; chi phí sửa không đáng so với hậu quả.
  file: `app/tests/so-lenh.test.tsx`
  severity: low
  Đề xuất: wont-fix

## Chưa adversarial-verify (refuter chết)

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).

