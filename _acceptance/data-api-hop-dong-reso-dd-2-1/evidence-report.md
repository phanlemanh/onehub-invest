---
schema_version: 2
feature_slug: data-api-hop-dong-reso-dd-2-1
verdict: PASS
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: ae9fd807a75c58b8fe8f22b5ef692499fa0bbb97
human_signoff: Mạnh 2026-11-27
---

# Evidence Report: data-api-hop-dong-reso-dd-2-1

Round 2. Nội dung thay trọn round cũ; lịch sử round nằm ở mục Iterations.

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
| E8 | AC-8 | judgment | PASS |
| E9 | AC-9 | script | PASS |
| E10 | AC-10 | script | PASS |
| E11 | AC-10 | judgment | PASS |
| E12 | AC-10 | test | PASS |
| E13 | AC-10 | test | PASS |

## Evidence

- eval: E1
  run_id: minted-data-api-hop-dong-reso-dd-2-1-E1-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.dapi_reso
  verified_at: 2026-11-27T12:39:48Z
  output: |
    bash db/db-thu.sh oneinvest_suite_dapi --chay sh -c 'cd data-api && node --import tsx --test --test-reporter=spec --test-concurrency=1 test/listing-reso.test.ts test/dong-ba-route.test.ts'
    ℹ duration_ms 2570.30025

- eval: E2
  run_id: minted-data-api-hop-dong-reso-dd-2-1-E2-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.dapi_reso
  verified_at: 2026-11-27T12:39:48Z
  output: |
    cùng lệnh dapi_reso với E1
    ℹ duration_ms 2570.30025

- eval: E3
  run_id: minted-data-api-hop-dong-reso-dd-2-1-E3-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.dapi_reso
  verified_at: 2026-11-27T12:39:48Z
  output: |
    cùng lệnh dapi_reso với E1
    ℹ duration_ms 2570.30025

- eval: E4
  run_id: minted-data-api-hop-dong-reso-dd-2-1-E4-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.dapi_reso
  verified_at: 2026-11-27T12:39:48Z
  output: |
    cùng lệnh dapi_reso với E1
    ℹ duration_ms 2570.30025

- eval: E5
  run_id: minted-data-api-hop-dong-reso-dd-2-1-E5-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.dapi_reso
  verified_at: 2026-11-27T12:39:48Z
  output: |
    cùng lệnh dapi_reso với E1
    ℹ duration_ms 2570.30025

- eval: E14
  run_id: minted-data-api-hop-dong-reso-dd-2-1-E14-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.dapi_reso
  verified_at: 2026-11-27T12:39:48Z
  output: |
    cùng lệnh dapi_reso với E1
    ℹ duration_ms 2570.30025

- eval: E13
  run_id: minted-data-api-hop-dong-reso-dd-2-1-E13-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.dapi_reso
  verified_at: 2026-11-27T12:39:48Z
  output: |
    cùng lệnh dapi_reso với E1
    ℹ duration_ms 2570.30025

- eval: E6
  run_id: minted-data-api-hop-dong-reso-dd-2-1-E6-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.dapi_reso_pha
  verified_at: 2026-11-27T12:39:48Z
  output: |
    node _acceptance/data-api-hop-dong-reso-dd-2-1/probes/pha.mjs
    pha: đủ 4 ô

- eval: E7
  run_id: minted-data-api-hop-dong-reso-dd-2-1-E7-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.dapi_reso_hop_dong
  verified_at: 2026-11-27T12:39:48Z
  output: |
    node _acceptance/data-api-hop-dong-reso-dd-2-1/probes/hop-dong.mjs
    hop-dong: 35 khoá (21 field DD 2.1, 14 extension), 12 giá trị lookup — đều khớp DD 2.1 2026-10-07T14:55:22.000Z và mappings.yaml

- eval: E9
  run_id: minted-data-api-hop-dong-reso-dd-2-1-E9-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.dapi_reso_luoc_do
  verified_at: 2026-11-27T12:39:48Z
  output: |
    node _acceptance/data-api-hop-dong-reso-dd-2-1/probes/luoc-do-mau.mjs
    luoc-do: nền 30c13f6e0; lược đồ mẫu hôm nay dựng sạch, 13 đường đúng mã; bản cũ đỏ

