---
schema_version: 2
feature_slug: data-api-dong-ba-route-lo
verdict: REJECT
failed_evals: ["E1","E2","E3","E4","E5","E6"]
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 16340596fc98b23ee13f12a97adcc8c5281624ec
human_signoff:
---

# Evidence Report: data-api-dong-ba-route-lo (round 2)

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | test | FAIL |
| E2 | AC-2 | test | FAIL |
| E3 | AC-3 | test | FAIL |
| E4 | AC-4 | test | FAIL |
| E5 | AC-5 | test | FAIL |
| E6 | AC-6 | script | FAIL |
| E7 | AC-7 | judgment | PASS (đề xuất của hội đồng, chờ người chốt) |
| E8 | AC-8 | script | PASS |
| E9 | AC-9 | test | PASS |
| E10 | AC-7 | script | PASS |

Lệnh fail không gắn eval nào ngoài các eval đã liệt kê: không có. Hai lệnh fail đều gắn eval:
- `bash db/db-thu.sh oneinvest_suite_dapi --chay sh -c 'cd data-api && node --import tsx --test --test-reporter=spec --test-concurrency=1 test/dong-ba-route.test.ts'` gắn E1, E2, E3, E4, E5 (exit 1).
- `node _acceptance/data-api-dong-ba-route-lo/probes/pha.mjs` gắn E6 (exit 1).

## Evidence

- eval: E1
  run_id: minted-data-api-dong-ba-route-lo-E1-r2
  exit_code: 1
  baseline: n-a
  runs: 1
  verifier: config:executors.test.dapi_drl
  verified_at: 2026-11-26T06:53:15Z
  output: |
    DRL-AC-2 deals không đọc stg_zalo_posts ở hai nhánh: DRL deals CG8 đổi hình: thiếu tin canh
    DRL-AC-5 listings danh sách giữ hình: DRL listings danh sách đổi hình: thiếu listing cấy
    (đuôi chung của cả lệnh test; ca DRL-AC-1 cùng bị lỗi "thiếu tin canh trong data" ở lượt probe pha.mjs)

- eval: E2
  run_id: minted-data-api-dong-ba-route-lo-E2-r2
  exit_code: 1
  baseline: n-a
  runs: 1
  verifier: config:executors.test.dapi_drl
  verified_at: 2026-11-26T06:53:15Z
  output: |
    ✖ DRL-AC-2 deals không đọc stg_zalo_posts ở hai nhánh (3048.865541ms)
    AssertionError: DRL deals CG8 đổi hình: thiếu tin canh   (1 !== 0)

- eval: E3
  run_id: minted-data-api-dong-ba-route-lo-E3-r2
  exit_code: 1
  baseline: n-a
  runs: 1
  verifier: config:executors.test.dapi_drl
  verified_at: 2026-11-26T06:53:15Z
  output: |
    Cùng lệnh test chung của nhóm E1-E5, kết thúc với mã lỗi của cả lệnh. Trong đuôi đầu ra
    được giữ lại không có dòng riêng của ca DRL-AC-3; lệnh gộp đỏ nên eval bị tính đỏ.

- eval: E4
  run_id: minted-data-api-dong-ba-route-lo-E4-r2
  exit_code: 1
  baseline: n-a
  runs: 1
  verifier: config:executors.test.dapi_drl
  verified_at: 2026-11-26T06:53:15Z
  output: |
    Cùng lệnh test chung của nhóm E1-E5, kết thúc với mã lỗi của cả lệnh. Trong đuôi đầu ra
    được giữ lại không có dòng riêng của ca DRL-AC-4; lệnh gộp đỏ nên eval bị tính đỏ.

- eval: E5
  run_id: minted-data-api-dong-ba-route-lo-E5-r2
  exit_code: 1
  baseline: n-a
  runs: 1
  verifier: config:executors.test.dapi_drl
  verified_at: 2026-11-26T06:53:15Z
  output: |
    ✖ DRL-AC-5 listings danh sách giữ hình (458.989292ms)
    AssertionError: DRL listings danh sách đổi hình: thiếu listing cấy

