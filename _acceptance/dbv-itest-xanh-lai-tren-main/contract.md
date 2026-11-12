---
schema_version: 1
feature: danh-ba-vat-the.itest.mjs xanh lại trên main — fixture theo luật ISO một tỉnh, phép đo lũy đẳng 082 trên DB dừng ở 082
slug: dbv-itest-xanh-lai-tren-main
owner: phanlemanh@gmail.com
risk_tier: T2
surfaces: [cli]
status: approved
design_doc: docs/superpowers/specs/2026-11-12-dbv-itest-xanh-lai-tren-main-design.md
veto_state: mo
veto_opened_at: 2026-11-12T05:55:33Z
---

# Acceptance Contract: dbv-itest-xanh-lai-tren-main

## Context

Executor `dbv_db` (`pipeline/scripts/danh-ba-vat-the.itest.mjs`) đỏ 17/18 ca trên main e01513de. 16 ca đỏ vì fixture vùng trái
luật ISO một tỉnh mà #406 (DA1) đưa vào lệnh dựng (`loi: "nhieu-tinh"`). DBV-AC-1 đỏ vì đo «áp 082 lần hai không đổi lược
đồ» trên DB đã có 095 (#422). Bộ này chặn E6 của DA2. Giám sát đợt mở hàng để sửa CHỈ tệp kiểm.

## Criteria

- AC-1: Given DB thử dừng ở migration 082 (dựng bằng `taoDbThu` với `hetSo: 82`), When ca DBV-AC-1 đo dấu lược đồ, áp
  082 lần hai rồi đo lại, Then hai dấu bằng nhau; mọi phần còn lại của DBV-AC-1 (ma trận chỉ thêm, khoá, bí danh, phát biểu
  vật thể, so Người và phân xử tin với DB tới 081) chạy như cũ và ok.
- AC-2: Given fixture vùng mới của tệp (thị trường `q-m1` mang `admin_code` 01, `q-m2` mang 79; phường `q-p1` thuộc `q-m1`,
  `q-p2`, `q-p3` thuộc `q-m2`; `area_ids` của các nút giữ nguyên), When các ca DBV-AC-3…12 và DBM-AC-* chạy lệnh dựng thật,
  Then lệnh không thoát `nhieu-tinh` hay `tinh-khong-co-iso`, khu một ra `VN-HN`, khu hai ra `VN-SG`, và mọi kỳ vọng số
  của các ca giữ nguyên giá trị.
- AC-3: Given tệp kiểm sau sửa, When chạy `dbv_db`, Then 18/18 ca ok, không ca nào SKIP hay TODO (đếm từ đầu ra TAP); và
  probe tĩnh so cây làm việc với merge-base (đòi tệp kiểm không có thay đổi chưa commit) thấy: diff chỉ chạm
  `pipeline/scripts/danh-ba-vat-the.itest.mjs`, `_acceptance/dbv-itest-xanh-lai-tren-main/**`, `_acceptance/config.yaml`,
  design doc, và bản đồ máy sinh `PRODUCT-MAP.md`, `LO-TRINH.html`; MỌI lời gọi `assert.*(…)` của bản merge-base (trọn
  tham số tới dấu đóng ngoặc, gộp khoảng trắng) còn nguyên văn trong bản mới, trừ đúng một lời gọi đã khai trước — phép so
  dấu lược đồ của DBV-AC-1 đổi DB đo từ `db` sang DB dừng ở 082, thông điệp giữ nguyên.
- AC-4: Given hai đối chứng đỏ, When probe chạy (a) bản tệp ở merge-base với ca DBV-AC-3 và (b) bản mới với ca DBV-AC-1 và
  `DBV_MIG_THAY` là bản chép 082 không lũy đẳng (mỗi lần áp tạo một bảng tên ngẫu nhiên), Then (a) đỏ và đầu ra có
  `nhieu-tinh`, (b) đỏ và đầu ra có đúng thông điệp ghim «DBV-AC-1 áp 082 lần hai đổi lược đồ»; số DB `oneinvest_dbv_%` trên
  :5433 sau probe bằng trước probe (đo bằng `pg_database`, gồm DB `_082` mà `after` của tệp phải xoá).

## Coverage

Bỏ quét không gian (dòng `descope` trong sổ) — hai nguyên nhân đỏ đã gọi tên bằng log đo trên main:

- Trục A — fixture theo luật thật: luật một tỉnh → AC-2 · chiều đỏ fixture cũ → AC-4(a)
- Trục B — phép đo lũy đẳng đúng nghĩa: DB dừng ở 082 → AC-1 · chiều đỏ bản chép không lũy đẳng → AC-4(b)
- Trục C — không nới thước: 18/18 và không assert nào bị sửa → AC-3

## Out of scope

- Mã sản phẩm (`pipeline/danh-ba-vat-the.mjs`, `pipeline/lib/danh-ba-vat-the.mjs`) và mọi migration.
- Sửa các tệp anh em `danh-ba-vat-the-*.itest.mjs` — chỉ báo trong `anh-em.md`.
- Đưa itest này vào glob CI.

## Notes
