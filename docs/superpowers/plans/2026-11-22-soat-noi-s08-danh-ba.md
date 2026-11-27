# Kế hoạch: soat-noi-s08-danh-ba (DA55)

Thiết kế: `docs/superpowers/specs/2026-11-22-soat-noi-s08-danh-ba-design.md`. Hồ sơ: `_acceptance/soat-noi-s08-danh-ba/`.
Các task làm tuần tự (task sau đọc hàm của task trước).

## T1 — Luật xếp ngả thuần · phục vụ E1 · independent: false
- Files: `pipeline/lib/noi-du-an-s08-lop.mjs`, `pipeline/scripts/noi-du-an-s08-lop.test.mjs`
- Hàm: `tenGoc`, `phanLopS08(d, nut, daNoi)`, `ketCucChuan`, `bamKetCuc`, `dungTheS08(ds)`; dùng lại `chuanKhop`, `chuanTen`,
  `laTenRong` của `noi-du-an-s06-lop.mjs`.
- Test: ma trận mười lăm ca viết trước + sáu phép phá (bản chép lib vào thư mục tạm, đổi đúng một chỗ, ca tương ứng đỏ).
- Verify: `node --test pipeline/scripts/noi-du-an-s08-lop.test.mjs`

## T2 — Lệnh thẻ, áp, đảo, kiểm · phục vụ E2–E5 · independent: false
- Files: `pipeline/noi-du-an-s08-luat.mjs`, `pipeline/scripts/noi-du-an-s08-luat.itest.mjs`
- `docDuAn`, `docNut`, `dungTheLuat`, `apTheLuat`, `daoTheLuat`, `kiemLuot`; CLI `--the/--ap/--dao/--kiem`.
- Itest NS8-2..5 trên DB thử `oneinvest_dbv_ns8_<pid>` dựng từ migrations (`db-thu-dbv.mjs`), mỗi ca có chiều đỏ.
- Verify: `node --test --test-concurrency=1 pipeline/scripts/noi-du-an-s08-luat.itest.mjs`

## T3 — Bên đọc màn Ops · phục vụ E6, E8 · independent: false
- Files: `app/src/lib/ops/registry/doc.ts`, `app/src/components/ops/registry/registry-view.tsx`, `app/tests/registry-s08-luat.test.tsx`
- `SQL_DANH_MUC` đếm S08 hai bảng + `noi_ung_vien`; `SQL_CHUA_NOI` lý do bảng luật trước; `oSo` thêm «n vào nút ứng viên».
- Verify: `cd app && npx tsc --noEmit && npm run lint` + lệnh `ns8_app`.

## T4 — Chạy thật trên bản chép · phục vụ E7 · independent: false
- Files: `pipeline/scripts/noi-du-an-s08-that.mjs`
- Chép DB máy thu (`db/db-thu.sh`), đếm bảng phủ, thẻ, áp, kiểm, đọc `docDanhBa`, đo DA53 băm và bộ gắn PL20 (sha e27d1e690),
  0 tin gắn, cấy nút S09, đảo; so từng ô.
- Verify: lệnh `ns8_that`.
