---
schema_version: 2
feature_slug: test-suite-db-thu
verdict: REJECT
failed_evals: ["E5","E6"]
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 8f90502a29aa037040fc728b8f5eb2997b3e0144
human_signoff:
---

# Evidence Report: test-suite-db-thu

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | test | PASS |
| E1b | AC-2 | test | PASS |
| E1c | AC-3 | test | PASS |
| E2 | AC-4 | script | PASS |
| E3 | AC-5 | script | PASS |
| E4 | AC-5 | script | PASS |
| E5 | AC-6 | script | FAIL |
| E6 | AC-6 | script | FAIL |
| E7 | AC-6 | script | PASS |
| E9 | AC-5 | test | PASS |
| E8 | AC-7 | test | PASS |

## Evidence

- eval: E1
  run_id: minted-test-suite-db-thu-E1-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.tsdt_mot
  verified_at: 2026-11-05T14:27:26Z
  output: |
    lệnh: node --test scripts/db-thu.test.mjs (chung với E1b, E1c, E8)
    ℹ duration_ms 5100.429667

- eval: E1b
  run_id: minted-test-suite-db-thu-E1b-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.tsdt_mot
  verified_at: 2026-11-05T14:27:26Z
  output: |
    lệnh: node --test scripts/db-thu.test.mjs (cùng một lượt chạy với E1)
    ℹ duration_ms 5100.429667

- eval: E1c
  run_id: minted-test-suite-db-thu-E1c-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.tsdt_mot
  verified_at: 2026-11-05T14:27:26Z
  output: |
    lệnh: node --test scripts/db-thu.test.mjs (cùng một lượt chạy với E1)
    ℹ duration_ms 5100.429667

- eval: E2
  run_id: minted-test-suite-db-thu-E2-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.tsdt_that
  verified_at: 2026-11-05T14:27:26Z
  output: |
    E2 đạt: oneinvest_suite_thua_62135 ≠ oneinvest_suite_thub_62136; xoá sạch; mẫu khoá kết nối; mồ côi được dọn

- eval: E3
  run_id: minted-test-suite-db-thu-E3-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.tsdt_chung
  verified_at: 2026-11-05T14:27:26Z
  output: |
    che_do chung: ba lượt đều xong (29, 34, 32 giây), deadlock_tren_db_chung 0, mau_cho_khoa 0
    mau_ket_noi_cua_test_toi_db_chung 580 (đối chứng dương có kết nối, đúng yêu cầu > 0)
    (đuôi output bị cắt ở phần ben_ghi)

- eval: E4
  run_id: minted-test-suite-db-thu-E4-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.tsdt_rieng
  verified_at: 2026-11-05T14:27:26Z
  output: |
    che_do rieng: ba lượt đều xong (57, 86, 150 giây), deadlock_tren_db_chung 0, mau_cho_khoa 0
    mau_ket_noi_cua_test_toi_db_chung 0
    (đuôi output bị cắt ở phần mau_ket_noi_toi_db_cua_luot và ben_ghi)

- eval: E5
  run_id: minted-test-suite-db-thu-E5-r1
  exit_code: 1
  baseline: n-a
  verifier: config:executors.script.tsdt_app
  verified_at: 2026-11-05T14:27:26Z
  output: |
    lay-mau app npm test: 11.9 phút; bộ đếm ca không đọc được tổng kết (tests -1)
    ket_noi_db_chung 0, ket_noi_db_khac 2250, moi_db chỉ có oneinvest_suite_app_61663 (thước DB riêng đạt)
    tests/sellers-chip.test.tsx:75 -> withTx -> napSdtE164 (pipeline/lib/nap-060.mjs:16): lỗi Postgres 40P01 (deadlock detected), AccessExclusiveLock chờ nhau giữa hai tiến trình trên DB của lượt
    tests/tin-rao-doi-chieu.test.tsx: E4b đối chiếu DB máy thu đỏ sau 169 giây, AssertionError newest 2430.76 ms (ngưỡng thời gian không đạt)
    lệnh trả mã khác 0 nên điều kiện «mã thoát 0» của E5 không đạt dù ket_noi_db_chung = 0

- eval: E6
  run_id: minted-test-suite-db-thu-E6-r1
  exit_code: 1
  baseline: n-a
  verifier: config:executors.script.tsdt_pipeline
  verified_at: 2026-11-05T14:27:26Z
  output: |
    lay-mau pipeline npm test: 13 phút; tests 572, pass 569, fail 0, cancelled 3, skipped 0
    ket_noi_db_chung 0, ket_noi_db_khac 201, moi_db có oneinvest_suite_pipeline_61036 (thước DB riêng đạt)
    ba ca bị huỷ do quá hạn: scripts/bait-gap-sellers.test.mjs:139 (AC-7 PL2, 120 giây), scripts/deals-phi-ly.test.mjs:148 (DP-AC-2, 120 giây), scripts/luoc-do-rieng.test.mjs:127 (LDR chuỗi ca DDL, 300 giây)
    lệnh trả mã khác 0 nên điều kiện «mã thoát 0» của E6 không đạt
    ghi nhận: cùng lệnh cd pipeline && npm test chạy ở bước suite riêng thì xanh (khối suite bên dưới)

- eval: E7
  run_id: minted-test-suite-db-thu-E7-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.tsdt_agent
  verified_at: 2026-11-05T14:27:26Z
  output: |
    lay-mau agent npm test: 1.9 phút; tests 287, pass 287, fail 0, skipped 0
    ket_noi_db_chung 0, ket_noi_db_khac 95, moi_db có oneinvest_suite_agent_62314