- eval: E10
  run_id: minted-data-api-hop-dong-reso-dd-2-1-E10-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.dapi_reso_pham_vi
  verified_at: 2026-11-27T12:39:48Z
  output: |
    node _acceptance/data-api-hop-dong-reso-dd-2-1/probes/pham-vi.mjs
    pham-vi: nền 30c13f6e0; 65 tệp đổi, đều trong ranh giới; mappings.yaml chỉ đổi meta, ba mục canonical, thêm listings, api_extensions (cộng một ngoại lệ lint chuyển tệp); soát 6 tên nguồn thật trên toà

- eval: E12
  run_id: minted-data-api-hop-dong-reso-dd-2-1-E12-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.data_api
  verified_at: 2026-11-27T12:39:48Z
  output: |
    cd data-api && npm run typecheck
    tsc --noEmit không lỗi

### Phán đoán (judgment)

- eval: E8
  judged_by: judge-subagent (fresh context), panel đề xuất ba lens
  verdict: PASS
  rationale: |
    - domain-correctness: PASS — mappings.yaml có meta.dd_version "2.1"; offer_id → ListingKey, price_perm2 → SalePricePerArea (ghi cả LeasePricePerArea cho tin thuê), first_seen → OnMarketTimestamp. Mục listings ánh xạ mọi cột design §2 liệt kê. Cả 14 khoá extension trong listing.ts đều có mục trong api_extensions.listing, đủ sáu mục tra_cuu, ly_do, migration, check, khai_bao, dq.
    - operational-feasibility: PASS — cả ba vế đạt; api_extensions.listing có đúng 14 mục khớp 14 khoá extension trong listing.ts, mỗi mục đủ sáu mục và dq trỏ data-api/test/listing-reso.test.ts.
    - spec-alignment: PASS — dd_version "2.1", ba ánh xạ khoá chính đúng; mục listings phủ mọi cột thuê ngắn hạn của design §2; 14 khoá extension khớp 14 mục api_extensions.listing, đủ sáu điều kiện ADR-0011 Qđ 3.
  required_evidence:
    - (judge không nêu bằng-chứng-thiếu)
  human_override:  # chi nguoi ghi

- eval: E11
  judged_by: judge-subagent (fresh context), panel đề xuất ba lens
  verdict: PASS
  rationale: |
    - domain-correctness: PASS — README.md có bảng tên cũ → tên mới khớp design.md §2, đủ khoá, field DD 2.1, cột tên cũ, đúng ba extension so giá (belowMedianPct, comparableMedianPricePerArea, priceRank). Mô tả /v1/listings, /v1/listings/:listingKey và minBelowMedianPct đúng hình mới; tên cũ chỉ ở cột «Old name» và dòng /v1/deals 410 Gone. CLAUDE.md có luật khoá Listing chỉ thêm qua src/contract/listing.ts, tra DD 2.1 trước, khoá không có trong DD khai ở api_extensions.listing.
    - operational-feasibility: PASS — README có bảng khoá mới / field DD 2.1 / tên cũ khớp design.md §2; /v1/deals chỉ còn ghi là 410 Gone; CLAUDE.md có luật khoá Listing và đường khai extension.
    - spec-alignment: PASS — bảng README khớp từng dòng bảng §2 của design.md; /v1/deals ghi là 410 Gone; tên cũ chỉ ở cột «Old name»; CLAUDE.md có luật khoá Listing và RESO DD 2.1.
  required_evidence:
    - (judge không nêu bằng-chứng-thiếu)
  human_override:  # chi nguoi ghi

### Lệnh suite (hồi quy)

- cmd: node scripts/suite-neu-doi.mjs agent -- 'cd agent && npm test'
  run_id: minted-data-api-hop-dong-reso-dd-2-1-SUITE-node_scripts_suite_neu_doi_mjs_agent_cd_-r2
  exit_code: 0
  verified_at: 2026-11-27T12:39:48Z

- cmd: node scripts/suite-neu-doi.mjs app -- 'cd app && npx tsc --noEmit && npm run lint'
  run_id: minted-data-api-hop-dong-reso-dd-2-1-SUITE-lint-r2
  exit_code: 0
  verified_at: 2026-11-27T12:39:48Z

- cmd: node scripts/suite-neu-doi.mjs app_ui -- 'cd app && npm test'
  run_id: minted-data-api-hop-dong-reso-dd-2-1-SUITE-node_scripts_suite_neu_doi_mjs_app_ui_cd-r2
  exit_code: 0
  verified_at: 2026-11-27T12:39:48Z

