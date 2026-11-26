---
schema_version: 2
feature_slug: data-api-dong-khi-thieu-khoa
verdict: PENDING-JUDGMENT
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 1cfe506219b87b18d8137cfc3ad2b17b7dc6cbfa
human_signoff:
---

# Evidence Report: data-api-dong-khi-thieu-khoa

máy: M5 (M5 Max 18 nhân, colima 16/96) · DB: bản đầy đủ máy thu chép sang 26/11 05:45Z · ca đỏ có tên: không (vòng 1 trên M5 cũ đỏ năm bộ kiểm chung do nền máy, nay xanh).

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
| E10 | AC-9 | judgment | PASS (panel đề xuất, chờ human_override ở Cổng 2) |

## Evidence

- eval: E1
  run_id: minted-data-api-dong-khi-thieu-khoa-E1-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.dapi_khoa
  verified_at: 2026-11-26T07:49:12Z
  output: |
    lệnh: bash db/db-thu.sh oneinvest_suite_dapi --chay sh -c 'cd data-api && node --import tsx --test --test-reporter=spec --test-concurrency=1 test/auth-dong.test.ts'
    ℹ duration_ms 10331.070916

- eval: E2
  run_id: minted-data-api-dong-khi-thieu-khoa-E2-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.dapi_khoa
  verified_at: 2026-11-26T07:49:12Z
  output: |
    cùng lệnh với E1 (một lượt chạy phủ E1 đến E6)
    ℹ duration_ms 10331.070916

- eval: E3
  run_id: minted-data-api-dong-khi-thieu-khoa-E3-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.dapi_khoa
  verified_at: 2026-11-26T07:49:12Z
  output: |
    cùng lệnh với E1 (một lượt chạy phủ E1 đến E6)
    ℹ duration_ms 10331.070916

- eval: E4
  run_id: minted-data-api-dong-khi-thieu-khoa-E4-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.dapi_khoa
  verified_at: 2026-11-26T07:49:12Z
  output: |
    cùng lệnh với E1 (một lượt chạy phủ E1 đến E6)
    ℹ duration_ms 10331.070916

- eval: E5
  run_id: minted-data-api-dong-khi-thieu-khoa-E5-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.dapi_khoa
  verified_at: 2026-11-26T07:49:12Z
  output: |
    cùng lệnh với E1 (một lượt chạy phủ E1 đến E6)
    ℹ duration_ms 10331.070916

- eval: E6
  run_id: minted-data-api-dong-khi-thieu-khoa-E6-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.dapi_khoa
  verified_at: 2026-11-26T07:49:12Z
  output: |
    cùng lệnh với E1 (một lượt chạy phủ E1 đến E6)
    ℹ duration_ms 10331.070916

- eval: E7
  run_id: minted-data-api-dong-khi-thieu-khoa-E7-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.dapi_khoa_pha
  verified_at: 2026-11-26T07:49:12Z
  output: |
    lệnh: node _acceptance/data-api-dong-khi-thieu-khoa/probes/pha.mjs
    pha: cây thật xanh

- eval: E8
  run_id: minted-data-api-dong-khi-thieu-khoa-E8-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.dapi_khoa_pham_vi
  verified_at: 2026-11-26T07:49:12Z
  output: |
    lệnh: node _acceptance/data-api-dong-khi-thieu-khoa/probes/pham-vi.mjs
    pham-vi: nền đỉnh HT19 0624fbce9 (HT19 chưa vào origin/main); 27 tệp đổi, đều trong ranh giới; package.json chỉ đổi scripts.dev; dong-ba-route.test.ts chỉ thêm 1 dòng NODE_ENV; soát 6 tên nguồn thật trên toàn văn (đầu ra máy bị cắt ở đây)

- eval: E9
  run_id: minted-data-api-dong-khi-thieu-khoa-E9-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.data_api
  verified_at: 2026-11-26T07:49:12Z
  output: |
    lệnh: cd data-api && npm run typecheck
    (không lỗi, không in gì thêm)

- eval: E11
  run_id: minted-data-api-dong-khi-thieu-khoa-E11-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.dapi_khoa_toan
  verified_at: 2026-11-26T07:49:12Z
  output: |
    lệnh: bash db/db-thu.sh oneinvest_suite_dapi --chay sh -c 'cd data-api && node --import tsx --test --test-reporter=spec --test-concurrency=1 test/*.test.ts'
    ℹ duration_ms 10531.096042

### Lệnh suite (hồi quy)

