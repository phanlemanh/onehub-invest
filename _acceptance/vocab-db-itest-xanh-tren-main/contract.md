---
schema_version: 1
feature: Bộ test sổ từ vựng trên DB (vocab-db.itest) đo đúng sổ hiện tại — nạp phần từ vựng của mọi migration sau 043 — nên xanh trên main và trên DB đi trước main
slug: vocab-db-itest-xanh-tren-main
owner: phanlemanh@gmail.com
risk_tier: T2
surfaces: [cli]
status: approved
veto_state: mo
veto_opened_at: 2026-10-31T07:35:00Z
approved_by:
approved_at:
design_doc: docs/superpowers/specs/2026-10-31-vocab-db-itest-xanh-tren-main-design.md
---

# Acceptance Contract: vocab-db-itest-xanh-tren-main

## Context

`pipeline/scripts/vocab-db.itest.mjs` đỏ 4 ca trên main vì chỉ nạp 043 + 045 + 050 trong khi sổ đã có trục của 055, 056,
059. Ca đỏ chặn ghim lại hồ sơ đã ký `so-tu-vung-mot-nguon` và gộp HD5 #234.

## Criteria

- AC-1: Given DB máy thu :5433 (đã có 059, 061, 063), When chạy trọn `vocab-db.itest.mjs` (mọi ghi trong BEGIN … ROLLBACK),
  Then cả bảy ca xanh và không ràng buộc nào của DB thật đổi.
- AC-2: Given DB riêng dựng từ đủ migration của nhánh, When răng `wanted-thanh-inquiry/rang/db-rieng.mjs` chạy test, Then bảy
  ca xanh và DB tạm bị xoá.
- AC-3: Given bản test trước sửa (main 82a53e0a) và bản đã sửa, When chạy trên cùng DB máy thu, Then bản cũ đỏ đủ bốn ca
  VD-AC-7 ×2, VD-AC-8, VD-IQ-3; bản sửa xanh ba lượt liền; hai bản có cùng tên ca và cùng số lời gọi assert; định nghĩa mọi
  ràng buộc `*_chk` và số dòng ref_* của DB trước = sau.
- AC-4: Given toàn bộ thay đổi, When chạy bộ test pipeline, Then xanh.

## Coverage

Bỏ quét không gian — một trục (DB đích: đi trước main / dựng đúng theo main) phủ đủ ở AC-1, AC-2; xem dòng descope trong sổ.

## Out of scope

- Sửa `vocab-core.mjs` hay sổ `mappings.yaml`.
- Ghim lại hai hồ sơ đã ký dùng test này — việc của làn ghim lại sau gộp.

## Notes
