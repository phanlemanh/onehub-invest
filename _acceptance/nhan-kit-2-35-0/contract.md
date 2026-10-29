---
schema_version: 1
feature: Nhận kit 2.35.0 — đổi đường bộ đệm có số sang 2.35.0 và khai vùng giao diện (design-floor bậc M1)
slug: nhan-kit-2-35-0
owner: phanlemanh@gmail.com
risk_tier: T1      # chỉ đổi _acceptance/config.yaml: 12 đường lệnh trỏ engine bản mới + khối design.surface_globs; không đổi sản phẩm, dữ liệu hay quyền
surfaces: [docs]
status: draft      # T1: không qua Cổng Phạm vi / Cổng Bằng chứng; người gộp PR là người chốt
---

# Acceptance Contract: nhan-kit-2-35-0

## Context

Mạnh ngày 29/10/2026: «Nhận kit 2.35.0 theo docs/handoff/2026-10-29-nhan-2-35-0-invest-thi-diem-design-floor.md trong kho
acceptance-gate-kit». invest là kho nhận đầu tiên của 2.35.0 và kho thí điểm nền thiết kế (DO1) ở bậc M1.

Đã làm ngoài PR này: cài năm gói `acceptance-gate`, `feature-loop`, `dieu-phoi`, `road-map`, `tri-thuc` theo thẻ `v2.35.0`
(979620ae) ở scope project/local của checkout chính và mười worktree đang có phiên; `kiem-ban-cai.mjs --may --ref v2.35.0`
→ `TỔNG KẾT: ĐẠT` (bản ghi VÀNG còn lại là kho khác và worktree cũ không có phiên).

Thay đổi trong PR:

- `_acceptance/config.yaml`: 12 đường `…/acceptance-gate/2.34.0/…` (`executors.design.gate`, `executors.design.ui_check`
  và các khoá `*_design_gate`) đổi sang `2.35.0`. `design-gate.mjs` và `design-scan.js` có thật ở bộ đệm 2.35.0.
- Khối cấp gốc `design.surface_globs` (`app/src/app/**`, `app/src/components/**`) → bộ đọc bậc báo
  `design-floor: bậc M1 — có giao diện (619 tệp khớp design.surface_globs)`.
- Vẽ lại `PRODUCT-MAP.md` / `LO-TRINH.html` bằng `scripts/product-map.mjs` của kho.

## Cắt / hoãn

- **`executors.design.floor` chưa nối** (bước 4 ghi chú nhận). Đo 29/10: 52/619 tệp giao diện còn hex thô (262 chỗ); nối
  ngay thì mười vòng thí điểm DO1 đo nợ cũ chứ không đo design-floor. Dọn hex thô ở một vòng riêng trước (tách các chỗ
  bắt nhầm như `href="#abc"`), rồi một PR nhỏ nối `floor` và bắt đầu đếm mười vòng. S0 trong lúc này in thêm dòng
  «S4 chưa chấm tuân thủ design system».
- **Không khai `design_floor`** (`tokens`, `registry`, `niem_phong`): kho chưa có bộ token và danh mục thành phần (M2).
- **Không chép lớp CI**: kho không khai `tin_hieu`.
- Lõi đợt `dieu-phoi-dot0-cam-mau` (ghim 2.32.0) nâng lúc nối lại đợt, khi `khoa/` rỗng.

## Acceptance Criteria

- AC-1: `_acceptance/config.yaml` không còn chuỗi `acceptance-gate/2.34.0/`; mọi đường `acceptance-gate/2.35.0/…` trỏ tệp có thật.
- AC-2: `design-floor-bac.mjs --root .` báo bậc M1.
- AC-3: `scripts/pre-merge-check.sh` sạch; `product-map --check` khớp.
