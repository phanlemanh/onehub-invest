# Kế hoạch thi công — nhan-gia-va-luu-loi-mang (T2)

Hợp đồng `_acceptance/nhan-gia-va-luu-loi-mang/contract.md` (duyệt 30/10). Thực thi tuần tự trong vòng chính.

## Task 1 — Chuẩn hoá: đơn vị đóng, từ chối dấu ngăn nghìn, hằng DA_GAN_CUA_TOI
- Files: `app/src/lib/labels-normalize.ts`, `app/src/lib/labels-queries.ts` (dùng hằng)
- Verify: `cd app && npx tsc --noEmit && node --import tsx --test tests/labels-gia.test.tsx tests/labels.test.tsx`
- Phục vụ: E1, E2 · independent: false

## Task 2 — Biểu mẫu: guiNhan năm kết cục + Alert «Không chắc đã lưu» / «Lưu lại»
- Files: `app/src/components/ops/labels/label-form.tsx`
- Verify: như Task 1 + `npm run lint` + design-gate trên label-form
- Phục vụ: E3, E4, E5 · independent: false (cần hằng của Task 1)

## Task 3 — Test và phép đo
- Files: `app/tests/labels-gia.test.tsx` (ma trận AC-1/AC-2 + route thật cho AC-3 + ba bản phá thử),
  `_acceptance/nhan-gia-va-luu-loi-mang/probes/pham-vi.sh`, `_acceptance/config.yaml` (`ngl_*`, sau P4-93)
- Verify: từng phép đo xanh; bản phá thử đỏ đúng thông điệp ghim
- Phục vụ: E1–E3, E6 · independent: false
