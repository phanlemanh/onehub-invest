# Review findings: so-tu-vung-mot-nguon (round 2)

## Trong hợp đồng

Không có finding nào trong hợp đồng ở round này.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Ca emitSeed↔043 mới đặt SAU ca canh «DB thật không đổi», nên bất biến ROLLBACK không còn được đo cho ca này**
  Người dùng thấy gì: Bộ kiểm tra có một ca mới chạy sau ca xác nhận «cơ sở dữ liệu dùng chung không bị đổi». Hiện tại cơ sở dữ liệu vẫn nguyên, nhưng nếu sau này ca mới bị sửa sai thì không còn ca nào bắt được việc đó.
  Căn cứ: Không có hậu quả nào với người dùng lúc này vì dữ liệu không đổi, và nếu có lỗi sau này thì chỉ ảnh hưởng cơ sở dữ liệu thử trên máy, nên ghi lại để lưu ý là đủ.
  file: `pipeline/scripts/vocab-db.itest.mjs`
  severity: low
  Đề xuất: known-limits

- **Ca emitSeed mới đứng SAU ca «DB thật không đổi», nên phép so pg_constraint trước/sau không bao được ca này**
  Người dùng thấy gì: Lời hứa «cơ sở dữ liệu thật không đổi sau mọi ca kiểm tra» chưa bao hết ca mới thêm. Hiện chưa có gì sai với dữ liệu, chỉ là lớp bảo vệ mỏng hơn mô tả.
  Căn cứ: Chưa có dữ liệu nào bị đổi hay mất, chỉ là lời chú thích rộng hơn phạm vi thực tế; ghi vào hạn chế đã biết là đủ, sửa sau rẻ.
  file: `pipeline/scripts/vocab-db.itest.mjs`
  severity: low
  Đề xuất: known-limits

- **Lint sổ từ vựng quét đỏ cả tệp làn ZCode trong pipeline/ và scripts/, trái hợp đồng «không quét làn ZCode» (r1)**
  Người dùng thấy gì: Khi bên thu thập dữ liệu viết một danh sách giá trị trong các tệp nhập hoặc thu của họ, bộ kiểm tra từ vựng sẽ báo đỏ dù đó là phần việc của họ. Hiện chưa có tệp nào gặp tình huống này nên chưa ai bị chặn.
  Căn cứ: Chưa ảnh hưởng ai ở hiện tại, chỉ gây vướng khi bên thu thập viết thêm mã; gặp thì thêm ngoại lệ hoặc sửa luật quét sau với chi phí thấp.
  file: `pipeline/lib/vocab-core.mjs`
  severity: medium
  Đề xuất: known-limits

- **dd_lookup của property_type lệch bảng ánh xạ RESO đã chốt (house→Townhouse; commercial ghi giá trị của trục khác) (r1)**
  Người dùng thấy gì: Hai loại hình (nhà riêng và thương mại) đang gắn với giá trị chuẩn RESO chưa khớp hẳn nghĩa tiếng Việt. Người dùng không thấy khác biệt trên màn hình, nhưng sau này cần một đợt chỉnh để khớp chuẩn.
  Căn cứ: Nhãn hiển thị vẫn đúng và không mất dữ liệu; sửa sau chỉ cần thêm một đợt cập nhật bảng tra, không gây hại cho người dùng hiện tại.
  file: `pipeline/mappings.yaml`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 3 (assert «chuỗi có mặt» thay vì QUAN HỆ): khối CONTEXT.md chỉ kiểm từng nhãn có mặt đâu đó trong khối (r1)**
  Người dùng thấy gì: Bài kiểm khối thuật ngữ trong tài liệu từ vựng có thể không phát hiện nếu một nhãn bị gắn nhầm trục hoặc mất ở trục này nhưng còn ở trục khác. Người đọc tài liệu có thể thấy thuật ngữ thiếu hoặc sai chỗ mà không có cảnh báo.
  Căn cứ: Bộ sinh tự động nên hiếm khi sai kiểu này và lỗi chỉ nằm trong tài liệu, không ảnh hưởng dữ liệu hay cổng; làm chặt bài kiểm sau rất rẻ.
  file: `pipeline/scripts/vocab.test.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 4 (assertion âm tính một mình): bỏ qua tệp chép từ kit ở scripts/ không có đối chứng dương (r1 · tệp đã đổi)**
  Người dùng thấy gì: Bài kiểm chưa chứng minh được rằng thư mục các script thật sự được bộ kiểm tra từ vựng quét. Nếu ai đó vô tình bỏ thư mục này khỏi phạm vi quét, enum viết tay ở đó sẽ lọt qua mà không báo.
  Căn cứ: Rủi ro chỉ xảy ra khi có người sửa cấu hình quét, hậu quả là bỏ sót cảnh báo chứ không hỏng dữ liệu; thêm ca đối chứng sau rất rẻ.
  file: `pipeline/scripts/vocab-lint.test.mjs`
  severity: low
  Đề xuất: known-limits

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
