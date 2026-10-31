# Review findings: s06-vung-moi-len-canonical (round 1)

## Trong hợp đồng

Không có finding nào map được vào AC.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **PRODUCT-MAP.md và LO-TRINH.html được sinh từ cây cũ: làm mất 3 mục đã có trên main và khiến CI acceptance-gate đỏ**
  Người dùng thấy gì: Trang lộ trình và bản đồ sản phẩm đang thiếu ba mục đã giao và hiển thị số đếm lùi, nên người xem lộ trình thấy tiến độ sai. Bản đồ cũng làm bước kiểm của cổng nghiệm thu đỏ trên PR cho tới khi sinh lại.
  Căn cứ: Chỉ là tài liệu tiến độ sinh tự động, không mất dữ liệu người dùng và chạy sinh lại một lần là đúng, nên ghi nhận rồi sinh lại trước khi gộp.
  file: `PRODUCT-MAP.md`
  severity: high
  Đề xuất: known-limits

- **Probe phạm vi chặn việc cập nhật ROADMAP mà AGENTS.md bắt buộc khi xong việc**
  Người dùng thấy gì: Tài liệu tiến độ chung của dự án có thể chưa ghi việc vùng mới đã lên canonical, vì phép kiểm phạm vi sẽ báo đỏ nếu sửa nó trong cùng nhánh. Người đọc tài liệu có thể thấy trạng thái cũ cho tới khi cập nhật ở việc riêng.
  Căn cứ: Chỉ ảnh hưởng tài liệu nội bộ, không động tới dữ liệu hay trải nghiệm người dùng, và cập nhật sau lúc nào cũng được.
  file: `_acceptance/s06-vung-moi-len-canonical/probes/scope.sh`
  severity: low
  Đề xuất: known-limits

- **probes/scope.sh báo 'SCOPE OK' exit 0 khi git merge-base/git diff lỗi (lỗi bị nuốt)**
  Người dùng thấy gì: Phép kiểm xem nhánh có đụng tệp ngoài phạm vi hay không có thể báo xanh giả khi môi trường thiếu thông tin so sánh. Khi đó một thay đổi lạc phạm vi có thể lọt qua mà không ai biết.
  Căn cứ: Chỉ là lưới an toàn phụ, người ký cổng vẫn xem được danh sách thay đổi, và không ảnh hưởng dữ liệu người dùng.
  file: `_acceptance/s06-vung-moi-len-canonical/probes/scope.sh`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 3 (assert chuỗi có mặt thay vì quan hệ): phía transform-chotot của ca quan hệ AC-3 chỉ grep mã nguồn**
  Người dùng thấy gì: Chưa có phép thử chạy thật chứng minh bước chuyển tin S06 dùng đúng danh sách thành phố chung. Nếu sau này có người viết cứng thêm một danh sách riêng, tin của thành phố mới có thể không được gán phường mà test vẫn xanh.
  Căn cứ: Hiện chưa có lỗi thật nào được chỉ ra, tin vẫn vào hệ thống và tự sửa được bằng cách chạy lại, nên chỉ cần ghi là hạn chế của phép kiểm.
  file: `pipeline/lib/thi-truong.test.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 2 (fixture viết tay theo khuôn bên đọc): snapshot S04 giả viết manifest tay khớp importer, không lấy từ writer của collector**
  Người dùng thấy gì: Phép thử dùng dữ liệu ranh giới phường giả dựng theo khuôn của bên đọc, nên nếu bộ thu đổi cách ghi dữ liệu thì phép thử vẫn xanh. Phường của vùng mới có thể không nạp được ngoài đời mà test không báo.
  Căn cứ: Số đo trên dữ liệu thật ở bước nghiệm thu Đà Nẵng vẫn bắt được lỗi này trước khi người dùng thấy, và nạp lại sau khi sửa không mất dữ liệu.
  file: `scripts/s06-vung-moi/acceptance.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 4 (chiều đỏ âm tính một mình): đối chứng đỏ AC-1 bỏ qua mã thoát của migration hỏng, nên xanh cả khi migration không chạy**
  Người dùng thấy gì: Phép thử chứng minh phép đo đổi mã thị trường có thể bắt lỗi chưa chắc đỏ đúng lý do. Nếu có sót khi đổi mã, bước đo chính có thể vẫn bỏ lỡ mà không ai biết.
  Căn cứ: Phép đo chính của việc đổi mã vẫn chạy và kết quả đổi mã được kiểm trực tiếp trước khi áp lên máy thu, nên rủi ro cho người dùng thấp.
  file: `scripts/s06-vung-moi/acceptance.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 5 (tuyên quét cả lớp nhưng chỉ đo một điểm): quetCung chỉ bắt chuỗi thành phố ngay sát dấu nháy, đối chứng dương chỉ thử đúng dạng đó**
  Người dùng thấy gì: Phép quét tìm tên thành phố viết cứng trong code chỉ bắt vài dạng viết, nên có thể sót một chỗ viết cứng. Khi đó thành phố mới có thể không được nhận ở chỗ đó và tin của vùng ấy không được gán phường.
  Căn cứ: Chưa có chỗ sót cụ thể, hậu quả nếu có chỉ là một số tin thiếu phường và sửa được bằng cách chạy lại sau khi vá.
  file: `pipeline/lib/thi-truong.test.mjs`
  severity: medium
  Đề xuất: known-limits

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
