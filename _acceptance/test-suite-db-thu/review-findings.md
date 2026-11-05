# Review findings: test-suite-db-thu (round 2)

## Trong hợp đồng

- **Rào DB chung của --chay bị lọt khi DATABASE_URL không có user:pass**
  file: `db/db-thu.sh:24`
  severity: low
  source: bugs
  AC: AC-1
  detail: Dòng 24 tách host bằng `noi="${u%/*}"; noi="${noi##*@}"`. Chỉ phần `*@` được cắt, nên URL không có userinfo giữ nguyên scheme: `postgres://localhost:5433/oneinvest` cho `noi=postgres://localhost:5433`. Giá trị này khác `localhost:5433`, nên script coi là máy chủ khác, đặt TEST_DATABASE_URL_ADMIN bằng chính URL đó rồi `exec "$@"` trên DB chung. Đã chạy thật với docker giả: vào `postgres://localhost:5433/oneinvest` thì lệnh nhận CMD_URL và ADMIN đều là URL DB chung, không đổi sang DB riêng; vào URL có `oneinvest:oneinvest@` thì đổi đúng sang `oneinvest_suite_app_<pid>`. Điều này trái AC-1 («DATABASE_URL trỏ DB oneinvest thì đổi sang DB của lượt»). Lỗi này chỉ gây hại khi có PGUSER/PGPASSWORD hoặc .pgpass để kết nối được, nên xác suất thấp, nhưng khi xảy ra thì test ghi thẳng vào DB chung mà không có cảnh báo. Ca DT-AC-1 và DT-AC-2 chỉ thử URL có userinfo nên không bắt được. Hướng sửa: cắt thêm scheme, `noi="${noi##*/}"`, trước hoặc sau khi cắt `*@`, và thêm ca này vào DT-AC-1.

- **Hình 5 (tuyên quét LỚP, chỉ có điểm-case): tepNap không đi theo `@/`, import trần và đường tính lúc chạy, sót 125 tệp dù AC-7 hứa «mọi tệp mà test import»**
  file: `scripts/db-thu.test.mjs:246`
  severity: medium
  source: measurement
  AC: AC-7
  detail: Regex dòng 246 chỉ nhận `from` hoặc `import(` theo sau là đường bắt đầu `./` hoặc `../`. Nó bỏ qua alias `@/` (chuỗi import trong app/src), import trần (`import "./labels-anh.test"` ở app/tests/labels-anh-ci.test.tsx:2), và đường tính bằng `join(PIPE, ...)` như `refresh-bait-gap.mjs`, `lib/nap-060.mjs` trong sellers-chip.test.tsx dòng 21 và 73. Chú thích dòng 238 chỉ thừa nhận phần import động tính lúc chạy, không nhắc `@/`. Tôi chạy thử bản BFS mở rộng ba đường trên: thêm được 125 tệp ngoài danh sách quét. Trong đó hit duy nhất của dongLot là `pipeline/push-ops-facts.mjs:22`, tức LOCAL_URL làm fallback sau `process.env.DATABASE_URL ??` ở dòng 217, chưa phải lọt thật. Assert dòng 295 chỉ ghim ba tên tệp nên không phát hiện được phần thiếu này: một tệp chỉ nạp qua `@/` đổi sang URL cứng thì DT-AC-7 vẫn xanh.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Thước đã ký «trang đầu dưới 1 giây» của hồ sơ khác bị đổi thành lượt nhanh nhất trong sáu, hồ sơ đó không được cập nhật**
  Người dùng thấy gì: Phép kiểm «trang đầu dưới 1 giây» giờ lấy lượt nhanh nhất trong tối đa sáu lượt, nên có thể báo đạt dù người đọc đầu tiên vẫn gặp độ chậm lúc máy còn nguội. Hồ sơ đã ký trước đó chưa được cập nhật để nói rõ cách đo mới.
  Căn cứ: Chỉ làm kết quả kiểm có thể đẹp hơn thực tế, không làm mất hay sai dữ liệu của ai; ghi rõ cách đo mới cho người ký là đủ và rẻ.
  file: `app/tests/tin-rao-doi-chieu.test.tsx`
  severity: medium
  Đề xuất: known-limits

- **Nhánh giữ URL máy chủ khác đẩy kết nối quản trị sang máy chủ đó, nhưng hai tệp test vẫn nối DB tạm ở localhost:5433**
  Người dùng thấy gì: Khi ai đó chạy bộ kiểm với một máy chủ cơ sở dữ liệu khác máy mặc định, hai nhóm kiểm sẽ báo lỗi không tìm thấy cơ sở dữ liệu thử. Chạy bình thường trên máy này và trên CI thì không gặp.
  Căn cứ: Chỉ gây đỏ giả khi chạy với máy chủ lạ, không ảnh hưởng dữ liệu thật và người chạy thử lại với cấu hình mặc định là qua, nên ghi lại là đủ.
  file: `pipeline/scripts/cong-tac-that.test.mjs`
  severity: medium
  Đề xuất: known-limits

- **dem-deadlock.mjs nuốt lỗi docker, in 0 ca và thoát 0**
  Người dùng thấy gì: Khi không đọc được nhật ký máy chủ, công cụ đếm số lần kẹt khoá vẫn báo «0 ca» như thể đã hết lỗi, có thể làm người đọc bỏ qua việc cần làm tiếp.
  Căn cứ: Chỉ là công cụ đo nội bộ, không ảnh hưởng người dùng cổng; người xem chạy lại hoặc đối chiếu nhật ký là phát hiện được, sửa rẻ nhưng không gấp.
  file: `_acceptance/test-suite-db-thu/probes/dem-deadlock.mjs`
  severity: medium
  Đề xuất: known-limits

