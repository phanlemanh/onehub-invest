# Review findings: eval-classify-wilson (round 2)

## Trong hợp đồng

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Entity không chứa split: lượt --split dev ghi đè ô của tập test trên /ops/quality**
  Người dùng thấy gì: Nếu người vận hành chạy lượt chấm bằng tập chỉnh luật sau lượt chấm tập chấm, bảng Kiểm chất lượng sẽ hiện kết quả của tập chỉnh luật thay cho tập chấm ở cùng ô. Huy hiệu Đạt hoặc Không đạt trông như của tập chấm, chỉ có chữ nhỏ trong chi tiết cho biết khác.
  Căn cứ: Chỉ xảy ra khi người vận hành chủ động chạy tập chỉnh luật, không mất dữ liệu gốc và chạy lại lượt tập chấm là hiện đúng lại, nên hậu quả nhẹ.
  file: `pipeline/lib/eval-classify.mjs`
  severity: medium
  Đề xuất: known-limits

- **Ô của phân khúc biến mất ở lượt sau vẫn hiện kết quả cũ trên /ops/quality tới 7 ngày**
  Người dùng thấy gì: Khi một loại hình không còn xuất hiện ở lượt chấm sau, dòng kết quả của lượt trước vẫn nằm trên bảng Kiểm chất lượng tới 7 ngày, lẫn với các ô mới mà không có dấu hiệu nào cho biết nó đã cũ.
  Căn cứ: Chỉ gây hiểu nhầm tạm thời trong tối đa 7 ngày ở trường hợp hiếm là loại hình biến mất, số cũ tự hết hạn và không mất dữ liệu nào.
  file: `pipeline/lib/eval-classify.mjs`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 4: kiểm 'cả lượt hoàn tác' chỉ có vế âm, không đối chứng dương và không ghim thông điệp lỗi**
  Người dùng thấy gì: Phép kiểm cho lời hứa «lỗi giữa lượt thì không dòng nào ở lại» còn lỏng, nên chưa chắc nó bắt được lỗi nếu sau này việc ghi cả lượt trong một giao dịch bị hỏng. Hành vi hiện tại của lệnh chưa thấy sai.
  Căn cứ: Rủi ro nằm ở việc có thể bỏ sót lỗi trong tương lai chứ không phải lỗi đang xảy ra với người dùng, và siết lại phép kiểm là việc rẻ, làm sau được.
  file: `_acceptance/eval-classify-wilson/probes/db.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 5: ma trận 4 trạng thái × 2 tập tuyên kiểm 'số kiểu Việt' nhưng chỉ có 2 điểm-case kiểm định dạng số**
  Người dùng thấy gì: Một số ô không đạt hoặc bị bỏ qua có thể hiển thị số hay lý do sai định dạng (dấu chấm thay vì dấu phẩy) mà phép kiểm hiện tại không phát hiện. Nhãn tiếng Việt vẫn hiện đầy đủ.
  Căn cứ: Nếu có sai thì chỉ là lệch định dạng chữ trên bảng nội bộ cho vai vận hành, không sai số liệu, dễ nhận ra và sửa sau rẻ.
  file: `app/tests/dq-eval-classify-label.test.tsx`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 2: fixture eval_label_items viết tay đúng khóa join của bên đọc, không đi qua bên ghi thật label-sample**
  Người dùng thấy gì: Nếu sau này khâu sinh tập mẫu đổi cách đánh dấu tin, lệnh chấm có thể không nối được nhãn với chữ tin mà phép kiểm vẫn báo xanh. Hiện tại hai bên đang khớp nhau.
  Căn cứ: Chỉ là rủi ro khi có người đổi khâu sinh mẫu về sau, hiện không gây sai cho ai, và thêm một phép kiểm đầu-cuối sau này không đắt.
  file: `_acceptance/eval-classify-wilson/probes/nap-nhan.tsx`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 4 (âm tính một mình, không ghim thông điệp): ca hoàn tác ở ô thứ 5 của E7 dùng assert.rejects mà không có matcher (r1)**
  Người dùng thấy gì: Phép kiểm tra việc huỷ cả lượt khi ghi lỗi giữa chừng có thể báo xanh dù lỗi không đúng chỗ dự định. Bản thân lệnh vẫn chạy, chỉ là bằng chứng kiểm chưa chặt.
  Căn cứ: Hậu quả nhẹ vì chỉ làm bằng chứng kiểm yếu đi chứ không làm mất hay sai dữ liệu của người dùng, và có thể siết lại sau với chi phí thấp.
  file: `_acceptance/eval-classify-wilson/probes/db.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 3 (assert 'chuỗi có mặt' trong khi lời hứa là quan hệ/giá trị): lượt --dry trên oneinvest chỉ kiểm có dòng ô, không kiểm ô là skip (r1)**
  Người dùng thấy gì: Phép kiểm lượt chạy thử chỉ xác nhận có đủ 9 dòng ô chứ không xác nhận cả 9 đều là bỏ qua. Nếu lệnh in sai trạng thái thì phép kiểm vẫn có thể xanh.
  Căn cứ: Hậu quả nhẹ vì không ảnh hưởng dữ liệu người dùng, chỉ là phép kiểm lỏng; hiện lát OCP1 chưa có nhãn nên rủi ro sai trạng thái thấp và người vận hành nhìn bảng in là thấy ngay.
  file: `_acceptance/eval-classify-wilson/probes/db.mjs`
  severity: low
  Đề xuất: known-limits

## Chưa adversarial-verify (refuter chết)

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
