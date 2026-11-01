---
schema_version: 2
feature_slug: check-cloud-sync-sellers-view
verdict: BLOCKED
failed_evals: ["E1","E2b","E2c","E2d","E2e","E2f","E2g","E2h","E2i","E2j"]
reason: "Lệnh `cd app && npm test` chạy quá 30 phút chưa xong. Eval khai long_running: 30 trong evals.yaml (không thấy khai riêng, dùng mặc định 30 phút). Lệnh được chuyển nền (task b4iwqvbuz) sau 600s. Tiến trình node --import tsx --test --test-concurrency=8 tests/*.test.tsx vẫn chạy ở 30:59 và chưa in dòng kết thúc. Không có kết quả đạt hay hỏng. Không chạy lại, không kill tiến trình. Ngoài ra mười eval cloud-sync gãy vì Postgres mô phỏng hết chỗ trống đĩa (No space left on device)."
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 269ed3cf13b6ca5e6ce408b539c32848dc4fe25f
human_signoff:
---

# Evidence Report: check-cloud-sync-sellers-view

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | script | FAIL |
| E2a | AC-2 | script | PASS |
| E2b | AC-2 | script | FAIL |
| E2c | AC-2 | script | FAIL |
| E2d | AC-2 | script | FAIL |
| E2e | AC-2 | script | FAIL |
| E2f | AC-2 | script | FAIL |
| E2g | AC-2 | script | FAIL |
| E2h | AC-2 | script | FAIL |
| E2i | AC-2 | script | FAIL |
| E2j | AC-2 | script | FAIL |
| E3 | AC-3 | script | PASS |

## Evidence

- eval: E1
  run_id: minted-check-cloud-sync-sellers-view-E1-r1
  exit_code: 1
  baseline: red
  verifier: config:executors.script.cloud_sync_sellers_view
  verified_at: 2026-11-01T03:20:57Z
  output: |
    PASS local mô phỏng: sellers là bảng
    PASS local mô phỏng: sellers 297 dòng, trọn bảy cột khớp view nguồn
    PASS ĐỎ-ĐÚNG đảo first_seen/last_seen → băm lệch view nguồn
    PASS cloud mô phỏng: sellers là bảng
    PASS cloud mô phỏng: sellers đúng cột CLOUD_ALLOW
    FAIL ca sellers-view ném lỗi: could not extend file "base/22035/23251": No space left on device (tại syncOnce, sync-cloud.mjs:695)
    check-cloud-sync sellers-view: CÓ LỖI

- eval: E2a
  run_id: minted-check-cloud-sync-sellers-view-E2a-r1
  exit_code: 0
  baseline: red
  verifier: config:executors.script.cloud_sync_stage
  verified_at: 2026-11-01T03:20:57Z
  output: |
    check-cloud-sync stage: OK

- eval: E2b
  run_id: minted-check-cloud-sync-sellers-view-E2b-r1
  exit_code: 1
  baseline: red
  verifier: config:executors.script.cloud_sync_atomic
  verified_at: 2026-11-01T03:20:57Z
  output: |
    FAIL ca atomic ném lỗi: could not write to file "pg_wal/xlogtemp.600": No space left on device (tại syncOnce, sync-cloud.mjs:695)
    check-cloud-sync atomic: CÓ LỖI

- eval: E2c
  run_id: minted-check-cloud-sync-sellers-view-E2c-r1
  exit_code: 1
  baseline: red
  verifier: config:executors.script.cloud_sync_fail
  verified_at: 2026-11-01T03:20:57Z
  output: |
    FAIL ca fail ném lỗi: could not extend file "base/22035/23336": No space left on device (tại syncOnce, sync-cloud.mjs:695)
    check-cloud-sync fail: CÓ LỖI

- eval: E2d
  run_id: minted-check-cloud-sync-sellers-view-E2d-r1
  exit_code: 1
  baseline: red
  verifier: config:executors.script.cloud_sync_fidelity
  verified_at: 2026-11-01T03:20:57Z
  output: |
    FAIL ca fidelity ném lỗi: could not extend file "base/22035/23335": No space left on device (tại syncOnce, sync-cloud.mjs:695)
    check-cloud-sync fidelity: CÓ LỖI

- eval: E2e
  run_id: minted-check-cloud-sync-sellers-view-E2e-r1
  exit_code: 1
  baseline: red
  verifier: config:executors.script.cloud_sync_keep
  verified_at: 2026-11-01T03:20:57Z
  output: |
    FAIL ca keep ném lỗi: could not extend file "base/22035/23315": No space left on device (tại syncOnce, sync-cloud.mjs:695)
    check-cloud-sync keep: CÓ LỖI

- eval: E2f
  run_id: minted-check-cloud-sync-sellers-view-E2f-r1
  exit_code: 1
  baseline: red
  verifier: config:executors.script.cloud_sync_pii
  verified_at: 2026-11-01T03:20:57Z
  output: |
    FAIL ca pii ném lỗi: could not write to file "pg_wal/xlogtemp.598": No space left on device (tại syncOnce, sync-cloud.mjs:695)
    check-cloud-sync pii: CÓ LỖI

