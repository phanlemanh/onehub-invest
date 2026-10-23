# Review findings: freshness-do-gio-thu-that-s03

## Trong hợp đồng

Không có finding nào map được vào AC.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Số đo 'lệch-snapshot' ở GT-AC-6 luôn ra 0, nên bằng chứng E6 không bao giờ đỏ được**
  Người dùng thấy gì: Dòng chẩn đoán trong báo cáo nghiệm thu có một con số luôn bằng 0 vì cơ sở dữ liệu không cho phép trường hợp đó xảy ra. Người đọc báo cáo có thể tưởng nó là một kiểm tra thật, nhưng nó không làm sai kết quả độ tươi nào của nguồn dữ liệu.
  Căn cứ: Hậu quả nhẹ: chỉ làm một dòng chẩn đoán kém ý nghĩa, không mất hay sai dữ liệu nào, và người dùng không nhìn thấy; ghi chú lại là đủ.
  file: `scripts/check-freshness.test.mjs`
  severity: low
  Đề xuất: known-limits

- **Thư mục tạm SCRATCH được tạo ngay lúc nạp module và không bao giờ bị xoá**
  Người dùng thấy gì: Mỗi lần chạy bộ kiểm thử, máy để lại một thư mục tạm nhỏ không được xoá. Người dùng cuối không bị ảnh hưởng gì, chỉ tốn chút dung lượng tạm trên máy phát triển.
  Căn cứ: Hậu quả rất nhẹ: không mất hay lộ dữ liệu, hệ điều hành tự dọn thư mục tạm theo thời gian, nên sửa không đáng công mở việc riêng.
  file: `scripts/check-freshness.test.mjs`
  severity: low
  Đề xuất: wont-fix

- **S03/S05 đo theo snapshot ĐẦU TIÊN thấy bài, không theo lần thu mới nhất: nguồn thu đều mà không có bài mới vẫn bị báo stale**
  Người dùng thấy gì: Khi nhóm Zalo vẫn được thu đều nhưng toàn bài đã có sẵn, báo cáo độ tươi vẫn có thể báo nguồn đó quá hạn dù nó đang chạy tốt. Người vận hành có thể bị báo động giả và đi tìm lỗi thu thập không có thật.
  Căn cứ: Hậu quả vừa: chỉ gây báo động giả chứ không làm mất hay sai dữ liệu, người vận hành tự kiểm tra lại được, nhưng sẽ lặp lại thường xuyên với nguồn nhóm có bài chồng nhau nên đáng xử lý trong một việc riêng.
  file: `scripts/lib/freshness.mjs`
  severity: medium
  Đề xuất: new-contract

- **Hình dạng 3 — E6/GT-AC-6: lời hứa là QUAN HỆ giữa các giá trị nhưng ca chỉ in chuỗi, không assert gì**
  Người dùng thấy gì: Phần kiểm tra trên dữ liệu thật chỉ in các con số ra để người đọc tự đối chiếu, máy không tự báo đỏ khi chúng lệch nhau. Nếu cơ sở dữ liệu không kết nối được, phần này vẫn hiện là đạt.
  Căn cứ: Hậu quả nhẹ đến vừa: chỉ làm bằng chứng nghiệm thu phụ thuộc người đọc, không ảnh hưởng dữ liệu hay trải nghiệm của người dùng, và người ký vẫn tự đối chiếu được từ các con số đã in.
  file: `scripts/check-freshness.test.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 2 — GT-AC-2: fixture nạp lại Zalo viết TAY theo đúng khuôn bên đọc, không đi qua writer import-airbnb.mjs**
  Người dùng thấy gì: Việc kiểm tra tình huống nạp lại bài Zalo cũ dùng dữ liệu dựng tay theo cách nạp hiện tại, không chạy bộ nạp thật. Nếu sau này cách nạp đổi, bài kiểm tra vẫn xanh trong khi báo cáo độ tươi có thể đo sai.
  Căn cứ: Hậu quả nhẹ đến vừa: hợp đồng đã thừa nhận giới hạn này, sai lệch chỉ xảy ra khi cách nạp đổi trong tương lai, và người dùng không mất dữ liệu; ghi lại để người đổi cách nạp biết mà kiểm tra.
  file: `scripts/check-freshness.test.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 1 — GT-AC-8: đo khai báo TIME_SOURCE mà runtime không đọc**
  Người dùng thấy gì: Bảng khai báo cột thời gian của từng nguồn chỉ để mô tả và kiểm tra, báo cáo độ tươi không đọc nó khi chạy. Nếu bảng này lệch khỏi câu truy vấn thật thì chỉ phần kiểm tra câu truy vấn mới bắt được.
  Căn cứ: Hậu quả rất nhẹ: số đo thật vẫn được kiểm bằng câu truy vấn, người dùng không thấy ảnh hưởng, và chi phí chỉnh lại cấu trúc vượt xa lợi ích.
  file: `scripts/check-freshness.test.mjs`
  severity: low
  Đề xuất: wont-fix

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
