# Review findings: can-gia-tot-loc-xep-hang (round 2)

## Trong hợp đồng

- **Lọc dự án chạy sau bước gộp căn nên làm rơi căn có tin thuộc dự án, số đếm lệch lệnh đo của hợp đồng**
  AC: AC-5
  file: `app/src/lib/deals.ts:455`
  severity: high
  source: bugs
  detail: `dealsNheSql` gộp mỗi căn còn một tin đại diện (tin thấy sau cùng) bằng `DISTINCT ON (l.can_key)`, rồi `getDealsTrang` mới lọc `r.cap === "du_an" && r.nut === project` trên riêng tin đại diện đó. Căn có một tin thuộc dự án N nhưng tin đại diện thuộc dự án khác sẽ biến mất khỏi `?project=N`. Đường cũ `dealsSql({ duAn: true })` và probe `dem-tap-can.mjs` đều lọc dự án trong CTE `loc`, trước khi gộp. Đo trên DB máy thu, chỉ đọc, ngưỡng 5–50%: nút 251 (bán) có probe trả `tong: 5`, còn `getDealsTrang({ project: "251", kind: "sale" })` trả `tong: 4`. Bằng SQL so lọc trước và sau gộp, thuê lệch ở nút 184 (12 thành 9), 109 (6 thành 5), 93 (13 thành 12); tổng 6 căn trên 4 dự án. Trái dòng 76 của contract.md («Số trên tab bằng số của lệnh đo, không lọc và khi lọc một dự án») và AC-5 («chọn dự án lấy cả dự án ở mọi phường»). Lọc `location` cùng gốc lỗi: ở ngưỡng 15% có 4 căn bán và 37 căn thuê mang tin ở phường khác phường của tin đại diện. Hướng sửa: áp điều kiện dự án và vị trí trước khi gộp, cây vị trí đếm theo cùng luật để số trên mục vẫn bằng số căn khi chọn mục đó.
  rationale: AC-5 yêu cầu chọn dự án lấy cả dự án và số mục bằng số căn khi chọn; Đường đo yêu cầu số tab bằng lệnh đo khi lọc một dự án, mà đo thực tế lệch (5 so với 4).

- **Hình dạng 5, tuyên quét lớp nhưng chỉ có điểm-case: trục vai của AC-4 chỉ so offerId với chính nó, không thể đỏ**
  AC: AC-4
  file: `app/tests/deals-loc-xep-hang.test.tsx:185`
  severity: high
  source: measurement
  detail: E4 hứa ma trận «mỗi tab × vai Người xem, Vận hành × lược đồ máy thu, cloud». Vòng vai ở dòng 181-188 chỉ chạy `TS()` (tab all, lược đồ máy thu), không lặp theo tab và không chạy trên lược đồ cloud. Dòng 185 so `hang.map(offerId)` với `x.rows.map(offerId)`, mà `hang` là `.map` của chính `x.rows` qua hai hàm spread giữ nguyên offerId. Dòng 186 tra `tabDong` bằng đúng các mã đó, trong khi `getDealsTrang` không nhận tham số vai. Đột biến thử trên bản chép: sửa `dealTheoVai` để vai Người xem mất `rank`, `discountPct`, `priceVnd`, `source`; cả 9 ca vẫn xanh.
  rationale: AC-4 đòi đi hết các trang theo từng tab, cả hai vai và cả hai lược đồ, mà phép đo vai và lược đồ không thể đỏ.

- **Hình dạng 4, assertion âm tính một mình: docThamSoDeal chỉ được đo chiều loại bỏ giá trị lạ**
  AC: AC-5
  file: `app/tests/deals-loc-xep-hang.test.tsx:271`
  severity: high
  source: measurement
  detail: Dòng 270-271 chỉ kiểm giá trị lạ của `kind`, `type`, `tab`, `location`, `project` rơi về mặc định. Trong tệp, `docThamSoDeal` chỉ được gọi thêm ở dòng 219 cho `page`, `size`, nên không có đối chứng dương nào cho `location`, `project`, `type` hợp lệ hay `kind=rent`. Đột biến thử trên bản chép: cho `docThamSoDeal` luôn trả `location: null, project: null, type: null, kind: "sale"`, tức mọi bộ lọc trên URL bị bỏ; cả 9 ca vẫn xanh. E11 có gọi `docThamSoDeal({ project: "1" })` trên DB máy thu nhưng chỉ phủ `project`; `location`, `type`, `kind` không có phép đo tự động nào.
  rationale: AC-5 hứa URL mang đúng vị trí hoặc dự án và mở lại cho cùng kết quả; phép đo không có đối chứng dương nên bỏ hết bộ lọc vẫn xanh.

