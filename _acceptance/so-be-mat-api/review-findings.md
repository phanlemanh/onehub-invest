## Trong hợp đồng

- **Bộ kiểm bỏ sót nhánh bearer khi module được import gọi canCallOpsApi (route admin hoặc ops-session vẫn qua)**
  AC: AC-3
  file: `scripts/check-api-surface.mjs:110`
  severity: medium
  source: bugs
  detail: Dòng 109-110 dò nhánh bearer bằng `own.some(g => /\bOPS_API_TOKEN\b/ …) || /\bcanCallOpsApi\(/.test(run)`. `own` đã loại ops-access.ts, mà đó là chỗ DUY NHẤT có chữ OPS_API_TOKEN trong canCallOpsApi. Còn lời gọi `canCallOpsApi(` thì chỉ được tìm trong `run`, tức mã của chính route.ts, không tìm trong bao đóng import. Vì vậy một route chỉ-phiên giao cổng cho một lib, và lib đó gọi canCallOpsApi, sẽ không bị coi là có nhánh bearer. Đây đúng là cấu trúc của route admin duy nhất: app/src/app/api/zalo-media/route.ts chỉ gọi serveZaloMedia ở app/src/lib/ops/zalo-media.ts. Đã thử trên cây thật: sửa zalo-media.ts thành `import { isAdmin, canCallOpsApi } …` và đổi cổng ở dòng 113 thành `if (!(await canCallOpsApi(req, async () => user)) && !isAdmin(user)) return 404`. Kết quả checkApiSurface trả `violations: []`, không có `adminBearer`. Như vậy luật vừa thêm ở vòng S4-r1, «sổ phải rộng bằng hoặc hơn mã; chế độ admin/ops-session mà mã nhận bearer → đỏ», không giữ được với chính route admin đang có: một máy cầm OPS_API_TOKEN đọc được ảnh tầng A mà sổ vẫn khai `admin`. M15 không bắt được ca này vì nó chèn bearer thẳng vào route.ts. Cách sửa: tìm `canCallOpsApi(` trên cả bao đóng `own` (mã đã bỏ import), không chỉ trong `run`, rồi thêm một đột biến đặt canCallOpsApi trong lib zalo-media.ts.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Hình dạng 5 — nói quét cả lớp «chế độ chỉ-phiên mà nhận bearer» nhưng M15/M16 chỉ thử một trong ba nhánh dò bearer**
  Người dùng thấy gì: Bộ kiểm tự động có hai đường phát hiện route nhận nhầm khóa vận hành mà chưa có phép thử riêng. Nếu một đường hỏng thì kiểm vẫn báo xanh, và người dùng không hay biết route đang hở.
  Căn cứ: Chỉ là chỗ thiếu bài thử cho bộ kiểm, hôm nay chưa có route nào bị hở vì nó; sửa sau rẻ và không ảnh hưởng dữ liệu người dùng.
  file: `scripts/check-api-surface.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 3 — chế độ ops chỉ kiểm «có chữ OPS_API_TOKEN» và «có chữ canAccessOps(/isAdmin(», không kiểm cổng phiên có thực sự chặn**
  Người dùng thấy gì: Với các route vận hành viết tay, bộ kiểm chỉ xác nhận có đoạn kiểm quyền chứ không xác nhận nó chặn thật. Một người sửa sai có thể làm hở cổng mà bộ kiểm vẫn báo đạt.
  Căn cứ: Rủi ro chỉ xảy ra khi có người sửa sai các route này sau này, và chúng đang được đóng đúng; hợp đồng đã loại nhóm route này khỏi phạm vi, nên ghi hạn chế đã biết là đủ.
  file: `scripts/check-api-surface.mjs`
  severity: medium
  Đề xuất: known-limits

- **Kiểm cổng chỉ cần helper xuất hiện một lần trong file, không kiểm từng phương thức đã export (r1 · tệp đã đổi)**
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
