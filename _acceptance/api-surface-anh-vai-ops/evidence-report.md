---
schema_version: 2
feature_slug: api-surface-anh-vai-ops
verdict: PASS
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 551d843d196d2a2362123b6f53b5b9027ebcdf99
human_signoff: Mạnh 2026-10-30
---

# Evidence Report: api-surface-anh-vai-ops

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | test | PASS |
| E2 | AC-2 | test | PASS |
| E3 | AC-2 | test | PASS |
| E4 | AC-3 | test | PASS |
| E5 | AC-4 | script | PASS |
| E6 | AC-5 | script | PASS |
| E7 | AC-3 | test | PASS |

## Evidence

- eval: E1
  run_id: minted-api-surface-anh-vai-ops-E1-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.api_surface_ops
  verified_at: 2026-10-30T11:46:27Z
  output: |
    lệnh: cd app && node --import tsx --test tests/api-surface-anh-vai-ops.test.tsx
    ca ASO-AC-1 xanh (dòng zalo-media mode ops-session, note ghim ba quan hệ; hai chiều đỏ đều báo đúng thông điệp)
    ℹ duration_ms 404.349166

- eval: E2
  run_id: minted-api-surface-anh-vai-ops-E2-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.api_surface_ops
  verified_at: 2026-10-30T11:46:27Z
  output: |
    lệnh: cd app && node --import tsx --test tests/api-surface-anh-vai-ops.test.tsx
    ca ASO-AC-2 xanh (ma trận 6 người gọi x 2 chế độ = 12 ô trên serveZaloMedia thật; chiều đỏ đổi sổ sang admin báo đúng)
    ℹ duration_ms 404.349166

- eval: E3
  run_id: minted-api-surface-anh-vai-ops-E3-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.zalo_media_core
  verified_at: 2026-10-30T11:46:27Z
  output: |
    lệnh: cd app && node --import tsx --test tests/zalo-media.test.tsx
    bộ lõi zalo-media chạy đích danh, hồi quy quyền thật không đổi
    ℹ duration_ms 82.596917

- eval: E4
  run_id: minted-api-surface-anh-vai-ops-E4-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.api_surface_ops
  verified_at: 2026-10-30T11:46:27Z
  output: |
    lệnh: cd app && node --import tsx --test tests/api-surface-anh-vai-ops.test.tsx
    ca ASO-AC-3 xanh (route gọi getSessionUser một lần, chặn canAccessOps trước serveZaloMedia(req, user), docstring đã sửa)
    ℹ duration_ms 404.349166

- eval: E5
  run_id: minted-api-surface-anh-vai-ops-E5-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.api_surface_mutation
  verified_at: 2026-10-30T11:46:27Z
  output: |
    lệnh: node scripts/check-api-surface.mjs mutation
    api-surface mutation: ĐẠT

- eval: E6
  run_id: minted-api-surface-anh-vai-ops-E6-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.portal_static
  verified_at: 2026-10-30T11:46:27Z
  output: |
    lệnh: node scripts/check-portal-compliance.mjs
    portal-compliance: ĐẠT

- eval: E7
  run_id: minted-api-surface-anh-vai-ops-E7-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.api_surface_ops
  verified_at: 2026-10-30T11:46:27Z
  output: |
    lệnh: cd app && node --import tsx --test tests/api-surface-anh-vai-ops.test.tsx
    ca ASO-AC-3b xanh (ma trận 5 vai x ?snapshot= qua handler route chép; khách/user/viewer 404, ops và admin 200)
    ℹ duration_ms 404.349166

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-api-surface-anh-vai-ops-SUITE-npm_test__bb6271-r1
  exit_code: 0
  verified_at: 2026-10-30T11:46:27Z

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-api-surface-anh-vai-ops-SUITE-lint-r1
  exit_code: 0
  verified_at: 2026-10-30T11:46:27Z

- cmd: cd app && npm test
  run_id: minted-api-surface-anh-vai-ops-SUITE-npm_test__bd9a35-r1
  exit_code: 0
  verified_at: 2026-10-30T11:46:27Z

- cmd: cd pipeline && npm test
  run_id: minted-api-surface-anh-vai-ops-SUITE-npm_test__13563d-r1
  exit_code: 0
  verified_at: 2026-10-30T11:46:27Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-api-surface-anh-vai-ops-SUITE-test_lint_rules-r1
  exit_code: 0
  verified_at: 2026-10-30T11:46:27Z

## Known limits

## Ngoài hợp đồng

## Analyst

baseline: BLOCKED ha tang — lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «<\tool_use_error>Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.<\/tool_use_error>»

Danh sách eval không-phân-biệt (xanh cả trên HEAD lẫn baseline) không đo được ở round này vì baseline bị chặn hạ tầng; mọi field baseline ghi n-a.

Baseline khong do:
- cd app && node --import tsx --test tests/api-surface-anh-vai-ops.test.tsx: BLOCKED ha tang baseline: lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «<\tool_use_error>Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.<\/tool_use_error>»
- cd app && node --import tsx --test tests/zalo-media.test.tsx: BLOCKED ha tang baseline: lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «<\tool_use_error>Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.<\/tool_use_error>»
- node scripts/check-api-surface.mjs mutation: BLOCKED ha tang baseline: lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «<\tool_use_error>Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.<\/tool_use_error>»
- node scripts/check-portal-compliance.mjs: BLOCKED ha tang baseline: lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «<\tool_use_error>Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.<\/tool_use_error>»

## Variance

none — mọi eval chạy một lần, xác định (runs: 1), không có eval ngẫu nhiên nên không có phương sai.

## Iterations

Round 1: E1, E2, E3, E4, E5, E6, E7 đều đạt; năm lệnh suite hồi quy đều xanh. Không có eval thất bại, không cần trả về triển khai.
