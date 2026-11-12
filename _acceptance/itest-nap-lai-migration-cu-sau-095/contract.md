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

- AC-1: Given DB thử đủ migration, When gọi `sqlNapLai`/`napDacTrung` nạp lại 061, 045, 059 trong giao dịch trên ma trận
  viết trước bốn ô — tập sống bằng tập tệp · tập sống ⊊ tập tệp · tập tệp ⊊ tập sống (thêm trường giả `qx_thu` vào ràng buộc
  sống, mô phỏng 096) · giao một phần (tập sống có `qx_thu`, tệp có trường mà tập sống bỏ) — Then không lỗi «violated by
  some row», tập trường sau nạp ⊇ hợp tập sống và tập tệp ở mọi ô, và ở hai ô «tập sống ⊆ tập tệp» `sqlNapLai` trả nguyên
  từng byte; `kiem-do-sau-070.test.mjs` (KD-AC-3) ok.
- AC-2: Given `s06-duong.itest.mjs` và `sdt-trong-duong.itest.mjs`, When chạy mỗi tệp trên DB của riêng lượt
  (`db-thu.sh --chay`), Then mọi ca ok (10/10 và 14/14), không SKIP.
- AC-3: Given các ca đo VỀ migration 045 trong `phat-bieu-db.itest.mjs` (PD-AC-1 045 áp hai lần, PD-AC-1 sổ), When chạy tệp
  trên DB của riêng lượt, Then mọi ca ok, không SKIP. Ca nào sửa bằng cách đo trên DB dừng ở một mức thì assert số migration
  lớn nhất đã áp trên DB nó đo bằng đúng mức đó (in ra), và DB đó dựng bằng `taoDbThu(…, { hetSo: X })`.
- AC-4: Given `danh-ba-vat-the-that.itest.mjs` chép khu vực từ máy thu sang DB thử, When chạy, Then pass 4, fail 0; và một ca
  assert dương: mọi area được chép có `parent_id` thì area cha có trong DB thử, và mọi thị trường cha có `admin_code` khác null.
- AC-5: Given bản cũ (merge-base) của `pipeline/lib/nap-view-song.mjs`, When probe đối chứng chạy kịch bản của AC-1, Then
  nạp lại 061 lỗi «violated by some row» và trường giả `qx_thu` mất; và bản merge-base của đúng bốn tệp kiểm ở AC-2…AC-4
  (tên từng tệp in ra) đỏ như trên main. Probe chỉ xoá DB thử của chính nó.
- AC-6: Given diff so merge-base, Then chỉ chạm các tệp kiểm của AC-2…AC-4 và AC-7, tệp kiểm mới của AC-1, `pipeline/lib/nap-*.mjs`,
  `_acceptance/itest-nap-lai-migration-cu-sau-095/**`, `_acceptance/config.yaml`, design doc, kế hoạch và bản đồ máy sinh;
  mọi lời gọi `assert.*(…)` của các tệp kiểm bị đổi còn nguyên văn so merge-base; không migration, không mã sản phẩm.

- AC-7: Given cây đã nhận main có migration 096 (DA2) và DA5, When chấm, Then probe tĩnh thấy `db/migrations/096_*.sql`
  (thiếu → thoát khác 0 «CHUA CO 096»), và `dac-trung-s06.itest.mjs` chạy trên DB riêng ok 8/8, không SKIP, với mọi lời gọi
  assert của nó còn nguyên văn.

## Coverage

Bỏ quét không gian (dòng `descope` trong sổ) — bảng quét 21 tệp đã gọi tên từng tệp đỏ và nguyên nhân:

- Trục A — bộ nạp lại không thu hẹp: AC-1 · đối chứng AC-5
- Trục B — phép đo về X trên DB dừng ở X: AC-3
- Trục C — tệp dựng tính năng trên DB đủ: AC-2
- Trục D — ngoài lớp trong ranh giới (luật một tỉnh): AC-4
- Trục E — không nới thước, không chạm sản phẩm: AC-6
- Trục F — bền với 096 đo trên 096 thật, tệp của N1 sau DA5: AC-7

## Out of scope

- Bốn tệp đỏ vì lý do khác và hai tệp tách khỏi hàng (`nap-lai-db` — luật 044 bị view sellers của 060 phá; `trang-thai-chao`
  AC-3/AC-7 — kỳ vọng đóng băng trong sổ), liệt ở `anh-em.md` kèm câu cần quyết.
- Migration đã commit và mã sản phẩm.

## Notes
