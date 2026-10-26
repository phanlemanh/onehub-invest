---
schema_version: 1
feature: script cài collector :9210 dưới launchd (ZC4 bước code) — kiểm điều kiện chạy trước, ghi plist, KHÔNG tự khởi động
slug: collector-api-launchd
owner: phanlemanh@gmail.com
risk_tier: T2
surfaces: [cli]
status: signed-off
veto_state: mo
veto_opened_at: 2026-10-26T00:32:01Z
approved_by:
approved_at:
---

# Acceptance Contract: collector-api-launchd

## Context

Collector API :9210 vẫn là tiến trình chạy tay từ 21/10 (bản build cũ, không có graceful shutdown, khử trùng có trần hay ghi snapshot
nguyên tử). ZC4 đưa nó về launchd (`pipeline/cron/com.oneinvest.collector-api.plist`, KeepAlive, ExitTimeOut 60). Bước code là
`scripts/install-collector-api.sh`; bước triển khai (hạ tiến trình tay ngay sau một lượt flush → bootstrap → bằng chứng hai phía)
là lời GIAO riêng sau merge. Lời giao `claudedp-2510-33`; ZCode XONG ở `zcode/collector-api-launchd` @ 6e6c5cf.

## Criteria

- AC-1: Given chạy với `--dry`, When script chạy, Then thoát 0, in plist đã thế đường dẫn gốc kho và cặp lệnh bootout/bootstrap, KHÔNG ghi tệp nào và KHÔNG gọi launchctl.
- AC-2: Given mọi điều kiện đủ, When cài, Then ghi `~/Library/LaunchAgents/com.oneinvest.collector-api.plist` quyền 600, plutil -lint sạch, không còn `__ROOT__`, in cặp lệnh triển khai, và KHÔNG tự bootout/bootstrap.
- AC-3: Given thiếu bản build, bản build cũ hơn nguồn chính, thiếu tệp khoá agent, hoặc node tuyệt đối mà `api-launchd.sh` dùng không có, When cài, Then thoát khác 0 và không ghi plist.
- AC-4: Given nhánh, When chạy test của ZCode và kiểm phạm vi tệp, Then test xanh và chỉ có script + test + hồ sơ này đổi.

## Coverage

- Bỏ coverage-scan — một script cài; trục: --dry / cài / bốn điều kiện chặn / không tự khởi động / phạm vi.

## Out of scope

- Hạ tiến trình :9210 chạy tay và bootstrap — lời GIAO triển khai riêng (khởi động lại một lần, bằng chứng trước/trong/sau ≥ 2 lượt bộ canh).
- So tuổi bản build chỉ với `src/api/main.ts`: tệp nguồn khác mới hơn bản build không bị chặn — bước triển khai luôn `rm -rf dist && npm run build` trước.
- Chạy script khi tiến trình tay còn giữ :9210 rồi tự bootstrap sẽ làm launchd lặp lại EADDRINUSE — vì vậy script không tự bootstrap.

## Notes

- Probe `_acceptance/collector-api-launchd/probes/cai-dat.sh` chạy script trên bản chép tạm + HOME giả, launchctl là bản ghi lời gọi.
- Quyết ở Cổng Bằng chứng 2026-10-25 (Mạnh):
  - Ngoài-1: ghi Known limits
  - Ngoài-2: mở hợp đồng mới
  - Ngoài-3: ghi Known limits
- Known limits:
  - Ngoài-1: Script không từ chối chạy ngoài checkout chính — chạy từ worktree thì plist trỏ vào worktree
  - Ngoài-3: `sed "s|__ROOT__|$ROOT|g"` hỏng khi đường gốc có `&` hoặc `|`; ca `|` còn để lại plist rỗng trong LaunchAgents
