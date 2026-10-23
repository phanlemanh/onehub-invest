---
schema_version: 1
feature: ZC3 — watchdog Zalo không sót log đầu ngày, cảnh báo drop bất thường và DB chết; nạp Zalo đêm phục hồi sau khi DB sập
slug: audit-p1-resilience
owner: phanlemanh@gmail.com
risk_tier: T3
surfaces: [cli, config]
status: signed-off
approved_by:
approved_at:
gate1_skipped: true
---

# Acceptance Contract: audit-p1-resilience

## Context

Sau sự cố DB 22/10, container Postgres :5433 chết lúc 22:49 và không lớp giám sát nào thấy trong 7 tiếng. Hậu quả: nạp Zalo 00:00 hỏng, snapshot hỏng bị state nhảy qua, và log chỉ có dòng «❌» trống. Watchdog L4b còn sót agent-turn ở đầu ngày mới, vì marker chỉ đếm số dòng (marker thật trên máy đang là `4211`, trong khi log hôm nay có 307 dòng).

ZCode sửa bốn tệp:
- `scripts/zalo-watchdog.sh`: marker `đường_dẫn:inode:số_dòng`; quét thêm `gateway.log`; thêm L4a (drop no mention) và L5b (:5433).
- `scripts/zalo-import-daily.sh`: giữ state, dừng chuỗi, exit ≠ 0, retry khi ECONNREFUSED.
- `pipeline/collect-chotot.mjs`, `pipeline/import-chotot.mjs`: `errDetail`.

Hàng ZC3 của lộ trình (`docs/plan/lo-trinh.json`, hạng T3).

Source input: prompt (brief phiên điều phối liên làn local_5d0e32a0…, 23/10/2026). Nhánh `zcode/audit-p1-resilience` @ 9882dc2, review claudedp-2310-5 mở lại.

## Criteria

- AC-1: Given marker L4b và log runtime, When watchdog quét phần mới, Then không sót agent-turn ở mọi ca:
  - file ngày mới dài hơn ngày cũ (2 → 5 dòng, turn ở dòng 1) thì quét toàn bộ;
  - cùng đường dẫn nhưng file thay mới thì quét toàn bộ;
  - truncate (cùng inode, ít dòng hơn) thì quét toàn bộ;
  - file không đổi thì không in gì;
  - chỉ thêm dòng thì chỉ in phần mới, turn đã quét không bị báo lại;
  - marker cũ định dạng số (vd `4211`) thì lần đầu quét toàn file, không lỗi, rồi viết lại marker sang định dạng mới.
- AC-2: Given `~/Library/Logs/openclaw/gateway.log` có lịch sử sự cố cũ (agent-turn, drop) và chưa có marker, When watchdog chạy lần đầu, Then chỉ khởi tạo marker, không quét lịch sử, không alert/kill; tới lượt sau có một agent-turn MỚI trong gateway.log thì alert KILL đúng lý do.
- AC-3: Given gateway.log đã có marker, When số dòng «drop no mention» mới trong một lượt ≥ 20, Then ghi đúng một dòng WARN L4a kèm số đếm và gửi thông báo, không kill OpenClaw; dưới 20 thì không WARN.
- AC-4: Given Postgres không nghe ở cổng DB, When watchdog chạy, Then ghi WARN L5b, dòng nhịp ghi `db:DOWN(HH:MM)`, gửi thông báo, không kill và vẫn exit 0; DB nghe thì ghi `db:ok`, không WARN.
- AC-5: Given các snapshot zalo-agent mới hơn state, When `zalo-import-daily.sh` chạy, Then:
  - một snapshot nạp lỗi thì state giữ ở snapshot cuối đã nạp, chuỗi dừng tại đó, transform/refresh không chạy, exit ≠ 0;
  - lỗi ECONNREFUSED thì thử lại tối đa 5 lần cách 20s, DB lên lại thì đi tiếp;
  - lỗi khác thì không retry;
  - snapshot cũ hơn state thì không nạp lại.
- AC-6: Given `collect-chotot.mjs` / `import-chotot.mjs` chết vì AggregateError message rỗng (ECONNREFUSED), When `main()` bắt lỗi, Then dòng «❌» in code kèm mọi lỗi con (địa chỉ:cổng); lỗi thường giữ nguyên message; lỗi không có code/message vẫn in được.

## Coverage

- Bỏ coverage-scan: phạm vi theo 5 AC gợi ý của brief, tách L4a thành AC riêng cho khớp `tieu_chi: 6` và câu «tăng drop giả: watchdog cảnh báo» của lộ trình. Các trục đã phủ bằng tay:
  - danh tính file: cùng file / file mới khác đường dẫn / file thay mới cùng đường dẫn / truncate;
  - marker: rỗng / số cũ / định dạng mới;
  - drop: dưới ngưỡng / đúng ngưỡng / trên ngưỡng;
  - DB: nghe / không nghe;
  - kết quả nạp: ok / lỗi thường / ECONNREFUSED tạm / ECONNREFUSED mãi.

## Out of scope

- Chạy watchdog thật lên OpenClaw, đụng `~/.openclaw`, `launchctl`: alert() kill gateway (luật 8). Mọi eval chạy bản chép trong thư mục tạm với HOME giả và stub.
- Triển khai: lượt watchdog thật đầu tiên sau merge sẽ viết lại marker `4211` và khởi tạo gw-marker trên máy. Việc này do ZCode làm qua kênh tin.
- Phía job pipeline (AU3), Kev gate :8009, restart policy của container DB.
- Chỉnh ngưỡng L4a (20/5′): giữ số ZCode chọn, không đo phân bố thật.

## Notes

- T3 vì `scripts/zalo-watchdog.sh` ∈ `t3_paths` (an toàn Zalo); lộ trình cũng ghi `"hang": "T3"`. Chữ ký Mạnh bắt buộc dù xanh.
- Hợp đồng dựng SAU khi code xong (ZCode, 3 commit) nên `gate1_skipped: true`.
- Bản chép watchdog chỉ đổi đúng 2 dòng (đường log /tmp theo ngày và cổng :5433, trỏ vào tệp/cổng giả). Harness kiểm diff đúng 2 dòng và kiểm stub thắng PATH trước mỗi lần chạy, sai thì bỏ chạy (exit 2).
