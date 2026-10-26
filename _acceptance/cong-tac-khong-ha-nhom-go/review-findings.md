# Review findings: cong-tac-khong-ha-nhom-go (round 1)

## Trong hợp đồng

Không có finding nào map được vào AC.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Phép đối chứng chép route từ origin/main nên sẽ đỏ mãi sau khi merge, trái luật đã ghi của kho**
  Người dùng thấy gì: Công tắc nhóm thu vẫn chạy đúng cho người dùng. Nhưng sau khi gộp, bài kiểm tự động của tính năng này sẽ báo đỏ dù không có lỗi, làm nhiễu kết quả kiểm tra và che mất lỗi thật về sau.
  Căn cứ: Không ảnh hưởng người dùng cuối hay dữ liệu, chỉ làm hàng rào kiểm tra báo sai; sửa sau không đắt nhưng nên làm trước khi bài kiểm bị tin cậy ở các vòng sau.
  file: `app/tests/cong-tac-nhom-go.test.tsx`
  severity: high
  Đề xuất: new-contract

- **Phần expected của eval E1 tả đối chứng khác với cái test thực sự làm**
  Người dùng thấy gì: Không ảnh hưởng gì tới người dùng công tắc nhóm thu. Chỉ là mô tả trong hồ sơ nghiệm thu viết hơi khác với cách bài kiểm chạy thật, người đọc đối chiếu có thể bối rối.
  Căn cứ: Hậu quả chỉ là tài liệu lệch chữ, không mất dữ liệu, không đổi hành vi; sửa lúc nào cũng rẻ nên ghi lại và để đó.
  file: `_acceptance/cong-tac-khong-ha-nhom-go/evals.yaml`
  severity: low
  Đề xuất: known-limits

- **Đối chứng của test lấy route từ `origin/main` theo lúc chạy, nên sau khi merge CT-AC-1 và CT-AC-2 sẽ luôn đỏ**
  Người dùng thấy gì: Công tắc nhóm thu vẫn đúng cho người dùng, nhưng sau khi gộp, các bài kiểm về nhóm đã gỡ và nhóm đã xong sẽ tự đỏ dù không có lỗi, nên không còn dùng làm hàng rào chống lỗi quay lại được.
  Căn cứ: Không gây hại trực tiếp cho người dùng, chỉ làm mất công cụ canh lỗi tái phát; sửa riêng một lần là xong và không gấp.
  file: `app/tests/cong-tac-nhom-go.test.tsx`
  severity: medium
  Đề xuất: new-contract

- **Hình dạng 6 (đo ngoài cây đang kiểm): đối chứng lấy route từ ref trôi `origin/main` thay vì commit gốc cố định**
  Người dùng thấy gì: Kết quả bài kiểm có thể khác nhau tuỳ máy chạy (máy chưa cập nhật hoặc đã gộp xong), nên có lúc báo đỏ sai hoặc xanh sai về công tắc nhóm thu.
  Căn cứ: Người dùng cuối không bị ảnh hưởng, chỉ độ tin cậy của kiểm tra; trùng với lỗi bài kiểm hỏng sau gộp nên sửa chung một lần, không gấp.
  file: `app/tests/cong-tac-nhom-go.test.tsx`
  severity: medium
  Đề xuất: new-contract

- **Hình dạng 4 (assertion âm tính một mình): nhánh đồng thời của CT-AC-2 không có đối chứng dương, và lý do bỏ đối chứng ghi trong evals không đúng**
  Người dùng thấy gì: Khi bấm tắt và bật gần như cùng lúc trên nhóm đã gỡ, bài kiểm xác nhận nhóm giữ nguyên, nhưng chưa chứng minh được bài kiểm này sẽ bắt được lỗi nếu có. Người dùng vẫn được bảo vệ ở các trường hợp bấm thường.
  Căn cứ: Chỉ là bằng chứng kiểm chưa chắc tay ở tình huống bấm đồng thời hiếm gặp, không có dấu hiệu mất dữ liệu; người dùng tự bấm lại được, bổ sung sau cũng không đắt.
  file: `app/tests/cong-tac-nhom-go.test.tsx`
  severity: low
  Đề xuất: known-limits

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
