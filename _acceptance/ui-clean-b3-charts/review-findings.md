# Review findings: ui-clean-b3-charts (round 2)

## Trong hợp đồng

- **b3-capture đọc tooltip theo cả trang (.first()), nên phép rê chuột trên khung Cơ cấu doanh thu luôn ghi chuỗi rỗng và kiểm tra structure (AC-8) đạt dù không đo gì**
  file: `scripts/ui-standards/b3-capture.mjs:106`
  severity: medium
  AC: AC-8
  source: bugs
  detail: `tooltipText(page)` lấy `page.locator(".recharts-tooltip-wrapper").first()` trên toàn trang, không giới hạn trong khung đang thao tác. Trang /vn/hanoi và /vn/hanoi/hoan-kiem có hai biểu đồ Recharts. Biểu đồ Hiệu suất đứng trước, nên wrapper đầu tiên luôn là của nó. Khi `interact()` rê chuột lên donut Cơ cấu doanh thu (MixDonut có ChartTooltip), script lại đọc wrapper của biểu đồ Hiệu suất. Wrapper này đang ẩn vì chuột đã rời khỏi biểu đồ đó (`page.mouse.move(0, 0)`), nên kết quả là "". Đã xác nhận trong evidence: `interactions["market/Cơ cấu doanh thu"].hover` và `interactions["ward/Cơ cấu doanh thu"].hover` đều là "" ở cả before/snapshot.json lẫn after/snapshot.json. Vì vậy `b3-check.mjs structure` so khớp "" với "" và báo ĐẠT, dù hợp đồng (contract.md dòng 64, evals.yaml dòng 75) yêu cầu so tooltip ở cả ba khung. Một hồi quy trong tooltip lát donut sẽ không bị phát hiện. Cách sửa: tìm tooltip trong chính khung, ví dụ `frame.locator(".recharts-tooltip-wrapper")`. Sau đó kiểm tra rằng tooltip không rỗng sau khi rê. Nếu rỗng thì báo lỗi, không nuốt kết quả rỗng.

- **Hình dạng 5 (tuyên quét LỚP nhưng ma trận rút từ parse, không viết trước) + hình dạng 4: khoá palette lệch khuôn bị rơi im lặng khỏi contrast/data-color, palette.ts được miễn quét --chart-***
  file: `scripts/ui-standards/b3-check.mjs:73`
  severity: medium
  AC: AC-1
  source: measurement
  detail: E2 hứa 'mọi khoá ngoài {expenses, share3, rest, hatch} ≥ 3:1' và E3 hứa 'mỗi khoá của palette.ts có một dòng bảng', nhưng tập khoá không phải ma trận viết trước. Nó rút từ paletteKeys(), và dòng 73 `if (!light || !dark) continue;` bỏ im lặng mọi khoá có light/dark không khớp `var(--color-[a-z]+-\d+)`. Không assert nào kiểm số khoá đọc được bằng danh sách khoá kỳ vọng; chỉ có EXEMPT được so ở dòng 159. Thêm vào đó, dòng 86 `if (file === PALETTE) continue;` bỏ palette.ts khỏi cả phép quét LITERALS lẫn phép quét `--chart-` ở dòng 89. Thử trên bản sao (--root là thư mục scratchpad): đổi `revenue.light` trong palette.ts thành `"var(--chart-1)"` thì palette ĐẠT, contrast ĐẠT, data-color ĐẠT, trong khi AC-1 hứa 0 --chart-* và AC-2/3 hứa phủ mọi khoá. Selftest không có ca phá nào nhắm vào khuôn khoá trong palette.ts nên không lộ lỗ này.

- **Hình dạng 4 (assertion âm tính một mình): khoá thiếu swatch được cho qua im lặng ở contrast**
  file: `scripts/ui-standards/b3-check.mjs:170`
  severity: low
  AC: AC-2
  source: measurement
  detail: E2 hứa 'lớp chấm của mỗi khoá chứa đúng bg-<sáng> và dark:bg-<tối>', nhưng dòng 170 `if (v.swatch !== null && v.swatch !== ...)` chỉ báo khi swatch có mặt mà sai; swatch vắng thì không báo gì. Danh sách khoá được phép không có chấm (chỉ `rest`) không được ghim. Thử trên bản sao: xoá `swatch` của `margin` trong palette.ts thì contrast vẫn ĐẠT. Selftest chỉ có ca đổi bậc swatch occupancy (dòng 407), không có ca swatch vắng.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Hình dạng 6 (gốc hardcode): b3-capture chụp server cố định localhost:3456 nhưng ghi app_src_tree của checkout chứa script**
  Người dùng thấy gì: Công cụ chụp ảnh nghiệm thu mặc định chụp app đang chạy ở một cổng cố định. Nếu cổng đó vô tình đang chạy bản code khác, ảnh trước và sau có thể là cùng một app mà vẫn báo là giống nhau. Lần chụp hiện tại đã có điểm khác biệt đúng chỗ nên không ảnh hưởng người dùng cuối.
  Căn cứ: Rủi ro chỉ xảy ra khi người chạy nghiệm thu bật nhầm bản app, không ảnh hưởng người dùng cuối, chạy lại là phát hiện được, và bằng chứng lần này cho thấy ảnh đã phản ánh thay đổi.
  file: `scripts/ui-standards/b3-capture.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 3 (assert chuỗi có mặt trong khi lời hứa là quan hệ giá trị): dòng '7 → 0' và '8 → 0' trong docs chỉ được grep**
  Người dùng thấy gì: Tài liệu đo ghi các con số trước và sau đợt dọn biểu đồ, nhưng công cụ kiểm chỉ xem chữ có xuất hiện chứ không tự tính lại. Nếu sau này ai đó sửa nhầm con số, tài liệu có thể sai mà không bị báo.
  Căn cứ: Con số hiện tại chưa bị chỉ ra là sai, chỉ là lưới kiểm lỏng; hậu quả chỉ là một dòng tài liệu nội bộ lệch, người đọc đối chiếu lại được dễ dàng.
  file: `scripts/ui-standards/b3-check.mjs`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 4 (âm tính một mình): docs bỏ qua phép so với lint:ui-report mà vẫn ĐẠT khi app/src đã đổi sau commit đo**
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
