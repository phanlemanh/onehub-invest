---
schema_version: 1
feature: Kho khớp lịch S06 2 lượt mỗi ngày đã cài trên máy thu — plist chotot trong main mang mốc 05:30 và 14:00, không va lịch job khác
slug: s06-hai-luot-ngay-gop-main
owner: phanlemanh@gmail.com
risk_tier: T2
surfaces: [script]
status: implemented
veto_state: mo
veto_opened_at: 2026-10-31T13:30:00Z
design_doc: docs/superpowers/specs/2026-10-31-s06-hai-luot-ngay-gop-main-design.md
approved_by:
approved_at:
---

# Acceptance Contract: s06-hai-luot-ngay-gop-main

## Context

Mạnh duyệt «Giao gói khuyến nghị» (31/10), trong đó S06 lên 2 lượt/ngày để kịp mục tiêu ra mắt 05/11 (S06 45k tin · 5 vùng).
ZCode sửa `pipeline/cron/com.oneinvest.chotot.plist` ở nhánh `zcode/s06-2-luat-ngay` @db2cfbcd: thêm mốc 14:00 (cách
05:30 là 8,5 giờ). Plist đã được cài trên máy thu trước khi gộp; vòng này tích hợp đúng commit ấy vào main để kho khớp máy.
Bản sửa deadlock của `resolve-properties` (#243) đã ở main, nên lượt 14:00 chạy code đã có bản sửa.

Vòng này chứng **cấu hình** (kho = máy, lịch không va). Bằng chứng lượt 14:00 chạy thật và ra snapshot S06 mới là bước
triển khai làn ZCode (`tin XONG` kèm bằng chứng hai phía), chưa đo được ở đây vì plist cài lúc 19:56 ngày 31/10, sau mốc 14:00
của ngày ấy.

## Criteria

- AC-1: Given `pipeline/cron/com.oneinvest.chotot.plist` của nhánh, When `plutil -lint` rồi đọc `StartCalendarInterval`,
  Then lint OK và lịch đúng hai phần tử `{Hour 5, Minute 30}` và `{Hour 14, Minute 0}` (không khoá nào khác), theo thứ tự
  đó; bản chép bỏ mốc 14:00, dời nó sang 12:10, hoặc thêm `Weekday 2` vào mốc 14:00 thì đỏ.
- AC-2: Given mọi plist khác trong `pipeline/cron/` HỢP mọi `com.oneinvest.*.plist` đang cài ở `~/Library/LaunchAgents`, When so
  mốc 14:00 với từng mốc giờ cố định của chúng (tính vòng qua nửa đêm), Then không mốc nào cách 14:00 dưới 60 phút; job chạy
  theo `StartInterval` (cloud-sync, zalo-heartbeat, zalo-watchdog) được loại trừ CÓ TÊN trong đầu ra; đối chứng: mốc 19:30 va
  airdna-daily 19:05, mốc 23:30 va zalo-import 00:00, một job giả ngoài `pipeline/cron/` mốc 13:30 va 14:00.
- AC-3: Given bản đang cài `~/Library/LaunchAgents/com.oneinvest.chotot.plist` trên máy thu, When thay `__ROOT__` của bản kho
  bằng gốc trong bản cài và bỏ khoá `EnvironmentVariables` (lệnh cài thêm vào), Then hai bản giống hệt, và
  `launchctl print` giữ đúng hai mốc 05:30 và 14:00.
- AC-4: Given toàn bộ thay đổi, When chạy bộ test `scripts/` và `pipeline/`, Then xanh.

## Coverage

Bỏ quét không gian — thay đổi một tệp cấu hình, ba trục liệt tay:

- Trục A — tệp kho: cú pháp · lịch → AC-1
- Trục B — lịch chung của máy thu: va chạm mốc với job khác → AC-2
- Trục C — máy thu: bản cài · launchd → AC-3
- Later: SLO độ tươi S06 (36 giờ) siết theo nhịp 2 lượt/ngày — việc riêng của bảng SLO.
- Never: sửa `scripts/chotot-daily.sh` hay bước thu (làn ZCode).

## Out of scope

- Bằng chứng lượt 14:00 chạy thật (log thoát 0, snapshot S06 mới sau 14:00) — bước triển khai làn ZCode.
- Va chạm theo thời lượng chạy (lượt dài chồng job sau) — chưa có số p95; xem dòng `revisit` trong sổ.
- Cài lại plist lên máy thu (đã cài trước khi gộp; triển khai làn ZCode).
- Sửa ROADMAP §2.4 «Chạy đêm» (05:30 → 05:30 + 14:00) — mục của ZCode.
- Siết SLO S06 theo nhịp mới.

## Notes
