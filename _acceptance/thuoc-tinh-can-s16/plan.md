# Kế hoạch thi công — thuoc-tinh-can-s16 (DA40)

Hợp đồng: `_acceptance/thuoc-tinh-can-s16/contract.md` (duyệt 18/11). Thiết kế: `design.md`. Kế hoạch đặt trong hồ sơ vì
`docs/superpowers/plans/` nằm ngoài ranh giới hàng.

Quy ước verify của kho thắng mặc định: TDD theo `node --test`; mọi phép đo mới có cặp hai chiều trên cùng fixture (xanh khi
lành, đỏ khi phá trong bản sao, thông điệp ghim). DB: chỉ DB của lượt (`db/db-thu.sh oneinvest_suite_ttc --chay`, mẫu
`oneinvest_suite_mau`); 113 không áp lên `:5433/oneinvest` trước khi gộp (luật đợt 27/10).

## Task

### T1 — Migration 113
- Files: `db/migrations/113_thuoc_tinh_can_s16.sql`
- Làm: bảng `stg_s16_can_chi_tiet` (thiết kế §4.1) · CHECK `field_assertions_field_chk` = 096 + 3 mã · thay thân
  `field_assertions_vat_the_082` (3 mã chỉ Unit/Property) · trigger miền `field_assertions_gia_tri_113` · view
  `v_unit_thuoc_tinh` · view `v_s16_gia_cdt`. Idempotent (IF NOT EXISTS, CREATE OR REPLACE, DROP CONSTRAINT IF EXISTS).
- Verify: `bash _acceptance/thuoc-tinh-can-s16/probes/kiem.sh db` (ca TTC-AC-1, AC-2, AC-6, AC-7).
- Phục vụ: E1, E2, E6, E7. `independent: true` (so với T2).

### T2 — Lõi thuần nguồn → phát biểu
- Files: `pipeline/lib/thuoc-tinh-can-s16.mjs`, `pipeline/tests/thuoc-tinh-can-s16.test.mjs`
- Làm: `docDongStg`, `phatBieuTuDong`, `gopKhoa`, bảng mã loại hình (Hỏi-4: shophouse → commercial), chuẩn hoá hướng; ca AC-8
  (FILL thật + `kiemBangDay` cấy) trong cùng tệp test.
- Verify: `bash _acceptance/thuoc-tinh-can-s16/probes/kiem.sh ham`.
- Phục vụ: E3, E8. `independent: true` (so với T1).

### T3 — Lệnh chạy thử / `--ghi` + itest
- Files: `pipeline/scripts/thuoc-tinh-can-s16.mjs`, `pipeline/tests/thuoc-tinh-can-s16.itest.mjs`
- Làm: đọc snapshot mới nhất của stg, ghép qua bí danh S16 sống, in bảng khuôn `bang-phu-ca.md` §1, `--ghi` một transaction
  `ON CONFLICT DO NOTHING`; itest dựng DB lượt, fixture qua lệnh thật, các ca TTC-AC-1…7 kèm đột biến.
- Verify: `bash _acceptance/thuoc-tinh-can-s16/probes/kiem.sh db`.
- Phục vụ: E1, E2, E4, E5, E6, E7. `independent: false` (cần T1, T2).

### T4 — Sổ từ vựng (CHỜ: TG2 gộp, GS nới `pipeline/mappings.yaml`)
- Files: `pipeline/mappings.yaml` (khối S16; 3 mã `assertion_field`: living_area → LivingArea, building_area_total →
  BuildingAreaTotal, direction_faces → trục local đã có), rồi `node pipeline/vocab.mjs --write` (tệp sinh + khối `CONTEXT.md`).
- Verify: `node pipeline/vocab.mjs --check` + `--check-db` trên DB lượt đã áp 113; suite `pipeline_a/b`.
- Phục vụ: AC-1 (CHECK khớp sổ). `independent: false` (khớp CHECK của T1).

### T5 — Lớp đọc thuộc tính + ô phủ
- Files: `app/src/lib/ops/thuoc-tinh-can.ts`, `app/tests/thuoc-tinh-can.test.tsx`
- Làm: hai câu SQL chỉ đọc (thuộc tính + giá theo `unit_key`; ô phủ theo nút qua bí danh S16 của toà, thiết kế §7); trả trạng
  thái `co` · `chua-co` · `khong-nguon`; lỗi bọc thành giá trị lỗi cho màn.
- Verify: `bash _acceptance/thuoc-tinh-can-s16/probes/kiem.sh app` (ca lớp đọc).
- Phục vụ: E9, E11 (phần lớp đọc). `independent: false` (cần T1, T3 cho fixture).

### T6 — Màn Danh bạ (CHỜ: DA36 gộp, GS nới vùng màn)
- Files: `app/src/components/ops/registry/du-an-toa-grid.tsx`, `app/src/components/ops/registry/du-an-*.tsx`,
  `app/src/app/ops/registry/[nodeId]/page.tsx` (tên chốt theo bản sau DA36)
- Làm: plan ReUI trước khi viết; cột thuộc tính + Badge S16 + mốc thu; ô phủ; Skeleton, lỗi nội tuyến «Thử lại»; nhãn từ
  `CONTEXT.md`; self-check ReUI hai vòng.
- Verify: `kiem.sh app` (route thật) + chạy dev :3463 tự nhìn.
- Phục vụ: E9, E10, E11, E12. `independent: false`.

### T7 — Đo dữ liệu thật + hồ sơ áp (CHỜ: bộ nạp làn thu nạp snapshot vào stg)
- Files: `pipeline/tests/thuoc-tinh-can-s16-that.mjs`, `_acceptance/thuoc-tinh-can-s16/ap-may-thu.md`
- Làm: đếm độc lập bốn cột (thiết kế E13); chạy thử trên DB thử chép (`db-thu.sh` từ mẫu); ghi năm thứ của hồ sơ áp.
- Verify: `kiem.sh that` trên DB thử chép (trước gộp) → số chạy thử.
- Phục vụ: E13, E14. `independent: false`.

## Thứ tự

T1 ∥ T2 → T3 → T5 → (T4 khi TG2 gộp) → (T6 khi DA36 gộp) → (T7 khi có stg thật) → S4 → Cổng Bằng chứng → gộp → áp máy thu.
T1 và T2 độc lập nhưng nhỏ; làm tuần tự trong vòng chính (fan-out không đáng chi phí).
