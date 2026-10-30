# Hàng Phường so theo tên chuẩn — kế hoạch thi công

**Goal:** hàng Phường của bảng so ghép căn ở /ops/review báo «Khớp» khi hai tin cùng phường chỉ khác cách viết.

**Architecture:** một hàm thuần `khoaPhuong` trong `app/src/lib/ops/review-can-cu.ts`, dùng riêng cho hàng Phường của
`soTruongGhepCan`; chín hàng khác và giá trị hiển thị không đổi.

**Spec:** `docs/superpowers/specs/2026-10-30-the-duyet-phuong-lech-gia-design.md` · hồ sơ
`_acceptance/the-duyet-phuong-lech-gia/` (T2, làn V).

## Task 1 — `khoaPhuong` + hàng Phường của `soTruongGhepCan`

- Files: `app/src/lib/ops/review-can-cu.ts`
- `export function khoaPhuong(v: string): string` — bỏ một tiền tố `^(phường|xã|thị trấn)\s+|^p\.\s*` trên chuỗi NFC
  chữ thường còn dấu, rồi slug như `slugifyName()` của `queries.ts`.
- `soPhuong(a, b): So` — trống → `thieu`; khoá rỗng một bên → `thieu`; khoá chỉ số một bên → `soGiaTri(a, b)` (cách
  cũ); còn lại so khoá. `soTruongGhepCan` gọi `soPhuong` khi `key === "phuong"`.
- Verify: `cd app && npx tsc --noEmit && npm run lint`
- Phục vụ E1–E4, E6, E7 · independent: false (Task 2 import hàm này)

## Task 2 — ca `TPL-AC-n`

- Files: `app/tests/the-duyet-phuong-lech-gia.test.tsx` (khoá `executors.test.the_duyet_phuong` đã có)
- Ma trận viết trước theo `expected` của E1–E4; sheet ReviewCard thật trong jsdom (E6, khuôn dựng thẻ của
  `the-duyet-du-can-cu.test.tsx`); probe chỉ SELECT trên `areas` + `review_queue` (E7), `t.skip` có lời khi `CI`.
- Mỗi phép đo một chiều đỏ: bản chép `tests/.tpl-cu-*` của `review-can-cu.ts` đổi đúng một chỗ, thông điệp ghim.
- Verify: `cd app && node --import tsx --test tests/the-duyet-phuong-lech-gia.test.tsx` rồi
  `node --import tsx --test tests/the-duyet-du-can-cu.test.tsx` (E5).
- Phục vụ E1–E7 · independent: false
