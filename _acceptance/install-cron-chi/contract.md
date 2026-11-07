---
schema_version: 1
feature: lối cài riêng job sao lưu tuần — install-cron.sh --chi backup chỉ cài job sao lưu, không khởi động lại job thu đang chạy
slug: install-cron-chi
owner: phanlemanh@gmail.com
risk_tier: T2
surfaces: [cli]
status: machine-cleared
veto_state: mo
veto_opened_at: 2026-11-07T08:57:44Z
approved_by:
approved_at:
---

# Acceptance Contract: install-cron-chi

## Context

audit-all FAIL «Backup tuần CHƯA cài»: DB máy thu (nhãn người, mọi quyết định duyệt) chưa có sao lưu tuần. `scripts/install-cron.sh`
cài cùng lúc ba job (collector, smoke, backup) và bootout/bootstrap cả ba, nên cài job sao lưu sẽ khởi động lại job collector đang chạy.
Lời giao `claudedp-0611-37` (giám sát xếp, làn ZCode): thêm cờ `--chi <job...>` để chỉ cài đúng job nêu tên. ZCode
`zcode/install-cron-chi` @ 16c1eaf9, vòng 2 thêm eb60ad59 (`--chi` trơn thoát 2, từ Ngoài-1 vòng 1). Nhánh nghiệm thu `claude/acceptance-install-cron-chi` = nhánh đó + hồ sơ này. Mạnh tự gõ lệnh cài
trên máy sau khi gộp; máy không chạy cài thật.

## Criteria

- AC-1: Given không có cờ, When chạy script cài, Then cài đủ ba job collector, smoke, backup như hành vi cũ.
- AC-2: Given `--chi backup` và BACKUP_DIR, When chạy script cài, Then chỉ plist backup được ghi, launchctl chỉ được gọi với plist backup, BACKUP_DIR nằm trong plist backup; plist collector và smoke không được ghi, không bị bootout.
- AC-3: Given BACKUP_PASS, When chạy `--chi backup`, Then mật khẩu đi vào Keychain (dịch vụ oneinvest-backup) qua stdin của `security`, không nằm trong plist, đối số lệnh, output hay lời gọi launchctl.
- AC-4: Given tên job lạ, cờ lạ, hoặc `--chi` không kèm tên job, When chạy script cài, Then thoát 2 và không ghi plist nào.
- AC-5: Given nhánh so với main, When liệt kê tệp đổi, Then chỉ có script cài, test của nó, hồ sơ này và khoá lệnh chấm trong config.

## Coverage

- Bỏ coverage-scan — sửa nhỏ một script; trục: vắng cờ, chỉ một job, mật khẩu, đầu vào sai, phạm vi.

## Out of scope

- Chạy cài thật trên máy (đụng ~/Library/LaunchAgents và Keychain thật): Mạnh tự gõ sau khi gộp.
- Nội dung job sao lưu (`scripts/db-sao-luu.sh`, plist backup): không đổi trong vòng này.

## Notes

- Probe `probes/keychain.sh` chạy script với HOME giả, `launchctl` và `security` giả đứng đầu PATH; không đụng LaunchAgents hay Keychain thật.
- Test `scripts/install-cron-chi.test.mjs` (ZCode) dùng HOME giả và launchctl giả.
