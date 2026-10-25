## Trong hợp đồng

- **Số S02 vẫn đi qua ranh giới server→client: hàng S02 của feedHealth truyền nguyên vào FeedsGrid/CollectionsTiles (client component), nên các số này nằm trong RSC payload của HTML trang**
  AC: AC-6
  file: `app/src/components/ops/collections/collections-view.tsx:78`
  severity: medium
  source: conventions
  detail: `FeedsGrid` và `CollectionsTiles` có "use client". `CollectionsView` (server) truyền `feeds={feedHealth}` chưa lọc ở dòng 73, 78 và 139, nên `items24h`, `stgRows`, `offers` của hàng S02 bị tuần tự hoá vào luồng flight `self.__next_f` trong HTML Next gửi xuống trình duyệt. Thay đổi chỉ che ở tầng cell: `isS02 ? <XemChatLuong/>` trong feeds-grid.tsx và `counted` trong collections-tiles.tsx. Các accessor sắp xếp (`stgRows`, `offers ?? -1`) cũng vẫn xếp hạng theo số S02 thật. Hợp đồng AC-6 nói rõ «đếm sự có mặt trong HTML», nhưng test chỉ dùng `renderToStaticMarkup` (không có RSC payload), smoke AC-7 chỉ đọc DOM, còn luật tĩnh 14 chỉ bắt định danh `airdna*`. Vì vậy cả ba lớp kiểm đều không thấy lính canh nằm trong payload thật. Cách đúng theo ranh giới: tầng server (page hoặc CollectionsView) bỏ hoặc null các trường số của hàng S02 trước khi truyền vào client component. Kiểu này đã làm với FlowDay, khi getFlowDays thôi đọc airdna_*.
  rationale: AC-6 đòi đếm mọi dạng in của từng lính canh trong HTML trang là 0 lần; số thô 987654/876543/765432/432109 còn nằm trong HTML thật qua luồng RSC nên AC-6 không đạt trên trang thật.

- **Số S02 vẫn có trong HTML của trang qua RSC payload: chỉ ẩn khi render, dữ liệu không được lọc**
  AC: AC-6
  file: `app/src/components/ops/collections/feeds-grid.tsx:29`
  severity: medium
  source: bugs
  detail: Thay đổi chỉ ẩn ba ô số của hàng S02 lúc render (isS02 → <XemChatLuong/>) và bỏ S02 khỏi phép cộng ở collections-tiles.tsx. Mảng feeds đưa vào vẫn còn nguyên số S02. page.tsx truyền nguyên feedHealth={feedHealth} (máy thu, dòng 72) và feedHealth={cloud.feeds ?? []} (máy chủ, dòng 44) vào FeedsGrid và CollectionsTiles. Cả hai đều là component "use client", nên Next tuần tự hoá toàn bộ props, gồm items24h, stgRows và offers của hàng S02 (ở máy chủ, items24h S02 lấy từ records24h), vào RSC flight payload (self.__next_f.push) nhúng trong HTML của /ops/collections. Hệ quả: số S02 vẫn rời server và nằm ngay trong page source. Điều này trái với luật 5 và với AC-6 («đếm mọi dạng in của từng lính canh trong HTML … 0 lần»). Thước AC-6 trong app/tests/collections-khong-so-s02.test.tsx dùng renderToStaticMarkup trên cây component nên không bao giờ thấy payload này. Smoke AC-7 chỉ đo DOM hiển thị, cũng không thấy. Kết quả là eval xanh nhưng điều kiện chưa thật sự đạt. Cách sửa: lọc hoặc che số ở phía server trước khi truyền xuống client, ví dụ map hàng S02 thành items24h/stgRows/offers = null trong page.tsx hoặc CollectionsView. Đồng thời thêm một phép đo trên HTML thật của trang, chẳng hạn smoke lấy p.content() rồi đếm lính canh.
  rationale: Cùng gốc với mục trên: AC-6 đòi 0 lần xuất hiện của lính canh trong HTML, mà dữ liệu S02 còn nguyên trong payload nhúng vào HTML trang.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Link mới tới /ops/quality thiếu prefetch={false}, khác pattern của mọi Link /ops khác trong components/ops**
  Người dùng thấy gì: Trang Thu thập có thể tải trước trang Chất lượng nặng khi chưa ai bấm, làm máy chủ tốn thêm một chút công. Người vận hành không thấy khác biệt trên màn hình.
  Căn cứ: Hậu quả nhẹ, chỉ tốn tài nguyên chứ không sai dữ liệu hay hiển thị, và sửa sau rất rẻ khi có dịp chạm vào các liên kết này.
  file: `app/src/components/ops/collections/feeds-grid.tsx`
  severity: low
  Đề xuất: wont-fix

