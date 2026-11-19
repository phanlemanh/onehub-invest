# Review findings: can-gia-tot-loc-xep-hang (round 4)

Review incomplete (finder chết): không có.

## Trong hợp đồng

- **Hình dạng 5 (tuyên quét lớp, chỉ có điểm-case): ma trận AC-6 chỉ phủ 2 trong 5 loại hình, và bộ tính độc lập sai với 3 loại còn lại**
  file: `app/tests/deals-loc-xep-hang.test.tsx:601`
  severity: high
  AC: AC-6
  source: measurement
  detail: E6 hứa «Ma trận kind × type × vị trí viết trước, mỗi ô một assert», nhưng dòng 601 ghim cứng `[null, "apartment", "house"]`; dòng 570 (cây × kind × type của E5) cũng vậy. Miền thật là `LOAI_LOC` gồm 5 giá trị: apartment, house, land, room, commercial (deals-chi-tiet.ts:293, vocab.generated.ts:6). Bảng Coverage của contract đếm đất 814, thương mại 7, thuê phòng 1.879 và gán trục này cho AC-6. Fixture cũng chỉ cấy apartment và house (dòng 201-219), không assert nào ghim số ô theo `LOAI_LOC.length`, nên lọc land, room, commercial không được đo. Hệ quả thứ hai: bộ tính tab độc lập ở dòng 356 coi chỉ `["apartment", "house"]` là đủ loại hình, còn luật thật `thieuGi` qua `loaiHinh` (deals-chi-tiet.ts:247, 271) nhận mọi loại khác unknown. Căn đất đủ mục sẽ là «du» ở mã thật và «thieu» ở bộ tính độc lập; ca AC-3 vẫn xanh chỉ vì fixture không có loại đó.
  rationale: Bảng Coverage gán đất, thương mại, phòng cho AC-6 nhưng ma trận kiểm chỉ phủ 2 loại, nên AC-6 chưa được chứng minh trên các loại còn lại.

- **Hình dạng 4 (âm tính một mình): dò lộ SĐT chỉ theo một dạng chuỗi, đối chứng dương ở danh sách chỉ là 3 chữ số**
  file: `app/tests/deals-loc-xep-hang.test.tsx:666`
  severity: medium
  AC: AC-8
  source: measurement
  detail: AC-8 hứa dữ liệu gửi xuống vai Người xem không có số điện thoại, nhưng dòng 659 và 666 chỉ dò chuỗi thô `0912345678`. Mỗi dòng `DealHang` mang số ở ba trường (deals.ts:65-66): `sellerPhone`, `sdt` và `tel`. Chạy thật hàm `fmtPhone` trên số cấy ra `0912 345 678`, không chứa chuỗi dò, nên lộ qua `sdt` không làm ca đỏ. `telHref` trả null với số cấy vì không đúng khuôn E.164, nên trường `tel` không bao giờ có giá trị trong fixture, và dạng `tel:+84912345678` cũng không chứa chuỗi dò. Đối chứng dương của danh sách ở dòng 674 chỉ là `vh.includes(SDT.slice(-3))`, tức chuỗi «678» có thể trùng ở bất kỳ đâu trong JSON, không chứng minh được dạng số nào đang được đo.
  rationale: AC-8 đòi dữ liệu gửi vai Người xem không có số điện thoại ở mọi dạng, mà phép kiểm chỉ dò một dạng chuỗi.

- **Hình dạng 5 (tuyên quét lớp, chỉ có điểm-case): căn hai tin ở biên trang chỉ đo một ô, không đi qua ma trận tab × vai × lược đồ**
  file: `app/tests/deals-loc-xep-hang.test.tsx:475`
  severity: medium
  AC: AC-4
  source: measurement
  detail: E4 hứa «có căn hai tin nằm ở biên trang: với mỗi tab × vai Người xem, Vận hành × lược đồ máy thu, cloud» hợp các trang đúng số trên tab. Căn biên trang chỉ tồn tại từ dòng 475 tới dòng 483, và trong đó chỉ có `hetTrang(TS())`: tab all, lược đồ máy thu, không xét vai. Vòng ma trận `kiem()` chạy trước khi tạo căn (dòng 468) và sau khi đã xoá căn (dòng 488, 493 trên cloud). Vì vậy các ô du, xac-minh, thieu và toàn bộ lược đồ cloud không có ca biên trang nào, trong khi cloud dùng câu SQL khác (`coAnh`, `coChu` là false).
  rationale: AC-4 nêu rõ căn nhiều tin ở biên trang qua từng tab, vai, lược đồ máy thu và cloud, mà ca kiểm chỉ đo một ô.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Tham số URL `kind=rent` lệch giá trị chuẩn `rent_lt`; gửi đúng giá trị chuẩn thì trang lặng lẽ hiện tin Bán**
  Người dùng thấy gì: Đường dẫn dùng chữ khác với chữ chuẩn của hệ thống cho tin Cho thuê. Ai dựng đường dẫn tay theo chữ chuẩn sẽ thấy danh sách Bán mà không có lời báo.
  Căn cứ: Chỉ ảnh hưởng đường dẫn gõ tay, bấm tab Cho thuê trên màn vẫn đúng, và đổi tên tham số sau này rẻ nếu làm sớm trước khi đường dẫn lan ra.
  file: `app/src/lib/deals-chi-tiet.ts`
  severity: medium
  Đề xuất: known-limits

