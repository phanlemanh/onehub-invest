# Review findings: nap-s09-quy-can-va-can-cao-tang (round 1)

## Trong hợp đồng

- **Hình dạng 5 — tuyên quét lớp «mọi khoá lá rút từ bản thu thật», nhưng danh sách lá được tính lúc chạy từ fixture, không có ma trận viết trước**
  AC: AC-2
  file: `pipeline/lib/s09-danh-ba-v16.test.mjs:44`
  severity: medium
  source: measurement
  detail: E2 (evals.yaml) hứa: «Bảng kiểm kê viết trước mọi khoá lá của căn quỹ căn … rút từ bản thu thật, không từ fixture, mỗi khoá một assert, số assert bằng số khoá». Bảng viết trước có thật (s09-danh-ba-v16-khoa.json) nhưng chỉ chứa 46 khoá cấp một. Ca «bảng kiểm kê khoá lá quỹ căn» dựng `la` bằng `duongLa(c)` trên chính QUY_CAN, tức là fixture F-du + F-hong. `dsLa = [...la.keys()]` vì thế là danh sách sinh lúc chạy từ fixture, và `assert.equal(soAssert, dsLa.length)` luôn đúng theo cách dựng (đếm vòng lặp trên cùng mảng). Fixture lại do s09-v16-sinh-fixture.mjs cắt bằng `chonCanPhuKhoa`, hàm này tham lam theo khoá CẤP MỘT (`Object.keys(c)`), không theo khoá lá. Nên một lá có trong bản thu thật nhưng không vào được fixture (ví dụ một trường con dưới `property_furnitures`, `tags`, `positions`) không có assert nào, và không ô nào đỏ. Phán quyết của lá cũng chỉ kế thừa từ khoá cấp một (`bang[goc]`), không có kết luận riêng cho từng lá. Muốn khớp mẫu P105 thì danh sách lá phải viết trước từ bản thu thật (do kiemKe sinh), rồi assert số phần tử của nó.
  lý do thuộc hợp đồng: AC-2 đòi bảng kiểm kê viết trước liệt kê mọi khoá lá từ bản thu thật với số assert bằng số khoá; danh sách lá tính lúc chạy từ fixture làm điều kiện này không được đáp ứng.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **View 130 ép kiểu số trên payload thô mà không chặn kiểu, khác cách làm ngay trong cùng view**
  Người dùng thấy gì: Nếu nguồn một lúc nào đó gửi một căn có giá hoặc diện tích không phải số, ô Quỹ căn S09 và bảng quỹ căn trên trang dự án có thể báo lỗi cho cả danh sách thay vì chỉ bỏ căn đó.
  Căn cứ: Hiện chưa có dữ liệu thật nào như vậy, hậu quả nếu xảy ra là màn lỗi tạm thời chứ không mất dữ liệu, và sửa sau vẫn rẻ.
  file: `db/migrations/130_v_s09_db_quy_can.sql`
  severity: medium
  Đề xuất: known-limits

- **Bảng kiểm kê khoá của kind can-cao-tang được khai nhưng không bao giờ được áp**
  Người dùng thấy gì: Nếu nguồn thêm một trường mới vào căn cao tầng, trường đó sẽ vào kho dữ liệu mà không bị chặn như lời hứa trong chú thích. Người dùng cuối không thấy gì thay đổi.
  Căn cứ: Rủi ro chỉ phát sinh khi nguồn đổi cấu trúc, không làm mất dữ liệu và có thể phát hiện, dọn lại sau; sửa lúc này là phần việc phòng xa.
  file: `pipeline/lib/s09-danh-ba-v16.mjs`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 2 — fixture đã làm sạch chỉ còn URL ở đúng chỗ bộ lọc bỏ, nên phép quét http/AC-9 trên fixture không bao giờ đỏ được vì URL nằm dưới khoá «giu»**
  Người dùng thấy gì: Bài kiểm trên dữ liệu giả có thể không phát hiện một đường dẫn ảnh nằm ở chỗ khác ngoài chỗ đã biết. Phép quét trên dữ liệu thật vẫn bắt được trường hợp đó.
  Căn cứ: Vẫn còn một lớp kiểm thứ hai trên dữ liệu thật nên nguy cơ lộ thông tin nguồn thấp, và việc củng cố bài kiểm giả có thể làm sau mà không ảnh hưởng người dùng.
  file: `pipeline/scripts/s09-v16-sinh-fixture.mjs`
  severity: low
  Đề xuất: known-limits

## Chưa adversarial-verify (refuter chết)

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