- **Hình dạng 2, fixture viết tay đúng khuôn bên đọc: tham số lọc của AC-5 bỏ qua bước đọc URL, mã vị trí của fixture bị chính bước đó từ chối**
  AC: AC-5
  file: `app/tests/deals-loc-xep-hang.test.tsx:229`
  severity: medium
  source: measurement
  detail: AC-5 hứa URL mang đúng `location` hoặc `project` và mở lại URL cho cùng kết quả. Các ca ở dòng 229-233 và 247-251 dựng thẳng `ThamSoDeal` bằng `TS(...)`, không đi qua `urlThamSoDeal` rồi `docThamSoDeal`. Dòng 256 chỉ so chuỗi đầu ra của bên ghi với một chuỗi viết tay. Đo trên bản chép: `docThamSoDeal({ location })` trả `null` với cả `cg10-tinh`, `cg3-tinh2`, `cg10-a4`, `cg10-a1`, vì regex `^vn(-[a-z0-9]+)*$` không nhận các mã này, nên fixture hiện tại không thể đi trọn vòng ghi rồi đọc. Dữ liệu thật không bị ảnh hưởng: 224 mã phường và 4 mã tỉnh có hạng trên DB máy thu đều khớp regex. Lỗ hổng nằm ở phép đo.
  rationale: AC-5 đòi vòng ghi rồi mở lại URL cho cùng kết quả, mà phép đo bỏ qua bước đọc URL.

- **Hình dạng 3, assert chuỗi có mặt: nút «Xoá bộ lọc» của trạng thái lọc rỗng được thanh lọc làm thay**
  AC: AC-7
  file: `app/tests/deals-loc-xep-hang.test.tsx:286`
  severity: medium
  source: measurement
  detail: AC-7 hứa trạng thái lọc rỗng có nút «Xoá bộ lọc», tức quan hệ giữa nút và vùng trống. Dòng 286 chỉ kiểm `h.includes(nut)` trên toàn HTML. Ca ở dòng 281 đặt `location: "vn-hanoi"`, nên `coLoc` đúng và `DealsBoLoc` tự in một nút «Xoá bộ lọc» khác (deals-grid.tsx dòng 330-332). Đột biến thử trên bản chép: xoá nút trong vùng trống ở deals-grid.tsx dòng 458; cả 9 ca vẫn xanh. Phép đo cần giới hạn trong phần tử `data-deals-trong`.
  rationale: AC-7 hứa lọc rỗng có nút «Xoá bộ lọc» trong vùng trống; xoá nút đó vẫn xanh nên phép đo không giữ được AC.

- **Hình dạng 4, assertion âm tính một mình: quét lộ khi mở căn ngoài trang không có đối chứng dương trên cùng dữ liệu**
  AC: AC-8
  file: `app/tests/deals-loc-xep-hang.test.tsx:320`
  severity: medium
  source: measurement
  detail: E8 yêu cầu căn ngoài trang: vai Người xem không chứa giá trị đã cấy, «vai Vận hành có (đối chứng dương)». Dòng 318-320 chỉ quét âm tính trên kết quả của `getDeal`. Đối chứng dương ở dòng 310-312 đo đường danh sách `getDealsTrang`, không đo `mot`. Đột biến thử trên bản chép: cho `getDeal` trả `sellerName`, `sellerPhone`, `street`, `block`, `floor`, `unit`, `streetNumber`, `district`, `postTextFull` đều `null`; cả 9 ca vẫn xanh, nên phép quét này vẫn đạt khi dữ liệu cấy không hề có mặt trong căn được mở.
  rationale: AC-8 đòi vai Người xem không nhận dữ liệu nhạy cảm và vai Vận hành nhận đủ; phép quét không chứng minh dữ liệu cấy có mặt nên không đo được AC.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Tham số URL `location` lệch từ vựng chuẩn: mã khu vực phải là `area`**
  Người dùng thấy gì: Đường dẫn của màn lọc dùng tên tham số khác với tên chuẩn của các trang còn lại. Link đã chia sẻ vẫn mở đúng, nhưng sau này đổi tên sẽ phải giữ cả hai dạng.
  Căn cứ: Không mất hay lộ dữ liệu, người dùng thấy kết quả đúng; sửa sớm rẻ hơn nhiều so với sau khi link đã được chia sẻ, nhưng cần một hàng từ vựng riêng vì hợp đồng đã ký tên hiện tại.
  file: `app/src/lib/deals-chi-tiet.ts`
  severity: medium
  Đề xuất: new-contract

