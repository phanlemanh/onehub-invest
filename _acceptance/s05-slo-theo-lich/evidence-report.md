---
schema_version: 2
feature_slug: s05-slo-theo-lich
verdict: PASS
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 8109b9683ac614700e76889b48d3b4915f7b3d40
human_signoff: Mạnh 2026-10-25
---

# Evidence Report: s05-slo-theo-lich

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | test | PASS |
| E2 | AC-2 | test | PASS |
| E3 | AC-3 | test | PASS |
| E4 | AC-4 | test | PASS |
| E5 | AC-5 | test | PASS |
| E6 | AC-6 | test | PASS |

## Evidence

- eval: E1
  run_id: minted-s05-slo-theo-lich-E1-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.s05_slo
  verified_at: 2026-10-25T07:28:00Z
  output: |
    ca S5-AC-1: cli.SLO_HOURS và app.SLO_HOURS deepEqual { S01: 192, S02: 840, S03: 72, S05: 96, S06: 36 }
    ℹ duration_ms 99.483875

- eval: E2
  run_id: minted-s05-slo-theo-lich-E2-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.s05_slo
  verified_at: 2026-10-25T07:28:00Z
  output: |
    ca S5-AC-2: quét 336 giờ theo lịch thứ Ba + thứ Sáu 06:00, S05 luôn fresh ở cả hai bản, tuổi lớn nhất gặp 96
    đối chứng bản sao đột biến S05 12 trả stale từ 168 giờ
    ℹ duration_ms 99.483875

- eval: E3
  run_id: minted-s05-slo-theo-lich-E3-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.s05_slo
  verified_at: 2026-10-25T07:28:00Z
  output: |
    ca S5-AC-3: 96 giờ, 96 giờ 59 phút, 97 giờ cho fresh, fresh, stale ở cả hai bản
    describe(hàng 97 giờ) và fmtOverdue/fmtAge của app khớp kỳ vọng
    ℹ duration_ms 99.483875

- eval: E4
  run_id: minted-s05-slo-theo-lich-E4-r1
  exit_code: 0
  verifier: config:executors.test.freshness_parity
  verified_at: 2026-10-25T07:22:40Z
  carried_from_round: 1
  output: |
    carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E5
  run_id: minted-s05-slo-theo-lich-E5-r1
  exit_code: 0
  verifier: config:executors.test.check_freshness
  verified_at: 2026-10-25T07:22:40Z
  carried_from_round: 1
  output: |
    carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E6
  run_id: minted-s05-slo-theo-lich-E6-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.s05_slo
  verified_at: 2026-10-25T07:28:00Z
  output: |
    ca S5-AC-6: quét 6 loại tệp theo ma trận 4 dạng ghi SLO S05, chỉ hai bản chép ghi S05: 96; đối chứng mẫu giả 12 bị bắt 4/4
    ℹ duration_ms 99.483875

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-s05-slo-theo-lich-SUITE-npm_test__bb6271-r2
  exit_code: 0
  verified_at: 2026-10-25T07:28:00Z

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-s05-slo-theo-lich-SUITE-lint-r2
  exit_code: 0
  verified_at: 2026-10-25T07:28:00Z

- cmd: cd app && npm test
  run_id: minted-s05-slo-theo-lich-SUITE-npm_test__bd9a35-r2
  exit_code: 0
  verified_at: 2026-10-25T07:28:00Z

- cmd: cd pipeline && npm test
  run_id: minted-s05-slo-theo-lich-SUITE-npm_test__13563d-r2
  exit_code: 0
  verified_at: 2026-10-25T07:28:00Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-s05-slo-theo-lich-SUITE-test_lint_rules-r2
  exit_code: 0
  verified_at: 2026-10-25T07:28:00Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-s05-slo-theo-lich-SUITE-node_scripts_check_portal_compliance_mjs-r2
  exit_code: 0
  verified_at: 2026-10-25T07:28:00Z

## Known limits

## Ngoài hợp đồng

## Analyst

none — moi eval feature deu red tren baseline (co phan biet)

Baseline khong do:

- node --test scripts/s05-slo.test.mjs: bo qua baseline: tep scripts/s05-slo.test.mjs co o cay dang kiem nhung chua co o merge-base e962e783a2f3ecb0d0da0ac8852c8598b06f46f0 — eval moi, chay tren code cu khong phan biet gi

## Variance

none — every multi-run eval is uniform

## Iterations

Round 1: E1, E2, E3, E4, E5, E6 đều xanh; không eval nào đỏ; 3 finding trong hợp đồng (AC-3, AC-6) được sửa ở các commit sau.
Round 2: E1, E2, E3, E6 chạy lại trên 8109b9683ac614700e76889b48d3b4915f7b3d40 và xanh; E4, E5 carry-forward từ round 1 vì delta không chạm paths của chúng; 6 lệnh suite xanh.
