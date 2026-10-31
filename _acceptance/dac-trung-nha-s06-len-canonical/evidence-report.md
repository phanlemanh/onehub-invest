---
schema_version: 2
feature_slug: dac-trung-nha-s06-len-canonical
verdict: REJECT
failed_evals: ["E1","E4","E5","E6","E7","E8","E9b"]
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: e298ef24bf64268d4ec2246e585e200474182430
human_signoff:
---

# Evidence Report: dac-trung-nha-s06-len-canonical

Round 1. Bảy eval trượt vì cùng một lệnh script (DB thử oneinvest_p1_n3) dừng ở bộ test trang-thai-chao.itest với lỗi deadlock detected (mã 40P01) ở ca AC-4 và một ca assert «apply_enrichment phải ghi observed_at» không khớp. Lệnh này gộp E1, E4, E5, E6, E7, E8, E9b nên cả bảy cùng đỏ. Ngoài ra lệnh suite `cd app && npm test` cũng đỏ (không gắn eval).

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | script | FAIL |
| E2 | AC-2 | script | PASS |
| E3 | AC-3 | test | PASS |
| E4 | AC-4 | script | FAIL |
| E5 | AC-5 | script | FAIL |
| E6 | AC-6 | script | FAIL |
| E7 | AC-7 | script | FAIL |
| E8 | AC-8 | script | FAIL |
| E9 | AC-9 | test | PASS |
| E9b | AC-9 | script | FAIL |

## Evidence

- eval: E1
  run_id: minted-dac-trung-nha-s06-len-canonical-E1-r1
  exit_code: 1
  baseline: n-a
  verifier: config:executors.script.dac_trung_s06_that
  verified_at: 2026-10-31T01:22:10Z
  output: |
    Lệnh gộp (dac-trung-s06.itest, trang-thai-chao.itest, do-dac-trung-s06) dừng ở trang-thai-chao.itest.
    AC-4 bộ ghi bằng chứng năm dạng: error deadlock detected (code 40P01, deadlock.c).
    Ca assert rejects: kỳ vọng /apply_enrichment phải ghi observed_at/ không khớp.
    db-thu: đã xoá oneinvest_p1_n3

- eval: E2
  run_id: minted-dac-trung-nha-s06-len-canonical-E2-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.dac_trung_s06_vocab
  verified_at: 2026-10-31T01:22:10Z
  output: |
    vocab --check, vocab --lint và dac-trung-s06-vocab-db trên DB thử oneinvest_p1_n4 đều xong.
    db-thu: đã xoá oneinvest_p1_n4

- eval: E3
  run_id: minted-dac-trung-nha-s06-len-canonical-E3-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.pipeline
  verified_at: 2026-10-31T01:22:10Z
  output: |
    cd pipeline && npm test xong, bộ test pipeline xanh (duration_ms 71704).

- eval: E4
  run_id: minted-dac-trung-nha-s06-len-canonical-E4-r1
  exit_code: 1
  baseline: n-a
  verifier: config:executors.script.dac_trung_s06_that
  verified_at: 2026-10-31T01:22:10Z
  output: |
    Cùng lệnh gộp với E1: dừng ở trang-thai-chao.itest (deadlock detected, code 40P01).

- eval: E5
  run_id: minted-dac-trung-nha-s06-len-canonical-E5-r1
  exit_code: 1
  baseline: n-a
  verifier: config:executors.script.dac_trung_s06_that
  verified_at: 2026-10-31T01:22:10Z
  output: |
    Cùng lệnh gộp với E1: dừng ở trang-thai-chao.itest (deadlock detected, code 40P01).

- eval: E6
  run_id: minted-dac-trung-nha-s06-len-canonical-E6-r1
  exit_code: 1
  baseline: n-a
  verifier: config:executors.script.dac_trung_s06_that
  verified_at: 2026-10-31T01:22:10Z
  output: |
    Cùng lệnh gộp với E1: dừng ở trang-thai-chao.itest (deadlock detected, code 40P01).

- eval: E7
  run_id: minted-dac-trung-nha-s06-len-canonical-E7-r1
  exit_code: 1
  baseline: n-a
  verifier: config:executors.script.dac_trung_s06_that
  verified_at: 2026-10-31T01:22:10Z
  output: |
    Cùng lệnh gộp với E1: dừng ở trang-thai-chao.itest, do-dac-trung-s06 không chạy tới.

