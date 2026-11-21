# Review findings: cham-bong-bo-sung-tin (round 1)

## Trong hợp đồng

(không có)

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **--tran không được kiểm: giá trị không phải số làm mất trần tiền**
  Người dùng thấy gì: Nếu người chạy gõ sai số trần chi phí (ví dụ dùng dấu phẩy), lượt chấm sẽ chạy hết mà không có trần tiền chặn, có thể tốn nhiều hơn mức đã duyệt.
  Căn cứ: Hậu quả là tốn tiền ngoài ý muốn nhưng chỉ khi gõ sai cờ, lượt chạy do người điều khiển và số tiền có chặn trên là toàn bộ lượt đã duyệt; sửa sau rẻ.
  file: `agent/scripts/cham-bong-bo-sung-tin.ts`
  severity: high
  Đề xuất: known-limits

- **Ghi sổ gọi lỗi thì làm mất kết quả của lời gọi đã trả tiền và lượt đổ giữa chừng**
  Người dùng thấy gì: Nếu việc ghi sổ gọi gặp lỗi đúng lúc, một lần đọc đã trả tiền có thể bị mất và lượt dừng giữa chừng; chạy lại sẽ đọc lại và tốn thêm một ít.
  Căn cứ: Chỉ xảy ra khi cơ sở dữ liệu trục trặc, không mất hay lộ dữ liệu tin, người dùng chạy lại được và chỉ tốn thêm vài lời gọi.
  file: `agent/src/enrich/cham-bong/doc.ts`
  severity: medium
  Đề xuất: known-limits

- **Giao dịch READ ONLY giữ mở suốt lượt gọi model kéo dài nhiều giờ trên DB máy thu dùng chung**
  Người dùng thấy gì: Trong lượt chấm dài vài giờ, kết nối đọc giữ mở trên cơ sở dữ liệu dùng chung, có thể làm công việc dọn dẹp nền chậm lại.
  Căn cứ: Chỉ làm chậm dọn dẹp tạm thời, không mất hay sai dữ liệu, tự hết khi lượt kết thúc; sửa sau rẻ.
  file: `agent/scripts/cham-bong-bo-sung-tin.ts`
  severity: medium
  Đề xuất: known-limits

- **--tran / --gioi-han không kiểm: giá trị không phải số thành NaN, trần tiền bị tắt lặng lẽ**
  Người dùng thấy gì: Gõ sai số trần hoặc số thẻ giới hạn khiến trần tiền không chặn hoặc lượt chạy rỗng mà vẫn báo thành công.
  Căn cứ: Chỉ xảy ra khi gõ sai cờ, người chạy thấy ngay kết quả bất thường và chạy lại được; rủi ro tiền có chặn trên là cả lượt đã duyệt.
  file: `agent/scripts/cham-bong-bo-sung-tin.ts`
  severity: medium
  Đề xuất: known-limits

- **Lời gọi lỗi (usd 0) bị tính vào trung bình chi phí của model, ước lượng tụt nên trần để lọt lời gọi làm vượt tiền**
  Người dùng thấy gì: Khi vài lời gọi đầu lỗi, hệ thống có thể đánh giá thấp chi phí và cho qua thêm một lời gọi sát trần, làm tổng vượt trần một chút.
  Căn cứ: Mức vượt chỉ khoảng một lời gọi, rất nhỏ so với trần, không ảnh hưởng dữ liệu; sửa sau rẻ.
  file: `agent/src/enrich/cham-bong/chay.ts`
  severity: low
  Đề xuất: known-limits

- **Lời gọi thành công nhưng thiếu số token thì chi phí lặng lẽ thành 0 và trần không thấy**
  Người dùng thấy gì: Nếu nhà cung cấp không trả số token, báo cáo và trần sẽ tính thấp chi phí thật của lượt chấm.
  Căn cứ: Chỉ làm số chi phí báo cáo thấp hơn thực tế trong ca hiếm, không mất dữ liệu tin; đối chiếu được với hóa đơn.
  file: `agent/src/enrich/cham-bong/doc.ts`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 5: ma trận AC-4 «64 assert» lặp lại cùng một phép thử, chiều o_da_co không bao giờ được đưa vào hàm**
  Người dùng thấy gì: Bài kiểm tra tự động đếm số ca nhiều hơn số ca thật sự khác nhau, nên độ phủ kiểm tra kết cục bị thổi phồng.
  Căn cứ: Không ảnh hưởng người dùng trực tiếp, chỉ giảm độ tin của phép kiểm; bổ sung sau rẻ.
  file: `agent/tests/cham-bong-bo-sung-tin.test.ts`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 3: AC-7 (b)(c)(d) chỉ assert số lời gọi, trong khi lời hứa là quan hệ «đúng những lời gọi đó»**
  Người dùng thấy gì: Bài kiểm tra chạy lại chỉ đếm số lời gọi, nên nếu hệ thống gọi lại nhầm cặp nhưng đúng số lượng thì vẫn không bị phát hiện.
  Căn cứ: Chỉ là lỗ hổng của phép kiểm, chưa có lỗi thật; không mất dữ liệu, bổ sung sau rẻ.
  file: `agent/tests/cham-bong-bo-sung-tin.test.ts`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 4: AC-9 assert «báo cáo không gọi model» bằng doesNotThrow trên hàm không có đường gọi model, model giả lập ném lỗi được dựng nhưng không bao giờ được nối vào**
  Người dùng thấy gì: Bài kiểm tra khẳng định báo cáo không gọi model nhưng phép kiểm đó không thể đỏ, vì báo cáo vốn không có đường gọi model.
  Căn cứ: Tính chất đã đúng sẵn do cách viết hàm, không có hậu quả cho người dùng; sửa tốn công mà không thêm giá trị.
  file: `agent/tests/cham-bong-bo-sung-tin.test.ts`
  severity: medium
  Đề xuất: wont-fix

- **Hình dạng 4: AC-2 kiểm chuỗi canh vắng mặt khi chuỗi đó chưa bao giờ vào đầu vào; đối chứng dương «2 trong khối» đạt được nhờ bị bỏ qua**
  Người dùng thấy gì: Bài kiểm tra việc lời nhắc không lộ giá trị đề xuất có chỗ đúng sẵn hoặc bị miễn, nên chưa chứng minh chặt được điều đó.
  Căn cứ: Chưa có bằng chứng lộ thật, chỉ là phép kiểm lỏng; không ảnh hưởng người dùng, bổ sung sau rẻ.
  file: `agent/tests/cham-bong-bo-sung-tin.test.ts`
  severity: low
  Đề xuất: known-limits

## Chưa adversarial-verify (refuter chết)

(không có)

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
