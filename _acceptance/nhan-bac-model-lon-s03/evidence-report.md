---
schema_version: 2
feature_slug: nhan-bac-model-lon-s03
verdict: PASS
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: b752410505bfd2746ec78269fe8691ddfcedec06
human_signoff: Mạnh 2026-11-01
---

# Evidence Report: nhan-bac-model-lon-s03

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | test | PASS (carried từ round 1) |
| E2 | AC-2 | test | PASS |
| E3 | AC-3 | test | PASS |
| E4 | AC-4 | test | PASS |
| E5 | AC-5 | test | PASS |
| E6 | AC-6 | test | PASS |
| E7 | AC-7 | test | PASS |
| E8 | AC-8 | test | PASS |
| E9 | AC-9 | test | PASS |
| E10 | AC-10 | judgment | đề xuất PASS — chờ người quyết ở Cổng 2 |

## Evidence

- eval: E1
  run_id: minted-nhan-bac-model-lon-s03-E1-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.nhan_bac_db
  verified_at: 2026-11-01T01:09:21Z
  carried_from_round: 1
  output: |
    carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E2
  run_id: minted-nhan-bac-model-lon-s03-E2-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.nhan_bac_db
  verified_at: 2026-11-01T02:11:36Z
  output: |
    cd agent && node --import tsx --test tests/nhan-bac-s03-db.itest.ts
    ℹ duration_ms 6798.423458

- eval: E3
  run_id: minted-nhan-bac-model-lon-s03-E3-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.nhan_bac_db
  verified_at: 2026-11-01T02:11:36Z
  output: |
    cd agent && node --import tsx --test tests/nhan-bac-s03-db.itest.ts
    ℹ duration_ms 6798.423458

- eval: E4
  run_id: minted-nhan-bac-model-lon-s03-E4-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.nhan_bac
  verified_at: 2026-11-01T02:11:36Z
  output: |
    cd agent && node --import tsx --test tests/nhan-bac-s03.test.ts
    ℹ duration_ms 272.369375

- eval: E5
  run_id: minted-nhan-bac-model-lon-s03-E5-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.nhan_bac
  verified_at: 2026-11-01T02:11:36Z
  output: |
    cd agent && node --import tsx --test tests/nhan-bac-s03.test.ts
    ℹ duration_ms 272.369375

- eval: E6
  run_id: minted-nhan-bac-model-lon-s03-E6-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.nhan_bac
  verified_at: 2026-11-01T02:11:36Z
  output: |
    cd agent && node --import tsx --test tests/nhan-bac-s03.test.ts
    ℹ duration_ms 272.369375

- eval: E7
  run_id: minted-nhan-bac-model-lon-s03-E7-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.nhan_bac
  verified_at: 2026-11-01T02:11:36Z
  output: |
    cd agent && node --import tsx --test tests/nhan-bac-s03.test.ts
    ℹ duration_ms 272.369375

- eval: E8
  run_id: minted-nhan-bac-model-lon-s03-E8-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.nhan_bac
  verified_at: 2026-11-01T02:11:36Z
  output: |
    cd agent && node --import tsx --test tests/nhan-bac-s03.test.ts
    ℹ duration_ms 272.369375

- eval: E9
  run_id: minted-nhan-bac-model-lon-s03-E9-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.nhan_bac
  verified_at: 2026-11-01T02:11:36Z
  output: |
    cd agent && node --import tsx --test tests/nhan-bac-s03.test.ts
    ℹ duration_ms 272.369375

### Judgment

- eval: E10
  judged_by: judge-subagent (fresh context), panel đề xuất: domain-correctness, operational-feasibility, spec-alignment
  verdict: PASS
  rationale: Cả ba backend (Qwen, Haiku 5.5, Decisions) cùng ghi băm 9f1ee427822a3f7c; bảng đủ cột và các ô đạt/không khớp số đã tính lại đúng (59/61, 31/34, 57/61, 32/34; chi phí hết bài cũ ~6,04 và ~1,62 USD, lệch do làm tròn, đều dưới 10 USD). Tệp không có chữ bài nguyên văn hay số điện thoại.
  votes:
    - domain-correctness: PASS — Ba backend cùng băm; Qwen 100% và 97% đạt; Haiku 93% và 94% không đạt, ~6,07 USD đạt; Decisions 97% đạt, 91% không đạt, ~1,61 USD đạt; phép tính và cách ước chi phí ×38000/61 đúng; tệp chỉ có số liệu và post_id.
    - operational-feasibility: PASS — Đủ ba backend, băm 16 ký tự hex, đủ cột; tổng 19+15=34 và 34+11+16=61 khớp; chi phí hết bài cũ tính lại vẫn không quá 10 USD; tệp không chép chữ bài nào.
    - spec-alignment: PASS — Cùng băm, đủ cột; Decisions ghi "—" ở trích giả vì backend này không trích và tệp có nói rõ; phần trăm và chi phí tính lại khớp bảng.
  human_override: Đạt — Mạnh 2026-11-01

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-nhan-bac-model-lon-s03-SUITE-npm_test__bb6271-r2
  exit_code: 0
  verified_at: 2026-11-01T02:11:36Z

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-nhan-bac-model-lon-s03-SUITE-lint-r2
  exit_code: 0
  verified_at: 2026-11-01T02:11:36Z

- cmd: cd app && npm test
  run_id: minted-nhan-bac-model-lon-s03-SUITE-npm_test__bd9a35-r2
  exit_code: 0
  verified_at: 2026-11-01T02:11:36Z

- cmd: cd pipeline && npm test
  run_id: minted-nhan-bac-model-lon-s03-SUITE-npm_test__13563d-r2
  exit_code: 0
  verified_at: 2026-11-01T02:11:36Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-nhan-bac-model-lon-s03-SUITE-test_lint_rules-r2
  exit_code: 0
  verified_at: 2026-11-01T02:11:36Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-nhan-bac-model-lon-s03-SUITE-node_scripts_check_portal_compliance_mjs-r2
  exit_code: 0
  verified_at: 2026-11-01T02:11:36Z

## Known limits

## Ngoài hợp đồng

## Analyst

carried tu round 1 — baseline khong do lai round nay

Không có eval nào pass trên cả HEAD lẫn baseline cần liệt kê (baseline: n-a cho mọi eval round này).

## Variance

none — every multi-run eval is uniform

## Iterations

Round 1: E1 pass (carry-forward sang round 2).
Round 2: E2–E9 pass; E10 đề xuất PASS, chờ người quyết ở Cổng 2 (PENDING-JUDGMENT).