- **Dấu lược đồ bản mẫu bỏ sót constraint, index, trigger và giá trị enum, trái lời hứa «lược đồ đổi thì dựng lại ngay»**
  Người dùng thấy gì: Nếu một thay đổi cấu trúc dữ liệu chỉ đụng ràng buộc hoặc chỉ mục, bộ kiểm có thể chạy trên bản mẫu cũ tới 24 giờ, làm một số ca kiểm xanh giả hoặc đỏ giả.
  Căn cứ: Chỉ ảnh hưởng độ tin cậy của phép kiểm trong tối đa một ngày, không chạm dữ liệu thật và tự hết khi bản mẫu được dựng lại.
  file: `db/db-thu.sh`
  severity: medium
  Đề xuất: known-limits

- **Hình 5 (tuyên quét LỚP, chỉ có điểm-case): dongLot không bắt các dạng trỏ DB chung cùng lớp, kể cả «URL ghép từ biến máy chủ» mà AC-7 gọi tên**
  Người dùng thấy gì: Bộ rà soát tự động chưa bắt được một số cách viết lạ khiến một test lén nối vào cơ sở dữ liệu chung. Hiện chưa có test nào viết như vậy.
  Căn cứ: Chưa có vi phạm nào đang chạy, rủi ro chỉ xuất hiện nếu sau này có người viết theo kiểu lạ; có thể bổ sung lưới khi gặp.
  file: `scripts/db-thu.test.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình 5 (tuyên quét LỚP, chỉ có điểm-case): hai miễn trừ ở dòng 263 coi URL cứng là lành theo hình dáng dòng, không có ca đối chứng ngược**
  Người dùng thấy gì: Bộ rà soát bỏ qua một số dòng trông giống bảng dữ liệu, nên có thể bỏ sót một chuỗi kết nối thật nếu ai đó viết đúng dạng đó. Hiện chưa có trường hợp nào như vậy.
  Căn cứ: Chưa có vi phạm đang chạy; chỉ là lỗ nhỏ của lưới rà soát, sửa sau không mất gì.
  file: `scripts/db-thu.test.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình 4 (âm-tính-một-mình): ghiDbChung chỉ được assert rỗng, không có đối chứng dương, và mù với lệnh ghi nhắm oneinvest đi qua `-d postgres`**
  Người dùng thấy gì: Phép kiểm «không ghi vào cơ sở dữ liệu chung» chưa chứng tỏ nó bắt được lệnh ghi, nên nếu sau này có người thêm lệnh ghi kiểu gián tiếp, phép kiểm vẫn xanh.
  Căn cứ: Hiện không có lệnh ghi nào như vậy nên không ai bị ảnh hưởng; chỉ là phép kiểm lỏng, bổ sung sau khi cần.
  file: `scripts/db-thu.test.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình 3 (assert chuỗi có mặt trong khi lời hứa là QUAN HỆ): ca dựng lại mẫu không ghim nguồn dump, cũng không ghim thứ tự dựng mẫu rồi mới chép**
  Người dùng thấy gì: Phép kiểm chưa khoá chặt việc bản mẫu phải được dựng từ cơ sở dữ liệu chung và dựng xong mới chép, nên nếu sau này ai đó đảo thứ tự, bộ kiểm vẫn xanh trong khi mẫu có thể cũ.
  Căn cứ: Hành vi hiện tại đúng, rủi ro chỉ ở lần sửa sau; hậu quả là một ngày kiểm trên mẫu cũ, không mất dữ liệu.
  file: `scripts/db-thu.test.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình 3 (assert chuỗi có mặt trong khi lời hứa là QUAN HỆ): đối chứng dương của lay-mau nhận bất kỳ DB nào khác oneinvest, không ràng buộc với DB của lượt**
  Người dùng thấy gì: Bộ đo kết nối chấp nhận bất kỳ cơ sở dữ liệu nào khác bản chung làm bằng chứng, chưa kiểm đúng đó là cơ sở dữ liệu riêng của lượt chạy.
  Căn cứ: Chỉ làm bằng chứng đo lỏng hơn lời hứa, người chấm đọc dòng kết quả vẫn thấy được; không ảnh hưởng người dùng.
  file: `_acceptance/test-suite-db-thu/probes/lay-mau.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình 4 (âm-tính-một-mình): dem-deadlock in «0 ca» và exit 0 khi không đọc được log, trong khi số này quyết định có làm việc tiếp**
  Người dùng thấy gì: Khi không đọc được nhật ký máy chủ, công cụ đếm kẹt khoá vẫn báo «0 ca», dễ bị hiểu là đã hết lỗi và bỏ lỡ việc cần làm tiếp.
  Căn cứ: Chỉ là công cụ đo nội bộ, người dùng cổng không bị ảnh hưởng; chạy lại hoặc đối chiếu nhật ký là phát hiện, sửa rẻ nhưng không gấp.
  file: `_acceptance/test-suite-db-thu/probes/dem-deadlock.mjs`
  severity: medium
  Đề xuất: known-limits

⚠ Cụm ngoài vùng phủ: 2/12 lỗi rơi vào file không bộ đo nào phủ (_acceptance/test-suite-db-thu/probes/dem-deadlock.mjs) — dừng và quyết: mở rộng hợp đồng hay rút phạm vi.
