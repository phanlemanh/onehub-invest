---
schema_version: 2
feature_slug: du-an-cua-tin-len-dinh-vi
verdict: BLOCKED
failed_evals: []
reason: "E7 va E9 khong chay duoc: script offer-project-that.mjs chay roi tu dung o cong tai may (tai 1 phut 14.2, nguong 14, script tu thoat bang ma 3 cua chinh no). Day la cong bao ve cua script, khong phai lenh sai, thieu env/DB hay tool giet. Khong chay lai de cho pass theo chi dan; cach go la chay lai khi tai may duoi 14."
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: da18051d9ce9076a79763e2293c8aa60404b3e4d
human_signoff:
---

# Evidence Report: du-an-cua-tin-len-dinh-vi

Round 1. Verdict BLOCKED: hai eval E7 (AC-7, hieu nang) va E9 (AC-9, chay thu tren may thu) bi cong tai may cua script chan. Chin eval con lai deu xanh.

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | test | PASS |
| E2 | AC-2 | test | PASS |
| E3 | AC-3 | test | PASS |
| E4 | AC-4 | test | PASS |
| E5 | AC-5 | test | PASS |
| E6 | AC-6 | script | PASS |
| E7 | AC-7 | script | BLOCKED |
| E8 | AC-8 | ui-check | PASS |
| E9 | AC-9 | script | BLOCKED |
| E10 | AC-10 | test | PASS |
| E11 | AC-11 | test | PASS |

## Evidence

- eval: E1
  run_id: minted-du-an-cua-tin-len-dinh-vi-E1-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.dv7_db
  verified_at: 2026-11-15T06:07:32Z
  output: |
    bash db/db-thu.sh oneinvest_suite_dv7 --chay node --test --test-concurrency=1 pipeline/tests/offer-project.itest.mjs
    ℹ duration_ms 47333.186042

- eval: E2
  run_id: minted-du-an-cua-tin-len-dinh-vi-E2-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.dv7_db
  verified_at: 2026-11-15T06:07:32Z
  output: |
    cung lenh voi E1 (cung tep offer-project.itest.mjs, ca DV7-AC-2)
    ℹ duration_ms 47333.186042

- eval: E3
  run_id: minted-du-an-cua-tin-len-dinh-vi-E3-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.dv7_db
  verified_at: 2026-11-15T06:07:32Z
  output: |
    cung lenh voi E1 (ca DV7-AC-3)
    ℹ duration_ms 47333.186042

- eval: E4
  run_id: minted-du-an-cua-tin-len-dinh-vi-E4-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.dv7_db
  verified_at: 2026-11-15T06:07:32Z
  output: |
    cung lenh voi E1 (ca DV7-AC-4)
    ℹ duration_ms 47333.186042

- eval: E5
  run_id: minted-du-an-cua-tin-len-dinh-vi-E5-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.dv7_db
  verified_at: 2026-11-15T06:07:32Z
  output: |
    cung lenh voi E1 (ca DV7-AC-5)
    ℹ duration_ms 47333.186042

- eval: E6
  run_id: minted-du-an-cua-tin-len-dinh-vi-E6-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.dv7_that_doc
  verified_at: 2026-11-15T06:07:32Z
  output: |
    node pipeline/scripts/offer-project-that.mjs --doc
    [dv7] xung_dot (0): —

- eval: E7
  run_id: minted-du-an-cua-tin-len-dinh-vi-E7-r1
  baseline: n-a
  verifier: config:executors.script.dv7_that_hieu_nang
  verified_at: 2026-11-15T06:07:32Z
  status: BLOCKED (khong chay duoc)
  output: |
    [dv7] che do hieu-nang · tai 1 phut 14.2 · 2026-11-15T06:09:14.350Z
    [dv7] tai-may: tai 14.2 >= 14 — khong chay
    Script tu dung o cong tai may; khong do duoc AC-7. Khong phai tool giet. Khong chay lai.

- eval: E8
  run_id: minted-du-an-cua-tin-len-dinh-vi-E8-r1
  exit_code: 0
  baseline: n-a
  verifier: config:dev_server.start
  verified_at: 2026-11-15T06:07:32Z
  screenshot: evidence/E8-step1.png
  observed: |
    E8-step1.png (1280px, /ops/data-flow, cua so Toan kho, bang Chat luong tung chang): tieu de cot «Dinh vi (cap du an)» (bi cat chu tren man hinh), dong S03 Dinh vi 4.934 / 81% / «3.227 cho khop», S06 11.574 / 11% / «4.008 cho khop», S01 «—», S05 0 / «1 cho khop»; email thanh ben da thanh ████. Khop ky vong 4934.
    E8-step2.png (cua so 7 ngay): S03 Dinh vi 754 / 75% / «507 cho khop», S06 2.414 / 11% / «765 cho khop»; khop ky vong 754; email che.
    E8-step3.png (so do «Duong ong», re nut «Chua dinh vi» 17.582): tooltip «Chua khop danh ba: 1.272 tin ghi toa hoac truc dang cho khop toa (ke ca tin da dinh vi cap du an) ...»; 1.272 = locatedPending 7d (507+0+765); email che.
  network_observed: n-a (driver)

