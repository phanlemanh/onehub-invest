# Đặc trưng nhà S06 lên canonical (HD5) — kế hoạch thi công

**Spec:** `docs/superpowers/specs/2026-10-31-dac-trung-nha-s06-len-canonical-design.md` · hợp đồng
`_acceptance/dac-trung-nha-s06-len-canonical/` (đã duyệt 31/10, Hỏi-1 mẫu số hợp lệ).

## Global Constraints

- Migration số 061; chỉ áp DB local / DB thử; không sửa migration đã commit (045, 059).
- Đọc/ghi qua phát biểu: transform không UPDATE thẳng cột (`lib/scan-canonical-write.mjs`); không DELETE/TRUNCATE bảng bản
  ghi (`lib/scan-delete.mjs`).
- Test và thước trên DB thử `oneinvest_p1_n3` (+ `oneinvest_p1_n4` cho sổ), giao dịch ROLLBACK, khoá `pg_advisory_xact_lock(33033)`.
- `CLOUD_ALLOW` của `sync-cloud.mjs` không đổi.

## Task 1 — Sổ + migration 061 (`independent: false`)

- Files: `pipeline/mappings.yaml` (trục `assertion_field` thêm 7 mã + `dd_lookup`; khối cột `sale_offer_records` 7 cột ánh
  xạ RESO), `pipeline/lib/vocab.generated.mjs` (`node vocab.mjs --write`), `db/migrations/061_dac_trung_nha.sql`,
  `pipeline/lib/nap-061.mjs` (`MIG_061`, `napDacTrung(client)` giữ khoá 33033), `pipeline/scripts/dac-trung-s06-vocab-db.mjs`.
- 061: 7 cột + CHECK miền; `field_assertions_field_chk` = 6 mã 059 + 7 mã; trigger `field_assertions_gia_tri_061` (kiểu +
  miền 4 trường số, mọi phương pháp); `resolve_offer_fields` = thân 059 + 7 cột; view `sale_offers` dựng lại; hạt giống
  `ref_field_lookup` (`vocab.mjs --emit-seed`).
- Verify: áp 061 hai lần trên DB thử; `vocab --check/--lint`, `dac-trung-s06-vocab-db.mjs` (đối chứng chưa áp → lệch).
- Phục vụ E1, E2.

## Task 2 — Bộ đọc thuần (`independent: true`)

- Files: `pipeline/lib/dac-trung-s06.mjs` (`docDacTrungS06(ad) → {field, value, rule_id}[]`), `pipeline/scripts/dac-trung-s06.test.mjs`.
- Ma trận viết trước gồm dạng giá trị thật đếm ở stg (số JSON, chuỗi số, dấu phẩy thập phân, chuỗi kèm đơn vị); ca đỏ bản sao
  bỏ khung toạ độ VN.
- Verify: `cd pipeline && node --test scripts/dac-trung-s06.test.mjs` + lượt phá thử.
- Phục vụ E3.

## Task 3 — Transform S06 ghi phát biểu (`independent: false`, sau Task 1–2)

- Files: `pipeline/transform-chotot.mjs` (gọi `docDacTrungS06`, đẩy phát biểu vào mảng hiện có; `toilets` → `bathrooms`),
  `pipeline/scripts/dac-trung-s06.itest.mjs` (DT-AC-1, 4, 5, 6 + ca đỏ).
- Verify: itest trên DB thử `oneinvest_p1_n3`; `npm test` pipeline.
- Phục vụ E1, E4, E5, E6, E9, E9b.

## Task 4 — Thước dữ liệu thật (`independent: false`, sau Task 3)

- Files: `pipeline/scripts/do-dac-trung-s06.mjs`.
- Áp 061 trên DB thử; chạy `runTransformChotot` của merge-base (chép cạnh, xoá trong `finally`) rồi bản mới (S03/S05 chạy
  một lần để chụp cột cũ); in ba số mỗi trường bằng SQL độc lập; so cột cũ, `offer_status`, `bathrooms` S03/S05; răng
  `CLOUD_ALLOW`; ca đỏ «<trường>: X/Y < 95%» trên lượt merge-base.
- Verify: `executors.script.dac_trung_s06_that` xanh.
- Phục vụ E7, E8.

## Tóm tắt cho người duyệt

| Người dùng thấy gì khác | Đụng đâu | Phục vụ tiêu chí |
|---|---|---|
| Tin có thêm bảy ô đặc trưng nhà, có ràng buộc chặn giá trị vô lý | `061_dac_trung_nha.sql` | AC-1 (bảy ô + ràng buộc) |
| Bảy trường mang tên RESO trong sổ từ vựng | `mappings.yaml`, `vocab.generated.mjs` | AC-2 (sổ RESO xanh) |
| Máy đọc đúng đặc trưng S06, bỏ giá trị rác | `lib/dac-trung-s06.mjs` | AC-3 (bộ đọc thuần) |
| Mỗi giá trị có phát biểu và căn cứ; ô do phân xử dựng, nạp lại không nhân | `transform-chotot.mjs`, 061 | AC-4, AC-5, AC-6 (phát biểu, phân xử, vòng đời) |
| Trên dữ liệu thật mỗi đặc trưng lên ô ≥ 95%, cột cũ không đổi | `do-dac-trung-s06.mjs` | AC-7, AC-8 (dữ liệu thật, không lùi) |
| Bộ test và ca DB cũ vẫn xanh | `npm test`, itest 045/059 | AC-9 (không lùi) |
