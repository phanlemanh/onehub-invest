# Review findings: ops-nhan-ma-nguon (round 2)

## Trong hợp đồng

Không có.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Job thứ 6 (cloud-sync) trong fixture là tự viết tay, nên phép kiểm «đủ 6 job» chỉ đúng một phần**
  Người dùng thấy gì: Bài kiểm trang Thu thập dữ liệu dùng một dòng job đồng bộ cloud do người viết test tự thêm vào, nên nó không tự chứng minh trang thật nhận đủ 6 job. Phần này đã có bài kiểm khác phủ bằng dữ liệu thật, nên người vận hành không bị ảnh hưởng.
  Căn cứ: Hậu quả nhẹ: chỉ làm một bài kiểm yếu đi ở một góc, không lộ tên nguồn nào cho người dùng, và các bài kiểm khác đã phủ đúng chỗ đó bằng dữ liệu thật; ghi lại là đủ, sửa sau cũng không đắt hơn.
  file: `app/tests/ops-nhan-ma-nguon.test.tsx`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 3 — kiểm «chuỗi có mặt» ở đâu đó trong trang, trong khi lời hứa là quan hệ (nhánh của issuesOf hiện TRONG danh sách Cần chú ý)**
  Người dùng thấy gì: Bài kiểm xác nhận «đủ 9 loại cảnh báo» chỉ tìm chữ ở đâu đó trong trang, nên nếu một cảnh báo biến mất khỏi danh sách Cần chú ý nhưng vẫn hiện ở chỗ khác thì bài kiểm vẫn xanh. Người vận hành vẫn thấy cảnh báo đó ở vị trí khác, và trang không lộ tên nguồn nào.
  Căn cứ: Hậu quả nhẹ với người dùng: cảnh báo vẫn hiện trên trang ở chỗ khác và không có dữ liệu bị lộ hay mất; nếu có hỏng thì chỉ là một cảnh báo thiếu ở danh sách tóm tắt, người dùng vẫn thấy bằng mắt, còn sửa bài kiểm sau này không tốn kém.
  file: `app/tests/ops-nhan-ma-nguon.test.tsx`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 2 — job cloud-sync viết tay theo khuôn bên ghi; assert «đủ 6 job» đếm cả dòng do chính test chèn vào**
  Người dùng thấy gì: Bài kiểm trang Thu thập dữ liệu đếm cả một job do chính người viết test chèn vào, nên con số 6 job chưa phản ánh đầu ra thật của bước đẩy dữ liệu. Nếu nhãn job đồng bộ cloud đổi, bài kiểm này không thấy, nhưng bài kiểm cloud đi vòng kín thì thấy.
  Căn cứ: Hậu quả nhẹ: chỉ yếu ở một bài kiểm, không có dữ liệu nào lộ ra cho người dùng vì bài kiểm cloud đã che đúng phần nhãn; trùng với finding t1 nên ghi chung một giới hạn là đủ.
  file: `app/tests/ops-nhan-ma-nguon.test.tsx`
  severity: low
  Đề xuất: known-limits

- **Nhãn UI mới «Điểm thị trường» nằm trong danh sách _Avoid_ của CONTEXT.md, và lệch với «Market Score» ngay trong cùng component (r1)**
  Người dùng thấy gì: Trang chất lượng dữ liệu của người vận hành gọi cùng một con số bằng hai tên khác nhau («Điểm thị trường» và «Market Score»), có thể gây nhầm lẫn khi đọc. Không lộ dữ liệu và không ảnh hưởng số liệu.
  Căn cứ: Chỉ là lệch cách gọi tên trên màn hình nội bộ, không mất hay lộ dữ liệu, người vận hành vẫn hiểu được; sửa sau rẻ vì chỉ đổi chữ.
  file: `app/src/components/ops/quality-tables.tsx`
  severity: low
  Đề xuất: known-limits

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).

