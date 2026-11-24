---
schema_version: 2
feature_slug: luot-hang-dem-khong-tu-ap-truoc-doc-lap
verdict: REJECT
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: eaabc80df385156bdaa9cd9090536b565fa6e6eb
human_signoff:
---

# Evidence Report: luot-hang-dem-khong-tu-ap-truoc-doc-lap

Round 1. Cả tám eval máy xanh, nhưng verdict tổng là REJECT vì hai lý do: (1) lệnh suite `agent` (không gắn eval nào) đỏ, hai ca của `agent/tests/enrich-giao-dich.test.ts` (EC-AC-2) hỏng; (2) ba finding trong hợp đồng cùng chỉ vào AC-6: số đề xuất chuyển sang thẻ chờ không in ở lượt ghi thật, còn ở chế độ chạy thử luôn là 0. Mục «Ngoài hợp đồng» của findings nằm ở `review-findings.md`, không nằm ở đây.

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | script | PASS |
| E2 | AC-2 | script | PASS |
| E3 | AC-3 | script | PASS |
| E4 | AC-4 | script | PASS |
| E5 | AC-5 | script | PASS |
| E6 | AC-6 | script | PASS |
| E7 | AC-4 | test | PASS |
| E8 | AC-4 | test | PASS |

## Evidence

- eval: E1
  run_id: minted-luot-hang-dem-khong-tu-ap-truoc-doc-lap-E1-r1
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/luot-hang-dem-khong-tu-ap-truoc-doc-lap/probes/chay.sh
  verified_at: 2026-11-24T09:05:36Z
  output: |
    bash _acceptance/luot-hang-dem-khong-tu-ap-truoc-doc-lap/probes/chay.sh AC-1
    ℹ duration_ms 1439.580291

- eval: E2
  run_id: minted-luot-hang-dem-khong-tu-ap-truoc-doc-lap-E2-r1
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/luot-hang-dem-khong-tu-ap-truoc-doc-lap/probes/chay.sh
  verified_at: 2026-11-24T09:05:36Z
  output: |
    bash _acceptance/luot-hang-dem-khong-tu-ap-truoc-doc-lap/probes/chay.sh AC-2
    ℹ duration_ms 426.842416

- eval: E3
  run_id: minted-luot-hang-dem-khong-tu-ap-truoc-doc-lap-E3-r1
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/luot-hang-dem-khong-tu-ap-truoc-doc-lap/probes/chay.sh
  verified_at: 2026-11-24T09:05:36Z
  output: |
    bash _acceptance/luot-hang-dem-khong-tu-ap-truoc-doc-lap/probes/chay.sh AC-3
    ℹ duration_ms 1829.864916

- eval: E4
  run_id: minted-luot-hang-dem-khong-tu-ap-truoc-doc-lap-E4-r1
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/luot-hang-dem-khong-tu-ap-truoc-doc-lap/probes/chay.sh
  verified_at: 2026-11-24T09:05:36Z
  output: |
    bash _acceptance/luot-hang-dem-khong-tu-ap-truoc-doc-lap/probes/chay.sh AC-4
    ℹ duration_ms 6330.278375

- eval: E5
  run_id: minted-luot-hang-dem-khong-tu-ap-truoc-doc-lap-E5-r1
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/luot-hang-dem-khong-tu-ap-truoc-doc-lap/probes/chay.sh
  verified_at: 2026-11-24T09:05:36Z
  output: |
    bash _acceptance/luot-hang-dem-khong-tu-ap-truoc-doc-lap/probes/chay.sh AC-5
    ℹ duration_ms 2633.84675

- eval: E6
  run_id: minted-luot-hang-dem-khong-tu-ap-truoc-doc-lap-E6-r1
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/luot-hang-dem-khong-tu-ap-truoc-doc-lap/probes/chay.sh
  verified_at: 2026-11-24T09:05:36Z
  output: |
    bash _acceptance/luot-hang-dem-khong-tu-ap-truoc-doc-lap/probes/chay.sh AC-6
    ℹ duration_ms 843.918958

- eval: E7
  run_id: r1-l7-1-20261124090536
  exit_code: 0
  baseline: red
  verifier: config:executors.suite.pipeline_a
  verified_at: 2026-11-24T09:05:36Z
  output: |
    node scripts/suite-neu-doi.mjs pipeline_a -- 'cd pipeline && npm run test:a'
    ℹ duration_ms 2596623.162916

- eval: E8
  run_id: minted-luot-hang-dem-khong-tu-ap-truoc-doc-lap-E8-r1
  exit_code: 0
  baseline: red
  verifier: config:executors.suite.pipeline_b
  verified_at: 2026-11-24T09:05:36Z
  output: |
    node scripts/suite-neu-doi.mjs pipeline_b -- 'cd pipeline && npm run test:b'
    ℹ duration_ms 1378006.470792

### Lệnh suite (hồi quy)

