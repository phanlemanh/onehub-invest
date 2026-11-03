# Review findings: can-gia-tot-biet-can (round 2)

## Trong hợp đồng

- **Câu chứng minh tự mâu thuẫn khi làm tròn mức giảm qua ngưỡng**
  file: `app/src/lib/deals-chi-tiet.ts:78`
  severity: low
  AC: AC-4
  source: bugs
  detail: cauChungMinh làm tròn bằng `Math.abs(d.discountPct).toFixed(0)` (dòng 75) nhưng so ngưỡng trên số chưa làm tròn. bait_gap_pct có một chữ số thập phân, nên 4.9 cho ra «Rẻ hơn thước phường ... tức 5%, chưa tới ngưỡng vào danh sách 5%.». Tương tự, 35.2 cho ra «tức 35%, vượt ngưỡng 35%», và 50.4 cho ra «tức 50%, vượt ngưỡng loại 50%». Dòng «Mức giảm» (deal-body.tsx) và chuGiam trên tiêu đề cũng làm tròn về 0 chữ số, trong khi lyDoRoi in một chữ số («Giảm 4.9%»). Vì vậy trang một căn hiện hai số khác nhau cho cùng một căn. Test mới CGT-AC-4 dùng đúng ca 4.9 nhưng chỉ khớp đoạn «chưa tới ngưỡng», nên không bắt được lỗi này. Cách sửa: in một chữ số thập phân như lyDoRoi trong các câu so ngưỡng.

- **Hình dạng 5, tuyên đo hai bề mặt nhưng chỉ đo một: vòng CGT-AC-3 đo sheet hai lần, trang một căn không được đo trên DOM**
  file: `app/tests/can-gia-tot-biet-can.test.tsx:411`
  severity: high
  AC: AC-3
  source: measurement
  detail: Dòng 411 dựng mảng `[await vaoTrang(can, role, { offerId: "m1" }), await vaoTrang(ds, role, { can: "m1" })]` trước khi vào vòng lặp. Comment dòng 410 ghi «đo cả hai». Cả hai lần dựng xong, DOM chỉ còn sheet, vì `ve()` gỡ root cũ và ghi đè body (dòng 196, 199). `document.querySelector`, `goc.querySelectorAll` ở dòng 412-415 đọc DOM hiện tại, và `t.html()` là closure đọc `document.body.innerHTML` (dòng 220). Vì vậy ba phép đo chạy hai lần trên sheet và không lần nào trên trang một căn: 12 ảnh đúng thứ tự (413), HTML không có URL gốc (414), chữ bài 500 ký tự (415). Riêng `t.json` là theo từng lần dựng. Nếu trang /ops/deals/[offerId] mất ảnh, sai thứ tự ảnh hoặc cắt chữ bài, ca vẫn xanh, trong khi E3 khai `app/src/app/ops/deals/[offerId]/**` trong paths. Dòng này mới thêm ở commit 216ca26e.

- **Hình dạng 5, ma trận vai có phần tử không được đo: closure `t.html()`/`t.text()` luôn đọc trang dựng cuối**
  file: `app/tests/can-gia-tot-biet-can.test.tsx:784`
  severity: high
  AC: AC-6
  source: measurement
  detail: Cùng cơ chế với dòng 411: vòng lặp chạy trên mảng đã dựng xong, còn `html()`, `text()` đọc `document.body` tại thời điểm gọi (dòng 220). Dòng 784 `for (const t of [await vaoTrang(ds, null), await vaoTrang(can, null, { offerId: "z1" })]) assert.match(t.text(), /Cần đăng nhập ops/)` chỉ dùng `t.text()`, nên khách vào bảng cloud không được đo: bỏ cổng của page bảng thì ca vẫn xanh. Dòng 577-580 cũng vậy: `t.text()` và `t.html()` của bảng với khách, user thực ra đọc trang một căn, chỉ còn `t.json` theo đúng từng trang. Dòng 615-616 (tên nguồn thật 0 khớp trên bảng, sheet, trang) và dòng 780-782 (viewer trên cloud): nhánh `t.html()` đo ba lần cùng trang một căn, chỉ `t.json` phân biệt được từng bề mặt, nên HTML đã vẽ của bảng và sheet không được quét. E6, E7 hứa ma trận vai «qua page thật bảng, sheet, trang».

