---
schema_version: 2
feature_slug: data-api-hop-dong-reso-dd-2-1
verdict: REJECT
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 2b768db014e0c4384bd2eda1e453b39b3ca1c863
human_signoff:
---

# Evidence Report: data-api-hop-dong-reso-dd-2-1

Round 1. Verdict REJECT do máy tính sẵn: không eval máy nào đỏ, nhưng review tìm ra thước đo yếu ở AC-5, AC-7, AC-9, AC-10, AC-11 (xem review-findings.md, mục «Trong hợp đồng»).

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | test | PASS |
| E2 | AC-2 | test | PASS |
| E3 | AC-3 | test | PASS |
| E4 | AC-4 | test | PASS |
| E5 | AC-5 | test | PASS |
| E14 | AC-11 | test | PASS |
| E6 | AC-6 | script | PASS |
| E7 | AC-7 | script | PASS |
| E8 | AC-8 | judgment | PASS (đề xuất, chờ người) |
| E9 | AC-9 | script | PASS |
| E10 | AC-10 | script | PASS |
| E11 | AC-10 | judgment | PASS (đề xuất, chờ người) |
| E12 | AC-10 | test | PASS |
| E13 | AC-10 | test | PASS |

## Evidence

- eval: E1
  run_id: minted-data-api-hop-dong-reso-dd-2-1-E1-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.dapi_reso
  verified_at: 2026-11-27T11:53:38Z
  output: |
    lệnh: bash db/db-thu.sh oneinvest_suite_dapi --chay sh -c 'cd data-api && node --import tsx --test ... test/listing-reso.test.ts test/dong-ba-route.test.ts'
    ℹ duration_ms 3196.0435
    __EXIT=0

- eval: E2
  run_id: minted-data-api-hop-dong-reso-dd-2-1-E2-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.dapi_reso
  verified_at: 2026-11-27T11:53:38Z
  output: |
    cùng lệnh với E1 (một lượt chạy phủ E1, E2, E3, E4, E5, E14, E13)
    ℹ duration_ms 3196.0435
    __EXIT=0

- eval: E3
  run_id: minted-data-api-hop-dong-reso-dd-2-1-E3-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.dapi_reso
  verified_at: 2026-11-27T11:53:38Z
  output: |
    cùng lệnh với E1
    ℹ duration_ms 3196.0435
    __EXIT=0

- eval: E4
  run_id: minted-data-api-hop-dong-reso-dd-2-1-E4-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.dapi_reso
  verified_at: 2026-11-27T11:53:38Z
  output: |
    cùng lệnh với E1
    ℹ duration_ms 3196.0435
    __EXIT=0

- eval: E5
  run_id: minted-data-api-hop-dong-reso-dd-2-1-E5-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.dapi_reso
  verified_at: 2026-11-27T11:53:38Z
  output: |
    cùng lệnh với E1
    ℹ duration_ms 3196.0435
    __EXIT=0

- eval: E14
  run_id: minted-data-api-hop-dong-reso-dd-2-1-E14-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.dapi_reso
  verified_at: 2026-11-27T11:53:38Z
  output: |
    cùng lệnh với E1
    ℹ duration_ms 3196.0435
    __EXIT=0

- eval: E13
  run_id: minted-data-api-hop-dong-reso-dd-2-1-E13-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.dapi_reso
  verified_at: 2026-11-27T11:53:38Z
  output: |
    cùng lệnh với E1
    ℹ duration_ms 3196.0435
    __EXIT=0

- eval: E6
  run_id: minted-data-api-hop-dong-reso-dd-2-1-E6-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.dapi_reso_pha
  verified_at: 2026-11-27T11:53:38Z
  output: |
    lệnh: node _acceptance/data-api-hop-dong-reso-dd-2-1/probes/pha.mjs
    pha: đủ 4 ô
    __EXIT=0

- eval: E7
  run_id: minted-data-api-hop-dong-reso-dd-2-1-E7-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.dapi_reso_hop_dong
  verified_at: 2026-11-27T11:53:38Z
  output: |
    lệnh: node _acceptance/data-api-hop-dong-reso-dd-2-1/probes/hop-dong.mjs
    hop-dong: 35 khoá (21 field DD 2.1, 14 extension), 12 giá trị lookup — đều khớp DD 2.1 2026-10-07T14:55:22.000Z và mappings.yaml
    __EXIT=0

