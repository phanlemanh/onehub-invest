---
schema_version: 2
feature_slug: ops-nhan-ma-nguon
verdict: PASS
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 18a2a384864be0ad83e19b75a8133cc3b9987982
human_signoff: Mạnh 2026-10-24
---

# Evidence Report: ops-nhan-ma-nguon

Round 2. Mọi eval máy đều xanh (E1, E2, E5, E6, E3b chạy lại ở round này; E3, E4, E7 mang từ round 1 vì delta không chạm paths của chúng). E8 (judgment, hợp đồng T3) chờ người xác nhận trực tiếp ở Cổng 2 nên verdict tổng là PENDING-JUDGMENT.

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
  run_id: minted-ops-nhan-ma-nguon-E1-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.app_ui
  verified_at: 2026-10-24T07:51:41Z
  output: |
    cd app && npm test
    ℹ duration_ms 10135.546292

- eval: E2
  run_id: minted-ops-nhan-ma-nguon-E2-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.app_ui
  verified_at: 2026-10-24T07:51:41Z
  output: |
    cd app && npm test
    ℹ duration_ms 10135.546292

- eval: E3
  run_id: minted-ops-nhan-ma-nguon-E3-r1
  exit_code: 0
  carried_from_round: 1
  baseline: n-a
  verifier: config:executors.script.portal_static
  verified_at: 2026-10-24T07:42:33Z
  output: |
    carry-forward tu round 1 — delta khong cham paths cua eval
    node scripts/check-portal-compliance.mjs
    portal-compliance: ĐẠT

