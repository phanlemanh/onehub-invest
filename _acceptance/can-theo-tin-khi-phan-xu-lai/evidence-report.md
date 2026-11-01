---
schema_version: 2
feature_slug: can-theo-tin-khi-phan-xu-lai
verdict: PASS
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: a7b9780aba607ba961351dca66336ed7a2a58090
human_signoff:
---

# Evidence Report: can-theo-tin-khi-phan-xu-lai

Vòng 5 (do Mạnh mở). Nội dung thay trọn vòng cũ; lịch sử các vòng nằm ở mục Iterations.

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | test | PASS |
| E2 | AC-2 | test | PASS |
| E3 | AC-3 | test | PASS |
| E4 | AC-4 | test | PASS |
| E5 | AC-5 | script | PASS |
| E6 | AC-5 | test | PASS |
| E7 | AC-5 | test | PASS |

## Evidence

- eval: E1
  run_id: minted-can-theo-tin-khi-phan-xu-lai-E1-r5
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.can_theo_tin
  verified_at: 2026-11-01T22:45:33Z
  output: |
    cd pipeline && node --test --test-concurrency=1 scripts/can-theo-tin.itest.mjs
    ℹ duration_ms 10622.035291

- eval: E2
  run_id: minted-can-theo-tin-khi-phan-xu-lai-E2-r5
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.can_theo_tin
  verified_at: 2026-11-01T22:45:33Z
  output: |
    cd pipeline && node --test --test-concurrency=1 scripts/can-theo-tin.itest.mjs
    ℹ duration_ms 10622.035291

- eval: E3
  run_id: minted-can-theo-tin-khi-phan-xu-lai-E3-r5
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.can_theo_tin
  verified_at: 2026-11-01T22:45:33Z
  output: |
    cd pipeline && node --test --test-concurrency=1 scripts/can-theo-tin.itest.mjs
    ℹ duration_ms 10622.035291

- eval: E4
  run_id: minted-can-theo-tin-khi-phan-xu-lai-E4-r5
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.can_theo_tin
  verified_at: 2026-11-01T22:45:33Z
  output: |
    cd pipeline && node --test --test-concurrency=1 scripts/can-theo-tin.itest.mjs
    ℹ duration_ms 10622.035291

- eval: E5
  run_id: minted-can-theo-tin-khi-phan-xu-lai-E5-r5
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.can_theo_tin_ap_hai_lan
  verified_at: 2026-11-01T22:45:33Z
  output: |
    node _acceptance/can-theo-tin-khi-phan-xu-lai/rang/ap-hai-lan.mjs
    (2) áp 066 hai lần trên oneinvest_p2_ct_hai_66791: căn lệch trước 0 → sau lần một 0 · audit +0 rồi +0 · hàm giữ · oneinvest can-theo-tin:* 0 → 0

- eval: E6
  run_id: minted-can-theo-tin-khi-phan-xu-lai-E6-r5
  exit_code: 0
  baseline: green
  verifier: config:executors.test.pb_chung_bai
  verified_at: 2026-11-01T22:45:33Z
  output: |
    cd pipeline && node --test --test-concurrency=1 scripts/phat-bieu-chung-bai.itest.mjs
    ℹ duration_ms 2745.822458

- eval: E7
  run_id: minted-can-theo-tin-khi-phan-xu-lai-E7-r5
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.pipeline
  verified_at: 2026-11-01T22:45:33Z
  output: |
    cd pipeline && npm test
    ℹ duration_ms 492070.272625

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-can-theo-tin-khi-phan-xu-lai-SUITE-npm_test__bb6271-r5
  exit_code: 0
  verified_at: 2026-11-01T22:45:33Z

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-can-theo-tin-khi-phan-xu-lai-SUITE-lint-r5
  exit_code: 0
  verified_at: 2026-11-01T22:45:33Z

- cmd: cd app && npm test
  run_id: minted-can-theo-tin-khi-phan-xu-lai-SUITE-npm_test__bd9a35-r5
  exit_code: 0
  verified_at: 2026-11-01T22:45:33Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-can-theo-tin-khi-phan-xu-lai-SUITE-test_lint_rules-r5
  exit_code: 0
  verified_at: 2026-11-01T22:45:33Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-can-theo-tin-khi-phan-xu-lai-SUITE-node_scripts_check_portal_compliance_mjs-r5
  exit_code: 0
  verified_at: 2026-11-01T22:45:33Z

## Known limits

## Ngoài hợp đồng

## Analyst

Eval không phân biệt (xanh cả trên bản mới lẫn baseline): E6 (`cd pipeline && DATABASE_URL=${PB_DB_URL:-postgres://oneinvest:oneinvest@localhost:5433/oneinvest_p2_pd} node --test --test-concurrency=1 scripts/phat-bieu-chung-bai.itest.mjs`). Đây là regression-guard của hành vi phát biểu chung bài đã có, không chứng minh tính năng mới.

Baseline khong do:
- cd pipeline && DATABASE_URL=${CT_DB_URL:-postgres://oneinvest:oneinvest@localhost:5433/oneinvest_p2_ct} node --test --test-concurrency=1 scripts/can-theo-tin.itest.mjs: bo qua baseline: tep pipeline/scripts/can-theo-tin.itest.mjs co o cay dang kiem nhung chua co o merge-base e6543f3a65e6e0a1483333a8be93fc66777e7640 — eval moi, chay tren code cu khong phan biet gi
- node _acceptance/can-theo-tin-khi-phan-xu-lai/rang/ap-hai-lan.mjs: bo qua baseline: tep _acceptance/can-theo-tin-khi-phan-xu-lai/rang/ap-hai-lan.mjs co o cay dang kiem nhung chua co o merge-base e6543f3a65e6e0a1483333a8be93fc66777e7640 — eval moi, chay tren code cu khong phan biet gi
- cd pipeline && npm test: baseline vuot tran 180 giay/lenh — da dung ca cay tien trinh; BLOCKED ha tang, khong phai ket qua cua code cu

Các phát hiện từ bước rà soát (hai mục trong hợp đồng về ca tin đã nghỉ không chung bài đăng, cùng các mục ngoài hợp đồng) nằm ở `review-findings.md` để người đọc ở Cổng 2.

## Variance

none — every multi-run eval is uniform

## Iterations

Round 4: E5 bị BLOCKED hạ tầng — bản chép DB thử thiếu bảng khi máy tải nặng; vế (1) vẫn xanh. Chạy lại ở vòng sau.
Round 5: do Mạnh mở; giữ nguyên E7 và evals.yaml. Cả bảy eval và năm lệnh suite xanh trên cây a7b9780a.

