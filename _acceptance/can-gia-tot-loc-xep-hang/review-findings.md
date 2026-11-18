## Trong hợp đồng

- **Hình dạng 5, tuyên quét lớp nhưng chỉ có điểm-case: AC-8 chỉ cấy SĐT, tên, đường; ảnh, chữ bài, toà, tầng, căn không được đo**
  AC: AC-8
  file: `app/tests/deals-loc-xep-hang.test.tsx:272`
  severity: high
  source: measurement
  detail: E8 và tên ca hứa vai Người xem không nhận «tên, SĐT, ảnh, chữ bài, địa chỉ dưới phường». Fixture chỉ cấy `SDT`, `TEN`, `DUONG` (dòng 29, 102) và dòng 272 chỉ quét ba giá trị này. Đo trên DB của ca: bảng `media` 0 dòng, `stg_zalo_posts` 0 dòng, nên không có ảnh hay chữ bài để phát hiện lộ. Đột biến thử: xoá `images: [], postTextFull: null` khỏi `dealTheoVai`, rồi riêng một lượt xoá `block, floor, unit, streetNumber, district`. Cả hai đều sống sót. Đột biến duy nhất của ca (dòng 276) chỉ nhắm nhánh `lienHe`.
  rationale: AC-8 liệt kê rõ ảnh, chữ bài, địa chỉ dưới phường cho vai Người xem mà phép đo không cấy và không quét các thứ đó.

- **Hình dạng 5, tuyên quét lớp nhưng chỉ có điểm-case: AC-1 khai đủ bốn nhóm nhưng fixture thiếu nhóm cấp phường cần xác minh**
  AC: AC-1
  file: `app/tests/deals-loc-xep-hang.test.tsx:109`
  severity: high
  source: measurement
  detail: AC-1 và E1 đòi tập viết trước đủ bốn nhóm (hai cấp × thường, cần xác minh). Đối chứng dòng 109 chỉ kiểm riêng «có hai cấp» và «có căn xác minh», không kiểm tích hai trục. Đo trên fixture: `du_an|thường 20`, `du_an|xác minh 3`, `phuong|thường 20`, `phuong|xác minh 0`. Đột biến thử: thêm `(g.suspect AND g.cap <> 'du_an') DESC` vào ORDER BY của `dealsNheSql`, đảo thứ tự cấp trong nhóm cần xác minh. Cả tệp vẫn xanh. Danh sách kỳ vọng cũng được tính bằng `thuTuDung`, không phải danh sách viết tay như E1 ghi.
  rationale: AC-1 đặt điều kiện Given là đủ bốn nhóm, mà tập kiểm có nhóm cấp phường cần xác minh bằng 0.

- **Hình dạng 5, thiếu ma trận toàn phần: E2 khai năm dòng nhưng không có dòng cần xác minh**
  AC: AC-2
  file: `app/tests/deals-loc-xep-hang.test.tsx:127`
  severity: medium
  source: measurement
  detail: AC-2 liệt kê năm loại dòng: Giá tốt cấp dự án, Rẻ trong phường, lùi cấp có lý do, thuê theo giá tháng, cần xác minh. E2 ghi «năm dòng viết trước, một assert mỗi dòng». Ca ở dòng 127-142 không có dòng nào đặt `needsVerification: true` hay `suspect: true`; giá trị mặc định ở dòng 121 và 125 đều là false. Phần tử thứ năm của ma trận không có assert.
  rationale: AC-2 liệt kê năm loại dòng gồm dòng cần xác minh, mà phép đo không có dòng nào loại này.

