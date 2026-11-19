---
schema_version: 1
feature: Watchdog tự khởi động lại gateway OpenClaw một lần khi kênh S03 treo (L6(b) đỏ ≥10′, lockdown xanh, không lượt agent dở; trần 1 lần mỗi 6 giờ; phiên chết thì báo cần QR) — tích hợp nhánh làn thu
slug: watchdog-tu-khoi-dong-gateway
owner: phanlemanh@gmail.com
risk_tier: T3
surfaces: [cli]
status: verified
approved_by: Mạnh
approved_at: 2026-11-18
design_doc: docs/superpowers/specs/2026-11-18-watchdog-tu-khoi-dong-gateway-design.md
---

# Acceptance Contract: watchdog-tu-khoi-dong-gateway

## Context

Hàng VHZ2 (P1 của ROADMAP §3 mục 49; Mạnh 14/11 «Theo khuyến nghị» — cho phép watchdog tự khởi động lại gateway, trần
1 lần/6 giờ, chỉ khi lockdown xanh và không lượt agent dở, không bao giờ tự quét QR, không đổi cấu hình; Mạnh 17/11 «Làm VHZ1
trước rồi VHZ2»). ZCode đã viết trên `origin/zcode/watchdog-tu-khoi-dong-gateway` @1be76ccc6; vòng này tích hợp, nghiệm thu,
sửa lỗi tích hợp — không sửa logic thu. Mọi phép đo chạy watchdog trên bản chép trong thư mục tạm, HOME giả, lệnh nguy hiểm
là stub ghi sổ; không lượt nào chạm `~/.openclaw` thật, gateway thật, launchd thật (luật 8). Soát tên nguồn lúc tích hợp:
`findSourceNames(git log -p origin/main..nhánh, sourceRegistrySeeds())` 105 chỗ trúng, tất cả là token định danh S03 đã có trên
`main` (tên tệp, biến môi trường, kênh); bỏ token ấy thì 0 tên mới.

## Criteria

- AC-1: Given watchdog chạy trên hộp cát với gateway.log có dòng auto-restart attempt không có «starting provider» sau nó,
  mọi lớp lockdown xanh, L4d sạch, tệp trạng thái heartbeat `reason=stopped` (kiểu 09/11), When L6(b) đã đỏ 600 giây tính
  từ mốc attempt (đồng hồ giả), Then sổ stub có đúng 1 lời `launchctl kickstart -k gui/<uid>/ai.openclaw.gateway` (đường lệnh
  mặc định, không qua biến thay lệnh), alerts log có 1 dòng `VHZ2: kickstart gateway`, sổ `zalo-watchdog-p1.log` có 1 dòng, và
  0 lời `launchctl bootout` / `pkill`. Khi đã đỏ 599 giây Then 0 lời kickstart.
- AC-2: Given đã khởi động lại một lần ở mốc T và kênh vẫn đỏ, When watchdog chạy ở T+21599 giây, Then 0 lời kickstart và
  alerts log có dòng «quá trần 1 lần/6 giờ»; When chạy ở T+21600 giây Then đúng 1 lời kickstart mới (tổng 2). Mười lượt liền
  trong cùng 6 giờ không bao giờ quá 1 lời kickstart.
- AC-3: Given tệp trạng thái heartbeat do CHÍNH `collector/scripts/zalo-heartbeat.sh` sinh (CLI giả, hai nhịp DOWN, lệnh nhóm
  in «Đăng nhập thất bại» → `reason=session`, kiểu 13/11), When watchdog đủ điều kiện lần đầu, Then đúng 1 lời kickstart và
  `zalo-watchdog-p1-state` có `session=1`; When các lượt kế vẫn đủ điều kiện (kể cả sau 6 giờ), Then 0 lời kickstart thêm và
  alerts log có đúng 1 dòng «CẦN QUÉT QR» (không lặp); When heartbeat UP (tệp trạng thái vắng) Then `session=1` bị gỡ.
  Given tệp heartbeat do `zalo-heartbeat.sh` sinh mang `reason=unknown` (phiên chết + status treo, VHZ1 Ngoài-7), When watchdog
  đủ điều kiện liên tiếp qua ba mốc 6 giờ, Then mỗi mốc đúng 1 lời kickstart (tổng 3), 0 dòng «CẦN QUÉT QR» — hành vi đúng mã
  làn thu, chấp nhận hay không do Mạnh quyết ở Hỏi-1.
