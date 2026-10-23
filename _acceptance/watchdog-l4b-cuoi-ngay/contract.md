---
schema_version: 1
feature: ZC3 nối tiếp — watchdog Zalo quét nốt đuôi log ngày cũ khi xoay ngày
slug: watchdog-l4b-cuoi-ngay
owner: phanlemanh@gmail.com
risk_tier: T3
surfaces: [cli]
status: implemented
approved_by:
approved_at:
gate1_skipped: true
---

# Acceptance Contract: watchdog-l4b-cuoi-ngay

## Context

ZC3 (`audit-p1-resilience`, đã merge) sửa lớp L4b của watchdog để không sót agent-turn ở đầu file log ngày mới. Phiên kiểm của ZC3 ghi một lỗ ngoài hợp đồng: dòng ghi vào CUỐI file hôm qua SAU lượt quét cuối ngày (khoảng 23:55–00:00) không bao giờ được quét. Lý do là lượt sau đã đổi sang file ngày mới. Một agent-turn rơi vào 5 phút cuối ngày vì thế lọt lớp canh an toàn Zalo.

ZCode sửa ở `scripts/zalo-watchdog.sh`: khi đổi file, watchdog quét nốt đuôi file cũ, nhưng chỉ khi file cũ còn và cùng inode, rồi mới quét toàn bộ file mới. Ca truncate tách thành nhánh riêng.

Gắn phụ hàng ZC3 của lộ trình. `docs/plan/lo-trinh.json` chưa có hàng riêng cho việc này.

Source input: prompt (brief phiên điều phối liên làn local_5d0e32a0…, 23/10/2026). Nhánh `zcode/watchdog-l4b-cuoi-ngay` @ e109402 (claudedp-2310-7), đã qua review điều phối.

## Criteria

- AC-1: Given lượt quét cuối ngày đã ghi marker cho file hôm qua, và sau đó một agent-turn được ghi vào dòng cuối file hôm qua, When lượt quét đầu ngày mới chạy trên file hôm nay, Then:
  - dòng turn đó được in ra (đúng phần đuôi chưa quét, cộng toàn bộ file mới);
  - watchdog chạy trọn ra alert KILL đúng lý do;
  - marker chuyển sang file mới.
- AC-2: Given file hôm nay có agent-turn ở dòng 1, When lượt quét đầu ngày mới chạy, Then turn đó được bắt, và toàn bộ file hôm nay được quét.
- AC-3: Given đã quét xong (kể cả đuôi file cũ), When chạy lại không có dòng mới hoặc chỉ nối thêm vào file hôm nay, Then không in gì, hoặc chỉ in phần mới; dòng của file cũ không bị báo lại.
- AC-4: Given file cũ đã bị xoá, hoặc đường dẫn cũ bị tái dùng bởi một file khác (inode khác), When lượt quét đổi sang file mới, Then không lỗi và không quét nhầm file lạ; chỉ file mới được quét.
- AC-5: Given cùng một file bị truncate (cùng inode, ít dòng hơn), When quét, Then quét lại từ dòng 1; marker số cũ (`4211`) vẫn quét toàn file hôm nay mà không lỗi; các ca L4b/gateway của ZC3 không hồi quy.

## Coverage

- Bỏ coverage-scan: 5 AC theo brief. Các trục:
  - đổi file: xoay ngày / cùng đường dẫn inode mới;
  - file cũ: còn / đã xoá / bị tái dùng;
  - vị trí turn: cuối file cũ / đầu file mới;
  - lặp: chạy lại / nối thêm;
  - truncate;
  - marker: số cũ / định dạng mới.

## Out of scope

- Chạy watchdog thật lên OpenClaw, đụng `~/.openclaw`, `/tmp/openclaw` thật, `launchctl`: alert() kill gateway (luật 8).
- gateway.log xoay kiểu đổi tên (`gateway.log` → `gateway.log.1` rồi tạo file mới cùng đường dẫn): phần đuôi của file đã đổi tên không được quét nốt, vì cùng đường dẫn nhưng inode khác thì code coi là file lạ.
- Lần chạy thật đầu tiên sau triển khai — do ZCode làm qua kênh tin.

## Notes

- T3 vì `scripts/zalo-watchdog.sh` ∈ `t3_paths` (an toàn Zalo). Chữ ký Mạnh bắt buộc.
- Hợp đồng dựng SAU khi code xong nên `gate1_skipped: true`.
- Eval trích nguyên văn `scan_new_lines` từ watchdog, và chạy watchdog trọn vẹn trên bản chép đổi đúng 2 dòng (đường log /tmp và cổng :5433), với HOME giả và stub `launchctl`/`pkill`/`pgrep`/`osascript`/`curl`/`sleep` (kiểm stub thắng PATH, sai thì bỏ chạy).
