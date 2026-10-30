# Review findings: enrich-chay-sau-nap (round 2)

## Trong hợp đồng

Không có mục nào.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Hình dạng 4 (assertion âm tính đứng một mình): vế «tin hỏng có dấu đã thử» của EC-AC-2 trên CLI vẫn không thể đỏ ở cả hai chế độ dau/cuoi**
  Người dùng thấy gì: Khi một tin ghi hỏng giữa chừng, việc hệ thống không để lại dấu «đã thử» cho tin đó chỉ được kiểm chắc ở bài kiểm cấp hàm; bài kiểm chạy lệnh thật không phân biệt được bản đúng với bản hỏng ở điểm này. Nếu về sau có lỗi ở đúng chỗ này, tin hỏng có thể bị coi là đã thử và bị bỏ qua tới 30 ngày mà bài kiểm lệnh thật không báo.
  Căn cứ: Hành vi hiện đúng và đã có bài kiểm khác bảo vệ, chỉ có một lớp kiểm thứ hai yếu; nếu sau này hỏng thì hậu quả nhẹ (một tin chậm được thử lại, không mất dữ liệu) và sửa lại bài kiểm có thể làm sau với giá rẻ.
  file: `agent/tests/enrich-cli.itest.ts`
  severity: low
  Đề xuất: known-limits

- **--offers không kiểm giá trị: thiếu giá trị thì chạy rỗng và thoát 0, gặp cờ khác thì nhận nhầm cờ làm mã tin (r1)**
  Người dùng thấy gì: Người chạy tay gõ thiếu danh sách tin sẽ thấy lượt enrich chạy 0 tin mà vẫn báo thành công, nên có thể tưởng các tin đã được xử lý. Lượt chạy tự động hằng đêm không bị ảnh hưởng.
  Căn cứ: Hậu quả nhẹ, chỉ gặp khi chạy tay gõ sai, không mất hay lộ dữ liệu, chạy lại đúng lệnh là xong và sửa sau cũng không đắt.
  file: `agent/scripts/enrich-run.ts`
  severity: low
  Đề xuất: known-limits

- **Mặc định giaoDichSavepoint cần sẵn một giao dịch ngoài; gọi runEnrich không kèm BEGIN thì mọi tin hỏng mà vẫn trả về bình thường (r1)**
  Người dùng thấy gì: Nếu sau này có người viết thêm chỗ gọi enrich mà quên mở giao dịch, mọi tin sẽ ghi hỏng nhưng kết quả trông gần như bình thường. Hiện không chỗ gọi nào đang mắc lỗi này.
  Căn cứ: Chưa có ảnh hưởng nào cho người dùng hôm nay, chỉ là rủi ro cho người viết code sau, không mất dữ liệu vì ghi hỏng thì không ghi gì, và mã thoát vẫn báo lỗi.
  file: `agent/src/enrich/run.ts`
  severity: low
  Đề xuất: known-limits

- **Dấu enrich:thu ghi mỗi tin một dòng vào ops_audit, lấn khung xem /ops/audit (LIMIT 100, không lọc) (r1)**
  Người dùng thấy gì: Sau vài đêm chạy, trang nhật ký thao tác của Ops sẽ đầy các dòng đánh dấu enrich và đẩy những thao tác duyệt, hoàn tác của người ra khỏi 100 dòng đầu. Người vận hành khó xem lại việc mình đã làm.
  Căn cứ: Không mất dữ liệu, các dòng vẫn còn trong cơ sở dữ liệu và chỉ ảnh hưởng chỗ xem của người vận hành, nhưng sẽ lộ ra ngay sau vài đêm và sửa nằm ở màn Ops nên cần một việc riêng.
  file: `agent/src/enrich/run.ts`
  severity: low
  Đề xuất: new-contract

- **--offers với danh sách rỗng hoặc thiếu đối số chạy lặng lẽ 0 tin và thoát 0 (r1)**
  Người dùng thấy gì: Gõ lệnh enrich chỉ định tin mà để trống danh sách thì lượt chạy không làm gì nhưng vẫn báo xong êm, nên người chạy dễ tưởng đã enrich các tin đó. Lượt chạy tự động hằng đêm không bị ảnh hưởng.
  Căn cứ: Hậu quả nhẹ, chỉ xảy ra khi chạy tay gõ sai, không mất hay lộ dữ liệu, chạy lại đúng lệnh là khắc phục được.
  file: `agent/scripts/enrich-run.ts`
  severity: low
  Đề xuất: known-limits

## Chưa adversarial-verify (refuter chết)

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
