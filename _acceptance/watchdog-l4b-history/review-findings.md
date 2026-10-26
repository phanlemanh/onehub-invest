# Review findings: watchdog-l4b-history (round 1)

Soát diff `git diff origin/main...HEAD -- scripts/zalo-watchdog.sh` (+21 dòng, một khối `if [ "$mode" = "history" ]` trong
`scan_new_lines`), cộng thăm dò riêng trong sandbox (bản chép bộ canh, HOME giả, stub đứng đầu PATH, cùng `makeSandbox` của
harness; hàm trích ra cho ca đường dẫn có «:»). Không chạy bộ canh thật, không chạm runtime OpenClaw. PID gateway thật giữ
nguyên trước và sau mọi lượt chạy.

## Trong hợp đồng

(không có finding nào làm một AC thất bại — 9/9 eval đạt)

Đối chiếu từng điểm người giao yêu cầu soát:

- **Cửa sổ bỏ sót sau xoay thật — đúng như khai.** Turn ghi vào gateway.log MỚI trước lượt quét đầu sau xoay không bị bắt.
  Turn ghi sau lượt đó thì bị bắt. Độ dài tệp mới không quan trọng: tệp mới 11 dòng, dài hơn marker 3 dòng, vẫn bỏ sót, vì
  khác inode là đi thẳng nhánh khởi tạo lại. Độ dài cửa sổ: từ lúc xoay tới lượt chạy kế của bộ canh. Chu kỳ launchd là
  `StartInterval` 300 s (`pipeline/cron/com.oneinvest.zalo-watchdog.plist`), nên cửa sổ ≤ 300 s, khớp «≤ một chu kỳ 5′».
  Khi gateway không chạy, bộ canh thoát sớm (`pgrep` không thấy) và cửa sổ chưa mở, vì không có turn nào. Trên main, turn
  trong cửa sổ này BỊ BẮT (baseline xoay-that in «BỊ BẮT»). Đây là đánh đổi có ý thức, đã khai ở Out of scope.
  - Lớp bù: log /tmp theo ngày vẫn được quét ở chế độ `daily`. Ca rotate của `watchdog-l4b-cuoi-ngay` cho thấy turn ở log
    đó bị bắt. Hợp đồng gọi lớp này là «L4a». Trong mã, L4a là bộ đếm «drop no mention»; quét /tmp là «L4b trên log /tmp».
    Lệch tên, không lệch hành vi.
- **Có nhánh làm bộ canh MÙ hẳn không?** Với đường dẫn thật thì không. Mọi nhánh khởi tạo lại đều ghi marker về
  `đường_dẫn:inode:số_dòng` hiện tại, nên lượt kế đi nhánh append và bắt turn mới. Đã thử: P1–P4, marker rỗng, marker nhiều
  dòng, CRLF, khoảng trắng, số có 0 ở đầu, số quá lớn, gateway.log biến mất rồi xuất hiện lại, copytruncate. Ca nào turn MỚI
  sau đó cũng bị bắt (KILL qua stub). Ngoại lệ duy nhất là đường dẫn chứa «:», ghi ở mục «Ngoài hợp đồng».
- **WARN có spam mỗi chu kỳ không?** Không. Sau P3 (inode mới), thêm 4 chu kỳ append: tổng số dòng WARN L4b lần lượt là
  1, 1, 1, 1. Mỗi lần xoay hay marker hỏng chỉ sinh một WARN.
- **Marker hỏng kiểu khác:**

  | Marker | WARN L4b | Tắt nhầm vì lịch sử | Turn mới sau đó |
  |---|---|---|---|
  | rỗng | không (nhánh khởi tạo lần đầu, im lặng) | không | bị bắt |
  | nhiều dòng | có | không | bị bắt |
  | CRLF | có | không | bị bắt |
  | khoảng trắng | có | không | bị bắt |
  | số `08` | có | không | bị bắt |
  | số quá lớn | không, có lỗi so sánh ra stderr | không | bị bắt |

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa.

- **Kiểm «có dòng WARN» của harness tự đạt nhờ cảnh báo cơ sở dữ liệu, không chứng minh WARN của bản sửa**
  Người dùng thấy gì: Không ai thấy gì khác ở sản phẩm. Riêng bằng chứng tự động cho ý «có WARN» ở AC-1..AC-4 yếu hơn vẻ ngoài: sandbox luôn trỏ cơ sở dữ liệu vào một cổng đóng, nên lượt nào không tắt cũng ghi một cảnh báo «Postgres không nghe», và kiểm chỉ đếm số dòng WARN. Người chấm đã đo riêng: cả bốn ca P1–P4 đều có đúng một dòng WARN của bản sửa, nên tiêu chí vẫn đạt.
  Căn cứ: Không mất hay lộ dữ liệu, sản phẩm không đổi. Nếu không sửa, một lần sửa sau có thể làm mất cảnh báo thật mà kiểm vẫn xanh, và người vận hành sẽ không biết bộ canh vừa khởi tạo lại. Sửa rẻ: chỉ cần lọc đúng dòng cảnh báo của bộ canh.
  file: `scripts/watchdog-l4b-history/acceptance.mjs`
  severity: low
  Đề xuất: known-limits — đã đo bù trong vòng này. Lần sau động tới harness thì lọc theo nội dung WARN L4b.
- **Đường dẫn log gateway chứa dấu hai chấm làm bộ canh mù hẳn với log đó và ghi cảnh báo mỗi chu kỳ**
  Người dùng thấy gì: Nếu thư mục người dùng có dấu «:», bộ canh coi log gateway là «tệp mới» ở mọi chu kỳ. Nó khởi tạo lại, ghi một dòng cảnh báo mỗi 5 phút và không bao giờ bắt được turn mới trong log đó. Trên main, cùng tình huống làm bộ canh tắt gateway mỗi chu kỳ. Máy này không có dấu «:» trong thư mục người dùng, nên hiện không xảy ra.
  Căn cứ: Hướng hỏng đổi từ «tắt nhầm» sang «mù im lặng», mà mù là hướng nguy hiểm với an toàn Zalo. Nhưng điều kiện kích hoạt gần như không có thật trên macOS, log /tmp theo ngày vẫn được canh, và chuỗi cảnh báo lặp lại đủ lộ để người vận hành nhận ra.
  file: `scripts/zalo-watchdog.sh`
  severity: low
  Đề xuất: known-limits

## Known limits

- Cửa sổ bỏ sót sau xoay thật (≤ 300 s, chu kỳ launchd) — đã khai ở Out of scope; đo đúng như khai. Lớp bù là quét log /tmp
  theo ngày.
- Copytruncate (cùng inode) rồi ghi NHIỀU dòng hơn marker cũ trước lượt quét kế: nhánh append quét từ dòng `marker+1`, nên bỏ
  sót các dòng đầu. Đã thử: marker 3 dòng, sau truncate ghi 6 dòng, turn ở dòng 3, không bị bắt. Hành vi này có sẵn trên
  main, bản sửa không gây ra, và cùng loại với cửa sổ xoay đã khai.
- Marker số quá lớn (vượt số nguyên của bash) bị khởi tạo lại im lặng, không WARN, và in một lỗi so sánh ra stderr của lượt
  chạy. An toàn (không tắt nhầm, turn sau đó bị bắt), chỉ thiếu WARN.
- Marker rỗng được khởi tạo lại im lặng, đúng thiết kế của nhánh «lần đầu».
- Phép thử chạy với `stat -f '%i'` (BSD/macOS), như bộ canh thật.
