# Review findings: gia-tot-cap-du-an (round 1)

## Trong hợp đồng

- **Hình dạng 3: «bảng khoá cũ viết trước đủ tên và kiểu» chỉ được kiểm bằng việc tên khoá có mặt**
  AC: AC-8
  file: `app/tests/gia-tot-du-an-doc.test.tsx:213`
  severity: low
  source: measurement
  detail: E8 hứa giữ khoá cũ của API «đủ tên và kiểu». Ca chỉ kiểm `for (const k of khoa) assert.ok(k in x, ...)` trên KHOA_CU_DATA_API và KHOA_CU_APP (dòng 185-188), tức là chỉ kiểm tên khoá có mặt. Ca không kiểm kiểu hay giá trị của khoá nào (ví dụ discountPct là number, priceVnd là số hay null), nên đổi kiểu (chẳng hạn chuỗi numeric của pg thay cho number) vẫn xanh.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **lyDoRoi không còn khớp WHERE của dealsSql: tin thuê và tin không đại diện của căn bị coi là đang trong danh sách**
  Người dùng thấy gì: Trang một căn có thể không báo căn đã rời danh sách giá tốt, với tin thuê hoặc tin không phải tin đại diện. Người xem vẫn thấy số liệu của căn, chỉ thiếu lời giải thích vì sao căn không còn trong danh sách.
  Căn cứ: Hậu quả nhẹ: chỉ thiếu một dòng giải thích, không sai giá và không mất dữ liệu; sửa sau không tốn kém.
  file: `app/src/lib/deals.ts`
  severity: medium
  Đề xuất: known-limits

- **Khoá gom căn trong dealsSql không có tiền tố, khác mẫu 'p:'/'o:' của 421/422**
  Người dùng thấy gì: Trong trường hợp rất hiếm mã căn trùng mã tin, hai căn khác nhau có thể bị gộp thành một dòng trong danh sách giá tốt và số tin hiển thị sai.
  Căn cứ: Khả năng xảy ra rất thấp, hậu quả chỉ là một dòng gộp nhầm, tải lại cũng không đổi nhưng không làm mất dữ liệu gốc.
  file: `app/src/lib/deals.ts`
  severity: low
  Đề xuất: wont-fix

- **Tham số project ở hai API không chuẩn hoá số 0 đầu như parseProject của trang Ops**
  Người dùng thấy gì: Khi gọi API với mã dự án có số 0 đứng đầu, API trả danh sách rỗng thay vì báo lỗi, nên người dùng tưởng dự án chưa có căn nào.
  Căn cứ: Chỉ xảy ra khi người gọi tự gõ sai dạng mã; thử lại với mã đúng là được, không mất dữ liệu.
  file: `app/src/app/api/v1/deals/route.ts`
  severity: low
  Đề xuất: known-limits

- **API /v1/deals: project có số 0 đứng đầu qua được kiểm tra nhưng âm thầm trả danh sách rỗng**
  Người dùng thấy gì: Gọi API với mã dự án có số 0 đứng đầu cho kết quả rỗng mà không báo lỗi, trong khi trang Ops xử lý được mã đó. Hai nơi cho kết quả khác nhau với cùng một đầu vào.
  Căn cứ: Hiếm gặp và người dùng tự khắc phục bằng cách gõ lại mã; không mất hay lộ dữ liệu.
  file: `app/src/app/api/v1/deals/route.ts`
  severity: low
  Đề xuất: known-limits

- **/ops/deals?project=<sai khuôn> âm thầm hiện cả danh sách thay vì trạng thái «Không tìm thấy dự án»**
  Người dùng thấy gì: Mở trang giá tốt với mã dự án gõ sai dạng sẽ hiện danh sách chung mà không báo gì, người xem có thể tưởng đang xem một dự án cụ thể.
  Căn cứ: Chỉ xảy ra khi tự sửa địa chỉ bằng tay; mở lại bằng đường dẫn đúng là hết, không mất dữ liệu.
  file: `app/src/app/ops/deals/page.tsx`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 4 (assertion âm tính một mình): ca lược đồ kiểu cloud assert data == [] trên DB chẳng có tin nào có thể khớp**
  Người dùng thấy gì: Bài kiểm tra cho môi trường cloud có thể vẫn xanh dù bộ lọc theo dự án làm sai ở môi trường đó. Người dùng không thấy ngay, chỉ giảm độ tin cậy của phép đo.
  Căn cứ: Là điểm yếu của bài kiểm tra, không phải lỗi người dùng gặp; bổ sung sau rẻ và không ảnh hưởng dữ liệu.
  file: `app/tests/gia-tot-du-an-doc.test.tsx`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 3 + 4: «đột biến N = số tin» ở AC-6 chỉ là đổi giá trị đầu vào; fixture có số tin = số căn nên không đo được quan hệ N = số căn**
  Người dùng thấy gì: Nếu câu chứng minh giá tốt đếm nhầm số tin thay vì số căn, bài kiểm tra hiện tại có thể không phát hiện, và người xem sẽ thấy con số «So với N căn» lớn hơn thực tế.
  Căn cứ: Chỉ là khe hở của bài kiểm tra; nếu lỗi thật xảy ra thì chỉ lệch một con số trong câu, không mất dữ liệu.
  file: `app/tests/gia-tot-du-an-doc.test.tsx`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 2 (fixture viết tay đúng khuôn bên đọc): phát biểu project_node_id chèn tay theo khuôn view 105, và view lại là bản chép**
  Người dùng thấy gì: Dữ liệu thử được dựng tay nên nếu cách ghi dự án thật và cách đọc lệch nhau thì bài kiểm tra vẫn xanh, và chỉ lộ ra khi chạy trên dữ liệu thật.
  Căn cứ: Đã có phép đo trên dữ liệu thật ở bước nghiệm thu khác bắt lỗi này; người dùng không bị ảnh hưởng trực tiếp.
  file: `pipeline/scripts/gia-tot-du-an-fixture.itest.mjs`
  severity: low
  Đề xuất: known-limits

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
