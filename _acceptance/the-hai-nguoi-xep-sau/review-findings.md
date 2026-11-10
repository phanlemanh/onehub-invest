# Review findings: the-hai-nguoi-xep-sau (round 2)

## Trong hợp đồng

Không có.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **lat-that.mjs: tinKe trả null vẫn qua AC-4, phép đo đạt rỗng**
  Người dùng thấy gì: Phép đo trên dữ liệu thật có thể báo xanh dù hàm lấy tin kế không trả ra tin nào cho một vài nhóm. Người gắn nhãn khi đó có thể thấy nhóm hết tin sớm hơn thực tế, nhưng không bị kẹt ở thẻ hai người.
  Căn cứ: Hậu quả nhẹ vì chỉ làm phép đo kiểm thật bớt chặt, không mất hay lộ dữ liệu, và hành vi nhận đủ thẻ đơn đã được kiểm riêng bằng dữ liệu thử.
  file: `_acceptance/the-hai-nguoi-xep-sau/probes/lat-that.mjs`
  severity: high
  Đề xuất: known-limits

- **Hình dạng 4 — assertion âm tính một mình: AC-4 chỉ đòi ketMoi === 0, tinKe trả null vẫn đạt, đối chứng dương không chạy trên đầu ra tinKe**
  Người dùng thấy gì: Phép đo dữ liệu thật chỉ chứng minh không nhóm nào bị kẹt ở thẻ hai người, chưa chứng minh mọi nhóm còn thẻ đơn đều nhận được tin. Người dùng có thể gặp một số nhóm báo hết tin sớm mà phép đo không phát hiện.
  Căn cứ: Hậu quả nhẹ và tự phát hiện được khi gắn nhãn (nhóm hiện hết tin), không mất dữ liệu, và việc siết thêm phép đo không thuộc điều đã cam kết trong hợp đồng này.
  file: `_acceptance/the-hai-nguoi-xep-sau/probes/lat-that.mjs`
  severity: medium
  Đề xuất: known-limits

- **Giờ đăng của thẻ ghép lệch giữa lượt gắn (tinKe) và màn lượt hai (luot-hai) (r1)**
  Người dùng thấy gì: Với một số tin gộp, giờ đăng hiện ở màn gắn nhãn lượt một khác giờ hiện ở màn lượt hai. Người gắn dùng giờ để tìm lại bài trong nhóm nên có thể nhầm bài.
  Căn cứ: Chỉ lệch một dòng chữ phụ ở một số tin gộp, không mất hay sai dữ liệu đã lưu, người gắn đối chiếu lại được; sửa riêng ở màn lượt hai rẻ nhưng thuộc việc khác.
  file: `app/src/lib/labels-luot-hai.ts`
  severity: low
  Đề xuất: known-limits

- **tinKe nhận client tiêm `q` nhưng che tên nguồn lại đi qua pool toàn cục (r1)**
  Người dùng thấy gì: Khi chạy kiểm thử hoặc đo thử trên cơ sở dữ liệu khác với bản chính, tên người đăng có thể bị che sai hoặc để trống mà không ai hay. Trên bản chạy thật hai nơi đọc cùng một cơ sở dữ liệu nên người dùng không thấy khác biệt.
  Căn cứ: Chỉ ảnh hưởng môi trường thử, bản chạy thật không lộ tên nguồn vì bộ che vẫn đóng chặt; không mất dữ liệu và sửa sau cũng không đắt.
  file: `app/src/lib/labels-queries.ts`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 4 (âm tính một mình): các chiều đỏ chỉ dùng notDeepEqual/notEqual, không ghim giá trị sai mong đợi (r1)**
  Người dùng thấy gì: Một số phép kiểm thử chỉ xác nhận kết quả sai là «khác kết quả đúng» chứ không chỉ rõ sai thế nào. Nếu sau này có lỗi, bộ kiểm thử vẫn đỏ nhưng có thể đỏ vì lý do không đúng ý.
  Căn cứ: Không ảnh hưởng người dùng cuối hay dữ liệu, chỉ làm bộ kiểm thử kém sắc; bổ sung giá trị mong đợi sau vẫn rẻ.
  file: `app/tests/labels-nhom.test.tsx`
  severity: low
  Đề xuất: known-limits

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
