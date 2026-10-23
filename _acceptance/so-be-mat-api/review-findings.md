## Trong hợp đồng

Không có.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **DELETE /api/v1/ops/zalo/accounts vẫn nhận id rỗng và chạy `openclaw channels logout --account ""`; ma trận chỉ né lỗi này chứ không sửa, và chưa ghi thành việc cần làm**
  Người dùng thấy gì: Một người gọi đã có quyền ops (hoặc một máy cầm token) gửi yêu cầu xóa tài khoản Zalo với mã trống thì hệ thống vẫn chạy lệnh đăng xuất, có thể làm tài khoản thu Zalo duy nhất bị đăng xuất. Lần này kiểm tay thì chưa hỏng gì.
  Căn cứ: Hậu quả có thể nặng vì ngắt nguồn thu Zalo, nhưng chỉ người đã có quyền ops mới gây ra được và đăng nhập lại QR là khôi phục được; sửa thuộc đường ops nhạy cảm nên nên tách thành việc riêng có kiểm kỹ.
  file: `app/src/app/api/v1/ops/zalo/accounts/route.ts`
  severity: low
  Đề xuất: new-contract

- **Ma trận E12 không có đối chứng dương cho bearer: token lệch hoặc thiếu ở server thì nửa bearer rỗng mà vẫn ĐẠT**
  Người dùng thấy gì: Nếu token trên máy kiểm khác token của app đang chạy, phép kiểm bearer không đo được gì nhưng vẫn báo đạt. Một route lỡ nhận bearer sai chỗ có thể lọt mà không ai thấy khi chạy riêng bước này.
  Căn cứ: Chỉ làm phép kiểm yếu đi chứ không mở lỗ nào ở sản phẩm, chế độ tự thử vẫn bắt được qua ca cần bearer nhận 200, và chạy lại với token đúng là thấy ngay; ghi điều kiện chạy là đủ.
  file: `scripts/smoke-api-matrix.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 5 — nói quét cả lớp «chế độ chỉ-phiên mà nhận bearer» nhưng M15/M16 chỉ thử một trong ba nhánh dò bearer (r2)**
  Người dùng thấy gì: Bộ kiểm tự động có hai đường phát hiện route nhận nhầm khóa vận hành mà chưa có phép thử riêng. Nếu một đường hỏng thì kiểm vẫn báo xanh, và người dùng không hay biết route đang hở.
  Căn cứ: Chỉ là chỗ thiếu bài thử cho bộ kiểm, hôm nay chưa có route nào bị hở vì nó; sửa sau rẻ và không ảnh hưởng dữ liệu người dùng.
  file: `scripts/check-api-surface.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 3 — chế độ ops chỉ kiểm «có chữ OPS_API_TOKEN» và «có chữ canAccessOps(/isAdmin(», không kiểm cổng phiên có thực sự chặn (r2)**
  Người dùng thấy gì: Với các route vận hành viết tay, bộ kiểm chỉ xác nhận có đoạn kiểm quyền chứ không xác nhận nó chặn thật. Một người sửa sai có thể làm hở cổng mà bộ kiểm vẫn báo đạt.
  Căn cứ: Rủi ro chỉ xảy ra khi có người sửa sai các route này sau này, và chúng đang được đóng đúng; hợp đồng đã loại nhóm route này khỏi phạm vi, nên ghi hạn chế đã biết là đủ.
  file: `scripts/check-api-surface.mjs`
  severity: medium
  Đề xuất: known-limits

- **Kiểm cổng chỉ cần helper xuất hiện một lần trong file, không kiểm từng phương thức đã export (r1)**
  Người dùng thấy gì: Nếu ai đó vô tình bỏ bước xác thực ở một thao tác của trang vận hành Zalo (ví dụ xoá tài khoản), bộ kiểm tự động vẫn báo đạt nên lỗ hổng có thể lọt qua mà không ai biết.
  Căn cứ: Rủi ro chỉ xảy ra khi có người sửa nhầm mã sau này, bộ kiểm hiện tại vẫn bắt được trường hợp bỏ hẳn cổng, và việc siết thêm thuộc về vòng riêng chứ không làm hỏng hành vi đang chạy.
  file: `scripts/check-api-surface.mjs`
  severity: low
  Đề xuất: known-limits

- **mcp-tools.json vẫn quảng bá /api/v1/offers là công khai — client MCP sẽ nhận 401 (r1)**
  Người dùng thấy gì: Các công cụ AI nạp danh mục công cụ của hệ thống vẫn tưởng danh sách tin rao bán là công khai, nên mỗi lần gọi sẽ bị từ chối và người dùng thấy công cụ đó hỏng.
  Căn cứ: Công cụ tin rao hỏng hoàn toàn với người dùng AI nhưng không lộ hay mất dữ liệu, và sửa danh mục rẻ nhưng nằm ngoài những gì đợt này đã ký nên cần một việc nhỏ riêng.
  file: `app/docs/api/mcp-tools.json`
  severity: medium
  Đề xuất: new-contract

- **audit-all.sh vẫn xếp offers/deals đã tạm đóng dưới tiêu đề «E. PUBLIC APIs», trái với đáp án E6 (r1)**
  Người dùng thấy gì: Báo cáo kiểm tra hệ thống vẫn ghi tin rao bán và giao dịch dưới mục API công khai dù thực tế đã đóng, có thể làm người đọc báo cáo hiểu nhầm; kết quả đo thật vẫn đúng.
  Căn cứ: Chỉ là nhãn trong báo cáo, không ảnh hưởng người dùng cuối hay dữ liệu, và có thể sửa lại bất cứ lúc nào mà không có hậu quả.
  file: `scripts/audit-all.sh`
  severity: low
  Đề xuất: known-limits

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
