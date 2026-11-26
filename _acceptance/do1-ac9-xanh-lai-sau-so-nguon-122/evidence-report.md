---
schema_version: 2
feature_slug: do1-ac9-xanh-lai-sau-so-nguon-122
verdict: BLOCKED
failed_evals: ["E2","E3"]
reason: "Lệnh `node scripts/suite-neu-doi.mjs pipeline_that -- 'cd pipeline && npm run test:that'` chạy quá 30 phút chưa xong (tiến trình nền bm5ydr5d5 vẫn chạy, chưa có dòng __EXIT=). Không có dòng __EXIT trong đầu ra nên không có exit code thật. Eval pipeline_that không khai long_running trong evals.yaml nên áp mốc mặc định 30 phút. Lệnh bị chuyển nền sau 600s chứ không bị công cụ giết; tiến trình node suite-neu-doi.mjs pipeline_that vẫn còn (chay-that.mjs đang chạy, db-thu.sh oneinvest_suite_pipeline_that). Không có công cụ TaskStop để dừng nền nên không dừng được. Không chạy lại theo yêu cầu."
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: b48cd02edbfe98de16cdff77ac566e17522c9e49
human_signoff:
---

# Evidence Report: do1-ac9-xanh-lai-sau-so-nguon-122

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | test | PASS |
| E2 | AC-2 | script | FAIL |
| E3 | AC-3 | script | FAIL |
| E4 | AC-4 | script | PASS |

## Evidence

- eval: E1
  run_id: minted-do1-ac9-xanh-lai-sau-so-nguon-122-E1-r1
  exit_code: 0
  baseline: red
  verifier: config:executors.test.ht31_ca
  verified_at: 2026-11-26T06:43:29Z
  output: |
    ca DO1-AC-9 detail chạy trên DB oneinvest_suite_ht31 chép từ máy thu
    ℹ duration_ms 137237.205333
    __EXIT=0

- eval: E2
  run_id: minted-do1-ac9-xanh-lai-sau-so-nguon-122-E2-r1
  exit_code: 1
  baseline: n-a
  verifier: config:executors.script.ht31_doi_chung
  verified_at: 2026-11-26T06:43:29Z
  output: |
    OK  B ban main do (bản origin/main đỏ đúng một ca)
    LOI C go bo soat do (bản đột biến vẫn xanh, không đỏ như AC-2 đòi)
    DOI-CHUNG DO (1)

- eval: E3
  run_id: minted-do1-ac9-xanh-lai-sau-so-nguon-122-E3-r1
  exit_code: 1
  baseline: n-a
  verifier: config:executors.script.ht31_doi_chung
  verified_at: 2026-11-26T06:43:29Z
  output: |
    so cua luot: xoa 1 dong S09
    OK  D ban sua xanh khi so khong co S09: tests 1, pass 1, fail 0, skipped 0
    DOI-CHUNG DO (1)
    (E3 dùng chung lệnh với E2; dòng D đạt nhưng lệnh thoát đỏ vì lượt C, nên E3 cũng bị tính đỏ)

- eval: E4
  run_id: minted-do1-ac9-xanh-lai-sau-so-nguon-122-E4-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.ht31_pham_vi
  verified_at: 2026-11-26T06:43:29Z
  output: |
    PHAM-VI OK
    __EXIT=0

### Lệnh suite (hồi quy)

- cmd: node scripts/suite-neu-doi.mjs agent -- 'cd agent && npm test'
  run_id: minted-do1-ac9-xanh-lai-sau-so-nguon-122-SUITE-node_scripts_suite_neu_doi_mjs_agent_cd_-r1
  exit_code: 0
  verified_at: 2026-11-26T06:43:29Z

- cmd: node scripts/suite-neu-doi.mjs app -- 'cd app && npx tsc --noEmit && npm run lint'
  run_id: minted-do1-ac9-xanh-lai-sau-so-nguon-122-SUITE-lint-r1
  exit_code: 0
  verified_at: 2026-11-26T06:43:29Z

- cmd: node scripts/suite-neu-doi.mjs app_ui -- 'cd app && npm test'
  run_id: minted-do1-ac9-xanh-lai-sau-so-nguon-122-SUITE-node_scripts_suite_neu_doi_mjs_app_ui_cd-r1
  exit_code: 1
  verified_at: 2026-11-26T06:43:29Z
  (1294 ca, 1284 xanh, 0 đỏ, 1 bị huỷ do quá hạn: tests/sellers-chip.test.tsx SD-AC-6 timed out sau 180000ms; lệnh này không gắn eval nào)

