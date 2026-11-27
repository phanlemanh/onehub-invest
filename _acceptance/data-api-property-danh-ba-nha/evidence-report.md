---
schema_version: 2
feature_slug: data-api-property-danh-ba-nha
verdict: PASS
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 8a8b346fc0b79d77b74f68406c4e6aec19685048
human_signoff:
---

# Evidence Report: data-api-property-danh-ba-nha

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | test | PASS |
| E2 | AC-2 | test | PASS |
| E3 | AC-3 | test | PASS |
| E4 | AC-4 | test | PASS |
| E5 | AC-5 | test | PASS |
| E6 | AC-6 | test | PASS |
| E7 | AC-7 | test | PASS |
| E8 | AC-8 | script | PASS |
| E9 | AC-9 | script | PASS |
| E10 | AC-10 | test | PASS |
| E11 | AC-11 | script | PASS |

## Evidence

- eval: E1
  run_id: minted-data-api-property-danh-ba-nha-E1-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.dapi_prop
  verified_at: 2026-11-27T08:10:54Z
  output: |
    ℹ duration_ms 6342.808333
    __EXIT=0

- eval: E2
  run_id: minted-data-api-property-danh-ba-nha-E2-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.dapi_prop
  verified_at: 2026-11-27T08:10:54Z
  output: |
    ℹ duration_ms 6342.808333
    __EXIT=0

- eval: E3
  run_id: minted-data-api-property-danh-ba-nha-E3-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.dapi_prop
  verified_at: 2026-11-27T08:10:54Z
  output: |
    ℹ duration_ms 6342.808333
    __EXIT=0

- eval: E4
  run_id: minted-data-api-property-danh-ba-nha-E4-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.dapi_prop
  verified_at: 2026-11-27T08:10:54Z
  output: |
    ℹ duration_ms 6342.808333
    __EXIT=0

- eval: E5
  run_id: minted-data-api-property-danh-ba-nha-E5-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.dapi_prop
  verified_at: 2026-11-27T08:10:54Z
  output: |
    ℹ duration_ms 6342.808333
    __EXIT=0

- eval: E6
  run_id: minted-data-api-property-danh-ba-nha-E6-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.dapi_prop
  verified_at: 2026-11-27T08:10:54Z
  output: |
    ℹ duration_ms 6342.808333
    __EXIT=0

- eval: E7
  run_id: minted-data-api-property-danh-ba-nha-E7-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.dapi_prop
  verified_at: 2026-11-27T08:10:54Z
  output: |
    ℹ duration_ms 6342.808333
    __EXIT=0

- eval: E8
  run_id: minted-data-api-property-danh-ba-nha-E8-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.dapi_prop_loai
  verified_at: 2026-11-27T08:10:54Z
  output: |
    PB6 loại căn: 3 giá trị khác nhau, đều có dòng đổi; hai bản bảng đổi khớp
    __EXIT=0

- eval: E9
  run_id: minted-data-api-property-danh-ba-nha-E9-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.dapi_prop_cu
  verified_at: 2026-11-27T08:10:54Z
  output: |
    pha: đủ 4 ô
    __EXIT=0

- eval: E10
  run_id: minted-data-api-property-danh-ba-nha-E10-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.dapi_prop
  verified_at: 2026-11-27T08:10:54Z
  output: |
    ℹ duration_ms 6342.808333
    __EXIT=0

- eval: E11
  run_id: minted-data-api-property-danh-ba-nha-E11-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.dapi_prop_reso
  verified_at: 2026-11-27T08:10:54Z
  output: |
    PB6 tên chuẩn + ranh giới + tài liệu: đạt
    __EXIT=0

### Lệnh suite (hồi quy)

- cmd: node scripts/suite-neu-doi.mjs agent -- 'cd agent && npm test'
  run_id: minted-data-api-property-danh-ba-nha-SUITE-node_scripts_suite_neu_doi_mjs_agent_cd_-r1
  exit_code: 0
  verified_at: 2026-11-27T08:10:54Z

- cmd: node scripts/suite-neu-doi.mjs app -- 'cd app && npx tsc --noEmit && npm run lint'
  run_id: minted-data-api-property-danh-ba-nha-SUITE-lint-r1
  exit_code: 0
  verified_at: 2026-11-27T08:10:54Z

- cmd: node scripts/suite-neu-doi.mjs app_ui -- 'cd app && npm test'
  run_id: minted-data-api-property-danh-ba-nha-SUITE-node_scripts_suite_neu_doi_mjs_app_ui_cd-r1
  exit_code: 0
  verified_at: 2026-11-27T08:10:54Z

- cmd: node scripts/suite-neu-doi.mjs pipeline_a -- 'cd pipeline && npm run test:a'
  run_id: minted-data-api-property-danh-ba-nha-SUITE-test_a-r1
  exit_code: 0
  verified_at: 2026-11-27T08:10:54Z