- **Tham số URL `location` và `type` trái tên chuẩn `area` và tên code `property_type` trong CONTEXT.md**
  Người dùng thấy gì: Tên tham số trên đường dẫn không khớp bảng từ vựng chung, dễ gây nhầm khi đội khác dựng liên kết tới màn này.
  Căn cứ: Màn vẫn chạy đúng và hợp đồng đã chấp nhận tên này; chỉ là lệch quy ước, ghi lại để dọn từ vựng sau.
  file: `app/src/lib/deals-chi-tiet.ts`
  severity: medium
  Đề xuất: known-limits

- **Bộ chọn vị trí dùng chữ «Tỉnh, thành», «Tìm tỉnh…» mà CONTEXT.md đã loại**
  Người dùng thấy gì: Bộ chọn vị trí ghi «Tỉnh, thành» thay vì nhãn chuẩn «Thị trường», nên chữ trên màn không thống nhất với các trang khác.
  Căn cứ: Chỉ là nhãn chữ, không sai dữ liệu, người dùng hiểu được; gom vào đợt dọn từ vựng.
  file: `app/src/components/ops/deals-grid.tsx`
  severity: low
  Đề xuất: known-limits

- **Tab «Căn cùng tiêu chí» trong sheet chỉ so trong trang đang xem, báo sai là không có căn tương tự**
  Người dùng thấy gì: Khi mở một căn, tab căn cùng tiêu chí thường báo không có căn tương tự hoặc chỉ vài căn, dù thật còn hàng chục đến hàng trăm căn. Người duyệt có thể bỏ sót căn so sánh.
  Căn cứ: Con số sai và lời khẳng định «chưa có căn» gây hiểu lầm khi duyệt, nhưng không mất dữ liệu và danh sách chính vẫn đúng; cần sửa ở máy chủ nên làm thành việc riêng.
  file: `app/src/components/ops/deals-grid.tsx`
  severity: high
  Đề xuất: new-contract

- **Chuyển căn trong sheet dừng ở cuối trang và ghi «15/15» dù danh sách còn hàng nghìn căn**
  Người dùng thấy gì: Khi xem lần lượt từng căn, nút căn kế tắt ở căn cuối trang và màn ghi «15/15», làm người duyệt tưởng đã hết danh sách.
  Căn cứ: Người dùng tự thoát được bằng cách sang trang kế, không mất dữ liệu, nhưng gây hiểu lầm khi duyệt hàng loạt; sửa gắn với phân trang nên làm riêng.
  file: `app/src/components/ops/deals-grid.tsx`
  severity: medium
  Đề xuất: new-contract

- **Đổi hai điều kiện lọc liên tiếp làm mất điều kiện đầu**
  Người dùng thấy gì: Nếu đổi hai bộ lọc rất nhanh trước khi trang kịp tải, lựa chọn đầu có thể bị ghi đè mà không báo.
  Căn cứ: Chỉ xảy ra trong khoảng chờ vài giây, người dùng thấy ngay kết quả lệch và chọn lại được.
  file: `app/src/components/ops/deals-grid.tsx`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 4 (âm tính một mình): đối chứng «có dữ liệu thì không có chữ trống» dò đúng câu không thể xuất hiện ở tab Tất cả**
  Người dùng thấy gì: Một phép kiểm tự động về chữ báo trống yếu hơn tuyên bố, nên có thể không bắt được lỗi hiện nhầm chữ trống cạnh dữ liệu.
  Căn cứ: Người dùng chưa gặp lỗi nào, chỉ là lưới an toàn kiểm thử mỏng; bổ sung sau rẻ.
  file: `app/tests/deals-loc-xep-hang.test.tsx`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 4 (âm tính một mình): đối chứng thứ tự cũ của E11 nằm trong expected nhưng lệnh chấm không chạy**
  Người dùng thấy gì: Phép đo trên dữ liệu thật chỉ chứng minh chiều đúng, chưa chứng minh nó sẽ báo đỏ nếu thứ tự cũ quay lại.
  Căn cứ: Màn hiện đúng với người dùng; chỉ là bằng chứng nghiệm thu thiếu nửa đối chứng, chạy bổ sung sau.
  file: `_acceptance/can-gia-tot-loc-xep-hang/evals.yaml`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 4 (không ghim thông điệp): bảng thử phá nhận đỏ vì lý do khác là «đạt»**
  Người dùng thấy gì: Bảng thử phá nội bộ có thể ghi «đạt» khi nó đỏ vì lý do khác, không ảnh hưởng người dùng cuối.
  Căn cứ: Chỉ là công cụ kiểm nội bộ, chi phí sửa không tương xứng với hậu quả.
  file: `_acceptance/can-gia-tot-loc-xep-hang/probes/thu-pha.mjs`
  severity: low
  Đề xuất: wont-fix

- **Hình dạng 4 (không có đối chứng dương): so số dự án trên DB máy thu xanh khi cả hai bên bằng 0**
  Người dùng thấy gì: Phép đo dự án có thể báo khớp khi cả hai bên đều trả 0, nên bằng chứng có thể xanh dù dự án mất hết căn.
  Căn cứ: Số thật hiện tại khác 0 nên người dùng không bị ảnh hưởng; chỉ là bằng chứng yếu, thêm điều kiện lớn hơn 0 rất rẻ.
  file: `_acceptance/can-gia-tot-loc-xep-hang/probes/do-may-thu.mts`
  severity: low
  Đề xuất: known-limits

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
