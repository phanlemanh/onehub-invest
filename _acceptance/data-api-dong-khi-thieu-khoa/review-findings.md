## Trong hợp đồng

- **Hình dạng 4 (assertion âm tính đứng một mình): AC-6 «không lộ khoá» không thu stdout/stderr trong tiến trình, còn phép đối chứng dương không đi qua đường gom**
  AC: AC-6
  file: `data-api/test/auth-dong.test.ts:330`
  severity: medium
  source: measurement
  detail: E6 hứa gom «mọi thân trả về, stdout, stderr» rồi soát chuỗi canh. Trong code, `gom` chỉ nhận thân HTTP (dòng 60, hàm goi) và stdout/stderr của tiến trình con AC-5 (dòng 246). Mọi lời gọi `app.request` của AC-1 đến AC-4 và AC-6 chạy ngay trong tiến trình test, nên `console.log`/`console.error` của middleware (kể cả `logger()` của hono) không bị bắt. Riêng AC-3 gửi chuỗi canh làm khoá thật qua header `Authorization: Bearer ${CANH}-mot`. Nếu một bản hồi quy trong auth.ts in header hay danh sách khoá ra console, khoá sẽ lộ mà AC-6 vẫn xanh. Ở tiến trình con, ca «production có khoá» có chuỗi canh trong env nhưng không gửi request nào mang khoá đó. Phép đối chứng ở dòng 330, `coCanh(JSON.stringify({error:{message:`x ${CANH} y`}}))`, chỉ chứng `String.includes` chạy được trên một chuỗi dựng tại chỗ. Nó không cấy chuỗi canh vào bất kỳ kênh nào mà `gom` thu, nên không chứng được bộ gom phủ đường lộ. Assertion `lo.length === 0` (dòng 332) vì vậy là phép âm tính, không có đối chứng dương trên cùng đường đo.
  rationale: AC-6 đòi khi chạy các ca AC-1, AC-3, AC-5 thì không thân trả về, stdout hay stderr nào chứa chuỗi canh; finding chỉ ra stdout/stderr trong tiến trình của AC-1 và AC-3 không được thu nên AC-6 chưa được chứng minh như đã viết.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **README công khai vẫn hướng dẫn tự host bằng Docker và PaaS mà không đặt DATA_API_KEYS, nên làm theo đúng hướng dẫn thì máy chủ không khởi động hoặc trả 503**
  Người dùng thấy gì: Người ngoài làm theo hướng dẫn tự cài trong tài liệu công khai sẽ thấy máy chủ không chạy hoặc trả lỗi 503 vì thiếu khoá, dù bảng biến môi trường đã nói đúng.
  Căn cứ: Chỉ làm người tự cài vướng một lần lúc dựng, không mất hay lộ dữ liệu, họ tự khắc phục được khi đọc thông báo lỗi, và sửa tài liệu rất rẻ.
  file: `data-api/README.md`
  severity: medium
  Đề xuất: known-limits

- **pham-vi.mjs không bao giờ nhận ra HT19 đã vào main khi main gộp kiểu squash, nên báo vi phạm AC-8 giả sau khi nhánh đồng bộ main**
  Người dùng thấy gì: Công cụ kiểm phạm vi có thể báo đỏ nhầm đúng lúc chuẩn bị gộp, làm người duyệt mất thời gian dò lại; sản phẩm đến tay người dùng không bị ảnh hưởng.
  Căn cứ: Hậu quả chỉ là báo động giả cho người duyệt, không đụng đến người dùng cuối hay dữ liệu, và người duyệt tự nhận ra được khi đối chiếu danh sách tệp.
  file: `_acceptance/data-api-dong-khi-thieu-khoa/probes/pham-vi.mjs`
  severity: medium
  Đề xuất: known-limits

- **README vẫn hướng dẫn chạy Docker/Vercel không có DATA_API_KEYS, nay server thoát ngay hoặc trả 503 mọi route**
  Người dùng thấy gì: Người dựng API theo hướng dẫn Docker hoặc Vercel trong tài liệu sẽ gặp máy chủ thoát ngay hoặc trả 503, vì hướng dẫn chưa nhắc đặt khoá.
  Căn cứ: Gây vướng lúc dựng nhưng không làm lộ hay mất dữ liệu, thông báo lỗi nói rõ thiếu khoá, và sửa tài liệu rất rẻ.
  file: `data-api/README.md`
  severity: low
  Đề xuất: known-limits

- **pha.mjs gọi process.exit(2) trong khối try nên bỏ qua finally, để lại thư mục tạm**
  Người dùng thấy gì: Khi công cụ kiểm thất bại ở một nhánh lỗi hiếm, nó để lại một thư mục tạm trên máy người chạy kiểm; người dùng sản phẩm không bị ảnh hưởng.
  Căn cứ: Chỉ tốn một ít đĩa tạm trên máy người chấm, hệ điều hành tự dọn được, không ảnh hưởng người dùng hay dữ liệu.
  file: `_acceptance/data-api-dong-khi-thieu-khoa/probes/pha.mjs`
  severity: low
  Đề xuất: wont-fix

- **Hình dạng 4 (không ghim thông điệp): pha.mjs nhận một ca là «bản cũ đỏ» chỉ theo tên ca, không theo thông điệp hỏng**
  Người dùng thấy gì: Phép kiểm chiều đỏ trên bản cũ có thể coi là đạt dù ca đỏ vì lý do khác; điều này làm bằng chứng yếu đi chứ không làm sản phẩm sai.
  Căn cứ: Chỉ làm bằng chứng nghiệm thu kém chặt, không đụng người dùng hay dữ liệu, và có bản chạy trên cây thật xanh làm đối chứng gián tiếp.
  file: `_acceptance/data-api-dong-khi-thieu-khoa/probes/pha.mjs`
  severity: low
  Đề xuất: known-limits

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