- **Bộ chọn vị trí in mã thô «area:...» khi mở URL có vị trí không còn trong cây**
  Người dùng thấy gì: Khi mở lại một link có vị trí mà bộ lọc loại hình hiện tại không có căn nào, ô chọn vị trí hiện mã kỹ thuật thay vì tên phường. Danh sách vẫn đúng.
  Căn cứ: Chỉ là chữ hiển thị xấu, không mất hay lộ dữ liệu, người dùng chọn lại vị trí là hết; sửa không gấp.
  file: `app/src/components/ops/deals-grid.tsx`
  severity: low
  Đề xuất: known-limits

- **Crumb «Căn giá tốt» ở trang một căn thành vòng lặp: dealTrongDanhSach vẫn đo theo danh sách cũ (r1 · tệp đã đổi)**
  Người dùng thấy gì: Từ trang một căn, bấm đường dẫn «Căn giá tốt» ở đầu trang có thể quay lại đúng trang đang xem thay vì về danh sách.
  Căn cứ: Chỉ làm vòng điều hướng khó chịu, không mất hay lộ dữ liệu; người dùng bấm nút Quay lại hoặc vào danh sách bằng menu là ra.
  file: `app/src/lib/deals.ts`
  severity: high
  Đề xuất: known-limits

- **?project=<id> khi chưa có bảng hạng hiện toàn bộ danh sách dưới tiêu đề của dự án (r1)**
  Người dùng thấy gì: Khi chưa có bảng hạng, mở một dự án vẫn hiện căn của mọi dự án dưới tiêu đề tên dự án đó, dễ làm người xem hiểu nhầm.
  Căn cứ: Chỉ xảy ra khi bảng hạng chưa được dựng, hiếm gặp và tự hết khi dữ liệu có; không mất dữ liệu, chỉ gây hiểu nhầm tạm thời.
  file: `app/src/app/ops/deals/page.tsx`
  severity: medium
  Đề xuất: known-limits

- **Khi truy vấn lỗi thanh lọc biến mất, trái AC-7 và không dùng `leading` của RegionError (r1)**
  Người dùng thấy gì: Khi tải danh sách bị lỗi, thanh lọc biến mất cùng khối báo lỗi, người dùng phải bấm Thử lại mới lọc tiếp được.
  Căn cứ: Nhẹ: lỗi hiếm, bấm Thử lại là khôi phục, không mất dữ liệu.
  file: `app/src/app/ops/deals/page.tsx`
  severity: medium
  Đề xuất: known-limits

- **Nhãn «Độ tin» không phải nhãn chuẩn «Độ tin trích xuất» trong CONTEXT.md (r1)**
  Người dùng thấy gì: Dòng ghi «Độ tin» có thể bị đọc nhầm thành độ tin của mức giá thay vì độ tin của việc trích xuất.
  Căn cứ: Chỉ là chữ nhãn, không ảnh hưởng dữ liệu, sửa lúc nào cũng rẻ.
  file: `app/src/components/ops/deals-cells.tsx`
  severity: low
  Đề xuất: known-limits

- **Sheet tính «Căn cùng tiêu chí» và chuyển căn J/K chỉ trên trang đang xem, nên báo thiếu và báo sai «chưa có căn» (r1 · tệp đã đổi)**
  Người dùng thấy gì: Trong khung chi tiết một căn, số căn cùng tiêu chí bị đếm thiếu và nút căn kế tắt ở cuối trang, nên có lúc báo chưa có căn dù thực tế có.
  Căn cứ: Gây hiểu sai số liệu so sánh nhưng không mất hay lộ dữ liệu; người dùng vẫn xem được qua danh sách, và sửa đúng cách cần thiết kế riêng.
  file: `app/src/components/ops/deals-grid.tsx`
  severity: medium
  Đề xuất: new-contract