- **Hình dạng 5, tuyên quét lớp nhưng chỉ có điểm-case: AC-4 ghi theo vai và căn nhiều tin ở biên trang nhưng không có hai trục này**
  AC: AC-4
  file: `app/tests/deals-loc-xep-hang.test.tsx:162`
  severity: medium
  source: measurement
  detail: Tên ca và E4 hứa đi hết trang theo «tab × vai × lược đồ» trên 37 căn, có căn nhiều tin nằm ở biên trang. `kiem` (dòng 162-169) chỉ lặp theo tab và lược đồ, không có tham số vai. Dòng 175-176 chỉ đếm căn ba tin hiện một dòng, không kiểm vị trí. Đo trên fixture: tập có 43 căn, căn `a-can-*` ở chỉ số 2 của trang 1, tức không nằm ở biên trang 15 dòng, nên điều kiện biên mà E4 đặt ra không được dựng.
  rationale: AC-4 đòi đi hết trang theo vai Người xem và Vận hành và căn nhiều tin ở biên trang, phép đo không dựng cả hai.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Crumb «Căn giá tốt» ở trang một căn thành vòng lặp: dealTrongDanhSach vẫn đo theo danh sách cũ**
  Người dùng thấy gì: Từ trang một căn, bấm đường dẫn «Căn giá tốt» ở đầu trang có thể quay lại đúng trang đang xem thay vì về danh sách.
  Căn cứ: Chỉ làm vòng điều hướng khó chịu, không mất hay lộ dữ liệu; người dùng bấm nút Quay lại hoặc vào danh sách bằng menu là ra.
  file: `app/src/lib/deals.ts`
  severity: high
  Đề xuất: known-limits

- **?project=<id> khi chưa có bảng hạng hiện toàn bộ danh sách dưới tiêu đề của dự án**
  Người dùng thấy gì: Khi chưa có bảng hạng, mở một dự án vẫn hiện căn của mọi dự án dưới tiêu đề tên dự án đó, dễ làm người xem hiểu nhầm.
  Căn cứ: Chỉ xảy ra khi bảng hạng chưa được dựng, hiếm gặp và tự hết khi dữ liệu có; không mất dữ liệu, chỉ gây hiểu nhầm tạm thời.
  file: `app/src/app/ops/deals/page.tsx`
  severity: medium
  Đề xuất: known-limits

- **Khi truy vấn lỗi thanh lọc biến mất, trái AC-7 và không dùng `leading` của RegionError**
  Người dùng thấy gì: Khi tải danh sách bị lỗi, thanh lọc biến mất cùng khối báo lỗi, người dùng phải bấm Thử lại mới lọc tiếp được.
  Căn cứ: Nhẹ: lỗi hiếm, bấm Thử lại là khôi phục, không mất dữ liệu.
  file: `app/src/app/ops/deals/page.tsx`
  severity: medium
  Đề xuất: known-limits

- **Nhãn «Độ tin» không phải nhãn chuẩn «Độ tin trích xuất» trong CONTEXT.md**
  Người dùng thấy gì: Dòng ghi «Độ tin» có thể bị đọc nhầm thành độ tin của mức giá thay vì độ tin của việc trích xuất.
  Căn cứ: Chỉ là chữ nhãn, không ảnh hưởng dữ liệu, sửa lúc nào cũng rẻ.
  file: `app/src/components/ops/deals-cells.tsx`
  severity: low
  Đề xuất: known-limits

- **Sheet tính «Căn cùng tiêu chí» và chuyển căn J/K chỉ trên trang đang xem, nên báo thiếu và báo sai «chưa có căn»**
  Người dùng thấy gì: Trong khung chi tiết một căn, số căn cùng tiêu chí bị đếm thiếu và nút căn kế tắt ở cuối trang, nên có lúc báo chưa có căn dù thực tế có.
  Căn cứ: Gây hiểu sai số liệu so sánh nhưng không mất hay lộ dữ liệu; người dùng vẫn xem được qua danh sách, và sửa đúng cách cần thiết kế riêng.
  file: `app/src/components/ops/deals-grid.tsx`
  severity: medium
  Đề xuất: new-contract

- **`?project=<id>` khi chưa có bảng hạng hiện toàn bộ danh sách dưới tiêu đề của dự án**
  Người dùng thấy gì: Khi chưa có bảng hạng, mở một dự án vẫn hiện căn của mọi phường dưới tiêu đề tên dự án, không có báo lỗi.
  Căn cứ: Chỉ xảy ra khi bảng hạng chưa dựng, tự hết khi có dữ liệu; gây hiểu nhầm tạm thời, không lộ hay mất dữ liệu.
  file: `app/src/app/ops/deals/page.tsx`
  severity: medium
  Đề xuất: known-limits

