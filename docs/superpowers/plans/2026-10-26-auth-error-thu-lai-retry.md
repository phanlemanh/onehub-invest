# auth-error-thu-lai-retry Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** «Thử lại» ở `app/(auth)/error.tsx` gọi `retry()` của Next (tải lại từ server); ô auth-hop-chuan/E4 chuyển sang AC-1 của hồ sơ này bằng `superseded_by`; `_acceptance/config.yaml` thành YAML chuẩn mà không lệnh nào đổi nghĩa.

**Architecture:** Đổi một prop ở error.tsx theo mẫu `(marketing)/error.tsx`. Phép đo AC-1 render `ErrorBoundaryHandler` thật của Next quanh error.tsx và đếm `router.refresh()` của `AppRouterContext`. Hai tệp test mới (jsdom ở `app/tests`, node ở `scripts/`), mỗi phép đo có chiều đỏ trên cùng fixture.

**Tech Stack:** Next 16 · React 19 · `node:test` + jsdom (`app/tests`) · `yaml` (mượn từ `pipeline/node_modules`) · `lib/evidence-core.cjs`, `lib/eval-yaml.cjs` của kho.

**Spec:** `docs/superpowers/specs/2026-10-26-auth-error-thu-lai-retry-design.md` · hợp đồng `_acceptance/auth-error-thu-lai-retry/contract.md` (duyệt 2026-10-26, Hỏi-1 = A).

## Global Constraints

- Không đổi `PageError`, layout `(auth)` hay chữ trang lỗi (OOS-2); không đụng `(app)/error.tsx`, `ops/error.tsx` (OOS-1).
- Không đổi giá trị lệnh nào trong `_acceptance/config.yaml` (OOS-3); sửa tệp này cần `yeu-cau cham-tep` của đợt trước.
- Không sửa `contract.md` của `auth-hop-chuan` (đã ký); chỉ ô E4 trong `evals.yaml` của nó, đúng khuôn `EVAL-THAY-BOI-TEMPLATE`.
- Hoàn lại `app/next-env.d.ts` trước mỗi commit; dev server dãy U1 ở :3460.

## Review Focus

1. Bản sao tạm của error.tsx (chiều đỏ AER-AC-1) phải nằm trong `app/tests/` và bị xoá trong `finally` — sót lại thì `npm test` lần sau vẽ nhầm tệp.
2. `yaml` không có trong `app/` — bộ nạp phải tìm `pipeline/node_modules` của checkout hiện tại rồi của checkout chính (như `loadPg`), không có thì báo rõ thay vì xanh lặng.
3. `git show bc6e5120:_acceptance/config.yaml` không có ở clone nông của CI → ca so trước-sau `skip` kèm lý do in ra, không xanh lặng.
4. `ErrorBoundaryHandler` cần `pathname` và `AppRouterContext`; thiếu context thì `retry` gọi `this.context?.refresh()` trên null và đếm ra 0 — ca phải tự cấp router đếm được.
5. Ca AH-AC-4 rời `auth-hop-chuan.test.tsx` nhưng các import dùng chung của tệp đó (`existsSync`, `readFileSync`) vẫn được ca khác dùng — không để lint báo biến thừa.

---

### Task 1: «Thử lại» gọi retry + phép đo AC-1, AC-3, rời ca AH-AC-4

`independent: true` · phục vụ E1, E3, E4

**Files:**
- Modify: `app/src/app/(auth)/error.tsx`
- Create: `app/tests/auth-error-thu-lai-retry.test.tsx`
- Modify: `app/tests/auth-hop-chuan.test.tsx` (bỏ ca «AH-AC-4 error.tsx»)
- Modify: `_acceptance/auth-hop-chuan/evals.yaml` (ô E4: `status: not-run`, `superseded_by: auth-error-thu-lai-retry#AC-1`)

**Interfaces:**
- Produces: `export default function AuthGroupError({ error, retry }: { error: Error & { digest?: string }; retry: () => void })` trong `(auth)/error.tsx`, chuyền `reset={retry}` cho `PageError`.

- [ ] **Step 1: Viết ca đỏ trước** — `app/tests/auth-error-thu-lai-retry.test.tsx`, cùng dàn jsdom như `auth-hop-chuan.test.tsx`:

```tsx
test("AER-AC-1 Thử lại về server qua ranh giới lỗi thật của Next", async () => {
  // error.tsx tồn tại, dòng đầu "use client";
  // render <AppRouterContext.Provider value={{...router, refresh: () => refreshes++}}>
  //   <ErrorBoundaryHandler pathname="/login" errorComponent={AuthGroupError}><Boom digest="abc123"/></ErrorBoundaryHandler>
  assert.equal(alerts.length, 1); assert.match(alert.textContent, /Không tải được dữ liệu/); assert.match(alert.textContent, /Mã lỗi: abc123/);
  assert.equal(retryButtons.length, 1);
  // bấm → assert.equal(refreshes, 1, "Thử lại phải gọi retry của Next (router.refresh), không reset")
  // nav/aside = 0; đối chứng dương: render <nav/><aside/> → bộ chọn đếm 2
  // chiều đỏ: bản sao tạm error.tsx thay reset={retry} bằng reset={reset} (mkdtemp trong app/tests, xoá trong finally) → refreshes = 0
});
test("AER-AC-3 không miễn lint cho (auth)", () => {
  // offendersOf(json) = khoá bắt đầu "src/app/(auth)/" → [] trên eslint-suppressions.json
  // chiều đỏ: bản sao thêm "src/app/(auth)/error.tsx" → ["src/app/(auth)/error.tsx"], thông điệp
  //   "eslint-suppressions.json còn khoá miễn lint cho (auth): <khoá>"
});
```

