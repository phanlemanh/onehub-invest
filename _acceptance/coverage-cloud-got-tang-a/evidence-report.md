---
schema_version: 2
feature_slug: coverage-cloud-got-tang-a
verdict: PASS
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 6ff7adfe41065036031da4ca474ac0df51b10ea2
human_signoff: Mạnh 2026-10-25
---

# Evidence Report: coverage-cloud-got-tang-a

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | test | PASS |
| E2 | AC-2 | test | PASS |
| E3 | AC-3 | test | PASS |
| E4 | AC-4 | test | PASS |
| E5 | AC-5 | test | PASS |
| E6 | AC-6 | test | PASS |
| E7 | AC-7 | judgment | chờ người (hội đồng đề xuất PASS, human_override còn trống) |
| E8 | AC-8 | test | PASS |

## Evidence

- eval: E1
  run_id: minted-coverage-cloud-got-tang-a-E1-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.test.app_ui
  verified_at: 2026-10-25T10:42:21Z
  output: |
    lệnh: cd app && npm test (một lần chạy chung cho E1–E6, runs 1, passes 1)
    ℹ duration_ms 33882.005791
    __EXIT=0

- eval: E2
  run_id: minted-coverage-cloud-got-tang-a-E2-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.test.app_ui
  verified_at: 2026-10-25T10:42:21Z
  output: |
    lệnh: cd app && npm test (một lần chạy chung cho E1–E6, runs 1, passes 1)
    ℹ duration_ms 33882.005791
    __EXIT=0

- eval: E3
  run_id: minted-coverage-cloud-got-tang-a-E3-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.test.app_ui
  verified_at: 2026-10-25T10:42:21Z
  output: |
    lệnh: cd app && npm test (một lần chạy chung cho E1–E6, runs 1, passes 1)
    ℹ duration_ms 33882.005791
    __EXIT=0

- eval: E4
  run_id: minted-coverage-cloud-got-tang-a-E4-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.test.app_ui
  verified_at: 2026-10-25T10:42:21Z
  output: |
    lệnh: cd app && npm test (một lần chạy chung cho E1–E6, runs 1, passes 1)
    ℹ duration_ms 33882.005791
    __EXIT=0

- eval: E5
  run_id: minted-coverage-cloud-got-tang-a-E5-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.test.app_ui
  verified_at: 2026-10-25T10:42:21Z
  output: |
    lệnh: cd app && npm test (một lần chạy chung cho E1–E6, runs 1, passes 1)
    ℹ duration_ms 33882.005791
    __EXIT=0

- eval: E6
  run_id: minted-coverage-cloud-got-tang-a-E6-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.test.app_ui
  verified_at: 2026-10-25T10:42:21Z
  output: |
    lệnh: cd app && npm test (một lần chạy chung cho E1–E6, runs 1, passes 1)
    ℹ duration_ms 33882.005791
    __EXIT=0

- eval: E8
  run_id: minted-coverage-cloud-got-tang-a-E8-r1
  exit_code: 0
  baseline: red
  verifier: config:executors.test.app
  verified_at: 2026-10-25T10:42:21Z
  output: |
    lệnh: cd app && npx tsc --noEmit && npm run lint (runs 1, passes 1)
    __EXIT=0

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-coverage-cloud-got-tang-a-SUITE-npm_test__bb6271-r1
  exit_code: 0
  verified_at: 2026-10-25T10:42:21Z

- cmd: cd pipeline && npm test
  run_id: minted-coverage-cloud-got-tang-a-SUITE-npm_test__13563d-r1
  exit_code: 0
  verified_at: 2026-10-25T10:42:21Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-coverage-cloud-got-tang-a-SUITE-test_lint_rules-r1
  exit_code: 0
  verified_at: 2026-10-25T10:42:21Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-coverage-cloud-got-tang-a-SUITE-node_scripts_check_portal_compliance_mjs-r1
  exit_code: 0
  verified_at: 2026-10-25T10:42:21Z

### Judgment (E7 — AC-7)

Hội đồng ĐỀ XUẤT PASS; phiếu bầu dưới đây chỉ có tính tham khảo, người quyết ở Cổng 2 và điền human_override.

- eval: E7
  judged_by: judge-subagent (fresh context), đề xuất panel: domain-correctness, operational-feasibility, spec-alignment
  verdict: PASS
  rationale: Cả ba lens cùng thấy trên máy chủ mọi nhánh không có số đều trả state none, rows null, note «Chỉ đo ở máy thu»; cờ lấy từ measured_at của khối; phản hồi chỉ gồm CoverageRow và cờ.
  human_override: Mạnh 2026-10-25 — Đạt

Phiếu từng lens:

