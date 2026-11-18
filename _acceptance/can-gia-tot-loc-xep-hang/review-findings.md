# Review findings: can-gia-tot-loc-xep-hang (round 3)

## Trong hợp đồng

- **Hình dạng 1 (đo chỉ dẫn thay vì đầu ra): AC-8 tự ráp bước lọc theo vai trong test, không đo dữ liệu trang gửi xuống**
  AC: AC-8
  file: app/tests/deals-loc-xep-hang.test.tsx:337
  severity: high
  source: measurement
  detail: Hàm `quet` (dòng 337) và `veTheoVai` (dòng 359) tự gọi `dealHang(dealTheoVai(d, { lienHe: vai, noiDung: vai }), ...)` ngay trong test, nên chỉ chứng minh hàm trong lib lọc đúng khi được gọi. Lời hứa của AC-8 và E8 là «dữ liệu gửi xuống trình duyệt», «đúng phần trang gửi xuống», mà chỗ quyết định là `DealsTrangContent` ở app/src/app/ops/deals/page.tsx:110. Đã thử trên bản chép: thay dòng 110 thành `dealHang(d, { xemNoiDung: true, mayThu })`, tức vai Người xem nhận đủ liên hệ và nội dung, cả 12 ca vẫn xanh. Đột biến ở dòng 346 chỉ sửa trong lib/deals.ts nên không phủ lời gọi của trang.

- **Hình dạng 5 (tuyên quét lớp, thiếu ma trận viết trước): số tab «Đủ để gọi» và «Còn thiếu» không có kỳ vọng độc lập**
  AC: AC-3
  file: app/tests/deals-loc-xep-hang.test.tsx:167
  severity: high
  source: measurement
  detail: E3 hứa «số viết tay từng tab: bốn số đúng» và AC-3 hứa hai tab này theo luật đầy đủ của `thieuGi`, nhưng ca CG3-AC-3 chỉ so `dem.all` và `dem["xac-minh"]` với tập độc lập. `dem.du` và `dem.thieu` chỉ đi qua phép cộng ở dòng 167 và phép so với chính kết quả của cùng hàm ở dòng 172-173, nên chia sai giữa hai tab vẫn đúng. Đã thử trên bản chép ba đột biến ở `getDealsTrang`: mọi căn thường vào «du», mọi căn thường vào «thieu», và xếp tab với `xemNoiDung: false`. Cả ba đều giữ 12/12 xanh. Ca cũng không có đột biến «đếm trong trang» mà E3 ghi.

- **Hình dạng 5 (tuyên quét lớp, chỉ có điểm-case): AC-6 tuyên ma trận kind × type × vị trí nhưng chỉ có bốn ô rời**
  AC: AC-6
  file: app/tests/deals-loc-xep-hang.test.tsx:297
  severity: high
  source: measurement
  detail: E6 hứa «Ma trận kind × type × vị trí viết trước, mỗi ô một assert về tập mã». Ca CG3-AC-6 chỉ có bán mặc định (dòng 294), thuê không lọc (297), nhà riêng × phường a4 của tin bán (298-299) và thuê × dự án hai, ô này chỉ kiểm thước chứ không kiểm tập mã (301-302). Không có ô thuê × loại hình nào so tập mã. Đã thử trên bản chép: đổi điều kiện ở deals.ts:377 thành `$3::text IS NULL OR h.kind <> 'sale' OR o.property_type = $3`, tức bộ lọc loại hình mất tác dụng với tin thuê, cả 12 ca vẫn xanh. Vòng lặp kind × type ở AC-5 không bắt được vì số trên cây và số khi chọn cùng đọc một điều kiện sai.

- **Hình dạng 2 (fixture viết tay): lược đồ cloud giả vẫn còn bảng media, khác cloud thật**
  AC: AC-8
  file: app/tests/deals-loc-xep-hang.test.tsx:224
  severity: high
  source: measurement
  detail: Dòng 224 dựng «lược đồ kiểu cloud» bằng cách chỉ đổi tên `stg_zalo_posts`, còn bảng `media` vẫn nằm trong DB thử. Cloud thật không có `media`: pipeline/sync-cloud.mjs:473-474 ghi bảng này chỉ ở máy thu và đưa vào danh sách soát rò. Vì vậy nhánh `cloud` của `dealsNheSql` không được đo phần bỏ đọc `media`. Đã thử trên bản chép: bỏ nhánh cloud của `coAnh` ở deals.ts:385 để bản cloud vẫn đọc `media`, cả 12 ca vẫn xanh. Khi fixture đổi tên thêm `media`, sản phẩm nguyên bản vẫn xanh còn đột biến này làm CG3-AC-4 đỏ, nên chính fixture là chỗ che lỗi.

