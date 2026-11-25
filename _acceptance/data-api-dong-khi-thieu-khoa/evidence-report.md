---
schema_version: 2
feature_slug: data-api-dong-khi-thieu-khoa
verdict: REJECT
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 30f77bb019a360197b14fd2a79b265608876210f
human_signoff:
---

# Evidence Report: data-api-dong-khi-thieu-khoa

Vòng 1. Mọi eval gắn AC đều chạy xanh, nhưng năm lệnh suite hồi quy không gắn eval nào thoát mã khác 0 nên kết luận chung là REJECT (failed_evals để trống vì không eval nào đỏ).

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | test | PASS |
| E2 | AC-2 | test | PASS |
| E3 | AC-3 | test | PASS |
| E4 | AC-4 | test | PASS |
| E5 | AC-5 | test | PASS |
| E6 | AC-6 | test | PASS |
| E7 | AC-7 | script | PASS |
| E8 | AC-8 | script | PASS |
| E9 | AC-8 | test | PASS |
| E11 | AC-8 | test | PASS |
| E10 | AC-9 | judgment | PASS (đề xuất của hội đồng, chưa có chữ người) |

## Evidence

- eval: E1
  run_id: minted-data-api-dong-khi-thieu-khoa-E1-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.dapi_khoa
  verified_at: 2026-11-25T14:24:03Z
  output: |
    bash db/db-thu.sh oneinvest_suite_dapi --chay sh -c 'cd data-api && node --import tsx --test ... test/auth-dong.test.ts'
    ℹ duration_ms 10210.015708

- eval: E2
  run_id: minted-data-api-dong-khi-thieu-khoa-E2-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.dapi_khoa
  verified_at: 2026-11-25T14:24:03Z
  output: |
    cùng lệnh với E1 (tệp auth-dong.test.ts, một lượt chạy)
    ℹ duration_ms 10210.015708

- eval: E3
  run_id: minted-data-api-dong-khi-thieu-khoa-E3-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.dapi_khoa
  verified_at: 2026-11-25T14:24:03Z
  output: |
    cùng lệnh với E1 (tệp auth-dong.test.ts, một lượt chạy)
    ℹ duration_ms 10210.015708

- eval: E4
  run_id: minted-data-api-dong-khi-thieu-khoa-E4-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.dapi_khoa
  verified_at: 2026-11-25T14:24:03Z
  output: |
    cùng lệnh với E1 (tệp auth-dong.test.ts, một lượt chạy)
    ℹ duration_ms 10210.015708

- eval: E5
  run_id: minted-data-api-dong-khi-thieu-khoa-E5-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.dapi_khoa
  verified_at: 2026-11-25T14:24:03Z
  output: |
    cùng lệnh với E1 (tệp auth-dong.test.ts, một lượt chạy)
    ℹ duration_ms 10210.015708

- eval: E6
  run_id: minted-data-api-dong-khi-thieu-khoa-E6-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.dapi_khoa
  verified_at: 2026-11-25T14:24:03Z
  output: |
    cùng lệnh với E1 (tệp auth-dong.test.ts, một lượt chạy)
    ℹ duration_ms 10210.015708

- eval: E7
  run_id: minted-data-api-dong-khi-thieu-khoa-E7-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.dapi_khoa_pha
  verified_at: 2026-11-25T14:24:03Z
  output: |
    node _acceptance/data-api-dong-khi-thieu-khoa/probes/pha.mjs
    pha: cây thật xanh

- eval: E8
  run_id: minted-data-api-dong-khi-thieu-khoa-E8-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.dapi_khoa_pham_vi
  verified_at: 2026-11-25T14:24:03Z
  output: |
    pham-vi: nền đỉnh HT19 0d48dfcb0 (HT19 chưa vào origin/main); 23 tệp đổi, đều trong ranh giới; package.json chỉ đổi scripts.dev; dong-ba-route.test.ts chỉ thêm 1 dòng NODE_ENV; soát 6 tên nguồn thật trên toàn văn ...

- eval: E9
  run_id: minted-data-api-dong-khi-thieu-khoa-E9-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.data_api
  verified_at: 2026-11-25T14:24:03Z
  output: |
    cd data-api && npm run typecheck
    (không lỗi)

- eval: E11
  run_id: minted-data-api-dong-khi-thieu-khoa-E11-r1
  exit_code: 0
  baseline: red
  verifier: config:executors.test.dapi_khoa_toan
  verified_at: 2026-11-25T14:24:03Z
  output: |
    chạy mọi data-api/test/*.test.ts trong một lượt trên DB thử
    ℹ duration_ms 10447.323333

### Lệnh suite (hồi quy)

Xanh:

- cmd: node scripts/suite-neu-doi.mjs ui_lint_rules -- 'cd app && npm run test:lint-rules'
  run_id: minted-data-api-dong-khi-thieu-khoa-SUITE-test_lint_rules-r1
  exit_code: 0
  verified_at: 2026-11-25T14:24:03Z

- cmd: node scripts/suite-neu-doi.mjs portal_static -- 'node scripts/check-portal-compliance.mjs'
  run_id: minted-data-api-dong-khi-thieu-khoa-SUITE-node_scripts_suite_neu_doi_mjs_portal_st-r1
  exit_code: 0
  verified_at: 2026-11-25T14:24:03Z

Đỏ (không gắn eval nào, là lý do của kết luận REJECT):

- cmd: node scripts/suite-neu-doi.mjs agent -- 'cd agent && npm test'
  run_id: minted-data-api-dong-khi-thieu-khoa-SUITE-node_scripts_suite_neu_doi_mjs_agent_cd_-r1
  exit_code: 1
  verified_at: 2026-11-25T14:24:03Z
  output: |
    Hàng loạt tệp trong agent/tests/ báo "test failed" ở dòng 1:1 (judge-pair, judge-run, model-agent, parsers, vlm-anh-s03, vocab-enrich và các tệp khác): tệp test không nạp được.

- cmd: node scripts/suite-neu-doi.mjs app -- 'cd app && npx tsc --noEmit && npm run lint'
  run_id: minted-data-api-dong-khi-thieu-khoa-SUITE-lint-r1
  exit_code: 1
  verified_at: 2026-11-25T14:24:03Z
  output: |
    tsc báo TS2304 "Cannot find name 'LayoutProps'" / "'PageProps'" ở app/src/app/**/layout.tsx và ops/data-flow/page.tsx (6 chỗ); không liên quan data-api.

