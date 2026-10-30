# Review findings: s03-cam-mau-so-lieu (round 3)

## Trong hợp đồng

Không có finding nào trong hợp đồng ở round này.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **GIA_DONG dùng `\/\s*m\b` không cờ u nên chặn nhầm «/mỗi», «/ một tháng»: giá thuê viết bằng đồng bị lùi về null**
  Người dùng thấy gì: Tin cho thuê viết giá bằng đồng theo kiểu «7.000.000/mỗi tháng» hoặc «7.000.000/ một tháng» sẽ bị đọc thành không có giá và bị loại khỏi danh sách. Trước đợt sửa này, những tin đó vẫn đọc ra đúng giá.
  Căn cứ: Chỉ ảnh hưởng một cách viết hiếm của tin thuê, mất tin nhưng không làm sai số liệu của tin khác; bài gốc vẫn còn nguyên để nạp lại khi sửa, và sửa sau không đắt.
  file: `pipeline/transform-zalo.mjs`
  severity: medium
  Đề xuất: known-limits

- **Đơn giá viết bằng đồng làm mất tổng giá viết bằng đồng trong cùng tin (lùi so với commit trước)**
  Người dùng thấy gì: Tin nào ghi cả tổng giá lẫn đơn giá bằng đồng (ví dụ «2.700.000.000đ, đơn giá 45.000.000/m2») sẽ mất tổng giá, chỉ còn đơn giá. Tin đó có thể vào danh sách thiếu giá và lọt qua bộ chặn giá phi lý.
  Căn cứ: Chỉ xảy ra khi môi giới viết cả hai số bằng đồng trong một tin, là cách viết ít gặp so với «tỷ»; dữ liệu gốc không mất và nạp lại được sau khi sửa.
  file: `pipeline/transform-zalo.mjs`
  severity: medium
  Đề xuất: known-limits

- **Lookahead `\/\s*m\b` (regex không cờ u) chặn «7.000.000/mỗi tháng», làm tin thuê mất giá**
  Người dùng thấy gì: Tin cho thuê viết giá kiểu «7.000.000/mỗi tháng» bị đọc thành không có giá nên bị bỏ khỏi danh sách, trong khi bản trước đọc đúng.
  Căn cứ: Trùng với một lỗi khác cùng gốc: hiếm gặp, chỉ làm mất tin thuê viết theo kiểu này, bài gốc còn nguyên nên nạp lại được khi sửa.
  file: `pipeline/transform-zalo.mjs`
  severity: low
  Đề xuất: known-limits

- **GIA_TY_LE đọc số đếm đứng sau chữ tỷ thành phần lẻ của giá: «4 tỷ 5 tầng» ra 4,5 tỷ (r1 · tệp đã đổi)**
  Người dùng thấy gì: Tin bán nhà ghi kiểu «4 tỷ 5 tầng» bị hiểu thành giá 4,5 tỷ, nên giá và đơn giá trên mỗi m² của căn đó hiển thị sai mà không có cảnh báo.
  Căn cứ: Giá sai lọt vào dữ liệu bán thật và nhìn hợp lý nên khó phát hiện, nhưng chỉ ảnh hưởng nhóm tin có kể số tầng sau giá và sửa lại bằng một đợt riêng thì không đắt.
  file: `pipeline/transform-zalo.mjs`
  severity: medium
  Đề xuất: new-contract

- **GIA_DONG lấy đơn giá «45.000.000/m2» làm tổng giá tin bán (r1 · tệp đã đổi)**
  Người dùng thấy gì: Tin bán đất ghi đơn giá kiểu «45.000.000/m2» bị ghi thành tổng giá 45 triệu, kéo theo đơn giá mỗi m² sai hẳn so với thực tế.
  Căn cứ: Giá sai nặng và không bị chặn bởi trần 100 tỷ, nhưng chỉ xảy ra với một cách viết đơn giá nhất định và có thể sửa gọn trong một việc riêng.
  file: `pipeline/transform-zalo.mjs`
  severity: medium
  Đề xuất: new-contract

- **Lớp nguồn S03 trong mappings.yaml chưa khai các trường staging mới mà transform đã đọc (sender_name → seller_name, conversation_id) (r1)**
  Người dùng thấy gì: Tài liệu ánh xạ trường của nguồn S03 chưa ghi hai trường mới, nên người đọc tài liệu sẽ thấy sổ lệch với thực tế; người dùng cuối không thấy gì khác.
  Căn cứ: Chỉ là tài liệu nội bộ lệch, không làm mất hay sai dữ liệu, và bổ sung bất cứ lúc nào cũng rẻ.
  file: `pipeline/mappings.yaml`
  severity: low
  Đề xuất: known-limits

- **GIA_TY_LE đọc số tầng/lầu đứng sau chữ tỷ thành phần lẻ của giá («8 tỷ 4 tầng» ra 8,4 tỷ) (r1 · tệp đã đổi)**
  Người dùng thấy gì: Tin bán nhà phố ghi «8 tỷ 4 tầng» bị hiểu thành 8,4 tỷ, nên giá hiển thị cao hơn thật và đơn giá mỗi m² sai theo.
  Căn cứ: Giá sai lặng lẽ trên loại tin rất phổ biến là nhà phố, nhưng sửa sau không đắt và dữ liệu được nạp lại được.
  file: `pipeline/transform-zalo.mjs`
  severity: medium
  Đề xuất: new-contract

- **PHONE_RE trong gatSo xoá mất giá tỷ chẵn viết bằng đồng («3.000.000.000» ra null), GIA_DONG mới không bao giờ khớp được ca này (r1 · tệp đã đổi)**
  Người dùng thấy gì: Tin bán ghi giá tròn tỷ bằng chữ số đồng, ví dụ «3.000.000.000 đ», bị mất giá, nên căn đó hiện không có giá và rơi khỏi các bảng so sánh giá.
  Căn cứ: Mất giá chứ không sai giá, chỉ với một cách viết, và đọc lại từ bài gốc để bù thì không mất dữ liệu gốc.
  file: `pipeline/transform-zalo.mjs`
  severity: medium
  Đề xuất: new-contract

- **dienTichMetTran lấy khoảng cách («gần chợ 200m», «ra hồ 100m») làm diện tích (r1 · tệp đã đổi)**
  Người dùng thấy gì: Tin có câu như «gần chợ 200m» đôi khi bị lấy 200 làm diện tích căn, kéo theo đơn giá mỗi m² và mức tin cậy bị tính sai.
  Căn cứ: Chỉ ảnh hưởng một phần nhỏ tin có cụm khoảng cách đứng một mình, trước đây diện tích để trống nên hậu quả vừa phải; xử lý triệt để cần luật chặn rộng hơn nên đáng để ghi nhận trước.
  file: `pipeline/transform-zalo.mjs`
  severity: low
  Đề xuất: known-limits

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