- **Hình dạng 1 (đo chỉ dẫn thay vì đầu ra): lời báo cloud chỉ được grep trong mã nguồn trang**
  AC: AC-8
  file: app/tests/deals-loc-xep-hang.test.tsx:376
  severity: medium
  source: measurement
  detail: Dòng 375-376 đọc page.tsx rồi kiểm chuỗi «Ảnh, chữ bài chỉ có ở máy thu» có mặt sau `async function DealsTrangContent`. AC-8 hứa màn báo câu này khi chạy trên lược đồ cloud, tức là phụ thuộc điều kiện `!mayThu`, mà phép grep không đo điều kiện đó. Đã thử trên bản chép: đảo page.tsx:114 thành `{mayThu && (`, khiến cloud mất lời báo còn máy thu lại hiện, cả 12 ca vẫn xanh.

- **Hình dạng 1 (đo chỉ dẫn thay vì đầu ra): trạng thái đang tải chỉ được grep chuỗi trong page.tsx**
  AC: AC-7
  file: app/tests/deals-loc-xep-hang.test.tsx:331
  severity: medium
  source: measurement
  detail: E7 hứa «Mỗi trạng thái ST-deals-* một ca trên HTML dựng thật», nhưng trạng thái tải chỉ được đo bằng `trang.includes("<Suspense fallback={<DealsSkeleton />}>")` trên văn bản nguồn. Đã thử trên bản chép: đổi thành `{/* <Suspense fallback={<DealsSkeleton />}> */}<Suspense fallback={null}>`, khung tải thật biến mất mà chuỗi vẫn còn trong chú thích, cả 12 ca vẫn xanh.

- **Hình dạng 1 (đo chỉ dẫn thay vì đầu ra): đầu trang của AC-9 không được dựng, chỉ grep một câu cũ**
  AC: AC-9
  file: app/tests/deals-loc-xep-hang.test.tsx:387
  severity: medium
  source: measurement
  detail: E9 hứa «HTML dựng thật của bảng danh sách và đầu trang» không chứa «thước phường». Biến `h` ở dòng 381 chỉ dựng `DealsGrid`, còn đầu trang chỉ được kiểm ở dòng 387 bằng phép grep nguyên văn một câu mô tả cũ trên page.tsx. Đã thử trên bản chép: đổi `description` ở page.tsx:147 thành «Căn rẻ hơn thước phường.», vi phạm thẳng AC-9, cả 12 ca vẫn xanh.

- **Hình dạng 4 (âm tính một mình, đối chứng giả): đối chứng «thước phường» luôn đỏ bất kể sản phẩm**
  AC: AC-9
  file: app/tests/deals-loc-xep-hang.test.tsx:384
  severity: medium
  source: measurement
  detail: Dòng 384 tự nối chữ «thước phường» vào chuỗi rồi khẳng định chuỗi đó chứa chữ này, nên `assert.throws` luôn đạt với mọi giá trị của `h`. Đối chứng này chỉ kiểm `String.includes`, không chứng minh phép âm tính ở dòng 383 đo đúng vùng có thể chứa chữ cũ. Fixture của dòng 381 chỉ có một dòng cấp dự án, và đầu trang nằm ngoài `h`, nên phép âm tính không có đối chứng dương thật.

- **Hình dạng 3 (assert chuỗi có mặt khi lời hứa là quan hệ): «nguồn chỉ hiện mã S0x» chỉ kiểm có một mã trong HTML**
  AC: AC-9
  file: app/tests/deals-loc-xep-hang.test.tsx:385
  severity: medium
  source: measurement
  detail: AC-9 và E9 hứa cột nguồn CHỈ hiện mã S0x, nhưng `/S0\d/.test(h)` chỉ cần một mã xuất hiện ở bất kỳ đâu trong toàn bộ HTML. Đã thử trên bản chép: đổi ô nguồn ở deals-grid.tsx:146 thành `{d.source} ten-nguon-that.example · ...`, tức in thêm tên nguồn ngay trong cột, cả 12 ca vẫn xanh. Phép đo cần so toàn bộ nội dung ô nguồn với khuôn mã.

