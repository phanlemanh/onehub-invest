## Trong hợp đồng

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Thước DS1 do-duong-s06 nay in nguyên số điện thoại ra stdout**
  Người dùng thấy gì: Khi chạy thước đo đường của hồ sơ trước, số điện thoại thật của người bán có thể bị in ra màn hình và lọt vào bằng chứng nghiệm thu trên kho công khai.
  Căn cứ: Số người bán vốn là thông tin công khai nên mức nặng vừa, nhưng nó trái lời hứa không in số và đã nằm trên kho công khai; sửa rẻ, tách thành việc riêng vì hồ sơ cũ đã ký.
  file: `pipeline/scripts/do-duong-s06.mjs`
  severity: medium
  Đề xuất: new-contract

- **Phát biểu nguồn mang số trong lượt bị rút với lý do `nguon-bo-trong`, không phải `chua-sdt`**
  Người dùng thấy gì: Nhật ký kiểm toán ghi sai lý do rút cho một số giá trị đường mang số, nên người rà soát có thể đọc nhầm nguyên nhân. Dữ liệu hiển thị cho người dùng không sai.
  Căn cứ: Chỉ lệch dấu vết kiểm toán, không mất hay lộ dữ liệu, và không ai dùng lý do này để quyết định gì nên chấp nhận và ghi lại.
  file: `pipeline/transform-chotot.mjs`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 4 — Assertion âm tính một mình: «field_assertions không có trong CLOUD_ALLOW» không chứng minh được «không lên cloud»**
  Người dùng thấy gì: Phép kiểm chưa chặn được trường hợp sau này ai đó cho bảng phát biểu cũ lên cloud, khi đó số điện thoại đã rút có thể lên cloud mà kiểm tra vẫn xanh.
  Căn cứ: Hiện chưa có gì đưa bảng đó lên cloud nên chưa ai bị ảnh hưởng; rủi ro chỉ xuất hiện khi có thay đổi tương lai ngoài phạm vi, nên ghi lại là đủ.
  file: `pipeline/scripts/sdt-trong-duong.itest.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 4 — Assertion âm tính một mình: «lượt kế retracted 0» không nhìn thấy hai đường rút của tính năng**
  Người dùng thấy gì: Phép kiểm chạy lại chưa đếm hết các lần rút giá trị, nên có thể bỏ sót việc hệ thống lặp lại rút ở lượt sau. Giá trị người dùng thấy vẫn được kiểm riêng.
  Căn cứ: Không thấy sai lệch thật và kết quả cuối vẫn được các kiểm khác bắt, nên hậu quả nhẹ và sửa sau cũng không đắt hơn.
  file: `pipeline/scripts/sdt-trong-duong.itest.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 2 — Fixture viết tay: `plan` và `columns` của buildSwapSql không rút từ bên sinh thật**
  Người dùng thấy gì: Kiểm tra đồng bộ cloud dùng dữ liệu mẫu tự viết thay vì lấy từ luồng thật, nên có thể không phản ánh đúng mọi cách tráo bảng ngoài thực tế.
  Căn cứ: Phần đọc dữ liệu vẫn đi qua mã thật và mất cột vẫn bị bắt, nên rủi ro thấp; dựng lại fixture tốn công hơn lợi ích.
  file: `pipeline/scripts/sdt-trong-duong.itest.mjs`
  severity: low
  Đề xuất: wont-fix

- **Hình dạng 4 — Ca đỏ ghim thông điệp do chính ca đỏ tự viết, không qua assertion của ca xanh**
  Người dùng thấy gì: Một vài ca kiểm thử thử-cho-đỏ tự ném lỗi nên chưa chứng minh được phép kiểm chính sẽ đỏ đúng lúc, nhưng người dùng không bị ảnh hưởng.
  Căn cứ: Chỉ là chất lượng bộ kiểm thử nội bộ, phần logic dùng chung nên khả năng sót thấp; sửa không đáng công.
  file: `pipeline/scripts/sdt-trong-duong.itest.mjs`
  severity: low
  Đề xuất: wont-fix

## Chưa adversarial-verify (refuter chết)

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
