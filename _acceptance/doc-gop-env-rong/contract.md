---
schema_version: 1
feature: Bước đêm đọc gộp S03 chạy được ở kho không có .env trên /bin/bash 3.2 — bộ test agent xanh ở mọi worktree
slug: doc-gop-env-rong
owner: phanlemanh@gmail.com
risk_tier: T2
surfaces: [cli]
status: draft
design_doc: _acceptance/doc-gop-env-rong/design.md
approved_by:
approved_at:
---

# Acceptance Contract: doc-gop-env-rong

## Context

`pipeline/doc-gop-hang-ngay.sh` (PL34) mở mảng `ENV_FILE` rỗng bằng `"${ENV_FILE[@]}"` dưới `set -u`. `/bin/bash` 3.2 của
macOS báo «unbound variable» khi kho không có `.env`, nên bước chết trước lời gọi đầu. Máy thu có `.env` nên job đêm
chưa hỏng; worktree không chép `.env` thì bộ test agent đỏ ở PL34-AC-8 (đo 10/11, S4 của `app-test-chap-chon-e4b-sap`).
Số đo và cách sửa: `design_doc`.

## Acceptance criteria

### AC-1: Kho không có .env vẫn chạy đủ hai bước
- **Given** một gốc kho không có `.env`, `/bin/bash` của máy (macOS: 3.2), node giả
- **When** chạy `pipeline/doc-gop-hang-ngay.sh`
- **Then** thoát 0, đúng hai lời gọi (hôm qua, hôm kia), không lời gọi nào mang `--env-file`; kho có `.env` thì cả hai
  lời gọi mang `--env-file=<gốc>/.env`

### AC-2: Phép đo thấy bản lỗi
- **Given** cùng hộp thử, tệp là bản trước vòng (`"${ENV_FILE[@]}"` trần), `/bin/bash` bản 3
- **When** chạy không có `.env`
- **Then** thoát khác 0, stderr có «ENV_FILE[@]: unbound variable», không lời gọi nào; `/bin/bash` bản khác thì ca tự bỏ
  qua và nói lý do

### AC-3: Bộ test agent xanh, ca cũ giữ nguyên
- **Given** worktree không có `.env`
- **When** chạy `cd agent && npm test`
- **Then** thoát 0; PL34-AC-8 xanh không đổi điều kiện

## Coverage

Bỏ quét không gian — một trục (kho có hay không có `.env`), quét đủ ở AC-1; AC-2 là chiều đỏ. Xem dòng `descope`
«bỏ coverage-scan» trong sổ.

## Out of scope

- Đổi hành vi bước đêm khi có `.env`, đổi trần, đổi ngày.
- Sửa mẫu `"${X[@]}"` ở tệp khác (các tệp probe trong `_acceptance/` dùng mảng luôn có phần tử).

## Notes

- Lỗi tiềm ẩn của PL34 (#384), hàng do GS cắt 10/11.
