# Review findings: wanted-thanh-inquiry (round 1)

## Trong hợp đồng

Không có finding nào map được vào AC.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **PRODUCT-MAP.md và LO-TRINH.html được sinh từ trạng thái riêng của máy, nên CI `product-map --check` sẽ đỏ**
  Người dùng thấy gì: Bản đồ sản phẩm và trang lộ trình đã commit có ghi một hồ sơ chỉ tồn tại trên máy này. Khi đẩy lên GitHub, bước kiểm tự động sẽ báo đỏ và chặn gộp cho đến khi sinh lại hai tệp.
  Căn cứ: Không mất dữ liệu và không ảnh hưởng người dùng cuối, nhưng sẽ chặn gộp nhánh; người làm tự thấy lỗi ngay khi đẩy lên, và sửa rẻ bằng cách sinh lại hai tệp.
  file: `PRODUCT-MAP.md`
  severity: high
  Đề xuất: new-contract

- **Đối chứng của fixture-goc.mjs không chạy lại phép so, nên luôn xanh**
  Người dùng thấy gì: Phép kiểm tự thử của bước so sánh giao diện luôn báo đúng, nên nếu bước so sánh hỏng thì người chấm có thể không biết. Giao diện hiển thị cho người dùng không bị ảnh hưởng.
  Căn cứ: Chỉ làm yếu một lớp bảo vệ phụ, không sai chữ nào trên màn hình; bước so chính vẫn chạy và rủi ro nhẹ, nên ghi lại là đủ.
  file: `_acceptance/wanted-thanh-inquiry/rang/fixture-goc.mjs`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 4 (assertion âm tính đứng một mình, không ghim thông điệp): đối chứng của răng fixture-goc là một phép «khác nhau» luôn đúng, không chạy qua nhánh báo «lệch bản chụp»**
  Người dùng thấy gì: Phép tự thử của bước so sánh giao diện chỉ xác nhận một chuỗi chữ có thể bị đổi, chứ không chứng minh bước so bắt được chỗ lệch. Người dùng không thấy khác biệt nào.
  Căn cứ: Đây là điểm yếu của công cụ kiểm, không phải của sản phẩm; không ảnh hưởng dữ liệu hay màn hình người dùng, và có thể vá sau mà không mất gì.
  file: `_acceptance/wanted-thanh-inquiry/rang/fixture-goc.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 5 (tuyên bố quét cả lớp nhưng ma trận chỉ gồm các ca điểm): ma trận 6 dạng tên cũ bỏ sót dạng liệt kê nối bằng «·» hay «,», mà dạng «·» chính là dạng có trong hai tài liệu vòng này sửa**
  Người dùng thấy gì: Công cụ rà tên cũ chưa bắt được vài cách viết liệt kê, nên sau này một tài liệu có thể còn sót chữ cũ mà không ai báo. Người dùng cổng Invest không thấy chữ này.
  Căn cứ: Chữ cũ sót lại chỉ nằm trong tài liệu nội bộ, không làm sai dữ liệu hay giao diện; phát hiện và sửa sau đều rẻ, nên ghi là hạn chế đã biết.
  file: `_acceptance/wanted-thanh-inquiry/rang/con-ten-cu.mjs`
  severity: medium
  Đề xuất: known-limits

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