- **Đổi hai điều kiện lọc liên tiếp làm mất điều kiện đầu**
  Người dùng thấy gì: Nếu chọn hai bộ lọc thật nhanh trước khi trang kịp tải, bộ lọc đầu có thể bị bỏ.
  Căn cứ: Nhẹ: cửa sổ chưa tới một giây, người dùng thấy ngay và chọn lại được.
  file: `app/src/components/ops/deals-grid.tsx`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 1, đo chỉ dẫn thay vì đầu ra: ca lỗi của AC-7 chỉ grep mã nguồn page.tsx, trong khi màn thật mất thanh lọc khi lỗi**
  Người dùng thấy gì: Phép kiểm tự động ca lỗi tải danh sách chỉ đọc chữ trong mã, nên có thể không bắt được nếu màn lỗi hỏng.
  Căn cứ: Là điểm yếu của kiểm thử, người dùng không thấy ngay; rủi ro thấp vì ca lỗi hiếm và có thể kiểm tay.
  file: `app/tests/deals-loc-xep-hang.test.tsx`
  severity: high
  Đề xuất: known-limits

- **Hình dạng 1, đo chỉ dẫn thay vì đầu ra: AC-8 tự chép chuỗi lọc theo vai trong test, không đo dữ liệu trang gửi xuống**
  Người dùng thấy gì: Phép kiểm tự động việc ẩn tên, số điện thoại cho vai Người xem không chạy trên trang thật, nên có thể không phát hiện nếu bước ẩn bị gỡ nhầm.
  Căn cứ: Nếu lỗi xảy ra thì lộ thông tin liên hệ cho vai thấp, nhưng hiện mã chạy đúng; nên bổ sung phép đo sớm cho rẻ.
  file: `app/tests/deals-loc-xep-hang.test.tsx`
  severity: high
  Đề xuất: known-limits

- **Hình dạng 3, assert có mặt trong khi lời hứa là quan hệ: số tab Đủ để gọi và Còn thiếu chỉ so với chính bộ phân loại đang được đo**
  Người dùng thấy gì: Số trên hai tab «Đủ để gọi» và «Còn thiếu» chưa được kiểm độc lập, nên phân loại sai vẫn có thể qua kiểm tự động.
  Căn cứ: Rủi ro là số tab lệch mà không ai biết, nhưng người vận hành đối chiếu được bằng tay.
  file: `app/tests/deals-loc-xep-hang.test.tsx`
  severity: high
  Đề xuất: known-limits

- **Hình dạng 2, fixture viết tay đúng khuôn bên đọc: AC-2 dựng dòng bằng dongMau và hang, không đi qua toDealRow**
  Người dùng thấy gì: Phép kiểm dòng bảng không đi qua bước đọc dữ liệu thật, nên nếu lý do lùi cấp hay tên dự án bị mất thì có thể không bị bắt.
  Căn cứ: Chỉ là khoảng trống kiểm thử; nếu hỏng, màn chỉ thiếu chữ giải thích, không mất hay lộ dữ liệu.
  file: `app/tests/deals-loc-xep-hang.test.tsx`
  severity: high
  Đề xuất: known-limits

