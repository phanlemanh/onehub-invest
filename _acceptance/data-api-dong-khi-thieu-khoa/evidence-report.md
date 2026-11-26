---
schema_version: 2
feature_slug: data-api-dong-khi-thieu-khoa
verdict: PASS
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: a55c8aaca44c641b016fb9bc3ed7b67ebb1afeb3
human_signoff: Mạnh 2026-11-26
---

# Evidence Report: data-api-dong-khi-thieu-khoa

máy: M5 (M5 Max 18 nhân, colima 16/96) · DB: bản đầy đủ máy thu chép sang 26/11 05:45Z · ca đỏ có tên: không (vòng 1 trên M5 cũ đỏ năm bộ kiểm chung do nền máy; vòng 2 một finding trong hợp đồng ở AC-6, đã vá; vòng 3 sạch).

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
| E10 | AC-9 | judgment | PASS (hội đồng đề xuất, chờ người xác nhận ở Cổng 2) |

## Evidence

- eval: E1
  run_id: minted-data-api-dong-khi-thieu-khoa-E1-r3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.dapi_khoa
  verified_at: 2026-11-26T08:13:31Z
  output: |
    Lệnh: bash db/db-thu.sh oneinvest_suite_dapi --chay sh -c 'cd data-api && node --import tsx --test --test-reporter=spec --test-concurrency=1 test/auth-dong.test.ts'
    ℹ duration_ms 10285.323709

- eval: E2
  run_id: minted-data-api-dong-khi-thieu-khoa-E2-r3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.dapi_khoa
  verified_at: 2026-11-26T08:13:31Z
  output: |
    Cùng lệnh với E1 (một lượt chạy phủ E1 đến E6).
    ℹ duration_ms 10285.323709

- eval: E3
  run_id: minted-data-api-dong-khi-thieu-khoa-E3-r3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.dapi_khoa
  verified_at: 2026-11-26T08:13:31Z
  output: |
    Cùng lệnh với E1 (một lượt chạy phủ E1 đến E6).
    ℹ duration_ms 10285.323709

- eval: E4
  run_id: minted-data-api-dong-khi-thieu-khoa-E4-r3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.dapi_khoa
  verified_at: 2026-11-26T08:13:31Z
  output: |
    Cùng lệnh với E1 (một lượt chạy phủ E1 đến E6).
    ℹ duration_ms 10285.323709

- eval: E5
  run_id: minted-data-api-dong-khi-thieu-khoa-E5-r3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.dapi_khoa
  verified_at: 2026-11-26T08:13:31Z
  output: |
    Cùng lệnh với E1 (một lượt chạy phủ E1 đến E6).
    ℹ duration_ms 10285.323709

- eval: E6
  run_id: minted-data-api-dong-khi-thieu-khoa-E6-r3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.dapi_khoa
  verified_at: 2026-11-26T08:13:31Z
  output: |
    Cùng lệnh với E1 (một lượt chạy phủ E1 đến E6).
    ℹ duration_ms 10285.323709

- eval: E7
  run_id: minted-data-api-dong-khi-thieu-khoa-E7-r3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.dapi_khoa_pha
  verified_at: 2026-11-26T08:13:31Z
  output: |
    Lệnh: node _acceptance/data-api-dong-khi-thieu-khoa/probes/pha.mjs
    pha: cây thật xanh

- eval: E8
  run_id: minted-data-api-dong-khi-thieu-khoa-E8-r3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.dapi_khoa_pham_vi
  verified_at: 2026-11-26T08:13:31Z
  output: |
    Lệnh: node _acceptance/data-api-dong-khi-thieu-khoa/probes/pham-vi.mjs
    pham-vi: nền đỉnh HT19 0624fbce9 (HT19 chưa vào origin/main); 28 tệp đổi, đều trong ranh giới; package.json chỉ đổi scripts.dev; dong-ba-route.test.ts chỉ thêm 1 dòng NODE_ENV; soát 6 tên nguồn thật (phần cuối dòng bị cắt trong kết quả máy)

- eval: E9
  run_id: minted-data-api-dong-khi-thieu-khoa-E9-r3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.data_api
  verified_at: 2026-11-26T08:13:31Z
  output: |
    Lệnh: cd data-api && npm run typecheck
    (không lỗi, không đầu ra)

- eval: E11
  run_id: minted-data-api-dong-khi-thieu-khoa-E11-r3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.dapi_khoa_toan
  verified_at: 2026-11-26T08:13:31Z
  output: |
    Lệnh: bash db/db-thu.sh oneinvest_suite_dapi --chay sh -c 'cd data-api && node --import tsx --test --test-reporter=spec --test-concurrency=1 test/*.test.ts'
    ℹ duration_ms 10640.012916

### Judgment

