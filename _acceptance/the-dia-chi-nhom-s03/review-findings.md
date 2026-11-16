## Trong hợp đồng

- **Dòng căn cứ ô bán/thuê ghi «từ bài đã đọc» cả khi người vận hành tự điền giá trị**
  AC: AC-10
  file: `app/src/components/ops/group-cards/group-cards-text.ts:38`
  severity: low
  source: bugs
  detail: `dungNhap` (pipeline/lib/the-dia-chi-nhom.mjs) luôn ghi `evidence.muc_dich`, kể cả khi máy để trống, lúc đó `nguon` là null. Hàm `dongCanCuMucDich` chỉ trả «Người vận hành điền» khi `!o`, mà nhánh này không bao giờ xảy ra. Vì vậy khi máy để trống và người vận hành tự chọn Bán/Thuê qua «sửa», hộp hiện «từ bài đã đọc: X bán, Y thuê», tức là gán giá trị của người cho máy. Hàm `dongCanCu` bên cạnh đã kiểm `!o.nguon`; hàm này thiếu phép kiểm đó.
  rationale: AC-10 đòi người duyệt đọc đúng mỗi ô lấy từ đâu; dòng căn cứ gán sai nguồn cho giá trị do người điền.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **POST /api/v1/ops/group-cards thiếu chốt «chỉ máy thu» theo khuôn route labels; trên cloud ra 500 chứ không phải 404 như chú thích nói**
  Người dùng thấy gì: Trên bản cloud, nếu ai đó gọi thẳng lệnh ghi thẻ thì nhận lỗi chung chung thay vì thông báo rõ chỉ chạy ở máy thu. Không có thẻ nào bị ghi sai.
  Căn cứ: Chỉ lệch thông báo lỗi ở nơi vốn không có thẻ, không mất hay lộ dữ liệu, người dùng bình thường không gặp, sửa sau rẻ.
  file: `app/src/app/api/v1/ops/group-cards/route.ts`
  severity: medium
  Đề xuất: known-limits

- **Chú thích đầu lib/the-dia-chi-nhom.ts trỏ sai route và sai trang**
  Người dùng thấy gì: Không ảnh hưởng người dùng; chỉ khiến người đọc mã sau này tìm nhầm chỗ.
  Căn cứ: Không đổi hành vi nào, không mất dữ liệu, sửa chữ lúc nào cũng được.
  file: `app/src/lib/the-dia-chi-nhom.ts`
  severity: low
  Đề xuất: wont-fix

- **Cờ dirty của hộp duyệt không được xoá sau khi lưu thành công, nên lần mở thẻ sau hỏi «Bỏ thay đổi chưa lưu?» dù chưa sửa gì**
  Người dùng thấy gì: Sau khi lưu một thẻ, mở thẻ khác rồi đóng mà chưa sửa gì vẫn bị hỏi có bỏ thay đổi chưa lưu không. Người duyệt phải bấm xác nhận thêm một lần.
  Căn cứ: Chỉ gây phiền nhẹ, không mất hay ghi sai dữ liệu, bấm xác nhận là qua; sửa sau rẻ.
  file: `app/src/components/ops/group-cards/group-cards-dialog.tsx`
  severity: medium
  Đề xuất: known-limits

