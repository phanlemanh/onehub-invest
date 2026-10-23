---
schema_version: 2
feature_slug: job-bao-loi-that
verdict: PASS
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: e0ae47327a69f41462b36e1907c6b61a5449e527
human_signoff: Mạnh 2026-10-23
---

# Evidence Report: job-bao-loi-that

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | test | PASS |
| E2 | AC-2 | test | PASS |
| E3 | AC-3 | test | PASS |
| E4 | AC-4 | test | PASS |
| E5 | AC-5 | test | PASS |
| E6 | AC-6 | test | PASS |
| E7 | AC-7 | judgment | PASS |

## Evidence

- eval: E1
  run_id: minted-job-bao-loi-that-E1-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.test.scripts
  verified_at: 2026-10-23T09:58:56Z
  output: |
    lệnh: node --test scripts/*.test.mjs (1 lần chạy, 1 lần đạt, không dao động)
    đuôi đầu ra: kết thúc sạch, mã thoát 0

- eval: E2
  run_id: minted-job-bao-loi-that-E2-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.test.scripts
  verified_at: 2026-10-23T09:58:56Z
  output: |
    lệnh: node --test scripts/*.test.mjs (1 lần chạy, 1 lần đạt, không dao động)
    đuôi đầu ra: kết thúc sạch, mã thoát 0

- eval: E3
  run_id: minted-job-bao-loi-that-E3-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.test.scripts
  verified_at: 2026-10-23T09:58:56Z
  output: |
    lệnh: node --test scripts/*.test.mjs (1 lần chạy, 1 lần đạt, không dao động)
    đuôi đầu ra: kết thúc sạch, mã thoát 0

- eval: E4
  run_id: minted-job-bao-loi-that-E4-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.test.scripts
  verified_at: 2026-10-23T09:58:56Z
  output: |
    lệnh: node --test scripts/*.test.mjs (1 lần chạy, 1 lần đạt, không dao động)
    đuôi đầu ra: kết thúc sạch, mã thoát 0

- eval: E5
  run_id: minted-job-bao-loi-that-E5-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.test.scripts
  verified_at: 2026-10-23T09:58:56Z
  output: |
    lệnh: node --test scripts/*.test.mjs (1 lần chạy, 1 lần đạt, không dao động)
    đuôi đầu ra: kết thúc sạch, mã thoát 0

- eval: E6
  run_id: minted-job-bao-loi-that-E6-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.test.scripts
  verified_at: 2026-10-23T09:58:56Z
  output: |
    lệnh: node --test scripts/*.test.mjs (1 lần chạy, 1 lần đạt, không dao động)
    đuôi đầu ra: kết thúc sạch, mã thoát 0

- eval: E7
  judged_by: judge-panel (domain-correctness, operational-feasibility, spec-alignment; fresh context)
  verdict: PASS
  rationale: Panel đề xuất PASS. Cả ba góc nhìn thấy mục «Job đêm báo lỗi thật» trong runtime-map.md (dòng 122-149) nêu đủ ba ý của AC-7.
  human_override:  # chi nguoi ghi

  Phiếu của từng góc nhìn (đề xuất, chưa phải quyết định của người):
  - domain-correctness: PASS — Mục «Job đêm báo lỗi thật» trong runtime-map.md (dòng 122-149) nêu cả ba ý. (1) Bảng liệt kê năm job nào thoát ≠ 0, và dòng `JOB FAIL [<job>] bước <bước> mã <n>` của chotot/apify kèm lệnh grep log. (2) Phần «Còn nuốt lỗi» nêu đoạn nạp thuộc ZCode `P3-1` và cloud-sync lúc DB chập chờn cùng `push-ops-facts` thuộc T3 `P3-3`. (3) Cảnh báo DB sập đến từ L5b watchdog ZC3 chứ không từ job. Các câu này khớp AC-1..AC-4, AC-7 và phần Out of scope của contract.
  - operational-feasibility: PASS — Mục "Job đêm báo lỗi thật" trong runtime-map.md trả lời đủ ba ý của AC-7. (1) Bảng năm job nêu job nào thoát ≠ 0 khi bước DB hỏng, kèm lệnh `grep 'JOB FAIL' pipeline/logs/chotot.log`. (2) Phần "Còn nuốt lỗi, đang chờ" nêu P3-1 ZCode (đoạn nạp của chotot/apify) và P3-3 T3 (cloud-sync khi DB chập chờn cùng push-ops-facts). (3) Mục này nói cảnh báo DB sập đến từ L5b của watchdog (ZC3), không đến từ job. Cả ba khớp phạm vi và Out of scope trong contract.md.
  - spec-alignment: PASS — Mục «Job đêm báo lỗi thật» trong runtime-map.md nêu đủ ba ý của AC-7. (1) Bảng liệt kê năm job thoát ≠ 0 khi bước DB hỏng, kèm lệnh tìm dòng `JOB FAIL [<job>] bước <bước> mã <n>` trong log. (2) Phần «Còn nuốt lỗi» chỉ rõ đoạn nạp thuộc làn ZCode `P3-1`, và `cloud-sync.sh` khi DB chập chờn cùng `push-ops-facts` thuộc `P3-3` (T3). (3) Cảnh báo DB sập đến từ L5b watchdog (ZC3), không từ job. Các câu này khớp Out of scope và AC-7 của contract.md, kể cả việc cloud-sync chập chờn «có thể 0».

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-job-bao-loi-that-SUITE-npm_test__bb6271-r1
  exit_code: 0
  verified_at: 2026-10-23T09:58:56Z

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-job-bao-loi-that-SUITE-lint-r1
  exit_code: 0
  verified_at: 2026-10-23T09:58:56Z

- cmd: cd app && npm test
  run_id: minted-job-bao-loi-that-SUITE-npm_test__bd9a35-r1
  exit_code: 0
  verified_at: 2026-10-23T09:58:56Z

- cmd: cd pipeline && npm test
  run_id: minted-job-bao-loi-that-SUITE-npm_test__13563d-r1
  exit_code: 0
  verified_at: 2026-10-23T09:58:56Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-job-bao-loi-that-SUITE-test_lint_rules-r1
  exit_code: 0
  verified_at: 2026-10-23T09:58:56Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-job-bao-loi-that-SUITE-node_scripts_check_portal_compliance_mjs-r1
  exit_code: 0
  verified_at: 2026-10-23T09:58:56Z

## Known limits

## Ngoài hợp đồng

## Analyst

Eval không phân biệt (xanh ở cả code hiện tại lẫn baseline): E1, E2, E3, E4, E5, E6 — cùng chạy qua lệnh `node --test scripts/*.test.mjs`, baseline green. Cần viết lại để assert hành vi mới hoặc xác nhận đây là regression-guard có chủ ý.

## Variance

none — mọi eval chạy một lần, không có eval nhiều lần chạy nào dao động.

## Iterations

Round 1: E1-E6 đạt, E7 đề xuất PASS; không có eval hỏng. Verdict PASS.
