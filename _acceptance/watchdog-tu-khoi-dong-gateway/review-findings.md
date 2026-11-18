# Review findings: watchdog-tu-khoi-dong-gateway (round 1)

## Trong hợp đồng

Không có finding nào map được vào AC.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Cờ p1-qr không bao giờ được gỡ nên sự cố phiên chết lần sau không có cảnh báo «CẦN QUÉT QR»**
  Người dùng thấy gì: Sau lần phiên Zalo chết đầu tiên, nếu về sau phiên lại chết thì hệ thống không còn nhắc «cần quét QR». Kênh S03 có thể im lặng đúng lúc cần người can thiệp.
  Căn cứ: Hậu quả nặng vì kênh thu dữ liệu có thể đứt lâu mà không ai biết, nhưng không mất dữ liệu và chỉ xảy ra từ sự cố phiên chết thứ hai trở đi.
  file: `scripts/zalo-watchdog.sh`
  severity: high
  Đề xuất: new-contract

- **Dòng WARN «quá trần 1 lần/6 giờ» ghi lặp ở mọi lượt, không theo khuôn báo một lần**
  Người dùng thấy gì: Khi kênh vẫn treo sau lần tự khởi động lại, nhật ký cảnh báo bị đổ thêm hàng chục dòng giống nhau trong 6 giờ. Chỉ gây nhiễu khi đọc nhật ký.
  Căn cứ: Hậu quả nhẹ, chỉ làm nhật ký dài và ồn, không mất dữ liệu hay bỏ sót cảnh báo, sửa lúc nào cũng được.
  file: `scripts/zalo-watchdog.sh`
  severity: low
  Đề xuất: known-limits

- **Dùng sed -i '' (chỉ chạy trên BSD) thay cho cách gỡ dòng di động mà tệp đã có**
  Người dùng thấy gì: Trên máy không phải macOS, một mốc thời gian cũ không được xoá nên một ca kiểm tự động phải bỏ qua. Trên máy thu thật (macOS) không ảnh hưởng.
  Căn cứ: Không ảnh hưởng người dùng vì chỉ chạy trên Mac; chỉ giảm độ phủ kiểm thử trên CI, sửa sau rẻ.
  file: `scripts/lib/s03-song.sh`
  severity: low
  Đề xuất: known-limits

- **Ngưỡng «L6(b) đỏ ≥10′» thực ra đo từ mốc attempt, không đo từ lúc L6(b) bắt đầu đỏ**
  Người dùng thấy gì: Hệ thống tự khởi động lại gateway sau khoảng 8 phút đỏ thật thay vì đúng 10 phút như chú thích. Kênh được cứu sớm hơn chút.
  Căn cứ: Lệch nhỏ, không gây hại, còn có lợi là cứu kênh sớm hơn; chỉ cần sửa chữ ghi chú.
  file: `scripts/lib/s03-song.sh`
  severity: low
  Đề xuất: known-limits

- **Cờ p1-qr không bao giờ bị gỡ, nên sự cố phiên chết lần sau không còn cảnh báo «cần QR»**
  Người dùng thấy gì: Sau lần phiên Zalo chết đầu tiên, các lần chết sau không còn được báo «cần quét QR». Người vận hành không biết phải quét lại.
  Căn cứ: Kênh im lặng đúng ca cần người can thiệp nên nặng, nhưng chỉ từ sự cố thứ hai và không mất dữ liệu đã thu.
  file: `scripts/zalo-watchdog.sh`
  severity: high
  Đề xuất: new-contract

- **b-moc không bị xoá ở hai nhánh return sớm của song_b_restart, mốc cũ có thể làm kickstart một gateway đang khoẻ**
  Người dùng thấy gì: Trong ca hiếm khi nhật ký gateway bị cắt, hệ thống có thể khởi động lại gateway đang khoẻ, tối đa 6 giờ một lần. Có thể làm gián đoạn ngắn việc thu.
  Căn cứ: Hiếm gặp và có trần 6 giờ một lần, gián đoạn ngắn tự hồi, nhưng khởi động lại nhầm trên máy thu thật nên đáng sửa.
  file: `scripts/lib/s03-song.sh`
  severity: medium
  Đề xuất: new-contract

