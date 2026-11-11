# Nhãn trạng thái nguồn «Chưa thu» — kế hoạch thi công

**Goal:** trạng thái `draft` của `source_registry.status` có nhãn «Chưa thu»; mọi giá trị CHECK có nhãn, kiểm thuần.
**Spec:** docs/superpowers/specs/2026-11-11-nhan-trang-thai-nguon-draft-design.md · hợp đồng `_acceptance/nhan-trang-thai-nguon-draft/`.

Một task, tuần tự (các phần cùng một bảng nhãn, không tách được) — `independent: false`.

### Task 1: bảng nhãn + ca kiểm + thuật ngữ + gỡ ngoại lệ lint
- Files: `app/src/lib/source-status-labels.ts` (thêm `draft`, xuất `NHAN_TRANG_THAI_NGUON`),
  `app/tests/source-status-labels.test.tsx` (SL-AC-1/2/3/5 kèm đối chứng), `CONTEXT.md` (một khối «Trạng thái mã nguồn»),
  `pipeline/mappings.yaml` + `pipeline/scripts/vocab-lint.test.mjs` (gỡ ngoại lệ `source-status-labels.ts|registry_status`).
- Verify: `cd app && node --import tsx --test tests/source-status-labels.test.tsx` (7/7) · phá thử: bỏ dòng `draft` → SL-AC-1, SL-AC-2, SL-AC-5 đỏ
  với thông điệp ghim · `cd pipeline && node --test --test-name-pattern=VL-AC-5 scripts/vocab-lint.test.mjs` · `node pipeline/vocab.mjs --check`
  · `cd app && npx tsc --noEmit`.
- Phục vụ: E1–E6.