- **ghiNhap không khoá dòng khi đọc thẻ: nếu người vận hành quyết thẻ giữa lúc lệnh đang chạy, cả lượt dựng nháp hỏng với TypeError**
  Người dùng thấy gì: Nếu có người duyệt thẻ đúng lúc máy đang dựng nháp, lượt dựng nháp báo lỗi khó hiểu và dừng. Chạy lại lệnh là xong, không thẻ nào bị hỏng.
  Căn cứ: Hiếm gặp, giao dịch được hoàn lại nên không mất dữ liệu, chạy lại là khỏi.
  file: `pipeline/scripts/the-dia-chi-nhom.mjs`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 4 (âm tính một mình): «giữ thẻ đã duyệt» không phân biệt được vì băm căn cứ che mất điều kiện status, còn đối chứng đỏ gỡ luôn cả lớp che**
  Người dùng thấy gì: Bài kiểm tự động chưa chứng minh chắc rằng thẻ đã duyệt luôn được giữ nguyên khi căn cứ đổi. Hành vi thật chưa thấy hỏng.
  Căn cứ: Rủi ro là bỏ sót hồi quy sau này chứ không phải lỗi đang có; người dùng chưa chịu hậu quả, bổ sung ca kiểm sau là được.
  file: `pipeline/tests/the-dia-chi-nhom.itest.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 5 (tuyên lớp, chỉ có ca lẻ): «mỗi thẻ một dòng lịch sử dung_nhap» chỉ kiểm thẻ của nhóm «mot»**
  Người dùng thấy gì: Bài kiểm chỉ xác nhận lịch sử cho một nhóm trong năm loại nhóm, nên lỗi thiếu lịch sử ở bốn loại còn lại có thể không bị phát hiện.
  Căn cứ: Chưa có bằng chứng lỗi thật, chỉ là lưới an toàn mỏng; thêm ca kiểm sau rẻ.
  file: `pipeline/tests/the-dia-chi-nhom.itest.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 5 (thiếu ma trận toàn phần): ma trận AC-2 chỉ so phần khoá liệt kê, căn cứ {nguon, so_bai} không so theo từng ô, ô «cả hai 10/10» nằm lẫn trong callback**
  Người dùng thấy gì: Bài kiểm các ca dựng nháp chỉ so một phần ô, nên một ô khác sai có thể không bị bắt. Chưa có ô nào được chứng minh sai.
  Căn cứ: Là khoảng hở của bài kiểm, không phải lỗi đang chạm người dùng; có thể siết dần sau.
  file: `pipeline/tests/the-dia-chi-nhom.test.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 3 (có mặt thay vì quan hệ): ca «sửa» không đổi dự án và chỉ so before/after của muc_dich**
  Người dùng thấy gì: Bài kiểm việc sửa thẻ chưa chứng minh bản trước/sau chỉ khác đúng ô đã sửa. Chưa thấy ô nào bị ghi nhầm.
  Căn cứ: Lỗ hổng bài kiểm, không có hậu quả đã xảy ra; bổ sung ca kiểm sau là đủ.
  file: `app/tests/the-dia-chi-nhom-app.itest.tsx`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 4 (âm tính một mình): đếm khoá mồi trong «thân phản hồi» lấy trên phản hồi lỗi 409, vốn không thể chứa khoá, và đối chứng dương là chuỗi tự chèn**
  Người dùng thấy gì: Bài kiểm chưa chứng minh chắc rằng phản hồi lệnh ghi thẻ không bao giờ lộ khoá nhóm thật. Chưa thấy chỗ nào lộ.
  Căn cứ: Rủi ro lộ chưa có bằng chứng, nhưng chạm dữ liệu nhạy cảm nên nên bổ sung ca kiểm sớm khi tiện.
  file: `app/tests/the-dia-chi-nhom-app.itest.tsx`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 1 (đo chỉ dẫn thay vì đầu ra): sao-luu.sh chỉ được grep chữ, không chạy**
  Người dùng thấy gì: Bài kiểm chưa chạy thật script sao lưu, nên chưa chứng minh nó tạo được tệp sao lưu dùng được trước khi áp lên máy thu.
  Căn cứ: Có thể thử tay trước khi áp, người ký thấy được; chưa có hậu quả đã xảy ra.
  file: `pipeline/tests/the-dia-chi-nhom-lui.itest.mjs`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 3 (có mặt thay vì quan hệ): E8 tính «khớp» khi nút đầu của nháp trùng dự án sổ, nháp nhiều nút vẫn được tính**
  Người dùng thấy gì: Số đo chất lượng nháp có thể hơi lạc quan vì nháp thừa dự án sai vẫn được tính là khớp.
  Căn cứ: Chỉ lệch con số đo trước buổi duyệt, người duyệt vẫn thấy nháp thật và sửa được.
  file: `pipeline/scripts/the-dia-chi-nhom-that.mjs`
  severity: low
  Đề xuất: known-limits

## Chưa adversarial-verify (refuter chết)

⚠ Cụm ngoài vùng phủ: 2/12 lỗi rơi vào file không bộ đo nào phủ (app/src/components/ops/group-cards/group-cards-dialog.tsx, app/src/components/ops/group-cards/group-cards-text.ts) — dừng và quyết: mở rộng hợp đồng hay rút phạm vi.
