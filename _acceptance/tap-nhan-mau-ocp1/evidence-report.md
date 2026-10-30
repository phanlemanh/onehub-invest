---
schema_version: 2
feature_slug: tap-nhan-mau-ocp1
verdict: REJECT
failed_evals: []
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 62920479a6ee0c9929b2f13c42fa90c68e0381fd
human_signoff:
---

# Evidence Report: tap-nhan-mau-ocp1

Round 1. Verdict REJECT vì một lệnh suite hồi quy (`cd app && npm test`) không qua và không gắn eval nào (xem khối suite và mục Iterations). Mọi eval máy của feature (E1–E8, E8b, E10) đều qua; E9 là judgment, hội đồng đề xuất PASS, chờ người.

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | test | PASS |
| E2 | AC-2 | test | PASS |
| E3 | AC-3 | test | PASS |
| E4 | AC-4 | test | PASS |
| E5 | AC-5 | script | PASS |
| E6 | AC-6 | script | PASS |
| E7 | AC-7 | test | PASS |
| E8 | AC-8 | test | PASS |
| E8b | AC-8 | script | PASS |
| E9 | AC-9 | judgment | PENDING (hội đồng đề xuất PASS, chờ người quyết) |
| E10 | AC-10 | script | PASS |

## Evidence

- eval: E1
  run_id: minted-tap-nhan-mau-ocp1-E1-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.tnm_pipeline
  verified_at: 2026-10-30T10:49:58Z
  output: |
    node --test pipeline/lib/tap-mau.test.mjs
    ℹ duration_ms 709.067458

- eval: E2
  run_id: minted-tap-nhan-mau-ocp1-E2-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.tnm_pipeline
  verified_at: 2026-10-30T10:49:58Z
  output: |
    node --test pipeline/lib/tap-mau.test.mjs
    ℹ duration_ms 709.067458

- eval: E3
  run_id: minted-tap-nhan-mau-ocp1-E3-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.tnm_app
  verified_at: 2026-10-30T10:49:58Z
  output: |
    cd app && node --import tsx --test tests/labels-mau.test.tsx
    ℹ duration_ms 81.758041

- eval: E4
  run_id: minted-tap-nhan-mau-ocp1-E4-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.tnm_pipeline
  verified_at: 2026-10-30T10:49:58Z
  output: |
    node --test pipeline/lib/tap-mau.test.mjs
    ℹ duration_ms 709.067458

- eval: E5
  run_id: minted-tap-nhan-mau-ocp1-E5-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.tnm_db
  verified_at: 2026-10-30T10:49:58Z
  output: |
    node _acceptance/tap-nhan-mau-ocp1/probes/db.mjs
    doi chung: MAU LOT VAO STG (cau dem bat 1 dong)

- eval: E6
  run_id: minted-tap-nhan-mau-ocp1-E6-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.tnm_db
  verified_at: 2026-10-30T10:49:58Z
  output: |
    node _acceptance/tap-nhan-mau-ocp1/probes/db.mjs
    doi chung: MAU LOT VAO STG (cau dem bat 1 dong)

- eval: E7
  run_id: minted-tap-nhan-mau-ocp1-E7-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.tnm_pipeline
  verified_at: 2026-10-30T10:49:58Z
  output: |
    node --test pipeline/lib/tap-mau.test.mjs
    ℹ duration_ms 709.067458

- eval: E8
  run_id: minted-tap-nhan-mau-ocp1-E8-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.tnm_pipeline
  verified_at: 2026-10-30T10:49:58Z
  output: |
    node --test pipeline/lib/tap-mau.test.mjs
    ℹ duration_ms 709.067458

- eval: E8b
  run_id: minted-tap-nhan-mau-ocp1-E8b-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.tnm_db
  verified_at: 2026-10-30T10:49:58Z
  output: |
    node _acceptance/tap-nhan-mau-ocp1/probes/db.mjs
    doi chung: MAU LOT VAO STG (cau dem bat 1 dong)

- eval: E10
  run_id: minted-tap-nhan-mau-ocp1-E10-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.tnm_pham_vi
  verified_at: 2026-10-30T10:49:58Z
  output: |
    bash _acceptance/tap-nhan-mau-ocp1/probes/pham-vi.sh
    PHAM VI OK

### Judgment (đề xuất, chờ người)

