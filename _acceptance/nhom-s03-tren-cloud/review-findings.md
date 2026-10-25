## Trong hợp đồng

- **Khối s03 vẫn báo "đo được" với số 0 khi không đọc được nhật ký cổng**
  file: `pipeline/push-ops-facts.mjs:225`
  severity: medium
  AC: AC-7
  source: conventions
  detail: Dòng 175 đọc nhật ký cổng bằng `readFile(...oneinvest-zalo-pipe.log).catch(() => "")`. Khi đọc lỗi, `parseLog("")` trả `groups` rỗng. Lúc đó `zaloExtras` chỉ còn hàng lấy từ `stg_zalo_posts`, mỗi hàng mang `seen/passed/skipped/accepted = 0`. Khối `s03` mới (dòng 210-225) chỉ ném lỗi khi thiếu cấu hình OpenClaw, không xét việc nhật ký có đọc được hay không. Kết quả: bản tin gửi `{measured_at, allowlistEnabled, groups:[...0...]}` như một lần đo hợp lệ. Trên máy chủ, `toCloudS03` nhận khối này và vẽ bảng nhóm với «Qua cổng 0», «Vào bảng thô 0», không có cờ lỗi nào. Như vậy là trái quy ước của chính vùng thay đổi này: ADR-0014/ON22 quy định khối không đo được thì `{measured_at, error}`, và `scripts/lib/ops-local.mjs` ghi «NÉM khi không đo được — không bao giờ thay bằng 0». Thiết kế ON4 cũng chốt «thiếu facts thì «—», không 0». Cách sửa: trong `measure()` của khối s03, ném lỗi khi nhật ký cổng không đọc được, tức phân biệt tệp vắng hoặc lỗi đọc với tệp rỗng thật, thay cho việc mượn chuỗi rỗng từ bước đọc chung.

- **Khối s03 báo «đo được» khi không đọc được nhật ký cổng Kev: lỗi đọc bị nuốt thành chuỗi rỗng**
  file: `pipeline/push-ops-facts.mjs:174`
  severity: medium
  AC: AC-7
  source: bugs
  detail: `const logText = await readFile(...oneinvest-zalo-pipe.log).catch(() => "")` nuốt mọi lỗi đọc (ENOENT, EACCES...). parseLog("") trả groups = [] mà không báo gì. Khối s03 mới (dòng ~228) chỉ ném lỗi khi thiếu cấu hình OpenClaw, còn số từng nhóm lấy từ `zalo.groups` (zaloExtras gộp kết quả DB với funnel rỗng đó). Kết quả: khi nhật ký mất hoặc không đọc được, bản tin vẫn mang khối s03 không có `error` và được đánh `fresh`. Bảng nhóm S03 trên máy chủ hiện cột Thấy / Qua cổng / Bị chặn / Vào bảng thô = 0 cho mọi nhóm lấy từ stg_zalo_posts (hoặc ra bảng rỗng kèm «đang bật N nhóm»). Như vậy đúng là đã thay phép đo hỏng bằng số 0, điều ADR-0014 và mô tả của chính measure() cấm («không bao giờ thay bằng 0, mảng rỗng»). Cách sửa: trong measure của s03, đọc lại nhật ký và ném lỗi khi không đọc được, hoặc giữ cờ lỗi đọc log rồi ném lỗi trong khối s03.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Cột «Bài thử» trên máy chủ luôn là «—» vì zaloExtras gán cứng mockPosts7d: 0, nay được đẩy lên qua khối s03**
  Người dùng thấy gì: Trên máy chủ, cột «Bài thử» của bảng nhóm Zalo luôn hiện «—», còn ở máy thu lại hiện số thật. Người xem trên máy chủ không biết nhóm nào đang có bài thử.
  Căn cứ: Hậu quả nhẹ: chỉ thiếu một cột phụ, không hiện số sai gây hiểu lầm, máy thu vẫn xem được số thật; sửa sau không tốn kém.
  file: `pipeline/push-ops-facts.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 4 (assertion âm tính đứng một mình): «không chứa mã nhóm nào của cấu hình tạm» không có đối chứng dương cho CONFIG_DIGITS**
  Người dùng thấy gì: Phép kiểm tra «máy chủ không hiện mã nhóm Zalo thật» mới chứng minh được cho một mã. Nếu sau này có sửa làm lộ các mã còn lại thì bài kiểm tra vẫn báo xanh.
  Căn cứ: Không ảnh hưởng người dùng hiện tại, chưa có dữ liệu nào lộ; chỉ là lưới an toàn cho lần sửa sau còn thưa, bổ sung sau rẻ.
  file: `app/tests/nhom-s03-tren-cloud.test.tsx`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 5 (tuyên một định nghĩa cho cả lớp nhưng ma trận chỉ có điểm): bố cục cấu hình cũ, default rơi về groups cấp ngoài, không có trong ma trận AC-2**
  Người dùng thấy gì: Nếu máy thu và máy chủ lệch nhau về cách đếm nhóm ở cấu hình kiểu cũ (tài khoản mặc định không khai nhóm riêng), bài kiểm tra hiện tại sẽ không phát hiện. Số nhóm bật có thể hiện khác nhau giữa hai nơi.
  Căn cứ: Chỉ xảy ra với bố cục cấu hình cũ hiếm gặp, hiện cấu hình thật chưa vướng; lệch nếu có chỉ là con số hiển thị, tải lại hoặc sửa cấu hình là khắc phục, thêm ca kiểm sau rẻ.
  file: `app/tests/nhom-s03-tren-cloud.test.tsx`
  severity: medium
  Đề xuất: known-limits

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
