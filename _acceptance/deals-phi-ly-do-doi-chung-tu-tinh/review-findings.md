## Trong hợp đồng

- **Kiểm «luật loại bắt tin đối chứng» đọc dòng audit mới nhất của cả bảng, nên có thể đạt nhờ dòng audit cũ khi luật loại hỏng**
  AC: AC-2
  file: `scripts/deals-phi-ly-do.mjs:44`
  severity: medium
  source: conventions
  detail: chayDem() lấy `SELECT detail FROM ops_audit WHERE action = 'bait-gap:loai-phi-ly' ORDER BY id DESC LIMIT 1` mà không giới hạn vào dòng do chính lượt này ghi. loaiTinPhiLy (pipeline/refresh-bait-gap.mjs:104) không ghi audit khi không loại tin nào. Vì vậy, khi luật loại hỏng không ghi gì, chayDem trả về dòng audit của một đêm trước trên DB máy thu. Nếu dòng đó tình cờ có dau.offerId, ví dụ tin từng bị loại, sau đó được sửa diện tích và các đêm sau không loại thêm tin nào nên không có dòng audit mới, thì kiểm `luật loại bắt tin đối chứng` sẽ đạt dù luật hỏng. Đây đúng là chiều đỏ mà AC-2 hứa giữ. Test DPD-AC-2 không bắt được trường hợp này vì lược đồ riêng có ops_audit rỗng. Dòng in `loại: N tin` của phần đo chính cũng có thể là số cũ vì cùng lý do. Cách sửa: ghi max(id) trước mỗi lần refresh rồi chỉ đọc dòng có id lớn hơn; không có dòng mới thì trả { total: 0, offer_ids: [] }. Có thể dùng thêm giá trị trả về của refresh/loaiTinPhiLy.
  rationale: AC-2 hứa luật loại hỏng thì lượt đo đỏ; kiểm đạt nhờ dòng audit cũ trên DB thật làm lời hứa đó thất bại.

- **Đối chứng «luật loại bắt tin đối chứng» đọc dòng audit cũ nhất-gần-nhất, có thể đạt giả khi luật loại không ghi gì**
  AC: AC-2
  file: `scripts/deals-phi-ly-do.mjs:40`
  severity: medium
  source: bugs
  detail: Hàm chayDem() lấy `SELECT detail FROM ops_audit WHERE action = 'bait-gap:loai-phi-ly' ORDER BY id DESC LIMIT 1` mà không giới hạn vào dòng do chính lượt refresh trong SAVEPOINT vừa ghi. loaiTinPhiLy không ghi audit khi không loại được tin nào, nên nếu luật loại hỏng (không bắt tin nào, không INSERT) thì chayDem trả về dòng audit LỊCH SỬ của đêm trước trên DB máy thu thay cho `{offer_ids: []}`. Kiểm mới `(loaiDc.offer_ids ?? []).includes(dau.offerId)` vì thế dựa vào dữ liệu không thuộc lượt đo; chỉ đỏ đúng vì dòng cũ tình cờ không chứa dau.offerId. Ca DPD-AC-2 không lộ lỗi này vì fixture trong lược đồ riêng có ops_audit rỗng (rơi về giá trị mặc định). Cùng lỗi làm dòng log `loại: N tin` của phần đo chính in số của một đêm cũ khi lượt hiện tại loại 0 tin. Sửa: lấy max(id) audit trước khi chạy refresh và chỉ đọc dòng có id lớn hơn (hoặc dùng giá trị trả về của refresh), mặc định `{total:0, offer_ids:[]}` khi không có dòng mới.
  rationale: Cùng gốc với mục trên: kiểm đối chứng có thể xanh giả khi luật loại hỏng, trái AC-2.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Hình dạng 4 (âm tính một mình, không có đối chứng dương): AC-5 «giữ nguyên nghĩa» chỉ được kiểm ở chiều xanh, trên fixture làm các kiểm ấy luôn đúng**
  Người dùng thấy gì: Các kiểm cũ của lệnh đo vẫn chạy, nhưng bài test chưa chứng minh được chúng sẽ báo đỏ khi có tin phi lý lọt vào danh sách. Nếu sau này ai đó làm hỏng một kiểm cũ, có thể không ai biết ngay.
  Căn cứ: Không ảnh hưởng dữ liệu hay người dùng cuối, chỉ làm lưới an toàn của lệnh đo mỏng hơn; bổ sung test sau vẫn rẻ và không mất gì.
  file: `app/tests/deals-phi-ly-do.test.tsx`
  severity: medium
  Đề xuất: known-limits

- **Kiểm «luật loại bắt tin đối chứng» đọc dòng audit mới nhất toàn bảng, không chắc là dòng của lượt chạy vừa rồi (r1)**
  Người dùng thấy gì: Khi luật loại tin phi lý hỏng đúng lúc đêm đó không loại tin nào, lệnh đo trên máy thu có thể vẫn báo đạt dựa trên kết quả của một đêm cũ. Người vận hành có thể tin nhầm là luật còn chạy đúng.
  Căn cứ: Chỉ là công cụ đo nội bộ, không ảnh hưởng dữ liệu hay người dùng cuối; lỗi chỉ xảy ra khi luật đã hỏng, có thể phát hiện lại bằng lần đo khác, và sửa sau không đắt.
  file: `scripts/deals-phi-ly-do.mjs`
  severity: medium
  Đề xuất: known-limits

- **Đối chứng đọc lại dòng audit cũ đã commit khi bước đêm không ghi audit, nên kiểm «luật loại bắt tin đối chứng» có thể đạt giả (r1)**
  Người dùng thấy gì: Con số «loại N tin» in ra có thể là của một đêm trước chứ không phải lượt đo hiện tại, nên người đọc có thể hiểu sai tình trạng luật loại tin phi lý.
  Căn cứ: Chỉ ảnh hưởng độ tin cậy của một lệnh đo nội bộ, không làm mất hay lộ dữ liệu, người dùng cuối không thấy; sửa sau vẫn rẻ.
  file: `scripts/deals-phi-ly-do.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 3: kiểm «có mặt» (includes) trong khi eval hứa quan hệ bằng nhau offer_ids = [t_dpd_00] (r1)**
  Người dùng thấy gì: Nếu luật loại tin phi lý trở nên loại quá tay, lệnh đo vẫn báo đạt miễn là tin đối chứng có bị loại, nên tin hợp lý bị loại nhầm có thể không bị phát hiện bởi lệnh này.
  Căn cứ: Hợp đồng chỉ cam kết tin đối chứng bị bắt, không cam kết không bắt thừa; lỗi chỉ lộ ở công cụ đo, và việc loại thừa còn có các kiểm khác trên số liệu thật.
  file: `scripts/deals-phi-ly-do.mjs`
  severity: medium
  Đề xuất: known-limits

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).

