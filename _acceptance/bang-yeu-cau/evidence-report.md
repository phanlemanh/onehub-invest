---
schema_version: 2
feature_slug: bang-yeu-cau
verdict: REJECT
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: ec485fa5156b97b4480921a12782171564ca3d47
human_signoff:
---

# Evidence Report: bang-yeu-cau

Round 1. Cả 12 eval máy đều xanh. Tổng thể là REJECT vì một lệnh suite hồi quy không gắn eval nào (`cd app && npm test`) đỏ ở ca ON12-AC-5. Lệnh này nằm ngoài danh sách eval nên `failed_evals` để trống; chi tiết ở mục «Lệnh suite (hồi quy)».

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | script | PASS |
| E2 | AC-2 | script | PASS |
| E2b | AC-2 | test | PASS |
| E3 | AC-3 | test | PASS |
| E4 | AC-4 | script | PASS |
| E5 | AC-5 | script | PASS |
| E6 | AC-6 | script | PASS |
| E7 | AC-7 | script | PASS |
| E8 | AC-8 | script | PASS |
| E9 | AC-9 | script | PASS |
| E10 | AC-10 | test | PASS |
| E10b | AC-10 | script | PASS |

## Evidence

Nhóm A: lệnh `bash db/db-thu.sh oneinvest_p1_n1 && cd pipeline && DATABASE_URL=postgres://oneinvest:oneinvest@localhost:5433/oneinvest_p1_n1 node --test scripts/yeu-cau.itest.mjs scripts/kev-phat-bieu.itest.mjs scripts/phat-bieu-db.itest.mjs && DATABASE_URL=postgres://oneinvest:oneinvest@localhost:5433/oneinvest_p1_n1 node scripts/do-yeu-cau.mjs` phủ E1, E4, E5, E6, E7, E8, E9, E10b (một lần chạy, một kết quả chung).

- eval: E1
  run_id: minted-bang-yeu-cau-E1-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.yeu_cau_that
  verified_at: 2026-10-30T11:20:45Z
  output: |
    do-yeu-cau: xanh

- eval: E4
  run_id: minted-bang-yeu-cau-E4-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.yeu_cau_that
  verified_at: 2026-10-30T11:20:45Z
  output: |
    do-yeu-cau: xanh

- eval: E5
  run_id: minted-bang-yeu-cau-E5-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.yeu_cau_that
  verified_at: 2026-10-30T11:20:45Z
  output: |
    do-yeu-cau: xanh

- eval: E6
  run_id: minted-bang-yeu-cau-E6-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.yeu_cau_that
  verified_at: 2026-10-30T11:20:45Z
  output: |
    do-yeu-cau: xanh

- eval: E7
  run_id: minted-bang-yeu-cau-E7-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.yeu_cau_that
  verified_at: 2026-10-30T11:20:45Z
  output: |
    do-yeu-cau: xanh

- eval: E8
  run_id: minted-bang-yeu-cau-E8-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.yeu_cau_that
  verified_at: 2026-10-30T11:20:45Z
  output: |
    do-yeu-cau: xanh

- eval: E9
  run_id: minted-bang-yeu-cau-E9-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.yeu_cau_that
  verified_at: 2026-10-30T11:20:45Z
  output: |
    do-yeu-cau: xanh

- eval: E10b
  run_id: minted-bang-yeu-cau-E10b-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.yeu_cau_that
  verified_at: 2026-10-30T11:20:45Z
  output: |
    do-yeu-cau: xanh

Nhóm B: lệnh `bash db/db-thu.sh oneinvest_p1_n2 && cd pipeline && node vocab.mjs --check && node vocab.mjs --lint && DATABASE_URL=postgres://oneinvest:oneinvest@localhost:5433/oneinvest_p1_n2 node scripts/yeu-cau-vocab-db.mjs; r=$?; cd .. && bash db/db-thu.sh oneinvest_p1_n2 --xoa; exit $r` phủ E2.

- eval: E2
  run_id: minted-bang-yeu-cau-E2-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.yeu_cau_vocab
  verified_at: 2026-10-30T11:20:45Z
  output: |
    db-thu: đã xoá oneinvest_p1_n2

Nhóm C: lệnh `cd pipeline && npm test` phủ E2b, E3, E10.

