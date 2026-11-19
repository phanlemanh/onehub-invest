---
schema_version: 2
feature_slug: che-ten-nguon-khong-lay-tu-dau
verdict: REJECT
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 9849b88afdcee18b52347878bf83d195314de657
human_signoff:
---

# Evidence Report: che-ten-nguon-khong-lay-tu-dau

Vòng 2. Mọi eval máy đều chạy xong với mã thoát 0, nhưng bước phân loại phạm vi giữ lại các phát hiện nằm trong hợp đồng (AC-2, AC-4, AC-6, AC-9, AC-10) nên tổng kết là REJECT. Chi tiết ở review-findings.md.

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | test | PASS |
| E2 | AC-2 | test | PASS |
| E3 | AC-3 | test | PASS |
| E4a | AC-4 | test | PASS |
| E4b | AC-4 | test | PASS |
| E4c | AC-4 | test | PASS |
| E4d | AC-4 | test | PASS |
| E5 | AC-5 | script | PASS |
| E6 | AC-6 | script | PASS |
| E7 | AC-7 | test | PASS |
| E8 | AC-8 | judgment | đề xuất PASS, chờ người |
| E9 | AC-9 | test | PASS |
| E10 | AC-10 | test | PASS |
| E11a | AC-4 | test | PASS |
| E11b | AC-4 | test | PASS |
| E11c | AC-4 | test | PASS |

## Evidence

- eval: E1
  run_id: minted-che-ten-nguon-khong-lay-tu-dau-E1-r2
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/che-ten-nguon-khong-lay-tu-dau/probes/db.sh
  verified_at: 2026-11-19T03:05:08Z
  output: |
    ℹ duration_ms 672.055208

- eval: E3
  run_id: minted-che-ten-nguon-khong-lay-tu-dau-E3-r2
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/che-ten-nguon-khong-lay-tu-dau/probes/db.sh
  verified_at: 2026-11-19T03:05:08Z
  output: |
    ℹ duration_ms 672.055208

- eval: E4b
  run_id: minted-che-ten-nguon-khong-lay-tu-dau-E4b-r2
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/che-ten-nguon-khong-lay-tu-dau/probes/db.sh
  verified_at: 2026-11-19T03:05:08Z
  output: |
    ℹ duration_ms 672.055208

- eval: E7
  run_id: minted-che-ten-nguon-khong-lay-tu-dau-E7-r2
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/che-ten-nguon-khong-lay-tu-dau/probes/db.sh
  verified_at: 2026-11-19T03:05:08Z
  output: |
    ℹ duration_ms 672.055208

- eval: E4c
  run_id: minted-che-ten-nguon-khong-lay-tu-dau-E4c-r2
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/che-ten-nguon-khong-lay-tu-dau/probes/db.sh
  verified_at: 2026-11-19T03:05:08Z
  output: |
    ℹ duration_ms 672.055208

- eval: E2
  run_id: minted-che-ten-nguon-khong-lay-tu-dau-E2-r2
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/che-ten-nguon-khong-lay-tu-dau/probes/loi.sh
  verified_at: 2026-11-19T03:05:08Z
  output: |
    ℹ duration_ms 3618.039458

- eval: E4a
  run_id: minted-che-ten-nguon-khong-lay-tu-dau-E4a-r2
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/che-ten-nguon-khong-lay-tu-dau/probes/soat.sh
  verified_at: 2026-11-19T03:05:08Z
  output: |
    ℹ duration_ms 31718.878833

- eval: E5
  run_id: minted-che-ten-nguon-khong-lay-tu-dau-E5-r2
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/che-ten-nguon-khong-lay-tu-dau/probes/ban-chep.sh
  verified_at: 2026-11-19T03:05:08Z
  output: |
    thời gian 139 giây

- eval: E6
  run_id: minted-che-ten-nguon-khong-lay-tu-dau-E6-r2
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/che-ten-nguon-khong-lay-tu-dau/probes/ban-chep.sh
  verified_at: 2026-11-19T03:05:08Z
  output: |
    thời gian 139 giây