- cmd: node scripts/suite-neu-doi.mjs app_ui -- 'cd app && npm test'
  run_id: minted-data-api-dong-khi-thieu-khoa-SUITE-node_scripts_suite_neu_doi_mjs_app_ui_cd-r1
  exit_code: 1
  verified_at: 2026-11-25T14:24:03Z
  output: |
    tin-rao-doi-chieu.test.tsx: khoá ngoại sale_offers_area_id_fkey vi phạm, "Key (area_id)=(vn-hanoi) is not present in table areas"; the-duyet-hien-nguoi-dang.test.tsx có assertion sai.

- cmd: node scripts/suite-neu-doi.mjs pipeline_a -- 'cd pipeline && npm run test:a'
  run_id: minted-data-api-dong-khi-thieu-khoa-SUITE-test_a-r1
  exit_code: 1
  verified_at: 2026-11-25T14:24:03Z
  output: |
    transform-zalo-loai-tin-doi-chieu: "writeOffers: lượt nạp rỗng — không đối soát"; SLT-DC-10 lần một thêm 0, cần 30.

- cmd: node scripts/suite-neu-doi.mjs pipeline_b -- 'cd pipeline && npm run test:b'
  run_id: minted-data-api-dong-khi-thieu-khoa-SUITE-test_b-r1
  exit_code: 1
  verified_at: 2026-11-25T14:24:03Z
  output: |
    reassign-areas.test.mjs: "DB local không có ranh giới cấp 6 nào của Hà Nội — không có mồi thật để chép" (AU9-AC-5, AU9-AC-10).

## Known limits

## Ngoài hợp đồng

## Analyst

none — moi eval feature deu red tren baseline (co phan biet)

Ghi chú: chỉ E11 đo được baseline (red). Các eval còn lại có baseline n-a, lý do ở mục dưới, nên chưa chứng minh được là phân biệt trên code cũ; E7 tự thân là phép đo pha (bản cũ đỏ, cây thật xanh).

Baseline khong do:
- bash db/db-thu.sh oneinvest_suite_dapi --chay sh -c 'cd data-api && node --import tsx --test --test-reporter=spec --test-concurrency=1 test/auth-dong.test.ts': bo qua baseline: tep data-api/test/auth-dong.test.ts co o cay dang kiem nhung chua co o merge-base 0d48dfcb067ea3c9c626a495baa84cb1bd59be68 — eval moi, chay tren code cu khong phan biet gi
- node _acceptance/data-api-dong-khi-thieu-khoa/probes/pha.mjs: bo qua baseline: tep _acceptance/data-api-dong-khi-thieu-khoa/probes/pha.mjs co o cay dang kiem nhung chua co o merge-base 0d48dfcb067ea3c9c626a495baa84cb1bd59be68 — eval moi, chay tren code cu khong phan biet gi
- node _acceptance/data-api-dong-khi-thieu-khoa/probes/pham-vi.mjs: bo qua baseline: tep _acceptance/data-api-dong-khi-thieu-khoa/probes/pham-vi.mjs co o cay dang kiem nhung chua co o merge-base 0d48dfcb067ea3c9c626a495baa84cb1bd59be68 — eval moi, chay tren code cu khong phan biet gi
- cd data-api && npm run typecheck: exit 127 — lenh/script khong ton tai o cho dung (command not found) — HA TANG CHAM, khong phai san pham do

## Judgment

- eval: E10
  judged_by: hội đồng judge (3 lens), đề xuất PASS
  verdict: PASS
  rationale: Cả bốn vế đạt. README (bảng biến môi trường, mục Authentication) và .env.example nêu đúng luật đóng mặc định; docker-compose.yml dùng ${DATA_API_KEYS:?set_api_keys}; CLAUDE.md mô tả auth.ts theo luật mới; không tệp nào còn câu nói khoá trống là tắt xác thực vô điều kiện.
  votes:
    - domain-correctness: PASS — README (dòng 48, bảng dòng 101–106) và .env.example (dòng 7–8) nêu chỉ NODE_ENV development hoặc test, không trên Vercel, mới chạy được khi không có khoá; docker-compose.yml dòng 30 và CLAUDE.md dòng 11 khớp luật mới.
    - operational-feasibility: PASS — tài liệu và compose khớp luật. Ghi chú nhỏ: ví dụ docker run trong README thiếu DATA_API_KEYS, nhưng không phải câu sai luật.
    - spec-alignment: PASS — bốn vế (bảng biến và mục Authentication, compose, CLAUDE.md, không còn câu khoá trống là tắt xác thực) đều đạt.
  human_override:  # chi nguoi ghi

## Variance

none — every multi-run eval is uniform

## Iterations

Round 1: không eval gắn AC nào đỏ; năm lệnh suite hồi quy không gắn eval (agent, app tsc+lint, app_ui, pipeline_a, pipeline_b) thoát mã khác 0, nên verdict REJECT. Trả về cho người xem: đối chiếu với baseline của các suite này trước khi quy cho nhánh.
