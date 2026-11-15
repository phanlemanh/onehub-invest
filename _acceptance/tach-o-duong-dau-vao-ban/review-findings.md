# Review findings: tach-o-duong-dau-vao-ban (round 1)

## Trong hợp đồng

(không có)

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Tệp probe mới agent/probes/ nằm ngoài tsconfig của agent, nên tsc strict và hook typecheck không kiểm**
  Người dùng thấy gì: Một tệp kiểm tra mới không được máy soát lỗi kiểu dữ liệu. Hiện chưa có lỗi nào, nên người dùng cuối không thấy gì khác.
  Căn cứ: Chỉ là thiếu một lớp rào, chưa có lỗi thật, không ảnh hưởng dữ liệu; thêm sau rất rẻ và không mất gì nếu để chậm.
  file: `agent/tsconfig.json`
  severity: medium
  Đề xuất: known-limits

- **audit-all mỗi sáng nay ghi tệp đột biến .od-*.ts vào agent/src/agents của checkout chính, dù đang chạy nhánh sạch**
  Người dùng thấy gì: Kiểm tra buổi sáng có thể để sót tệp tạm trong thư mục chạy thật nếu bị ngắt giữa chừng, làm kho báo bẩn. Dữ liệu và kết quả chấm không bị ảnh hưởng.
  Căn cứ: Hậu quả nhẹ và tự dọn được bằng tay, nhưng xảy ra trên máy chạy thật nên đáng sửa trong một việc riêng.
  file: `agent/probes/o-duong-that.test.ts`
  severity: low
  Đề xuất: new-contract

- **Lớp L2 bỏ mất tên đường dạng số (3/2, 30/4, 19/5) khi ô có dấu phẩy đứng sau**
  Người dùng thấy gì: Các đường lớn như 3/2, 30/4 ở TP.HCM có thể bị coi là số nhà, nên hai tin cùng căn có thể bị tách nhầm là khác đường. Người duyệt thấy lý do lệch đường sai trên trang duyệt.
  Căn cứ: Gây ghép sót hoặc lệch nhầm ở những đường rất phổ biến nhưng DB hiện chưa có giá trị như vậy; người duyệt còn sửa tay được, nên sửa trong việc riêng.
  file: `agent/src/agents/judge-entity.ts`
  severity: medium
  Đề xuất: new-contract

- **Lớp L3 xoá luôn tên đường khi tên đứng TRƯỚC cụm hẻm («tôn thất tùng hẻm 86»)**
  Người dùng thấy gì: Ô đường kiểu «Tôn Thất Tùng hẻm 86» mất tín hiệu tên đường, nên cặp tin cùng căn chỉ ra «thiếu» thay vì «khớp». Không gây lệch sai, chỉ mất một dấu hiệu xác nhận.
  Căn cứ: Hậu quả nhẹ vì chỉ mất tín hiệu chứ không gây loại nhầm, và người duyệt xem lại được; sửa gọn trong lát sau.
  file: `agent/src/agents/judge-entity.ts`
  severity: low
  Đề xuất: new-contract

- **Hình dạng 4 + 5 (âm-tính-một-mình / tuyên quét lớp nhưng thiếu ma trận): CD-AC-12 không đặt sàn cho L1, L4, L5 và chỉ có chiều đỏ cho L3**
  Người dùng thấy gì: Phép kiểm trên dữ liệu thật có thể báo xanh dù một lớp nào đó không chọn được giá trị nào, hoặc lỗi ở lớp L1, L4, L5 không bị bắt. Người xem báo cáo có thể tin nhầm là đã phủ đủ năm lớp.
  Căn cứ: Số giá trị theo lớp đã được in ra nên người đọc tự thấy lớp rỗng; rủi ro là bỏ sót lỗi chứ không mất dữ liệu, ghi lại làm hạn chế đã biết là đủ.
  file: `agent/probes/o-duong-that.test.ts`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 4 (âm-tính-một-mình): assert «khoá không chứa '5m'» không có chiều đỏ hay đối chứng dương**
  Người dùng thấy gì: Một phép kiểm có thể vẫn xanh nếu bộ tách sinh ra khoá rác khác dạng. Người dùng cuối không bị ảnh hưởng, chỉ giảm độ chắc của bài kiểm.
  Căn cứ: Chỉ làm bài kiểm yếu đi ở một ca hẹp, các ca khác đã phủ cặp liên quan; chi phí dựng thêm đối chứng lớn hơn hậu quả.
  file: `agent/tests/judge-entity-duong.test.ts`
  severity: low
  Đề xuất: wont-fix

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
