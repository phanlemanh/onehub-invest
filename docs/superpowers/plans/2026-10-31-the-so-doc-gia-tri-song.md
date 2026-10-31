# the-so-doc-gia-tri-song (HD6) — kế hoạch thi công

**Goal:** bảng so thẻ ghép căn đọc giá trị sống, «Chưa rõ» là Thiếu, tin rời kho hiện Alert và khoá nút quyết.
**Spec:** `docs/superpowers/specs/2026-10-31-the-so-doc-gia-tri-song-design.md` · hợp đồng `_acceptance/the-so-doc-gia-tri-song/contract.md`.

## Global Constraints
- ReUI: `Alert` của `@/components/reui/alert` (variant `warning`), không đặt chiều cao/padding/motion; chữ phụ `text-xs text-muted-foreground`.
- Ngữ cảnh thiếu khoá `ben` = không biết (đọc evidence); chỉ `ben === null` là rời kho.
- Số `numeric` từ pg đổi về `Number` ở bộ nạp.

## Review Focus
- Tin không đổi mà hiện «Lúc chấm» giả do khác dạng số (E2 lát «tin không đổi»).
- Test PL3 (`the-duyet-du-can-cu.test.tsx`) dựng thẻ với ngữ cảnh không có `ben` — phải còn xanh.

### Task 1: lõi so + bộ nạp (independent: false)
Files: `app/src/lib/ops/review-can-cu.ts`, `app/src/lib/ops/review-context.ts`. Phục vụ E1, E3.
- `soGiaTri`: `unknown` coi như trống. `soTruongGhepCan(a, b, canCuA, canCuB, lucCham?: { a?: BenGhepCan; b?: BenGhepCan })` trả thêm `lucChamA`, `lucChamB` (giá trị evidence khi khác giá trị sống, null khi giống).
- `CONTEXT_SQL` thêm mười cột; `OfferContext.ben: BenGhepCan | null`.

### Task 2: thẻ + bảng so (independent: false)
Files: `app/src/components/ops/review-card.tsx`, `app/src/components/ops/review/review-compare.tsx`. Phục vụ E1, E2, E4, E5, E7, E8.
- `EntityMatchCard`: đọc `ben` khi có; Alert `[data-review-roi-kho]` mỗi bên một dòng `[data-review-roi-kho-ben]`; nút khoá khi có bên rời kho.
- `ReviewCompare`: dòng `[data-review-luc-cham]` «Lúc chấm: <giá trị>» trong ô.

### Task 3: test (independent: false)
Files: `app/tests/the-so-gia-tri-song.test.tsx`. Phục vụ E1–E6, E8.
- Verify: `cd app && node --import tsx --test tests/the-so-gia-tri-song.test.tsx tests/the-duyet-du-can-cu.test.tsx`.
