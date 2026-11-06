---
schema_version: 2
feature_slug: test-suite-db-thu
verdict: PASS
failed_evals: []
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: e7a6ac242a572e91623a671a60295b6d13c2a256
human_signoff: Mạnh 2026-11-06
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
| E5 | AC-6 | script | PASS |
| E6 | AC-6 | script | PASS |
| E7 | AC-6 | script | PASS |
| E8 | AC-7 | test | PASS |
| E9 | AC-5 | test | PASS |

## Evidence

- eval: E1
  run_id: minted-test-suite-db-thu-E1-r3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.tsdt_mot
  verified_at: 2026-11-05T18:11:14Z
  output: |
    node --test scripts/db-thu.test.mjs (một lượt chạy chung cho E1, E1b, E1c, E8)
    ℹ duration_ms 6396.128125

- eval: E1b
  run_id: minted-test-suite-db-thu-E1b-r3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.tsdt_mot
  verified_at: 2026-11-05T18:11:14Z
  output: |
    node --test scripts/db-thu.test.mjs (cùng một lượt chạy với E1)
    ℹ duration_ms 6396.128125

- eval: E1c
  run_id: minted-test-suite-db-thu-E1c-r3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.tsdt_mot
  verified_at: 2026-11-05T18:11:14Z
  output: |
    node --test scripts/db-thu.test.mjs (cùng một lượt chạy với E1)
    ℹ duration_ms 6396.128125

- eval: E2
  run_id: r3-l2-1-20261105181114
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.tsdt_that
  verified_at: 2026-11-05T18:11:14Z
  output: |
    E2 đạt: oneinvest_suite_thua_7690 ≠ oneinvest_suite_thub_7691; xoá sạch; mẫu khoá kết nối; mồ côi được dọn

- eval: E3
  run_id: minted-test-suite-db-thu-E3-r3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.tsdt_chung
  verified_at: 2026-11-05T18:11:14Z
  output: |
    đối chứng: bên ghi không chạy → thước đỏ «thước hỏng: bên ghi không chạy»