- eval: E9
  judged_by: judge panel (domain-correctness, operational-feasibility, spec-alignment), fresh context
  verdict: PASS (đề xuất của hội đồng; T3 cần người xác nhận trực tiếp)
  votes:
    - domain-correctness: PASS — Tôi đọc chữ của cả 40 tin và đối chiếu từng trường với bảng «Trường lõi». Không có tin nào sai trường hay có chữ hai cách hiểu. Giá đổi sang VND đúng, kể cả «3 tỷ 300», «3750 triệu», «4450 triệu», «8.000.000», «5,9–6 tỷ». Một giá thì min = max, khoảng giá giữ min < max. Dự án và toà ghi như tin viết, chữ thường. Trường chữ không nêu thì để «tin không nêu». Các tin hỏi mua hoặc hỏi thuê (inquiry) lấy ngân sách làm giá, nhất quán với một-giá-thì-min=max.
    - operational-feasibility: PASS — Tôi đọc chữ của cả 40 tin trong mau-kiem.jsonl và đối chiếu từng trường nhãn với bảng «Trường lõi». Không tin nào có trường sai hoặc chữ có hai cách hiểu. Dự án và toà ghi như tin viết, chữ thường. Giá đổi ra VND đúng (3750 triệu = 3.750.000.000; 4450 triệu = 4.450.000.000; «3 tỷ 300» = 3,3 tỷ). Giá khoảng 5,9–6 tỷ và 2,65–2,85 tỷ có min khác max, còn giá đơn thì min bằng max. Ba tin hỏi mua/thuê không nêu giá, và các tin không nêu diện tích hay phòng ngủ đều để «không nêu». Hai tin not_listing (nhóm chủ nhà, link vào nhóm) hợp lý.
    - spec-alignment: PASS — Tôi đọc chữ của cả 40 tin (id 0–39) và đối chiếu từng trường với bảng «Trường lõi». Không thấy tin nào có nhãn sai hay chữ hai cách hiểu. Giá đúng VND (3 tỷ 300 thành 3,3 tỷ, 3750 triệu thành 3,75 tỷ, 4450 triệu thành 4,45 tỷ); khoảng giá thì min khác max; một giá thì min = max. Dự án và toà ghi chữ thường đúng như tin viết, diện tích và phòng ngủ khớp chữ. Tin không nêu đặt đúng chỗ chữ không có, và hai tin nhóm (2, 11 và các bản lặp) là not_listing. Hai chỗ chưa kiểm được vì tên giá trị nằm ở sổ từ vựng ngoài danh sách input: biệt thự gắn «house», shop chân đế gắn «commercial». Hai chỗ này không đủ để coi nhãn là sai.
  human_override:  # chi nguoi ghi

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-tap-nhan-mau-ocp1-SUITE-npm_test__bb6271-r1
  exit_code: 0
  verified_at: 2026-10-30T10:49:58Z

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-tap-nhan-mau-ocp1-SUITE-lint-r1
  exit_code: 0
  verified_at: 2026-10-30T10:49:58Z

- cmd: cd app && npm test
  run_id: minted-tap-nhan-mau-ocp1-SUITE-npm_test__bd9a35-r1
  exit_code: 1
  verified_at: 2026-10-30T10:49:58Z
  output: |
    test at tests/ops-nhan-theo-context.test.tsx:7:725
    ON12-AC-5 bảng kiểm chất lượng trên DB local diễn giải đủ (155.862625ms)
    AssertionError: dòng kiểm chưa diễn giải (actual là danh sách 13 dòng kiểm enrich:proposal-assertion, data-level:distribution, media:local-file; expected là danh sách rỗng)
    tại tests/ops-nhan-theo-context.test.tsx:351:10

- cmd: cd pipeline && npm test
  run_id: minted-tap-nhan-mau-ocp1-SUITE-npm_test__13563d-r1
  exit_code: 0
  verified_at: 2026-10-30T10:49:58Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-tap-nhan-mau-ocp1-SUITE-test_lint_rules-r1
  exit_code: 0
  verified_at: 2026-10-30T10:49:58Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-tap-nhan-mau-ocp1-SUITE-node_scripts_check_portal_compliance_mjs-r1
  exit_code: 0
  verified_at: 2026-10-30T10:49:58Z

## Known limits

## Ngoài hợp đồng

## Analyst

baseline: BLOCKED ha tang — lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «<\tool_use_error>Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.<\/tool_use_error>»

Mọi field baseline của eval máy ghi n-a. Danh sách eval không-phân-biệt (xanh cả trên HEAD lẫn baseline) KHÔNG đo được ở round này.

Lệnh fail không gắn eval: `cd app && npm test` (không thuộc eval nào; test ON12-AC-5 trong tests/ops-nhan-theo-context.test.tsx đọc bảng kiểm chất lượng trên DB local; nguyên nhân chưa được xác định ở round này, E10 xác nhận phạm vi tệp đổi vẫn khớp AC-10).

### Baseline khong do

- node --test pipeline/lib/tap-mau.test.mjs: BLOCKED ha tang baseline: lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «<\tool_use_error>Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.<\/tool_use_error>»
- cd app && node --import tsx --test tests/labels-mau.test.tsx: BLOCKED ha tang baseline: lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «<\tool_use_error>Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.<\/tool_use_error>»
- node _acceptance/tap-nhan-mau-ocp1/probes/db.mjs: BLOCKED ha tang baseline: lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «<\tool_use_error>Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.<\/tool_use_error>»
- bash _acceptance/tap-nhan-mau-ocp1/probes/pham-vi.sh: BLOCKED ha tang baseline: lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «<\tool_use_error>Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.<\/tool_use_error>»

## Variance

none — every multi-run eval is uniform (mọi eval chạy một lần, xác định)

## Iterations

Round 1: không eval nào của feature fail; lệnh suite `cd app && npm test` fail (ON12-AC-5, tests/ops-nhan-theo-context.test.tsx) và không gắn eval nào. Returned to implementation.
