---
schema_version: 2
feature_slug: ops-facts-so-tong-hop
verdict: PASS
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 1961239cb0f1fbc1e8f50ab8c04f3bec196c83aa
human_signoff:
---

# Evidence Report: ops-facts-so-tong-hop

Round 1.

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | test | PASS |
| E2 | AC-2 | test | PASS |
| E3 | AC-3 | test | PASS |
| E4 | AC-4 | test | PASS |
| E5 | AC-5 | test | PASS |
| E6 | AC-6 | test | PASS |
| E7 | AC-7 | test | PASS |
| E8 | AC-8 | test | PASS |
| E9 | AC-9 | test | PASS |
| E10 | AC-10 | test | PASS |

## Evidence

- eval: E1
  run_id: minted-ops-facts-so-tong-hop-E1-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.test.pipeline
  verified_at: 2026-10-24T11:43:57Z
  output: |
    cmd: cd pipeline && npm test
    ca ON22-AC-1 (bản tin có đúng năm khối, mỗi khối measured_at trong khoảng chạy, khoá cũ còn đủ) ok
    ca đỏ ON22-AC-1 (bản sao bỏ measured_at một khối, nêu tên khối) ok
    ℹ duration_ms 7604.302

- eval: E2
  run_id: minted-ops-facts-so-tong-hop-E2-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.test.pipeline
  verified_at: 2026-10-24T11:43:57Z
  output: |
    cmd: cd pipeline && npm test
    ca ON22-AC-2 (khối freshness bằng từng hàng check-freshness --json cùng now) ok
    ca đỏ ON22-AC-2 (bản sao đổi SLO một mã, phép so bắt đúng mã) ok
    ℹ duration_ms 7604.302

- eval: E3
  run_id: minted-ops-facts-so-tong-hop-E3-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.test.app_ui
  verified_at: 2026-10-24T11:43:57Z
  output: |
    cmd: cd app && npm test
    ca ON22-AC-3 (khối records24h bằng items24h của getSourceFeedHealth trên cùng lược đồ) ok
    ca đỏ ON22-AC-3 (bản sao đếm cả ngoài 24 giờ, bắt) ok
    ℹ duration_ms 10168.307208

- eval: E4
  run_id: minted-ops-facts-so-tong-hop-E4-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.test.pipeline
  verified_at: 2026-10-24T11:43:57Z
  output: |
    cmd: cd pipeline && npm test
    ca ON22-AC-4 (reviewQueue = số thẻ pending theo item_type, chỉ ba khoá) ok
    ca đỏ ON22-AC-4 (bản sao đẩy tiêu đề thẻ, bắt) ok
    ℹ duration_ms 7604.302

- eval: E5
  run_id: minted-ops-facts-so-tong-hop-E5-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.test.app_ui
  verified_at: 2026-10-24T11:43:57Z
  output: |
    cmd: cd app && npm test
    ca ON22-AC-5 ma trận cây log (khối lockdown bằng getLockdownStatus từng lớp, 7 ca) ok
    ca ON22-AC-5 (lớp không kiểm được là null, lớp thấy sự cố là false) ok
    ca đỏ ON22-AC-5 (biến false thành null; mặc định ok=true khi thiếu log) ok
    ℹ duration_ms 10168.307208

- eval: E6
  run_id: minted-ops-facts-so-tong-hop-E6-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.test.pipeline
  verified_at: 2026-10-24T11:43:57Z
  output: |
    cmd: cd pipeline && npm test
    ca ON22-AC-6 (khối jobs khớp bản chụp launchctl 23/10: nhãn, lastExit, pid, nhãn che S0x) ok
    ca ON22-AC-6 (launchctl không chạy: error, 0 hàng) ok
    ℹ duration_ms 7604.302

- eval: E7
  run_id: minted-ops-facts-so-tong-hop-E7-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.test.pipeline
  verified_at: 2026-10-24T11:43:57Z
  output: |
    cmd: cd pipeline && npm test
    ca ON22-AC-7 ma trận (khối không đo được mang measured_at và error, khối khác vẫn đo, bản tin vẫn gửi, 4 ca) ok
    ca đỏ ON22-AC-7 (bản sao thay lỗi bằng 0, bắt) ok
    ℹ duration_ms 7604.302

- eval: E8
  run_id: minted-ops-facts-so-tong-hop-E8-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.test.pipeline
  verified_at: 2026-10-24T11:43:57Z
  output: |
    cmd: cd pipeline && npm test
    ca ON22-AC-8 ma trận cấy tên vào năm khối (mỗi bản bị chặn, 0 POST, dòng chặn nêu blocks.<khối>) ok
    ℹ duration_ms 7604.302

- eval: E9
  run_id: minted-ops-facts-so-tong-hop-E9-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.test.app_ui
  verified_at: 2026-10-24T11:43:57Z
  output: |
    cmd: cd app && npm test
    ca ON22-AC-9 (bản tin thật qua handler ingest thật: none, 44 phút fresh, 46 phút stale kèm measuredAt, khối cũ trong bản tin tươi, khối lỗi) ok
    ca ON22-AC-9 hằng 45 phút khai một chỗ ok
    ca đỏ ON22-AC-9 (đổi tên measured_at bên ghi; ngưỡng 60 phút) ok
    ℹ duration_ms 10168.307208

- eval: E10
  run_id: minted-ops-facts-so-tong-hop-E10-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.test.pipeline
  verified_at: 2026-10-24T11:43:57Z
  output: |
    cmd: cd pipeline && npm test
    ca ON22-AC-10 máy thu thật, chế độ khô (năm khối có measured_at, freshness bằng check-freshness, 0 chỗ chặn, đầu ra chỉ tên khối và trạng thái) ok
    ℹ duration_ms 7604.302

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-ops-facts-so-tong-hop-SUITE-npm_test-r1
  exit_code: 0
  verified_at: 2026-10-24T11:43:57Z

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-ops-facts-so-tong-hop-SUITE-lint-r1
  exit_code: 0
  verified_at: 2026-10-24T11:43:57Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-ops-facts-so-tong-hop-SUITE-test_lint_rules-r1
  exit_code: 0
  verified_at: 2026-10-24T11:43:57Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-ops-facts-so-tong-hop-SUITE-node_scripts_check_portal_compliance_mjs-r1
  exit_code: 0
  verified_at: 2026-10-24T11:43:57Z

## Known limits

## Ngoài hợp đồng

## Analyst

Eval không-phân-biệt (xanh trên cả HEAD lẫn baseline diffBase; chứng minh harness chứ chưa chứng minh feature, cần viết lại để assert hành vi mới hoặc xác nhận là regression-guard có chủ ý):

- `cd pipeline && npm test`: E1, E2, E4, E6, E7, E8, E10
- `cd app && npm test`: E3, E5, E9

Ba lệnh suite còn lại (agent, lint, test:lint-rules, check-portal-compliance) xanh cả hai phía là regression-guard bình thường, không liệt kê.

## Variance

none — mọi eval chạy một lần, xác định, kết quả đồng nhất; không eval nào ngẫu nhiên.

## Iterations

Round 1: E1 đến E10 đều qua, các lệnh suite đều xanh. Verdict PASS.
