---
schema_version: 2
feature_slug: sellers-view-len-cloud
verdict: PASS
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 841d2298cc6cf8965c2459443c40744149845193
human_signoff: Mạnh 2026-11-01
---

# Evidence Report: sellers-view-len-cloud

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | test | PASS |
| E2 | AC-2 | script | PASS |
| E7 | AC-7 | script | PASS |
| E8 | AC-8 | test | PASS |
| E3 | AC-3 | script | PASS |
| E4 | AC-4 | script | PASS |
| E5 | AC-5 | test | PASS |
| E6 | AC-6 | script | PASS |

## Evidence

- eval: E1
  run_id: minted-sellers-view-len-cloud-E1-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.test.svc_sync
  verified_at: 2026-10-31T16:45:40Z
  output: |
    node --test pipeline/sync-cloud.test.mjs
    ℹ duration_ms 72.308292

- eval: E8
  run_id: minted-sellers-view-len-cloud-E8-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.test.svc_sync
  verified_at: 2026-10-31T16:45:40Z
  output: |
    node --test pipeline/sync-cloud.test.mjs
    ℹ duration_ms 72.308292

- eval: E2
  run_id: minted-sellers-view-len-cloud-E2-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.svc_cloud_gia
  verified_at: 2026-10-31T16:45:40Z
  output: |
    bash _acceptance/sellers-view-len-cloud/probes/cloud-gia.sh
    TRAO THAT OK

- eval: E7
  run_id: minted-sellers-view-len-cloud-E7-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.svc_cloud_gia
  verified_at: 2026-10-31T16:45:40Z
  output: |
    bash _acceptance/sellers-view-len-cloud/probes/cloud-gia.sh
    TRAO THAT OK

- eval: E3
  run_id: minted-sellers-view-len-cloud-E3-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.svc_doc_local
  verified_at: 2026-10-31T16:45:40Z
  output: |
    bash _acceptance/sellers-view-len-cloud/probes/cloud-gia.sh doc
    DOC LOCAL OK

- eval: E4
  run_id: minted-sellers-view-len-cloud-E4-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.svc_catchup
  verified_at: 2026-10-31T16:45:40Z
  output: |
    bash _acceptance/sellers-view-len-cloud/probes/catchup.sh
    CATCHUP OK

- eval: E5
  run_id: minted-sellers-view-len-cloud-E5-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.test.svc_sync_cu
  verified_at: 2026-10-31T16:45:40Z
  output: |
    node --test pipeline/sync-cloud.test.mjs pipeline/scripts/sync-cloud-pii.test.mjs pipeline/scripts/soat-tang-a.test.mjs
    ℹ duration_ms 13255.504917

- eval: E6
  run_id: minted-sellers-view-len-cloud-E6-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.svc_pham_vi
  verified_at: 2026-10-31T16:45:40Z
  output: |
    bash _acceptance/sellers-view-len-cloud/probes/pham-vi.sh
    PHAM VI OK

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-sellers-view-len-cloud-SUITE-npm_test__bb6271-r1
  exit_code: 0
  verified_at: 2026-10-31T16:45:40Z

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-sellers-view-len-cloud-SUITE-lint-r1
  exit_code: 0
  verified_at: 2026-10-31T16:45:40Z

- cmd: cd app && npm test
  run_id: minted-sellers-view-len-cloud-SUITE-npm_test__bd9a35-r1
  exit_code: 0
  verified_at: 2026-10-31T16:45:40Z

- cmd: cd pipeline && npm test
  run_id: minted-sellers-view-len-cloud-SUITE-npm_test__13563d-r1
  exit_code: 0
  verified_at: 2026-10-31T16:45:40Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-sellers-view-len-cloud-SUITE-test_lint_rules-r1
  exit_code: 0
  verified_at: 2026-10-31T16:45:40Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-sellers-view-len-cloud-SUITE-node_scripts_check_portal_compliance_mjs-r1
  exit_code: 0
  verified_at: 2026-10-31T16:45:40Z

## Known limits

## Ngoài hợp đồng

## Analyst

Eval không phân biệt (xanh trên cả HEAD lẫn baseline):
- E1, E8: chạy `node --test pipeline/sync-cloud.test.mjs`, xanh cả hai phía; xác nhận là regression-guard của tệp test, cần xem lại nếu muốn chứng minh hành vi mới.
- E5: chạy ba tệp test sync-cloud cũ, xanh cả hai phía; đây là regression-guard có chủ ý (AC-5 là «test cũ vẫn xanh»).

Baseline không đo:
- bash _acceptance/sellers-view-len-cloud/probes/cloud-gia.sh: bo qua baseline: tep _acceptance/sellers-view-len-cloud/probes/cloud-gia.sh co o cay dang kiem nhung chua co o merge-base 20dbba95b83ddb37a36d8657a23b00599a67c1b9 — eval moi, chay tren code cu khong phan biet gi
- bash _acceptance/sellers-view-len-cloud/probes/cloud-gia.sh doc: bo qua baseline: tep _acceptance/sellers-view-len-cloud/probes/cloud-gia.sh co o cay dang kiem nhung chua co o merge-base 20dbba95b83ddb37a36d8657a23b00599a67c1b9 — eval moi, chay tren code cu khong phan biet gi
- bash _acceptance/sellers-view-len-cloud/probes/catchup.sh: bo qua baseline: tep _acceptance/sellers-view-len-cloud/probes/catchup.sh co o cay dang kiem nhung chua co o merge-base 20dbba95b83ddb37a36d8657a23b00599a67c1b9 — eval moi, chay tren code cu khong phan biet gi
- bash _acceptance/sellers-view-len-cloud/probes/pham-vi.sh: bo qua baseline: tep _acceptance/sellers-view-len-cloud/probes/pham-vi.sh co o cay dang kiem nhung chua co o merge-base 20dbba95b83ddb37a36d8657a23b00599a67c1b9 — eval moi, chay tren code cu khong phan biet gi

## Variance

none — every multi-run eval is uniform

## Iterations

Round 1: tất cả eval (E1–E8) đạt, các lệnh suite xanh; không có mục cần người chốt.
