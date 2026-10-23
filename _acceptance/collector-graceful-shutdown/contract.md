---
schema_version: 1
feature: Collector API :9210 tắt êm — SIGTERM/SIGINT flush hết buffer rồi mới thoát
slug: collector-graceful-shutdown
owner: phanlemanh@gmail.com
risk_tier: T2
surfaces: [cli, config]
status: implemented
approved_by:
approved_at:
gate1_skipped: true
---

# Acceptance Contract: collector-graceful-shutdown

## Context

Collector API :9210 (ADR-0006) giữ tin Zalo đã ack 202 trong buffer bộ nhớ và chỉ flush
thành raw snapshot mỗi 60s. Khi bị dừng (launchd bootout/restart, Ctrl-C) mà chưa flush thì
tin đã ack mất âm thầm. ZCode thêm `collector/src/api/graceful.ts` (bắt SIGTERM/SIGINT, đóng
HTTP, lặp flush tới hết buffer, deadline 45s, bỏ ảnh sát deadline) và plist launchd
`com.oneinvest.collector-api.plist` (ExitTimeOut 60) để chuẩn bị chuyển API từ chạy tay sang
launchd. Bốn tiêu chí do phiên điều phối liên làn chốt (23/10/2026), chọn «nghiệm thu gọn».

Source input: prompt (brief phiên điều phối «Phân chia công việc Claude/Zcode» local_5d0e32a0…, 23/10/2026; nhánh `zcode/collector-graceful-shutdown` tip 6ff7153, review claudedp-2310-2)

## Criteria

- AC-1: Given Collector API (`dist/api/main.js`) đang chạy, có tin trong buffer, một connection keep-alive đang rảnh và một POST ingest đang dở (đã gửi header, body chưa xong), When tiến trình nhận SIGTERM hoặc SIGINT, Then server ngừng nhận connection mới, cắt connection keep-alive đang rảnh, làm nốt POST đang dở (ack 202, tin vào snapshot) rồi mới lặp flush tới khi buffer rỗng, và tự `exit(0)` (không bị giết bằng tín hiệu); buffer rỗng thì thoát mà không ghi snapshot rỗng.
- AC-2: Given một lượt flush đang chạy (tải ảnh chậm) và một POST ingest tới giữa chừng được ack 202, When SIGTERM tới lúc đó, Then trước khi `exit(0)` cả tin của lượt flush đầu lẫn tin của POST giữa chừng đều có trong snapshot.
- AC-3: Given deadline shutdown mặc định và `ExitTimeOut` của plist, When shutdown chạy, Then deadline 45s nhỏ hơn `ExitTimeOut` 60; còn dưới 10s tới deadline thì flush bỏ tải ảnh (không gọi host ảnh) nhưng tin vẫn ghi vào snapshot, còn dư thời gian thì không bỏ ảnh; một lượt flush ĐANG tải ảnh treo (vd 24 ảnh, số mặc định thật) bị huỷ tải ảnh ở mốc còn 10s và tin vẫn vào snapshot trước deadline; flush treo quá deadline vẫn tự exit; tín hiệu lần 2 thoát ngay.
- AC-4: Given `pipeline/cron/com.oneinvest.collector-api.plist` và mã collector của nhánh, When chạy `plutil -lint` và `npm run check`, Then plist hợp lệ (OK) và collector biên dịch sạch — tiền đề để launchd chạy `dist/api/main.js`.
- AC-5: Given shutdown phải thoát vì quá deadline hoặc vì tín hiệu lần 2, When lúc thoát buffer vẫn còn tin đã ack chưa flush, Then tiến trình exit mã khác 0 và log số tin mất («MẤT N tin»); buffer rỗng thì exit 0, không có dòng MẤT.

## Coverage

- Bỏ coverage-scan — phạm vi gọn do brief chốt 4 AC; trục chính đã phủ bằng tay: tín hiệu (SIGTERM | SIGINT | lần 2), buffer (rỗng | có tin | có tin đến giữa lúc flush), thời gian còn lại (dư | < 10s | quá deadline), kết nối (mới | keep-alive đang mở), flush (xong | lỗi | treo).

## Out of scope

- Cài plist vào `~/Library/LaunchAgents`, `launchctl bootstrap`/`bootout`, restart Collector API đang chạy tay — triển khai sau merge, ZCode làm qua kênh tin.
- Khôi phục tin khi tiến trình bị SIGKILL hoặc mất điện (buffer chỉ ở bộ nhớ) — không có journal đĩa trong vòng này.
- Tải bù ảnh đã bỏ lúc shutdown sát deadline — URL zdn.vn có hạn, ảnh bỏ là mất.
- Hành vi thu của OpenClaw (`collector/openclaw/**`) và watchdog Zalo — không đổi.
- Đổi DATA-CONTRACT / schemaVersion của snapshot — shutdown dùng đúng đường flush cũ.

## Notes

- Vòng 2 (23/10): ZCode sửa theo REJECT vòng 1 (claudedp-2310-3, c6044e3) — AC-1 đổi «cắt cả keep-alive» thành «cắt keep-alive rảnh, làm nốt POST đang dở»; AC-3 thêm ca lượt flush đang tải ảnh treo; thêm AC-5 (exit khác 0 khi mất tin). Ghi ở decisions.jsonl.
- Hợp đồng dựng SAU khi code xong (ZCode, 2 commit, đã qua review điều phối liên làn) → `gate1_skipped: true`; chữ ký Cổng 2 là điểm duyệt duy nhất.
- T2: diff chạm `collector/src/api/**`, test, `pipeline/cron/*.plist` — không khớp `t3_paths`.
- Eval tiến trình thật (E5) chép `collector/dist` vào thư mục tạm, chạy cổng ngẫu nhiên với key giả — không đụng :9210, không ghi `collector/snapshots`.
