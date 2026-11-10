---
schema_version: 2
feature_slug: s03-len-nhanh-nac-1
verdict: REJECT
failed_evals: []
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: d938f8a2a93cd6258406d57aa0150d5bcd080b08
human_signoff:
---

# Evidence Report: s03-len-nhanh-nac-1

Vòng 2. Mười eval của hợp đồng đều mang tiếp từ vòng 1 (delta không chạm paths của chúng). Một lệnh suite hỏng, không gắn eval nào: `cd pipeline && npm test` (một ca đỏ ở scripts/media-wiring.test.mjs, xem phần Evidence). Verdict REJECT vì lệnh suite này đỏ.

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | test | PASS |
| E2 | AC-2 | test | PASS |
| E3 | AC-3 | test | PASS |
| E4 | AC-4 | test | PASS |
| E5 | AC-5 | test | PASS |
| E6 | AC-6 | test | PASS |
| E6b | AC-6 | test | PASS |
| E6c | AC-6 | test | PASS |
| E6d | AC-6 | test | PASS |
| E6e | AC-6 | script | PASS |

## Evidence

- eval: E1
  run_id: minted-s03-len-nhanh-nac-1-E1-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.zalo_import_nhe
  verified_at: 2026-11-10T11:55:21Z
  carried_from_round: 1
  output: |
    carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E2
  run_id: minted-s03-len-nhanh-nac-1-E2-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.zalo_import_nhe
  verified_at: 2026-11-10T11:55:21Z
  carried_from_round: 1
  output: |
    carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E3
  run_id: minted-s03-len-nhanh-nac-1-E3-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.zalo_import_khoa
  verified_at: 2026-11-10T11:55:21Z
  carried_from_round: 1
  output: |
    carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E4
  run_id: minted-s03-len-nhanh-nac-1-E4-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.cloud_sync_do
  verified_at: 2026-11-10T11:55:21Z
  carried_from_round: 1
  output: |
    carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E5
  run_id: minted-s03-len-nhanh-nac-1-E5-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.cloud_sync_do
  verified_at: 2026-11-10T11:55:21Z
  carried_from_round: 1
  output: |
    carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E6
  run_id: minted-s03-len-nhanh-nac-1-E6-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.job_exit
  verified_at: 2026-11-10T11:55:21Z
  carried_from_round: 1
  output: |
    carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E6b
  run_id: minted-s03-len-nhanh-nac-1-E6b-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.zalo_import_job
  verified_at: 2026-11-10T11:55:21Z
  carried_from_round: 1
  output: |
    carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E6c
  run_id: minted-s03-len-nhanh-nac-1-E6c-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.enrich_buoc_job
  verified_at: 2026-11-10T11:55:21Z
  carried_from_round: 1
  output: |
    carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E6d
  run_id: minted-s03-len-nhanh-nac-1-E6d-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.zalo_import_job_lan
  verified_at: 2026-11-10T11:55:21Z
  carried_from_round: 1
  output: |
    carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E6e
  run_id: minted-s03-len-nhanh-nac-1-E6e-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.snn_test
  verified_at: 2026-11-10T11:55:21Z
  carried_from_round: 1
  output: |
    carry-forward tu round 1 — delta khong cham paths cua eval

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-s03-len-nhanh-nac-1-SUITE-npm_test__bb6271-r2
  exit_code: 0
  verified_at: 2026-11-10T17:29:23Z

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-s03-len-nhanh-nac-1-SUITE-lint-r2
  exit_code: 0
  verified_at: 2026-11-10T17:29:23Z

- cmd: cd app && npm test
  run_id: bylaohwf2
  exit_code: 0
  verified_at: 2026-11-10T17:29:23Z

- cmd: cd pipeline && npm test
  run_id: minted-s03-len-nhanh-nac-1-SUITE-npm_test__13563d-r2
  exit_code: 1
  verified_at: 2026-11-10T17:29:23Z
  output: |
    667 test, 665 qua, 1 đỏ, 1 bỏ qua.
    Ca đỏ: scripts/media-wiring.test.mjs dòng 74, «NH-AC-10 chạy hằng đêm».
    Lỗi: scripts/zalo-import-daily.sh cần đúng một bước transform-media, thấy 0.
    Lệnh này không gắn eval nào.

- cmd: cd app && npm run test:lint-rules
  run_id: minted-s03-len-nhanh-nac-1-SUITE-test_lint_rules-r2
  exit_code: 0
  verified_at: 2026-11-10T17:29:23Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-s03-len-nhanh-nac-1-SUITE-node_scripts_check_portal_compliance_mjs-r2
  exit_code: 0
  verified_at: 2026-11-10T17:29:23Z

## Known limits

## Ngoài hợp đồng

## Analyst

carried tu round 1 — baseline khong do lai round nay.

Baseline khong do: E1, E2, E3, E4, E5, E6, E6b, E6c, E6d, E6e (round nay khong do lai, field baseline ghi n-a).

Eval không phân biệt (pass trên cả HEAD lẫn baseline; là regression-guard có chủ ý, nên viết lại nếu muốn assert hành vi mới):
- node --test scripts/zalo-import-job.test.mjs (E6b)
- node --test scripts/enrich-buoc-job.test.mjs (E6c)
- node --test scripts/zalo-import-job-lan.test.mjs (E6d)
- node --test scripts/s03-nap-nhanh.test.mjs (E6e)

Lệnh fail không gắn eval: `cd pipeline && npm test` (một ca đỏ, media-wiring NH-AC-10 thấy 0 bước transform-media trong zalo-import-daily.sh).

## Variance

none — every multi-run eval is uniform

## Iterations

Round 1: ba bộ test chung đỏ do cây chấm thiếu .env/.next; 10/10 eval xanh. Trả về triển khai.
Round 2: 10/10 eval mang tiếp, suite pipeline còn một ca đỏ (media-wiring NH-AC-10, không gắn eval). Trả về triển khai.

