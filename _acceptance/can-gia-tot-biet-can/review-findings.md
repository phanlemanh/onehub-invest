## Trong hợp đồng

(không có finding)

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **soPct tự định dạng số bằng toFixed, in dấu chấm thập phân thay vì dấu phẩy vi-VN**
  Người dùng thấy gì: Mức giảm lẻ hiện là «4.9%» (dấu chấm) trong khi giá hiện «1,5 tỷ» (dấu phẩy), nên một màn có hai kiểu viết số. Số vẫn đúng, chỉ lệch kiểu viết tiếng Việt.
  Căn cứ: Chỉ là lệch cách viết, số đúng và người vận hành đọc được, không mất hay lộ dữ liệu; sửa sau cũng rẻ.
  file: `app/src/lib/deals-chi-tiet.ts`
  severity: medium
  Đề xuất: known-limits

- **Tham số URL `?can=` là tiếng Việt, sai quy ước tham số tiếng Anh camelCase**
  Người dùng thấy gì: Địa chỉ trang có đuôi tiếng Việt «?can=» thay vì tên tiếng Anh theo quy ước đặt tên. Người dùng không thấy khác biệt khi dùng.
  Căn cứ: Chỉ là lệch quy ước đặt tên, không ảnh hưởng người dùng; đổi tên sau phải sửa cả hợp đồng và các liên kết đã lưu nên nên để Mạnh chốt riêng.
  file: `app/src/app/ops/deals/[offerId]/page.tsx`
  severity: medium
  Đề xuất: known-limits

- **Đặt padding trực tiếp lên Button (`px-0`), trái luật ReUI số 1**
  Người dùng thấy gì: Liên kết phường trong sheet bị lệch lề vài điểm ảnh so với thiết kế chuẩn. Không ảnh hưởng chức năng.
  Căn cứ: Chỉ là chi tiết thẩm mỹ rất nhỏ, không mất dữ liệu và không cản việc nào của người vận hành.
  file: `app/src/components/ops/deal-body.tsx`
  severity: low
  Đề xuất: wont-fix

- **Lý do rời danh sách mất dấu âm: căn đắt hơn thước hiện «Giảm 20%, dưới ngưỡng 5%»**
  Người dùng thấy gì: Căn đắt hơn mặt bằng phường nhưng đã rời danh sách sẽ hiện câu tự mâu thuẫn «Giảm 20%, dưới ngưỡng 5%». Người vận hành có thể bối rối về lý do căn rời danh sách.
  Căn cứ: Chỉ làm sai câu giải thích trên trang căn đã rời danh sách, không mất dữ liệu và các số khác trên trang vẫn đúng; sửa sau rẻ.
  file: `app/src/lib/deals-chi-tiet.ts`
  severity: medium
  Đề xuất: known-limits

- **Crumb «Căn giá tốt» quay lại chính trang một căn khi căn đủ ngưỡng nhưng ngoài 30 căn đã tải**
  Người dùng thấy gì: Khi có hơn 30 căn giá tốt, mở một căn ngoài 30 căn đầu rồi bấm đường dẫn về danh sách sẽ bị đưa lại đúng trang đang đứng. Hiện chỉ có 4 căn nên chưa ai gặp.
  Căn cứ: Chưa xảy ra với 4 căn hiện có và người dùng tự thoát bằng nút quay lại hay gõ địa chỉ bảng; việc mở rộng quá 30 căn thuộc CG2.
  file: `app/src/app/ops/deals/[offerId]/page.tsx`
  severity: medium
  Đề xuất: known-limits

