---
schema_version: 2
feature_slug: ops-nhan-ma-nguon
verdict: PENDING-JUDGMENT
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 8e94357a598f01f25c93ffadb5f85f64c21b93c1
human_signoff:
---

# Evidence Report: ops-nhan-ma-nguon

Round 1. Mọi eval máy đều xanh; E8 (judgment, hợp đồng T3) chờ người xác nhận trực tiếp ở Cổng 2 nên verdict tổng là PENDING-JUDGMENT.

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | test | PASS |
| E2 | AC-2 | test | PASS |
| E3 | AC-3 | script | PASS |
| E3b | AC-3 | test | PASS |
| E4 | AC-4 | test | PASS |
| E5 | AC-5 | test | PASS |
| E6 | AC-6 | test | PASS |
| E7 | AC-7 | test | PASS |
| E8 | AC-8 | judgment | PENDING (hội đồng đề xuất PASS, chờ người ký — T3) |

## Evidence

- eval: E1
  run_id: minted-ops-nhan-ma-nguon-E1-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.test.app_ui
  verified_at: 2026-10-24T07:42:33Z
  output: |
    cd app && npm test
    ℹ duration_ms 10132.762042

- eval: E2
  run_id: minted-ops-nhan-ma-nguon-E2-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.test.app_ui
  verified_at: 2026-10-24T07:42:33Z
  output: |
    cd app && npm test
    ℹ duration_ms 10132.762042

- eval: E3
  run_id: minted-ops-nhan-ma-nguon-E3-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.script.portal_static
  verified_at: 2026-10-24T07:42:33Z
  output: |
    node scripts/check-portal-compliance.mjs
    portal-compliance: ĐẠT

- eval: E3b
  run_id: minted-ops-nhan-ma-nguon-E3b-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.test.scripts
  verified_at: 2026-10-24T07:42:33Z
  output: |
    node --test scripts/*.test.mjs
    ℹ duration_ms 8669.887625

- eval: E4
  run_id: minted-ops-nhan-ma-nguon-E4-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.test.pipeline
  verified_at: 2026-10-24T07:42:33Z
  output: |
    cd pipeline && npm test
    ℹ duration_ms 10365.022167

- eval: E5
  run_id: minted-ops-nhan-ma-nguon-E5-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.test.app_ui
  verified_at: 2026-10-24T07:42:33Z
  output: |
    cd app && npm test
    ℹ duration_ms 10132.762042

- eval: E6
  run_id: minted-ops-nhan-ma-nguon-E6-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.test.app_ui
  verified_at: 2026-10-24T07:42:33Z
  output: |
    cd app && npm test
    ℹ duration_ms 10132.762042

- eval: E7
  run_id: minted-ops-nhan-ma-nguon-E7-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.test.pipeline
  verified_at: 2026-10-24T07:42:33Z
  output: |
    cd pipeline && npm test
    ℹ duration_ms 10365.022167

### Judgment

Hội đồng đề xuất cho E8 (rationale từng judge giữ nguyên, để `human_override` trống cho người):

- eval: E8
  judged_by: judge panel (fresh context) — domain-correctness, operational-feasibility, spec-alignment
  verdict: PASS
  rationale: Cả ba judge cùng đề xuất PASS. CONTEXT.md dòng 254-256 có mục «Nhãn nguồn» đủ năm phần, định nghĩa khớp hàm sourceLabel và nói rõ tên thật chỉ hiện ở /ops/sources.
  votes: |
    - domain-correctness: PASS — CONTEXT.md dòng 254-256 có thuật ngữ «Nhãn nguồn» đủ năm phần: nhãn, Code `sourceLabel(code, roles)`, Slug URL «—», định nghĩa và _Avoid_. Định nghĩa khớp hàm sourceLabel, vì hàm trả `${code} · ${role}` khi có vai trò và trả mã trần khi vắng, đúng như «S02 · Hiệu chuẩn» và «S02». Định nghĩa cũng nói tên nguồn thật chỉ hiện ở `/ops/sources`, và _Avoid_ cấm tên thật ở mọi trang Ops khác.
    - operational-feasibility: PASS — CONTEXT.md dòng 254-256 có mục «Nhãn nguồn» đủ nhãn, code (`sourceLabel(code, roles)`), Slug URL («—»), định nghĩa và `_Avoid_`. Định nghĩa «S02 · Hiệu chuẩn», vắng vai trò thì mã trần «S02», khớp đúng hàm `sourceLabel` (`role ? ${code} · ${role} : code`). Mục này cũng nói tên nguồn thật chỉ hiện ở `/ops/sources`, và `_Avoid_` cấm tên thật ở các trang Ops khác.
    - spec-alignment: PASS — CONTEXT.md dòng 254-256 có mục «Nhãn nguồn» đủ nhãn, code (`sourceLabel(code, roles)`, đường dẫn đúng), Slug URL («—») và định nghĩa, cùng dòng _Avoid_. Định nghĩa «S02 · Hiệu chuẩn» và «vắng vai trò thì mã trần S02» khớp hàm sourceLabel (`role ? ${code} · ${role} : code`). Mục này cũng nói tên nguồn thật chỉ hiện ở `/ops/sources`.
  required_evidence:
    - (judge không nêu bằng-chứng-thiếu)
  human_override:        # T3: người tự kiểm và điền "<tên> <ngày>"

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-ops-nhan-ma-nguon-SUITE-npm_test-r1
  exit_code: 0
  verified_at: 2026-10-24T07:42:33Z

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-ops-nhan-ma-nguon-SUITE-lint-r1
  exit_code: 0
  verified_at: 2026-10-24T07:42:33Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-ops-nhan-ma-nguon-SUITE-test_lint_rules-r1
  exit_code: 0
  verified_at: 2026-10-24T07:42:33Z

## Known limits

## Ngoài hợp đồng

## Analyst

Eval KHÔNG-PHÂN-BIỆT (baseline green: pass trên cả HEAD lẫn code cũ diffBase — chứng minh harness chứ chưa chứng minh feature; nên viết lại để assert hành vi mới, hoặc xác nhận là regression-guard có chủ ý):

- `cd app && npm test` — E1, E2, E5, E6
- `node scripts/check-portal-compliance.mjs` — E3
- `node --test scripts/*.test.mjs` — E3b
- `cd pipeline && npm test` — E4, E7

Ba lệnh suite (agent npm test, app tsc + lint, app test:lint-rules) có baseline n-a vì không gắn eval nào; xanh hồi quy bình thường.

## Variance

none — every multi-run eval is uniform (mọi eval chạy một lần, deterministic).

## Iterations

Round 1: mọi eval máy xanh; E8 (T3) chờ người xác nhận trực tiếp ở Cổng 2. Có 3 finding trong hợp đồng (AC-1, AC-3) và 1 finding ngoài hợp đồng, xem review-findings.md. Chuyển Cổng 2.