- domain-correctness: PASS — Trên máy chủ, mọi trường hợp không có số (không có dòng ops_heartbeat, bảng vắng 42P01, khối vắng, khối lỗi, khối sai khuôn) đều trả `state:"none"`, `rows:null` và note "Chỉ đo ở máy thu". Chỉ khối có mảng `rows` thật mới ra `[]`, và khi đó đó là số đã đo. Cờ fresh/stale lấy từ `b.state` do `readOpsFacts` tính từ `measured_at` của chính khối (`ageState`, FACTS_STALE_MS = 45′), không lấy từ `pushedAt` của bản tin. Nhánh máy chủ chỉ đọc `ops_heartbeat`, và `to_regclass` chỉ kiểm tên bảng, không đọc nội dung. Không có tệp cục bộ nào được đọc, và `toCoverageRows` ánh xạ rõ từng trường của `CoverageRow` nên không chép khối hay bản tin vào phản hồi. Nhánh `getCoverageOverview` (đọc `source_registry`) chỉ chạy khi `freshnessLocalOnly()` là false, tức máy thu.
- operational-feasibility: PASS — Trên máy chủ, mọi trường hợp không có số đều trả `state:"none"`, `rows:null`, `measuredAt:null` và `note:"Chỉ đo ở máy thu"`. Các trường hợp đó gồm: không có dòng `ops_heartbeat`, bảng vắng (42P01), khối vắng, khối lỗi, khối sai khuôn, và `toCoverageRows` ném lỗi. `rows:[]` chỉ xuất hiện khi khối `freshness` có thật và mang `measured_at`. Cờ `fresh`/`stale` lấy từ `ageState(measured_at của khối)` trong `readOpsFacts`, với ngưỡng `FACTS_STALE_MS` = 45′, không dùng `pushedAt` của bản tin. Nhánh máy chủ chỉ gọi `to_regclass` (kiểm tra danh mục, không đọc bảng), `ops_heartbeat` và `toCoverageRows`, là hàm chép từng trường tường minh của `CoverageRow`. Route không đọc bảng tầng A, không đọc tệp cục bộ, không chép bản tin hay trường ngoài `CoverageRow`. Lưu ý nhỏ: `status` trong từng hàng của khối cũ vẫn là giá trị lúc đẩy. Cờ cũ nằm ở `state` cấp phản hồi, đúng thiết kế, nên không đủ để loại.
- spec-alignment: PASS — Trên máy chủ, mọi nhánh không có số (không có dòng, bảng vắng 42P01, khối vắng, khối `error`, sai khuôn, `toCoverageRows` ném lỗi) trả `state:"none"`, `rows:null`, `measuredAt:null` và `note:"Chỉ đo ở máy thu"`. Chỉ khi khối có mảng rows hợp lệ thì mới trả `[]`, tức là số đã đo. Cờ `fresh`/`stale` lấy từ `ageState(b.measured_at)` của chính khối `freshness` với `FACTS_STALE_MS` = 45′, và `measuredAt` là `b.measuredAt`, không dùng `pushedAt`. Nhánh máy chủ chỉ đọc `ops_heartbeat` qua `readOpsFacts`; `freshnessLocalOnly` chỉ hỏi `to_regclass`, không đọc nội dung `source_registry`. Phản hồi gồm `generatedAt`, `source`, `state`, `measuredAt`, `rows` (qua `toCoverageRows`, ánh xạ tường minh từng trường của `CoverageRow`) và `note`, không chép khối hay bản tin. Nhánh máy chủ không có tệp cục bộ nào, và việc loại phương án B của ADR-0014 được giữ.

## Known limits

## Ngoài hợp đồng

## Analyst

Eval không-phân-biệt (xanh trên cả HEAD lẫn baseline), cần viết lại để assert hành vi mới hoặc xác nhận là regression-guard có chủ ý:

- `cd app && npm test` — các eval E1, E2, E3, E4, E5, E6

Lệnh suite xanh cả hai phía (agent, pipeline, lint-rules, portal-compliance) là regression-guard bình thường, không liệt kê.

## Variance

none — mọi eval chạy một lần (runs 1), không có eval nhiều lần chạy nào có pass_rate lẫn lộn.

## Iterations

Round 1: mọi eval máy đạt; E7 (judgment) chờ người ký ở Cổng 2 và có các mục ngoài hợp đồng cần người quyết (xem review-findings.md) nên verdict PENDING-JUDGMENT.

### Re-pin lần 1 — 2026-10-25, do ghim lại sau gộp main (sau chữ ký)
run_id: repin-20261025T121213Z-24233
sha: 6ff7adfe41065036031da4ca474ac0df51b10ea2 · suites: 6 lệnh exit 0 · evals: 7/7 eval máy đạt kỳ vọng · ngoài làn máy: E7 · AC không có chốt máy: AC-7