- eval: E2b
  run_id: minted-bang-yeu-cau-E2b-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.pipeline
  verified_at: 2026-10-30T11:20:45Z
  output: |
    ℹ duration_ms 54140.493542

- eval: E3
  run_id: minted-bang-yeu-cau-E3-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.pipeline
  verified_at: 2026-10-30T11:20:45Z
  output: |
    ℹ duration_ms 54140.493542

- eval: E10
  run_id: minted-bang-yeu-cau-E10-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.pipeline
  verified_at: 2026-10-30T11:20:45Z
  output: |
    ℹ duration_ms 54140.493542

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-bang-yeu-cau-SUITE-npm_test__bb6271-r1
  exit_code: 0
  verified_at: 2026-10-30T11:20:45Z

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-bang-yeu-cau-SUITE-lint-r1
  exit_code: 0
  verified_at: 2026-10-30T11:20:45Z

- cmd: cd app && npm test
  run_id: minted-bang-yeu-cau-SUITE-npm_test__bd9a35-r1
  exit_code: 1
  verified_at: 2026-10-30T11:20:45Z
  output: |
    tests 606, pass 605, fail 1
    ca đỏ duy nhất: tests/ops-nhan-theo-context.test.tsx — ON12-AC-5 bảng kiểm chất lượng trên DB local diễn giải đủ
    thông báo: «dòng kiểm chưa diễn giải»; kỳ vọng danh sách rỗng, thực tế có 5 dòng:
      enrich:proposal-assertion · enrich:proposal-assertion
      enrich:proposal-assertion · enrichment_proposals
      enrich:proposal-assertion · applied=0 missing=0
      data-level:distribution · data-level:distribution
      data-level:distribution · units=26781 B0=913 B1=5 B2=25863 B3=0 B4=0 B5=0

- cmd: cd app && npm run test:lint-rules
  run_id: minted-bang-yeu-cau-SUITE-test_lint_rules-r1
  exit_code: 0
  verified_at: 2026-10-30T11:20:45Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-bang-yeu-cau-SUITE-node_scripts_check_portal_compliance_mjs-r1
  exit_code: 0
  verified_at: 2026-10-30T11:20:45Z

Lệnh fail không gắn eval: `cd app && npm test` (không eval nào khai lệnh này). Ca đỏ là ON12-AC-5 trong `app/tests/ops-nhan-theo-context.test.tsx`, đọc bảng kiểm chất lượng trên DB local (các dòng `enrich:proposal-assertion` và `data-level:distribution`). Báo cáo này không quy nó cho thay đổi nào của bang-yeu-cau; người quyết xem ở Cổng 2 hoặc trả về triển khai để xác định nguồn gốc.

## Known limits

## Ngoài hợp đồng

## Analyst

baseline: BLOCKED ha tang — lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.»

Danh sách eval không-phân-biệt (xanh cả trên HEAD lẫn baseline) không đo được ở round này vì baseline không chạy; mọi field baseline ghi n-a.

Baseline khong do:
- bash db/db-thu.sh oneinvest_p1_n1 && cd pipeline && DATABASE_URL=postgres://oneinvest:oneinvest@localhost:5433/oneinvest_p1_n1 node --test scripts/yeu-cau.itest.mjs scripts/kev-phat-bieu.itest.mjs scripts/phat-bieu-db.itest.mjs && DATABASE_URL=postgres://oneinvest:oneinvest@localhost:5433/oneinvest_p1_n1 node scripts/do-yeu-cau.mjs: BLOCKED ha tang baseline: lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.»
- bash db/db-thu.sh oneinvest_p1_n2 && cd pipeline && node vocab.mjs --check && node vocab.mjs --lint && DATABASE_URL=postgres://oneinvest:oneinvest@localhost:5433/oneinvest_p1_n2 node scripts/yeu-cau-vocab-db.mjs; r=$?; cd .. && bash db/db-thu.sh oneinvest_p1_n2 --xoa; exit $r: BLOCKED ha tang baseline: lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.»
- cd pipeline && npm test: BLOCKED ha tang baseline: lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.»

## Variance

none — mọi eval chạy một lần (deterministic), kết quả đồng nhất; không eval nào có pass_rate lẫn.

## Iterations

Round 1: 12 eval máy đều xanh; lệnh suite `cd app && npm test` đỏ ở ca ON12-AC-5 (không gắn eval nào). Trả về triển khai.