- **Hình dạng 3 (assert chuỗi có mặt khi lời hứa là quan hệ): «Còn thiếu» luôn khớp nhãn tab, và tabDong được viết tay**
  AC: AC-3
  file: app/tests/deals-loc-xep-hang.test.tsx:374
  severity: medium
  source: measurement
  detail: Dòng 374 muốn chứng minh dòng của vai Người xem mang đúng tab, nhưng `conThieu.includes("Còn thiếu")` luôn đúng vì thanh tab của lưới cũng in nhãn này (deals-grid.tsx:54). Đã thử trên bản chép: đổi nhãn ở ô tình trạng (deals-grid.tsx:192) thành «Sai tab», cả 12 ca vẫn xanh. Đầu vào `tabDong: { x: "thieu" }` ở dòng 373 cũng viết tay (hình dạng 2), không lấy từ `getDealsTrang`, nên luật đầy đủ không đi trọn đường từ máy chủ tới ô hiển thị.

- **Hình dạng 1 (đo chỉ dẫn thay vì đầu ra): ca lỗi thay mất bước tải lại trang rồi khẳng định trang tải lại**
  AC: AC-7
  file: app/tests/deals-loc-xep-hang-loi.test.tsx:64
  severity: medium
  source: measurement
  detail: Dòng 64 dùng `cloneElement` tiêm `di` giả đè lên mặc định `window.location.assign`, rồi dòng 93 chỉ kiểm hàm giả nhận đúng URL, kèm thông điệp «phải tải lại trang». Hành vi thật của `DealsBoLocKhiLoi` (deals-grid.tsx:349) không bao giờ chạy. Đã thử trên bản chép: đổi mặc định thành `di = () => {}`, khiến đổi lọc khi lỗi không làm gì, cả 12 ca vẫn xanh. Tệp đã có sẵn kênh `loiDom` bắt được điều hướng thật, nên đo được đầu ra mà không cần tiêm.

- **Hình dạng 5 (tuyên quét lớp, chỉ có điểm-case): probe ghi «mọi mục của cây» nhưng chỉ chọn lại một phần mục**
  AC: AC-5
  file: _acceptance/can-gia-tot-loc-xep-hang/probes/do-may-thu.mts:75
  severity: medium
  source: measurement
  detail: E11 hứa «mọi mục của cây có số bằng số căn khi chọn mục đó», và dòng 75 in đúng tên đó. Nhưng `lech` (dòng 56-60) chỉ so số trên cây với SQL đếm riêng, không hề chọn mục. Bước đọc lại bằng `getDealsTrang` ở dòng 68-70 chỉ chạy trên `canDoc`, gồm các nút có căn nhiều tin cộng `project:251`. Các mục tỉnh không bao giờ vào `nutChon` (dòng 54-62) nên không có tỉnh nào được chọn lại. Kết quả «đạt» vì vậy rộng hơn phần đã đo thật.

- **Hình dạng 4 (âm tính một mình): phép «không đổi trang bằng trình duyệt» không thể đỏ trong jsdom**
  AC: AC-7
  file: app/tests/deals-loc-xep-hang-loi.test.tsx:123
  severity: low
  source: measurement
  detail: Dòng 123 khẳng định `window.location.href` không đổi sau khi đổi lọc. jsdom không thực hiện điều hướng: chạy thử trên jsdom 30.1.3 của kho, `location.assign` sang URL khác để `href` giữ nguyên và chỉ báo lỗi «Not implemented: navigation to another Document». Assert này vì vậy đúng với mọi sản phẩm và không có đối chứng dương. Chỉ dòng 122 mới có khả năng bắt điều hướng.

- **Hình dạng 4 (âm tính một mình): đối chứng «không có lý do» ghim một thuộc tính mà không ca dương nào xác nhận**
  AC: AC-2
  file: app/tests/deals-loc-xep-hang.test.tsx:146
  severity: low
  source: measurement
  detail: Dòng 146 kiểm `!duAn.includes("data-deal-ly-do")`, còn ca dương ở dòng 149 chỉ kiểm chữ lý do, không kiểm thuộc tính này, nên phép âm tính không được ghim với đầu ra thật. Đã thử trên bản chép: sửa deals-cells.tsx:31 để luôn in `{lyDo ?? "Chưa chấm được hạng giá"}` và bỏ thuộc tính, tức dòng không có lý do vẫn in chữ lý do, cả 12 ca vẫn xanh. E2 hứa đúng đối chứng «dòng không có lý do lùi cấp thì không có chữ lý do».

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **?project=<id> khi chưa có bảng hạng hiện toàn bộ danh sách dưới tiêu đề dự án, trái luật đã ghi trong deals.ts**
  Người dùng thấy gì: Khi dữ liệu xếp hạng giá chưa có, mở một dự án cụ thể vẫn hiện căn của mọi dự án dưới tên dự án đó. Người vận hành có thể đọc nhầm danh sách.
  Căn cứ: Chỉ xảy ra khi bảng hạng chưa được nạp, trên dữ liệu thật hiện có đủ; người dùng thấy ngay danh sách sai và không mất dữ liệu.
  file: `app/src/app/ops/deals/page.tsx`
  severity: medium
  Đề xuất: known-limits

