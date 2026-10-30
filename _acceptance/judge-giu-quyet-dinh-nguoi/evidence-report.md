---
schema_version: 2
feature_slug: judge-giu-quyet-dinh-nguoi
verdict: PASS
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 97f6a455c7cd852ba85f33a9bf7558d419478621
human_signoff: Mạnh 2026-10-30
---

# Evidence Report: judge-giu-quyet-dinh-nguoi

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | test | PASS |
| E2 | AC-2 | test | PASS |
| E3 | AC-3 | test | PASS |
| E4 | AC-4 | test | PASS (carry-forward từ round 1) |
| E5 | AC-5 | test | PASS (carry-forward từ round 1) |

## Evidence

- eval: E1
  run_id: minted-judge-giu-quyet-dinh-nguoi-E1-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.agent
  verified_at: 2026-10-30T15:10:37Z
  output: |
    cd agent && npm test — toàn bộ xanh, gồm ca 'AC-1 thẻ bị quyết giữa lúc chấm'
    ℹ duration_ms 4901.262875

- eval: E2
  run_id: minted-judge-giu-quyet-dinh-nguoi-E2-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.agent
  verified_at: 2026-10-30T15:10:37Z
  output: |
    cd agent && npm test — toàn bộ xanh, gồm ca 'AC-2 hai chiều, một thẻ bị quyết'
    ℹ duration_ms 4901.262875

- eval: E3
  run_id: minted-judge-giu-quyet-dinh-nguoi-E3-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.agent
  verified_at: 2026-10-30T15:10:37Z
  output: |
    cd agent && npm test — toàn bộ xanh, gồm ca 'AC-7 chạy lại' với assert capNhat
    ℹ duration_ms 4901.262875

- eval: E4
  run_id: minted-judge-giu-quyet-dinh-nguoi-E4-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.agent
  verified_at: 2026-10-30T15:05:04Z
  carried_from_round: 1
  # carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E5
  run_id: minted-judge-giu-quyet-dinh-nguoi-E5-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.agent
  verified_at: 2026-10-30T15:05:04Z
  carried_from_round: 1
  # carry-forward tu round 1 — delta khong cham paths cua eval

### Lệnh suite (hồi quy)

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-judge-giu-quyet-dinh-nguoi-SUITE-lint-r2
  exit_code: 0
  verified_at: 2026-10-30T15:10:37Z

- cmd: cd app && npm test
  run_id: minted-judge-giu-quyet-dinh-nguoi-SUITE-npm_test__bd9a35-r2
  exit_code: 0
  verified_at: 2026-10-30T15:10:37Z

- cmd: cd pipeline && npm test
  run_id: minted-judge-giu-quyet-dinh-nguoi-SUITE-npm_test__13563d-r2
  exit_code: 0
  verified_at: 2026-10-30T15:10:37Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-judge-giu-quyet-dinh-nguoi-SUITE-test_lint_rules-r2
  exit_code: 0
  verified_at: 2026-10-30T15:10:37Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-judge-giu-quyet-dinh-nguoi-SUITE-node_scripts_check_portal_compliance_mjs-r2
  exit_code: 0
  verified_at: 2026-10-30T15:10:37Z

## Known limits

## Ngoài hợp đồng

## Analyst

baseline: BLOCKED ha tang — lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.»

### Baseline khong do

- cd agent && npm test: BLOCKED ha tang baseline: lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.»

Eval không-phân-biệt: không đo được ở round này (baseline bị chặn hạ tầng).

## Variance

none — every multi-run eval is uniform

## Iterations

Round 1: PASS kèm một finding trong hợp đồng (AC-2, khe giao dịch dở) — trả về implementation.
Round 2: E1, E2, E3 chạy lại trên bản sửa khoá cả cặp trong câu ghi; E4, E5 carry-forward từ round 1; tất cả PASS.

### Re-pin lần 1 — 2026-10-30, do eval bị thay bởi khoa-phuong-chung-phuong-so (P.12 = Phường 12)
run_id: repin-20261030T164739Z-87521
sha: 97f6a455c7cd852ba85f33a9bf7558d419478621 · suites: 6 lệnh exit 0 · evals: 4/4 eval máy đạt kỳ vọng · không chạy theo hồ sơ: E4 · thay bởi hồ sơ đã ký: E4→khoa-phuong-chung-phuong-so#AC-2 · AC không có chốt máy: AC-4
