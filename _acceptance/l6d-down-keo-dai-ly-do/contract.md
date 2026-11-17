---
schema_version: 1
feature: Heartbeat S03 cảnh báo L6(d) khi DOWN từ hai nhịp liền và ghi lý do DOWN (phiên mất hiệu lực hay kênh dừng) bằng lệnh liệt kê nhóm chỉ-đọc tối đa 1 lần/giờ — tích hợp nhánh làn thu
slug: l6d-down-keo-dai-ly-do
owner: phanlemanh@gmail.com
risk_tier: T3
surfaces: [cli]
status: verified
approved_by: Mạnh
approved_at: 2026-11-17
design_doc: docs/superpowers/specs/2026-11-17-l6d-down-keo-dai-ly-do-design.md
---

# Acceptance Contract: l6d-down-keo-dai-ly-do

## Context

Hàng VHZ1 (D3 của ROADMAP §3 mục 49; Mạnh 14/11 «Theo khuyến nghị»; Mạnh 17/11 «Làm VHZ1 trước rồi VHZ2»). Sự cố 13/11:
phiên S03 mất hiệu lực 34 giờ, `channels status` vẫn in «linked» nên L6(c) mù. ZCode đã viết trên
`origin/zcode/s03-heartbeat-ly-do` @1a360fa27; vòng này tích hợp, nghiệm thu và sửa lỗi tích hợp — không sửa logic thu.
Mọi phép đo chạy heartbeat trên HOME tạm với CLI giả ghi sổ; không lượt nào chạm `~/.openclaw` thật, gateway thật hay
nhóm thật (luật 8). Soát tên nguồn lúc tích hợp: `findSourceNames(git log -p main..nhánh, sourceRegistrySeeds())` chỉ trúng
token định danh S03 đã có trên `main` (tên tệp, biến môi trường, kênh); bỏ token ấy thì 0 tên mới (giám sát đồng ý 17/11).

## Criteria

- AC-1: Given heartbeat chạy trên HOME tạm với CLI giả báo DOWN, When chạy liên tiếp nhịp 1, 2, 3, Then nhịp 1 có 0 dòng
  L6(d) trong alerts log; nhịp 2 có đúng 1 dòng và 1 thông báo màn hình; nhịp 3 không thêm dòng nào. Khi CLI chuyển UP thì
  tệp trạng thái bị xoá, và một sự cố DOWN mới sau đó lại cảnh báo đúng 1 lần ở nhịp 2 của nó. Đầu ra status UP lấy từ
  mẫu thật của máy thu (dòng tài khoản `…: enabled, configured, linked, running, connected, in:just now`, lấy 17/11 bằng
  lệnh chỉ đọc mà heartbeat vẫn chạy mỗi 15′, định danh tài khoản thay bằng `default`) được đọc là UP `accs=1/1`.
- AC-2: Given phát lại kiểu 13/11 (status in dòng tài khoản không `connected`, lệnh nhóm in cụm «Đăng nhập thất bại»),
  When heartbeat chạy hai nhịp, Then dòng log heartbeat và tệp trạng thái mang `reason=session`, L6(d) bắn, và
  `song_c_notlinked` trên cùng đầu ra status không bắn (chứng chỗ mù của L6(c) được L6(d) phủ).
- AC-3: Given phát lại kiểu 09/11 (lệnh nhóm trả đầu ra bình thường), When heartbeat chạy DOWN, Then `reason=stopped`.
  Given `channels status` hay lệnh nhóm treo quá 20 giây (kể cả khi lệnh nhóm đã in một phần đầu ra), When heartbeat chạy,
  Then nó kết thúc dưới 25 giây với `reason=unknown`, và khi status treo thì lệnh nhóm không được gọi trong nhịp đó.
  Status treo ghi đè lý do đã biết thành `unknown` (kể cả `session` của nhịp trước) — đúng mã của làn thu; ca phiên chết
  → status treo → nhịp kế trong giờ giữ `unknown` tới lần gọi lệnh nhóm kế.
- AC-4: Given DOWN kéo dài nhiều nhịp, When đếm lời gọi lệnh nhóm trong sổ CLI giả, Then lệnh nhóm chỉ được gọi khi DOWN
  (0 lần khi UP), tối đa 1 lần trong 3600 giây tính từ mốc, và được gọi lại ở nhịp đầu tiên sau khi mốc cũ hơn 3600 giây;
  nhịp không gọi mà status không treo giữ nguyên lý do của nhịp trước. Ca UP vẫn có đối chứng dương: mỗi nhịp UP có đúng
  1 lời gọi status và drift-check giả được gọi.
- AC-5: Given mọi kịch bản của AC-1…AC-4 và AC-8, When đọc sổ lời gọi CLI giả, Then mọi lời gọi thuộc đúng hai dạng cho phép
  `channels status` và `directory groups list --channel zalouser` (0 lời gọi gửi tin, đăng nhập, đăng xuất, đổi cấu hình);
  và mã `collector/scripts/zalo-heartbeat.sh` cùng `scripts/lib/s03-song.sh` không có lệnh ghi nào vào `openclaw.json` hay lời
  gọi CLI nào ngoài hai dạng ấy; bản chép chèn một lệnh ghi cấu hình hay một lời gọi CLI qua biến khác thì chốt đỏ.