- **Chú thích JSDoc của FeedsGrid bị tách khỏi hàm: khối doc mới chen giữa, nên doc `stale` giờ gắn vào isS02**
  Người dùng thấy gì: Người vận hành không thấy gì khác. Chỉ người đọc mã sau này gặp chú thích đặt sai chỗ nên có thể hiểu nhầm ý nghĩa một tham số.
  Căn cứ: Không ảnh hưởng người dùng cuối và không mất dữ liệu; sửa lại chú thích rất rẻ nhưng không đáng mở thêm việc riêng.
  file: `app/src/components/ops/collections/feeds-grid.tsx`
  severity: low
  Đề xuất: wont-fix

- **Mô tả biểu đồ và panel vòng thu viết mã nguồn trần thay vì sourceLabel(code, roles) như phần còn lại của cùng file**
  Người dùng thấy gì: Trên trang Thu thập, vài dòng mô tả gọi nguồn chỉ bằng mã như S01, S03 trong khi chỗ khác gọi kèm vai trò. Người vận hành thấy cách gọi không đồng nhất nhưng vẫn hiểu được.
  Căn cứ: Chỉ là lệch cách đặt tên trên màn hình, không sai số liệu và không lộ gì; có thể thống nhất sau trong đợt rà nhãn nguồn.
  file: `app/src/components/ops/collections/sync-activity.tsx`
  severity: low
  Đề xuất: known-limits

- **Smoke AC-7 nuốt lỗi chụp ảnh nhưng vẫn in dòng «ảnh chụp đã lưu»**
  Người dùng thấy gì: Nếu việc chụp ảnh lỗi, người ký vẫn thấy dòng báo đã lưu ảnh nên có thể ký mà thiếu ảnh làm bằng chứng. Tính năng trên trang không bị ảnh hưởng.
  Căn cứ: Chỉ ảnh hưởng bằng chứng cho người ký chứ không ảnh hưởng người dùng trang; người ký tự kiểm thư mục ảnh được và chạy lại là có.
  file: `scripts/smoke-collections-khong-so-s02.mjs`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 5 (tuyên quét LỚP nhưng chỉ có điểm-case): luật tĩnh «trang Thu thập không đọc trường S02» chỉ bắt tên airdna***
  Người dùng thấy gì: Kiểm tra tự động chỉ bắt được trường hợp số S02 quay lại bằng tên AirDNA. Nếu sau này ai đó đưa số S02 vào trang theo cách khác, kiểm tra này không báo.
  Căn cứ: Hiện số S02 đã được gỡ khỏi trang và các phép đo khác còn canh; rủi ro là về sau, và có thể bổ sung luật mạnh hơn khi cần.
  file: `scripts/check-portal-compliance.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 3 (assert «chuỗi có mặt» thay cho QUAN HỆ): «tổng đúng tab» của tab Zalo chưa được đo**
  Người dùng thấy gì: Tổng số ở mô tả tab Zalo của biểu đồ chưa có bài kiểm tự động chặt chẽ. Nếu tổng này cộng sai thì bài kiểm vẫn xanh và người vận hành có thể đọc con số lệch.
  Căn cứ: Chưa có bằng chứng số đang sai, chỉ là lưới kiểm lỏng; người vận hành tự đối chiếu được và thêm phép đo sau khá rẻ.
  file: `app/tests/collections-khong-so-s02.test.tsx`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 4 (assert âm tính đứng một mình): đảo assert tên thị trường S02 thành phủ định hẹp `>name<` mà không có đối chứng dương**
  Người dùng thấy gì: Một bài kiểm cũ về tên thị trường S02 trong vòng thu giờ chỉ bắt được cách in hẹp. Nếu tên lọt vào trang theo dạng khác, bài kiểm đó không báo.
  Căn cứ: Chỉ là độ chặt của một bài kiểm phụ, chính trang đã được các phép đo của hợp đồng này canh; cải thiện sau không tốn nhiều.
  file: `app/tests/ops-nhan-theo-context.test.tsx`
  severity: medium
  Đề xuất: known-limits

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).

