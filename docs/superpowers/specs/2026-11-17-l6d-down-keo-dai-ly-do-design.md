# VHZ1 — heartbeat S03 phân biệt lý do DOWN + cảnh báo L6(d) (thiết kế tích hợp)

Hàng `VHZ1` (`l6d-down-keo-dai-ly-do`), đợt `van-hanh-on-dinh-1411`, phần D3 của ROADMAP §3 mục 49 (Mạnh 14/11 «Theo
khuyến nghị» cho sáu việc §7 của `docs/ops/de-xuat-van-hanh-on-dinh-1411.md`; D3–D8 trong quyền giám sát tự xếp). Mạnh
17/11 chốt thứ tự ở phiên U2: «Làm VHZ1 trước rồi VHZ2».

Đây là hàng **tích hợp nhánh làn thu**, không phải hàng tự viết: ZCode đã viết xong trên `origin/zcode/s03-heartbeat-ly-do`
@1a360fa27 (4 commit; `collector/scripts/zalo-heartbeat.sh` +125/−14, `scripts/lib/s03-song.sh` +25,
`pipeline/scripts/zalo-heartbeat-chan.test.mjs` 9 ca, `pipeline/test-nua.json` +1). Nhánh hồ sơ
`feat/l6d-down-keo-dai-ly-do` = `main` 5508f6209 + merge giữ lịch sử ZCode (1e2af6487).

## Vấn đề

Sự cố 13/11: phiên S03 mất hiệu lực 34 giờ. `channels status` vẫn in «linked» khi tệp phiên còn trên đĩa, nên L6(c)
(tìm chữ «not linked») không bắn lần nào. Heartbeat 15′ ghi «DOWN» vào log nhưng không ai đọc, và không phân biệt
«kênh dừng» (khởi động lại gateway là đủ — kiểu 09/11) với «phiên mất hiệu lực» (phải quét QR — kiểu 13/11). VHZ2 (watchdog
tự khởi động lại gateway) cần đúng phân biệt này để không khởi động lại vô ích mỗi 6 giờ khi phiên đã chết.

## Hành vi mới (mã ZCode, đã đọc)

Heartbeat (launchd `com.oneinvest.zalo-heartbeat`, `StartInterval` 900, chạy từ checkout chính qua symlink):

1. `channels status` bọc trần 20 giây (`chay_20s`). Treo → coi là DOWN, `reason=unknown`, nhịp này KHÔNG gọi lệnh nhóm.
2. UP (mọi dòng tài khoản `connected`, khớp nguyên từ — sửa lỗi cũ «disconnected» bị đếm là connected) → xoá tệp trạng
   thái `~/.openclaw/logs/.zalo-heartbeat-down`, rồi chạy tiếp drift-check (1 lần/giờ) và silent-gate như cũ.
3. DOWN → tăng `nhip=` trong tệp trạng thái; gọi `directory groups list --channel zalouser` (chỉ đọc, trần 20 giây) tối
   đa 1 lần/giờ (mốc ở `.zalo-heartbeat-nhom-moc`). Đầu ra chứa «Đăng nhập thất bại» → `reason=session`; có đầu ra khác
   → `reason=stopped`; bị ngắt trần → `reason=unknown`; không gọi trong nhịp này → giữ lý do cũ. Ghi dòng log
   `heartbeat zalouser DOWN accs=U/T reason=<lý do>`, rồi `song_d_down_kdai`: từ nhịp 2 (≥ 30′) cảnh báo L6(d) một lần mỗi
   sự cố vào `pipeline/logs/zalo-watchdog-alerts.log` + thông báo màn hình; tự đóng khi UP.
4. Tệp trạng thái là giao diện cho VHZ2: dòng `nhip=<n>`, `reason=<session|stopped|unknown>`, cờ `d`. Watchdog VHZ2 đọc
   `^reason=session` từ đúng đường này.

## Lựa chọn tích hợp

- **Không sửa logic thu của ZCode.** Lỗi logic thì báo giám sát để liên làn `MỞ LẠI`; vòng này chỉ sửa lỗi tích hợp
  (AGENTS.md «Claude chỉ sửa code làn ZCode khi là lỗi tích hợp»).
- **Harness nghiệm thu riêng** `scripts/l6d-down-keo-dai-ly-do/acceptance.mjs` (tiền lệ `scripts/canh-bao-s03-ngung-thu/`):
  chạy heartbeat TRỌN VẸN trên HOME tạm, CLI giả ghi sổ từng lời gọi, `osascript` giả; đo những gì 9 ca ZCode chưa đo
  thành ma trận: biên nhịp 1/2/3, sổ lời gọi CLI theo danh sách cho phép, tần suất lệnh nhóm qua mốc giờ, phát lại hai
  kiểu sự cố, khuôn tệp trạng thái mà VHZ2 đọc, và đối chứng gỡ lớp giả.
- **Đối chứng gỡ lớp giả an toàn**: harness chạy thêm một lượt KHÔNG đặt `ZALO_OPENCLAW_CLI`, HOME vẫn là thư mục tạm không
  có CLI → sổ lời gọi rỗng → chốt «CLI giả đã được dùng» phải đỏ với thông điệp ghim. Không lượt nào chạy trên HOME thật hay
  `~/.openclaw` thật (`.claude/rules/zalo-safety.md`). Harness tự từ chối chạy (thoát 2) nếu HOME của lượt trỏ về HOME thật.
- **Mẫu «Đăng nhập thất bại»**: log máy thu không lưu đầu ra lệnh nhóm (grep `gateway.log`, `oneinvest-zalo-pipe.log`:
  0 dòng), và chạy lệnh thật để lấy mẫu là trái luật 8 trong phép đo. Mẫu phát lại 13/11 dùng đúng cụm chữ ghi ở
  `docs/ops/de-xuat-van-hanh-on-dinh-1411.md` §2.1 — giới hạn có tên: chữ CLI đổi (bản mới, ngôn ngữ khác) thì lý do rơi
  về `stopped`.

## Triển khai sau gộp

Heartbeat chạy theo launchd từ `~/dev/onehub-invest` (symlink `~/dev/one-invest`) → đổi script có hiệu lực ngay nhịp 15′
kế sau khi `git pull --ff-only` của làn merge. Không nạp plist mới, không khởi động lại gateway. Lùi: revert commit gộp
rồi pull (nhịp kế chạy bản cũ; tệp `.zalo-heartbeat-down` do bản mới ghi vô hại với bản cũ). Kiểm sau: dòng heartbeat mới
nhất `grep 'heartbeat zalouser' ~/.openclaw/logs/oneinvest-zalo-pipe.log | tail -1` có mặt trong 15′ và đúng khuôn
(`up accs=` hoặc `DOWN accs=… reason=…`); lý do DOWN gần nhất: `grep 'heartbeat zalouser DOWN' … | tail -1`.

## Ngoài phạm vi

- Đẩy cảnh báo L6(d) ra ngoài máy (issue riêng tư): VH1 `canh-bao-day-toi-nguoi`.
- Watchdog tự khởi động lại gateway dùng `reason`: VHZ2, hàng kế.
- Vá gốc bộ hẹn khởi động lại trong OpenClaw: VHZ3.
- Ô trên `/ops` hiện lý do DOWN.

## Đặc tả UX

Bỏ — hàng không chạm giao diện (sổ quyết định, dòng `descope` «bỏ đặc-tả-UX»).