- eval: E8
  run_id: minted-dac-trung-nha-s06-len-canonical-E8-r1
  exit_code: 1
  baseline: n-a
  verifier: config:executors.script.dac_trung_s06_that
  verified_at: 2026-10-31T01:22:10Z
  output: |
    Cùng lệnh gộp với E1: dừng ở trang-thai-chao.itest (deadlock detected, code 40P01).

- eval: E9
  run_id: minted-dac-trung-nha-s06-len-canonical-E9-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.pipeline
  verified_at: 2026-10-31T01:22:10Z
  output: |
    cd pipeline && npm test xong, toàn bộ bộ test pipeline xanh.

- eval: E9b
  run_id: minted-dac-trung-nha-s06-len-canonical-E9b-r1
  exit_code: 1
  baseline: n-a
  verifier: config:executors.script.dac_trung_s06_that
  verified_at: 2026-10-31T01:22:10Z
  output: |
    Ca DB trạng thái chào của 059 (trang-thai-chao.itest) trượt: deadlock detected (code 40P01) ở AC-4,
    và ca assert rejects «apply_enrichment phải ghi observed_at» không khớp.

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-dac-trung-nha-s06-len-canonical-SUITE-npm_test__bb6271-r1
  exit_code: 0
  verified_at: 2026-10-31T01:22:10Z

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-dac-trung-nha-s06-len-canonical-SUITE-lint-r1
  exit_code: 0
  verified_at: 2026-10-31T01:22:10Z

- cmd: cd app && npm test
  run_id: minted-dac-trung-nha-s06-len-canonical-SUITE-npm_test__bd9a35-r1
  exit_code: 1
  verified_at: 2026-10-31T01:22:10Z
  note: lệnh không gắn eval. Ca ON12-AC-5 (tests/ops-nhan-theo-context.test.tsx) báo «dòng kiểm chưa diễn giải» với 15 dòng danh-ba-sdt:n1..n5 chưa có nhãn.

- cmd: cd app && npm run test:lint-rules
  run_id: minted-dac-trung-nha-s06-len-canonical-SUITE-test_lint_rules-r1
  exit_code: 0
  verified_at: 2026-10-31T01:22:10Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-dac-trung-nha-s06-len-canonical-SUITE-node_scripts_check_portal_compliance_mjs-r1
  exit_code: 0
  verified_at: 2026-10-31T01:22:10Z

## Known limits

## Ngoài hợp đồng

## Analyst

baseline: BLOCKED ha tang — lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.»

Danh sách eval không-phân-biệt không đo được ở round này vì baseline bị chặn hạ tầng.

Baseline khong do:
- bash db/db-thu.sh oneinvest_p1_n3 && cd pipeline && DATABASE_URL=postgres://oneinvest:oneinvest@localhost:5433/oneinvest_p1_n3 node --test scripts/dac-trung-s06.itest.mjs scripts/trang-thai-chao.itest.mjs && DATABASE_URL=postgres://oneinvest:oneinvest@localhost:5433/oneinvest_p1_n3 node scripts/do-dac-trung-s06.mjs; r=$?; cd .. && bash db/db-thu.sh oneinvest_p1_n3 --xoa; exit $r: BLOCKED ha tang baseline: lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.»
- bash db/db-thu.sh oneinvest_p1_n4 && cd pipeline && node vocab.mjs --check && node vocab.mjs --lint && DATABASE_URL=postgres://oneinvest:oneinvest@localhost:5433/oneinvest_p1_n4 node scripts/dac-trung-s06-vocab-db.mjs; r=$?; cd .. && bash db/db-thu.sh oneinvest_p1_n4 --xoa; exit $r: BLOCKED ha tang baseline: lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.»
- cd pipeline && npm test: BLOCKED ha tang baseline: lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.»

## Variance

none — mọi eval chạy một lần (runs 1), không có eval nhiều lần.

## Iterations

Round 1: E1, E4, E5, E6, E7, E8, E9b failed — cùng một lệnh script gộp dừng ở trang-thai-chao.itest (deadlock detected trên DB thử, và ca assert apply_enrichment phải ghi observed_at không khớp); lệnh suite app npm test cũng đỏ ở ca ON12-AC-5. Returned to implementation.
