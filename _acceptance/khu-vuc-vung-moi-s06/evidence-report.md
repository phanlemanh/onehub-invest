---
schema_version: 2
feature_slug: khu-vuc-vung-moi-s06
verdict: PASS
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: d78647a4c9468f1edcaa640f11eaa67763a4faf8
human_signoff: Mạnh 2026-10-31
---

# Evidence Report: khu-vuc-vung-moi-s06

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | test | PASS |
| E2 | AC-2 | script | PASS |
| E3 | AC-3 | test | PASS |
| E4 | AC-3 | test | PASS |

## Evidence

- eval: E1
  run_id: minted-khu-vuc-vung-moi-s06-E1-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.ma_thi_truong_dai
  verified_at: 2026-10-31T10:31:12Z
  output: |
    cd app && node --import tsx --test tests/ma-thi-truong-dai.test.tsx
    ℹ duration_ms 805.169416

- eval: E2
  run_id: minted-khu-vuc-vung-moi-s06-E2-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.on12_tien_de
  verified_at: 2026-10-31T10:31:12Z
  output: |
    node _acceptance/khu-vuc-vung-moi-s06/rang/on12-tien-de.mjs
    ✔ ON12-AC-7 mọi giá trị đang có trên DB local có nhãn

- eval: E3
  run_id: minted-khu-vuc-vung-moi-s06-E3-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.app_ui
  verified_at: 2026-10-31T10:31:12Z
  output: |
    cd app && npm test
    ℹ duration_ms 45745.251333

- eval: E4
  run_id: minted-khu-vuc-vung-moi-s06-E4-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.app
  verified_at: 2026-10-31T10:31:12Z
  output: |
    cd app && npx tsc --noEmit && npm run lint
    (typecheck và lint không báo lỗi)

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-khu-vuc-vung-moi-s06-SUITE-npm_test__bb6271-r2
  exit_code: 0
  verified_at: 2026-10-31T10:31:12Z

- cmd: cd pipeline && npm test
  run_id: minted-khu-vuc-vung-moi-s06-SUITE-npm_test__13563d-r2
  exit_code: 0
  verified_at: 2026-10-31T10:31:12Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-khu-vuc-vung-moi-s06-SUITE-test_lint_rules-r2
  exit_code: 0
  verified_at: 2026-10-31T10:31:12Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-khu-vuc-vung-moi-s06-SUITE-node_scripts_check_portal_compliance_mjs-r2
  exit_code: 0
  verified_at: 2026-10-31T10:31:12Z

## Known limits

## Ngoài hợp đồng

## Analyst

baseline: BLOCKED ha tang — lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «<\tool_use_error>Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.<\/tool_use_error>»

Baseline khong do:
- cd app && node --import tsx --test tests/ma-thi-truong-dai.test.tsx: BLOCKED ha tang baseline: lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «<\tool_use_error>Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.<\/tool_use_error>»
- node _acceptance/khu-vuc-vung-moi-s06/rang/on12-tien-de.mjs: BLOCKED ha tang baseline: lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «<\tool_use_error>Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.<\/tool_use_error>»
- cd app && npm test: BLOCKED ha tang baseline: lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «<\tool_use_error>Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.<\/tool_use_error>»
- cd app && npx tsc --noEmit && npm run lint: BLOCKED ha tang baseline: lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «<\tool_use_error>Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.<\/tool_use_error>»

Danh sách eval không-phân-biệt không đo được ở round này vì baseline bị chặn hạ tầng.

## Variance

none — mọi eval chạy một lần, xác định, không có phương sai.

## Iterations

Round 1: S4 r1 đạt 4/4, kèm 2 mục ngoài hợp đồng về độ chặt của phép đo (theo lịch sử commit).
Round 2: E1, E2, E3, E4 đều đạt, bốn lệnh suite đạt; còn 1 mục ngoài hợp đồng (đối chứng dương của E2) để người quyết ở Cổng 2 — xem review-findings.md.
