# Review findings: gio-ops-gio-vn (round 2)

## Trong hợp đồng

Không có.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **AC-10 chỉ đo số đếm; bản app vẫn lấy dòng mốc hỏng làm «sự kiện cuối», lệch với bản pipeline**
  Người dùng thấy gì: Khi tệp log cổng Kev bị ghi dở và dòng cuối cùng bị cắt cụt, ô «sự kiện cuối» trên cổng Ops có thể hiện «—» thay vì mốc hợp lệ gần nhất. Các số đếm hôm nay và 7 ngày vẫn đúng, và số đẩy lên cloud vẫn giữ mốc hợp lệ.
  Căn cứ: Hậu quả nhẹ: chỉ một ô mốc phụ hiện thiếu trong ca hiếm (log ghi dở đúng ở cuối tệp), không mất hay sai số liệu đếm, và tự hết khi có dòng log hợp lệ kế tiếp.
  file: `app/tests/gio-ops-gio-vn.test.tsx`
  severity: low
  Đề xuất: known-limits

- **parseLog bản pipeline ném RangeError khi gặp một dòng log có mốc hỏng, làm sập cả lượt push-ops-facts (r1 · tệp đã đổi)**
  Người dùng thấy gì: Nếu tệp log cổng Kev có một dòng bị hỏng hoặc cắt cụt phần giờ, lượt đẩy số liệu vận hành lên cloud sẽ hỏng cả lượt. Trang Ops trên cloud khi đó giữ số cũ cho tới khi dòng hỏng không còn nằm trong log.
  Căn cứ: Dòng log do hook ghi ra luôn có mốc chuẩn nên dòng hỏng hiếm, và lượt đẩy sau vẫn chạy lại được khi dòng lỗi qua đi; hậu quả là số cũ tạm thời, không mất dữ liệu.
  file: `pipeline/lib/ops-flow.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 2 (fixture viết tay đúng khuôn bên đọc): ca GV-AC-8 nhập tay ageHours=201 và status, không đi qua readFreshness (r1 · tệp đã đổi)**
  Người dùng thấy gì: Phép kiểm chưa chứng minh bước tính tuổi và trạng thái quá hạn của nguồn cho ra đúng con số mà màn hình hiện. Nếu sau này cách làm tròn hoặc cách xét quá hạn đổi, nhãn «trễ» trên trang Ops có thể sai mà kiểm tra vẫn xanh.
  Căn cứ: Màn hình hiện hôm nay vẫn đúng với các ca đã viết, rủi ro chỉ xuất hiện khi có người đổi cách tính sau này; bổ sung phép đo sau này rẻ và không mất dữ liệu của ai.
  file: `app/tests/gio-ops-gio-vn.test.tsx`
  severity: low
  Đề xuất: known-limits

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).

