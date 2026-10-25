---
schema_version: 1
feature: Lớp chép CI của Acceptance Gate Kit lên 2.34.0 và kế hoạch chuyển bản cho đợt dot0-cam-mau
slug: nang-kit-2-34-0
owner: phanlemanh@gmail.com
risk_tier: T1      # chép lại tệp kit trùng byte bản cài + số bản trong thước đo + tài liệu; không đổi sản phẩm, dữ liệu hay quyền
surfaces: [docs]
status: draft      # T1: không qua Cổng Phạm vi / Cổng Bằng chứng; người gộp PR là người chốt
---

# Acceptance Contract: nang-kit-2-34-0

## Context

Căn cứ: kit phát hành 2.34.0 ngày 25/10/2026 (thẻ `v2.34.0` = `0e095648`). AGENTS.md mục «Cổng nghiệm thu» quy định
tệp kit trong kho chỉ được cập nhật bằng cách chép lại từ plugin. Mạnh giao phiên này nâng kit cho kho và lập kế hoạch
chuyển bản.

Hồ sơ này có mặt vì PR chạm ba tệp ngoài `t1_skip_globs`: hai tệp chép của kit và `scripts/check-lo-trinh.sh`. Thay
đổi là T1. Hai tệp chép trùng từng byte với `acceptance-gate` 2.34.0. Phần mới của `lo-trinh.mjs` chỉ chạy khi kho khai
`tri_thuc`, mà kho này không khai. `check-lo-trinh.sh` chỉ đổi số bản kit mà bước 6 so bản chép với bản cài.

## Criteria

- AC-1: Given `scripts/lo-trinh.mjs` và `skills/acceptance/references/opportunity-template.md`, When `cmp` với cùng đường trong `~/.claude/plugins/cache/acceptance-gate-kit/acceptance-gate/2.34.0/`, Then trùng byte.
- AC-2: Given 21 tệp chép trong danh sách `INIT-CI-COPY-LIST` không gắn nhãn `tin_hieu`/`tri_thuc`, When so với bản 2.34.0, Then trùng byte cả 21 tệp.
- AC-3: Given `node scripts/product-map.mjs --root . --check`, When chạy trên đỉnh PR, Then cả hai dòng đều báo «khớp».
- AC-4: Given `bash scripts/pre-merge-check.sh . --base origin/main`, When chạy trên đỉnh PR, Then thoát 0 (`clean`).
- AC-5: Given `bash scripts/check-lo-trinh.sh mutation`, When chạy, Then bắt 6/6 bản đột biến. Kèm điều kiện: `static` đỏ sẵn trên `main` vì cảnh báo `[moc-ngoai-da-bo]` cho OM1, OM2; đỏ ấy có từ trước PR, ghi ở kế hoạch mục 5.
- AC-6: Given `docs/plan/nang-kit-2-34-0.md`, When đọc, Then có đủ ba phần: các dãy đang chạy, đợt `dieu-phoi-dot0-cam-mau`, và phiên giám sát.

## Out of scope

- Đổi đường cache `2.32.0` trong `_acceptance/config.yaml` (`ui_check`, các lệnh `design_gate`). Việc này cần PR có hồ sơ riêng.
- Khai `dieu-phoi` trong `.claude/settings.json` (T3).
- Sửa kit. Lỗi kit đi qua phiên điều phối của kit.