- eval: E10
  judged_by: judge-subagent (fresh context), hội đồng ba lăng kính
  verdict: PASS
  rationale: Ba lăng kính cùng đề xuất PASS, cả bốn vế đạt, đối chiếu design.md §2. README (bảng biến môi trường và mục Authentication), .env.example, docker-compose.yml (DATA_API_KEYS bắt buộc qua cú pháp báo lỗi khi thiếu) và CLAUDE.md đều nêu luật đóng mặc định; không tệp nào còn câu nói khoá trống là tắt xác thực vô điều kiện.
  votes:
    - domain-correctness: PASS — README dòng 48 và bảng Authentication dòng 101-106 cùng .env.example dòng 7-8 nói chỉ NODE_ENV development hoặc test và không trên Vercel mới chạy được khi không có khoá; nơi khác đường dữ liệu trả 503 AUTH_NOT_CONFIGURED, /health trả misconfigured, bản Node không khởi động. docker-compose.yml dòng 30 có DATA_API_KEYS bắt buộc. CLAUDE.md dòng 11 mô tả auth.ts theo luật đóng mặc định.
    - operational-feasibility: PASS — README và .env.example nêu luật đóng mặc định khớp design.md §2; docker-compose.yml dùng DATA_API_KEYS bắt buộc; CLAUDE.md mô tả auth.ts theo luật mới; không tệp nào còn câu khoá trống là tắt xác thực.
    - spec-alignment: PASS — cả bốn vế đạt; README cùng .env.example nói đúng điều kiện chạy không khoá; docker-compose.yml truyền DATA_API_KEYS bắt buộc cho dịch vụ api; CLAUDE.md đúng luật đóng mặc định của design.md §2.
  human_override: Mạnh 2026-11-26 — Đạt

### Lệnh suite (hồi quy)

- cmd: node scripts/suite-neu-doi.mjs agent -- 'cd agent && npm test'
  run_id: minted-data-api-dong-khi-thieu-khoa-SUITE-node_scripts_suite_neu_doi_mjs_agent_cd_-r3
  exit_code: 0
  verified_at: 2026-11-26T08:13:31Z

- cmd: node scripts/suite-neu-doi.mjs app -- 'cd app && npx tsc --noEmit && npm run lint'
  run_id: minted-data-api-dong-khi-thieu-khoa-SUITE-lint-r3
  exit_code: 0
  verified_at: 2026-11-26T08:13:31Z

- cmd: node scripts/suite-neu-doi.mjs app_ui -- 'cd app && npm test'
  run_id: minted-data-api-dong-khi-thieu-khoa-SUITE-node_scripts_suite_neu_doi_mjs_app_ui_cd-r3
  exit_code: 0
  verified_at: 2026-11-26T08:13:31Z

- cmd: node scripts/suite-neu-doi.mjs pipeline_a -- 'cd pipeline && npm run test:a'
  run_id: minted-data-api-dong-khi-thieu-khoa-SUITE-test_a-r3
  exit_code: 0
  verified_at: 2026-11-26T08:13:31Z

- cmd: node scripts/suite-neu-doi.mjs pipeline_b -- 'cd pipeline && npm run test:b'
  run_id: minted-data-api-dong-khi-thieu-khoa-SUITE-test_b-r3
  exit_code: 0
  verified_at: 2026-11-26T08:13:31Z

- cmd: node scripts/suite-neu-doi.mjs pipeline_that -- 'cd pipeline && npm run test:that'
  run_id: minted-data-api-dong-khi-thieu-khoa-SUITE-test_that-r3
  exit_code: 0
  verified_at: 2026-11-26T08:13:31Z

- cmd: node scripts/suite-neu-doi.mjs ui_lint_rules -- 'cd app && npm run test:lint-rules'
  run_id: minted-data-api-dong-khi-thieu-khoa-SUITE-test_lint_rules-r3
  exit_code: 0
  verified_at: 2026-11-26T08:13:31Z

- cmd: node scripts/suite-neu-doi.mjs portal_static -- 'node scripts/check-portal-compliance.mjs'
  run_id: minted-data-api-dong-khi-thieu-khoa-SUITE-node_scripts_suite_neu_doi_mjs_portal_st-r3
  exit_code: 0
  verified_at: 2026-11-26T08:13:31Z

## Known limits

## Ngoài hợp đồng

## Analyst

carried từ round 1 — baseline không đo lại round này (evals.yaml không đổi từ lần baseline cuối). Mọi eval máy ghi baseline n-a ở round này.

Eval không-phân-biệt (xanh cả trên HEAD lẫn baseline): không có.

## Variance

none — mọi eval đều xác định (một lượt chạy), không có pass_rate hỗn hợp.

## Iterations

Round 1 và Round 2: lịch sử nằm trong run-log.jsonl và review-findings các round trước; báo cáo này thay thế toàn bộ.
Round 3: mọi eval máy E1 đến E9 và E11 xanh, các lệnh suite xanh; E10 là judgment chờ người xác nhận (hội đồng đề xuất PASS), nên verdict PENDING-JUDGMENT.

### Re-pin lần 1 — 2026-11-26, do gộp main b013b4428 (HT19 #549) và sửa probe phạm vi nhận squash
run_id: repin-20261126T090732Z-45729
sha: 53d3109cc29e9e8568c419910f7bbd274a3b6376 · suites: 8 lệnh exit 0 · evals: 10/10 eval máy đạt kỳ vọng · ngoài làn máy: E10 (E10 không khai paths) · AC không có chốt máy: AC-9

### Re-pin lần 2 — 2026-11-26, do gộp main 816796cf3 (#550, #537) để hết xung đột PR #551
run_id: repin-20261126T094923Z-44636
sha: a55c8aaca44c641b016fb9bc3ed7b67ebb1afeb3 · suites: 8 lệnh exit 0 · evals: 10/10 eval máy đạt kỳ vọng · ngoài làn máy: E10 (E10 không khai paths) · AC không có chốt máy: AC-9