- eval: E9
  run_id: minted-du-an-cua-tin-len-dinh-vi-E9-r1
  baseline: n-a
  verifier: config:executors.script.dv7_that_chay_thu
  verified_at: 2026-11-15T06:07:32Z
  status: BLOCKED (khong chay duoc)
  output: |
    [dv7] che do chay-thu · tai 1 phut 14.2 · 2026-11-15T06:09:14.186Z
    [dv7] tai-may: tai 14.2 >= 14 — khong chay
    Script tu dung o cong tai may; chua co bang so cho so-chay-thu.md. Khong phai tool giet. Khong chay lai.

- eval: E10
  run_id: minted-du-an-cua-tin-len-dinh-vi-E10-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.dv7_lui
  verified_at: 2026-11-15T06:07:32Z
  output: |
    bash db/db-thu.sh oneinvest_suite_dv7l --chay node --test --test-concurrency=1 pipeline/tests/offer-project-lui.itest.mjs
    ℹ duration_ms 423.268792

- eval: E11
  run_id: minted-du-an-cua-tin-len-dinh-vi-E11-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.dv7_app
  verified_at: 2026-11-15T06:07:32Z
  output: |
    cd app && bash ../db/db-thu.sh oneinvest_suite_dv7a --chay node --import tsx --test --test-concurrency=1 tests/offer-project-app.itest.tsx tests/thang-bac-db.itest.tsx
    ℹ duration_ms 560510.641834

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-du-an-cua-tin-len-dinh-vi-SUITE-npm_test__bb6271-r1
  exit_code: 0
  verified_at: 2026-11-15T06:07:32Z

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-du-an-cua-tin-len-dinh-vi-SUITE-lint-r1
  exit_code: 0
  verified_at: 2026-11-15T06:07:32Z

- cmd: cd app && npm test
  run_id: minted-du-an-cua-tin-len-dinh-vi-SUITE-npm_test__bd9a35-r1
  exit_code: 0
  verified_at: 2026-11-15T06:07:32Z

- cmd: cd pipeline && npm run test:a
  run_id: minted-du-an-cua-tin-len-dinh-vi-SUITE-test_a-r1
  exit_code: 0
  verified_at: 2026-11-15T06:07:32Z

- cmd: cd pipeline && npm run test:b
  run_id: minted-du-an-cua-tin-len-dinh-vi-SUITE-test_b-r1
  exit_code: 0
  verified_at: 2026-11-15T06:07:32Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-du-an-cua-tin-len-dinh-vi-SUITE-test_lint_rules-r1
  exit_code: 0
  verified_at: 2026-11-15T06:07:32Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-du-an-cua-tin-len-dinh-vi-SUITE-node_scripts_check_portal_compliance_mjs-r1
  exit_code: 0
  verified_at: 2026-11-15T06:07:32Z

## Known limits

## Ngoài hợp đồng

## Analyst

none — moi eval feature deu red tren baseline (co phan biet)

Luu y: khong eval nao do duoc baseline (tat ca la n-a), nen dong tren khong phai bang chung red; xem muc ben duoi.

Baseline khong do
- bash db/db-thu.sh oneinvest_suite_dv7 --chay node --test --test-concurrency=1 pipeline/tests/offer-project.itest.mjs: bo qua baseline: tep pipeline/tests/offer-project.itest.mjs co o cay dang kiem nhung chua co o merge-base f78e7382afe239258a595d333a9ff444233564f0 — eval moi, chay tren code cu khong phan biet gi
- node pipeline/scripts/offer-project-that.mjs --doc: bo qua baseline: tep pipeline/scripts/offer-project-that.mjs co o cay dang kiem nhung chua co o merge-base f78e7382afe239258a595d333a9ff444233564f0 — eval moi, chay tren code cu khong phan biet gi
- node pipeline/scripts/offer-project-that.mjs --hieu-nang: bo qua baseline: tep pipeline/scripts/offer-project-that.mjs co o cay dang kiem nhung chua co o merge-base f78e7382afe239258a595d333a9ff444233564f0 — eval moi, chay tren code cu khong phan biet gi
- node pipeline/scripts/offer-project-that.mjs --chay-thu --ghi _acceptance/du-an-cua-tin-len-dinh-vi/ap-may-thu/so-chay-thu.md: bo qua baseline: tep pipeline/scripts/offer-project-that.mjs co o cay dang kiem nhung chua co o merge-base f78e7382afe239258a595d333a9ff444233564f0 — eval moi, chay tren code cu khong phan biet gi
- bash db/db-thu.sh oneinvest_suite_dv7l --chay node --test --test-concurrency=1 pipeline/tests/offer-project-lui.itest.mjs: bo qua baseline: tep pipeline/tests/offer-project-lui.itest.mjs co o cay dang kiem nhung chua co o merge-base f78e7382afe239258a595d333a9ff444233564f0 — eval moi, chay tren code cu khong phan biet gi
- cd app && bash ../db/db-thu.sh oneinvest_suite_dv7a --chay node --import tsx --test --test-concurrency=1 tests/offer-project-app.itest.tsx tests/thang-bac-db.itest.tsx: bo qua baseline: tep app/tests/offer-project-app.itest.tsx co o cay dang kiem nhung chua co o merge-base f78e7382afe239258a595d333a9ff444233564f0 — eval moi, chay tren code cu khong phan biet gi

## Variance

none — every multi-run eval is uniform

## Iterations

Round 1: E7, E9 bi chan boi cong tai may cua script (tai 14.2, nguong 14), failed_evals de trong; can chay lai E7 va E9 khi tai may duoi 14.
