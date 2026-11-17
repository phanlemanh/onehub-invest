---
schema_version: 2
feature_slug: s4-suite-theo-vung
verdict: PASS
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 89a7476de537a429fa0ef36c2f42564f3469407e
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
| E7 | AC-7 | test | PASS (carry-forward tu round 3) |
| E8 | AC-8 | test | PASS |

## Evidence

- eval: E1
  run_id: minted-s4-suite-theo-vung-E1-r4
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.s4v_bo_qua
  verified_at: 2026-11-16T22:29:26Z
  output: |
    node --test --test-name-pattern=S4V-AC-1 scripts/suite-neu-doi.test.mjs
    duration_ms 2016.411333

- eval: E2
  run_id: minted-s4-suite-theo-vung-E2-r4
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.s4v_chay
  verified_at: 2026-11-16T22:29:26Z
  output: |
    node --test --test-name-pattern=S4V-AC-2 scripts/suite-neu-doi.test.mjs
    duration_ms 5209.450625

- eval: E3
  run_id: minted-s4-suite-theo-vung-E3-r4
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.s4v_keo
  verified_at: 2026-11-16T22:29:26Z
  output: |
    node --test --test-name-pattern=S4V-AC-3 scripts/suite-neu-doi.test.mjs
    duration_ms 42.260583

- eval: E4
  run_id: minted-s4-suite-theo-vung-E4-r4
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.s4v_bao_thu
  verified_at: 2026-11-16T22:29:26Z
  output: |
    node --test --test-name-pattern=S4V-AC-4 scripts/suite-neu-doi.test.mjs
    duration_ms 2988.09825

- eval: E5
  run_id: minted-s4-suite-theo-vung-E5-r4
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.s4v_phu
  verified_at: 2026-11-16T22:29:26Z
  output: |
    node --test --test-name-pattern=S4V-AC-5 scripts/suite-neu-doi.test.mjs
    duration_ms 909.681541

- eval: E6
  run_id: minted-s4-suite-theo-vung-E6-r4
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.s4v_cau_hinh
  verified_at: 2026-11-16T22:29:26Z
  output: |
    cau-hinh: xanh — chỉ suite_keys đổi; tám lệnh cũ (bảy suite bọc + pipeline) nguyên byte (gốc ac6cb449fcfed4eefab4f9ec0a190fd61a490d97)

- eval: E7
  run_id: minted-s4-suite-theo-vung-E7-r3
  exit_code: 0
  verifier: config:executors.test.s4v_dung_wt
  verified_at: 2026-11-16T14:05:02Z
  carried_from_round: 3
  # carry-forward tu round 3 — delta khong cham paths cua eval

