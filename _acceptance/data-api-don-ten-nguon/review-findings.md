# Review findings: data-api-don-ten-nguon (round 1)

## Trong hợp đồng

Không có finding nào map được vào AC.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Tệp test HT19 né lưới PB5 bằng cách cắt chuỗi thay vì khai định danh**
  Người dùng thấy gì: Một tệp kiểm thử vẫn mang tên nguồn thật, chỉ được ghép chuỗi để thước dò báo sạch. Người dùng cuối không thấy gì, nhưng kho công khai vẫn có dấu vết tên nguồn.
  Căn cứ: Hậu quả nhẹ, chỉ là một tệp kiểm thử trên kho công khai và không ảnh hưởng người dùng; sửa sau rẻ và không mất dữ liệu.
  file: `data-api/test/dong-ba-route.test.ts`
  severity: medium
  Đề xuất: known-limits

- **Câu UPDATE đổi giá trị cũ sang mã trong 012 thành câu chết, có thêm giá trị bịa**
  Người dùng thấy gì: Một câu chuyển dữ liệu cũ trong lược đồ mẫu công khai nay không còn khớp dòng nào, và chú thích bên cạnh có thể làm người đọc hiểu sai. Với lược đồ mẫu dựng mới thì kết quả không đổi.
  Căn cứ: Chỉ ảnh hưởng người đọc lược đồ mẫu công khai, không mất dữ liệu thật; câu này vốn đã lỗi trên DB trống nên hậu quả rất nhẹ.
  file: `data-api/db/012_source_registry_roles_dq.sql`
  severity: low
  Đề xuất: known-limits

- **s4-args.json mới commit lên kho công khai vẫn chứa tên nguồn thật (tên tệp cũ)**
  Người dùng thấy gì: Hồ sơ nghiệm thu do công cụ sinh ra có nhắc tên tệp cũ mang tên nguồn thật, và hồ sơ này nằm trên kho công khai. Việc dọn tên nguồn vì vậy chưa trọn ở chỗ này.
  Căn cứ: Là tên tệp trong danh sách thay đổi, không phải dữ liệu người dùng; tệp do công cụ sinh nên không sửa tay được, chỉ cần ghi nhận lý do chấp nhận.
  file: `_acceptance/data-api-don-ten-nguon/s4-args.json`
  severity: low
  Đề xuất: known-limits

- **Migration 012 data-conversion UPDATE turned into a dead statement**
  Người dùng thấy gì: Trên một DB mẫu cũ có sẵn dữ liệu, các dòng cũ sẽ không còn được đổi sang mã S02 như trước. Với DB mẫu dựng mới thì không có khác biệt.
  Căn cứ: Chỉ chạm DB mẫu cũ của người tự dựng từ kho công khai, không phải dữ liệu thật; ảnh hưởng hẹp và có thể đổi lại sau.
  file: `data-api/db/012_source_registry_roles_dq.sql`
  severity: low
  Đề xuất: known-limits

- **Lexer goes out of sync when a SQL comment inside a template ends on the same line as the closing backtick**
  Người dùng thấy gì: Thước dò tên nguồn có thể bỏ sót tên thật trong một dạng viết mã hiếm gặp, nên đôi khi báo sạch trong khi vẫn còn lọt. Hiện chưa có chỗ nào trong mã dính dạng này.
  Căn cứ: Rủi ro thấp vì dạng này chưa xuất hiện và không ảnh hưởng người dùng; nếu lọt thì chỉ là lộ tên nguồn trên kho công khai, sửa sau rẻ.
  file: `scripts/data-api-ten-nguon.mjs`
  severity: low
  Đề xuất: known-limits

- **The scan skips unreadable files and NUL-containing files without reporting them**
  Người dùng thấy gì: Thước dò có thể lặng lẽ bỏ qua vài tệp không đọc được rồi vẫn báo sạch, nên không chắc đã quét hết kho.
  Căn cứ: Hiếm gặp với tệp văn bản thông thường và không đụng người dùng hay dữ liệu; nếu bỏ sót thì chỉ lộ tên trên kho công khai, sửa sau rẻ.
  file: `scripts/data-api-ten-nguon.mjs`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 5 (tuyên quét LỚP nhưng chỉ có điểm-case): PB5-AC-4 nói lược đồ «dựng ra y như trước» nhưng chỉ so tên bảng/view, DEFAULT và source_registry**
  Người dùng thấy gì: Phép kiểm lược đồ mẫu chỉ so tên bảng, giá trị mặc định và danh mục nguồn, nên một lần đổi tên cột hay mất chỉ mục sẽ không bị bắt. Lời nói lược đồ dựng ra y như trước rộng hơn những gì được đo.
  Căn cứ: Việc dọn chỉ đổi chữ trong chú thích và chuỗi nên khó làm hỏng cột, và không chạm dữ liệu người dùng; mở rộng phép đo là việc riêng, không gấp.
  file: `scripts/data-api-ten-nguon.test.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 2 (fixture viết tay đúng khuôn bên đọc): mốc «trước khi dọn» của AC-4 (MONG, NGUON_TRUOC) chép tay, không dựng lại từ origin/main**
  Người dùng thấy gì: Mốc so sánh trước khi dọn là số chép tay, nên nếu chép sai thì phép kiểm vẫn xanh mà không ai biết. Hiện không có dấu hiệu chép sai.
  Căn cứ: Số đã đo một lần trên bản gốc nên rủi ro chép sai thấp; không ảnh hưởng người dùng, và nếu cần có thể dựng lại bất cứ lúc nào.
  file: `scripts/data-api-ten-nguon.test.mjs`
  severity: low
  Đề xuất: known-limits

## Chưa adversarial-verify (refuter chết)

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