- eval: E2g
  run_id: minted-check-cloud-sync-sellers-view-E2g-r1
  exit_code: 1
  baseline: red
  verifier: config:executors.script.cloud_sync_overlap
  verified_at: 2026-11-01T03:20:57Z
  output: |
    FAIL ca overlap ném lỗi: could not extend file "base/22035/23221": No space left on device (tại syncOnce, sync-cloud.mjs:695)
    check-cloud-sync overlap: CÓ LỖI

- eval: E2h
  run_id: minted-check-cloud-sync-sellers-view-E2h-r1
  exit_code: 1
  baseline: red
  verifier: config:executors.script.cloud_sync_allow
  verified_at: 2026-11-01T03:20:57Z
  output: |
    FAIL ca allow ném lỗi: could not extend file "base/22035/23221": No space left on device (tại syncOnce, sync-cloud.mjs:695)
    check-cloud-sync allow: CÓ LỖI

- eval: E2i
  run_id: minted-check-cloud-sync-sellers-view-E2i-r1
  exit_code: 1
  baseline: red
  verifier: config:executors.script.cloud_sync_anon
  verified_at: 2026-11-01T03:20:57Z
  output: |
    PASS ĐỎ-ĐÚNG thiếu role anon: LEAK GATE FAIL (trước khi gửi): cloud không có role anon
    PASS tiền điều kiện AC-1: anon SELECT được public.spatial_ref_sys trong cloud mô phỏng
    FAIL AC-1 lượt sync trên cloud sạch gãy: [stage] could not extend file "base/23488/24930": No space left on device
    FAIL ca anon ném lỗi: the database system is in recovery mode
    check-cloud-sync anon: CÓ LỖI

- eval: E2j
  run_id: minted-check-cloud-sync-sellers-view-E2j-r1
  exit_code: 1
  baseline: red
  verifier: config:executors.script.cloud_sync_pii_cot
  verified_at: 2026-11-01T03:20:57Z
  output: |
    FAIL ca pii-cot ném lỗi: could not extend file "base/22035/23226": No space left on device (tại syncOnce, sync-cloud.mjs:695)
    check-cloud-sync pii-cot: CÓ LỖI

- eval: E3
  run_id: minted-check-cloud-sync-sellers-view-E3-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.ccs_pham_vi
  verified_at: 2026-11-01T03:20:57Z
  output: |
    PHAM VI OK

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-check-cloud-sync-sellers-view-SUITE-npm_test__bb6271-r1
  exit_code: 0
  verified_at: 2026-11-01T03:20:57Z

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-check-cloud-sync-sellers-view-SUITE-lint-r1
  exit_code: 0
  verified_at: 2026-11-01T03:20:57Z

- cmd: cd app && npm test
  run_id: minted-check-cloud-sync-sellers-view-SUITE-npm_test__bd9a35-r1
  exit_code: 1
  verified_at: 2026-11-01T03:20:57Z
  note: BLOCKED, không phải hỏng. Lệnh chạy quá 30 phút chưa kết thúc (tiến trình còn chạy ở 30:59, chưa có dòng kết thúc). Không có kết quả đạt hay hỏng; không chạy lại, không kill.

- cmd: cd pipeline && npm test
  run_id: `
  exit_code: 0
  verified_at: 2026-11-01T03:20:57Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-check-cloud-sync-sellers-view-SUITE-test_lint_rules-r1
  exit_code: 0
  verified_at: 2026-11-01T03:20:57Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-check-cloud-sync-sellers-view-SUITE-node_scripts_check_portal_compliance_mjs-r1
  exit_code: 0
  verified_at: 2026-11-01T03:20:57Z

## Known limits

## Ngoài hợp đồng

## Analyst

none — mọi eval feature đều red trên baseline (có phân biệt). Riêng E3 là eval mới, baseline không đo.

Baseline khong do
- bash _acceptance/check-cloud-sync-sellers-view/probes/pham-vi.sh: bo qua baseline: tep _acceptance/check-cloud-sync-sellers-view/probes/pham-vi.sh co o cay dang kiem nhung chua co o merge-base 9479b0ef62f5f9826711e46fff529a97ad729bae — eval moi, chay tren code cu khong phan biet gi

## Variance

none — mọi eval chạy một lần, xác định; không có eval đa lượt.

## Iterations

Round 1: E1, E2b, E2c, E2d, E2e, E2f, E2g, E2h, E2i, E2j không chạy xong — Postgres mô phỏng hết chỗ trống đĩa (No space left on device), E2i còn thấy máy chủ vào chế độ phục hồi; E2a và E3 đạt. Lệnh suite `cd app && npm test` quá 30 phút chưa kết thúc nên verdict là BLOCKED. Cách xử lý: giải phóng đĩa rồi chạy lại các eval cloud-sync, và chạy lại suite app với timeout dài hơn.
