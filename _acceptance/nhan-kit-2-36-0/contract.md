---
schema_version: 1
feature: Nhận kit 2.36.0 — chép lớp CI theo thẻ, vẽ lại bản đồ, bật GITATTR-TEP-SINH
slug: nhan-kit-2-36-0
owner: phanlemanh@gmail.com
risk_tier: T1      # chỉ chép 3 tệp kit trùng byte thẻ v2.36.0, vẽ lại 2 tệp sinh, thêm .gitattributes + 1 dòng setup; không đổi sản phẩm, dữ liệu hay quyền
surfaces: [docs]
status: draft      # T1: không qua Cổng Phạm vi / Cổng Bằng chứng; người gộp PR là người chốt
---

# Acceptance Contract: nhan-kit-2-36-0

## Context

Kit phát hành 2.36.0 ngày 30–31/10/2026 (thẻ `v2.36.0` = `4f891b07`); invest là kho nhận đầu tiên. Ghi chú nhận:
`docs/handoff/2026-10-31-nhan-2-36-0-invest.md` của kho kit (PR kit#457). Năm trong sáu hồ sơ của bản (TC1–TC5) sinh ra từ
đợt Điều phối `dieu-phoi-dot0-cam-mau` của chính kho này.

Đã làm ngoài PR này: cài `acceptance-gate`, `feature-loop`, `dieu-phoi`, `road-map`, `tri-thuc` 2.36.0 ở scope
project/local của checkout chính và scope user (`claude plugin update … -s project|local|user`); bản ghi cây phụ của
worktree nhận sửa bằng lệnh in sẵn của kiểm bản cài. `kiem-ban-cai.mjs --may --ref v2.36.0` → `TỔNG KẾT: ĐẠT` (VÀNG còn
lại: kho khác, worktree cũ đã xoá, cây phụ của các dãy đợt — nâng ở ranh giới hàng theo đề xuất gửi giám sát).
`git config merge.tep-sinh.driver true` đã đặt trên bản clone này (cấu hình repo, mọi worktree đọc ra `true`).

Thay đổi trong PR:

- Chép đồng thời ba tệp lớp CI từ thẻ: `lib/workspace-record.cjs`, `scripts/product-map.mjs`, `scripts/lo-trinh.mjs`
  (bản đồ mới gọi `coTepTrongCay` của bộ đọc hồ sơ — thư mục hồ sơ không tệp nào biến khỏi bản đồ).
- `scripts/check-lo-trinh.sh`: `KIT_VER` 2.34.0 → 2.36.0 (ca «bản chép kit» của `lo_trinh_static` so 4 tệp với bộ đệm
  của bản ghim; `scripts/lo-trinh.mjs` đổi ở 2.36.0 nên ghim cũ sẽ đỏ).
- Vẽ lại `PRODUCT-MAP.md` / `LO-TRINH.html` bằng `scripts/product-map.mjs` của kho (khác đúng một mã commit trong khối giờ
  máy — trang trước vẽ trên nhánh trước khi gộp).
- Bật tuỳ chọn `GITATTR-TEP-SINH`: `.gitattributes` hai dòng `merge=tep-sinh`; `scripts/setup.sh` đặt driver cho bản clone
  mới.

## Cắt / hoãn

- Không đụng `design.*`: bậc M1 giữ nguyên, thí điểm DO1 đếm tiếp.
- Không chép `cat-luot.mjs`, `hinh-dang.mjs`: kho không khai `tin_hieu`.
- Lõi đợt `dieu-phoi-dot0-cam-mau` (2.35.0) và bản ghi cây phụ của các dãy: giám sát nâng lúc `khoa/` không có khoá s4,
  theo đề xuất gửi phiên giám sát.

## Acceptance Criteria

- AC-1: ba tệp lớp CI trùng byte `v2.36.0`; `bash scripts/check-lo-trinh.sh static` → `LO-TRINH STATIC PASS`.
- AC-2: `node scripts/product-map.mjs --root . --check` khớp cả hai tệp.
- AC-3: `git check-attr merge -- PRODUCT-MAP.md LO-TRINH.html` → `tep-sinh`; `scripts/pre-merge-check.sh` sạch.
