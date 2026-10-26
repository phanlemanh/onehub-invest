# che-do-thu-tren-ops Implementation Plan

> **For agentic workers:** thực thi native trong phiên (feature-loop T2). Steps dùng checkbox.

**Goal:** `/ops/sources` hiện và đổi chế độ thu từng điểm; bật Bùng chỉ admin, có hạn ≤ 14 đêm; máy hạ bùng quá hạn; mọi lần
đổi có `ops_audit` cùng giao dịch.

**Architecture:** luật thuần + ghi DB ở `app/src/lib/che-do-thu.ts` (`datCheDo`), route `source-groups` thêm action
`set-mode`; máy hạ ở `pipeline/ha-bung-het-han.mjs`, bước đầu của `scripts/cloud-sync.sh`; UI thêm cột + `mode-dialog.tsx`.

**Spec:** `docs/superpowers/specs/2026-10-25-che-do-thu-tren-ops-design.md` · hợp đồng `_acceptance/che-do-thu-tren-ops/`.

## Global Constraints

- Hạn bùng hợp lệ H … H+13, H = hôm nay giờ `Asia/Ho_Chi_Minh`; `burst_until` có khi và chỉ khi `mode = bung`.
- Actor audit: `user:<id>` (người), `machine:ha-bung-het-han` (máy); action `source-group:mode` / `source-group:mode-auto`.
- Không `group_key`/`name` trong detail audit, dòng in CLI, hộp thoại (tầng A).
- Nhãn: «Chờ», «Bùng», «Duy trì», «Chưa đặt», «Hạn bùng», «Đổi chế độ thu» (thêm vào `CONTEXT.md`).
- ReUI: Badge `@/components/reui/badge` (outline / warning-light / success-light), Dialog + Field + ToggleGroup + Input; lint sạch.

## Review Focus

- Biên giờ VN/UTC lúc 23:30Z → test chạy TZ=UTC, now cố định (E1, E2, E5, E7).
- INSERT audit hỏng → rollback (CD-AC-1b, CD-AC-5b).
- Action cũ mang khoá chế độ (CD-AC-3b).
- Thân request của hộp thoại tới datCheDo thật (CD-AC-7b).
- CLI in đúng một dòng, không tên (CD-AC-5c).

### Task 1: Test đỏ — `app/tests/che-do-thu.test.tsx` (mọi ca CD-AC-1 … CD-AC-8)

- [ ] Viết test theo `expected` của E1–E5, E7, E9, E11; lược đồ tạm `source_groups` + `ops_audit` (LIKE public).
- [ ] Chạy `cd app && node --import tsx --test tests/che-do-thu.test.tsx` → đỏ (thiếu module). Ghi dòng sổ `fix` S3.

### Task 2: `app/src/lib/che-do-thu.ts` + route `set-mode`

- `export const CHE_DO`, `NHAN_CHE_DO`, `TRAN_DEM_BUNG = 14`; `homNayVN(now: Date): string`; `congNgay(d: string, n: number): string`;
  `kiemCheDo(mode, burstUntil, homNay)`; `datCheDo(body, getUser, { db, now })` → `{ status, body }`.
- Route: `if (b.action === "set-mode") { const r = await datCheDo(b, getSessionUser); return NextResponse.json(r.body, { status: r.status }) }`.
- Verify: ca CD-AC-1 … CD-AC-4 xanh.

### Task 3: `pipeline/ha-bung-het-han.mjs` + `scripts/cloud-sync.sh` + `scripts/job-exit.test.mjs` + runtime-map

- `haBungHetHan(client, { now })`, `haVeDuyTri(client, id, lyDo, { now })`, CLI `main()` kiểu `refresh-bait-gap.mjs`.
- `job_run cloud-sync ha-bung-het-han node "$ROOT/pipeline/ha-bung-het-han.mjs"` trước `sync-cloud`; seq job-exit thành ba bước.
- Verify: CD-AC-5* xanh; `node --test scripts/job-exit.test.mjs` xanh.

### Task 4: UI — `sources-content.tsx`, `source-groups.tsx`, `mode-dialog.tsx` (mới), `CONTEXT.md`

- `GroupRow` thêm `mode`, `burst_until`, `mode_since`; `SourceGroups` nhận `homNay`; cột «Chế độ»; nút «Đổi chế độ thu».
- Verify: CD-AC-7, CD-AC-7b, CD-AC-8 xanh; `cd app && npx tsc --noEmit && npm run lint` sạch; self-check C1–C4 ReUI.

### Task 5: Hồi quy

- `cd app && npm test`, `node --test scripts/*.test.mjs`, `cd pipeline && npm test` — xanh như đường nền.