- eval: E9
  run_id: minted-data-api-hop-dong-reso-dd-2-1-E9-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.dapi_reso_luoc_do
  verified_at: 2026-11-27T11:53:38Z
  output: |
    lệnh: node _acceptance/data-api-hop-dong-reso-dd-2-1/probes/luoc-do-mau.mjs
    luoc-do: nền 30c13f6e0; lược đồ mẫu hôm nay dựng sạch, 13 đường đúng mã; bản cũ đỏ
    __EXIT=0

- eval: E10
  run_id: minted-data-api-hop-dong-reso-dd-2-1-E10-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.dapi_reso_pham_vi
  verified_at: 2026-11-27T11:53:38Z
  output: |
    lệnh: node _acceptance/data-api-hop-dong-reso-dd-2-1/probes/pham-vi.mjs
    pham-vi: nền 30c13f6e0; 61 tệp đổi, đều trong ranh giới; mappings.yaml chỉ đổi meta, ba mục canonical, thêm listings, api_extensions (cộng một ngoại lệ lint chuyển tệp); soát 6 tên nguồn thật trên toà
    __EXIT=0

- eval: E12
  run_id: minted-data-api-hop-dong-reso-dd-2-1-E12-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.data_api
  verified_at: 2026-11-27T11:53:38Z
  output: |
    lệnh: cd data-api && npm run typecheck
    tsc --noEmit không lỗi
    __EXIT=0

### Judgment (đề xuất panel, chờ người quyết)

- eval: E8
  judged_by: judge panel đề xuất (domain-correctness, operational-feasibility, spec-alignment), fresh context
  verdict: PASS
  rationale: |
    - domain-correctness: PASS — Cả ba vế đạt. meta.dd_version là "2.1"; offer_id ánh xạ ListingKey; price_perm2 ánh xạ SalePricePerArea, note nêu LeasePricePerArea cho tin thuê; first_seen ánh xạ OnMarketTimestamp, khớp listing.ts. Mục listings có đủ các cột design.md §2. listing.ts có 14 khoá extension và api_extensions.listing có đúng 14 mục, mỗi mục đủ sáu trường. Lưu ý: design.md §5 ghi first_seen sang OriginalEntryTimestamp, nhưng mappings và listing.ts dùng OnMarketTimestamp, đúng với câu hỏi và sổ d-20261127T030832Z-28.
    - operational-feasibility: PASS — mappings.yaml có meta.dd_version "2.1", offer_id sang ListingKey, price_perm2 sang SalePricePerArea hoặc LeasePricePerArea, first_seen sang OnMarketTimestamp. Mục listings phủ đủ cột bảng thuê ngắn hạn của design §2. api_extensions.listing có đúng 14 mục cho 14 khoá extension, mỗi mục đủ sáu điều kiện ADR-0011 Qđ 3.
    - spec-alignment: PASS — Cả ba vế đạt: dd_version 2.1 và ba ánh xạ ListingKey, SalePricePerArea hoặc LeasePricePerArea, OnMarketTimestamp; mục listings ánh xạ đủ 15 cột thuê ngắn hạn của design §2; 14 khoá extension có đúng 14 mục api_extensions.listing, mỗi mục đủ sáu khoá (tra_cuu, ly_do, migration, check, khai_bao, dq trỏ data-api/test/listing-reso.test.ts).
  human_override:  # chi nguoi ghi

