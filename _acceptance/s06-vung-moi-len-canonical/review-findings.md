# Review findings: s06-vung-moi-len-canonical (round 5)

## Trong hợp đồng

Không có finding nào map được vào AC.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **064 đổi khoá công khai của 32 thị trường mà không có redirect hay mã cũ trỏ sang mã mới, nên URL Invest và id trên data-api công khai bị gãy**
  Người dùng thấy gì: Sau khi đổi mã 32 thị trường, các đường dẫn cũ tới trang thị trường (ví dụ trang Đà Nẵng) và mã cũ trong API công khai sẽ không còn mở được. Ai đã lưu liên kết hay đang gọi API theo mã cũ sẽ gặp trang lỗi hoặc kết quả rỗng.
  Căn cứ: Lỗi chỉ lộ ra khi áp thay đổi lên máy thu, người dùng công khai gặp trực tiếp liên kết gãy và không tự khắc phục được; nhưng làm chuyển hướng là việc riêng, không đắt và có thể làm sau khi áp.
  file: `db/migrations/064_ma_thi_truong_ngan.sql`
  severity: medium
  Đề xuất: new-contract

- **Nhánh tạm tra mã dài trong marketNameOf còn nguyên dù ghi chú nói bỏ khi 064 đổi mã**
  Người dùng thấy gì: Trong ứng dụng vẫn còn một đoạn mã tra tên thị trường theo mã cũ dù mã cũ không còn dùng. Người dùng không thấy khác biệt nào, chỉ là còn mã thừa chưa dọn.
  Căn cứ: Không ảnh hưởng gì đến người dùng và không mất dữ liệu; hợp đồng đã chủ động để việc dọn này sang việc riêng nên chỉ cần ghi lại.
  file: `app/src/lib/market-names.ts`
  severity: low
  Đề xuất: known-limits

- **064 không đổi dq_check_results.entity (187 dòng mã dài) và dem-ma-dai không thấy cột này**
  Người dùng thấy gì: Trang kiểm tra chất lượng dữ liệu của Ops có thể hiện mỗi thị trường hai lần trong khoảng một tuần sau khi đổi mã, và dòng mang mã cũ sẽ bị gắn nhãn chung chung thay vì tên thị trường.
  Căn cứ: Chỉ là hiển thị tạm thời trên trang nội bộ Ops, không mất dữ liệu và tự hết khi các dòng cũ trôi khỏi cửa sổ bảy ngày; sửa thêm chỉ đáng khi muốn trang gọn ngay.
  file: `db/migrations/064_ma_thi_truong_ngan.sql`
  severity: low
  Đề xuất: known-limits

- **transform-chotot để area_id NULL lặng lẽ khi city_code ánh xạ được thị trường nhưng thị trường đó chưa có phường**
  Người dùng thấy gì: Nếu chạy chuyển dữ liệu trước khi đổi mã thị trường hoặc trước khi nạp phường, tin của Đà Nẵng và vài tỉnh cũ sẽ vào hệ thống không có phường mà không có cảnh báo nào. Người vận hành có thể không biết vì sao tin thiếu phường.
  Căn cứ: Không mất dữ liệu và chạy lại sau khi nạp phường sẽ gán đúng; rủi ro chỉ nằm ở thứ tự triển khai và đã có ghi chú thứ tự áp, nên ghi lại là đủ.
  file: `pipeline/transform-chotot.mjs`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 2 — Fixture VIẾT TAY đúng khuôn bên đọc: snapshot S04 giả không round-trip qua writer của collector**
  Người dùng thấy gì: Phép thử dùng dữ liệu ranh giới giả dựng tay nên chưa chứng minh được dữ liệu do bộ thu thật ghi ra sẽ được nhận đúng. Kiểm tra trên dữ liệu thật vẫn phải làm khi có ranh giới Đà Nẵng.
  Căn cứ: Chỉ làm phép thử yếu hơn lời hứa, không ảnh hưởng người dùng; bước đo trên dữ liệu thật ở cổng sau vẫn bắt được sai lệch này.
  file: `scripts/s06-vung-moi/acceptance.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 4 — Chiều đỏ của E1 có thể qua rỗng: không ghim tiền đề area_sources trỏ mã dài > 0**
  Người dùng thấy gì: Một phép thử đổi mã có thể báo xanh mà thực ra không đo gì nếu dữ liệu mẫu không còn dòng mã cũ. Kết quả đổi mã thật vẫn do người duyệt kiểm khi áp.
  Căn cứ: Chỉ làm giảm độ tin của bằng chứng thử, không ảnh hưởng người dùng hay dữ liệu; vá rẻ nhưng không chặn việc ra mắt.
  file: `scripts/s06-vung-moi/acceptance.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 5 — Tuyên quét LỚP 'không chuỗi thành phố cứng' nhưng đối chứng dương chỉ một điểm, bộ quét hẹp hơn lớp tuyên bố**
  Người dùng thấy gì: Bộ kiểm tra chống tên thành phố viết cứng trong mã có thể bỏ sót một số dạng viết khác, nên sau này ai đó có thể viết cứng một thành phố mà kiểm tra vẫn xanh.
  Căn cứ: Không ảnh hưởng người dùng hiện tại và không mất dữ liệu; chỉ là rào kiểm thử còn hẹp, có thể mở rộng khi có người viết cứng thật.
  file: `pipeline/lib/thi-truong.test.mjs`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 1 — Đo mã nguồn (chỉ dẫn) thay vì đầu ra: assert.match trên văn bản transform-chotot.mjs**
  Người dùng thấy gì: Một phép thử chỉ kiểm tra văn bản mã có gọi hàm chứ không kiểm kết quả, nên có thể báo xanh dù kết quả sai. Hành vi thật đã có phép thử khác kiểm.
  Căn cứ: Không ảnh hưởng người dùng, phép đo hành vi thật đã tồn tại ở chỗ khác nên sửa thêm hầu như không thêm giá trị.
  file: `pipeline/lib/thi-truong.test.mjs`
  severity: low
  Đề xuất: wont-fix

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
