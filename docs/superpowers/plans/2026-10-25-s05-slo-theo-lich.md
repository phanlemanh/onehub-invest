# s05-slo-theo-lich Implementation Plan

**Goal:** `SLO_HOURS.S05` 12 → 96 ở `scripts/lib/freshness.mjs` và `app/src/lib/freshness.ts`, giữ parity.

**Spec:** `docs/superpowers/specs/2026-10-25-s05-slo-theo-lich-design.md` · hợp đồng `_acceptance/s05-slo-theo-lich/contract.md`.

## Global Constraints

- Không đổi luật so tuổi (`ageHours <= sloHours`), probe, hay SLO mã khác.

## Review Focus

- Test cũ ghim SLO S05 = 12 (AU4 `check-freshness.test.mjs`, AU6 `app/tests/slo-mot-nguon.test.tsx`) phải đổi theo.

### Task 1: Đổi hằng + cập nhật bảng mong đợi cũ (một task, independent: false)

**Files:** hai bản `freshness` · `scripts/s05-slo.test.mjs` · `scripts/check-freshness.test.mjs` · `app/tests/slo-mot-nguon.test.tsx` ·
`_acceptance/config.yaml` (khoá `s05_slo`, `freshness_parity`, `check_freshness`). **Evals:** E1–E6.

- [ ] `node --test scripts/s05-slo.test.mjs` trên bản cũ → đỏ; ghi sổ.
- [ ] Đổi `S05: 12` → `S05: 96` ở hai bản; đổi fixture «13 giờ / SLO 12» (AU4) sang 97/96; bảng AU6 sang 96 / «4 ngày».
- [ ] `node --test scripts/s05-slo.test.mjs scripts/freshness-parity.test.mjs`; `node --test --test-skip-pattern=GT-AC-1 scripts/check-freshness.test.mjs`; `cd app && npm test && npx tsc --noEmit && npm run lint`.
- [ ] Commit.
