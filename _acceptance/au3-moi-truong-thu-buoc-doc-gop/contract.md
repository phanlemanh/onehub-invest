---
schema_version: 1
feature: Hộp thử AU3 có bước đọc gộp — phép đo nạp báo lỗi của job Zalo xanh lại sau khi job chạy sáu bước, ba hồ sơ đã ký ghim lại được
slug: au3-moi-truong-thu-buoc-doc-gop
owner: phanlemanh@gmail.com
risk_tier: T2
surfaces: [cli]
status: implemented
veto_state: mo
veto_opened_at: 2026-11-10T07:55:00Z
design_doc: _acceptance/au3-moi-truong-thu-buoc-doc-gop/design.md
approved_by:
approved_at:
---

# Acceptance Contract: au3-moi-truong-thu-buoc-doc-gop

## Context

PL34 (#384) cho job nạp Zalo đêm gọi thêm bước đọc gộp S03 (`pipeline/doc-gop-hang-ngay.sh`) giữa lần nạp cuối và
enrich. Hộp thử của `scripts/au3-nap-bao-loi/acceptance.mjs` chưa có tệp đó, nên job trong hộp thử thoát 127: chế độ
`lock` và `mo-coi` đỏ, `ts-format` xanh nhưng nuốt lỗ. Ba hồ sơ đã ký dùng các chế độ này (`au3-nap-bao-loi`,
`khoa-nap-s05-paused`, `s03-nap-argmax`) không ghim lại được. Mạnh chọn «mở hợp đồng mới» cho mục này (Ngoài-4 của
`pl34-lich-dem-sau-buoc`, 09/11). Số đo và cách làm: `design_doc`.

## Acceptance criteria

### AC-1: Hộp thử có đủ sáu bước của job Zalo
- **Given** hộp thử của chế độ `ts-format` cho `zalo-import-daily.sh`, có tệp giả `pipeline/doc-gop-hang-ngay.sh`
- **When** chạy `node scripts/au3-nap-bao-loi/acceptance.mjs ts-format`
- **Then** job thoát 0; lời gọi đọc gộp (giả) đứng sau lần nạp cuối và trước `enrich-run`; hai ca mang nhãn
  `MOI TRUONG DU BUOC` báo ok

### AC-2: Phép đo thấy khi thiếu bước đọc gộp
- **Given** CÙNG hộp thử, chỉ bỏ tệp giả đọc gộp
- **When** chế độ `ts-format` chạy ca đối chứng
- **Then** job thoát 127 và in dòng `JOB FAIL … bước doc-gop-hang-ngay mã 127`; ca `DOI CHUNG THIEU DOC GOP` báo ok.
  Bản phép đo không ghi tệp giả thì hai ca `MOI TRUONG DU BUOC` đỏ; bản đối chứng vẫn có tệp giả thì ca
  `DOI CHUNG THIEU DOC GOP` đỏ

### AC-3: Mọi chế độ của phép đo AU3 xanh lại, ca cũ giữ nguyên
- **Given** main sau PL34 cộng thay đổi của hồ sơ này
- **When** chạy năm chế độ `ts-format`, `lock`, `mo-coi`, `apify`, `chotot`
- **Then** cả năm thoát 0; không ca cũ nào đổi ngưỡng hay ý nghĩa; ba hồ sơ `au3-nap-bao-loi`, `khoa-nap-s05-paused`,
  `s03-nap-argmax` ghim lại được bằng làn máy

## Coverage

Bỏ quét không gian — một trục (hộp thử có hay không có tệp giả đọc gộp), quét đủ ở AC-1 và AC-2; AC-3 phủ mọi chế
độ đang dùng hộp thử. Xem dòng `descope` «bỏ coverage-scan» trong sổ.

## Out of scope

- Sửa `scripts/zalo-import-daily.sh`, `scripts/zalo-*.sh` hay `pipeline/doc-gop-hang-ngay.sh` thật.
- Thêm khoá executor mới vào `_acceptance/config.yaml` — hai chiều đo bằng lệnh `au3_ts_format` có sẵn.
- Đổi ngưỡng hay ý nghĩa ca cũ của các chế độ `lock`, `mo-coi`, `apify`, `chotot`.

## Notes

- Tiền lệ sửa hộp thử sau ký: `au3-nap-bao-loi` dòng `d-20261030T234514Z-2` (thêm vong-doi giả, transform-media giả).
