## Trong hợp đồng

Không có.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **khoaDuong bỏ mọi khoá toàn số, kể cả sau tiền tố «Đường/Phố» rõ ràng: «Đường 2» với «Đường 3» giờ ra Thiếu, trước đây ra Lệch**
  Người dùng thấy gì: Hai tin nằm trên hai đường chỉ đánh số khác nhau (kiểu «Đường 2» và «Đường 3») sẽ không còn bị báo là khác đường; thẻ duyệt hiện «Thiếu» thay vì «Lệch». Người duyệt có thể bỏ sót tín hiệu khác căn ở trường hợp này.
  Căn cứ: Hậu quả nhẹ: chỉ gặp với đường đặt tên thuần số, hiếm; không mất dữ liệu, người duyệt vẫn thấy các trường khác trên thẻ và tự quyết được; sửa sau vẫn rẻ.
  file: `app/src/lib/ops/review-can-cu.ts`
  severity: medium
  Đề xuất: known-limits

- **Ngoại lệ «3 Tháng 2» chỉ nhận chữ có dấu: «3 thang 2» bị coi là số nhà và sinh thêm khoá giả «thang 2»**
  Người dùng thấy gì: Khi ô đường được gõ không dấu kiểu «3 thang 2», hệ thống có thể coi số 3 là số nhà và so lệch với «Tháng 2», làm kết quả so đường hơi sai. Chỉ ảnh hưởng ô nhập không dấu của vài đường mang tên ngày tháng.
  Căn cứ: Hậu quả nhẹ: chỉ xảy ra với dữ liệu gõ không dấu của số ít đường kiểu «Tháng N», không mất dữ liệu, người duyệt tự nhận ra trên thẻ; sửa sau không đắt.
  file: `agent/src/agents/judge-entity.ts`
  severity: low
  Đề xuất: known-limits

- **khoaDuong: kiểm «ô chỉ có từ vị trí» chỉ nhận dạng có dấu, trong khi regex cắt cụm vị trí nhận cả dạng không dấu (r1)**
  Người dùng thấy gì: Khi ô đường chỉ ghi mỗi từ chỉ vị trí viết không dấu (ví dụ «Hem», «Ngo»), hệ thống vẫn coi là đường khác và có thể loại oan hai tin cùng một căn.
  Căn cứ: Hậu quả nhẹ vì chỉ ảnh hưởng ô đường chỉ ghi mỗi từ vị trí không dấu, hiếm gặp, và người duyệt vẫn thấy thẻ để tự quyết; sửa sau không đắt.
  file: `agent/src/agents/judge-entity.ts`
  severity: low
  Đề xuất: known-limits

- **Ngoại lệ «tháng <số>» chỉ bắt chữ có dấu: đường đánh số viết không dấu bị ghép nhầm thành Khớp (r1)**
  Người dùng thấy gì: Hai đường đánh số khác nhau viết không dấu (ví dụ «30 thang 4» và «2 thang 4») bị báo là cùng đường, nên hai căn ở hai đường khác nhau có thể bị ghép nhầm thành một căn mà không có cảnh báo.
  Căn cứ: Nặng vừa vì có thể ghép nhầm hai căn khác nhau mà không báo, người dùng khó tự phát hiện; nên làm thành việc riêng có ca thử đi kèm.
  file: `agent/src/agents/judge-entity.ts`
  severity: medium
  Đề xuất: new-contract

- **Kiểm «từ vị trí trần» chỉ có dạng có dấu: 'Ngo'/'Hem'/'Ngach'/'Kiet' trần vẫn sinh khoá và ra Lệch (r1)**
  Người dùng thấy gì: Ô đường chỉ có từ vị trí viết không dấu bị báo «Lệch» thay vì «Thiếu», nên hai tin cùng căn có thể bị loại oan vì lý do đường khác.
  Căn cứ: Hậu quả nhẹ và hiếm, thẻ vẫn hiện cho người duyệt xem lại; ghi lại làm han chế đã biết là đủ.
  file: `agent/src/agents/judge-entity.ts`
  severity: low
  Đề xuất: known-limits

- **Assertion âm-tính-một-mình: nhánh thẻ approved của CD-AC-8 không có chiều đỏ (r1)**
  Người dùng thấy gì: Phép kiểm các thẻ người đã nhận «Cùng căn» có thể xanh mà không đo được gì khi không có thẻ nào, nên một lỗi sau này ở nhóm thẻ đó có thể lọt qua mà không bị bắt.
  Căn cứ: Không ảnh hưởng người dùng trực tiếp, chỉ làm lưới kiểm thưa hơn; hợp đồng đã chấp nhận trường hợp bằng 0 nên ghi lại là đủ.
  file: `agent/tests/judge-entity-duong.test.ts`
  severity: low
  Đề xuất: known-limits

## Chưa adversarial-verify (refuter chết)

Không có.

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).