- eval: E11
  judged_by: judge panel đề xuất (domain-correctness, operational-feasibility, spec-alignment), fresh context
  verdict: PASS
  rationale: |
    - domain-correctness: PASS — Bảng "Old name" trong data-api/README.md khớp từng dòng với bảng §2 của design.md. README mô tả /v1/listings (kind, market, area, bedroomsTotal, limit, offset) và /v1/listings/:listingKey đúng hình mới. /v1/deals ghi 410 Gone, gộp vào /v1/listings?minBelowMedianPct= và có ba extension so giá. Tên cũ chỉ còn ở cột "Old name" và dòng 410. data-api/CLAUDE.md có đủ luật khoá Listing, tra RESO DD 2.1 trước, extension khai ở api_extensions.listing.
    - operational-feasibility: PASS — README.md có bảng "Old name (≤ 0.1)" khớp design.md §2, mô tả đúng hình mới của /v1/listings, /v1/listings/:listingKey và bộ lọc minBelowMedianPct kèm ba extension. /v1/deals chỉ xuất hiện như 410 Gone. CLAUDE.md có luật đủ ba ý: khoá Listing chỉ thêm qua src/contract/listing.ts, tra RESO DD 2.1 trước, khoá ngoài DD là extension khai ở api_extensions.listing.
    - spec-alignment: PASS — README.md có bảng tên cũ sang tên RESO khớp từng dòng với design.md §2, mô tả /v1/listings và /v1/listings/:listingKey, ghi /v1/deals là 410 Gone gộp vào /v1/listings?minBelowMedianPct= kèm ba extension. Tên cũ chỉ nằm ở cột "Old name". CLAUDE.md có luật khoá Listing, tra DD 2.1, khai extension.
  human_override:  # chi nguoi ghi

### Lệnh suite (hồi quy)

- cmd: node scripts/suite-neu-doi.mjs agent -- 'cd agent && npm test'
  run_id: minted-data-api-hop-dong-reso-dd-2-1-SUITE-node_scripts_suite_neu_doi_mjs_agent_cd_-r1
  exit_code: 0
  verified_at: 2026-11-27T11:53:38Z

- cmd: node scripts/suite-neu-doi.mjs app -- 'cd app && npx tsc --noEmit && npm run lint'
  run_id: minted-data-api-hop-dong-reso-dd-2-1-SUITE-lint-r1
  exit_code: 0
  verified_at: 2026-11-27T11:53:38Z

- cmd: node scripts/suite-neu-doi.mjs app_ui -- 'cd app && npm test'
  run_id: minted-data-api-hop-dong-reso-dd-2-1-SUITE-node_scripts_suite_neu_doi_mjs_app_ui_cd-r1
  exit_code: 0
  verified_at: 2026-11-27T11:53:38Z

- cmd: node scripts/suite-neu-doi.mjs pipeline_a -- 'cd pipeline && npm run test:a'
  run_id: minted-data-api-hop-dong-reso-dd-2-1-SUITE-test_a-r1
  exit_code: 0
  verified_at: 2026-11-27T11:53:38Z

- cmd: node scripts/suite-neu-doi.mjs pipeline_b -- 'cd pipeline && npm run test:b'
  run_id: minted-data-api-hop-dong-reso-dd-2-1-SUITE-test_b-r1
  exit_code: 0
  verified_at: 2026-11-27T11:53:38Z

- cmd: node scripts/suite-neu-doi.mjs pipeline_that -- 'cd pipeline && npm run test:that'
  run_id: minted-data-api-hop-dong-reso-dd-2-1-SUITE-test_that-r1
  exit_code: 0
  verified_at: 2026-11-27T11:53:38Z

- cmd: node scripts/suite-neu-doi.mjs ui_lint_rules -- 'cd app && npm run test:lint-rules'
  run_id: minted-data-api-hop-dong-reso-dd-2-1-SUITE-test_lint_rules-r1
  exit_code: 0
  verified_at: 2026-11-27T11:53:38Z

- cmd: node scripts/suite-neu-doi.mjs portal_static -- 'node scripts/check-portal-compliance.mjs'
  run_id: minted-data-api-hop-dong-reso-dd-2-1-SUITE-node_scripts_suite_neu_doi_mjs_portal_st-r1
  exit_code: 0
  verified_at: 2026-11-27T11:53:38Z

máy: M5 (M5 Max 18 nhân, colima 16/96) · DB: bản đầy đủ máy thu chép sang 26/11 05:45Z · ca đỏ có tên: không