- eval: E4d
  run_id: minted-che-ten-nguon-khong-lay-tu-dau-E4d-r2
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/che-ten-nguon-khong-lay-tu-dau/probes/dong-chat.sh
  verified_at: 2026-11-19T03:05:08Z
  output: |
    ℹ duration_ms 2092.307167

- eval: E9
  run_id: minted-che-ten-nguon-khong-lay-tu-dau-E9-r2
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/che-ten-nguon-khong-lay-tu-dau/probes/khong-ten-that.sh
  verified_at: 2026-11-19T03:05:08Z
  output: |
    khong-ten-that: 42 tệp, 8 biến thể, 0 chỗ trúng — ĐẠT

- eval: E10
  run_id: minted-che-ten-nguon-khong-lay-tu-dau-E10-r2
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/che-ten-nguon-khong-lay-tu-dau/probes/khong-gui-khi-import.sh
  verified_at: 2026-11-19T03:05:08Z
  output: |
    ℹ duration_ms 4420.691

- eval: E11a
  run_id: minted-che-ten-nguon-khong-lay-tu-dau-E11a-r2
  exit_code: 0
  baseline: red
  verifier: config:executors.suite.app_ui
  verified_at: 2026-11-19T03:05:08Z
  output: |
    ℹ duration_ms 507198.288625

- eval: E11b
  run_id: bsfl898z3
  exit_code: 0
  baseline: red
  verifier: config:executors.suite.pipeline_a
  verified_at: 2026-11-19T03:05:08Z
  output: |
    ℹ duration_ms 910577.654208

- eval: E11c
  run_id: minted-che-ten-nguon-khong-lay-tu-dau-E11c-r2
  exit_code: 0
  baseline: red
  verifier: config:executors.suite.pipeline_b
  verified_at: 2026-11-19T03:05:08Z
  output: |
    ℹ duration_ms 1063694.966125

### Judgment

- eval: E8
  judged_by: hội đồng ba lăng kính (domain-correctness, operational-feasibility, spec-alignment), đề xuất PASS
  verdict: PASS
  rationale: Cả ba lăng kính cùng nhận định hợp đồng và thiết kế nói thẳng đây là nới bộ soát tầng A (T3, cần lời Mạnh), nêu nơi nới (cột match_whole theo dòng sổ, hàm nạp chung, sáu chỗ đọc), kê bốn chỗ đọc chưa mang cờ kèm lý do chặn thừa không rò, và nêu hai chuỗi trước bị chặn nay rời máy (từ đầu tên S16, nhãn đầu tên miền S16 khi đứng riêng).
  human_override:  # chi nguoi ghi

- domain-correctness: PASS — đủ nội dung nới, nơi nới, chỗ chưa mang cờ, số đo trước/sau.
- operational-feasibility: PASS — người duyệt hiểu được mà không mở mã.
- spec-alignment: PASS — khớp hợp đồng và thiết kế.

Hợp đồng là T3 nên mọi mục judgment cần người điền human_override ở Cổng 2; để trống.

### Lệnh suite (hồi quy)

- cmd: node scripts/suite-neu-doi.mjs agent -- 'cd agent && npm test'
  run_id: minted-che-ten-nguon-khong-lay-tu-dau-SUITE-node_scripts_suite_neu_doi_mjs_agent_cd_-r2
  exit_code: 0
  verified_at: 2026-11-19T03:05:08Z

- cmd: node scripts/suite-neu-doi.mjs app -- 'cd app && npx tsc --noEmit && npm run lint'
  run_id: minted-che-ten-nguon-khong-lay-tu-dau-SUITE-lint-r2
  exit_code: 0
  verified_at: 2026-11-19T03:05:08Z

- cmd: node scripts/suite-neu-doi.mjs ui_lint_rules -- 'cd app && npm run test:lint-rules'
  run_id: minted-che-ten-nguon-khong-lay-tu-dau-SUITE-test_lint_rules-r2
  exit_code: 0
  verified_at: 2026-11-19T03:05:08Z