- AC-4: Given L6(b) đủ điều kiện nhưng một lớp lockdown đỏ — L2 (`bindings` khác rỗng), L3b (một nhóm `requireMention`
  false), L1 (handler có API gửi tin) — hoặc L4d thấy lượt agent dở, When watchdog chạy, Then 0 lời kickstart, alerts log có
  dòng `KILL:` của lớp ấy, và lời `launchctl bootout` / `pkill` của `alert()` chỉ rơi vào stub.
- AC-5: Given gateway không chạy (stub `pgrep` không thấy `openclaw`) dù mọi điều kiện khác đủ, When watchdog chạy, Then
  watchdog thoát 0, 0 lời kickstart, 0 dòng alerts log mới, 0 dòng `zalo-watchdog.log` mới — hành vi có sẵn trên `main`
  (dòng `pgrep -f openclaw … || exit 0`), VHZ2 không đổi; P1 chỉ cứu kênh treo trong tiến trình còn sống.
- AC-6: Given mọi kịch bản AC-1…AC-5 và AC-8, When đọc sổ stub và băm `openclaw.json` của HOME giả trước/sau, Then
  `openclaw.json` cùng băm sau mọi lượt; sổ CLI OpenClaw giả có ít nhất 1 lời `status` ở mọi lượt tới được L6 (đối chứng
  dương) và không lời nào ngoài `status`; lời `launchctl` chỉ thuộc hai dạng
  `kickstart -k gui/<uid>/ai.openclaw.gateway` và `bootout gui/<uid>/ai.openclaw.gateway` (của `alert()`); và quét tĩnh khối
  P1 (mốc «VHZ2 (P1» có đúng 1 lần; vùng từ mốc tới hết tệp chứa lời `launchctl kickstart`; cộng thân mọi hàm mà vùng ấy gọi,
  định nghĩa trong watchdog hay `s03-song.sh`) không có lời CLI OpenClaw, không ghi `openclaw.json`, không lệnh đăng nhập hay
  QR, không `eval`/`bash -c` nào ngoài lời chạy `$KICK_CMD`; bản chép chèn một lời như vậy (thẳng vào khối, qua hàm helper đặt
  trên mốc, qua `eval` chuỗi) hay đổi chữ mốc thì chốt đỏ.
- AC-7: Given harness, When chạy mọi lượt, Then mỗi lượt có HOME tạm, PATH = thư mục stub của lượt + `/usr/bin:/bin:/usr/sbin:/sbin`,
  env lượt dựng từ đầu (không thừa hưởng biến `ZALO_*` của shell chấm), và `command -v` của `launchctl`, `pkill`, `pgrep`,
  `osascript`, `curl`, `date`, `openclaw` dưới env lượt hoặc nằm trong thư mục tạm hoặc vắng; `$HOME/.openclaw/bin/openclaw`
  của lượt là CLI giả; bản chép không còn đường tuyệt đối nào tới checkout thật, `~/dev` hay `.openclaw` ngoài `$HOME`.
  Harness thoát 2 KHÔNG spawn watchdog khi HOME lượt là HOME thật, một stub vắng, hay CLI giả vắng (ca đỏ: gỡ stub
  `launchctl` → từ chối, 0 spawn; gỡ CLI giả → từ chối, 0 spawn). Alerts log và `zalo-watchdog-p1.log` thật của checkout chính:
  phần có trước bộ giữ nguyên băm, phần nối thêm không chứa dòng nào của các lượt; `zalo-watchdog.log` thật (watchdog thật cắt
  về 500 dòng mỗi lượt): không chứa dòng nào của các lượt; `zalo-watchdog-p1-state`,
  `zalo-watchdog-p1-tat` thật và tệp trạng thái heartbeat thật: cùng trạng thái có/vắng và cùng băm trước và sau bộ.
- AC-8: Given đủ điều kiện kickstart, When công tắc tắt bật — env `ZALO_WATCHDOG_P1_TAT=1` hoặc tệp
  `pipeline/logs/zalo-watchdog-p1-tat` — Then 0 lời kickstart; gỡ công tắc thì lượt kế khởi động lại (đối chứng dương).
- AC-9: Given một lần tự khởi động lại đã xảy ra, When chạy `tail -1 pipeline/logs/zalo-watchdog-p1.log`, Then dòng in có
  mốc ISO, chữ `VHZ2 kickstart`, số giây L6(b) đỏ, và `reason=<session|stopped|unknown>` khi tệp heartbeat có lý do (`na` khi
  vắng); dòng khớp khuôn `^\S+ VHZ2 kickstart — lý do: L6\(b\) đỏ [0-9]+s; heartbeat reason=(session|stopped|unknown|na)$`.
- AC-10: Given nhánh này, When chạy 8 ca của ZCode (`zalo-watchdog-vhz2.test.mjs`), harness L6 (`s03_song_lib`,
  `s03_song_tron`, `s03_song_bien`), harness VHZ1 (`s03_hb_nghiem_thu`, `s03_hb_chan`) và kiểm cú pháp bash, Then tất cả xanh.

## Coverage

Trục (quét hình thái, preset test-matrix):
- Điều kiện (a) L6(b): chưa đỏ · đỏ 599 s · đỏ 600 s · hết đỏ → AC-1, AC-3.
- Trần: lần đầu · +21599 s · +21600 s · mười lượt trong 6 giờ → AC-2.
- Lý do heartbeat: stopped (09/11) · session (13/11, tệp do heartbeat thật sinh) · unknown (status treo che session) · UP gỡ cờ
  → AC-1, AC-3, AC-9.
- Lockdown: L2 · L3b · L1 · L4d · tất cả xanh → AC-4, AC-1.
- Gateway: chạy · chết lặng (pgrep rỗng) → AC-5.
- An toàn luật 8: lời CLI · lời launchctl · ghi cấu hình · quét tĩnh khối P1 → AC-6.
- Cô lập phép đo: stub thắng PATH · gỡ stub · gỡ CLI giả · HOME thật · biến ZALO_* của shell · log và tệp trạng thái thật →
  AC-7.
- Công tắc: env · tệp · gỡ → AC-8.
- Đọc sổ lần tự khởi động gần nhất → AC-9.
- Hồi quy: 8 ca ZCode · L6 · VHZ1 · cú pháp → AC-10.

Ô bỏ: khởi động lại gateway thật để đo — ngoài phạm vi vì trái luật 8 trong phép đo; đo thật «đứt trung vị ≤ 15′» là phép đo
sau triển khai (Đường đo).

## Đường đo

Hàng nền vận hành: miễn con số trên màn. Lệnh kiểm sau triển khai: `tail -1 pipeline/logs/zalo-watchdog.log` có dòng `ok —` trong
5′ sau gộp; lần tự khởi động gần nhất: `tail -1 pipeline/logs/zalo-watchdog-p1.log` (vắng tệp = chưa lần nào). Đo thật sau
triển khai: thời gian đứt trung vị khi bộ hẹn treo ≤ 15′ (nền 23–34 giờ).

## Out of scope

- Báo qua bộ đẩy (issue riêng tư) — VH1 `canh-bao-day-toi-nguoi`, làn P3; cảnh báo vòng này dừng ở alerts log + thông báo màn hình.
- Vá gốc bộ hẹn khởi động lại trong OpenClaw — VHZ3.
- Tự quét QR, đổi cấu hình OpenClaw.
- Khởi động lại gateway bằng tay, nạp plist mới trong vòng này.
- Hồi sinh gateway đã chết hẳn (tiến trình không còn, không do `alert()` tắt): watchdog giữ `exit 0` có sẵn; khi ấy chỉ L6(d)
  của heartbeat báo DOWN từ 30′ — đổi hành vi này là hàng mới.

## Notes

- Triển khai: watchdog chạy theo launchd 5′ từ checkout chính → có hiệu lực ở lượt kế sau khi làn merge `git pull --ff-only`;
  không cần ZCode thao tác. Lùi tức thì: tạo tệp `pipeline/logs/zalo-watchdog-p1-tat`; lùi mã: revert commit gộp rồi pull.
  Kiểm sau: hai lệnh ở «Đường đo».
- Trần thử lại sau kickstart lỗi: 900 giây (ba nhịp watchdog, một nhịp heartbeat), số mới so với lúc duyệt phạm vi, do làn thu chọn khi sửa lỗi Mạnh trả lại ngày 18/11.
  Lượt kick lỗi không tiêu trần 6 giờ. Ca `KICK-THAT-BAI` của `acceptance.mjs mo-lai` đo biên 899 và 900 giây.
