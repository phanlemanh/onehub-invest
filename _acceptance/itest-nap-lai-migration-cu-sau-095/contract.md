---
schema_version: 1
feature: Itest nạp lại migration cũ xanh lại trên DB đã có 095 — phép đo về migration X chạy trên DB dừng ở X, bộ nạp lại không bao giờ thu hẹp ràng buộc trường, bền với 096
slug: itest-nap-lai-migration-cu-sau-095
owner: phanlemanh@gmail.com
risk_tier: T2
surfaces: [cli]
status: draft
design_doc: docs/superpowers/specs/2026-11-12-itest-nap-lai-migration-cu-sau-095-design.md
---

# Acceptance Contract: itest-nap-lai-migration-cu-sau-095

## Context

Quét 21 itest nạp tệp migration trên main 3bfafd37 (mỗi tệp một DB riêng) thấy sáu tệp đỏ cùng lớp: nạp lại migration cũ
(045, 059, 061, 044) lên DB đã có 082/095 thì ràng buộc `field_assertions_field_chk` vỡ hoặc bị thu hẹp, hay phép đo về
migration cũ thấy dấu vết migration sau. Các hàm nạp lại (`pipeline/lib/nap-*.mjs`) chỉ chạy trên DB thật trong giao dịch
ROLLBACK của các lệnh `--thu` — không phải lỗi sản phẩm; DB máy thu đủ 17 trường. Giám sát đợt mở hàng; DA2 sắp thêm 096
cũng chạm ràng buộc này.

## Criteria

- AC-1: Given DB thử đủ migration có ràng buộc trường sống rộng hơn 061 (có phát biểu `floor_raw`), When gọi `napDacTrung`
  (nạp lại 061 qua `sqlNapLai`) trong giao dịch, Then không lỗi «violated by some row» và định nghĩa ràng buộc sau nạp
  bằng định nghĩa trước nạp; và khi thêm một trường giả `qx_thu` vào ràng buộc sống (mô phỏng 096) rồi nạp lại 061, 045,
  059, trường giả còn nguyên. Khi tập sống nằm trọn trong tập của tệp đang nạp thì `sqlNapLai` trả nguyên từng byte.
- AC-2: Given `s06-duong.itest.mjs` và `sdt-trong-duong.itest.mjs`, When chạy mỗi tệp trên DB của riêng lượt
  (`db-thu.sh --chay`), Then mọi ca ok (10/10 và 14/14), không SKIP.
- AC-3: Given các ca đo VỀ một migration cũ trong `phat-bieu-db.itest.mjs` (PD-AC-1 045 áp hai lần, PD-AC-1 sổ),
  `trang-thai-chao.itest.mjs` (AC-3 trục, AC-7) và `nap-lai-db.itest.mjs` (ND-AC-1 áp 044 hai lần), When chạy mỗi tệp trên
  DB của riêng lượt, Then mọi ca ok, không SKIP; các ca ấy đo trên DB dựng từ `db/migrations` dừng ở đúng mức migration
  mà ca nói tới.
- AC-4: Given `danh-ba-vat-the-that.itest.mjs` chép khu vực từ máy thu sang DB thử, When chạy, Then bốn ca ok; câu chép
  `areas` mang `parent_id`, `admin_code` và các thị trường cha của mọi khu vực được chép.
- AC-5: Given bản cũ (merge-base) của `pipeline/lib/nap-view-song.mjs`, When probe đối chứng chạy kịch bản của AC-1, Then
  nạp lại 061 lỗi «violated by some row» và trường giả `qx_thu` mất; và bản merge-base của từng tệp kiểm ở AC-2…AC-4 đỏ như
  trên main. Probe chỉ xoá DB thử của chính nó.
- AC-6: Given diff so merge-base, Then chỉ chạm các tệp kiểm của AC-2…AC-4, tệp kiểm mới của AC-1, `pipeline/lib/nap-*.mjs`,
  `_acceptance/itest-nap-lai-migration-cu-sau-095/**`, `_acceptance/config.yaml`, design doc, kế hoạch và bản đồ máy sinh;
  mọi lời gọi `assert.*(…)` của các tệp kiểm bị đổi còn nguyên văn so merge-base; không migration, không mã sản phẩm.

## Coverage

Bỏ quét không gian (dòng `descope` trong sổ) — bảng quét 21 tệp đã gọi tên từng tệp đỏ và nguyên nhân:

- Trục A — bộ nạp lại không thu hẹp: AC-1 · đối chứng AC-5
- Trục B — phép đo về X trên DB dừng ở X: AC-3
- Trục C — tệp dựng tính năng trên DB đủ: AC-2
- Trục D — ngoài lớp trong ranh giới (luật một tỉnh): AC-4
- Trục E — không nới thước, không chạm sản phẩm: AC-6

## Out of scope

- `pipeline/scripts/dac-trung-s06.itest.mjs` (N1, DA5) tới khi DA5 gộp — khi ấy nhận main và sửa trong hàng này.
- Bốn tệp đỏ vì lý do khác liệt ở `anh-em.md` (danh-ba-nguoi, the-duyet-nguoi, so-nhom, vocab-db).
- Migration đã commit và mã sản phẩm.

## Notes