- **Lỗi launchctl kickstart bị nuốt, trong khi sổ và alerts log vẫn ghi đã kickstart và trần 6 giờ vẫn bị tiêu**
  Người dùng thấy gì: Nếu lệnh khởi động lại thất bại, nhật ký vẫn ghi là đã khởi động và phải chờ 6 giờ mới thử lại. Kênh có thể treo nhiều giờ mà không ai hay.
  Căn cứ: Đúng kiểu treo nhiều giờ mà tính năng sinh ra để chặn, nhưng chỉ xảy ra khi lệnh hệ thống lỗi, hiếm.
  file: `scripts/zalo-watchdog.sh`
  severity: medium
  Đề xuất: new-contract

- **Cờ session=1 (không thử lại) đặt theo reason của heartbeat TRƯỚC khi kick, không phải sau**
  Người dùng thấy gì: Có thể báo «cần quét QR» hoặc ngừng thử lại sớm hơn thực tế, dù phiên đã hồi sau lần khởi động lại.
  Căn cứ: Hậu quả là cảnh báo thừa, không mất dữ liệu, người vận hành kiểm lại là rõ; hành vi khớp hợp đồng đã duyệt.
  file: `scripts/zalo-watchdog.sh`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 4 (chỉ có assert âm, không có đối chứng dương): MUOI-LUOT dùng chốt `<= 1` nên 0 lời kickstart vẫn PASS**
  Người dùng thấy gì: Bài kiểm tự động có thể vẫn xanh dù hệ thống không khởi động lại gateway lần nào. Người dùng không thấy trực tiếp.
  Căn cứ: Chỉ là độ chặt của bài kiểm, các ca khác đã đo đường kick dương; không ảnh hưởng vận hành.
  file: `scripts/watchdog-tu-khoi-dong-gateway/acceptance.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 4 (chỉ có assert âm, không có đối chứng dương): VHZ2-5 «công tắc tắt → 0 kickstart» bỏ qua mã thoát và không gỡ công tắc để đối chứng**
  Người dùng thấy gì: Một bài kiểm của làn thu có thể xanh vì lý do khác ngoài công tắc tắt. Không ảnh hưởng người dùng trực tiếp.
  Căn cứ: Bài kiểm khác của hồ sơ đã có đối chứng, nên rủi ro thật thấp; sửa sau rẻ.
  file: `pipeline/scripts/zalo-watchdog-vhz2.test.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 4 (chỉ có assert âm): «CA ĐỎ VHZ2: gỡ điều kiện (a)» không gỡ gì cả, không kiểm lượt cuối tới được P1**
  Người dùng thấy gì: Một ca kiểm mang tên «ca đỏ» thực ra không chứng minh được điều nó nói. Người dùng không thấy ảnh hưởng.
  Căn cứ: Chỉ giảm độ tin của một bài kiểm phụ, ngưỡng thời gian vẫn được đo ở chỗ khác; không ảnh hưởng vận hành.
  file: `pipeline/scripts/zalo-watchdog-vhz2.test.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 4 (không ghim thông điệp): VHZ2-4 đo «0 kick khi L4d có lượt dở» nhưng không chứng minh chính L4d là lớp đã chặn**
  Người dùng thấy gì: Một bài kiểm có thể xanh dù lớp chặn khi agent đang chạy dở không phải là lớp thực sự chặn. Người dùng không thấy ảnh hưởng.
  Căn cứ: Chỉ là độ chặt bài kiểm phụ, đường chặn này đã có bài kiểm chính; sửa sau rẻ.
  file: `pipeline/scripts/zalo-watchdog-vhz2.test.mjs`
  severity: low
  Đề xuất: known-limits

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).

## Đã dựng lại trên hộp cát — chờ làn thu sửa (MỞ LẠI qua LL)

Lệnh dựng lại: `node scripts/watchdog-tu-khoi-dong-gateway/acceptance.mjs mo-lai` (đỏ sẵn trên @1be76ccc6, thoát 1, `MO LAI FAIL 0/3`).

| Ca | Mục | Số đo trên mã hiện tại | Cần |
|---|---|---|---|
| `QR-LAN-2` | Ngoài-1, Ngoài-5 | 1 dòng «CẦN QUÉT QR» sau hai sự cố phiên chết | 2 |
| `LOG-CAT-KHONG-KICK` | Ngoài-6 | 1 lời kickstart trên gateway khoẻ khi gateway.log bị cắt; `b-moc` còn lại | 0 lời, `b-moc` đã gỡ |
| `KICK-THAT-BAI` | Ngoài-7 | Lệnh kickstart thoát 5: 0 dòng cảnh báo thất bại, lượt kế không gọi lại (tổng 1) | có cảnh báo, tổng 2 |
