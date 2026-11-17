# nhan-du-an-thay-khu-do-thi-ops Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:executing-plans. Steps dùng checkbox.

**Goal:** chữ «Dự án» thay «Khu đô thị» trên màn Ops, bỏ «danh mục dự án» khỏi `_Avoid_`, probe DN1 đọc chính sách công khai của khối S08.

**Architecture:** đổi chuỗi tại chỗ (không đổi khoá), một tệp test lưới mới ở `scripts/`, một khoá executor mới, sửa khẳng định probe.

**Spec:** `docs/superpowers/specs/2026-11-17-nhan-du-an-thay-khu-do-thi-ops-design.md` · hợp đồng `_acceptance/nhan-du-an-thay-khu-do-thi-ops/contract.md`.

## Global Constraints
- Chỉ đổi chữ: `id: "projects"`, `value: "du_an"`, `value: "ma-trung-du-an"`, khoá `project` giữ nguyên (mục 39 Hỏi-1).
- `CONTEXT.md`: chỉ một dòng `_Avoid_` của «Danh mục CĐT».
- `_acceptance/config.yaml`: chỉ thêm `executors.script.ndt_unit`.
- ReUI: không đổi lớp, màu, khoảng.

## Review Focus
- Chữ hoa đầu câu «Dự án» vs «dự án» giữa câu — đọc lại từng chuỗi.
- Dòng nói quy mô («khu đô thị» là quy mô dự án) không được bị lưới bắt — đối chứng «quy mô».
- `TRUONG_DO_DUNG` bỏ ghi đè thì nhãn vẫn «Dự án» qua `FIELD_LABEL` — test dq-eval-classify-label.
- Lưới không xanh rỗng — đối chứng dương 18 trên bản 5508f620.
- Probe chỉ đọc khối S08 — đối chứng «công khai ở khối khác».

### Task 1: Lưới + ma trận (đỏ trước)
**Files:** Create `scripts/nhan-du-an-thay-khu-do-thi.test.mjs`; Modify `_acceptance/config.yaml` (khoá `ndt_unit: "node --test scripts/nhan-du-an-thay-khu-do-thi.test.mjs"`).
- [ ] Ca NDT-AC-1 (quét `app/src`, đỏ cùng fixture, đối chứng quy mô, đối chứng dương 18/8 trên `git show 5508f620:`), NDT-AC-2 (ma trận E1/E6 + chiều đỏ labels-normalize), NDT-AC-3 (`_Avoid_` + chiều đỏ).
- [ ] Chạy: đỏ ở AC-1/2/3 trên cây hiện tại.

### Task 2: Đổi chữ + test app
**Files:** 8 tệp `app/src` ở bảng phủ; 4 test `app/tests/*`.
- [ ] Đổi chuỗi; bỏ ghi đè `project` của `TRUONG_DO_DUNG`.
- [ ] Đổi kỳ vọng bốn test; `cd app && node --import tsx --test tests/{labels-nhom,do-hang-ngay-quality,so-nhom,dq-eval-classify-label}.test.tsx` xanh.

### Task 3: CONTEXT + probe
- [ ] Bỏ «danh mục dự án» khỏi `_Avoid_` dòng «Danh mục CĐT».
- [ ] `nap.mjs`: `kiemMappings` trả `congKhai`, `tangA` đọc trong khối S08; ba đối chứng E4; `config:executors.test.dn1_nap` xanh.

### Task 4: Kiểm trọn
- [ ] `node --test scripts/*.test.mjs`; `cd app && npx tsc --noEmit && npm run lint`; bốn test app; `glossary_terms` (vẫn thoát 1, chỉ còn hai lý do ngoài phạm vi).