- **Hình dạng 3, assert chuỗi có mặt thay cho quan hệ: dòng «Ngưỡng» không ghim ngưỡng nào đi với nhãn nào, và «5%» khớp nhờ «35%»**
  file: `app/tests/can-gia-tot-biet-can.test.tsx:450`
  severity: medium
  AC: AC-4
  source: measurement
  detail: Dòng 450 chỉ kiểm `dong("Ngưỡng")!.includes(`${NGUONG_VAO_PCT}%`) && includes(`${NGHI_NGO_PCT}%`) && includes(`${NGUONG_LOAI_PCT}%`)`. E4 hứa một quan hệ: «ba ngưỡng trên trang bằng ba hằng số xuất từ mã», trong đó mỗi số đi với một vai trò (deal-body.tsx ghi `Vào từ 5%, xác minh trên 35%, loại trên 50%`). Có hai lỗ. Thứ nhất, `includes("5%")` luôn đúng vì «35%» chứa «5%», nên trang ghi «Vào từ 7%» vẫn xanh. Thứ hai, tráo thành «Vào từ 35%, xác minh trên 5%» cũng xanh vì không so vị trí hay nhãn. Dòng này cũng không có đối chứng đỏ. Phép so bằng cả câu dựng từ ba hằng sẽ bắt được cả hai.

- **Hình dạng 4, âm tính một mình: `Vì sao giá tốt` chỉ có assert vắng mặt**
  file: `app/tests/can-gia-tot-biet-can.test.tsx:500`
  severity: medium
  AC: AC-4
  source: measurement
  detail: Commit này đổi tiêu đề khối trong deal-body.tsx theo điều kiện `discountPct >= NGUONG_VAO_PCT`. Phép đo duy nhất là hai assert vắng mặt: dòng 497 `!/−-|Vì sao giá tốt/` và dòng 500 `!t2.text().includes("Vì sao giá tốt")`. Toàn bộ tệp test không có assert nào rằng căn trong khoảng ngưỡng hiện «Vì sao giá tốt», cũng không có assert nào cho nhãn thay thế «So với thước phường» (grep ra 0 dòng). Vì vậy đổi deal-body thành luôn ghi «So với thước phường», hoặc đổi tên tiêu đề, thì ca vẫn xanh. Không có đối chứng dương trên căn 22% và không có chiều đỏ.

- **Hình dạng 4, âm tính một mình: «0 cột Gọi ai» và «0 img ở danh sách cùng tiêu chí» của viewer không có đối chứng dương ở vai ops**
  file: `app/tests/can-gia-tot-biet-can.test.tsx:586`
  severity: medium
  AC: AC-6
  source: measurement
  detail: Dòng 586 kiểm `![...th].some(/Gọi ai/)` cho viewer. «Gọi ai» chỉ xuất hiện đúng một lần trong tệp test, và không có assert nào rằng vai ops có cột này, trong khi E6 hứa «ops có đủ cùng fixture». Đổi tên tiêu đề cột thì phép âm tính thành rỗng nghĩa mà vẫn xanh. Ngược hẳn với lọc Ảnh ngay dưới (dòng 587-594), vốn có cả chiều đỏ lẫn đối chứng ops. Dòng 602 `querySelectorAll('[role="dialog"] img').length === 0` ở tab cùng tiêu chí cũng thiếu đối chứng dương: vai ops không bao giờ mở tab này với `xemAnh: true`, và fixture `hangMoc` của AC-12 cố định `xemAnh: false` (dòng 917). Bỏ `DealThumb` khỏi deal-similar.tsx ở mọi vai thì không ca nào đỏ.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **HoverCardContent bị ghi đè padding bằng p-1**
  Người dùng thấy gì: Thẻ nhỏ hiện khi rê chuột có lề trong hẹp hơn các thẻ khác một chút. Chỉ lệch giao diện, không ảnh hưởng thông tin.
  Căn cứ: Hậu quả chỉ là lệch nhẹ về thẩm mỹ, không mất hay lộ dữ liệu, sửa sau rẻ.
  file: `app/src/components/ops/deals-cells.tsx`
  severity: low
  Đề xuất: known-limits