- cmd: node scripts/suite-neu-doi.mjs pipeline_a -- 'cd pipeline && npm run test:a'
  run_id: minted-data-api-hop-dong-reso-dd-2-1-SUITE-test_a-r2
  exit_code: 0
  verified_at: 2026-11-27T12:39:48Z

- cmd: node scripts/suite-neu-doi.mjs pipeline_b -- 'cd pipeline && npm run test:b'
  run_id: minted-data-api-hop-dong-reso-dd-2-1-SUITE-test_b-r2
  exit_code: 0
  verified_at: 2026-11-27T12:39:48Z

- cmd: node scripts/suite-neu-doi.mjs pipeline_that -- 'cd pipeline && npm run test:that'
  run_id: minted-data-api-hop-dong-reso-dd-2-1-SUITE-test_that-r2
  exit_code: 0
  verified_at: 2026-11-27T12:39:48Z

- cmd: node scripts/suite-neu-doi.mjs ui_lint_rules -- 'cd app && npm run test:lint-rules'
  run_id: minted-data-api-hop-dong-reso-dd-2-1-SUITE-test_lint_rules-r2
  exit_code: 0
  verified_at: 2026-11-27T12:39:48Z

- cmd: node scripts/suite-neu-doi.mjs portal_static -- 'node scripts/check-portal-compliance.mjs'
  run_id: minted-data-api-hop-dong-reso-dd-2-1-SUITE-node_scripts_suite_neu_doi_mjs_portal_st-r2
  exit_code: 0
  verified_at: 2026-11-27T12:39:48Z

máy: M5 (M5 Max 18 nhân, colima 16/96) · DB: bản đầy đủ máy thu chép sang 26/11 05:45Z · ca đỏ có tên: không

Ghi chú phiên chấm M5 (sau lượt, không đổi verdict của kit): vòng 2 trên 2b5f0f7505e1fa776a3bb1309471633dd546df2f, khe ba; soát 2b5f0f750-20261127T193732 chỉ đỏ QV-AC-5. Hai chỗ vòng 1 bác: AC-11 — test nay lấy route asset-stats.ts ở merge-base bằng git show, gắn vào Hono riêng và deepEqual cả mã lẫn THÂN với price-stats theo từng tham số; AC-9 — chiều đỏ của luoc-do-mau.mjs đòi đúng bốn «răng» đã kê (RANG.every), không nhận lỗi áp bất kỳ. Review vòng này không còn finding nào trên AC-11 hay AC-9. Mọi eval máy PASS, mọi suite thoát 0; E8, E11 judgment đề xuất PASS. Ca app/tests/chuyen-huong-ma-thi-truong.itest.tsx chỉ qua typecheck trên M5 (không eval nào đòi chạy). Chấm trên M5: ON22-AC-10 không chạy (HT33). Một finding medium trong hợp đồng AC-3 (lọc market/area không có tin nào bị loại để đối chứng) — kit chỉ REJECT theo high nên giữ PASS, người ký Cổng 2 cần thấy. NGOÀI HỢP ĐỒNG, mức HIGH, đề xuất hợp đồng mới: /v1/listings đọc sale_offers không loại nguồn S02, S08 (AGENTS.md luật 5, 6: «S02, S08 không tính là tin hiển thị được») — tin và giá của hai nguồn này có thể ra API công khai kèm mã nguồn; app đã có OFFER_HIDDEN_SOURCES. Người ký nên xem trước khi mở API. Kit báo runLogWriteFailed — run-log do phiên chấm ghi.

## Known limits

## Ngoài hợp đồng

## Analyst

carried tu round 1 — baseline khong do lai round nay

Không có eval nào bị liệt kê là không-phân-biệt. Trường baseline của mọi block ghi n-a vì round này không đo lại.

## Variance

none — every multi-run eval is uniform

## Iterations

Round 1: lịch sử chi tiết giữ ở run-log.jsonl của hồ sơ, không chép lại ở đây.
Round 2: toàn bộ eval máy xanh, hai eval judgment đề xuất PASS (human_override để trống), các lệnh suite xanh; verdict PASS.

### Re-pin lần 1 — 2026-11-27, do ghim lại bằng làn eval
run_id: repin-20261127T224541Z-33745
sha: ae9fd807a75c58b8fe8f22b5ef692499fa0bbb97 · suites: 8 lệnh exit 0 · evals: 12/12 eval máy đạt kỳ vọng · ngoài làn máy: E8 (E8 không khai paths), E11 (E11 không khai paths) · AC không có chốt máy: AC-8
