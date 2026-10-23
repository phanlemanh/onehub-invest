# Review findings: ops-access-hardening (round 1)

## Trong hợp đồng

Không có finding nào map được vào AC.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Comment trong /ops/deals vẫn mô tả cổng Ops mở cũ, giờ đã sai**
  Người dùng thấy gì: Người dùng không thấy gì khác: trang vẫn chặn và cho vào đúng như đã duyệt. Chỉ có một dòng ghi chú nội bộ còn mô tả luật cũ nên có thể làm người bảo trì hiểu nhầm.
  Căn cứ: Không ảnh hưởng người dùng, không mất hay lộ dữ liệu, và sửa lúc nào cũng rẻ nên chỉ cần ghi nhận.
  file: `app/src/app/ops/deals/page.tsx`
  severity: low
  Đề xuất: known-limits

- **Gốc /tmp/openclaw vẫn mở ảnh QR đăng nhập Zalo, không chỉ ảnh tin**
  Người dùng thấy gì: Quản trị viên vẫn xem được ảnh mã QR đăng nhập Zalo nằm trong thư mục tạm của hệ thống. Người thường và nhân viên vận hành không xem được.
  Căn cứ: Chỉ quản trị viên chạm tới được, và họ vốn đã đăng nhập Zalo được ở trang quản lý nguồn nên không mở thêm quyền thật; hợp đồng đã chấp nhận rủi ro này.
  file: `app/src/app/api/zalo-media/route.ts`
  severity: low
  Đề xuất: known-limits

- **Smoke: thông báo lỗi khi admin bị 404 ở /ops/deals giờ chỉ sai nguyên nhân**
  Người dùng thấy gì: Người dùng không bị ảnh hưởng. Nếu bài kiểm tra tự động báo lỗi thì dòng gợi ý nguyên nhân có thể chỉ nhầm hướng, người kiểm tra mất thêm chút thời gian tìm lỗi.
  Căn cứ: Không có hậu quả với người dùng hay dữ liệu, bài kiểm tra vẫn báo lỗi đúng lúc, chỉ làm chậm việc chẩn đoán một chút.
  file: `scripts/smoke-portal-compliance.mjs`
  severity: low
  Đề xuất: wont-fix

- **Hình dạng 4 (assertion âm tính đứng một mình, không ghim lý do): ba ca 403 của E9/AC-6 không đo việc giới hạn gốc**
  Người dùng thấy gì: Hiện tại quản trị viên không đọc được tệp cấu hình hay thông tin xác thực của OpenClaw. Tuy nhiên bài kiểm tra tự động có thể không phát hiện nếu sau này ai đó vô tình mở lại cả thư mục OpenClaw.
  Căn cứ: Hành vi hiện tại đúng và an toàn; rủi ro chỉ nằm ở việc lỗi tương lai có thể lọt qua kiểm tra, người dùng không bị ảnh hưởng ngay.
  file: `scripts/smoke-portal-compliance.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 5 (tuyên quét LỚP nhưng chỉ có điểm-case): ma trận canAccessOps có 8 dòng viết tay so với lưới người xem × OPS_EMAILS đã khai**
  Người dùng thấy gì: Quy tắc ai được vào khu vận hành đang đúng với các tình huống đã thử. Một vài tổ hợp hiếm, như nhân viên vận hành khi danh sách email ngoại lệ có đặt nhưng không chứa họ, chưa được kiểm tự động.
  Căn cứ: Không có lỗi thật được chỉ ra, chỉ là vài tổ hợp hiếm chưa được kiểm; nếu sai thì người dùng chỉ bị chặn hoặc cho vào nhầm và sửa nhanh qua cấu hình.
  file: `scripts/check-portal-compliance.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 4 (grep âm tính một mình): E12 chỉ cấm startsWith trên ba tên biến cố định**
  Người dùng thấy gì: Người dùng không bị ảnh hưởng: đường dẫn giả mạo cùng tiền tố vẫn bị chặn. Chỉ là kiểm tra tự động có thể bỏ sót nếu sau này có người viết lại cách so sánh theo kiểu khác.
  Căn cứ: Hành vi thật đã được kiểm bằng ca chạy thật và đúng, nên đây chỉ là lưới an toàn phụ yếu cho tương lai.
  file: `scripts/check-portal-compliance.mjs`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 3 (assert chuỗi có mặt trong khi lời hứa là quan hệ): kiểm 'path.relative trên cả path chữ lẫn realpath'**
  Người dùng thấy gì: Hiện tại ảnh trỏ ra ngoài vùng cho phép qua đường tắt vẫn bị chặn. Kiểm tra tự động chỉ xác nhận có đoạn mã liên quan chứ chưa chứng minh nó được dùng đúng cách.
  Căn cứ: Hành vi thực tế đã có ca chạy thật bảo vệ, nên đây chỉ là điểm yếu của lớp kiểm phụ; người dùng không bị ảnh hưởng.
  file: `scripts/check-portal-compliance.mjs`
  severity: low
  Đề xuất: known-limits

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
