## Trong hợp đồng

- **Hình dạng 5 (tuyên quét LỚP nhưng luật quét chỉ bắt một khuôn): bảng phủ và E8 bỏ sót tệp test rơi về DB chung qua hằng số**
  file: `scripts/kiem-ht35.mjs:64`
  severity: medium
  AC: AC-8
  source: measurement
  detail: quetKho() chỉ nhận một tệp khi `DATABASE_URL ?? | ||` đứng ngay trước một CHUỖI LITERAL, qua regex /DATABASE_URL\s*(\?\?|\|\|)\s*[`"']([^`"']+)/. Mặc định viết bằng tên hằng thì lọt. Ở 1a2cb6a43, scripts/dev-ops-account.test.mjs (dòng 131, 133, 191) và scripts/dev-register-check.test.mjs (dòng 87, 89) đều dùng `process.env.DATABASE_URL ?? DEFAULT_DATABASE_URL`. Hằng này được export trong scripts/dev-ops-account.mjs:25 với giá trị URL postgres tới localhost:5433, DB oneinvest, tức đúng DB chung. Hai tệp đó không có trong bang-phu.md (grep ra 0 dòng). bang-phu.md cũng được dựng theo cùng luật «có chuỗi mặc định». Vì vậy E8 «quét lại cây bằng cùng luật ra đúng tập tệp của bang-phu.md (66)» chỉ là một vòng tự khớp: bảng và thước dùng cùng một luật hẹp, không ai liệt kê trước cả lớp «tệp test rơi về DB chung». AC-8 tuyên phủ trọn lớp, nhưng ma trận thiếu phần tử ngay trong scripts/. Ngoài ra s.match() không cờ g chỉ xét lần xuất hiện đầu tiên trong mỗi tệp. Nếu lần đầu trỏ DB khác mà một lần sau trỏ /oneinvest thì tệp cũng lọt.
  rationale: AC-8 đòi bảng phủ đủ mọi tệp test rơi về DB chung; hai tệp dùng hằng số mặc định trỏ DB chung bị thiếu nên bảng không đủ.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Đã nới MAU_DB_THU nhưng lời từ chối và chú thích đầu tệp vẫn ghi chỉ nhận oneinvest_suite_***
  Người dùng thấy gì: Khi bị chặn, thông báo vẫn nói chỉ cho chạy trên một kiểu tên DB thử, dù thực tế đã nhận thêm một kiểu nữa. Người chạy test có thể hiểu sai nhưng việc chặn vẫn đúng.
  Căn cứ: Chỉ sai chữ trong thông báo, không mất hay lộ dữ liệu, người dùng đọc lại tài liệu là hiểu, sửa sau rất rẻ.
  file: `pipeline/lib/db-thu-chot.mjs`
  severity: low
  Đề xuất: known-limits

- **RV-3 ghi bản đột biến không có rào vào ngay trong cây kho (scripts/, pipeline/)**
  Người dùng thấy gì: Nếu lượt kiểm bị ngắt giữa chừng, một tệp test không có rào có thể còn sót trong kho và lần sau bị chạy nhầm lên DB chung. Hiếm xảy ra nhưng nếu xảy ra thì có thể ghi dữ liệu test vào DB thật.
  Căn cứ: Chỉ xảy ra khi lượt chấm bị giết đột ngột, tệp sót nhìn thấy và xoá tay được, nhưng hậu quả nếu bị chạy là ghi nhầm vào DB chung.
  file: `pipeline/scripts/db-thu-chot.test.mjs`
  severity: low
  Đề xuất: known-limits

- **Chú thích đầu kiem-ht35.mjs ghi 'chỉ đọc kho, không nối DB', sai với việc tệp làm**
  Người dùng thấy gì: Mô tả đầu công cụ chấm nói nó chỉ đọc, nhưng thực ra có lệnh chạy test ghi DB và tạo bản làm việc phụ. Người chấm có thể chạy nó mà không lường hết tác dụng phụ.
  Căn cứ: Chỉ là chú thích gây hiểu lầm cho người chấm, không ảnh hưởng người dùng cuối, sửa một dòng là xong.
  file: `scripts/kiem-ht35.mjs`
  severity: low
  Đề xuất: known-limits

- **E7d chỉ so tập ca đỏ, không so số ca chạy: một tệp test thoát sớm ở nhánh «bỏ qua» làm mất hết ca mà phép đo vẫn PASS**
  Người dùng thấy gì: Phép đo so sánh với bản gốc có thể báo đạt dù một tệp test lặng lẽ bỏ qua toàn bộ ca của nó. Độ tin cậy của kết quả chấm giảm ở một góc hẹp.
  Căn cứ: Là điểm yếu của thước đo chứ không phải lỗi sản phẩm, các phép đo khác đã chặn đúng kiểu xanh rỗng này ở chỗ chính, sửa sau không đắt.
  file: `scripts/kiem-ht35.mjs`
  severity: medium
  Đề xuất: known-limits

- **CI GitHub lặng lẽ thôi chạy check-freshness.test và import-s09-danh-ba.test mà job vẫn xanh**
  Người dùng thấy gì: Trên CI của GitHub, hai nhóm test này không còn chạy nhưng kết quả vẫn xanh, nên lỗi ở hai chỗ đó có thể lọt qua mà không ai biết. Chúng vẫn chạy ở lượt chấm trên máy.
  Căn cứ: Đã được ghi nhận công khai và có hàng kế tiếp xử lý, mất độ phủ tạm thời chứ không mất dữ liệu, bù lại bằng lượt chấm trên máy.
  file: `scripts/check-freshness.test.mjs`
  severity: low
  Đề xuất: known-limits

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