- **Tham số URL mới `location` lệch từ vựng chuẩn `area` của mã khu vực**
  Người dùng thấy gì: Đường dẫn lọc theo khu vực dùng tên khác với các màn còn lại, nên link giữa màn có thể không dùng chung được. Người dùng không thấy lỗi trực tiếp.
  Căn cứ: Chỉ là lệch tên gọi, không hỏng chức năng; đổi trước khi link lan ra thì rẻ, nhưng cần sửa cả hợp đồng.
  file: `app/src/lib/deals-chi-tiet.ts`
  severity: medium
  Đề xuất: new-contract

- **Giá trị `tab` trên URL là tiếng Việt (du, xac-minh, thieu)**
  Người dùng thấy gì: Đường dẫn chọn tab dùng chữ không dấu tiếng Việt thay vì tiếng Anh. Màn vẫn chạy bình thường.
  Căn cứ: Chỉ là quy ước đặt tên, không ảnh hưởng người dùng; đổi sau sẽ cần chuyển hướng cho link đã chia sẻ.
  file: `app/src/lib/deals-chi-tiet.ts`
  severity: low
  Đề xuất: known-limits

- **Nhãn cấp gốc của cây vị trí dùng «Tỉnh, thành», tên CONTEXT.md đã loại**
  Người dùng thấy gì: Bộ chọn vị trí ghi «Tỉnh, thành» trong khi từ vựng chung của sản phẩm là «Thị trường». Chỉ lệch chữ.
  Căn cứ: Hậu quả rất nhẹ, chỉ lệch từ vựng và trình đọc màn hình; sửa sau rẻ.
  file: `app/src/components/ops/deals-grid.tsx`
  severity: low
  Đề xuất: known-limits

- **Crumb «Căn giá tốt» ở trang một căn quay lại chính trang đó, không về được danh sách**
  Người dùng thấy gì: Từ trang một căn, bấm «Căn giá tốt» ở thanh đường dẫn có thể đưa lại đúng trang đang xem thay vì về danh sách. Người dùng phải tự bấm menu để về.
  Căn cứ: Lỗi điều hướng thấy được và lặp lại, nhưng không mất dữ liệu và người dùng tự về được; cần quyết cách sửa nên tách việc riêng.
  file: `app/src/lib/deals.ts`
  severity: high
  Đề xuất: new-contract

- **Chưa có dữ liệu bảng hạng: trang dự án hiện toàn bộ danh sách dưới tiêu đề của dự án**
  Người dùng thấy gì: Khi chưa có dữ liệu xếp hạng, mở trang một dự án vẫn hiện căn của mọi dự án, kể cả khi chọn Cho thuê. Màn không báo gì.
  Căn cứ: Chỉ xảy ra khi bảng hạng chưa có, người dùng tải lại sau khi dữ liệu nạp là hết; không mất dữ liệu.
  file: `app/src/app/ops/deals/page.tsx`
  severity: medium
  Đề xuất: known-limits

- **«Xem cả dự án» từ căn cho thuê mở danh sách Bán, thường ra rỗng**
  Người dùng thấy gì: Đang xem một căn cho thuê, bấm «Xem cả dự án» lại mở danh sách Bán, nhiều dự án báo không có căn nào. Người dùng tưởng dự án không có tin.
  Căn cứ: Hay gặp: 89/160 dự án có căn thuê ra rỗng, dễ gây hiểu nhầm; người dùng tự chuyển sang Cho thuê được, không mất dữ liệu.
  file: `app/src/components/ops/deal-body.tsx`
  severity: medium
  Đề xuất: new-contract

- **Ô vị trí hiện mã thô khi vị trí đang lọc không có trong cây**
  Người dùng thấy gì: Ở một số đường dẫn, ô chọn vị trí hiện mã kỹ thuật như «project:251» thay vì tên dự án. Chỉ xấu chữ.
  Căn cứ: Chỉ ảnh hưởng nhãn, danh sách vẫn đúng; thường đi kèm lỗi liên kết ở mục trên.
  file: `app/src/components/ops/deals-grid.tsx`
  severity: low
  Đề xuất: known-limits

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).

