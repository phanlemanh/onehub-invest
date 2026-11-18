# Review findings: danh-ba-s16-thang-cau-truc (round 4)

## Trong hợp đồng

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Thước E10 sẽ đỏ giả sau khi áp DA37 lên máy thu: phần «gộp» đọc căn đã merged mà bước chép đã lọc bỏ (r3 · tệp đã đổi)**
  Người dùng thấy gì: Sau khi áp lên máy thu, lần đo kiểm lại của đợt nạp S16 trước có thể báo đỏ dù dữ liệu đúng. Người vận hành có thể tưởng dữ liệu hỏng và mất công kiểm tra.
  Căn cứ: Chỉ gây báo động giả ở lần đo kiểm lại, không làm mất hay sai dữ liệu, và chỉ cần ghi chú để người đọc biết số lệch đúng bằng 2 là bình thường.
  file: `pipeline/scripts/danh-ba-s16-that.mjs`
  severity: medium
  Đề xuất: known-limits

- **Thước E10 sẽ đỏ giả sau khi áp DA37 lên máy thu vì không chép căn S08 đã gộp sang DB thử (r3 · tệp đã đổi)**
  Người dùng thấy gì: Sau khi áp lên máy thu, phép đo kiểm lại của đợt nạp S16 trước có thể báo lỗi trong khi dữ liệu thật vẫn đúng. Người vận hành sẽ thấy cảnh báo đỏ không có thật.
  Căn cứ: Báo động giả, không mất dữ liệu và không ảnh hưởng người dùng cuối; chạy lại hay sửa thước sau đều không tốn kém và không gấp.
  file: `pipeline/scripts/danh-ba-s16-that.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 5: tuyên quét lớp «cộng thiếu hay cộng thừa đều là lệch» nhưng chỉ có điểm-case, thiếu ma trận đủ năm phần (r3 · tệp đã đổi)**
  Người dùng thấy gì: Bài test tự động chưa bắt được trường hợp phép kiểm tra bỏ sót hai trong năm phần. Nếu sau này có người sửa nhầm, lỗi có thể lọt qua mà không ai biết.
  Căn cứ: Chỉ làm yếu một lớp kiểm tra phụ, không ảnh hưởng dữ liệu hay người dùng hiện tại, và bổ sung ca test sau vẫn rẻ.
  file: `pipeline/scripts/s16-bon-phan.test.mjs`
  severity: high
  Đề xuất: known-limits

- **Hình dạng 3: lời hứa là QUAN HỆ «một căn vừa gộp vừa còn thẻ lệch» nhưng assert chỉ đo tổng (r3 · tệp đã đổi)**
  Người dùng thấy gì: Một bài test tự động có tên hứa kiểm một điều nhưng thực tế chỉ kiểm tổng số. Người đọc có thể tin rằng trường hợp một căn vừa gộp vừa còn thẻ lệch đã được bảo vệ trong khi chưa.
  Căn cứ: Chỉ là sai lệch giữa tên và nội dung test, không làm mất dữ liệu, và đổi tên test hay ghi chú lại là đủ.
  file: `pipeline/scripts/s16-bon-phan.test.mjs`
  severity: medium
  Đề xuất: known-limits

- **Nút phân khu S16 đúc mới bỏ trống dd_field, lệch khuôn nút phân khu S09 và luật RESO-first (r2)**
  Người dùng thấy gì: Các phân khu mới do nguồn S16 tạo ra mang nhãn phân loại chuẩn trống, khác với phân khu do nguồn S09 tạo. Người dùng không thấy khác biệt trên màn, chỉ ảnh hưởng khi sau này đối chiếu theo chuẩn dữ liệu.
  Căn cứ: Hậu quả nhẹ, chỉ là nhãn phân loại nội bộ, không mất hay lộ dữ liệu, và bổ sung nhãn sau này rẻ vì chỉ cần điền lại cho một số ít nút.
  file: `pipeline/phan-khu-s16.mjs`
  severity: medium
  Đề xuất: known-limits

- **Đảo một luật phân khu S16 làm nghỉ cả nút còn mang khu của luật khác, khiến các toà ấy lặng lẽ rơi khỏi tầng S16 (r2)**
  Người dùng thấy gì: Nếu hai luật phân khu cùng dùng chung một nút rồi người vận hành đảo một luật, các toà thuộc luật còn lại có thể tụt về dưới dự án mà không có cảnh báo. Ca này chỉ xảy ra khi hai luật trùng tên khu.
  Căn cứ: Hiếm gặp vì cần hai luật trùng khu, không mất dữ liệu gốc và có thể khôi phục bằng cách áp lại luật còn lại, nhưng lỗi im lặng nên cần ghi rõ để người vận hành biết.
  file: `pipeline/phan-khu-s16.mjs`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 4 — kiểm âm tính đứng một mình: «thẻ luật không in khu_id/toa_id» không có đối chứng dương thật trên đầu ra (r2)**
  Người dùng thấy gì: Bài kiểm tra bảo đảm thẻ luật không in mã nội bộ của khu và toà chưa chứng minh được nó sẽ báo đỏ nếu sau này có người lỡ in ra. Hiện tại thẻ không in các mã đó, nhưng chưa có lưới chắn thật.
  Căn cứ: Không ảnh hưởng người dùng hôm nay vì đầu ra hiện đúng, rủi ro chỉ là một lần sửa sau này vô tình lộ mã mà không ai phát hiện; thêm ca đối chứng sau rất rẻ.
  file: `pipeline/scripts/danh-ba-s16-cau-truc.itest.mjs`
  severity: medium
  Đề xuất: known-limits

## Chưa adversarial-verify (refuter chết)

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).

