# Review findings: ranh-gioi-khu-vuc-dung (round 2)

## Trong hợp đồng

Không có finding nào map được vào AC.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Chốt giữ khu vực có saved_markets chỉ đếm ở DB local, trong khi cascade xảy ra trên cloud, và bước dọn tự chạy theo lịch launchd hằng tuần**
  Người dùng thấy gì: Sau khi đưa vào chạy, lượt cập nhật dữ liệu hằng tuần có thể tự xoá một khu vực mà người dùng thật đã lưu làm thị trường theo dõi, và thị trường đã lưu đó biến mất khỏi tài khoản của họ trên bản chạy thật mà không có cảnh báo.
  Căn cứ: Hậu quả nặng vì người dùng mất thị trường đã lưu mà không tự khôi phục được, lỗi xảy ra lặng lẽ, và sửa trước khi bước dọn chạy tự động thì rẻ hơn nhiều so với phục hồi sau.
  file: `pipeline/reassign-areas.mjs`
  severity: high
  Đề xuất: new-contract

- **Thẻ Cổng ghi sai rằng bước dọn «không chạy đêm», làm người ký hiểu sai rủi ro**
  Người dùng thấy gì: Người ký duyệt đang được báo rằng bước dọn dữ liệu không chạy tự động, trong khi thực tế nó chạy theo lịch hằng tuần, nên họ có thể ký mà không biết dữ liệu sẽ bị dọn ngay lượt kế tiếp.
  Căn cứ: Thông tin sai làm lệch quyết định ký duyệt nhưng không tự làm mất dữ liệu, và sửa lời trên thẻ rất rẻ nên nên làm trước khi ký, cùng với việc xử lý rủi ro chạy tự động.
  file: `_acceptance/ranh-gioi-khu-vuc-dung/card-plain.json`
  severity: medium
  Đề xuất: new-contract

- **Tên check DQ mới lệch quy ước (snake_case tiếng Việt thay vì kebab-case tiếng Anh)**
  Người dùng thấy gì: Người dùng không thấy gì khác biệt; chỉ là tên một mục kiểm tra chất lượng dữ liệu nội bộ đặt không đồng bộ với các mục còn lại.
  Căn cứ: Không ảnh hưởng người dùng, không mất dữ liệu, và đổi tên sau này vẫn dễ nên chấp nhận và ghi vết là đủ.
  file: `pipeline/sql/450_dq_checks.sql`
  severity: low
  Đề xuất: wont-fix

- **Rào «giữ khu vực lạc có saved_markets» chỉ đếm saved_markets ở DB local, trong khi thị trường người dùng lưu nằm trên cloud. Lượt chạy hằng tuần sẽ xoá dây chuyền chúng trên cloud**
  Người dùng thấy gì: Lượt cập nhật hằng tuần có thể xoá khu vực mà người dùng thật đã lưu làm thị trường theo dõi, khiến thị trường đó mất khỏi tài khoản của họ, trong khi nhật ký lại báo như thể mọi thứ an toàn.
  Căn cứ: Hậu quả nặng vì người dùng mất dữ liệu đã lưu mà không tự khôi phục được, lỗi lặng lẽ khó phát hiện, và sửa trước khi chạy tự động rẻ hơn nhiều so với phục hồi sau.
  file: `pipeline/reassign-areas.mjs`
  severity: high
  Đề xuất: new-contract

- **Một phường thật bị bỏ qua tạm thời trong snapshot (không dựng được polygon, hoặc lệch dung sai) lập tức bị coi là khu vực lạc và xoá**
  Người dùng thấy gì: Nếu dữ liệu ranh giới của một phường bị lỗi tạm thời trong một lượt cập nhật, phường đó có thể biến mất khỏi bản đồ và số liệu cho đến lượt cập nhật sau.
  Căn cứ: Hậu quả vừa phải vì phường tự xuất hiện lại khi dữ liệu nguồn lành lại ở lượt sau và dữ liệu gốc không bị mất, nên ghi nhận là hạn chế đã biết là hợp lý.
  file: `pipeline/reassign-areas.mjs`
  severity: medium
  Đề xuất: known-limits

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).

