# Review findings: s03-tai-bu-anh-bai-cu (round 2)

## Trong hợp đồng

- **Hình dạng 2 — fixture viết tay: ca DB «(1) nạp lại raw … giữ ảnh đã bù» không có snapshot bù thật và không gọi sapXepReplay**
  file: `pipeline/backfill-s03-media-2511.test.mjs:441`
  severity: medium
  AC: AC-1
  source: measurement
  detail: AC-1 hứa rằng sau khi `sapXepReplay` xếp, bộ nạp nạp lại raw theo đúng thứ tự đó trên DB trống thì bản bù vào sau chót và bài giữ được ảnh đã bù. E1 và kiem.sh (1) dựa vào ca «(1) nạp lại raw theo thứ tự tên vẫn giữ ảnh đã bù». Ca này có ba chỗ lệch với lời hứa: (a) manifest viết tay qua `viet()` với `coverage: {}` (dòng 430), không có `loai: tai-bu-anh-2511` và không do ghiSnapshotBuu ghi ra; (b) bản bù được đặt tên `2026-11-25T100000000` (dòng 441), nên theo thứ tự tên nó vốn đã đứng sau bản gốc `21T190000000`, khác các tên bù thật (`2026-11-21T143738670` …) vốn đứng TRƯỚC bản gốc cùng ngày; (c) vòng nạp ở dòng 452 gọi thẳng `napor(goc), napor(buu)` mà không đi qua sapXepReplay. Kết quả là ca vẫn xanh kể cả khi sapXepReplay bị xoá hay giữ nguyên thứ tự. Đột biến 5b chỉ làm đỏ ca đơn vị không có DB. Vì vậy chưa có phép đo nào nối «sapXepReplay xếp → import-airbnb nạp → stg giữ ảnh bù» trên kịch bản tên thật mà AC-1 mô tả.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Replay từ state 0 không chịu được trần nạp: lượt bị cắt thì lượt sau về thứ tự tên và ảnh đã bù bị đè**
  Người dùng thấy gì: Nếu lượt nạp lại toàn bộ bị ngắt giữa chừng vì quá thời gian, các lượt sau có thể nạp sai thứ tự và ghi đè ảnh đã bù của khoảng 695 bài cũ.
  Căn cứ: Có thể mất ảnh đã bù của nhiều bài mà không báo, nhưng chỉ xảy ra khi nạp lại toàn bộ và lượt đó bị ngắt; sửa cần đổi cách giữ trạng thái nên đáng làm thành việc riêng.
  file: `scripts/zalo-import-daily.sh`
  severity: high
  Đề xuất: new-contract

- **Cờ --kho chỉ áp cho phần đọc; bước nạp con vẫn ghi vào DATABASE_URL của môi trường**
  Người dùng thấy gì: Khi chạy tải bù với một kho dữ liệu thử, phần ghi vẫn có thể rơi vào kho chung của máy, nên dữ liệu thử lẫn vào dữ liệu thật.
  Căn cứ: Chỉ xảy ra khi người chạy chỉ định kho riêng trong lúc môi trường đã trỏ kho chung; ghi chú cho người vận hành là đủ, dữ liệu thử dọn được.
  file: `pipeline/backfill-s03-media-2511.mjs`
  severity: medium
  Đề xuất: known-limits

- **Test (1) nạp và xoá trên bất kỳ DATABASE_URL nào, không dùng chốt chặn db-thu-chot có sẵn, và không nằm trong npm test của pipeline**
  Người dùng thấy gì: Chạy thử bộ kiểm này trong một cửa sổ lệnh đang trỏ vào kho dữ liệu thật có thể ghi và xoá dòng trong kho đó. Bộ kiểm này cũng không chạy trong kiểm tra tự động thường kỳ.
  Căn cứ: Rủi ro chỉ có khi chạy tay sai môi trường; dữ liệu thử là bài giả, nhưng có thể lẫn vào kho thật và phải dọn tay.
  file: `pipeline/backfill-s03-media-2511.test.mjs`
  severity: medium
  Đề xuất: known-limits

- **Replay từ state 0 bị ngắt giữa chừng (trần 1800s, nạp lỗi, manifest chưa xong) thì snapshot bù đã hoãn bị bỏ vĩnh viễn**
  Người dùng thấy gì: Nếu việc nạp lại toàn bộ bị dừng giữa chừng, các lô ảnh bù chưa nạp có thể bị bỏ qua vĩnh viễn, làm mất ảnh của khoảng 695 bài cũ mà không báo.
  Căn cứ: Mất ảnh âm thầm và không tự phục hồi, nhưng chỉ khi nạp lại toàn bộ bị ngắt; sửa chung hướng với lỗi nạp lại bị cắt nên gộp vào một việc riêng.
  file: `scripts/zalo-import-daily.sh`
  severity: high
  Đề xuất: new-contract

- **Nạp snapshot bù lỗi bị nuốt, kèm lời hứa sai «hàng đợi sẽ nạp lại»**
  Người dùng thấy gì: Khi bước nạp lô ảnh bù bị lỗi, công cụ vẫn báo thành công, và lô đó có thể nằm trên đĩa mà không bao giờ vào kho dữ liệu.
  Căn cứ: Lô ảnh bù tốn nhiều giờ tải có thể mất tác dụng mà không ai biết; người vận hành nạp lại tay được nếu biết, nên cần việc riêng để báo lỗi rõ.
  file: `pipeline/backfill-s03-media-2511.mjs`
  severity: medium
  Đề xuất: new-contract

- **Giá trị mặc định của --den lấy theo ngày UTC: chạy lúc 00:00–07:00 giờ VN thì bỏ sót bài đăng hôm nay**
  Người dùng thấy gì: Nếu chạy tải bù trong khoảng 0 đến 7 giờ sáng giờ Việt Nam mà không chỉ định ngày kết thúc, các bài đăng hôm nay bị bỏ sót.
  Căn cứ: Tác động nhẹ: chỉ bỏ sót bài trong ngày, chạy lại hoặc chỉ định ngày là có đủ.
  file: `pipeline/backfill-s03-media-2511.mjs`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 2 — fixture viết tay đúng khuôn bên đọc: khoá coverage.loai không được đo khứ hồi từ ghiSnapshotBuu sang sapXepReplay**
  Người dùng thấy gì: Nếu tên nhãn nhận diện lô ảnh bù bị đổi ở một phía, các kiểm thử vẫn xanh nhưng lô bù thật sẽ bị nạp sai thứ tự và ảnh bù bị ghi đè.
  Căn cứ: Hiện hai phía khớp nhau nên chưa gây hại; rủi ro chỉ xuất hiện khi ai đó đổi nhãn sau này, và bổ sung một phép kiểm là rẻ.
  file: `pipeline/backfill-s03-media-2511.test.mjs`
  severity: medium
  Đề xuất: known-limits

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
