# Chặn ghi nhãn vào dòng trùng cụm — kế hoạch

**Goal:** `ghiNhan` trả 409 `TRUNG_CUM` cho dòng có `ghep.trung_voi`, màn và route giữ nguyên.

**Spec:** `docs/superpowers/specs/2026-11-06-ghi-nhan-chan-dong-trung-cum-design.md` · hồ sơ `_acceptance/ghi-nhan-chan-dong-trung-cum/`

## Global Constraints

- Không sửa `app/src/app/api/v1/ops/labels/route.ts` (đường T3), màn `/ops/labels`, `db/migrations/`.
- Test chỉ trên lược đồ tạm `gtc_<pid>`; `ghep` sinh bằng `ghepLat` thật.
- Không khởi động lại dev :3456 của main.

## Review Focus

- Lượt gửi lại sau mất phản hồi trên dòng vừa thành trùng cụm vẫn phải là «đã lưu» (AC-3).
- Lệnh ghép giữ khoá dòng khi lượt ghi tới (AC-4).
- Đại diện cụm và bài ảnh không chữ không bị chặn nhầm (AC-2).

### Task 1: chặn trong `ghiNhan` (independent: false)

**Files:** `app/src/lib/labels-queries.ts`, `app/src/lib/labels-normalize.ts` (hằng `TRUNG_CUM`), `CONTEXT.md` (thuật ngữ).
**Verify:** `cd app && npx tsc --noEmit && npm run lint`. Phục vụ E1–E7.

- Câu `FOR UPDATE` lấy thêm `ghep->>'trung_voi' AS trung_voi`; xét sau `cua_toi`, trước đếm người.

### Task 2: test và đầu dò (independent: false)

**Files:** `app/tests/labels-trung-cum.test.tsx`, `_acceptance/ghi-nhan-chan-dong-trung-cum/probes/pham-vi.{sh,mjs}`, `_acceptance/config.yaml` (`gtc_app`, `gtc_pham_vi`).
**Verify:** `cd app && node --import tsx --test tests/labels-trung-cum.test.tsx tests/labels.test.tsx tests/labels-nhom.test.tsx` và `bash _acceptance/ghi-nhan-chan-dong-trung-cum/probes/pham-vi.sh`. Phục vụ E1–E8.

- Mỗi ca có bản đột biến đỏ trên cùng fixture (đúng `expected` của `evals.yaml`).
