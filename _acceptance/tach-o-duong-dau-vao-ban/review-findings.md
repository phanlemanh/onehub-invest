## Trong hợp đồng

(không có)

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Tệp TS mới agent/probes/ nằm ngoài tsconfig nên `tsc --noEmit` của agent không kiểm**
  Người dùng thấy gì: Mã đo dữ liệu thật mới nằm ngoài bước kiểm kiểu thường lệ, nên lỗi kiểu trong đó sẽ không bị báo sớm. Người dùng cuối không thấy ảnh hưởng.
  Căn cứ: Chỉ làm yếu một lớp kiểm của công cụ nội bộ, không ảnh hưởng dữ liệu hay người dùng, và lỗi thật vẫn lộ khi chạy probe.
  file: `agent/tsconfig.json`
  severity: medium
  Đề xuất: known-limits

- **L2 biến ô chỉ ghi bề rộng hẻm («3,5m», «4,5m», «7,5m») thành khoá «5m»: tin có đường thật bị chấm «khác đường» và loại thành khác căn**
  Người dùng thấy gì: Khi ô đường của tin chỉ ghi bề rộng hẻm như «3,5m», hai tin cùng một căn có thể bị coi là khác căn và bị loại khỏi gộp. Tin có thể bị tách nhầm, người duyệt thấy nhãn «Lệch» sai trên bảng duyệt.
  Căn cứ: Lỗi có thật trên dữ liệu máy thu và còn làm hỏng cả bảng duyệt, nhưng chỉ ảnh hưởng một số ít ô đường bẩn, không mất dữ liệu và có thể rà lại sau khi sửa.
  file: `agent/src/agents/judge-entity.ts`
  severity: high
  Đề xuất: new-contract

- **Danh sách miễn hành chính của L2 chỉ có dạng có dấu hoặc có chấm: «15, Q1», «208, P12», «12, Phuong 5», «2A, Khu dân cư…» đều ra khoá giả và bị chấm «Lệch»**
  Người dùng thấy gì: Những tin có ô đường kiểu «15, Q1» hay «208, P12» có thể bị coi là khác căn với tin cùng căn, trong khi trước đây chúng được bỏ qua. Hệ quả là một số cặp tin trùng bị tách nhầm.
  Căn cứ: Gây tách nhầm cho một nhóm tin nhỏ có dạng viết tắt, không mất dữ liệu gốc, và sửa sau vẫn xử lại được; nhưng nên làm vì là hồi quy so với trước.
  file: `agent/src/agents/judge-entity.ts`
  severity: medium
  Đề xuất: new-contract

- **Hình dạng 4 (lọc âm tính không có đối chứng dương): nhánh loại trừ mới của biLoai và goSaiDauTienTo không có ca nào ghim**
  Người dùng thấy gì: Bộ lọc của một phép đo chất lượng nội bộ có thể bỏ sót một số giá trị lệch thật mà không báo đỏ. Người dùng cuối không bị ảnh hưởng trực tiếp.
  Căn cứ: Chỉ làm phép đo nội bộ kém nhạy hơn, không đụng dữ liệu hay giao diện người dùng, và hợp đồng đã ghi rõ phần này để việc riêng.
  file: `agent/tests/judge-entity-khong-dau.test.ts`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 2 (bộ tách «độc lập» chép nguyên khuôn của bên được đo): chuan() của probe sao y ba dòng L4/L5/L1 của khoaDuong**
  Người dùng thấy gì: Phép đo dữ liệu thật dùng lại chính ba bước chuẩn hoá của bộ tách nên không bắt được trường hợp một bước viết sai. Người dùng cuối không thấy ngay.
  Căn cứ: Mức độ thấp: phép đo vẫn bắt được việc bỏ hẳn một bước và không đụng dữ liệu, chỉ là độ phủ phát hiện lỗi chưa tối đa.
  file: `agent/probes/o-duong-that.test.ts`
  severity: low
  Đề xuất: known-limits

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
