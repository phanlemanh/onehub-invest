# L2 bảo thủ + dời năm probe dữ liệu thật — kế hoạch thi công

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans. Steps use checkbox (`- [ ]`).

**Goal:**
- L2 chuyển sang danh sách cho phép.
- Năm probe dữ liệu thật ra khỏi suite chung agent và app, chạy ở executor đã ký và ở /ops-check B5.
- `agent/probes` vào tsconfig.

**Spec:** `docs/superpowers/specs/2026-11-15-l2-bao-thu-doi-probe-that-design.md` · hợp đồng `_acceptance/l2-bao-thu-doi-probe-that/contract.md`

## Global Constraints

- Hai bản `khoaDuong` giống hệt từng dòng (CD-AC-7).
- Probe chỉ SELECT. Lượt trong-script không tạo tệp đột biến.
- Tên ca dời giữ nguyên. Riêng KD-AC-6 phần (b) có hậu tố «— dữ liệu thật (phần b)», vì phần (a) cùng tên ở lại suite.
- Không chạy suite nặng trước lượt khoá (lời GS).

## Review Focus

- «12, Phong Phú» và «8, Phổ Quang» không bóc: tiền tố phải là một từ trọn.
- Ca cố định đi kèm từng probe phải ở lại suite: KD-AC-1…5, KD-AC-6(a), LT-AC-1…5, AC-8, AC-9 fixture, TPL-AC-1…5.
- Probe app ghim thông điệp theo lớp, không theo giá trị đứng đầu.
- E9 của enrich-hau-ky chỉ hợp lệ khi hồ sơ này đã ký (cơ chế superseded_by).

### Task 1: L2 danh sách cho phép (independent: false) — E1, E2, E3

**Files:** `agent/src/agents/judge-entity.ts`, `app/src/lib/ops/review-can-cu.ts`, `agent/tests/judge-entity-duong.test.ts`,
`agent/probes/o-duong-that.test.ts`.

- [x] Thêm CD-AC-13, CD-AC-14 (chiều đỏ: bỏ L2; L2 cũ; bỏ ranh giới từ).
- [x] CD-AC-9 L2: «208, Nguyễn Hữu Cảnh» đổi kỳ vọng thành Thiếu.
- [x] Thêm vào MA_TRAN_7.
- [x] Sửa probe: mẫu đột biến L2, tenDocLap; thêm CD-AC-16 (tập con + luật lớp).

### Task 2: Dời bốn probe (independent: false) — E4–E7

**Files:**
- tests: `khong-dau-chung.ts`, `context-resolver-chung.ts`;
- probes: `chung.ts`, `khong-dau-that`, `judge-luat-that`, `context-resolver-that`;
- `app/probes/the-duyet-phuong-that.test.tsx`;
- `_acceptance/config.yaml` (judge_luat, judge_entity_khong_dau, the_duyet_phuong, context_resolver_that);
- `_acceptance/enrich-hau-ky/evals.yaml` (E9 superseded_by).

- [x] Mỗi tệp probe gọi giaDo(<tên>), và bỏ chiều đỏ khi trongScript().

### Task 3: Script chung, B5, tsconfig, CD-AC-10 (independent: false) — E8–E10

**Files:** `scripts/probe-du-lieu-that.sh`, `scripts/audit-all.sh`, `agent/probes/du-lieu-that.test.ts`, `agent/tsconfig.json`,
`agent/tests/judge-entity-duong.test.ts`.

- [x] Kiểm từng tệp:
  - `node --import tsx --test <tệp>` cho mọi tệp đổi;
  - `npx tsc --noEmit` ở agent và app;
  - `node --test scripts/audit-all.test.mjs`.
- [ ] E11, E12 (suite agent và app đầy đủ) chạy ở lượt chấm S4 khi tới lượt khoá.