- cmd: node scripts/suite-neu-doi.mjs agent -- 'cd agent && npm test'
  run_id: minted-luot-hang-dem-khong-tu-ap-truoc-doc-lap-SUITE-node_scripts_suite_neu_doi_mjs_agent_cd_-r1
  exit_code: 1
  verified_at: 2026-11-24T09:05:36Z
  note: không gắn eval nào; đỏ. Hai ca hỏng trong agent/tests/enrich-giao-dich.test.ts, cùng mang nhãn EC-AC-2: «cô lập lỗi ghi: hỏng ở câu ghi thứ hai và hỏng sau câu ghi cuối» và «chiều đỏ: bỏ giaoDich (ghi thẳng)». Thông điệp: tin lành t_gd_0001 và t_gd_0003 không có phát biểu.

- cmd: node scripts/suite-neu-doi.mjs app -- 'cd app && npx tsc --noEmit && npm run lint'
  run_id: minted-luot-hang-dem-khong-tu-ap-truoc-doc-lap-SUITE-lint-r1
  exit_code: 0
  verified_at: 2026-11-24T09:05:36Z

- cmd: node scripts/suite-neu-doi.mjs app_ui -- 'cd app && npm test'
  run_id: minted-luot-hang-dem-khong-tu-ap-truoc-doc-lap-SUITE-node_scripts_suite_neu_doi_mjs_app_ui_cd-r1
  exit_code: 0
  verified_at: 2026-11-24T09:05:36Z

- cmd: node scripts/suite-neu-doi.mjs ui_lint_rules -- 'cd app && npm run test:lint-rules'
  run_id: minted-luot-hang-dem-khong-tu-ap-truoc-doc-lap-SUITE-test_lint_rules-r1
  exit_code: 0
  verified_at: 2026-11-24T09:05:36Z

- cmd: node scripts/suite-neu-doi.mjs portal_static -- 'node scripts/check-portal-compliance.mjs'
  run_id: minted-luot-hang-dem-khong-tu-ap-truoc-doc-lap-SUITE-node_scripts_suite_neu_doi_mjs_portal_st-r1
  exit_code: 0
  verified_at: 2026-11-24T09:05:36Z

## Known limits

## Ngoài hợp đồng

## Analyst

none — mọi eval feature đo được baseline (E7, E8) đều red trên baseline (có phân biệt).

Baseline không đo:
- bash _acceptance/luot-hang-dem-khong-tu-ap-truoc-doc-lap/probes/chay.sh AC-1: bo qua baseline: tep _acceptance/luot-hang-dem-khong-tu-ap-truoc-doc-lap/probes/chay.sh co o cay dang kiem nhung chua co o merge-base be765e6a527738d8afbeaf2e88e9e63210bc49f2 — eval moi, chay tren code cu khong phan biet gi
- bash _acceptance/luot-hang-dem-khong-tu-ap-truoc-doc-lap/probes/chay.sh AC-2: bo qua baseline: tep _acceptance/luot-hang-dem-khong-tu-ap-truoc-doc-lap/probes/chay.sh co o cay dang kiem nhung chua co o merge-base be765e6a527738d8afbeaf2e88e9e63210bc49f2 — eval moi, chay tren code cu khong phan biet gi
- bash _acceptance/luot-hang-dem-khong-tu-ap-truoc-doc-lap/probes/chay.sh AC-3: bo qua baseline: tep _acceptance/luot-hang-dem-khong-tu-ap-truoc-doc-lap/probes/chay.sh co o cay dang kiem nhung chua co o merge-base be765e6a527738d8afbeaf2e88e9e63210bc49f2 — eval moi, chay tren code cu khong phan biet gi
- bash _acceptance/luot-hang-dem-khong-tu-ap-truoc-doc-lap/probes/chay.sh AC-4: bo qua baseline: tep _acceptance/luot-hang-dem-khong-tu-ap-truoc-doc-lap/probes/chay.sh co o cay dang kiem nhung chua co o merge-base be765e6a527738d8afbeaf2e88e9e63210bc49f2 — eval moi, chay tren code cu khong phan biet gi
- bash _acceptance/luot-hang-dem-khong-tu-ap-truoc-doc-lap/probes/chay.sh AC-5: bo qua baseline: tep _acceptance/luot-hang-dem-khong-tu-ap-truoc-doc-lap/probes/chay.sh co o cay dang kiem nhung chua co o merge-base be765e6a527738d8afbeaf2e88e9e63210bc49f2 — eval moi, chay tren code cu khong phan biet gi
- bash _acceptance/luot-hang-dem-khong-tu-ap-truoc-doc-lap/probes/chay.sh AC-6: bo qua baseline: tep _acceptance/luot-hang-dem-khong-tu-ap-truoc-doc-lap/probes/chay.sh co o cay dang kiem nhung chua co o merge-base be765e6a527738d8afbeaf2e88e9e63210bc49f2 — eval moi, chay tren code cu khong phan biet gi

## Variance

none — mọi eval nhiều lần chạy đều đồng nhất (mọi eval chạy một lần, xác định).

## Iterations

Round 1: cả tám eval máy xanh; REJECT vì lệnh suite agent đỏ (hai ca EC-AC-2 của enrich-giao-dich) và ba finding trong hợp đồng cùng nêu AC-6 (tổng kết lượt không in số đề xuất chuyển thẻ ở chế độ ghi; chế độ dry luôn 0). Trả về cho bước làm.
