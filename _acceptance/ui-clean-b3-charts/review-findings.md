# Review findings: ui-clean-b3-charts (round 3)

## Trong hợp đồng

Không có finding nào map được vào AC ở round này.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **b3-capture menuActions swallows a failed menu open, so before/after can match on empty data**
  Người dùng thấy gì: Nếu menu Thao tác khác không mở được khi chụp thì phép so sánh có thể báo đạt dù chưa đo gì về tải CSV và sao chép. Người dùng cuối không bị ảnh hưởng; chỉ làm kiểm tra nghiệm thu kém tin cậy ở lần chụp sau.
  Căn cứ: Chỉ ảnh hưởng công cụ kiểm tra nội bộ, không đụng người dùng; bằng chứng lần này đã đo đúng và chụp lại được nếu nghi ngờ.
  file: `scripts/ui-standards/b3-capture.mjs`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 3 (assert chuỗi có mặt trong khi lời hứa là QUAN HỆ): docs kiểm '7 → 0' và '8 → 0' bằng regex chữ cứng, không đối chiếu số đo**
  Người dùng thấy gì: Tài liệu đo có thể ghi '→ 0' dù sau này có file lại vượt 200 dòng mà kiểm tra vẫn không báo. Người dùng cuối không thấy gì; chỉ làm số liệu trong tài liệu có thể lệch dần.
  Căn cứ: Hậu quả nhẹ, chỉ ở tài liệu nội bộ, không mất dữ liệu; số hiện tại chưa bị chứng minh là sai và có thể rà lại bằng tay.
  file: `scripts/ui-standards/b3-check.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 5 (tuyên quét LỚP nhưng chỉ có điểm-case): ma trận '7 dạng literal màu' bắt mỗi dạng bằng đúng một cú pháp**
  Người dùng thấy gì: Bộ quét màu có thể bỏ sót vài cách viết màu cứng hiếm gặp, nên sau này ai đó thêm màu lẻ theo cách đó thì biểu đồ lệch bảng màu chung mà không bị báo. Hiện chưa thấy biểu đồ nào bị lệch.
  Căn cứ: Chỉ là khả năng bỏ sót trong tương lai, hiện không thấy biểu đồ nào sai màu; nếu xảy ra thì người xem chỉ thấy lệch màu, sửa rẻ.
  file: `scripts/ui-standards/b3-check.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 6 (đo nhầm checkout): b3-capture chụp URL cố định :3456 nhưng gán mã cây theo đĩa của thư mục script, không gì ràng hai bên là một cây**
  Người dùng thấy gì: Nếu máy chủ xem thử đang chạy từ bản mã khác, ảnh chụp có thể là của bản khác nhưng vẫn được ghi là của nhánh này. Người dùng cuối không bị ảnh hưởng; chỉ làm bằng chứng nghiệm thu có thể sai mà không ai hay.
  Căn cứ: Rủi ro chỉ khi chụp nhầm máy chủ, lần này ảnh cho thấy đã đo đúng; chụp lại dễ nếu nghi ngờ và không ảnh hưởng người dùng.
  file: `scripts/ui-standards/b3-capture.mjs`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 6 (gốc hardcode): b3-capture chụp server cố định localhost:3456 nhưng ghi app_src_tree của checkout chứa script (r2 · tệp đã đổi)**
  Người dùng thấy gì: Công cụ chụp ảnh nghiệm thu mặc định chụp app đang chạy ở một cổng cố định. Nếu cổng đó vô tình đang chạy bản code khác, ảnh trước và sau có thể là cùng một app mà vẫn báo là giống nhau. Lần chụp hiện tại đã có điểm khác biệt đúng chỗ nên không ảnh hưởng người dùng cuối.
  Căn cứ: Rủi ro chỉ xảy ra khi người chạy nghiệm thu bật nhầm bản app, không ảnh hưởng người dùng cuối, chạy lại là phát hiện được, và bằng chứng lần này cho thấy ảnh đã phản ánh thay đổi.
  file: `scripts/ui-standards/b3-capture.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 3 (assert chuỗi có mặt trong khi lời hứa là quan hệ giá trị): dòng '7 → 0' và '8 → 0' trong docs chỉ được grep (r2 · tệp đã đổi)**
  Người dùng thấy gì: Tài liệu đo ghi các con số trước và sau đợt dọn biểu đồ, nhưng công cụ kiểm chỉ xem chữ có xuất hiện chứ không tự tính lại. Nếu sau này ai đó sửa nhầm con số, tài liệu có thể sai mà không bị báo.
  Căn cứ: Con số hiện tại chưa bị chỉ ra là sai, chỉ là lưới kiểm lỏng; hậu quả chỉ là một dòng tài liệu nội bộ lệch, người đọc đối chiếu lại được dễ dàng.
  file: `scripts/ui-standards/b3-check.mjs`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 4 (âm tính một mình): docs bỏ qua phép so với lint:ui-report mà vẫn ĐẠT khi app/src đã đổi sau commit đo (r2 · tệp đã đổi)**
  Người dùng thấy gì: Khi mã app thay đổi sau lúc đo, công cụ kiểm tài liệu sẽ bỏ qua bước đối chiếu số liệu mà vẫn báo đạt. Tài liệu đo có thể lỗi thời mà không ai được cảnh báo.
  Căn cứ: Chỉ xảy ra về sau khi code đổi tiếp, không ảnh hưởng người dùng cuối, và lúc nghiệm thu này phép đối chiếu vẫn chạy và đạt.
  file: `scripts/ui-standards/b3-check.mjs`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 4 (assertion âm tính đứng một mình): nhánh 'còn bản riêng use-trigger-tooltip.ts/icons.tsx' không có ca đối chứng dương (r1 · tệp đã đổi)**
  Người dùng thấy gì: Thước kiểm tự động có một nhánh phụ chưa từng được thử cho thấy nó báo đỏ khi có tệp trùng bị cắm lại. Người dùng không thấy khác biệt gì; rủi ro chỉ là sau này ai đó cắm lại bản chép riêng mà nhánh phụ này không báo.
  Căn cứ: Nhẹ: hiện chưa có lỗi nào xảy ra với người dùng, nhánh dò đoạn trùng chính vẫn bắt được việc chép lại, và bổ sung ca thử sau này rẻ nên ghi lại là đủ.
  file: `scripts/ui-standards/b3-check.mjs`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 4 (assertion âm tính đứng một mình): ràng buộc 'insight-page.tsx và yield/page.tsx không đổi' không có ca đỏ, và selftest không thể phá nó (r1 · tệp đã đổi)**
  Người dùng thấy gì: Thước kiểm tự động không thể tự chứng minh nó sẽ báo đỏ nếu hai trang dùng biểu đồ bị sửa nhầm. Hiện hai trang vẫn y nguyên nên người dùng không bị ảnh hưởng gì.
  Căn cứ: Nhẹ: hai trang hiện không đổi nên người dùng không gặp gì, và nếu có sửa nhầm sau này thì lệnh so sánh với nhánh chính và buổi duyệt trước khi gộp vẫn thấy được.
  file: `scripts/ui-standards/b3-check.mjs`
  severity: low
  Đề xuất: known-limits

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
