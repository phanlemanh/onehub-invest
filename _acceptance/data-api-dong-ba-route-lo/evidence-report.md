---
schema_version: 2
feature_slug: data-api-dong-ba-route-lo
verdict: REJECT
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 71e6ae239395b8cc62aed7b1129ac49f43096b8e
human_signoff:
---

# Evidence Report: data-api-dong-ba-route-lo

Round 1. Chín eval máy đều xanh, eval E7 (judgment) có đề xuất PASS và chờ người điền human_override. Verdict REJECT vì bốn lệnh suite hồi quy không gắn eval nào đỏ (app, app_ui, pipeline_a, pipeline_b), xem mục «Lệnh suite (hồi quy)».

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | test | PASS |
| E2 | AC-2 | test | PASS |
| E3 | AC-3 | test | PASS |
| E4 | AC-4 | test | PASS |
| E5 | AC-5 | test | PASS |
| E6 | AC-6 | script | PASS |
| E7 | AC-7 | judgment | PASS (đề xuất của hội đồng, chờ human_override) |
| E8 | AC-8 | script | PASS |
| E9 | AC-9 | test | PASS |
| E10 | AC-7 | script | PASS |

## Evidence

- eval: E1
  run_id: minted-data-api-dong-ba-route-lo-E1-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.dapi_drl
  verified_at: 2026-11-24T15:03:55Z
  output: |
    Lệnh: bash db/db-thu.sh oneinvest_suite_dapi --chay sh -c 'cd data-api && node --import tsx --test ... test/dong-ba-route.test.ts'
    ℹ duration_ms 152.995959
    Lượt chạy gộp chung với E2, E3, E4, E5 (một lệnh, một lần chạy, qua).

- eval: E2
  run_id: minted-data-api-dong-ba-route-lo-E2-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.dapi_drl
  verified_at: 2026-11-24T15:03:55Z
  output: |
    Cùng lệnh với E1 (dong-ba-route.test.ts), một lượt chạy qua.
    ℹ duration_ms 152.995959

- eval: E3
  run_id: minted-data-api-dong-ba-route-lo-E3-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.dapi_drl
  verified_at: 2026-11-24T15:03:55Z
  output: |
    Cùng lệnh với E1 (dong-ba-route.test.ts), một lượt chạy qua.
    ℹ duration_ms 152.995959

- eval: E4
  run_id: minted-data-api-dong-ba-route-lo-E4-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.dapi_drl
  verified_at: 2026-11-24T15:03:55Z
  output: |
    Cùng lệnh với E1 (dong-ba-route.test.ts), một lượt chạy qua.
    ℹ duration_ms 152.995959

- eval: E5
  run_id: minted-data-api-dong-ba-route-lo-E5-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.dapi_drl
  verified_at: 2026-11-24T15:03:55Z
  output: |
    Cùng lệnh với E1 (dong-ba-route.test.ts), một lượt chạy qua.
    ℹ duration_ms 152.995959

- eval: E6
  run_id: minted-data-api-dong-ba-route-lo-E6-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.dapi_drl_pha
  verified_at: 2026-11-24T15:03:55Z
  output: |
    Lệnh: node _acceptance/data-api-dong-ba-route-lo/probes/pha.mjs
    pha: đủ 4 ô

