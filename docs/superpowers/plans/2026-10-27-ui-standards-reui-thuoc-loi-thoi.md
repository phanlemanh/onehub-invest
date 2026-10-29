# Kế hoạch: ui-standards-reui-thuoc-loi-thoi (T2)

| Người dùng thấy gì khác | Đụng đâu | Phục vụ tiêu chí |
|---|---|---|
| Phép kiểm vi phạm mới tự chọn tệp còn nợ lint | `app/eslint-plugin-onehub-ui/selftest.mjs` | AC-1 (tệp mẫu suy từ sổ nợ) |
| Tài liệu số đo so với lần đo mới nhất | `scripts/ui-standards/acceptance.mjs`, `docs/research/ui-baseline-2026-10.md` | AC-2 (nhật ký đo) |
| Lời hứa E12 chuyển sang hồ sơ mới | `_acceptance/ui-standards-reui/evals.yaml` | AC-3 (thay-bởi) |

## Task 1 — hai thước + tài liệu + khai thay-bởi (một việc)
- **Verify per-task:** `node eslint-plugin-onehub-ui/selftest.mjs baseline-guard`; `node scripts/ui-standards/acceptance.mjs baseline-doc`;
  bốn đầu dò của hồ sơ. Sau ký: ghim lại `ui-standards-reui`.
- **independent:** false