Ghi chú phiên chấm M5 (sau lượt, không đổi verdict của kit): vòng 1 trên 2b768db014e0c4384bd2eda1e453b39b3ca1c863 (đã gộp main do U2), khe ba; soát 2b768db01-20261127T185334 chỉ đỏ QV-AC-5. Ca app/tests/chuyen-huong-ma-thi-truong.itest.tsx KHÔNG chạy được trên M5 (acceptance.mjs thoát 2 vì DB đã áp 064) — ca này chỉ qua typecheck trên M5; chạy thật ở CI/làn Mac mini; không eval nào của hồ sơ đòi chạy ca này. E8 và E9 chấm theo câu trong contract (E8 OnMarketTimestamp; E9 13 đường), hai panel judgment đề xuất PASS. Bảng pb5-truoc-sau.md: chạy lại scripts/data-api-ten-nguon.test.mjs trên M5 — 16/16 xanh, 0 bỏ qua (evidence/m5-pb5-truoc-sau.txt). Mọi eval máy PASS, mọi suite thoát 0. Chấm trên M5: ON22-AC-10 không chạy (HT33). REJECT do review xác nhận hai finding HIGH trong hợp đồng: AC-11 (PB2-AC-11 chỉ assert status 200, không so thân /v1/price-stats với /v1/asset-stats cũ như E14 hứa; dòng cấy có .catch nuốt lỗi) và AC-9 (chiều đỏ của luoc-do-mau.mjs nhận bất kỳ lỗi áp nào, trong khi lược đồ nền đã có lỗi sẵn); thêm bốn finding medium trong hợp đồng (AC-10, AC-5, AC-7). Ngoài hợp đồng: /v1/listings đọc sale_offers không lọc nguồn S02/S08, hạn tươi; lastSeenTimestamp tin ngắn hạn lệch múi giờ — đề xuất hợp đồng mới. Kit báo runLogWriteFailed — run-log do phiên chấm ghi.

## Known limits

## Ngoài hợp đồng

## Analyst

none — mọi eval feature đều chưa có baseline (n-a) nên không có eval nào được xác nhận là không-phân-biệt; xem mục dưới.

Baseline khong do:
- bash db/db-thu.sh oneinvest_suite_dapi --chay sh -c 'cd data-api && node --import tsx --test --test-reporter=spec --test-concurrency=1 test/listing-reso.test.ts test/dong-ba-route.test.ts': bo qua baseline: tep data-api/test/listing-reso.test.ts co o cay dang kiem nhung chua co o merge-base 30c13f6e03a1d8a3603a9c281bce85c98354406b — eval moi, chay tren code cu khong phan biet gi
- node _acceptance/data-api-hop-dong-reso-dd-2-1/probes/pha.mjs: bo qua baseline: tep _acceptance/data-api-hop-dong-reso-dd-2-1/probes/pha.mjs co o cay dang kiem nhung chua co o merge-base 30c13f6e03a1d8a3603a9c281bce85c98354406b — eval moi, chay tren code cu khong phan biet gi
- node _acceptance/data-api-hop-dong-reso-dd-2-1/probes/hop-dong.mjs: bo qua baseline: tep _acceptance/data-api-hop-dong-reso-dd-2-1/probes/hop-dong.mjs co o cay dang kiem nhung chua co o merge-base 30c13f6e03a1d8a3603a9c281bce85c98354406b — eval moi, chay tren code cu khong phan biet gi
- node _acceptance/data-api-hop-dong-reso-dd-2-1/probes/luoc-do-mau.mjs: bo qua baseline: tep _acceptance/data-api-hop-dong-reso-dd-2-1/probes/luoc-do-mau.mjs co o cay dang kiem nhung chua co o merge-base 30c13f6e03a1d8a3603a9c281bce85c98354406b — eval moi, chay tren code cu khong phan biet gi
- node _acceptance/data-api-hop-dong-reso-dd-2-1/probes/pham-vi.mjs: bo qua baseline: tep _acceptance/data-api-hop-dong-reso-dd-2-1/probes/pham-vi.mjs co o cay dang kiem nhung chua co o merge-base 30c13f6e03a1d8a3603a9c281bce85c98354406b — eval moi, chay tren code cu khong phan biet gi
- cd data-api && npm run typecheck: exit 127 — lenh/script khong ton tai o cho dung (command not found) — HA TANG CHAM, khong phai san pham do

## Variance

none — mọi eval nhiều lần chạy đều đồng nhất (không eval nào có runs > 1).

## Iterations

Round 1: không eval máy nào đỏ (failed_evals rỗng), nhưng review chỉ ra thước đo không chứng minh được lời hứa ở AC-11 (E14 chỉ assert mã 200), AC-10c (E13 chỉ assert âm tính), AC-5 (vế rent_lt có thể rỗng), AC-9 (chiều đỏ nhận mọi lỗi áp) và AC-7 (lookup lấy bằng grep mã nguồn). Returned to implementation.
