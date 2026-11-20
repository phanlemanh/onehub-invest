---
schema_version: 2
feature_slug: ca-doi-chieu-tin-rao-nap-co-khop-cum
verdict: BLOCKED
failed_evals: []
reason: "Lệnh `node scripts/suite-neu-doi.mjs pipeline_b -- 'cd pipeline && npm run test:b'` chạy qua 30 phút chưa xong, chưa thấy dòng __EXIT= (khai long_running: 30 cho eval pipeline_b, mặc định vàng; chưa đối chiếu evals.yaml). Lệnh đã được chuyển nền sau 600 giây của công cụ, không phải bị công cụ giết. Tiến trình vẫn chạy: PID 39697, tệp đầu ra /private/tmp/claude-503/-Users-manhphan-dev-onehub-invest/0d21257c-48c4-4d63-bce1-14b468d2bfd9/tasks/bqsubhdks.output vẫn rỗng (0 byte); con node --test song song (PID 46573) đang chạy trong pipeline. Không có kết quả đạt/hỏng nào được xác nhận; không sửa code, không checkout/stash, không chạy lại. Cách xử lý: chạy lại với trần thời gian dài hơn."
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 3096de69760b3559c8f6ee85fb88d88430988b3e
human_signoff:
---

# Evidence Report: ca-doi-chieu-tin-rao-nap-co-khop-cum

Round 1. Bốn eval của tính năng (E1 đến E4) đều xanh. Hồ sơ BLOCKED vì lệnh suite pipeline_b chưa ra dòng kết thúc; thêm một lệnh suite app_ui có một ca đỏ không gắn eval nào (xem mục Lệnh suite).

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | script | PASS |
| E2 | AC-2 | script | PASS |
| E3 | AC-3 | script | PASS |
| E4 | AC-4 | script | PASS |

## Evidence

- eval: E1
  run_id: r1-l1-1-20261120070417
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.tdc_may_thu
  verified_at: 2026-11-20T07:04:17Z
  output: |
    MAY-THU OK

- eval: E2
  run_id: r1-l2-1-20261120070417
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.tdc_do_khi_pha
  verified_at: 2026-11-20T07:04:17Z
  output: |
    DO-KHI-PHA OK

- eval: E3
  run_id: r1-l2-1-20261120070417
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.tdc_do_khi_pha
  verified_at: 2026-11-20T07:04:17Z
  output: |
    DO-KHI-PHA OK

- eval: E4
  run_id: minted-ca-doi-chieu-tin-rao-nap-co-khop-cum-E4-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.tdc_pham_vi
  verified_at: 2026-11-20T07:04:17Z
  output: |
    PHAM-VI OK

### Lệnh suite (hồi quy)

- cmd: node scripts/suite-neu-doi.mjs agent -- 'cd agent && npm test'
  run_id: minted-ca-doi-chieu-tin-rao-nap-co-khop-cum-SUITE-node_scripts_suite_neu_doi_mjs_agent_cd_-r1
  exit_code: 0
  verified_at: 2026-11-20T07:04:17Z

- cmd: node scripts/suite-neu-doi.mjs app -- 'cd app && npx tsc --noEmit && npm run lint'
  run_id: minted-ca-doi-chieu-tin-rao-nap-co-khop-cum-SUITE-lint-r1
  exit_code: 0
  verified_at: 2026-11-20T07:04:17Z

- cmd: node scripts/suite-neu-doi.mjs app_ui -- 'cd app && npm test'
  run_id: minted-ca-doi-chieu-tin-rao-nap-co-khop-cum-SUITE-node_scripts_suite_neu_doi_mjs_app_ui_cd-r1
  exit_code: 1
  verified_at: 2026-11-20T07:04:17Z
  note: 1265 ca, 1255 qua, 1 hong, 9 bo qua. Ca hong duy nhat la SCB-AC-2 trong tests/suite-chung-bo-ca.test.tsx ("TRAN BI DOI tin-rao-doi-chieu.test.tsx"). Lenh nay khong gan eval nao; ghi lai de nguoi quyet doc.

- cmd: node scripts/suite-neu-doi.mjs pipeline_a -- 'cd pipeline && npm run test:a'
  run_id: minted-ca-doi-chieu-tin-rao-nap-co-khop-cum-SUITE-test_a-r1
  exit_code: 0
  verified_at: 2026-11-20T07:04:17Z

- cmd: node scripts/suite-neu-doi.mjs pipeline_b -- 'cd pipeline && npm run test:b'
  run_id: minted-ca-doi-chieu-tin-rao-nap-co-khop-cum-SUITE-test_b-r1
  exit_code: n/a (chưa có dòng kết thúc, tiến trình PID 39697 vẫn chạy)
  verified_at: 2026-11-20T07:04:17Z
  note: BLOCKED, xem reason ở frontmatter.

- cmd: node scripts/suite-neu-doi.mjs ui_lint_rules -- 'cd app && npm run test:lint-rules'
  run_id: minted-ca-doi-chieu-tin-rao-nap-co-khop-cum-SUITE-test_lint_rules-r1
  exit_code: 0
  verified_at: 2026-11-20T07:04:17Z

- cmd: node scripts/suite-neu-doi.mjs portal_static -- 'node scripts/check-portal-compliance.mjs'
  run_id: minted-ca-doi-chieu-tin-rao-nap-co-khop-cum-SUITE-node_scripts_suite_neu_doi_mjs_portal_st-r1
  exit_code: 0
  verified_at: 2026-11-20T07:04:17Z

## Known limits

## Ngoài hợp đồng

## Analyst

none — không có eval nào xanh cả hai phía; cả bốn eval của tính năng đều không đo được baseline.

Baseline không đo:
- bash _acceptance/ca-doi-chieu-tin-rao-nap-co-khop-cum/probes/may-thu.sh: bo qua baseline: tep _acceptance/ca-doi-chieu-tin-rao-nap-co-khop-cum/probes/may-thu.sh co o cay dang kiem nhung chua co o merge-base a60adccb8a3e6f4004343d1c4e52e74313ba7a3f — eval moi, chay tren code cu khong phan biet gi
- bash _acceptance/ca-doi-chieu-tin-rao-nap-co-khop-cum/probes/do-khi-pha.sh: bo qua baseline: tep _acceptance/ca-doi-chieu-tin-rao-nap-co-khop-cum/probes/do-khi-pha.sh co o cay dang kiem nhung chua co o merge-base a60adccb8a3e6f4004343d1c4e52e74313ba7a3f — eval moi, chay tren code cu khong phan biet gi
- bash _acceptance/ca-doi-chieu-tin-rao-nap-co-khop-cum/probes/pham-vi.sh: bo qua baseline: tep _acceptance/ca-doi-chieu-tin-rao-nap-co-khop-cum/probes/pham-vi.sh co o cay dang kiem nhung chua co o merge-base a60adccb8a3e6f4004343d1c4e52e74313ba7a3f — eval moi, chay tren code cu khong phan biet gi

Không có hội đồng chấm nào cho vòng này (cả bốn eval đều là script máy).

## Variance

none — mọi eval chạy một lần, xác định.

## Iterations

Round 1: bốn eval E1 đến E4 xanh; pipeline_b chưa ra kết quả sau 30 phút (BLOCKED, cần chạy lại với trần thời gian dài hơn); app_ui có một ca đỏ SCB-AC-2 không gắn eval nào.
