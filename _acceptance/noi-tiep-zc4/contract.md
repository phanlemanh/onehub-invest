---
schema_version: 1
feature: hai việc nối tiếp ZC4 — script cài collector tạo thư mục log và không để plist rỗng; lượt thu bị bỏ qua không để lại thư mục ẩn rỗng
slug: noi-tiep-zc4
owner: phanlemanh@gmail.com
risk_tier: T2
surfaces: [cli]
status: signed-off
veto_state: mo
veto_opened_at: 2026-10-26T06:15:11Z
approved_by:
approved_at:
---

# Acceptance Contract: noi-tiep-zc4

## Context

Hai mục ngoài hợp đồng Mạnh đã chọn «mở việc nhỏ cho ZCode»:
- 2610-5 (Ngoài-2 của `collector-api-launchd`, #117): `scripts/install-collector-api.sh` thiếu `mkdir -p pipeline/logs` (clone mới thì launchd không mở được tệp log) và `sed` lỗi để lại plist rỗng đè bản cũ. ZCode `zcode/install-collector-api-logs` @ 5565d32.
- 2510-32 (Ngoài-1 của `snapshot-nguyen-tu`, #105): scheduler tạo `SnapshotWriter` (chiếm `.<id>.partial` ngay trong constructor) trước hai chỗ dừng sớm (ngoài cửa sổ giờ, vượt cap ngày) → mỗi lượt bị bỏ qua để lại một thư mục ẩn rỗng. ZCode `zcode/snapshot-skip-khong-rac` @ 661a381.
Nhánh nghiệm thu = origin/main 6b0afe7 gộp hai nhánh.

## Criteria

- AC-1: Given bản chép kho chưa có `pipeline/logs`, When chạy script cài, Then thư mục log được tạo.
- AC-2: Given đã có plist cũ và `sed` lỗi (đường gốc chứa `|`), When chạy script cài, Then script thoát khác 0, plist cũ còn nguyên, không gọi launchctl.
- AC-3: Given lượt thu bị bỏ qua vì ngoài cửa sổ giờ hoặc vượt cap ngày, When scheduler chạy, Then thư mục gốc snapshot trống hoàn toàn (không `.partial`); và lượt thu thật vẫn ghi đủ snapshot có manifest.
- AC-4: Given nhánh, When chạy lại kiểm của `collector-api-launchd`, test script cài và toàn bộ test collector trên bản build sạch, Then tất cả xanh.
- AC-5: Given nhánh so với main, When liệt kê tệp đổi, Then chỉ có tệp của hai lời giao và hồ sơ này.

## Coverage

- Bỏ coverage-scan — hai sửa nhỏ; trục: thư mục log, ghi nguyên tử plist, lượt skip (cửa sổ / cap), lượt thật, hồi quy, phạm vi.

## Out of scope

- Triển khai: bản collector đang chạy (ZC4, PID launchd) sẽ có sửa 2510-32 ở lần build + khởi động lại kế; không khởi động lại riêng vì lỗi chỉ để rác vô hình.
- Dọn các thư mục `.partial` rỗng đã sinh trước vòng này (thư mục ẩn, tệp bọc bỏ qua).

## Notes

- Probe `_acceptance/noi-tiep-zc4/probes/logs-tmp.sh` chạy script cài trên bản chép tạm + HOME giả, launchctl giả.
- Quyết ở Cổng Bằng chứng 2026-10-25 (Mạnh):
  - Ngoài-1: ghi Known limits
- Known limits:
  - Ngoài-1: Lượt cài hỏng (sed hay plutil lỗi) để lại một tệp tạm rỗng trong thư mục tạm của user
