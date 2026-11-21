# Review findings: deals-phi-ly-do-doi-chung-tu-tinh (round 3)

## Trong hợp đồng

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Hình dạng 4 (âm tính một mình, không có đối chứng dương): AC-5 «giữ nguyên nghĩa» chỉ được kiểm ở chiều xanh, trên fixture làm các kiểm ấy luôn đúng (r2 · tệp đã đổi)**
  Người dùng thấy gì: Các kiểm cũ của lệnh đo vẫn chạy, nhưng bài test chưa chứng minh được chúng sẽ báo đỏ khi có tin phi lý lọt vào danh sách. Nếu sau này ai đó làm hỏng một kiểm cũ, có thể không ai biết ngay.
  Căn cứ: Không ảnh hưởng dữ liệu hay người dùng cuối, chỉ làm lưới an toàn của lệnh đo mỏng hơn; bổ sung test sau vẫn rẻ và không mất gì.
  file: `app/tests/deals-phi-ly-do.test.tsx`
  severity: medium
  Đề xuất: known-limits

- **Kiểm «luật loại bắt tin đối chứng» đọc dòng audit mới nhất toàn bảng, không chắc là dòng của lượt chạy vừa rồi (r1 · tệp đã đổi)**
  Người dùng thấy gì: Khi luật loại tin phi lý hỏng đúng lúc đêm đó không loại tin nào, lệnh đo trên máy thu có thể vẫn báo đạt dựa trên kết quả của một đêm cũ. Người vận hành có thể tin nhầm là luật còn chạy đúng.
  Căn cứ: Chỉ là công cụ đo nội bộ, không ảnh hưởng dữ liệu hay người dùng cuối; lỗi chỉ xảy ra khi luật đã hỏng, có thể phát hiện lại bằng lần đo khác, và sửa sau không đắt.
  file: `scripts/deals-phi-ly-do.mjs`
  severity: medium
  Đề xuất: known-limits

- **Đối chứng đọc lại dòng audit cũ đã commit khi bước đêm không ghi audit, nên kiểm «luật loại bắt tin đối chứng» có thể đạt giả (r1 · tệp đã đổi)**
  Người dùng thấy gì: Con số «loại N tin» in ra có thể là của một đêm trước chứ không phải lượt đo hiện tại, nên người đọc có thể hiểu sai tình trạng luật loại tin phi lý.
  Căn cứ: Chỉ ảnh hưởng độ tin cậy của một lệnh đo nội bộ, không làm mất hay lộ dữ liệu, người dùng cuối không thấy; sửa sau vẫn rẻ.
  file: `scripts/deals-phi-ly-do.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 3: kiểm «có mặt» (includes) trong khi eval hứa quan hệ bằng nhau offer_ids = [t_dpd_00] (r1 · tệp đã đổi)**
  Người dùng thấy gì: Nếu luật loại tin phi lý trở nên loại quá tay, lệnh đo vẫn báo đạt miễn là tin đối chứng có bị loại, nên tin hợp lý bị loại nhầm có thể không bị phát hiện bởi lệnh này.
  Căn cứ: Hợp đồng chỉ cam kết tin đối chứng bị bắt, không cam kết không bắt thừa; lỗi chỉ lộ ở công cụ đo, và việc loại thừa còn có các kiểm khác trên số liệu thật.
  file: `scripts/deals-phi-ly-do.mjs`
  severity: medium
  Đề xuất: known-limits

## Chưa adversarial-verify (refuter chết)

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).