- eval: E6
  run_id: minted-data-api-dong-ba-route-lo-E6-r2
  exit_code: 1
  baseline: n-a
  runs: 1
  verifier: config:executors.script.dapi_drl_pha
  verified_at: 2026-11-26T06:53:15Z
  output: |
    {"o":"coverage-cu","fail":4,"xanh":["DRL-AC-4"],"duong_khac_xanh":false,"dat":false}
    {"o":"listings-cu","fail":4,"xanh":["DRL-AC-3"],"duong_khac_xanh":false,"dat":false}
    ✖ DRL-AC-1 deals thiếu tin canh trong data; ✖ DRL-AC-2 deals CG8 thiếu tin canh; ✖ DRL-AC-5 listings thiếu listing cấy
    pha: 4 ô sai

- eval: E8
  run_id: minted-data-api-dong-ba-route-lo-E8-r2
  exit_code: 0
  baseline: n-a
  runs: 1
  verifier: config:executors.script.dapi_drl_pham_vi
  verified_at: 2026-11-26T06:53:15Z
  output: |
    pham-vi: 31 tệp đổi, đều trong ranh giới; không đổi data-api/db, data-api/seed.sql, pipeline/, db/;
    app/ chỉ ba test và chỉ bỏ contact, postText; soát 6 tên nguồn thật (k ≥ 1, từ sourceRegistrySeeds), 0 khớp

- eval: E10
  run_id: minted-data-api-dong-ba-route-lo-E10-r2
  exit_code: 0
  baseline: n-a
  runs: 1
  verifier: config:executors.script.dapi_drl_pham_vi
  verified_at: 2026-11-26T06:53:15Z
  output: |
    Cùng lượt chạy pham-vi.mjs với E8 (một lệnh phủ cả hai eval); lệnh xanh, không báo thước không đỏ ở pha-docs.

- eval: E9
  run_id: minted-data-api-dong-ba-route-lo-E9-r2
  exit_code: 0
  baseline: n-a
  runs: 1
  verifier: config:executors.test.data_api
  verified_at: 2026-11-26T06:53:15Z
  output: |
    cd data-api && npm run typecheck: không lỗi.

### Phán xét (judgment)

- eval: E7
  judged_by: hội đồng 3 lens (domain-correctness, operational-feasibility, spec-alignment)
  verdict: PASS
  rationale: Cả ba lens cùng đọc README và CLAUDE.md của data-api và thấy hai vế đạt; xem phiếu từng lens ở mục Analyst.
  human_override:  # chi nguoi ghi

### Lệnh suite (hồi quy)

- cmd: node scripts/suite-neu-doi.mjs agent -- 'cd agent && npm test'
  run_id: minted-data-api-dong-ba-route-lo-SUITE-node_scripts_suite_neu_doi_mjs_agent_cd_-r2
  exit_code: 0
  verified_at: 2026-11-26T06:53:15Z

- cmd: node scripts/suite-neu-doi.mjs app -- 'cd app && npx tsc --noEmit && npm run lint'
  run_id: minted-data-api-dong-ba-route-lo-SUITE-lint-r2
  exit_code: 0
  verified_at: 2026-11-26T06:53:15Z

- cmd: node scripts/suite-neu-doi.mjs app_ui -- 'cd app && npm test'
  run_id: minted-data-api-dong-ba-route-lo-SUITE-node_scripts_suite_neu_doi_mjs_app_ui_cd-r2
  exit_code: 0
  verified_at: 2026-11-26T06:53:15Z

- cmd: node scripts/suite-neu-doi.mjs pipeline_a -- 'cd pipeline && npm run test:a'
  run_id: minted-data-api-dong-ba-route-lo-SUITE-test_a-r2
  exit_code: 0
  verified_at: 2026-11-26T06:53:15Z

- cmd: node scripts/suite-neu-doi.mjs pipeline_b -- 'cd pipeline && npm run test:b'
  run_id: minted-data-api-dong-ba-route-lo-SUITE-test_b-r2
  exit_code: 0
  verified_at: 2026-11-26T06:53:15Z

- cmd: node scripts/suite-neu-doi.mjs pipeline_that -- 'cd pipeline && npm run test:that'
  run_id: minted-data-api-dong-ba-route-lo-SUITE-test_that-r2
  exit_code: 0
  verified_at: 2026-11-26T06:53:15Z

- cmd: node scripts/suite-neu-doi.mjs ui_lint_rules -- 'cd app && npm run test:lint-rules'
  run_id: minted-data-api-dong-ba-route-lo-SUITE-test_lint_rules-r2
  exit_code: 0
  verified_at: 2026-11-26T06:53:15Z

