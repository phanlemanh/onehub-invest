# zalo-import-so-phan-nap-khong-do-gia Implementation Plan

**Goal:** ZJ-AC-5 so phần nạp của `scripts/zalo-import-daily.sh` giữa `e962e78^1` và `e962e78` (PR #96), không đỏ giả khi ZCode sửa phần nạp.

**Spec:** `docs/superpowers/specs/2026-10-25-zalo-import-so-phan-nap-khong-do-gia-design.md` · hợp đồng `_acceptance/zalo-import-so-phan-nap-khong-do-gia/contract.md`.

## Global Constraints

- Không đổi `scripts/zalo-import-daily.sh`. Phép đo dựng worktree tạm trong thư mục tạm, gỡ khi xong.

## Review Focus

- `node --test` con phải bỏ `NODE_TEST_CONTEXT` của tiến trình cha, không thì không tự báo kết quả.

### Task 1: ZJ-AC-5 mới + phép đo mô phỏng nhánh ZCode (một task, independent: false)

**Files:** `scripts/zalo-import-job.test.mjs` · `scripts/zalo-import-job-lan.test.mjs` · `_acceptance/config.yaml` (khoá `zalo_import_job_lan`). **Evals:** E1–E5.

- [ ] Chạy `node --test scripts/zalo-import-job-lan.test.mjs` trên ZJ-AC-5 cũ → ZL-AC-2 đỏ giả tái hiện; ghi sổ.
- [ ] Viết lại ZJ-AC-5: `banO("e962e78^1")` vs `banO("e962e78")`, assert mốc + vòng thử, đối chứng cặp giả với thông điệp ghim.
- [ ] `node --test scripts/zalo-import-job.test.mjs scripts/zalo-import-job-lan.test.mjs` → xanh, skipped 0.
- [ ] Commit.
