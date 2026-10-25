# transform-zalo-boc-job-run Implementation Plan

**Goal:** `scripts/zalo-import-daily.sh` thoát bằng mã bước hỏng đầu khi transform-zalo/refresh-bait-gap hỏng.

**Spec:** `docs/superpowers/specs/2026-10-25-transform-zalo-boc-job-run-design.md` · hợp đồng
`_acceptance/transform-zalo-boc-job-run/contract.md`.

## Global Constraints

- Không đổi byte nào từ đầu tệp tới hết khối «nạp hỏng thì thoát 1» (làn ZCode).
- Phép đo: node/sleep giả, HOME tạm, DATABASE_URL cổng đóng.

## Review Focus

- `job-step.sh` nạp bằng `.` — đường `$ROOT/scripts/lib/job-step.sh` phải tồn tại khi launchd chạy qua symlink `~/dev/one-invest`.

### Task 1: Bọc job_run + sổ vận hành (một task, independent: false)

**Files:** `scripts/zalo-import-daily.sh` · `docs/ops/runtime-map.md` · `scripts/zalo-import-job.test.mjs` ·
`_acceptance/config.yaml` (khoá `executors.test.zalo_import_job`). **Evals:** E1–E7.

- [ ] Chạy `node --test scripts/zalo-import-job.test.mjs` trên bản cũ → đỏ; ghi sổ `fix`.
- [ ] Thay hai dòng cuối bằng khối `job_run` + `exit "$JOB_RC"`; thêm dòng bảng + lệnh grep vào runtime-map.
- [ ] `bash -n scripts/zalo-import-daily.sh`; chạy lại test → xanh.
- [ ] Commit.
