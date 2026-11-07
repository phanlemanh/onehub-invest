---
schema_version: 1
feature: Nhận kit 2.37.0 — chép lớp CI theo bản cài, gỡ chân engine đỏ của đường nền
slug: nhan-kit-2-37-0
owner: phanlemanh@gmail.com
risk_tier: T1      # chỉ chép 2 tệp kit trùng byte bản cài 2.37.0, đổi 1 số phiên bản trong check-lo-trinh.sh, vẽ lại 2 tệp sinh; không đổi sản phẩm, dữ liệu hay quyền
surfaces: [docs]
status: draft      # T1: không qua Cổng Phạm vi / Cổng Bằng chứng; người gộp PR là người chốt
---

# Acceptance Contract: nhan-kit-2-37-0

## Context

Máy đã cài acceptance-gate 2.37.0 (thẻ `v2.37.0`, phát hành 03/11/2026). Kho còn chép lớp CI của bản cũ, nên đường nền
mỗi vòng báo chân engine đỏ: `LECH scripts/pre-merge-check.sh (vendored ≠ dang-chay)` và `LECH lib/evidence-core.cjs`
(ví dụ `_acceptance/dau-luoc-do-ban-mau/duong-nen.md`; GN1, PL30 cùng báo). Giám sát đợt `dieu-phoi-dot0-cam-mau` giao
dãy U1 ngày 07/11.

So từng tệp chép của kho với gói 2.37.0: chỉ hai tệp lệch, các tệp chép còn lại (`scripts/product-map.mjs`,
`scripts/lo-trinh.mjs`, `lib/*.cjs` khác) đã trùng byte.

Thay đổi trong PR:

- Chép trùng byte từ gói 2.37.0: `scripts/pre-merge-check.sh` (đọc thư viện kit theo chỗ đặt script — hồ sơ kit
  `pre-merge-doc-lib-theo-kit`; PR chỉ sửa tệp chữ của hồ sơ không kéo hồ sơ vào xét bằng chứng cũ — hồ sơ kit
  `chi-tep-vat-keo-xet-lai`) và `lib/evidence-core.cjs` (khối `TEP-CHU-HO-SO`, `phanTepHoSo`).
- `scripts/check-lo-trinh.sh`: `KIT_VER` 2.36.0 → 2.37.0, để ca «bản chép kit» so đúng bản đang cài.
- Vẽ lại `PRODUCT-MAP.md` / `LO-TRINH.html` bằng `scripts/product-map.mjs` của kho.

## Cắt / hoãn

- Không đổi `_acceptance/config.yaml` hay workflow: kho không khai `design/patterns/`, nên đường khuôn mới của 2.37.0 không
  chạm kho này.
- Không chép thêm tệp kit mà kho chưa có (`ban-do-khuon.cjs`, `design-floor-khuon.mjs`, `han-quet.cjs`…): lưới trước gộp
  của kho không gọi tới chúng.

## Acceptance Criteria

- AC-1: hai tệp lớp CI trùng byte gói 2.37.0; mọi tệp chép khác của kho cũng trùng byte gói 2.37.0.
- AC-2: `node scripts/product-map.mjs --root . --check` khớp cả hai tệp.
- AC-3: `bash scripts/pre-merge-check.sh . --base origin/main` sạch.