- eval: E9
  run_id: minted-test-suite-db-thu-E9-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.test.sellers_chip
  verified_at: 2026-11-05T14:27:26Z
  output: |
    lệnh: cd app && bash ../db/db-thu.sh oneinvest_suite_sellers_chip --chay node --import tsx --test tests/sellers-chip.test.tsx
    ℹ duration_ms 33844.679458

- eval: E8
  run_id: minted-test-suite-db-thu-E8-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.tsdt_mot
  verified_at: 2026-11-05T14:27:26Z
  output: |
    lệnh: node --test scripts/db-thu.test.mjs (cùng một lượt chạy với E1)
    ℹ duration_ms 5100.429667

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-test-suite-db-thu-SUITE-npm_test__bb6271-r1
  exit_code: 0
  verified_at: 2026-11-05T14:27:26Z

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-test-suite-db-thu-SUITE-lint-r1
  exit_code: 0
  verified_at: 2026-11-05T14:27:26Z

- cmd: cd app && npm test
  run_id: minted-test-suite-db-thu-SUITE-npm_test__bd9a35-r1
  exit_code: 1
  verified_at: 2026-11-05T14:27:26Z
  output: |
    tests/sellers-chip.test.tsx:75 gặp lỗi Postgres 40P01 (deadlock detected) qua napSdtE164 trong pipeline/lib/nap-060.mjs:16
    tests/tin-rao-doi-chieu.test.tsx: E4b đối chiếu DB máy thu đỏ sau 137 giây, AssertionError newest 1081.94 ms
    lệnh này không gắn eval nào; cùng dạng lỗi với E5

- cmd: cd pipeline && npm test
  run_id: minted-test-suite-db-thu-SUITE-npm_test__13563d-r1
  exit_code: 0
  verified_at: 2026-11-05T14:27:26Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-test-suite-db-thu-SUITE-test_lint_rules-r1
  exit_code: 0
  verified_at: 2026-11-05T14:27:26Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-test-suite-db-thu-SUITE-node_scripts_check_portal_compliance_mjs-r1
  exit_code: 0
  verified_at: 2026-11-05T14:27:26Z

## Known limits

## Ngoài hợp đồng

## Analyst

Eval không phân biệt (xanh cả trên HEAD lẫn baseline, chứng minh harness chứ không phải tính năng; nên viết lại để assert hành vi mới hoặc xác nhận là regression-guard có chủ ý):

- cd app && bash ../db/db-thu.sh oneinvest_suite_sellers_chip --chay node --import tsx --test tests/sellers-chip.test.tsx: E9

Baseline khong do

- node --test scripts/db-thu.test.mjs: bo qua baseline: tep scripts/db-thu.test.mjs co o cay dang kiem nhung chua co o merge-base 764861f034c14544417ee6ffe3e0e4fea16f6e3b — eval moi, chay tren code cu khong phan biet gi
- bash _acceptance/test-suite-db-thu/probes/that.sh: bo qua baseline: tep _acceptance/test-suite-db-thu/probes/that.sh co o cay dang kiem nhung chua co o merge-base 764861f034c14544417ee6ffe3e0e4fea16f6e3b — eval moi, chay tren code cu khong phan biet gi
- node _acceptance/test-suite-db-thu/probes/song-song.mjs chung: bo qua baseline: tep _acceptance/test-suite-db-thu/probes/song-song.mjs co o cay dang kiem nhung chua co o merge-base 764861f034c14544417ee6ffe3e0e4fea16f6e3b — eval moi, chay tren code cu khong phan biet gi
- node _acceptance/test-suite-db-thu/probes/song-song.mjs rieng: bo qua baseline: tep _acceptance/test-suite-db-thu/probes/song-song.mjs co o cay dang kiem nhung chua co o merge-base 764861f034c14544417ee6ffe3e0e4fea16f6e3b — eval moi, chay tren code cu khong phan biet gi
- node _acceptance/test-suite-db-thu/probes/lay-mau.mjs app npm test: bo qua baseline: tep _acceptance/test-suite-db-thu/probes/lay-mau.mjs co o cay dang kiem nhung chua co o merge-base 764861f034c14544417ee6ffe3e0e4fea16f6e3b — eval moi, chay tren code cu khong phan biet gi
- node _acceptance/test-suite-db-thu/probes/lay-mau.mjs pipeline npm test: bo qua baseline: tep _acceptance/test-suite-db-thu/probes/lay-mau.mjs co o cay dang kiem nhung chua co o merge-base 764861f034c14544417ee6ffe3e0e4fea16f6e3b — eval moi, chay tren code cu khong phan biet gi
- node _acceptance/test-suite-db-thu/probes/lay-mau.mjs agent npm test: bo qua baseline: tep _acceptance/test-suite-db-thu/probes/lay-mau.mjs co o cay dang kiem nhung chua co o merge-base 764861f034c14544417ee6ffe3e0e4fea16f6e3b — eval moi, chay tren code cu khong phan biet gi

Lệnh fail không gắn eval: cd app && npm test (khối suite ở trên). Hai lệnh fail còn lại là lệnh của E5 và E6.

## Variance

none — every multi-run eval is uniform (mọi eval chạy một lượt, tất định)

## Iterations

Round 1: E5, E6 failed — E5: bộ app npm test trên DB riêng của lượt vẫn gặp deadlock 40P01 ở sellers-chip và E4b vượt ngưỡng thời gian trong tin-rao-doi-chieu (cùng lỗi ở lệnh suite cd app && npm test); E6: bộ pipeline có ba ca bị huỷ do quá hạn dù 0 kết nối vào DB chung. Thước «không chạm DB chung» đạt ở cả E5 và E6 (ket_noi_db_chung = 0); phần hỏng nằm ở điều kiện bộ test phải xanh. Returned to implementation.