- eval: E4
  run_id: minted-test-suite-db-thu-E4-r3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.tsdt_rieng
  verified_at: 2026-11-05T18:11:14Z
  output: |
    {"che_do":"rieng","luot":[{"exit":0,"giay":16,"deadlock":false},{"exit":0,"giay":13,"deadlock":false},{"exit":0,"giay":66,"deadlock":false}],"deadlock_tren_db_chung":0,"mau_cho_khoa":0,"mau_ket_noi_cua_test_toi_db_chung":0,"mau_ket_noi_toi_
    (phần đuôi đầu ra bị cắt ở khung chấm; các trường ben_ghi.* và mau_ket_noi_toi_db_cua_luot không nằm trong đoạn đã giữ)

- eval: E5
  run_id: minted-test-suite-db-thu-E5-r3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.tsdt_ba_bo
  verified_at: 2026-11-05T18:11:14Z
  output: |
    app: {"lenh":"npm test","exit":0,"ca":{"tests":1017,"pass":1012,"fail":0,"skipped":5},"phut":6,"ket_noi_db_chung":0,"ket_noi_db_khac":3742,"dinh":{"oneinvest_suite_app_6560":32},"moi_db":{"oneinvest_suite_app_6560":3742}}

- eval: E6
  run_id: minted-test-suite-db-thu-E6-r3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.tsdt_ba_bo
  verified_at: 2026-11-05T18:11:14Z
  output: |
    bash _acceptance/test-suite-db-thu/probes/ba-bo.sh (cùng một lượt chạy với E5; ba-bo.sh thoát xanh nghĩa là cả ba bộ app, pipeline, agent xanh)
    (đoạn đuôi đầu ra giữ lại chỉ chứa dòng «app:», dòng «pipeline:» không nằm trong đoạn đã giữ)

- eval: E7
  run_id: minted-test-suite-db-thu-E7-r3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.tsdt_ba_bo
  verified_at: 2026-11-05T18:11:14Z
  output: |
    bash _acceptance/test-suite-db-thu/probes/ba-bo.sh (cùng một lượt chạy với E5)
    (đoạn đuôi đầu ra giữ lại chỉ chứa dòng «app:», dòng «agent:» không nằm trong đoạn đã giữ)

- eval: E8
  run_id: minted-test-suite-db-thu-E8-r3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.tsdt_mot
  verified_at: 2026-11-05T18:11:14Z
  output: |
    node --test scripts/db-thu.test.mjs (cùng một lượt chạy với E1)
    ℹ duration_ms 6396.128125

- eval: E9
  run_id: minted-test-suite-db-thu-E9-r3
  exit_code: 0
  baseline: green
  verifier: config:executors.test.sellers_chip
  verified_at: 2026-11-05T18:11:14Z
  output: |
    cd app && bash ../db/db-thu.sh oneinvest_suite_sellers_chip --chay node --import tsx --test tests/sellers-chip.test.tsx
    ℹ duration_ms 9496.779583

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-test-suite-db-thu-SUITE-npm_test__bb6271-r3
  exit_code: 0
  verified_at: 2026-11-05T18:11:14Z

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-test-suite-db-thu-SUITE-lint-r3
  exit_code: 0
  verified_at: 2026-11-05T18:11:14Z

- cmd: cd app && npm test
  run_id: minted-test-suite-db-thu-SUITE-npm_test__bd9a35-r3
  exit_code: 0
  verified_at: 2026-11-05T18:11:14Z

- cmd: cd pipeline && npm test
  run_id: minted-test-suite-db-thu-SUITE-npm_test__13563d-r3
  exit_code: 0
  verified_at: 2026-11-05T18:11:14Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-test-suite-db-thu-SUITE-test_lint_rules-r3
  exit_code: 0
  verified_at: 2026-11-05T18:11:14Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-test-suite-db-thu-SUITE-node_scripts_check_portal_compliance_mjs-r3
  exit_code: 0
  verified_at: 2026-11-05T18:11:14Z

## Known limits

## Ngoài hợp đồng

## Analyst

Baseline không đo:
- node --test scripts/db-thu.test.mjs: bo qua baseline: tep scripts/db-thu.test.mjs co o cay dang kiem nhung chua co o merge-base 467d34774524c9d8ee5a1e047dca389a780e4011 — eval moi, chay tren code cu khong phan biet gi
- bash _acceptance/test-suite-db-thu/probes/that.sh: bo qua baseline: tep _acceptance/test-suite-db-thu/probes/that.sh co o cay dang kiem nhung chua co o merge-base 467d34774524c9d8ee5a1e047dca389a780e4011 — eval moi, chay tren code cu khong phan biet gi
- node _acceptance/test-suite-db-thu/probes/song-song.mjs chung: bo qua baseline: tep _acceptance/test-suite-db-thu/probes/song-song.mjs co o cay dang kiem nhung chua co o merge-base 467d34774524c9d8ee5a1e047dca389a780e4011 — eval moi, chay tren code cu khong phan biet gi
- node _acceptance/test-suite-db-thu/probes/song-song.mjs rieng: bo qua baseline: tep _acceptance/test-suite-db-thu/probes/song-song.mjs co o cay dang kiem nhung chua co o merge-base 467d34774524c9d8ee5a1e047dca389a780e4011 — eval moi, chay tren code cu khong phan biet gi
- bash _acceptance/test-suite-db-thu/probes/ba-bo.sh: bo qua baseline: tep _acceptance/test-suite-db-thu/probes/ba-bo.sh co o cay dang kiem nhung chua co o merge-base 467d34774524c9d8ee5a1e047dca389a780e4011 — eval moi, chay tren code cu khong phan biet gi

Eval không phân biệt (xanh ở cả HEAD lẫn baseline, chứng minh harness chứ không phải tính năng):
- E9 (lệnh cd app && bash ../db/db-thu.sh oneinvest_suite_sellers_chip --chay node --import tsx --test tests/sellers-chip.test.tsx): xanh cả hai phía. Cần giữ như regression-guard có chủ ý; phần phân biệt hành vi mới nằm ở ca DT-AC-5 trong scripts/db-thu.test.mjs (E1, E1b, E1c, E8), ghim chuỗi executor phải đi qua db-thu --chay.

Ghi chú người đọc: các finding của vòng này nằm ở review-findings.md (trong hợp đồng và ngoài hợp đồng); báo cáo này không nhắc lại chúng.

## Variance

none — every multi-run eval is uniform

## Iterations

Round 1: E5, E6 đỏ (lay-mau app và pipeline) và có finding trong hợp đồng ở AC-2, AC-3, AC-5, AC-7. Returned to implementation.
Round 2: BLOCKED — E2 (that.sh) không chạy được vì khung bọc lệnh lỗi tệp tạm; E5, E6, E7 đỏ vì ba-bo.sh thoát đỏ do ca CGT-DC của app quá thời gian.
Round 3: mọi eval xanh (E1, E1b, E1c, E2, E3, E4, E5, E6, E7, E8, E9) và sáu lệnh suite xanh trên cfacf45e; E2 chạy lại được, ba-bo.sh xanh cả ba bộ. Mốc verified_at ghi chung theo lượt chạy E2, giờ chi tiết từng lệnh ở run-log.jsonl.

### Re-pin lần 1 — 2026-11-06, do hoá cũ do gộp main (#327)
run_id: repin-20261106T014512Z-70933
sha: e7a6ac242a572e91623a671a60295b6d13c2a256 · suites: 6 lệnh exit 0 · evals: 11/11 eval máy đạt kỳ vọng
