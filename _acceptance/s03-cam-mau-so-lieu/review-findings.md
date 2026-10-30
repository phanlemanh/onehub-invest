# Review findings: s03-cam-mau-so-lieu (round 2)

## Trong hợp đồng

Không có finding trong hợp đồng ở round này. Hai finding đo lường của round 1 (AC-1 và AC-7) đã được sửa ở commit 4b3e3595 và các eval liên quan xanh ở round 2.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **GIA_TY_LE đọc số đếm đứng sau chữ tỷ thành phần lẻ của giá: «4 tỷ 5 tầng» ra 4,5 tỷ (r1)**
  Người dùng thấy gì: Tin bán nhà ghi kiểu «4 tỷ 5 tầng» bị hiểu thành giá 4,5 tỷ, nên giá và đơn giá trên mỗi m² của căn đó hiển thị sai mà không có cảnh báo.
  Căn cứ: Giá sai lọt vào dữ liệu bán thật và nhìn hợp lý nên khó phát hiện, nhưng chỉ ảnh hưởng nhóm tin có kể số tầng sau giá và sửa lại bằng một đợt riêng thì không đắt.
  file: `pipeline/transform-zalo.mjs`
  severity: medium
  Đề xuất: new-contract

- **GIA_DONG lấy đơn giá «45.000.000/m2» làm tổng giá tin bán (r1)**
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

- **GIA_TY_LE đọc số tầng/lầu đứng sau chữ tỷ thành phần lẻ của giá («8 tỷ 4 tầng» ra 8,4 tỷ) (r1)**
  Người dùng thấy gì: Tin bán nhà phố ghi «8 tỷ 4 tầng» bị hiểu thành 8,4 tỷ, nên giá hiển thị cao hơn thật và đơn giá mỗi m² sai theo.
  Căn cứ: Giá sai lặng lẽ trên loại tin rất phổ biến là nhà phố, nhưng sửa sau không đắt và dữ liệu được nạp lại được.
  file: `pipeline/transform-zalo.mjs`
  severity: medium
  Đề xuất: new-contract

- **PHONE_RE trong gatSo xoá mất giá tỷ chẵn viết bằng đồng («3.000.000.000» ra null), GIA_DONG mới không bao giờ khớp được ca này (r1)**
  Người dùng thấy gì: Tin bán ghi giá tròn tỷ bằng chữ số đồng, ví dụ «3.000.000.000 đ», bị mất giá, nên căn đó hiện không có giá và rơi khỏi các bảng so sánh giá.
  Căn cứ: Mất giá chứ không sai giá, chỉ với một cách viết, và đọc lại từ bài gốc để bù thì không mất dữ liệu gốc.
  file: `pipeline/transform-zalo.mjs`
  severity: medium
  Đề xuất: new-contract

- **dienTichMetTran lấy khoảng cách («gần chợ 200m», «ra hồ 100m») làm diện tích (r1)**
  Người dùng thấy gì: Tin có câu như «gần chợ 200m» đôi khi bị lấy 200 làm diện tích căn, kéo theo đơn giá mỗi m² và mức tin cậy bị tính sai.
  Căn cứ: Chỉ ảnh hưởng một phần nhỏ tin có cụm khoảng cách đứng một mình, trước đây diện tích để trống nên hậu quả vừa phải; xử lý triệt để cần luật chặn rộng hơn nên đáng để ghi nhận trước.
  file: `pipeline/transform-zalo.mjs`
  severity: low
  Đề xuất: known-limits

## Chưa adversarial-verify (refuter chết)

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