- cmd: node scripts/suite-neu-doi.mjs pipeline_b -- 'cd pipeline && npm run test:b'
  run_id: minted-data-api-property-danh-ba-nha-SUITE-test_b-r1
  exit_code: 0
  verified_at: 2026-11-27T08:10:54Z

- cmd: node scripts/suite-neu-doi.mjs pipeline_that -- 'cd pipeline && npm run test:that'
  run_id: minted-data-api-property-danh-ba-nha-SUITE-test_that-r1
  exit_code: 0
  verified_at: 2026-11-27T08:10:54Z

- cmd: node scripts/suite-neu-doi.mjs ui_lint_rules -- 'cd app && npm run test:lint-rules'
  run_id: minted-data-api-property-danh-ba-nha-SUITE-test_lint_rules-r1
  exit_code: 0
  verified_at: 2026-11-27T08:10:54Z

- cmd: node scripts/suite-neu-doi.mjs portal_static -- 'node scripts/check-portal-compliance.mjs'
  run_id: minted-data-api-property-danh-ba-nha-SUITE-node_scripts_suite_neu_doi_mjs_portal_st-r1
  exit_code: 0
  verified_at: 2026-11-27T08:10:54Z

máy: M5 (M5 Max 18 nhân, colima 16/96) · DB: bản đầy đủ máy thu chép sang 26/11 05:45Z · ca đỏ có tên: không

Ghi chú phiên chấm M5 (sau lượt, không đổi verdict của kit): vòng 1 trên 8a8b346fc0b79d77b74f68406c4e6aec19685048; soát 8a8b346fc-20261127T133835 xanh (data-api, scripts, pipeline). Mọi eval E1–E11 PASS, 8/8 lệnh suite ghim lại thoát 0. Chấm trên M5: ON22-AC-10 không chạy (HT33). Review: ba finding medium trong hợp đồng (AC-1: chỉ có điểm-case «S09 thắng» cho thứ tự tên toà S09 → S08 → S16 → S03; AC-6: không cấy chuỗi canh cho bí danh ten của nguồn bị loại; AC-6: miễn trừ unitNumber xét theo cả thân) — theo luật kit chỉ finding high trong hợp đồng mới buộc REJECT, nên verdict giữ PASS nhưng người ký Cổng 2 cần thấy. Ngoài hợp đồng: một finding medium đề xuất hợp đồng mới (route Property phụ thuộc source_registry — khi danh bạ lên cloud, bảng vắng thì 500, rỗng thì rào mã nguồn tắt im lặng). Kit báo runLogWriteFailed — run-log do phiên chấm ghi.

## Known limits

## Ngoài hợp đồng

## Analyst

none — moi eval feature deu khong co baseline do duoc (baseline n-a), khong eval nao duoc xac dinh la khong-phan-biet.

Baseline khong do
- bash db/db-thu.sh oneinvest_suite_dapi_prop --chay sh -c 'cd data-api && node --import tsx --test --test-reporter=spec --test-concurrency=1 test/properties.test.ts test/dong-ba-route.test.ts': bo qua baseline: tep data-api/test/properties.test.ts co o cay dang kiem nhung chua co o merge-base d9afaa945916bff9e9df3141a81355cd67db7768 — eval moi, chay tren code cu khong phan biet gi
- bash db/db-thu.sh oneinvest_suite_dapi_prop --chay node _acceptance/data-api-property-danh-ba-nha/probes/loai-can.mjs: bo qua baseline: tep _acceptance/data-api-property-danh-ba-nha/probes/loai-can.mjs co o cay dang kiem nhung chua co o merge-base d9afaa945916bff9e9df3141a81355cd67db7768 — eval moi, chay tren code cu khong phan biet gi
- bash db/db-thu.sh oneinvest_suite_dapi_prop --chay node _acceptance/data-api-property-danh-ba-nha/probes/dot-bien.mjs: bo qua baseline: tep _acceptance/data-api-property-danh-ba-nha/probes/dot-bien.mjs co o cay dang kiem nhung chua co o merge-base d9afaa945916bff9e9df3141a81355cd67db7768 — eval moi, chay tren code cu khong phan biet gi
- sh -c 'cd data-api && node --import tsx ../_acceptance/data-api-property-danh-ba-nha/probes/reso-ranh.mjs': bo qua baseline: tep _acceptance/data-api-property-danh-ba-nha/probes/reso-ranh.mjs co o cay dang kiem nhung chua co o merge-base d9afaa945916bff9e9df3141a81355cd67db7768 — eval moi, chay tren code cu khong phan biet gi

## Variance

none — every multi-run eval is uniform

## Iterations

Round 1: tat ca 11 eval xanh, khong eval that bai; verdict PASS.