- eval: E8
  run_id: minted-s4-suite-theo-vung-E8-r4
  exit_code: 0
  baseline: red
  verifier: config:executors.test.scripts
  verified_at: 2026-11-16T22:29:26Z
  output: |
    node --test scripts/*.test.mjs
    duration_ms 1091421.315

### Lệnh suite (hồi quy)

- cmd: node scripts/suite-neu-doi.mjs agent -- 'cd agent && npm test'
  run_id: minted-s4-suite-theo-vung-SUITE-node_scripts_suite_neu_doi_mjs_agent_cd_-r4
  exit_code: 0
  verified_at: 2026-11-16T22:29:26Z

- cmd: node scripts/suite-neu-doi.mjs app -- 'cd app && npx tsc --noEmit && npm run lint'
  run_id: minted-s4-suite-theo-vung-SUITE-lint-r4
  exit_code: 0
  verified_at: 2026-11-16T22:29:26Z

- cmd: node scripts/suite-neu-doi.mjs app_ui -- 'cd app && npm test'
  run_id: minted-s4-suite-theo-vung-SUITE-node_scripts_suite_neu_doi_mjs_app_ui_cd-r4
  exit_code: 0
  verified_at: 2026-11-16T22:29:26Z

- cmd: node scripts/suite-neu-doi.mjs pipeline_a -- 'cd pipeline && npm run test:a'
  run_id: minted-s4-suite-theo-vung-SUITE-test_a-r4
  exit_code: 0
  verified_at: 2026-11-16T22:29:26Z

- cmd: node scripts/suite-neu-doi.mjs pipeline_b -- 'cd pipeline && npm run test:b'
  run_id: minted-s4-suite-theo-vung-SUITE-test_b-r4
  exit_code: 0
  verified_at: 2026-11-16T22:29:26Z

- cmd: node scripts/suite-neu-doi.mjs ui_lint_rules -- 'cd app && npm run test:lint-rules'
  run_id: minted-s4-suite-theo-vung-SUITE-test_lint_rules-r4
  exit_code: 0
  verified_at: 2026-11-16T22:29:26Z

- cmd: node scripts/suite-neu-doi.mjs portal_static -- 'node scripts/check-portal-compliance.mjs'
  run_id: minted-s4-suite-theo-vung-SUITE-node_scripts_suite_neu_doi_mjs_portal_st-r4
  exit_code: 0
  verified_at: 2026-11-16T22:29:26Z

## Known limits

## Ngoài hợp đồng

## Analyst

none — moi eval feature deu red tren baseline (co phan biet)

Ghi chu: E8 la hoi quy (red tren baseline). E1-E6 la eval moi, khong do duoc baseline.

Baseline khong do:
- node --test --test-name-pattern=S4V-AC-1 scripts/suite-neu-doi.test.mjs: bo qua baseline: tep scripts/suite-neu-doi.test.mjs co o cay dang kiem nhung chua co o merge-base ac6cb449fcfed4eefab4f9ec0a190fd61a490d97 — eval moi, chay tren code cu khong phan biet gi
- node --test --test-name-pattern=S4V-AC-2 scripts/suite-neu-doi.test.mjs: bo qua baseline: tep scripts/suite-neu-doi.test.mjs co o cay dang kiem nhung chua co o merge-base ac6cb449fcfed4eefab4f9ec0a190fd61a490d97 — eval moi, chay tren code cu khong phan biet gi
- node --test --test-name-pattern=S4V-AC-3 scripts/suite-neu-doi.test.mjs: bo qua baseline: tep scripts/suite-neu-doi.test.mjs co o cay dang kiem nhung chua co o merge-base ac6cb449fcfed4eefab4f9ec0a190fd61a490d97 — eval moi, chay tren code cu khong phan biet gi
- node --test --test-name-pattern=S4V-AC-4 scripts/suite-neu-doi.test.mjs: bo qua baseline: tep scripts/suite-neu-doi.test.mjs co o cay dang kiem nhung chua co o merge-base ac6cb449fcfed4eefab4f9ec0a190fd61a490d97 — eval moi, chay tren code cu khong phan biet gi
- node --test --test-name-pattern=S4V-AC-5 scripts/suite-neu-doi.test.mjs: bo qua baseline: tep scripts/suite-neu-doi.test.mjs co o cay dang kiem nhung chua co o merge-base ac6cb449fcfed4eefab4f9ec0a190fd61a490d97 — eval moi, chay tren code cu khong phan biet gi
- node --test --test-name-pattern=S4V-AC-6 scripts/suite-neu-doi.test.mjs && bash _acceptance/s4-suite-theo-vung/probes/cau-hinh-khong-doi.sh: bo qua baseline: tep scripts/suite-neu-doi.test.mjs co o cay dang kiem nhung chua co o merge-base ac6cb449fcfed4eefab4f9ec0a190fd61a490d97 — eval moi, chay tren code cu khong phan biet gi

## Variance

none — every multi-run eval is uniform

## Iterations

Round 3: PASS — gói bằng chứng máy viết; E7 chốt ở vòng này.
Round 4: PASS — sau khi nhận main, vùng agent thêm app/probes; E1-E6 và E8 chạy lại, E7 carry-forward từ round 3 vì delta không chạm paths của eval; không có judgment item.

### Re-pin lần 1 — 2026-11-17, do nhận main 734665b5 (#471 đổi scripts/) sau vòng 4 PASS
run_id: repin-20261117T033744Z-54929
sha: 89a7476de537a429fa0ef36c2f42564f3469407e · suites: 7 lệnh exit 0 · evals: 8/8 eval máy đạt kỳ vọng