- eval: E7
  judged_by: hội đồng ba lens (fresh context) — domain-correctness, operational-feasibility, spec-alignment
  verdict: PASS (đề xuất)
  rationale: Ba lens cùng đồng ý. README.md mô tả /v1/deals, /v1/coverage (areaId, name, ourListings) và /v1/listings/:id (photos {urls, source} với "self" hoặc null, không listingUrl) khớp «Cách làm» trong design.md. CLAUDE.md có đủ luật không đọc stg_* thô, không đọc bảng S02, không trả chữ bài, ảnh, tên nhóm, tên người gửi của S03.
  votes:
    - domain-correctness: PASS — README khớp design.md, không còn nhắc contact, postText, calibration*, coverageRatio, historyMonths, listingUrl như trường đang có; dòng cuối chỉ nêu dữ liệu hiệu chuẩn như giới hạn. CLAUDE.md có đủ bốn luật.
    - operational-feasibility: PASS — mô tả của ba route khớp design.md; chữ "calibration" chỉ ở dòng ranh giới dữ liệu để nói API không đọc hay trả dữ liệu đó. CLAUDE.md có đủ ba luật.
    - spec-alignment: PASS — hình trả về khớp «Cách làm»; các trường đã gỡ không còn được nhắc như đang có; "calibration" chỉ nằm trong câu nói API không đọc hay trả dữ liệu đó. CLAUDE.md có đủ luật.
  human_override:  # chi nguoi ghi

- eval: E8
  run_id: minted-data-api-dong-ba-route-lo-E8-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.dapi_drl_pham_vi
  verified_at: 2026-11-24T15:03:55Z
  output: |
    pham-vi: 24 tệp đổi, đều trong ranh giới; không đổi data-api/db, data-api/seed.sql, app/, pipeline/, db/; soát 6 tên nguồn thật (k ≥ 1, từ sourceRegistrySeeds), 0 khớp ngoài dạng định danh

- eval: E10
  run_id: minted-data-api-dong-ba-route-lo-E10-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.dapi_drl_pham_vi
  verified_at: 2026-11-24T15:03:55Z
  output: |
    Cùng lượt chạy probe pham-vi.mjs với E8 (probe tự chạy các ô chiều đỏ, trong đó có pha-docs); lượt chạy qua.

- eval: E9
  run_id: minted-data-api-dong-ba-route-lo-E9-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.data_api
  verified_at: 2026-11-24T15:03:55Z
  output: |
    Lệnh: cd data-api && npm run typecheck
    tsc --noEmit không báo lỗi.

### Lệnh suite (hồi quy)

- cmd: node scripts/suite-neu-doi.mjs agent -- 'cd agent && npm test'
  run_id: minted-data-api-dong-ba-route-lo-SUITE-node_scripts_suite_neu_doi_mjs_agent_cd_-r1
  exit_code: 0
  verified_at: 2026-11-24T15:03:55Z

- cmd: node scripts/suite-neu-doi.mjs app -- 'cd app && npx tsc --noEmit && npm run lint'
  run_id: minted-data-api-dong-ba-route-lo-SUITE-lint-r1
  exit_code: 2
  verified_at: 2026-11-24T15:03:55Z
  output: |
    suite-neu-doi: chạy app — đổi data-api/CLAUDE.md (+5 tệp trong vùng)
    Sáu lỗi TS2304 «Cannot find name» với LayoutProps (5 tệp layout.tsx) và PageProps (app/ops/data-flow/page.tsx).

- cmd: node scripts/suite-neu-doi.mjs app_ui -- 'cd app && npm test'
  run_id: minted-data-api-dong-ba-route-lo-SUITE-node_scripts_suite_neu_doi_mjs_app_ui_cd-r1
  exit_code: 1
  verified_at: 2026-11-24T15:03:55Z
  output: |
    Ca the-duyet-hien-nguoi-dang.test.tsx đỏ ở khẳng định; ca tin-rao-doi-chieu.test.tsx đỏ vì khoá ngoại sale_offers_area_id_fkey: Key (area_id)=(vn-hanoi) is not present in table "areas".

- cmd: node scripts/suite-neu-doi.mjs pipeline_a -- 'cd pipeline && npm run test:a'
  run_id: minted-data-api-dong-ba-route-lo-SUITE-test_a-r1
  exit_code: 1
  verified_at: 2026-11-24T15:03:55Z
  output: |
    Ca SLT-DC-7, SLT-DC-9 đỏ: «writeOffers: lượt nạp rỗng — không đối soát». Ca SLT-DC-10 đỏ: lần một thêm 0, cần 30.

