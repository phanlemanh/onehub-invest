# loc-enrich-thu-ops-audit Implementation Plan

> **For agentic workers:** feature-loop T2, thực thi tuần tự trong vòng chính (một task). Steps dùng checkbox (`- [ ]`).

**Goal:** `GET /api/v1/ops/audit` không trả dòng `enrich:thu`; 100 dòng áp lên dòng đã lọc; quyền không đổi.

**Architecture:** Hằng `DAU_MAY` phía app; câu đọc của route thêm `WHERE action <> ALL($1::text[])`. Test gọi route thật trên
lược đồ tạm (khuôn `labels.test.tsx`), so với bản route trước vòng chép sẵn làm fixture.

**Tech Stack:** Next.js route handler, pg, node:test + tsx.

**Spec:** `docs/superpowers/specs/2026-10-30-loc-enrich-thu-ops-audit-design.md` · hợp đồng approved (Mạnh 30/10, T2 ngoại lệ
có tên).

## Global Constraints

- Chỉ đúng `enrich:thu`; không lọc theo tiền tố, không lọc theo actor.
- `kiemQuyen(req, "audit.read")` không đổi; khuôn `{ rows: [{ at, actor, action, env, detail }] }` không đổi.
- Test chỉ ghi vào lược đồ tạm của chính ca; `public` không chạm.
- Fixture route cũ commit sẵn; test không gọi git lúc chạy; vắng fixture → đỏ có tên.

## Review Focus

1. Bảng ít hơn 100 dòng không phải dấu → trả hết, không lỗi (ca LA-AC-1: 5 dòng người).
2. Bảng trống → `rows: []`, 200 (đối chứng trong LA-AC-4 trước khi gieo).
3. Action `enrich:thu-lai` cùng tiền tố vẫn hiện (LA-AC-3).
4. Bearer máy gọi → mã như route cũ (LA-AC-4).
5. Tên dấu đổi ở agent → test đỏ (LA-AC-5).

---

### Task 1: Hằng dấu máy, câu đọc route, fixture route cũ, test

**independent: false** · phục vụ E1–E5 · verify: `cd app && node --import tsx --test tests/audit-loc.test.tsx && npx tsc --noEmit`

**Files:**
- Create: `app/src/lib/ops/audit-loc.ts` — `export const DAU_MAY: readonly string[] = ["enrich:thu"]`
- Modify: `app/src/app/api/v1/ops/audit/route.ts` — câu SQL thêm `WHERE action <> ALL ($1::text[])`, tham số `[DAU_MAY]`
- Create: `app/tests/fixtures/audit-route-truoc-loc/route.ts.txt` — bản route ở `4cfd7cd1`, dòng đầu ghi sha nguồn
- Create: `app/tests/audit-loc.test.tsx` — ca LA-AC-1..LA-AC-5 theo `evals.yaml` (mỗi dòng gieo `detail.seq`), mỗi ca có
  chiều đỏ ghim thông điệp: route cũ (AC-1, AC-2), route lọc tiền tố `NOT LIKE 'enrich:%'` (AC-3), route đổi quyền sang
  `ops.read` (AC-4), chuỗi bên ghi đổi trong bộ nhớ (AC-5).

- [ ] Step 1: fixture + test (đỏ trên route cũ).
- [ ] Step 2: hằng + route; test xanh; `npx tsc --noEmit`, `npm run lint`.
- [ ] Step 3: commit `feat(ops): nhật ký thao tác bỏ dấu máy enrich:thu`.