- **`?project=<id>` khi chưa có bảng hạng hiện toàn bộ danh sách dưới tiêu đề của dự án (r1)**
  Người dùng thấy gì: Khi chưa có bảng hạng, mở một dự án vẫn hiện căn của mọi phường dưới tiêu đề tên dự án, không có báo lỗi.
  Căn cứ: Chỉ xảy ra khi bảng hạng chưa dựng, tự hết khi có dữ liệu; gây hiểu nhầm tạm thời, không lộ hay mất dữ liệu.
  file: `app/src/app/ops/deals/page.tsx`
  severity: medium
  Đề xuất: known-limits

- **Đổi hai điều kiện lọc liên tiếp làm mất điều kiện đầu (r1 · tệp đã đổi)**
  Người dùng thấy gì: Nếu chọn hai bộ lọc thật nhanh trước khi trang kịp tải, bộ lọc đầu có thể bị bỏ.
  Căn cứ: Nhẹ: cửa sổ chưa tới một giây, người dùng thấy ngay và chọn lại được.
  file: `app/src/components/ops/deals-grid.tsx`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 1, đo chỉ dẫn thay vì đầu ra: ca lỗi của AC-7 chỉ grep mã nguồn page.tsx, trong khi màn thật mất thanh lọc khi lỗi (r1 · tệp đã đổi)**
  Người dùng thấy gì: Phép kiểm tự động ca lỗi tải danh sách chỉ đọc chữ trong mã, nên có thể không bắt được nếu màn lỗi hỏng.
  Căn cứ: Là điểm yếu của kiểm thử, người dùng không thấy ngay; rủi ro thấp vì ca lỗi hiếm và có thể kiểm tay.
  file: `app/tests/deals-loc-xep-hang.test.tsx`
  severity: high
  Đề xuất: known-limits

- **Hình dạng 1, đo chỉ dẫn thay vì đầu ra: AC-8 tự chép chuỗi lọc theo vai trong test, không đo dữ liệu trang gửi xuống (r1 · tệp đã đổi)**
  Người dùng thấy gì: Phép kiểm tự động việc ẩn tên, số điện thoại cho vai Người xem không chạy trên trang thật, nên có thể không phát hiện nếu bước ẩn bị gỡ nhầm.
  Căn cứ: Nếu lỗi xảy ra thì lộ thông tin liên hệ cho vai thấp, nhưng hiện mã chạy đúng; nên bổ sung phép đo sớm cho rẻ.
  file: `app/tests/deals-loc-xep-hang.test.tsx`
  severity: high
  Đề xuất: known-limits

- **Hình dạng 3, assert có mặt trong khi lời hứa là quan hệ: số tab Đủ để gọi và Còn thiếu chỉ so với chính bộ phân loại đang được đo (r1 · tệp đã đổi)**
  Người dùng thấy gì: Số trên hai tab «Đủ để gọi» và «Còn thiếu» chưa được kiểm độc lập, nên phân loại sai vẫn có thể qua kiểm tự động.
  Căn cứ: Rủi ro là số tab lệch mà không ai biết, nhưng người vận hành đối chiếu được bằng tay.
  file: `app/tests/deals-loc-xep-hang.test.tsx`
  severity: high
  Đề xuất: known-limits

- **Hình dạng 2, fixture viết tay đúng khuôn bên đọc: AC-2 dựng dòng bằng dongMau và hang, không đi qua toDealRow (r1 · tệp đã đổi)**
  Người dùng thấy gì: Phép kiểm dòng bảng không đi qua bước đọc dữ liệu thật, nên nếu lý do lùi cấp hay tên dự án bị mất thì có thể không bị bắt.
  Căn cứ: Chỉ là khoảng trống kiểm thử; nếu hỏng, màn chỉ thiếu chữ giải thích, không mất hay lộ dữ liệu.
  file: `app/tests/deals-loc-xep-hang.test.tsx`
  severity: high
  Đề xuất: known-limits