- cmd: node scripts/suite-neu-doi.mjs agent -- 'cd agent && npm test'
  run_id: minted-data-api-dong-khi-thieu-khoa-SUITE-node_scripts_suite_neu_doi_mjs_agent_cd_-r2
  exit_code: 0
  verified_at: 2026-11-26T07:49:12Z

- cmd: node scripts/suite-neu-doi.mjs app -- 'cd app && npx tsc --noEmit && npm run lint'
  run_id: minted-data-api-dong-khi-thieu-khoa-SUITE-lint-r2
  exit_code: 0
  verified_at: 2026-11-26T07:49:12Z

- cmd: node scripts/suite-neu-doi.mjs app_ui -- 'cd app && npm test'
  run_id: minted-data-api-dong-khi-thieu-khoa-SUITE-node_scripts_suite_neu_doi_mjs_app_ui_cd-r2
  exit_code: 0
  verified_at: 2026-11-26T07:49:12Z

- cmd: node scripts/suite-neu-doi.mjs pipeline_a -- 'cd pipeline && npm run test:a'
  run_id: minted-data-api-dong-khi-thieu-khoa-SUITE-test_a-r2
  exit_code: 0
  verified_at: 2026-11-26T07:49:12Z

- cmd: node scripts/suite-neu-doi.mjs pipeline_b -- 'cd pipeline && npm run test:b'
  run_id: minted-data-api-dong-khi-thieu-khoa-SUITE-test_b-r2
  exit_code: 0
  verified_at: 2026-11-26T07:49:12Z

- cmd: node scripts/suite-neu-doi.mjs pipeline_that -- 'cd pipeline && npm run test:that'
  run_id: minted-data-api-dong-khi-thieu-khoa-SUITE-test_that-r2
  exit_code: 0
  verified_at: 2026-11-26T07:49:12Z

- cmd: node scripts/suite-neu-doi.mjs ui_lint_rules -- 'cd app && npm run test:lint-rules'
  run_id: minted-data-api-dong-khi-thieu-khoa-SUITE-test_lint_rules-r2
  exit_code: 0
  verified_at: 2026-11-26T07:49:12Z

- cmd: node scripts/suite-neu-doi.mjs portal_static -- 'node scripts/check-portal-compliance.mjs'
  run_id: minted-data-api-dong-khi-thieu-khoa-SUITE-node_scripts_suite_neu_doi_mjs_portal_st-r2
  exit_code: 0
  verified_at: 2026-11-26T07:49:12Z

### Judgment

- eval: E10
  judged_by: judge panel (3 lens, fresh context)
  verdict: PASS
  rationale: Cả bốn vế đạt theo ba lens. README và .env.example nêu đúng luật đóng mặc định, docker-compose.yml dùng DATA_API_KEYS bắt buộc, CLAUDE.md mô tả auth.ts theo luật mới, không tệp nào còn câu nói khoá trống là tắt xác thực vô điều kiện.
  required_evidence:
    - (panel đề xuất PASS; người quyết ở Cổng 2)
  human_override:  # chi nguoi ghi

Phiếu từng lens (đề xuất):
- domain-correctness: PASS — bốn vế đạt; README, .env.example, docker-compose.yml và CLAUDE.md khớp luật đóng mặc định.
- operational-feasibility: PASS — tài liệu và compose nêu đúng luật; không còn câu nói khoá trống là tắt xác thực vô điều kiện.
- spec-alignment: PASS — bốn vế đạt; ghi chú rằng ví dụ docker run mục Self-Hosting không truyền DATA_API_KEYS nên sẽ không khởi động, nhưng nó không nói khoá trống thì tắt xác thực nên không phạm vế (4).

## Known limits

## Ngoài hợp đồng

## Analyst

carried tu round 1 — baseline khong do lai round nay.

Không có eval không-phân-biệt được liệt kê. Lệnh suite xanh cả hai phía là regression-guard thông thường, không liệt kê.

Baseline khong do: mọi eval ghi baseline n-a vì evals.yaml không đổi từ lần đo baseline cuối (round 1).

## Variance

none — không eval nào chạy nhiều lần; mọi eval deterministic (runs 1) và đồng nhất.

## Iterations

Round 1: lịch sử round cũ nằm trong run-log.jsonl của feature.
Round 2: mọi eval máy (E1 đến E9, E11) xanh, các lệnh suite xanh; E10 là judgment, panel đề xuất PASS nhưng chờ human_override ở Cổng 2 nên verdict tổng là PENDING-JUDGMENT.
