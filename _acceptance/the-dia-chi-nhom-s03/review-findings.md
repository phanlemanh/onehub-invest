## Trong hợp đồng

- **ten_nhom làm lộ khoá nhóm thật (group_key) ra HTML và vào ảnh chứng đã commit, trái với bất biến mà chính tính năng này đặt ra**
  file: `app/src/lib/the-dia-chi-nhom.ts:41`
  severity: medium
  AC: AC-6
  source: conventions
  detail: Migration 108 và lời đầu tệp lib đều ghi group_key là tầng A, «KHÔNG BAO GIỜ rời hàm đọc», ra ngoài chỉ dùng card_code. Nhưng docTheDiaChi trả ten_nhom = collection_units.original_name mà không lọc gì. Trên DB máy thu, S03-N014 có original_name đúng bằng khoá nhóm thật đã bỏ tiền tố (kiểm: original_name = regexp_replace(group_key,'^([^:]+:)?group:','') ra t, 19 chữ số). Hệ quả: cột «Nhóm» trên /ops/group-cards in nguyên khoá nhóm. Ảnh chứng _acceptance/the-dia-chi-nhom-s03/evidence/E5-step1.png đã commit lên kho công khai, và trong ảnh hàng TN-026 · S03-N014 hiện «<khoá nhóm>». E6/AC-6 vẫn xanh vì fixture đặt tên nhóm khác khoá mồi, nên không có ca nào bắt được trường hợp original_name trùng group_key. Cách sửa: trong hàm đọc, khi original_name trùng khoá thật thì đưa về NULL (hiện «Nhóm S03 chưa có tên»), và thêm ca fixture cho trường hợp này. Sau đó che hoặc thay ảnh chứng trước khi gộp.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Chạy lệnh dựng nháp đúng lúc người vận hành quyết thẻ thì cả lượt ghi bị đổ**
  Người dùng thấy gì: Nếu có người đang nhận hoặc bác thẻ đúng lúc máy dựng nháp, lượt dựng nháp có thể báo lỗi và dừng giữa chừng. Dữ liệu không bị hỏng, chạy lại là xong.
  Căn cứ: Hiếm gặp, không mất hay lộ dữ liệu, và người vận hành chạy lại lệnh là hết; sửa sau cũng rẻ.
  file: `pipeline/scripts/the-dia-chi-nhom.mjs`
  severity: low
  Đề xuất: known-limits

- **Lời mô tả route nói chưa áp 108 thì trả 404, thực tế trả 500, và trỏ nhầm route**
  Người dùng thấy gì: Trên máy chưa có bảng thẻ, bấm nhận hay bác thẻ báo lỗi chung chung thay vì thông báo rõ ràng. Lời chú thích trong mã cũng ghi sai.
  Căn cứ: Thẻ chỉ dùng ở máy thu nên tình huống này gần như không xảy ra với người dùng, và không mất hay lộ dữ liệu.
  file: `app/src/app/api/v1/ops/group-cards/route.ts`
  severity: low
  Đề xuất: known-limits

- **Cờ dirty của hộp thẻ không được xoá sau khi lưu thành công: thẻ mở sau hỏi «Bỏ thay đổi chưa lưu?» dù chưa sửa gì**
  Người dùng thấy gì: Sau khi lưu hoặc bác một thẻ rồi mở thẻ khác, nếu đóng hộp bằng Esc thì hộp vẫn hỏi có bỏ thay đổi chưa lưu, dù chưa sửa gì. Người duyệt chỉ cần bấm xác nhận thêm một lần.
  Căn cứ: Chỉ gây phiền nhẹ, không mất dữ liệu, người dùng tự bỏ qua được ngay; sửa sau rẻ.
  file: `app/src/components/ops/group-cards/group-cards-dialog.tsx`
  severity: low
  Đề xuất: known-limits

- **Lệnh dựng nháp gặp TypeError và mất cả lượt ghi nếu người vận hành duyệt thẻ giữa lúc đọc và lúc cập nhật**
  Người dùng thấy gì: Nếu thẻ vừa được duyệt đúng lúc máy dựng nháp, lượt dựng nháp dừng với thông báo lỗi khó hiểu và không ghi gì. Chạy lại sẽ bình thường.
  Căn cứ: Hiếm gặp, không hỏng dữ liệu và chạy lại được; chỉ thông báo lỗi kém rõ.
  file: `pipeline/scripts/the-dia-chi-nhom.mjs`
  severity: low
  Đề xuất: known-limits

- **Route group-cards trả 500 «không ghi được thẻ», không phải 404 như mô tả, khi DB chưa áp 108 (cloud)**
  Người dùng thấy gì: Trên môi trường chưa có bảng thẻ, thao tác ghi thẻ báo lỗi máy chủ chung chung thay vì báo rõ là chưa có tính năng.
  Căn cứ: Thẻ không lên cloud nên người dùng thật gần như không gặp; không mất hay lộ dữ liệu.
  file: `app/src/lib/the-dia-chi-nhom.ts`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 5 (tuyên ma trận toàn phần nhưng mỗi ô chỉ ghim một phần) kèm hình dạng 3 (căn cứ chỉ kiểm có mặt): ma trận TG1-AC-2 chỉ so các khoá có trong `mong`**
  Người dùng thấy gì: Bài kiểm tự động chỉ ghim một phần giá trị của mỗi ô, nên nếu máy điền sai một ô không được ghim thì bài kiểm vẫn xanh. Người duyệt có thể thấy thẻ nháp sai mà kiểm không báo.
  Căn cứ: Không ảnh hưởng người dùng trực tiếp, người duyệt vẫn xem và sửa từng thẻ; thắt chặt bài kiểm có thể làm sau.
  file: `pipeline/tests/the-dia-chi-nhom.test.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 1 (đo chỉ dẫn thay vì đầu ra): TG1-AC-9a kiểm sao-luu.sh bằng regex trên chữ script, không chạy script**
  Người dùng thấy gì: Bài kiểm chỉ đọc chữ trong script sao lưu chứ chưa chạy thử, nên chưa chắc bản sao lưu thật sinh ra đúng chỗ. Người vận hành nên tự chạy thử một lần trước khi áp.
  Căn cứ: Rủi ro chỉ nằm ở bước áp lên máy thu có người kiểm, và script sao lưu chạy thử được ngay; không mất dữ liệu nếu chạy thử trước.
  file: `pipeline/tests/the-dia-chi-nhom-lui.itest.mjs`
  severity: medium
  Đề xuất: known-limits

## Chưa adversarial-verify (refuter chết)

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
