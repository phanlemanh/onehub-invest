# Review findings: can-gia-tot-biet-can (round 4)

## Trong hợp đồng

(không có)

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Thẻ Cổng Phạm vi vừa dựng lại vẫn tính AC-9 vào độ phủ dù AC-9 đã bị cắt**
  Người dùng thấy gì: Thẻ để ký phạm vi vẫn nói hai nhóm kiểm tra còn được một tiêu chí đã bị cắt đỡ. Người ký có thể tưởng phần ở màn hình nhỏ vẫn có bằng chứng máy, trong khi thực tế không có.
  Căn cứ: Chỉ làm người ký đọc lệch một câu về độ phủ, không mất dữ liệu và không ảnh hưởng người dùng cuối; mục hạn chế đã biết trên chính thẻ đã nói rõ phần này không có bằng chứng, và sửa lại sau rất rẻ.
  file: `_acceptance/can-gia-tot-biet-can/card-plain.json`
  severity: medium
  Đề xuất: known-limits

- **Ảnh bằng chứng E9-step4.png lộ rõ tên người đăng thật, trái yêu cầu che và trái lời ghi của báo cáo**
  Người dùng thấy gì: Một ảnh chụp trong hồ sơ nghiệm thu còn hiện rõ tên người đăng của một căn, dù báo cáo nói đã làm mờ. Tên này vốn là thông tin công khai của người rao, nên không lộ bí mật nào, chỉ là hồ sơ ghi sai.
  Căn cứ: Hậu quả nhẹ vì tên người bán đã là thông tin công khai và ảnh chỉ nằm trong hồ sơ, không tới người dùng; xoá hoặc che ảnh sau này rất rẻ.
  file: `_acceptance/can-gia-tot-biet-can/evidence/E9-step4.png`
  severity: medium
  Đề xuất: known-limits

- **Ảnh chứng E9-step4.png còn tên người đăng thật không che, trái với lời ghi đã che trong hồ sơ**
  Người dùng thấy gì: Hồ sơ nghiệm thu khẳng định đã làm mờ tên người đăng nhưng một khung ảnh vẫn đọc được tên. Người đọc hồ sơ bị báo sai, còn người dùng ứng dụng không bị ảnh hưởng.
  Căn cứ: Không lộ dữ liệu bí mật vì tên người bán đã công khai, và chỉ nằm trong hồ sơ nội bộ; sửa lại bằng cách che hoặc xoá ảnh là việc nhỏ làm sau được.
  file: `_acceptance/can-gia-tot-biet-can/evidence/E9-step4.png`
  severity: medium
  Đề xuất: known-limits

- **Thẻ ký Cổng Phạm vi vẫn tính AC-9 vào độ phủ dù AC-9 đã bị cắt**
  Người dùng thấy gì: Thẻ ký phạm vi còn ghi một tiêu chí đã bị cắt như đang bảo vệ hai nhóm kiểm tra. Người ký thấy thẻ tự mâu thuẫn với phần hạn chế đã biết ngay trên cùng thẻ.
  Căn cứ: Chỉ là sai lệch chữ trong tài liệu ký, không ảnh hưởng người dùng cuối và không mất dữ liệu; dựng lại thẻ sau rất rẻ.
  file: `_acceptance/can-gia-tot-biet-can/card-plain.json`
  severity: medium
  Đề xuất: known-limits

- **seller_name chữ «unknown» hiện như tên người đăng, câu dự phòng và sender_name không bao giờ được dùng**
  Người dùng thấy gì: Với vài căn, ô tên người đăng hiện chữ «unknown» như thể đó là tên thật, và tên dự phòng nếu có thì bị che mất. Người vận hành không biết căn đó chưa có tên người đăng, nhưng số điện thoại để gọi vẫn có.
  Căn cứ: Hậu quả nhẹ: chỉ hiện một nhãn gây nhầm ở số ít căn, không mất dữ liệu và người vận hành vẫn gọi được; sửa sau cũng rẻ nên có thể ghi hạn chế rồi làm ở hàng kế.
  file: `app/src/lib/deals.ts`
  severity: medium
  Đề xuất: known-limits

- **soPct tự định dạng số bằng toFixed, in dấu chấm thập phân thay vì dấu phẩy vi-VN (r3)**
  Người dùng thấy gì: Mức giảm lẻ hiện là «4.9%» (dấu chấm) trong khi giá hiện «1,5 tỷ» (dấu phẩy), nên một màn có hai kiểu viết số. Số vẫn đúng, chỉ lệch kiểu viết tiếng Việt.
  Căn cứ: Chỉ là lệch cách viết, số đúng và người vận hành đọc được, không mất hay lộ dữ liệu; sửa sau cũng rẻ.
  file: `app/src/lib/deals-chi-tiet.ts`
  severity: medium
  Đề xuất: known-limits

- **Tham số URL `?can=` là tiếng Việt, sai quy ước tham số tiếng Anh camelCase (r3)**
  Người dùng thấy gì: Địa chỉ trang có đuôi tiếng Việt «?can=» thay vì tên tiếng Anh theo quy ước đặt tên. Người dùng không thấy khác biệt khi dùng.
  Căn cứ: Chỉ là lệch quy ước đặt tên, không ảnh hưởng người dùng; đổi tên sau phải sửa cả hợp đồng và các liên kết đã lưu nên nên để Mạnh chốt riêng.
  file: `app/src/app/ops/deals/[offerId]/page.tsx`
  severity: medium
  Đề xuất: known-limits

- **Đặt padding trực tiếp lên Button (`px-0`), trái luật ReUI số 1 (r3)**
  Người dùng thấy gì: Liên kết phường trong sheet bị lệch lề vài điểm ảnh so với thiết kế chuẩn. Không ảnh hưởng chức năng.
  Căn cứ: Chỉ là chi tiết thẩm mỹ rất nhỏ, không mất dữ liệu và không cản việc nào của người vận hành.
  file: `app/src/components/ops/deal-body.tsx`
  severity: low
  Đề xuất: wont-fix

