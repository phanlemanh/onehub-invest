---
schema_version: 2
feature_slug: s4-suite-theo-vung
verdict: REJECT
failed_evals: ["E8"]
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: add94244c206bc7b558e4a3887d822f7e0078dcb
human_signoff:
---

# Evidence Report: s4-suite-theo-vung

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | test | PASS |
| E2 | AC-2 | test | PASS |
| E3 | AC-3 | test | PASS |
| E4 | AC-4 | test | PASS |
| E5 | AC-5 | test | PASS |
| E6 | AC-6 | test | PASS |
| E7 | AC-7 | test | PASS (carried từ round 1) |
| E8 | AC-8 | test | FAIL |

## Evidence

- eval: E1
  run_id: minted-s4-suite-theo-vung-E1-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.s4v_bo_qua
  verified_at: 2026-11-10T18:51:15Z
  output: |
    ℹ duration_ms 2634.206542

- eval: E2
  run_id: minted-s4-suite-theo-vung-E2-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.s4v_chay
  verified_at: 2026-11-10T18:51:15Z
  output: |
    ℹ duration_ms 5060.859916

- eval: E3
  run_id: minted-s4-suite-theo-vung-E3-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.s4v_keo
  verified_at: 2026-11-10T18:51:15Z
  output: |
    ℹ duration_ms 59.6145

- eval: E4
  run_id: minted-s4-suite-theo-vung-E4-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.s4v_bao_thu
  verified_at: 2026-11-10T18:51:15Z
  output: |
    ℹ duration_ms 3430.13475

- eval: E5
  run_id: minted-s4-suite-theo-vung-E5-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.s4v_phu
  verified_at: 2026-11-10T18:51:15Z
  output: |
    ℹ duration_ms 1043.372875

- eval: E6
  run_id: minted-s4-suite-theo-vung-E6-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.s4v_cau_hinh
  verified_at: 2026-11-10T18:51:15Z
  output: |
    cau-hinh: xanh — chỉ suite_keys đổi; sáu lệnh cũ nguyên byte (gốc 490d7309392760cc8a63e63c036e0555e96f4bee)

- eval: E7
  run_id: minted-s4-suite-theo-vung-E7-r1
  exit_code: 0
  verifier: config:executors.test.s4v_dung_wt
  verified_at: 2026-11-10T18:04:13Z
  carried_from_round: 1
  # carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E8
  run_id: minted-s4-suite-theo-vung-E8-r2
  exit_code: 1
  baseline: n-a
  verifier: config:executors.test.scripts
  verified_at: 2026-11-10T18:51:15Z
  output: |
    kiem-tin-rao-gan-khu-vuc.test.mjs: kiem-tin-rao-gan: FAIL (1)
    FAIL 90 + 0 tin trỏ khu vực không hợp lệ hay khu vực mồi
    assert strictEqual: actual 1, expected 0 (kiem-tin-rao-gan-khu-vuc.test.mjs:24)

### Lệnh suite (hồi quy)

- cmd: node scripts/suite-neu-doi.mjs agent -- 'cd agent && npm test'
  run_id: minted-s4-suite-theo-vung-SUITE-node_scripts_suite_neu_doi_mjs_agent_cd_-r2
  exit_code: 0
  verified_at: 2026-11-10T18:51:15Z

- cmd: node scripts/suite-neu-doi.mjs app -- 'cd app && npx tsc --noEmit && npm run lint'
  run_id: minted-s4-suite-theo-vung-SUITE-lint-r2
  exit_code: 0
  verified_at: 2026-11-10T18:51:15Z

- cmd: node scripts/suite-neu-doi.mjs app_ui -- 'cd app && npm test'
  run_id: minted-s4-suite-theo-vung-SUITE-node_scripts_suite_neu_doi_mjs_app_ui_cd-r2
  exit_code: 0
  verified_at: 2026-11-10T18:51:15Z

- cmd: node scripts/suite-neu-doi.mjs pipeline -- 'cd pipeline && npm test'
  run_id: minted-s4-suite-theo-vung-SUITE-node_scripts_suite_neu_doi_mjs_pipeline_-r2
  exit_code: 0
  verified_at: 2026-11-10T18:51:15Z

- cmd: node scripts/suite-neu-doi.mjs ui_lint_rules -- 'cd app && npm run test:lint-rules'
  run_id: minted-s4-suite-theo-vung-SUITE-test_lint_rules-r2
  exit_code: 0
  verified_at: 2026-11-10T18:51:15Z

- cmd: node scripts/suite-neu-doi.mjs portal_static -- 'node scripts/check-portal-compliance.mjs'
  run_id: minted-s4-suite-theo-vung-SUITE-node_scripts_suite_neu_doi_mjs_portal_st-r2
  exit_code: 0
  verified_at: 2026-11-10T18:51:15Z

Lệnh fail không gắn eval riêng: `node --test scripts/*.test.mjs` (gắn E8) thoát khác 0 — nguyên nhân là ca kiem-tin-rao-gan-khu-vuc.test.mjs, thước báo đỏ 90 tin trỏ khu vực không hợp lệ hay khu vực mồi trên DB local; không thuộc vùng đổi của feature này.

## Known limits

## Ngoài hợp đồng

## Analyst

carried tu round 1 — baseline khong do lai round nay.

Không có eval không-phân-biệt được liệt kê. Baseline các eval ghi n-a (round này không đo).

## Variance

none — mọi eval deterministic, không có eval chạy nhiều lần.

## Iterations

Round 1: REJECT — hồ sơ vòng 1 (xem commit add94244); đã sửa vùng portal_static và phép quét AC-5 (S4 r1 t1, t2).
Round 2: E8 failed — `node --test scripts/*.test.mjs` đỏ ở ca kiem-tin-rao-gan-khu-vuc (thước báo 90 tin trỏ khu vực không hợp lệ). E1–E6 xanh, E7 carried từ round 1. Returned to implementation.
