# VHZ2 — watchdog tự khởi động lại gateway khi kênh S03 treo (thiết kế tích hợp)

Hàng `VHZ2` (`watchdog-tu-khoi-dong-gateway`), đợt `van-hanh-on-dinh-1411`, phần P1 của ROADMAP §3 mục 49 (Mạnh 14/11
«Theo khuyến nghị» cho sáu việc §7 của `docs/ops/de-xuat-van-hanh-on-dinh-1411.md`, mục 2 «Cho phép watchdog tự khởi động
lại gateway (P1) … trần 1 lần/6 giờ, chỉ khi lockdown xanh và không có lượt agent dở»). Mạnh 17/11: «Làm VHZ1 trước rồi
VHZ2» — VHZ1 đã gộp (#480, d7f6badcc).

Hàng **tích hợp nhánh làn thu**: ZCode viết trên `origin/zcode/watchdog-tu-khoi-dong-gateway` @1be76ccc6 (vòng 4;
`scripts/zalo-watchdog.sh` +55, `scripts/lib/s03-song.sh` +2, `pipeline/scripts/zalo-watchdog-vhz2.test.mjs` 8 ca skip ngoài
darwin, `pipeline/test-nua.json` +1). Nhánh hồ sơ `feat/vhz2-watchdog-tu-khoi-dong-gateway` = main d7f6badcc + merge giữ
lịch sử ZCode. Gộp main: `s03-song.sh` tự hợp (giữ cả `b-moc=` của VHZ2 lẫn `song_d_*` của VHZ1); `pipeline/test-nua.json`
xung đột một dòng — giữ cả hai tệp test.

## Vấn đề

Bộ tự khởi động lại kênh của OpenClaw treo 3/10 lần (07/11, 09/11, 13/11): kênh S03 trong tiến trình gateway đã chết, tiến
trình vẫn sống nên launchd không khởi động lại; L6(b) cảnh báo nhưng không ai hành động — 09/11 đứt 23 giờ, 13/11 đứt 34 giờ.

## Hành vi mới (mã ZCode, đã đọc)

Khối P1 là phần CUỐI `scripts/zalo-watchdog.sh` (launchd `com.oneinvest.zalo-watchdog`, 5′, chạy từ checkout chính):

1. Tới được khối P1 nghĩa là mọi lớp lockdown (L2, L3, L3b, L1, L4b, L4d) cùng lượt không vi phạm — vi phạm thì `alert()`
   tắt gateway và `exit 1` trước đó. Gateway không chạy (`pgrep -f openclaw` rỗng) → watchdog `exit 0` ngay đầu tệp, không
   lớp nào chạy, không khởi động lại (launchd của gateway lo; watchdog không hồi sinh tiến trình đã tắt).
2. `s03-song.sh` ghi `b-moc=<mốc attempt>` vào tệp trạng thái L6 khi L6(b) đỏ, xoá khi hết đỏ. Khối P1 đủ điều kiện (a) khi
   L6(b) đỏ ≥ 600 giây tính từ mốc attempt.
3. Đủ (a): nếu tệp `pipeline/logs/zalo-watchdog-p1-state` có `session=1` → cảnh báo «CẦN QUÉT QR» một lần mỗi sự cố, không
   khởi động lại. Ngược lại: lần gần nhất `lan=` trong 21600 giây → chỉ cảnh báo «quá trần»; còn lại → ghi `lan=<now>`, dòng
   alerts log, dòng sổ `pipeline/logs/zalo-watchdog-p1.log` (`… VHZ2 kickstart — lý do: L6(b) đỏ Ns; heartbeat reason=…`),
   nếu tệp trạng thái heartbeat (VHZ1) có `reason=session` thì ghi `session=1`, rồi chạy
   `launchctl kickstart -k gui/<uid>/ai.openclaw.gateway` (biến `ZALO_WATCHDOG_KICKSTART` thay được lệnh — chỉ để test).
4. Heartbeat UP (tệp trạng thái heartbeat vắng) → gỡ `session=1`.
5. Công tắc tắt: env `ZALO_WATCHDOG_P1_TAT=1` hoặc tệp `pipeline/logs/zalo-watchdog-p1-tat`.
6. Không bao giờ gọi CLI OpenClaw để đăng nhập/quét QR, không ghi `openclaw.json`.

## Lựa chọn tích hợp

- **Không sửa logic của ZCode.** Lỗi logic → báo giám sát để liên làn `MỞ LẠI`.
- **Harness nghiệm thu riêng** `scripts/watchdog-tu-khoi-dong-gateway/acceptance.mjs`, dựng trên khuôn hộp cát của
  `scripts/canh-bao-s03-ngung-thu/acceptance.mjs`: watchdog TRỌN VẸN trên bản chép (chỉ đổi đường log `/tmp` theo ngày và
  cổng :5433), HOME giả, `launchctl`/`pkill`/`pgrep`/`osascript`/`curl`/`date` là stub đứng đầu PATH
  (`<bin tạm>:/usr/bin:/bin:/usr/sbin:/sbin`), mỗi lời gọi ghi sổ. Đồng hồ giả: stub `date` trả mốc cố định cho đúng lời
  `+%s` khi lượt đặt, để biên 599/600 giây và 21599/21600 giây đo đúng biên.
- **Đo đường lệnh thật**: harness KHÔNG đặt `ZALO_WATCHDOG_KICKSTART`; lời khởi động lại đi qua `launchctl` stub và sổ phải
  có đúng chuỗi `launchctl kickstart -k gui/<uid>/ai.openclaw.gateway`. Vì vậy chốt an toàn quan trọng nhất: trước MỖI lần
  spawn, `command -v` của mọi lệnh nguy hiểm dưới env lượt phải nằm trong thư mục tạm, HOME lượt khác HOME thật — sai thì
  harness thoát 2, không spawn. Ca đỏ gỡ stub `launchctl` chứng chốt này từ chối TRƯỚC khi chạy.
- **Giao diện với VHZ1 đo đầu-cuối**: ca kiểu 13/11 dựng tệp trạng thái heartbeat bằng CHÍNH `collector/scripts/zalo-heartbeat.sh`
  (CLI giả in «Đăng nhập thất bại», hai nhịp) rồi trỏ watchdog vào tệp ấy — không viết tay khuôn VHZ2 đọc.
- **Gateway chết lặng** (giám sát 17/11): `pgrep` rỗng → `exit 0`, 0 khởi động lại, 0 cảnh báo — đúng hành vi, có ca.

## Hệ quả đã biết từ VHZ1

Status treo ghi đè `reason=session` thành `unknown` tới ~1 giờ (VHZ1 Ngoài-7). Nếu đúng lượt watchdog đủ điều kiện mà tệp
heartbeat đang `unknown`, khối P1 không ghi `session=1` → sau 6 giờ có thể khởi động lại lần nữa dù phiên đã chết. Trần
1/6 giờ chặn vòng lặp; cảnh báo L6(d) của VHZ1 vẫn bắn. Ghi giới hạn đã biết.

## Triển khai sau gộp

Watchdog chạy theo launchd 5′ từ `~/dev/onehub-invest` → có hiệu lực ở lượt kế sau `git pull --ff-only` của làn merge. Không
nạp plist mới, không khởi động lại gateway bằng tay, không build. Đây là đổi hành vi runtime: lời riêng của Mạnh 14/11 (P1)
phủ việc bật. Lùi tức thì: tạo tệp `pipeline/logs/zalo-watchdog-p1-tat` (lượt kế tắt P1); lùi mã: revert commit gộp rồi pull.
Kiểm sau: `tail -1 pipeline/logs/zalo-watchdog.log` có dòng `ok —` trong 5′; lần tự khởi động gần nhất:
`tail -1 pipeline/logs/zalo-watchdog-p1.log`. Đo thật (sau triển khai, ngoài vòng): thời gian đứt trung vị khi bộ hẹn treo
≤ 15′.

## Ngoài phạm vi

- Báo qua bộ đẩy (issue riêng tư): VH1 `canh-bao-day-toi-nguoi` (làn P3) — cảnh báo vòng này dừng ở alerts log + thông báo
  màn hình.
- Vá gốc bộ hẹn khởi động lại trong OpenClaw: VHZ3.
- Tự quét QR, đổi cấu hình OpenClaw: không bao giờ.
- Khởi động lại gateway bằng tay hay nạp plist mới trong vòng này.

## Đặc tả UX

Bỏ — hàng không chạm giao diện (sổ quyết định, dòng `descope` «bỏ đặc-tả-UX»).
