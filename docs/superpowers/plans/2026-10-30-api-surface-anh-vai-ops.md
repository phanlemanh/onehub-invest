# Sổ bề mặt API khai đúng quyền /api/zalo-media — kế hoạch thi công

**Spec:** `docs/superpowers/specs/2026-10-30-api-surface-anh-vai-ops-design.md` · hồ sơ `_acceptance/api-surface-anh-vai-ops/`
(T2, Cổng Phạm vi Mạnh duyệt 30/10, Hỏi-1 = ops-session kèm note).

## Task 1 — sổ + route (phục vụ E1, E2, E4, E7)
- Files: `app/src/lib/api-surface.ts` (dòng zalo-media → ops-session, note ghi phần mã chặt hơn sổ),
  `app/src/app/api/zalo-media/route.ts` (đọc phiên một lần, `!canAccessOps(user)` → 404, `serveZaloMedia(req, user)`).
- Verify: `cd app && node --import tsx --test tests/api-surface-anh-vai-ops.test.tsx tests/zalo-media.test.tsx`
- independent: false

## Task 2 — hai bộ kiểm tĩnh (phục vụ E5, E6)
- Files: `scripts/check-api-surface.mjs` (M13/M15 sang route admin dựng giả, M20 mới),
  `scripts/check-portal-compliance.mjs` (§6 `routeChuyenPhien` + hai chiều đỏ route).
- Verify: `node scripts/check-api-surface.mjs mutation && node scripts/check-portal-compliance.mjs`
- independent: false (đọc route của Task 1)
