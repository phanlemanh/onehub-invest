# Review findings: collections-khong-so-s02 (round 2)

## Trong hợp đồng

Không có phát hiện nào map được vào AC ở round này.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Hình dạng 4 (assert âm tính đứng một mình): ca «ranh giới server→client» không có đối chứng dương ở phía mã hiện tại, chỉ có ở bản sao main qua một đường phân loại client khác**
  Người dùng thấy gì: Trang Thu thập hiện không để lộ số S02, nhưng phép kiểm riêng cho đường dữ liệu từ máy chủ sang phần giao diện có thể báo «sạch» ngay cả khi nó không nhìn thấy dữ liệu. Nếu sau này số S02 lọt lại qua đường đó, phép kiểm này có thể không bắt được.
  Căn cứ: Không có số S02 nào đang lộ cho người vận hành, chỉ là một lớp canh thêm có thể yếu; sửa sau không mất dữ liệu và cũng không làm hỏng việc đang ship, nên ghi lại như một hạn chế đã biết là đủ.
  file: `app/tests/collections-khong-so-s02.test.tsx`
  severity: medium
  Đề xuất: known-limits

- **Link mới tới /ops/quality thiếu prefetch={false}, khác pattern của mọi Link /ops khác trong components/ops (r1)**
  Người dùng thấy gì: Trang Thu thập có thể tải trước trang Chất lượng nặng khi chưa ai bấm, làm máy chủ tốn thêm một chút công. Người vận hành không thấy khác biệt trên màn hình.
  Căn cứ: Hậu quả nhẹ, chỉ tốn tài nguyên chứ không sai dữ liệu hay hiển thị, và sửa sau rất rẻ khi có dịp chạm vào các liên kết này.
  file: `app/src/components/ops/collections/feeds-grid.tsx`
  severity: low
  Đề xuất: wont-fix

- **Chú thích JSDoc của FeedsGrid bị tách khỏi hàm: khối doc mới chen giữa, nên doc `stale` giờ gắn vào isS02 (r1)**
  Người dùng thấy gì: Người vận hành không thấy gì khác. Chỉ người đọc mã sau này gặp chú thích đặt sai chỗ nên có thể hiểu nhầm ý nghĩa một tham số.
  Căn cứ: Không ảnh hưởng người dùng cuối và không mất dữ liệu; sửa lại chú thích rất rẻ nhưng không đáng mở thêm việc riêng.
  file: `app/src/components/ops/collections/feeds-grid.tsx`
  severity: low
  Đề xuất: wont-fix

- **Mô tả biểu đồ và panel vòng thu viết mã nguồn trần thay vì sourceLabel(code, roles) như phần còn lại của cùng file (r1)**
  Người dùng thấy gì: Trên trang Thu thập, vài dòng mô tả gọi nguồn chỉ bằng mã như S01, S03 trong khi chỗ khác gọi kèm vai trò. Người vận hành thấy cách gọi không đồng nhất nhưng vẫn hiểu được.
  Căn cứ: Chỉ là lệch cách đặt tên trên màn hình, không sai số liệu và không lộ gì; có thể thống nhất sau trong đợt rà nhãn nguồn.
  file: `app/src/components/ops/collections/sync-activity.tsx`
  severity: low
  Đề xuất: known-limits

- **Smoke AC-7 nuốt lỗi chụp ảnh nhưng vẫn in dòng «ảnh chụp đã lưu» (r1)**
  Người dùng thấy gì: Nếu việc chụp ảnh lỗi, người ký vẫn thấy dòng báo đã lưu ảnh nên có thể ký mà thiếu ảnh làm bằng chứng. Tính năng trên trang không bị ảnh hưởng.
  Căn cứ: Chỉ ảnh hưởng bằng chứng cho người ký chứ không ảnh hưởng người dùng trang; người ký tự kiểm thư mục ảnh được và chạy lại là có.
  file: `scripts/smoke-collections-khong-so-s02.mjs`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 5 (tuyên quét LỚP nhưng chỉ có điểm-case): luật tĩnh «trang Thu thập không đọc trường S02» chỉ bắt tên airdna* (r1)**
  Người dùng thấy gì: Kiểm tra tự động chỉ bắt được trường hợp số S02 quay lại bằng tên AirDNA. Nếu sau này ai đó đưa số S02 vào trang theo cách khác, kiểm tra này không báo.
  Căn cứ: Hiện số S02 đã được gỡ khỏi trang và các phép đo khác còn canh; rủi ro là về sau, và có thể bổ sung luật mạnh hơn khi cần.
  file: `scripts/check-portal-compliance.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 3 (assert «chuỗi có mặt» thay cho QUAN HỆ): «tổng đúng tab» của tab Zalo chưa được đo (r1 · tệp đã đổi)**
  Người dùng thấy gì: Tổng số ở mô tả tab Zalo của biểu đồ chưa có bài kiểm tự động chặt chẽ. Nếu tổng này cộng sai thì bài kiểm vẫn xanh và người vận hành có thể đọc con số lệch.
  Căn cứ: Chưa có bằng chứng số đang sai, chỉ là lưới kiểm lỏng; người vận hành tự đối chiếu được và thêm phép đo sau khá rẻ.
  file: `app/tests/collections-khong-so-s02.test.tsx`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 4 (assert âm tính đứng một mình): đảo assert tên thị trường S02 thành phủ định hẹp `>name<` mà không có đối chứng dương (r1)**
  Người dùng thấy gì: Một bài kiểm cũ về tên thị trường S02 trong vòng thu giờ chỉ bắt được cách in hẹp. Nếu tên lọt vào trang theo dạng khác, bài kiểm đó không báo.
  Căn cứ: Chỉ là độ chặt của một bài kiểm phụ, chính trang đã được các phép đo của hợp đồng này canh; cải thiện sau không tốn nhiều.
  file: `app/tests/ops-nhan-theo-context.test.tsx`
  severity: medium
  Đề xuất: known-limits

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).