- cmd: node scripts/suite-neu-doi.mjs pipeline_b -- 'cd pipeline && npm run test:b'
  run_id: minted-data-api-dong-ba-route-lo-SUITE-test_b-r1
  exit_code: 1
  verified_at: 2026-11-24T15:03:55Z
  output: |
    Các ca AU9-AC-5 và AU9-AC-10 trong reassign-areas.test.mjs đỏ: «DB local không có ranh giới cấp 6 nào của Hà Nội — không có mồi thật để chép».

- cmd: node scripts/suite-neu-doi.mjs ui_lint_rules -- 'cd app && npm run test:lint-rules'
  run_id: minted-data-api-dong-ba-route-lo-SUITE-test_lint_rules-r1
  exit_code: 0
  verified_at: 2026-11-24T15:03:55Z
  output: |
    Bỏ qua ui_lint_rules: không đổi app/**, db/**, CONTEXT.md, .claude/skills/onehub-ui/** (8 tệp đổi ngoài vùng)

- cmd: node scripts/suite-neu-doi.mjs portal_static -- 'node scripts/check-portal-compliance.mjs'
  run_id: minted-data-api-dong-ba-route-lo-SUITE-node_scripts_suite_neu_doi_mjs_portal_st-r1
  exit_code: 0
  verified_at: 2026-11-24T15:03:55Z
  output: |
    Bỏ qua portal_static: không đổi app/**, db/**, scripts/check-portal-compliance.mjs, scripts/check-ops-tier-a.mjs … (+6) (8 tệp đổi ngoài vùng)

## Known limits

## Ngoài hợp đồng

## Analyst

none — mọi eval feature đều không đo được baseline (xem dưới), nên không có eval nào được xác nhận là không phân biệt.

Baseline không đo:
- bash db/db-thu.sh oneinvest_suite_dapi --chay sh -c 'cd data-api && node --import tsx --test --test-reporter=spec --test-concurrency=1 test/dong-ba-route.test.ts': bo qua baseline: tep data-api/test/dong-ba-route.test.ts co o cay dang kiem nhung chua co o merge-base dc5ff708150cbf2cfdb273654923fb3c5b888461 — eval moi, chay tren code cu khong phan biet gi
- node _acceptance/data-api-dong-ba-route-lo/probes/pha.mjs: bo qua baseline: tep _acceptance/data-api-dong-ba-route-lo/probes/pha.mjs co o cay dang kiem nhung chua co o merge-base dc5ff708150cbf2cfdb273654923fb3c5b888461 — eval moi, chay tren code cu khong phan biet gi
- node _acceptance/data-api-dong-ba-route-lo/probes/pham-vi.mjs: bo qua baseline: tep _acceptance/data-api-dong-ba-route-lo/probes/pham-vi.mjs co o cay dang kiem nhung chua co o merge-base dc5ff708150cbf2cfdb273654923fb3c5b888461 — eval moi, chay tren code cu khong phan biet gi
- cd data-api && npm run typecheck: exit 127 — lenh/script khong ton tai o cho dung (command not found) — HA TANG CHAM, khong phai san pham do

Lệnh fail không gắn eval: bốn lệnh suite (app, app_ui, pipeline_a, pipeline_b) nêu ở mục «Lệnh suite (hồi quy)». Đầu ra cho thấy lỗi nằm ở kiểu LayoutProps/PageProps của app và ở DB thử thiếu dữ liệu nền (bảng areas, ranh giới cấp 6 Hà Nội, dữ liệu nạp), không ở tệp nào trong data-api. Người quyết ở Cổng 2 cần xác nhận đây là nền máy M5 hay lỗi hồi quy.

## Variance

none — mọi eval nhiều lượt đều đồng đều (mọi eval chạy một lượt, xác định).

## Iterations

Round 1: chín eval máy xanh, E7 đề xuất PASS chờ người; bốn lệnh suite không gắn eval (app, app_ui, pipeline_a, pipeline_b) đỏ nên verdict REJECT. Trả về cho người xác nhận là nền máy hay hồi quy.