- cmd: node scripts/suite-neu-doi.mjs portal_static -- 'node scripts/check-portal-compliance.mjs'
  run_id: minted-data-api-dong-ba-route-lo-SUITE-node_scripts_suite_neu_doi_mjs_portal_st-r2
  exit_code: 0
  verified_at: 2026-11-26T06:53:15Z

## Known limits

## Ngoài hợp đồng

## Analyst

Eval không-phân-biệt (xanh cả trên nhánh lẫn baseline): none — moi eval feature deu red tren baseline (co phan biet). Ghi chú: E1 đến E6, E8, E10 đều không đo được trên baseline (xem mục dưới), nên chưa có bằng chứng red trên code cũ; mục này chỉ nói không eval nào được đo là xanh ở cả hai phía.

Baseline khong do
- bash db/db-thu.sh oneinvest_suite_dapi --chay sh -c 'cd data-api && node --import tsx --test --test-reporter=spec --test-concurrency=1 test/dong-ba-route.test.ts': bo qua baseline: tep data-api/test/dong-ba-route.test.ts co o cay dang kiem nhung chua co o merge-base 6286dd29a2b2d57ede549677566cf49e161168e6 — eval moi, chay tren code cu khong phan biet gi
- node _acceptance/data-api-dong-ba-route-lo/probes/pha.mjs: bo qua baseline: tep _acceptance/data-api-dong-ba-route-lo/probes/pha.mjs co o cay dang kiem nhung chua co o merge-base 6286dd29a2b2d57ede549677566cf49e161168e6 — eval moi, chay tren code cu khong phan biet gi
- node _acceptance/data-api-dong-ba-route-lo/probes/pham-vi.mjs: bo qua baseline: tep _acceptance/data-api-dong-ba-route-lo/probes/pham-vi.mjs co o cay dang kiem nhung chua co o merge-base 6286dd29a2b2d57ede549677566cf49e161168e6 — eval moi, chay tren code cu khong phan biet gi
- cd data-api && npm run typecheck: exit 127 — lenh/script khong ton tai o cho dung (command not found) — HA TANG CHAM, khong phai san pham do

Nhận định nguyên nhân (đọc từ đầu ra, chưa kết luận chắc): các ca đỏ đều có cùng triệu chứng "thiếu tin canh" hay "thiếu listing cấy", tức dòng cấy không xuất hiện trong trang trả về của đường không lọc. Review ghi một giả thuyết ở review-findings.md mục «Trong hợp đồng» (DB thử chép từ dữ liệu thật, trang đầu bị dòng thật chiếm). Đầu ra lượt này không tự chứng minh giả thuyết đó.

Phiếu hội đồng cho E7 (đề xuất PASS, để human_override trống cho người chốt)
- domain-correctness: PASS — README mô tả /v1/deals không có contact hay postText; /v1/coverage chỉ có areaId, name, ourListings; /v1/listings/:id có photos {urls, source} với source là "self" hoặc null, không có listingUrl. Chữ "calibration" chỉ xuất hiện ở câu ranh giới dữ liệu, không phải một trường. CLAUDE.md có đủ bốn luật: không đọc stg_* thô, không đọc bảng S02, không trả chữ bài, ảnh, tên nhóm hay tên người gửi của S03, và có ghi test canh.
- operational-feasibility: PASS — phần «Response fields» của README không còn contact hay postText, coverage chỉ có areaId, name, ourListings, listings/:id không có listingUrl và photos.source chỉ là "self" hoặc null; chữ «calibration» chỉ nằm trong câu phủ định ở mục ranh giới dữ liệu. CLAUDE.md có đủ bốn luật nói trên.
- spec-alignment: PASS — mục «Response fields» của README mô tả deals, coverage và listings/:id khớp mục «Cách làm» của design.md. Các từ contact, postText, calibration* chỉ còn trong câu phủ định ở «Data boundaries». Mục «Luật» của CLAUDE.md cấm đọc bảng stg_* thô, cấm đọc bảng S02, cấm trả chữ bài, ảnh, tên nhóm, tên người gửi của S03.

## Variance

none — every multi-run eval is uniform

## Iterations

Round 2: E1, E2, E3, E4, E5, E6 failed — các ca DRL không thấy dòng canh cấy ở trang đầu của đường không lọc trên DB thử (chi tiết trong review-findings.md); E6 đỏ theo vì ô «goc» của probe chạy cùng bộ test. Returned to implementation. Lịch sử round 1 không có trong dữ liệu truyền xuống lượt này, xem run-log.jsonl.
