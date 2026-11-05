---
schema_version: 2
feature_slug: test-suite-db-thu
verdict: BLOCKED
failed_evals: [E5, E6, E7]
reason: 'Lenh ghim bash _acceptance/test-suite-db-thu/probes/that.sh (E2) da chay hai lan (timeout 600000 ms), ca hai lan khung boc lenh tra ve loi truoc khi probe in ket qua: "cat: /var/folders/bp/cf66dm9n18x8q1rcjsylk6ph0000gq/T/tmp.<random>/<c|f>: No such file or directory". Dong __EXIT=1 la cua khung boc, khong phai ma thoat cua that.sh; khong co dau ra cua that.sh de doc PASS/FAIL. Script ton tai (_acceptance/test-suite-db-thu/probes/that.sh, 5196 byte). Khong sua code, khong dung git. Can kiem tra lai co che boc lenh/tep tam cua khung truoc khi chay lai.'
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 57b413aefca241345181e6fd17626f7d13506747
human_signoff:
---

# Evidence Report: test-suite-db-thu

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | test | PASS |
| E1b | AC-2 | test | PASS |
| E1c | AC-3 | test | PASS |
| E2 | AC-4 | script | BLOCKED |
| E3 | AC-5 | script | PASS |
| E4 | AC-5 | script | PASS |
| E5 | AC-6 | script | FAIL |
| E6 | AC-6 | script | FAIL |
| E7 | AC-6 | script | FAIL |
| E8 | AC-7 | test | PASS |
| E9 | AC-5 | test | PASS |

## Evidence

- eval: E1
  run_id: minted-test-suite-db-thu-E1-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.tsdt_mot
  verified_at: 2026-11-05T15:30:48Z
  output: |
    node --test scripts/db-thu.test.mjs (chạy một lần cho E1, E1b, E1c, E8)
    ℹ duration_ms 5603.604166

- eval: E1b
  run_id: minted-test-suite-db-thu-E1b-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.tsdt_mot
  verified_at: 2026-11-05T15:30:48Z
  output: |
    node --test scripts/db-thu.test.mjs (cùng một lượt chạy với E1)
    ℹ duration_ms 5603.604166

- eval: E1c
  run_id: minted-test-suite-db-thu-E1c-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.tsdt_mot
  verified_at: 2026-11-05T15:30:48Z
  output: |
    node --test scripts/db-thu.test.mjs (cùng một lượt chạy với E1)
    ℹ duration_ms 5603.604166

- eval: E2
  run_id: minted-test-suite-db-thu-E2-r2
  outcome: BLOCKED — không có mã thoát của that.sh (chỉ có mã của khung bọc lệnh)
  baseline: n-a
  verifier: config:executors.script.tsdt_that
  verified_at: 2026-11-05T15:30:48Z
  output: |
    bash _acceptance/test-suite-db-thu/probes/that.sh chạy hai lần, cả hai lần khung bọc lệnh báo:
    cat: /var/folders/bp/cf66dm9n18x8q1rcjsylk6ph0000gq/T/tmp.4Qd1oUYbTm/c: No such file or directory
    Probe chưa in dòng nào; không có «E2 đạt» và không có dòng đo nào để đọc.

- eval: E3
  run_id: minted-test-suite-db-thu-E3-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.tsdt_chung
  verified_at: 2026-11-05T15:30:48Z
  output: |
    đối chứng: bên ghi không chạy → thước đỏ «thước hỏng: bên ghi không chạy»

