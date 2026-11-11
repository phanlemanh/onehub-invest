---
schema_version: 2
feature_slug: s03-len-nhanh-nac-1
verdict: REJECT
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 48a1a12ab5a625b4e70af30b91204c1353c6e47b
human_signoff:
---

# Evidence Report: s03-len-nhanh-nac-1

Vòng 3. Mọi eval của hợp đồng đều xanh (E3 chạy lại vòng này, các eval còn lại mang từ vòng 1). Verdict REJECT vì một lệnh suite không gắn eval nào, `cd app && npm test`, không xanh: một ca của bộ test app báo giá trị `draft` chưa có nhãn trên DB local. Xem khối lệnh suite bên dưới.

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
  run_id: r3-l1-1-20261111045717
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.zalo_import_khoa
  verified_at: 2026-11-11T04:57:17Z
  output: |
    ℹ duration_ms 408608.918125

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
  run_id: minted-s03-len-nhanh-nac-1-SUITE-npm_test__bb6271-r3
  exit_code: 0
  verified_at: 2026-11-11T04:57:17Z

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-s03-len-nhanh-nac-1-SUITE-lint-r3
  exit_code: 0
  verified_at: 2026-11-11T04:57:17Z

- cmd: cd app && npm test
  run_id: minted-s03-len-nhanh-nac-1-SUITE-npm_test__bd9a35-r3
  exit_code: 1
  verified_at: 2026-11-11T04:57:17Z
  note: lệnh này không gắn eval nào. Ca lỗi duy nhất là «ON12-AC-7 mọi giá trị đang có trên DB local có nhãn» trong app/tests/ops-nhan-theo-context.test.tsx; tập thực tế là ['draft'], tập mong đợi là rỗng.

- cmd: cd pipeline && npm test
  run_id: minted-s03-len-nhanh-nac-1-SUITE-npm_test__13563d-r3
  exit_code: 0
  verified_at: 2026-11-11T04:57:17Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-s03-len-nhanh-nac-1-SUITE-test_lint_rules-r3
  exit_code: 0
  verified_at: 2026-11-11T04:57:17Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-s03-len-nhanh-nac-1-SUITE-node_scripts_check_portal_compliance_mjs-r3
  exit_code: 0
  verified_at: 2026-11-11T04:57:17Z

## Known limits

## Ngoài hợp đồng

## Analyst

carried tu round 1 — baseline khong do lai round nay. Baseline: n-a cho mọi eval vòng này (evals.yaml không đổi từ lần baseline cuối, round 1).

Eval không phân biệt (xanh cả trên HEAD lẫn baseline, chỉ chứng minh harness, là regression-guard có chủ ý hoặc cần viết lại):
- E6b — `node --test scripts/zalo-import-job.test.mjs`
- E6c — `node --test scripts/enrich-buoc-job.test.mjs`
- E6d — `node --test scripts/zalo-import-job-lan.test.mjs`
- E6e — `node --test scripts/s03-nap-nhanh.test.mjs`

## Variance

none — mọi eval chạy một lần, xác định, không có phương sai.

## Iterations

Round 1: E1, E2, E4, E5, E6, E6b, E6c, E6d, E6e chạy lần đầu, xanh.
Round 2: lệnh suite `cd pipeline && npm test` không xanh (không gắn eval). Trả về triển khai.
Round 3: mọi eval xanh; lệnh suite `cd app && npm test` không xanh (không gắn eval, ca ON12-AC-7 báo giá trị `draft` chưa có nhãn). Verdict REJECT.

