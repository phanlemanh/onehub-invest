# Review findings: danh-ba-s16-thang-cau-truc (round 2)

## Trong hợp đồng

Không có finding nào.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Nút phân khu S16 đúc mới bỏ trống dd_field, lệch khuôn nút phân khu S09 và luật RESO-first**
  Người dùng thấy gì: Các phân khu mới do nguồn S16 tạo ra mang nhãn phân loại chuẩn trống, khác với phân khu do nguồn S09 tạo. Người dùng không thấy khác biệt trên màn, chỉ ảnh hưởng khi sau này đối chiếu theo chuẩn dữ liệu.
  Căn cứ: Hậu quả nhẹ, chỉ là nhãn phân loại nội bộ, không mất hay lộ dữ liệu, và bổ sung nhãn sau này rẻ vì chỉ cần điền lại cho một số ít nút.
  file: `pipeline/phan-khu-s16.mjs`
  severity: medium
  Đề xuất: known-limits

- **Đảo một luật phân khu S16 làm nghỉ cả nút còn mang khu của luật khác, khiến các toà ấy lặng lẽ rơi khỏi tầng S16**
  Người dùng thấy gì: Nếu hai luật phân khu cùng dùng chung một nút rồi người vận hành đảo một luật, các toà thuộc luật còn lại có thể tụt về dưới dự án mà không có cảnh báo. Ca này chỉ xảy ra khi hai luật trùng tên khu.
  Căn cứ: Hiếm gặp vì cần hai luật trùng khu, không mất dữ liệu gốc và có thể khôi phục bằng cách áp lại luật còn lại, nhưng lỗi im lặng nên cần ghi rõ để người vận hành biết.
  file: `pipeline/phan-khu-s16.mjs`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 4 — kiểm âm tính đứng một mình: «thẻ luật không in khu_id/toa_id» không có đối chứng dương thật trên đầu ra**
  Người dùng thấy gì: Bài kiểm tra bảo đảm thẻ luật không in mã nội bộ của khu và toà chưa chứng minh được nó sẽ báo đỏ nếu sau này có người lỡ in ra. Hiện tại thẻ không in các mã đó, nhưng chưa có lưới chắn thật.
  Căn cứ: Không ảnh hưởng người dùng hôm nay vì đầu ra hiện đúng, rủi ro chỉ là một lần sửa sau này vô tình lộ mã mà không ai phát hiện; thêm ca đối chứng sau rất rẻ.
  file: `pipeline/scripts/danh-ba-s16-cau-truc.itest.mjs`
  severity: medium
  Đề xuất: known-limits

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).