- **Hình dạng 5, thiếu ma trận toàn phần: số trên cây vị trí chỉ đo ở Bán mặc định, không có trục kind × type**
  Người dùng thấy gì: Số căn trên cây vị trí khi chọn Cho thuê hay đổi loại hình chưa được kiểm tự động, nên có thể sai mà không bị bắt.
  Căn cứ: Nếu sai chỉ lệch số đếm trên cây, người dùng thấy và đối chiếu được, không lộ dữ liệu.
  file: `app/tests/deals-loc-xep-hang.test.tsx`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 5, thiếu ma trận toàn phần: E6 khai kind × type × vị trí nhưng chỉ có vài điểm-case**
  Người dùng thấy gì: Việc kết hợp lọc Cho thuê với loại hình chưa được kiểm tự động, nên một lỗi lọc có thể lọt qua.
  Căn cứ: Lỗi nếu có chỉ hiện sai danh sách, người dùng tự thấy và lọc lại, không mất hay lộ dữ liệu.
  file: `app/tests/deals-loc-xep-hang.test.tsx`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 4, assertion âm tính một mình: đối chứng «thước phường» chỉ thử String.includes trên chuỗi tự chèn**
  Người dùng thấy gì: Phép kiểm không bắt lại được nếu chữ «thước phường» bị đưa trở lại bảng.
  Căn cứ: Chỉ là chữ trên màn, nhẹ, người dùng không bị hại; nhìn mắt là thấy.
  file: `app/tests/deals-loc-xep-hang.test.tsx`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 3, assert chuỗi có mặt trong khi lời hứa là «chỉ»: cột nguồn chỉ được kiểm có S0x**
  Người dùng thấy gì: Phép kiểm nguồn chỉ tìm mã S0x, nên nếu tên nguồn thật bị in thêm vào ô thì không bị bắt.
  Căn cứ: Hậu quả nặng nếu xảy ra vì tên nguồn thật là thông tin cần giữ kín, nhưng hiện mã không in tên thật; thêm phép kiểm là rẻ.
  file: `app/tests/deals-loc-xep-hang.test.tsx`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 4, assertion âm tính một mình: đối chứng «không có lý do» ghim thuộc tính, không có đối chứng dương cho thuộc tính đó**
  Người dùng thấy gì: Phép kiểm dòng không có lý do lùi cấp có thể không bắt được nếu dòng đó lại in một câu lý do thừa.
  Căn cứ: Nhẹ: chỉ thừa chữ giải thích trên màn, không ảnh hưởng dữ liệu.
  file: `app/tests/deals-loc-xep-hang.test.tsx`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 1, đo chỉ dẫn thay vì đầu ra: lời báo cloud của AC-8 chỉ được grep trong mã nguồn**
  Người dùng thấy gì: Phép kiểm lời báo «ảnh, chữ bài chỉ có ở máy thu» chỉ đọc chữ trong mã, nên có thể không bắt được nếu lời báo không hiện.
  Căn cứ: Nhẹ: thiếu một dòng thông báo trên cloud, không mất hay lộ dữ liệu.
  file: `app/tests/deals-loc-xep-hang.test.tsx`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 1, đo chỉ dẫn thay vì đầu ra: `?can=` được thay bằng lời gọi thẳng getDeal**
  Người dùng thấy gì: Phép kiểm mở căn nằm ngoài trang hiện tại không chạy đường chuyển hướng thật, nên có thể không bắt được nếu đường này hỏng.
  Căn cứ: Nếu hỏng, người dùng không mở được căn từ liên kết; vào lại từ danh sách được nên hậu quả nhẹ.
  file: `app/tests/deals-loc-xep-hang.test.tsx`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 1, đo chỉ dẫn thay vì đầu ra: AC-9 kiểm đầu trang bằng grep mã nguồn, không dựng đầu trang**
  Người dùng thấy gì: Phép kiểm mô tả đầu trang chỉ đọc chữ trong mã, không dựng đầu trang thật.
  Căn cứ: Chỉ là chữ mô tả trên đầu trang, nhẹ, kiểm bằng mắt dễ.
  file: `app/tests/deals-loc-xep-hang.test.tsx`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 3, assert chuỗi có mặt: «Còn thiếu» luôn có sẵn từ nhãn tab nên không đo huy hiệu của dòng**
  Người dùng thấy gì: Phép kiểm huy hiệu «Còn thiếu» trên dòng luôn xanh vì nhãn tab cũng có chữ này.
  Căn cứ: Rất nhẹ: chỉ là nhãn nhỏ trên dòng, chi phí sửa lớn hơn hậu quả.
  file: `app/tests/deals-loc-xep-hang.test.tsx`
  severity: low
  Đề xuất: wont-fix

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