- **Hình dạng 5, thiếu ma trận toàn phần: số trên cây vị trí chỉ đo ở Bán mặc định, không có trục kind × type (r1 · tệp đã đổi)**
  Người dùng thấy gì: Số căn trên cây vị trí khi chọn Cho thuê hay đổi loại hình chưa được kiểm tự động, nên có thể sai mà không bị bắt.
  Căn cứ: Nếu sai chỉ lệch số đếm trên cây, người dùng thấy và đối chiếu được, không lộ dữ liệu.
  file: `app/tests/deals-loc-xep-hang.test.tsx`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 5, thiếu ma trận toàn phần: E6 khai kind × type × vị trí nhưng chỉ có vài điểm-case (r1 · tệp đã đổi)**
  Người dùng thấy gì: Việc kết hợp lọc Cho thuê với loại hình chưa được kiểm tự động, nên một lỗi lọc có thể lọt qua.
  Căn cứ: Lỗi nếu có chỉ hiện sai danh sách, người dùng tự thấy và lọc lại, không mất hay lộ dữ liệu.
  file: `app/tests/deals-loc-xep-hang.test.tsx`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 4, assertion âm tính một mình: đối chứng «thước phường» chỉ thử String.includes trên chuỗi tự chèn (r1 · tệp đã đổi)**
  Người dùng thấy gì: Phép kiểm không bắt lại được nếu chữ «thước phường» bị đưa trở lại bảng.
  Căn cứ: Chỉ là chữ trên màn, nhẹ, người dùng không bị hại; nhìn mắt là thấy.
  file: `app/tests/deals-loc-xep-hang.test.tsx`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 3, assert chuỗi có mặt trong khi lời hứa là «chỉ»: cột nguồn chỉ được kiểm có S0x (r1 · tệp đã đổi)**
  Người dùng thấy gì: Phép kiểm nguồn chỉ tìm mã S0x, nên nếu tên nguồn thật bị in thêm vào ô thì không bị bắt.
  Căn cứ: Hậu quả nặng nếu xảy ra vì tên nguồn thật là thông tin cần giữ kín, nhưng hiện mã không in tên thật; thêm phép kiểm là rẻ.
  file: `app/tests/deals-loc-xep-hang.test.tsx`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 4, assertion âm tính một mình: đối chứng «không có lý do» ghim thuộc tính, không có đối chứng dương cho thuộc tính đó (r1 · tệp đã đổi)**
  Người dùng thấy gì: Phép kiểm dòng không có lý do lùi cấp có thể không bắt được nếu dòng đó lại in một câu lý do thừa.
  Căn cứ: Nhẹ: chỉ thừa chữ giải thích trên màn, không ảnh hưởng dữ liệu.
  file: `app/tests/deals-loc-xep-hang.test.tsx`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 1, đo chỉ dẫn thay vì đầu ra: lời báo cloud của AC-8 chỉ được grep trong mã nguồn (r1 · tệp đã đổi)**
  Người dùng thấy gì: Phép kiểm lời báo «ảnh, chữ bài chỉ có ở máy thu» chỉ đọc chữ trong mã, nên có thể không bắt được nếu lời báo không hiện.
  Căn cứ: Nhẹ: thiếu một dòng thông báo trên cloud, không mất hay lộ dữ liệu.
  file: `app/tests/deals-loc-xep-hang.test.tsx`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 1, đo chỉ dẫn thay vì đầu ra: `?can=` được thay bằng lời gọi thẳng getDeal (r1 · tệp đã đổi)**
  Người dùng thấy gì: Phép kiểm mở căn nằm ngoài trang hiện tại không chạy đường chuyển hướng thật, nên có thể không bắt được nếu đường này hỏng.
  Căn cứ: Nếu hỏng, người dùng không mở được căn từ liên kết; vào lại từ danh sách được nên hậu quả nhẹ.
  file: `app/tests/deals-loc-xep-hang.test.tsx`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 1, đo chỉ dẫn thay vì đầu ra: AC-9 kiểm đầu trang bằng grep mã nguồn, không dựng đầu trang (r1 · tệp đã đổi)**
  Người dùng thấy gì: Phép kiểm mô tả đầu trang chỉ đọc chữ trong mã, không dựng đầu trang thật.
  Căn cứ: Chỉ là chữ mô tả trên đầu trang, nhẹ, kiểm bằng mắt dễ.
  file: `app/tests/deals-loc-xep-hang.test.tsx`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 3, assert chuỗi có mặt: «Còn thiếu» luôn có sẵn từ nhãn tab nên không đo huy hiệu của dòng (r1 · tệp đã đổi)**
  Người dùng thấy gì: Phép kiểm huy hiệu «Còn thiếu» trên dòng luôn xanh vì nhãn tab cũng có chữ này.
  Căn cứ: Rất nhẹ: chỉ là nhãn nhỏ trên dòng, chi phí sửa lớn hơn hậu quả.
  file: `app/tests/deals-loc-xep-hang.test.tsx`
  severity: low
  Đề xuất: wont-fix

## Chưa adversarial-verify (refuter chết)

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).

