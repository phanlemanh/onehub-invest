---
schema_version: 2
feature_slug: khoa-phuong-chung-phuong-so
verdict: REJECT
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 9ce5bb1f180fe6a287c5120b4bebc2cd55a1d831
human_signoff:
---

# Evidence Report: khoa-phuong-chung-phuong-so

Vòng 1. Cả năm eval của hợp đồng (E1 đến E5) đều xanh. Verdict REJECT vì lệnh suite hồi quy `cd app && npm test` chạy đỏ (2 ca probe DB local, xem mục Lệnh suite); lệnh này không gắn eval nào nên `failed_evals` để trống.

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | test | PASS |
| E2 | AC-2 | test | PASS |
| E3 | AC-3 | test | PASS |
| E4 | AC-4 | test | PASS |
| E5 | AC-4 | test | PASS |

## Evidence

- eval: E1
  run_id: minted-khoa-phuong-chung-phuong-so-E1-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.the_duyet_phuong
  verified_at: 2026-10-30T16:01:55Z
  output: |
    cd app && node --import tsx --test tests/the-duyet-phuong-lech-gia.test.tsx
    ℹ duration_ms 1443.525167

- eval: E4
  run_id: minted-khoa-phuong-chung-phuong-so-E4-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.the_duyet_phuong
  verified_at: 2026-10-30T16:01:55Z
  output: |
    cd app && node --import tsx --test tests/the-duyet-phuong-lech-gia.test.tsx
    ℹ duration_ms 1443.525167

- eval: E2
  run_id: minted-khoa-phuong-chung-phuong-so-E2-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.agent
  verified_at: 2026-10-30T16:01:55Z
  output: |
    cd agent && npm test
    ℹ duration_ms 4874.227666

- eval: E3
  run_id: minted-khoa-phuong-chung-phuong-so-E3-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.agent
  verified_at: 2026-10-30T16:01:55Z
  output: |
    cd agent && npm test
    ℹ duration_ms 4874.227666

- eval: E5
  run_id: minted-khoa-phuong-chung-phuong-so-E5-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.agent
  verified_at: 2026-10-30T16:01:55Z
  output: |
    cd agent && npm test
    ℹ duration_ms 4874.227666

### Lệnh suite (hồi quy)

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-khoa-phuong-chung-phuong-so-SUITE-lint-r1
  exit_code: 0
  verified_at: 2026-10-30T16:01:55Z

- cmd: cd app && npm test
  run_id: minted-khoa-phuong-chung-phuong-so-SUITE-npm_test__bd9a35-r1
  exit_code: 1
  verified_at: 2026-10-30T16:01:55Z
  output: |
    650 ca, 648 qua, 2 hỏng.
    Ca hỏng 1: tests/the-duyet-du-can-cu.test.tsx, «TD-AC-3 probe: thẻ chờ có bài gốc ở stg» — «không thẻ chờ nào có tin trong sale_offers — probe không đo được».
    Ca hỏng 2: tests/the-duyet-du-can-cu.test.tsx, «TD-AC-4 probe DB local thật» — «không thẻ chờ nào có tin — probe không đo được».
    Cả hai là probe đọc DB local trong worktree; lỗi do DB không có thẻ chờ kèm tin, không chạm hàm khoá phường.

- cmd: cd pipeline && npm test
  run_id: minted-khoa-phuong-chung-phuong-so-SUITE-npm_test__13563d-r1
  exit_code: 0
  verified_at: 2026-10-30T16:01:55Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-khoa-phuong-chung-phuong-so-SUITE-test_lint_rules-r1
  exit_code: 0
  verified_at: 2026-10-30T16:01:55Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-khoa-phuong-chung-phuong-so-SUITE-node_scripts_check_portal_compliance_mjs-r1
  exit_code: 0
  verified_at: 2026-10-30T16:01:55Z

## Known limits

## Ngoài hợp đồng

## Analyst

baseline: BLOCKED ha tang — lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.»

Baseline khong do:
- cd app && node --import tsx --test tests/the-duyet-phuong-lech-gia.test.tsx: BLOCKED ha tang baseline: lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.»
- cd agent && npm test: BLOCKED ha tang baseline: lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.»

none — moi eval feature deu red tren baseline (co phan biet). Lưu ý: dòng này không đo được ở vòng này vì baseline bị chặn hạ tầng; danh sách eval không-phân-biệt không xác định được.

Lệnh suite không gắn eval: `cd app && npm test` chạy đỏ ở hai probe DB local (TD-AC-3, TD-AC-4 của tests/the-duyet-du-can-cu.test.tsx).

## Variance

none — every multi-run eval is uniform

## Iterations

Round 1: E1 đến E5 đều xanh; lệnh suite `cd app && npm test` đỏ ở hai probe DB local không gắn eval (TD-AC-3, TD-AC-4: DB không có thẻ chờ kèm tin). Verdict REJECT, trả lại cho khâu triển khai/người xem xét. Hai finding ngoài hợp đồng (E2 mô tả sai cách nạp bản chép; khoá-chỉ-số bỏ hẳn làm Khớp rộng hơn «P.12» = «Phường 12») xem review-findings.md. Không có judgment panel nào.