- **Lý do rời danh sách mất dấu âm: căn đắt hơn thước hiện «Giảm 20%, dưới ngưỡng 5%» (r3)**
  Người dùng thấy gì: Căn đắt hơn mặt bằng phường nhưng đã rời danh sách sẽ hiện câu tự mâu thuẫn «Giảm 20%, dưới ngưỡng 5%». Người vận hành có thể bối rối về lý do căn rời danh sách.
  Căn cứ: Chỉ làm sai câu giải thích trên trang căn đã rời danh sách, không mất dữ liệu và các số khác trên trang vẫn đúng; sửa sau rẻ.
  file: `app/src/lib/deals-chi-tiet.ts`
  severity: medium
  Đề xuất: known-limits

- **Crumb «Căn giá tốt» quay lại chính trang một căn khi căn đủ ngưỡng nhưng ngoài 30 căn đã tải (r3)**
  Người dùng thấy gì: Khi có hơn 30 căn giá tốt, mở một căn ngoài 30 căn đầu rồi bấm đường dẫn về danh sách sẽ bị đưa lại đúng trang đang đứng. Hiện chỉ có 4 căn nên chưa ai gặp.
  Căn cứ: Chưa xảy ra với 4 căn hiện có và người dùng tự thoát bằng nút quay lại hay gõ địa chỉ bảng; việc mở rộng quá 30 căn thuộc CG2.
  file: `app/src/app/ops/deals/[offerId]/page.tsx`
  severity: medium
  Đề xuất: known-limits

- **Mở lại bằng ?can= với căn ở trang sau: đóng sheet thì bảng ở trang 1, không thấy hàng vừa xem (r3)**
  Người dùng thấy gì: Khi danh sách trên 15 căn, mở lại căn ở trang 2 rồi đóng sheet thì bảng quay về trang 1 và người vận hành mất chỗ đang duyệt. Hiện chỉ có 4 căn nên chưa gặp.
  Căn cứ: Chưa lộ với 4 căn, chỉ làm mất chỗ duyệt chứ không mất dữ liệu, người dùng tự bấm sang trang 2 được.
  file: `app/src/components/ops/deals-grid.tsx`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 5: sửa cả lớp chỗ in số giảm (soPct) nhưng chỉ đo hai điểm cauChungMinh và chuGiam, không có ma trận (r3)**
  Người dùng thấy gì: Một số chỗ hiện mức giảm lẻ chưa có phép kiểm tự động, nên sau này sửa nhầm có thể không bị phát hiện. Người dùng hôm nay không thấy lỗi.
  Căn cứ: Không ảnh hưởng người dùng hiện tại, chỉ làm giảm khả năng bắt lỗi về sau.
  file: `app/tests/can-gia-tot-biet-can.test.tsx`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 4: đối chứng ngưỡng là notEqual một mình, null cũng qua, và bề mặt trang không có đối chứng dương (r3)**
  Người dùng thấy gì: Phép kiểm dòng «Ngưỡng» trên trang một căn quá lỏng, nên bỏ dòng này đi có thể vẫn không bị bắt. Hiện dòng vẫn hiển thị đúng.
  Căn cứ: Không có hậu quả với người dùng hôm nay, chỉ là lưới an toàn kiểm thử còn lỏng.
  file: `app/tests/can-gia-tot-biet-can.test.tsx`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 2: tham số URL ở phép đo Back viết tay, còn các ca ?can= khác đi qua nhánh moBanDau mà bản thật không chạy (r3)**
  Người dùng thấy gì: Phép kiểm tự động chưa đọc địa chỉ trang đúng như bản chạy thật, nên có thể bỏ sót lỗi khi tải lại hay bấm quay lại. Chưa có dấu hiệu lỗi thật.
  Căn cứ: Chỉ là độ phủ phép kiểm chưa sát bản thật, không phải lỗi người dùng đang gặp; bản đang chạy còn được đo lại ở các AC chạy thật.
  file: `app/tests/can-gia-tot-biet-can.test.tsx`
  severity: low
  Đề xuất: known-limits

- **HoverCardContent bị ghi đè padding bằng p-1 (r2)**
  Người dùng thấy gì: Thẻ nhỏ hiện khi rê chuột có lề trong hẹp hơn các thẻ khác một chút. Chỉ lệch giao diện, không ảnh hưởng thông tin.
  Căn cứ: Hậu quả chỉ là lệch nhẹ về thẩm mỹ, không mất hay lộ dữ liệu, sửa sau rẻ.
  file: `app/src/components/ops/deals-cells.tsx`
  severity: low
  Đề xuất: known-limits

- **Button link trong dòng Phường bị ghi đè padding bằng px-0 (r2)**
  Người dùng thấy gì: Liên kết ở dòng Phường có khoảng đệm khác các nút còn lại. Người dùng vẫn bấm bình thường.
  Căn cứ: Chỉ lệch nhỏ về giao diện, không ảnh hưởng chức năng hay dữ liệu, sửa sau rẻ.
  file: `app/src/components/ops/deal-body.tsx`
  severity: low
  Đề xuất: known-limits

- **Trạng thái rỗng theo tab của bảng không có hành động (r2)**
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

⚠ Cụm ngoài vùng phủ: 4/5 lỗi rơi vào file không bộ đo nào phủ (_acceptance/can-gia-tot-biet-can/card-plain.json, _acceptance/can-gia-tot-biet-can/evidence/E9-step4.png) — dừng và quyết: mở rộng hợp đồng hay rút phạm vi.