- **Mở lại bằng ?can= với căn ở trang sau: đóng sheet thì bảng ở trang 1, không thấy hàng vừa xem**
  Người dùng thấy gì: Khi danh sách trên 15 căn, mở lại căn ở trang 2 rồi đóng sheet thì bảng quay về trang 1 và người vận hành mất chỗ đang duyệt. Hiện chỉ có 4 căn nên chưa gặp.
  Căn cứ: Chưa lộ với 4 căn, chỉ làm mất chỗ duyệt chứ không mất dữ liệu, người dùng tự bấm sang trang 2 được.
  file: `app/src/components/ops/deals-grid.tsx`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 5: sửa cả lớp chỗ in số giảm (soPct) nhưng chỉ đo hai điểm cauChungMinh và chuGiam, không có ma trận**
  Người dùng thấy gì: Một số chỗ hiện mức giảm lẻ chưa có phép kiểm tự động, nên sau này sửa nhầm có thể không bị phát hiện. Người dùng hôm nay không thấy lỗi.
  Căn cứ: Không ảnh hưởng người dùng hiện tại, chỉ làm giảm khả năng bắt lỗi về sau.
  file: `app/tests/can-gia-tot-biet-can.test.tsx`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 4: đối chứng ngưỡng là notEqual một mình, null cũng qua, và bề mặt trang không có đối chứng dương**
  Người dùng thấy gì: Phép kiểm dòng «Ngưỡng» trên trang một căn quá lỏng, nên bỏ dòng này đi có thể vẫn không bị bắt. Hiện dòng vẫn hiển thị đúng.
  Căn cứ: Không có hậu quả với người dùng hôm nay, chỉ là lưới an toàn kiểm thử còn lỏng.
  file: `app/tests/can-gia-tot-biet-can.test.tsx`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 2: tham số URL ở phép đo Back viết tay, còn các ca ?can= khác đi qua nhánh moBanDau mà bản thật không chạy**
  Người dùng thấy gì: Phép kiểm tự động chưa đọc địa chỉ trang đúng như bản chạy thật, nên có thể bỏ sót lỗi khi tải lại hay bấm quay lại. Chưa có dấu hiệu lỗi thật.
  Căn cứ: Chỉ là độ phủ phép kiểm chưa sát bản thật, không phải lỗi người dùng đang gặp; bản đang chạy còn được đo lại ở các AC chạy thật.
  file: `app/tests/can-gia-tot-biet-can.test.tsx`
  severity: low
  Đề xuất: known-limits

- **HoverCardContent bị ghi đè padding bằng p-1 (r2 · tệp đã đổi)**
  Người dùng thấy gì: Thẻ nhỏ hiện khi rê chuột có lề trong hẹp hơn các thẻ khác một chút. Chỉ lệch giao diện, không ảnh hưởng thông tin.
  Căn cứ: Hậu quả chỉ là lệch nhẹ về thẩm mỹ, không mất hay lộ dữ liệu, sửa sau rẻ.
  file: `app/src/components/ops/deals-cells.tsx`
  severity: low
  Đề xuất: known-limits

- **Button link trong dòng Phường bị ghi đè padding bằng px-0 (r2 · tệp đã đổi)**
  Người dùng thấy gì: Liên kết ở dòng Phường có khoảng đệm khác các nút còn lại. Người dùng vẫn bấm bình thường.
  Căn cứ: Chỉ lệch nhỏ về giao diện, không ảnh hưởng chức năng hay dữ liệu, sửa sau rẻ.
  file: `app/src/components/ops/deal-body.tsx`
  severity: low
  Đề xuất: known-limits

- **Trạng thái rỗng theo tab của bảng không có hành động (r2 · tệp đã đổi)**
  Người dùng thấy gì: Khi một tab như Đủ để gọi hết căn, người vận hành chỉ thấy câu thông báo mà không có nút quay về tab Tất cả. Họ tự bấm tab Tất cả được.
  Căn cứ: Người dùng tự quay lại bằng cách bấm tab, không mất dữ liệu, sửa sau rẻ.
  file: `app/src/components/ops/deals-grid.tsx`
  severity: low
  Đề xuất: known-limits

- **Chú thích «Cloud/DB lỗi → []» nằm sai hàm sau khi tách docSourceNameEntries (r2)**
  Người dùng thấy gì: Người sửa mã sau này có thể hiểu nhầm cách tên nguồn thật được che khi lỗi. Người dùng hiện tại không thấy gì khác.
  Căn cứ: Hiện không ảnh hưởng người dùng, chỉ là nguy cơ nhầm cho người sửa sau; sửa chú thích rất rẻ nhưng chưa gây hại.
  file: `app/src/lib/source-roles.ts`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 5, tuyên quét lớp nhưng đối chứng đỏ chỉ một điểm: deals-gate gộp bảy tệp, chỉ gài vào deals-grid (r2)**
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

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