- **Button link trong dòng Phường bị ghi đè padding bằng px-0**
  Người dùng thấy gì: Liên kết ở dòng Phường có khoảng đệm khác các nút còn lại. Người dùng vẫn bấm bình thường.
  Căn cứ: Chỉ lệch nhỏ về giao diện, không ảnh hưởng chức năng hay dữ liệu, sửa sau rẻ.
  file: `app/src/components/ops/deal-body.tsx`
  severity: low
  Đề xuất: known-limits

- **Trạng thái rỗng theo tab của bảng không có hành động**
  Người dùng thấy gì: Khi một tab như Đủ để gọi hết căn, người vận hành chỉ thấy câu thông báo mà không có nút quay về tab Tất cả. Họ tự bấm tab Tất cả được.
  Căn cứ: Người dùng tự quay lại bằng cách bấm tab, không mất dữ liệu, sửa sau rẻ.
  file: `app/src/components/ops/deals-grid.tsx`
  severity: low
  Đề xuất: known-limits

- **Chú thích «Cloud/DB lỗi → []» nằm sai hàm sau khi tách docSourceNameEntries**
  Người dùng thấy gì: Người sửa mã sau này có thể hiểu nhầm cách tên nguồn thật được che khi lỗi. Người dùng hiện tại không thấy gì khác.
  Căn cứ: Hiện không ảnh hưởng người dùng, chỉ là nguy cơ nhầm cho người sửa sau; sửa chú thích rất rẻ nhưng chưa gây hại.
  file: `app/src/lib/source-roles.ts`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 5, tuyên quét lớp nhưng đối chứng đỏ chỉ một điểm: deals-gate gộp bảy tệp, chỉ gài vào deals-grid**
  Người dùng thấy gì: Bài quét tự động có thể không bắt được nếu ai đó vô tình đưa đường dẫn ảnh gốc vào vài tệp phụ. Hiện chưa có lỗi thật nào lộ ra.
  Căn cứ: Là lỗ hổng của lưới an toàn phụ, chưa gây lộ ảnh cho ai; còn có phép quét khác đỡ, sửa sau không gấp.
  file: `scripts/can-gia-tot-quet-ma.test.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 2, fixture viết tay: phần cloud của SHS-AC-6 tự xoá ảnh và chữ bài rồi assert không có chúng (r1)**
  Người dùng thấy gì: Một ca kiểm cũ về bản cloud chỉ lặp lại điều nó tự đặt sẵn nên không bắt được lỗi. Người dùng không thấy khác biệt gì, chỉ là một lớp kiểm yếu thừa.
  Căn cứ: Không ảnh hưởng người dùng, đã có phép kiểm khác phủ đúng chỗ này, nên ghi lại và để vậy là đủ.
  file: `app/tests/danh-ba-nguoi-deals-lien-he.test.tsx`
  severity: low
  Đề xuất: known-limits

⚠ Cụm ngoài vùng phủ: 2/11 lỗi rơi vào file không bộ đo nào phủ (app/src/lib/source-roles.ts, scripts/can-gia-tot-quet-ma.test.mjs) — dừng và quyết: mở rộng hợp đồng hay rút phạm vi.