- AC-6: Given harness nghiệm thu, When chạy mọi lượt, Then mỗi lượt có HOME tạm, PATH chỉ gồm thư mục giả của lượt cộng
  `/usr/bin:/bin` (`command -v openclaw` không trỏ ra ngoài thư mục tạm), và alerts log riêng của lượt; alerts log và pipe log
  thật của máy có cùng băm trước và sau cả bộ. When chạy một lượt KHÔNG đặt CLI giả, Then sổ lời gọi rỗng và chốt «CLI giả
  đã được dùng» đỏ với thông điệp ghim; harness thoát 2 trước khi chạy heartbeat nếu HOME của lượt là HOME thật hay PATH
  của lượt chứa một `openclaw` ngoài thư mục tạm.
- AC-7: Given heartbeat DOWN, When đọc tệp trạng thái, Then tệp có đúng khuôn mà watchdog VHZ2 đọc: dòng `nhip=<số>`, dòng
  `reason=<session|stopped|unknown>` khi đã biết lý do, cờ `d` sau khi đã cảnh báo; `grep -q '^reason=session'` trên tệp ấy
  đúng ở ca AC-2 và sai ở ca AC-3, kể cả ca phiên chết → status treo → nhịp kế trong giờ. Khi UP thì tệp không còn.
- AC-8: Given nhánh này, When chạy 9 ca của ZCode (`zalo-heartbeat-chan.test.mjs`), các harness L6 cũ của watchdog
  (`s03_song_lib`, `s03_song_tron`, `s03_song_bien`) và kiểm cú pháp bash của heartbeat, `s03-song.sh`, watchdog, Then tất cả
  xanh; nhánh UP vẫn gọi drift-check và silent-gate, nhánh DOWN không gọi drift-check.

## Coverage

Trục (quét hình thái, preset test-matrix):
- Nhịp DOWN: 1 · 2 · 3 · UP (mẫu status thật) · tái phát → AC-1.
- Lý do: session (13/11) · stopped (09/11) · unknown do status treo · unknown do lệnh nhóm treo, kể cả in dở · không gọi
  trong nhịp · chuyển session → status treo → nhịp kế → AC-2, AC-3, AC-4, AC-7.
- Tần suất lệnh nhóm: lần đầu · trong giờ · sau giờ · khi UP · khi status treo → AC-3, AC-4.
- An toàn luật 8: dạng lời gọi CLI cho phép/cấm · ghi cấu hình · gửi nhóm → AC-5.
- Cô lập phép đo: CLI giả · gỡ CLI giả · HOME thật · PATH có `openclaw` thật · alerts log và pipe log thật → AC-6.
- Giao diện với VHZ2: khuôn tệp trạng thái → AC-7.
- Hồi quy: 9 ca ZCode · L6 a/b/c · drift-check · silent-gate · cú pháp → AC-8.

Ô bỏ: đầu ra lệnh nhóm thật trên máy thu — ngoài phạm vi vì log không lưu đầu ra ấy và gọi lệnh thật trong phép đo trái
luật 8 (sổ quyết định, dòng mẫu «Đăng nhập thất bại»).

## Đường đo

Hàng nền vận hành: miễn con số trên màn. Lệnh đo sau triển khai: dòng heartbeat mới nhất
`grep 'heartbeat zalouser' ~/.openclaw/logs/oneinvest-zalo-pipe.log | tail -1` có mặt trong 15′ sau gộp và đúng khuôn;
lý do DOWN gần nhất `grep 'heartbeat zalouser DOWN' ~/.openclaw/logs/oneinvest-zalo-pipe.log | tail -1`.

## Out of scope

- Đẩy cảnh báo L6(d) ra ngoài máy (issue riêng tư) — VH1 `canh-bao-day-toi-nguoi`.
- Watchdog tự khởi động lại gateway theo lý do — VHZ2 `watchdog-tu-khoi-dong-gateway`, hàng kế.
- Vá gốc bộ hẹn khởi động lại trong OpenClaw — VHZ3.
- Ô trên `/ops` hiện lý do DOWN.
- Chạy heartbeat hay lệnh `openclaw` thật trong phép đo; nạp plist mới; khởi động lại gateway.

## Notes

- Triển khai: heartbeat chạy theo launchd 15′ từ checkout chính, nên có hiệu lực ở nhịp kế sau khi làn merge
  `git pull --ff-only`. Lùi = revert commit gộp rồi pull. Kiểm sau = hai lệnh ở «Đường đo».
- Soát của liên làn (LL, 17/11): @1a360fa27 là bản cuối của ZCode, vòng 4 xong 14/11 12:47Z, 9/9 ca xanh trên macOS. Lỗi tích
  hợp nền tảng: heartbeat dùng `date -j` (BSD) ở nhánh silent-gate; trên CI ubuntu lệnh rơi về `|| echo 0` nên ca D3-5 đỏ.
  Sửa ở S3 trong nhánh tích hợp: ca D3-5 skip khi không phải darwin (tiền lệ VHZ2 @1be76ccc6); script không đổi. Giới hạn đã
  biết: ca mốc giờ silent-gate chỉ đo trên máy thu.