- cmd: node scripts/suite-neu-doi.mjs pipeline_a -- 'cd pipeline && npm run test:a'
  run_id: minted-do1-ac9-xanh-lai-sau-so-nguon-122-SUITE-test_a-r1
  exit_code: 0
  verified_at: 2026-11-26T06:43:29Z

- cmd: node scripts/suite-neu-doi.mjs pipeline_b -- 'cd pipeline && npm run test:b'
  run_id: minted-do1-ac9-xanh-lai-sau-so-nguon-122-SUITE-test_b-r1
  exit_code: 0
  verified_at: 2026-11-26T06:43:29Z

- cmd: node scripts/suite-neu-doi.mjs pipeline_that -- 'cd pipeline && npm run test:that'
  run_id: minted-do1-ac9-xanh-lai-sau-so-nguon-122-SUITE-test_that-r1
  exit_code: 1
  verified_at: 2026-11-26T06:43:29Z
  (không có dòng __EXIT thật: lệnh còn chạy nền sau 30 phút, xem reason ở frontmatter)

- cmd: node scripts/suite-neu-doi.mjs ui_lint_rules -- 'cd app && npm run test:lint-rules'
  run_id: minted-do1-ac9-xanh-lai-sau-so-nguon-122-SUITE-test_lint_rules-r1
  exit_code: 0
  verified_at: 2026-11-26T06:43:29Z

- cmd: node scripts/suite-neu-doi.mjs portal_static -- 'node scripts/check-portal-compliance.mjs'
  run_id: minted-do1-ac9-xanh-lai-sau-so-nguon-122-SUITE-node_scripts_suite_neu_doi_mjs_portal_st-r1
  exit_code: 0
  verified_at: 2026-11-26T06:43:29Z

Lệnh đỏ không gắn eval: `node scripts/suite-neu-doi.mjs app_ui -- 'cd app && npm test'` (ca SD-AC-6 quá hạn). Lệnh `bash db/db-thu.sh oneinvest_suite_ht31dc --chay node _acceptance/do1-ac9-xanh-lai-sau-so-nguon-122/probes/doi-chung.mjs` gắn E2 và E3 và cũng đỏ.

## Known limits

## Ngoài hợp đồng

## Analyst

none — moi eval feature deu red tren baseline (co phan biet). Riêng E1 đo được baseline red; E2, E3, E4 không đo được baseline (xem dưới).

Baseline khong do
- bash db/db-thu.sh oneinvest_suite_ht31dc --chay node _acceptance/do1-ac9-xanh-lai-sau-so-nguon-122/probes/doi-chung.mjs: bo qua baseline: tep _acceptance/do1-ac9-xanh-lai-sau-so-nguon-122/probes/doi-chung.mjs co o cay dang kiem nhung chua co o merge-base 6286dd29a2b2d57ede549677566cf49e161168e6 — eval moi, chay tren code cu khong phan biet gi
- bash _acceptance/do1-ac9-xanh-lai-sau-so-nguon-122/probes/pham-vi.sh: bo qua baseline: tep _acceptance/do1-ac9-xanh-lai-sau-so-nguon-122/probes/pham-vi.sh co o cay dang kiem nhung chua co o merge-base 6286dd29a2b2d57ede549677566cf49e161168e6 — eval moi, chay tren code cu khong phan biet gi

## Variance

none — every multi-run eval is uniform

## Iterations

Round 1: E2, E3 failed — probe đối chứng lượt C (gỡ bộ soát) chỉ đột biến lib mà doHangNgay thật không đọc nên bản đột biến vẫn xanh; E3 đỏ theo vì dùng chung lệnh. Ngoài ra lệnh suite pipeline_that quá 30 phút chưa xong nên verdict BLOCKED. Returned to implementation.

máy: M5 (M5 Max 18 nhân, colima 16/96) · DB: `oneinvest` đầy đủ của M5 (db-thu chép, không DB trống) · chỗ chấm: node_modules app, pipeline, agent, data-api symlink sang checkout chính · ca đỏ có tên: E2/E3 «LOI C go bo soat do» (probe đột biến không chạm bộ soát ca thật dùng); app_ui tests/sellers-chip.test.tsx SD-AC-6 quá hạn 180000 ms; pipeline_that quá trần chờ 30′ khi đang chạy chay-that.mjs (không chờ khoá mẫu hay chỗ cụm), lượt chấm cham-kev1 chạy pipeline_that song song.