- eval: E4
  run_id: minted-test-suite-db-thu-E4-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.tsdt_rieng
  verified_at: 2026-11-05T15:30:48Z
  output: |
    {"che_do":"rieng","luot":[{"exit":0,"giay":62,"deadlock":false},{"exit":0,"giay":95,"deadlock":false},{"exit":0,"giay":130,"deadlock":false}],"deadlock_tren_db_chung":0,"mau_cho_khoa":0,"mau_ket_noi_cua_test_toi_db_chung":0,"mau_ket_noi_toi
    (phần đuôi đầu ra bị cắt ở khung chấm; các trường ben_ghi.* và mau_ket_noi_toi_db_cua_luot không nằm trong đoạn đã giữ)

- eval: E5
  run_id: minted-test-suite-db-thu-E5-r2
  exit_code: 1
  baseline: n-a
  verifier: config:executors.script.tsdt_ba_bo
  verified_at: 2026-11-05T15:30:48Z
  output: |
    ✖ CGT-DC đối chiếu DB máy thu chỉ đọc (600003.118625ms)
      'test timed out after 600000ms'
    app: {"lenh":"npm test","exit":1,"ca":{"tests":1017,"pass":1011,"fail":0,"skipped":5},"phut":12.6,"ket_noi_db_chung":0,"ket_noi_db_khac":2340,"dinh":{"oneinvest_suite_app_67849":36},"moi_db":{"oneinvest_suite_app_67849":2340}}
    app đỏ (mã 1), nhật ký .acceptance-runs/test-suite-db-thu/lay-mau-app.log
    __CHUA_XONG

- eval: E6
  run_id: minted-test-suite-db-thu-E6-r2
  exit_code: 1
  baseline: n-a
  verifier: config:executors.script.tsdt_ba_bo
  verified_at: 2026-11-05T15:30:48Z
  output: |
    pipeline: {"lenh":"npm test","exit":0,"ca":{"tests":591,"pass":591,"fail":0,"skipped":0},"phut":4.2,"ket_noi_db_chung":0,"ket_noi_db_khac":144,"dinh":{"oneinvest_suite_pipeline_5468":3,...
    (mã thoát của ba-bo.sh là mã chung của cả ba bộ, bị kéo đỏ bởi dòng app)

- eval: E7
  run_id: minted-test-suite-db-thu-E7-r2
  exit_code: 1
  baseline: n-a
  verifier: config:executors.script.tsdt_ba_bo
  verified_at: 2026-11-05T15:30:48Z
  output: |
    agent: {"lenh":"npm test","exit":0,"ca":{"tests":287,"pass":287,"fail":0,"skipped":0},"phut":0.4,"ket_noi_db_chung":0,"ket_noi_db_khac":84,"dinh":{"oneinvest_suite_agent_22848":10,"postgres":2,"oneinvest_p3_pair_test_24762":1,...
    (mã thoát của ba-bo.sh là mã chung của cả ba bộ, bị kéo đỏ bởi dòng app)

- eval: E8
  run_id: minted-test-suite-db-thu-E8-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.tsdt_mot
  verified_at: 2026-11-05T15:30:48Z
  output: |
    node --test scripts/db-thu.test.mjs (cùng một lượt chạy với E1)
    ℹ duration_ms 5603.604166

- eval: E9
  run_id: minted-test-suite-db-thu-E9-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.sellers_chip
  verified_at: 2026-11-05T15:30:48Z
  output: |
    cd app && bash ../db/db-thu.sh oneinvest_suite_sellers_chip --chay node --import tsx --test tests/sellers-chip.test.tsx
    ℹ duration_ms 30476.721375

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-test-suite-db-thu-SUITE-npm_test__bb6271-r2
  exit_code: 0
  verified_at: 2026-11-05T15:30:48Z

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-test-suite-db-thu-SUITE-lint-r2
  exit_code: 0
  verified_at: 2026-11-05T15:30:48Z

- cmd: cd app && npm test
  run_id: minted-test-suite-db-thu-SUITE-npm_test__bd9a35-r2
  exit_code: 0
  verified_at: 2026-11-05T15:30:48Z

- cmd: cd pipeline && npm test
  run_id: minted-test-suite-db-thu-SUITE-npm_test__13563d-r2
  exit_code: 0
  verified_at: 2026-11-05T15:30:48Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-test-suite-db-thu-SUITE-test_lint_rules-r2
  exit_code: 0
  verified_at: 2026-11-05T15:30:48Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-test-suite-db-thu-SUITE-node_scripts_check_portal_compliance_mjs-r2
  exit_code: 0
  verified_at: 2026-11-05T15:30:48Z

## Known limits

## Ngoài hợp đồng

## Analyst

Baseline không đo:
- node --test scripts/db-thu.test.mjs: bo qua baseline: tep scripts/db-thu.test.mjs co o cay dang kiem nhung chua co o merge-base 467d34774524c9d8ee5a1e047dca389a780e4011 — eval moi, chay tren code cu khong phan biet gi
- bash _acceptance/test-suite-db-thu/probes/that.sh: bo qua baseline: tep _acceptance/test-suite-db-thu/probes/that.sh co o cay dang kiem nhung chua co o merge-base 467d34774524c9d8ee5a1e047dca389a780e4011 — eval moi, chay tren code cu khong phan biet gi
- node _acceptance/test-suite-db-thu/probes/song-song.mjs chung: bo qua baseline: tep _acceptance/test-suite-db-thu/probes/song-song.mjs co o cay dang kiem nhung chua co o merge-base 467d34774524c9d8ee5a1e047dca389a780e4011 — eval moi, chay tren code cu khong phan biet gi
- node _acceptance/test-suite-db-thu/probes/song-song.mjs rieng: bo qua baseline: tep _acceptance/test-suite-db-thu/probes/song-song.mjs co o cay dang kiem nhung chua co o merge-base 467d34774524c9d8ee5a1e047dca389a780e4011 — eval moi, chay tren code cu khong phan biet gi
- bash _acceptance/test-suite-db-thu/probes/ba-bo.sh: bo qua baseline: tep _acceptance/test-suite-db-thu/probes/ba-bo.sh co o cay dang kiem nhung chua co o merge-base 467d34774524c9d8ee5a1e047dca389a780e4011 — eval moi, chay tren code cu khong phan biet gi
- cd app && bash ../db/db-thu.sh oneinvest_suite_sellers_chip --chay node --import tsx --test tests/sellers-chip.test.tsx: baseline vuot tran 180 giay/lenh — da dung ca cay tien trinh; BLOCKED ha tang, khong phai ket qua cua code cu

none — moi eval feature deu red tren baseline (co phan biet)

Ghi chú người đọc: không eval nào có baseline đo được (cả mười một đều n-a), nên dòng trên chỉ nghĩa là không có eval nào được ghi là xanh-cả-hai-phía, không phải bằng chứng đã phân biệt.

Ghi chú về E5, E6, E7: ba eval cùng đọc mã thoát của ba-bo.sh. Dòng «pipeline:» và «agent:» của chính chúng ghi 591/591 và 287/287 ca xanh, ket_noi_db_chung = 0, mỗi bộ có khoá DB riêng của lượt; mã thoát chung bị kéo đỏ vì dòng «app:» (ca CGT-DC quá 600000 ms). Lệnh suite cd app && npm test trong cùng lượt chấm xanh, nên ca CGT-DC chưa được xác định là lỗi cố định hay chỉ xảy ra ở lượt lấy mẫu. Hồ sơ này không kết luận nguyên nhân.

## Variance

none — every multi-run eval is uniform

## Iterations

Round 1: E5, E6 đỏ (lay-mau app và pipeline) và có finding trong hợp đồng ở AC-2, AC-3, AC-5, AC-7. Returned to implementation.
Round 2: BLOCKED — E2 (that.sh) không chạy được vì khung bọc lệnh lỗi tệp tạm; E5, E6, E7 đỏ vì ba-bo.sh thoát đỏ do ca CGT-DC của app quá thời gian. Mốc verified_at ghi theo ngày, giờ chi tiết ở run-log.jsonl.
