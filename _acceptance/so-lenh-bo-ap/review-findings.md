## Trong hợp đồng

- **Hình dạng 4 (âm tính một mình, không ghim thông điệp): SL-AC-2 chỉ assert 400 cho 8 lời gọi xấu, không ghim ly_do**
  file: `app/tests/so-lenh.test.tsx:162`
  severity: medium
  AC: AC-2
  source: measurement
  detail: Dòng 162 `for (const [ten, o] of xau) assert.equal((await tao(o)).status, 400, ten)` chỉ so mã trạng thái, trong khi route trả `{error, ly_do}`. Các ô «khoá cấm sâu 3» (`payload {reason, a:{b:{bindings:[]}}}`) và «requireMention» đều chứa khoá ngoài danh sách cho phép (`a`, `requireMention`). Nếu route bỏ hẳn bước dò khoá cấm, hoặc chỉ truyền payload mà không truyền cả lệnh, hai ô này vẫn ra 400 qua `khoa-thua:a` / `khoa-thua:requireMention`, và ca vẫn xanh. Phép đo không phân biệt được «chặn vì khoá cấm» với «chặn vì khoá thừa». Cần deepEqual ly_do, ví dụ `khoa-cam:bindings`, như lenh.test.mjs đã làm ở mức hàm.

- **Hình dạng 3 (assert có mặt thay cho quan hệ): SL-AC-8 chỉ kiểm finished_at và result khác rỗng, không so với tệp kết quả**
  file: `app/tests/so-lenh.test.tsx:334`
  severity: medium
  AC: AC-8
  source: measurement
  detail: E8 hứa «Q1 'applied' before/after/result/finished_at đúng tệp». Dòng 334 chỉ có `assert.ok(q1.finished_at && q1.result)`. Route ghi `result = {outcome, ly_do, applied_at}` lấy từ tệp, nhưng test không so `result.applied_at` với `"2026-11-10T00:00:00Z"` của Q1, cũng không so `result.outcome`. Với Q2 và Q3 (dòng 335-336), test chỉ so status, không kiểm `result.ly_do` có bằng 'tien-dieu-kien:nguon-paused' và 'kiem-sau-hong' trong tệp không. Route ghi result sai trường hay đảo ly_do giữa các lệnh thì ca vẫn xanh.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Plist ops-apply gọi `/usr/bin/env node` trực tiếp, nhưng launchd không có node trong PATH**
  Người dùng thấy gì: Khi nạp lịch chạy 60 giây trên máy thu, mỗi lượt sẽ hỏng ngay vì không tìm thấy node. Máy thu không bao giờ nhận lệnh và màn Ops chỉ thấy mốc kéo cuối đứng yên.
  Căn cứ: Chưa gây hại vì chưa nạp lịch, và chỉ lộ ra khi triển khai, nhưng nếu không sửa thì tính năng không chạy được; sửa rẻ và an toàn trước khi nạp.
  file: `pipeline/cron/com.oneinvest.ops-apply.plist`
  severity: medium
  Đề xuất: new-contract

- **Route ingest khai chế độ `ops` trong sổ bề mặt nhưng nay nhận cả token máy theo tên, tức là sổ hẹp hơn mã**
  Người dùng thấy gì: Danh sách khai báo các cổng API ghi hẹp hơn thực tế: đường báo kết quả lệnh nhận thêm loại token máy mà danh sách không nêu. Người dùng không thấy khác biệt nào, chỉ là tài liệu lệch.
  Căn cứ: Không mất dữ liệu và không mở quyền ngoài ý muốn vì token máy vẫn bị kiểm scope; chỉ là sổ ghi chưa đủ, ghi lại rồi sửa sau.
  file: `app/src/app/api/v1/ops/ingest/route.ts`
  severity: medium
  Đề xuất: known-limits

- **A non-string resume_when passes validation, then makes apLenh throw and blocks the queue**
  Người dùng thấy gì: Một lệnh tạm dừng nguồn có trường hẹn bật lại sai kiểu vẫn được nhận và duyệt, rồi làm bộ áp trên máy thu hỏng mỗi lượt. Cả hàng lệnh sau nó bị kẹt cho tới khi ai đó sửa tay.
  Căn cứ: Hậu quả nặng vì chặn toàn bộ hàng lệnh và không tự gỡ được, nhưng cần người có quyền ops gửi lệnh sai khuôn; nên sửa sớm trước khi mở cho người dùng.
  file: `pipeline/lib/lenh.mjs`
  severity: high
  Đề xuất: new-contract

- **One result that trips the tier-A check blocks reporting for the whole batch, every run**
  Người dùng thấy gì: Nếu một kết quả lệnh chứa tên nguồn thật, cả đợt kết quả bị giữ lại và các lệnh khác trong đợt cũng không được báo lên cloud. Tên nguồn thật vẫn không rời máy.
  Căn cứ: Thiên về an toàn: không lộ dữ liệu tầng A, chỉ làm chậm báo cáo và hiếm xảy ra, nên ghi lại là giới hạn đã biết.
  file: `pipeline/push-ops-facts.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 4 (âm tính một mình): đối chứng «khuôn lệnh» của SL-NOI chỉ kiểm lệnh vẫn queued, bỏ qua mã thoát và thông điệp của ops-apply**
  Người dùng thấy gì: Bài kiểm phụ cho mối nối khuôn lệnh có thể xanh vì lý do khác với lý do dự định. Người dùng không thấy ảnh hưởng gì khi dùng tính năng.
  Căn cứ: Chỉ là độ chặt của một phép thử phụ, không ảnh hưởng dữ liệu hay người dùng; chi phí sửa không đáng so với hậu quả.
  file: `app/tests/so-lenh.test.tsx`
  severity: low
  Đề xuất: wont-fix

## Chưa adversarial-verify (refuter chết)

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).

