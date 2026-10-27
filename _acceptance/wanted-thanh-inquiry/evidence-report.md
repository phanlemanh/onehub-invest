---
schema_version: 2
feature_slug: wanted-thanh-inquiry
verdict: PASS
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 6f4361eb7874693e5c524b8fec802aa4685800af
human_signoff:
---

# Evidence Report: wanted-thanh-inquiry

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | test | PASS |
| E2 | AC-2 | script | PASS |
| E2b | AC-2 | script | PASS |
| E3 | AC-3 | script | PASS |
| E4 | AC-4 | script | PASS |
| E5 | AC-5 | script | PASS |
| E6 | AC-6 | script | PASS |
| E6b | AC-6 | script | PASS |
| E7 | AC-7 | test | PASS |
| E7b | AC-7 | script | PASS |

## Evidence

- eval: E1
  run_id: minted-wanted-thanh-inquiry-E1-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.vocab
  verified_at: 2026-10-27T01:32:03Z
  output: |
    cmd: cd pipeline && node --test scripts/vocab.test.mjs scripts/vocab-lint.test.mjs
    ℹ duration_ms 1067.610875

- eval: E2
  run_id: minted-wanted-thanh-inquiry-E2-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.vocab_check
  verified_at: 2026-10-27T01:32:03Z
  output: |
    cmd: node pipeline/vocab.mjs --check
    vocab --check: 4/4 đích khớp sổ

- eval: E2b
  run_id: minted-wanted-thanh-inquiry-E2b-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.ten_cu_inquiry
  verified_at: 2026-10-27T01:32:03Z
  output: |
    cmd: node _acceptance/wanted-thanh-inquiry/rang/con-ten-cu.mjs
    đối chứng: 6/6 dạng cấy → 1 đỏ mỗi ca · biến và dòng đổi tên → 0 · catchup bỏ UPDATE → thiếu 1/1

- eval: E3
  run_id: minted-wanted-thanh-inquiry-E3-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.vocab_db_rieng
  verified_at: 2026-10-27T01:32:03Z
  output: |
    cmd: node _acceptance/wanted-thanh-inquiry/rang/db-rieng.mjs
    db riêng: rào tên từ chối 2/2 · không còn DB tạm · DB oneinvest không đổi

- eval: E4
  run_id: minted-wanted-thanh-inquiry-E4-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.ten_cu_inquiry
  verified_at: 2026-10-27T01:32:03Z
  output: |
    cmd: node _acceptance/wanted-thanh-inquiry/rang/con-ten-cu.mjs
    đối chứng: 6/6 dạng cấy → 1 đỏ mỗi ca · biến và dòng đổi tên → 0 · catchup bỏ UPDATE → thiếu 1/1

- eval: E5
  run_id: minted-wanted-thanh-inquiry-E5-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.ten_cu_inquiry
  verified_at: 2026-10-27T01:32:03Z
  output: |
    cmd: node _acceptance/wanted-thanh-inquiry/rang/con-ten-cu.mjs
    đối chứng: 6/6 dạng cấy → 1 đỏ mỗi ca · biến và dòng đổi tên → 0 · catchup bỏ UPDATE → thiếu 1/1

- eval: E6
  run_id: minted-wanted-thanh-inquiry-E6-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.cloud_catchup_inquiry
  verified_at: 2026-10-27T01:32:03Z
  output: |
    cmd: node scripts/check-cloud-catchup.mjs wanted-thanh-inquiry
    check-cloud-catchup wanted-thanh-inquiry: 1 tệp · 0 vi phạm

- eval: E6b
  run_id: minted-wanted-thanh-inquiry-E6b-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.ten_cu_inquiry
  verified_at: 2026-10-27T01:32:03Z
  output: |
    cmd: node _acceptance/wanted-thanh-inquiry/rang/con-ten-cu.mjs
    đối chứng: 6/6 dạng cấy → 1 đỏ mỗi ca · biến và dòng đổi tên → 0 · catchup bỏ UPDATE → thiếu 1/1

- eval: E7
  run_id: minted-wanted-thanh-inquiry-E7-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.tu_ngu_collections
  verified_at: 2026-10-27T01:32:03Z
  output: |
    cmd: cd app && node --import tsx --test tests/tu-ngu-collections.test.tsx
    ℹ duration_ms 460.228625

- eval: E7b
  run_id: minted-wanted-thanh-inquiry-E7b-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.fixture_goc_inquiry
  verified_at: 2026-10-27T01:32:03Z
  output: |
    cmd: node _acceptance/wanted-thanh-inquiry/rang/fixture-goc.mjs
    đối chứng: bản sao đổi một ký tự → lệch bản chụp (đúng)

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-wanted-thanh-inquiry-SUITE-npm_test__bb6271-r1
  exit_code: 0
  verified_at: 2026-10-27T01:32:03Z

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-wanted-thanh-inquiry-SUITE-lint-r1
  exit_code: 0
  verified_at: 2026-10-27T01:32:03Z

- cmd: cd app && npm test
  run_id: minted-wanted-thanh-inquiry-SUITE-npm_test__bd9a35-r1
  exit_code: 0
  verified_at: 2026-10-27T01:32:03Z

- cmd: cd pipeline && npm test
  run_id: minted-wanted-thanh-inquiry-SUITE-npm_test__13563d-r1
  exit_code: 0
  verified_at: 2026-10-27T01:32:03Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-wanted-thanh-inquiry-SUITE-test_lint_rules-r1
  exit_code: 0
  verified_at: 2026-10-27T01:32:03Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-wanted-thanh-inquiry-SUITE-node_scripts_check_portal_compliance_mjs-r1
  exit_code: 0
  verified_at: 2026-10-27T01:32:03Z

## Known limits

## Ngoài hợp đồng

## Analyst

baseline: BLOCKED ha tang — lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «<\tool_use_error>Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.<\/tool_use_error>»

Mọi field baseline của round này là n-a; danh sách eval không-phân-biệt không đo được ở round này.

### Baseline khong do

- cd pipeline && node --test scripts/vocab.test.mjs scripts/vocab-lint.test.mjs: BLOCKED ha tang baseline: lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «<\tool_use_error>Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.<\/tool_use_error>»
- node pipeline/vocab.mjs --check: BLOCKED ha tang baseline: lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «<\tool_use_error>Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.<\/tool_use_error>»
- node _acceptance/wanted-thanh-inquiry/rang/con-ten-cu.mjs: BLOCKED ha tang baseline: lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «<\tool_use_error>Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.<\/tool_use_error>»
- node _acceptance/wanted-thanh-inquiry/rang/db-rieng.mjs: BLOCKED ha tang baseline: lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «<\tool_use_error>Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.<\/tool_use_error>»
- node scripts/check-cloud-catchup.mjs wanted-thanh-inquiry: BLOCKED ha tang baseline: lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «<\tool_use_error>Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.<\/tool_use_error>»
- cd app && node --import tsx --test tests/tu-ngu-collections.test.tsx: BLOCKED ha tang baseline: lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «<\tool_use_error>Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.<\/tool_use_error>»
- node _acceptance/wanted-thanh-inquiry/rang/fixture-goc.mjs: BLOCKED ha tang baseline: lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «<\tool_use_error>Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.<\/tool_use_error>»

### Eval không-phân-biệt

none (không đo được ở round này: baseline BLOCKED nên không có căn cứ kết luận red hay green cho eval nào)

## Variance

none — every multi-run eval is uniform

## Iterations

Round 1: mọi eval và lệnh suite xanh, không eval nào hỏng. Chưa có vòng trả lại.