- eval: E3b
  run_id: minted-ops-nhan-ma-nguon-E3b-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.scripts
  verified_at: 2026-10-24T07:51:41Z
  output: |
    node --test scripts/*.test.mjs
    ℹ duration_ms 8936.59725

- eval: E4
  run_id: minted-ops-nhan-ma-nguon-E4-r1
  exit_code: 0
  carried_from_round: 1
  baseline: n-a
  verifier: config:executors.test.pipeline
  verified_at: 2026-10-24T07:42:33Z
  output: |
    carry-forward tu round 1 — delta khong cham paths cua eval
    cd pipeline && npm test
    ℹ duration_ms 10365.022167

- eval: E5
  run_id: minted-ops-nhan-ma-nguon-E5-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.app_ui
  verified_at: 2026-10-24T07:51:41Z
  output: |
    cd app && npm test
    ℹ duration_ms 10135.546292

- eval: E6
  run_id: minted-ops-nhan-ma-nguon-E6-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.app_ui
  verified_at: 2026-10-24T07:51:41Z
  output: |
    cd app && npm test
    ℹ duration_ms 10135.546292

- eval: E7
  run_id: minted-ops-nhan-ma-nguon-E7-r1
  exit_code: 0
  carried_from_round: 1
  baseline: n-a
  verifier: config:executors.test.pipeline
  verified_at: 2026-10-24T07:42:33Z
  output: |
    carry-forward tu round 1 — delta khong cham paths cua eval
    cd pipeline && npm test
    ℹ duration_ms 10365.022167

### Judgment

Hội đồng đề xuất cho E8 (rationale từng judge giữ nguyên, để `human_override` trống cho người). Hội đồng chấm lại ở round này, đủ ba lens:

- eval: E8
  judged_by: judge panel (fresh context) — domain-correctness, operational-feasibility, spec-alignment
  verdict: PASS
  rationale: Cả ba judge cùng đề xuất PASS. CONTEXT.md dòng 254-256 có mục «Nhãn nguồn» đủ năm phần, định nghĩa khớp hàm sourceLabel và nói rõ tên thật chỉ hiện ở /ops/sources.
  votes: |
    - domain-correctness: PASS — Mục «Nhãn nguồn» trong CONTEXT.md (dòng 254-256) đủ năm phần: nhãn, Code `sourceLabel(code, roles)`, Slug URL «—», định nghĩa và _Avoid_. Định nghĩa «S02 · Hiệu chuẩn», vắng vai trò thì mã trần «S02», khớp đúng `sourceLabel`, hàm trả `${code} · ${role}` hoặc `code`. Mục cũng ghi tên nguồn thật chỉ hiện ở `/ops/sources`.
    - operational-feasibility: PASS — CONTEXT.md dòng 254-256 có đủ năm phần: nhãn «Nhãn nguồn», code `sourceLabel(code, roles)`, slug «—», định nghĩa, `_Avoid_`. Định nghĩa «S02 · Hiệu chuẩn», vắng vai trò thì mã trần «S02» khớp hàm sourceLabel (`${code} · ${role}` hoặc `code`). Định nghĩa nói tên nguồn thật chỉ hiện ở `/ops/sources`.
    - spec-alignment: PASS — CONTEXT.md dòng 254-256 có đủ năm phần của thuật ngữ «Nhãn nguồn»: nhãn, code `sourceLabel(code, roles)`, Slug URL «—», định nghĩa và _Avoid_. Định nghĩa khớp hàm: «S02 · Hiệu chuẩn» ứng với `${code} · ${role}`, vắng vai trò thì mã trần «S02» ứng với `return code`. Định nghĩa cũng nói «Tên nguồn thật chỉ hiện ở `/ops/sources`», và _Avoid_ nhắc lại điều đó.
  required_evidence:
    - (judge không nêu bằng-chứng-thiếu)
  human_override: Mạnh 2026-10-24 — Đạt

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-ops-nhan-ma-nguon-SUITE-npm_test__bb6271-r2
  exit_code: 0
  verified_at: 2026-10-24T07:51:41Z

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-ops-nhan-ma-nguon-SUITE-lint-r2
  exit_code: 0
  verified_at: 2026-10-24T07:51:41Z

- cmd: cd pipeline && npm test
  run_id: minted-ops-nhan-ma-nguon-SUITE-npm_test__13563d-r2
  exit_code: 0
  verified_at: 2026-10-24T07:51:41Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-ops-nhan-ma-nguon-SUITE-test_lint_rules-r2
  exit_code: 0
  verified_at: 2026-10-24T07:51:41Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-ops-nhan-ma-nguon-SUITE-node_scripts_check_portal_compliance_mjs-r2
  exit_code: 0
  verified_at: 2026-10-24T07:51:41Z

## Known limits

## Ngoài hợp đồng

## Analyst

carried tu round 1 — baseline khong do lai round nay (evals.yaml khong doi tu lan baseline cuoi). Field baseline cua tung block eval ghi n-a.

Eval KHÔNG-PHÂN-BIỆT (pass trên cả HEAD lẫn code cũ diffBase ở lần đo round 1 — chứng minh harness chứ chưa chứng minh feature; nên viết lại để assert hành vi mới, hoặc xác nhận là regression-guard có chủ ý):

- `cd app && npm test` — E1, E2, E5, E6
- `node scripts/check-portal-compliance.mjs` — E3
- `node --test scripts/*.test.mjs` — E3b
- `cd pipeline && npm test` — E4, E7

Các lệnh suite xanh cả hai phía là regression-guard bình thường, không liệt kê.

## Variance

none — every multi-run eval is uniform (mọi eval chạy một lần, deterministic).

## Iterations

Round 1: mọi eval máy xanh nhưng có 3 finding trong hợp đồng (AC-1 hai mục, AC-3 một mục: bộ quét bỏ sót chuỗi trong template literal, phép đo cảnh báo kênh đứt chỉ kiểm chuỗi có mặt, fixture chưa bật đủ nhánh). Trả về triển khai (sửa ở 18a2a38).
Round 2: E1, E2, E5, E6, E3b chạy lại và xanh; E3, E4, E7 mang từ round 1 (delta không chạm paths của chúng). Năm lệnh suite xanh. E8 (T3) chờ người xác nhận trực tiếp ở Cổng 2. Mốc verified_at của các mục chạy lại ở round 2 là mốc làm tròn, máy chưa ghi giờ chạy chính xác vào run-log lúc soạn báo cáo.