- cmd: node scripts/suite-neu-doi.mjs portal_static -- 'node scripts/check-portal-compliance.mjs'
  run_id: minted-che-ten-nguon-khong-lay-tu-dau-SUITE-node_scripts_suite_neu_doi_mjs_portal_st-r2
  exit_code: 0
  verified_at: 2026-11-19T03:05:08Z

## Known limits

## Ngoài hợp đồng

## Analyst

none — mọi eval feature đo được baseline (E11a, E11b, E11c) đều red trên baseline (có phân biệt).

Baseline không đo
- bash _acceptance/che-ten-nguon-khong-lay-tu-dau/probes/db.sh: bo qua baseline: tep _acceptance/che-ten-nguon-khong-lay-tu-dau/probes/db.sh co o cay dang kiem nhung chua co o merge-base 13097168db0d8edccffeacc5938d0534def95a14 — eval moi, chay tren code cu khong phan biet gi
- bash _acceptance/che-ten-nguon-khong-lay-tu-dau/probes/loi.sh: bo qua baseline: tep _acceptance/che-ten-nguon-khong-lay-tu-dau/probes/loi.sh co o cay dang kiem nhung chua co o merge-base 13097168db0d8edccffeacc5938d0534def95a14 — eval moi, chay tren code cu khong phan biet gi
- bash _acceptance/che-ten-nguon-khong-lay-tu-dau/probes/soat.sh: bo qua baseline: tep _acceptance/che-ten-nguon-khong-lay-tu-dau/probes/soat.sh co o cay dang kiem nhung chua co o merge-base 13097168db0d8edccffeacc5938d0534def95a14 — eval moi, chay tren code cu khong phan biet gi
- bash _acceptance/che-ten-nguon-khong-lay-tu-dau/probes/ban-chep.sh: bo qua baseline: tep _acceptance/che-ten-nguon-khong-lay-tu-dau/probes/ban-chep.sh co o cay dang kiem nhung chua co o merge-base 13097168db0d8edccffeacc5938d0534def95a14 — eval moi, chay tren code cu khong phan biet gi
- bash _acceptance/che-ten-nguon-khong-lay-tu-dau/probes/dong-chat.sh: bo qua baseline: tep _acceptance/che-ten-nguon-khong-lay-tu-dau/probes/dong-chat.sh co o cay dang kiem nhung chua co o merge-base 13097168db0d8edccffeacc5938d0534def95a14 — eval moi, chay tren code cu khong phan biet gi
- bash _acceptance/che-ten-nguon-khong-lay-tu-dau/probes/khong-ten-that.sh: bo qua baseline: tep _acceptance/che-ten-nguon-khong-lay-tu-dau/probes/khong-ten-that.sh co o cay dang kiem nhung chua co o merge-base 13097168db0d8edccffeacc5938d0534def95a14 — eval moi, chay tren code cu khong phan biet gi
- bash _acceptance/che-ten-nguon-khong-lay-tu-dau/probes/khong-gui-khi-import.sh: bo qua baseline: tep _acceptance/che-ten-nguon-khong-lay-tu-dau/probes/khong-gui-khi-import.sh co o cay dang kiem nhung chua co o merge-base 13097168db0d8edccffeacc5938d0534def95a14 — eval moi, chay tren code cu khong phan biet gi

## Variance

none — mọi eval nhiều lần chạy đều đồng nhất (mọi eval chạy một lần, deterministic).

## Iterations

Round 1: lịch sử vòng 1 nằm ở bản trước, không có trong dữ liệu vòng này.
Round 2: mọi eval máy chạy xong, không eval nào đỏ; REJECT vì các phát hiện trong hợp đồng (cumTach thoát ký tự regex sai ở hai bản lõi gây hỏng im lặng AC-2; phép dò E9 bỏ sót tệp test AC-9; phép đếm E6 bỏ nhánh cụm tách dấu AC-6; ca push-ops-facts AC-4 và AC-10 chỉ đo 0 lời gọi, soát mã AC-4 chỉ phủ một dạng câu SQL). Trả về triển khai.