- [ ] **Step 2: Chạy, thấy AER-AC-1 đỏ** — `cd app && node --import tsx --test tests/auth-error-thu-lai-retry.test.tsx` → FAIL «Thử lại phải gọi retry của Next (router.refresh), không reset» (error.tsx còn `reset`).
- [ ] **Step 3: Sửa error.tsx** — nhận `retry`, chuyền `reset={retry}`; chú thích một dòng như `(marketing)/error.tsx`.
- [ ] **Step 4: Bỏ ca AH-AC-4** khỏi `auth-hop-chuan.test.tsx`; ô E4 của `auth-hop-chuan/evals.yaml` thêm `status: not-run` + `superseded_by: auth-error-thu-lai-retry#AC-1` (giữ `cmd`).
- [ ] **Step 5: Xanh** — `cd app && node --import tsx --test tests/auth-error-thu-lai-retry.test.tsx tests/auth-hop-chuan.test.tsx` → PASS; `npx tsc --noEmit && npm run lint` → 0 lỗi.
- [ ] **Step 6: Phá-thử** — tạm đổi lại `reset={reset}` ở error.tsx thật → AER-AC-1 đỏ đúng thông điệp; hoàn lại.
- [ ] **Step 7: Commit** `feat(auth): «Thử lại» gọi retry của Next (auth-error-thu-lai-retry AC-1)`.

### Task 2: config.yaml thành YAML chuẩn + phép đo AC-2, AC-4

`independent: true` · phục vụ E2, E5

**Files:**
- Modify: `_acceptance/config.yaml` (dòng 152 bỏ `sync_pii_mutation` trùng; dòng 213 thêm dấu cách sau `methodology_design_gate:`)
- Create: `scripts/auth-error-thu-lai-retry.test.mjs`

**Interfaces:**
- Produces (nội bộ tệp test): `strictErrors(text: string): {code, line}[]` · `kitVsStrict(text: string): string[]` (khoá lệch) · `kitBeforeAfter(oldText: string, newText: string): string[]` (khoá khác giá trị) · `checkE4Supersede(evalsText: string): string[]`.

- [ ] **Step 0:** `yeu-cau cham-tep --tep _acceptance/config.yaml` (nêu hai chỗ sửa, không đổi giá trị lệnh); chờ duyệt.
- [ ] **Step 1: Viết test** — bốn ca:
  - `AER-AC-2 YAML chuẩn`: `strictErrors(config) = []`; bản sao chèn `    x:"y"` dưới `executors.script` → mã `MULTILINE_IMPLICIT_KEY`; chèn lại một khoá đã có → `DUPLICATE_KEY`; thông điệp `_acceptance/config.yaml không phải YAML chuẩn: <mã> dòng <n>`.
  - `AER-AC-2 bộ đọc kit khớp bộ đọc chuẩn`: in số khoá `executors.<loại>.<tên>`; `kitVsStrict(config) = []`; bản sao nối cuối `executors.script` một khoá đã có với giá trị khác → đúng khoá đó.
  - `AER-AC-2 không lệnh nào đổi nghĩa`: `kitBeforeAfter(git show bc6e5120:…, HEAD) = []` cho mọi khoá lá ≤ 3 cấp (in số khoá); bản sao đổi giá trị một lệnh → đúng khoá đó; không đọc được bc6e5120 → `t.skip("<lý do>")`.
  - `AER-AC-4 ô E4 của auth-hop-chuan được thay đúng`: `checkE4Supersede(evals auth-hop-chuan) = []`, AC-1 có trong contract này, `auth-hop-chuan.test.tsx` không chứa `AH-AC-4`; chiều đỏ: đổi slug → `superseded_by của auth-hop-chuan/E4 là <giá trị>, cần auth-error-thu-lai-retry#AC-1`; bỏ dòng status → `auth-hop-chuan/E4 chưa khai status: not-run`.
- [ ] **Step 2: Chạy, thấy AER-AC-2 YAML chuẩn đỏ** — `node --test scripts/auth-error-thu-lai-retry.test.mjs` → FAIL `DUPLICATE_KEY dòng 152` (config chưa sửa).
- [ ] **Step 3: Sửa config.yaml** (hai chỗ).
- [ ] **Step 4: Xanh** — `node --test scripts/auth-error-thu-lai-retry.test.mjs` → PASS bốn ca; `node --test scripts/*.test.mjs` xanh.
- [ ] **Step 5: Commit** `fix(acceptance): config.yaml thành YAML chuẩn (auth-error-thu-lai-retry AC-2, AC-4)`.

### Task 3: Kiểm toàn bộ rồi sang S4

`independent: false` (sau Task 1, 2)

- [ ] **Step 1:** `cd app && npm test` (ca chập chờn CD-AC-7b của hàng khác thì ghi nhận, không sửa) · `node --test scripts/*.test.mjs` · `cd app && npx tsc --noEmit && npm run lint`.
- [ ] **Step 2:** contract `status: implemented`, commit, xin khoá `s4`, chạy Workflow S4.
- [ ] **Sau Cổng Bằng chứng (S5):** ghim lại `auth-hop-chuan` bằng `repin-lane --write` (xin khoá), `pre-merge-check` sạch cho cả hai hồ sơ, rồi đẩy PR.
