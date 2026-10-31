# Review findings: chuan-hoa-o-duong (round 1)

## Trong hợp đồng

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **khoaDuong: kiểm «ô chỉ có từ vị trí» chỉ nhận dạng có dấu, trong khi regex cắt cụm vị trí nhận cả dạng không dấu**
  Người dùng thấy gì: Khi ô đường chỉ ghi mỗi từ chỉ vị trí viết không dấu (ví dụ «Hem», «Ngo»), hệ thống vẫn coi là đường khác và có thể loại oan hai tin cùng một căn.
  Căn cứ: Hậu quả nhẹ vì chỉ ảnh hưởng ô đường chỉ ghi mỗi từ vị trí không dấu, hiếm gặp, và người duyệt vẫn thấy thẻ để tự quyết; sửa sau không đắt.
  file: `agent/src/agents/judge-entity.ts`
  severity: low
  Đề xuất: known-limits

- **Ngoại lệ «tháng <số>» chỉ bắt chữ có dấu: đường đánh số viết không dấu bị ghép nhầm thành Khớp**
  Người dùng thấy gì: Hai đường đánh số khác nhau viết không dấu (ví dụ «30 thang 4» và «2 thang 4») bị báo là cùng đường, nên hai căn ở hai đường khác nhau có thể bị ghép nhầm thành một căn mà không có cảnh báo.
  Căn cứ: Nặng vừa vì có thể ghép nhầm hai căn khác nhau mà không báo, người dùng khó tự phát hiện; nên làm thành việc riêng có ca thử đi kèm.
  file: `agent/src/agents/judge-entity.ts`
  severity: medium
  Đề xuất: new-contract

- **Kiểm «từ vị trí trần» chỉ có dạng có dấu: 'Ngo'/'Hem'/'Ngach'/'Kiet' trần vẫn sinh khoá và ra Lệch**
  Người dùng thấy gì: Ô đường chỉ có từ vị trí viết không dấu bị báo «Lệch» thay vì «Thiếu», nên hai tin cùng căn có thể bị loại oan vì lý do đường khác.
  Căn cứ: Hậu quả nhẹ và hiếm, thẻ vẫn hiện cho người duyệt xem lại; ghi lại làm han chế đã biết là đủ.
  file: `agent/src/agents/judge-entity.ts`
  severity: low
  Đề xuất: known-limits

- **Assertion âm-tính-một-mình: nhánh thẻ approved của CD-AC-8 không có chiều đỏ**
  Người dùng thấy gì: Phép kiểm các thẻ người đã nhận «Cùng căn» có thể xanh mà không đo được gì khi không có thẻ nào, nên một lỗi sau này ở nhóm thẻ đó có thể lọt qua mà không bị bắt.
  Căn cứ: Không ảnh hưởng người dùng trực tiếp, chỉ làm lưới kiểm thưa hơn; hợp đồng đã chấp nhận trường hợp bằng 0 nên ghi lại là đủ.
  file: `agent/tests/judge-entity-duong.test.ts`
  severity: low
  Đề xuất: known-limits

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).

