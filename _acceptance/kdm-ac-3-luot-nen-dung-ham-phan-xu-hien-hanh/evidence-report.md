---
schema_version: 2
feature_slug: kdm-ac-3-luot-nen-dung-ham-phan-xu-hien-hanh
verdict: BLOCKED
failed_evals: []
reason: "Lệnh `node scripts/suite-neu-doi.mjs pipeline_a -- 'cd pipeline && npm run test:a'` chạy đúng nguyên văn trong thư mục đã ghim (kdm-ac-3-luot-nen) nhưng quá 600s thì bị chuyển sang nền (ID b5lmneqds), không bị công cụ giết. Theo dõi bằng nhiều lượt chờ tối đa ~80s, tổng khoảng 30 phút, vẫn chưa thấy dòng __EXIT=. Tiến trình suite-neu-doi vẫn đang chạy. Chưa có kết quả đạt hay hỏng nên không kết luận được. Trần thời gian mặc định 30 phút đã vượt (không đọc được long_running trong evals.yaml vì không nằm trong phạm vi lệnh này). Chưa chạy lại để tránh chạy song song; cần người điều phối quyết định chờ thêm hay dừng tác vụ b5lmneqds."
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: b9aeeabaef03b41d6318d7f79735bd0eee42afb1
human_signoff:
---

# Evidence Report: kdm-ac-3-luot-nen-dung-ham-phan-xu-hien-hanh

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | test | PASS (carry-forward từ round 1) |
| E2 | AC-2 | test | PASS (carry-forward từ round 1) |
| E3 | AC-3 | test | PASS |
| E4 | AC-4 | test | PASS (carry-forward từ round 1) |
| E5 | AC-5 | script | PASS (carry-forward từ round 1) |
| E7 | AC-7 | script | PASS (carry-forward từ round 1) |
| E6a | AC-6 | test | PASS (carry-forward từ round 1) |
| E6b | AC-6 | test | PASS (carry-forward từ round 1) |
| E6c | AC-6 | test | PASS |

Vòng này BLOCKED vì một lệnh suite (nửa A của pipeline) chưa ra kết quả trong trần thời gian. Tất cả eval còn lại ở bảng trên không có eval nào hỏng.

## Evidence

- eval: E3
  run_id: minted-kdm-ac-3-luot-nen-dung-ham-phan-xu-hien-hanh-E3-r2
  exit_code: 0
  baseline: n-a
  verifier: scripts/kiem-tin-rao-gan-khu-vuc.test.mjs
  verified_at: 2026-11-22T15:58:38Z
  output: |
    node --test --test-name-pattern=KDM-AC-3 scripts/kiem-tin-rao-gan-khu-vuc.test.mjs
    ℹ duration_ms 1765867.39725
    __EXIT=0

- eval: E6c
  run_id: minted-kdm-ac-3-luot-nen-dung-ham-phan-xu-hien-hanh-E6c-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.scripts
  verified_at: 2026-11-22T15:58:38Z
  output: |
    node --test scripts/*.test.mjs
    ℹ duration_ms 1946635.454
    __EXIT=0

- eval: E1
  run_id: minted-kdm-ac-3-luot-nen-dung-ham-phan-xu-hien-hanh-E1-r1
  exit_code: 0
  verifier: scripts/kiem-tin-rao-gan-khu-vuc.test.mjs
  verified_at: 2026-11-22T13:41:33Z
  carried_from_round: 1
  output: |
    carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E2
  run_id: minted-kdm-ac-3-luot-nen-dung-ham-phan-xu-hien-hanh-E2-r1
  exit_code: 0
  verifier: scripts/kiem-tin-rao-gan-khu-vuc.test.mjs
  verified_at: 2026-11-22T13:41:33Z
  carried_from_round: 1
  output: |
    carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E4
  run_id: minted-kdm-ac-3-luot-nen-dung-ham-phan-xu-hien-hanh-E4-r1
  exit_code: 0
  verifier: scripts/kiem-tin-rao-gan-khu-vuc.test.mjs
  verified_at: 2026-11-22T13:41:33Z
  carried_from_round: 1
  output: |
    carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E5
  run_id: minted-kdm-ac-3-luot-nen-dung-ham-phan-xu-hien-hanh-E5-r1
  exit_code: 0
  verifier: scripts/ci-test-module.test.mjs
  verified_at: 2026-11-22T13:41:33Z
  carried_from_round: 1
  output: |
    carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E7
  run_id: minted-kdm-ac-3-luot-nen-dung-ham-phan-xu-hien-hanh-E7-r1
  exit_code: 0
  verifier: _acceptance/kdm-ac-3-luot-nen-dung-ham-phan-xu-hien-hanh/probes/so-cat-chuyen.mjs
  verified_at: 2026-11-22T13:41:33Z
  carried_from_round: 1
  output: |
    carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E6a
  run_id: minted-kdm-ac-3-luot-nen-dung-ham-phan-xu-hien-hanh-E6a-r1
  exit_code: 0
  verifier: config:executors.suite.pipeline_a
  verified_at: 2026-11-22T13:41:33Z
  carried_from_round: 1
  output: |
    carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E6b
  run_id: minted-kdm-ac-3-luot-nen-dung-ham-phan-xu-hien-hanh-E6b-r1
  exit_code: 0
  verifier: config:executors.suite.pipeline_b
  verified_at: 2026-11-22T13:41:33Z
  carried_from_round: 1
  output: |
    carry-forward tu round 1 — delta khong cham paths cua eval

### Lệnh suite (hồi quy)

- cmd: node scripts/suite-neu-doi.mjs agent -- 'cd agent && npm test'
  run_id: minted-kdm-ac-3-luot-nen-dung-ham-phan-xu-hien-hanh-SUITE-node_scripts_suite_neu_doi_mjs_agent_cd_-r2
  exit_code: 0
  verified_at: 2026-11-22T15:58:38Z

- cmd: node scripts/suite-neu-doi.mjs app -- 'cd app && npx tsc --noEmit && npm run lint'
  run_id: minted-kdm-ac-3-luot-nen-dung-ham-phan-xu-hien-hanh-SUITE-lint-r2
  exit_code: 0
  verified_at: 2026-11-22T15:58:38Z

- cmd: node scripts/suite-neu-doi.mjs app_ui -- 'cd app && npm test'
  run_id: minted-kdm-ac-3-luot-nen-dung-ham-phan-xu-hien-hanh-SUITE-node_scripts_suite_neu_doi_mjs_app_ui_cd-r2
  exit_code: 0
  verified_at: 2026-11-22T15:58:38Z

- cmd: node scripts/suite-neu-doi.mjs pipeline_a -- 'cd pipeline && npm run test:a'
  run_id: b5lmneqds
  ket_qua: CHƯA CÓ — lệnh còn chạy nền sau khoảng 30 phút, chưa thấy dòng kết thúc; đây là lý do verdict BLOCKED
  verified_at: 2026-11-22T15:58:38Z

- cmd: node scripts/suite-neu-doi.mjs pipeline_b -- 'cd pipeline && npm run test:b'
  run_id: minted-kdm-ac-3-luot-nen-dung-ham-phan-xu-hien-hanh-SUITE-test_b-r2
  exit_code: 0
  verified_at: 2026-11-22T15:58:38Z

- cmd: node scripts/suite-neu-doi.mjs ui_lint_rules -- 'cd app && npm run test:lint-rules'
  run_id: minted-kdm-ac-3-luot-nen-dung-ham-phan-xu-hien-hanh-SUITE-test_lint_rules-r2
  exit_code: 0
  verified_at: 2026-11-22T15:58:38Z

- cmd: node scripts/suite-neu-doi.mjs portal_static -- 'node scripts/check-portal-compliance.mjs'
  run_id: minted-kdm-ac-3-luot-nen-dung-ham-phan-xu-hien-hanh-SUITE-node_scripts_suite_neu_doi_mjs_portal_st-r2
  exit_code: 0
  verified_at: 2026-11-22T15:58:38Z

## Known limits

## Ngoài hợp đồng

## Analyst

none — không eval nào được đo là xanh ở cả hai phía. Hai eval chạy vòng này (E3, E6c) không đo được baseline.

Baseline không đo:
- node --test --test-name-pattern=KDM-AC-3 scripts/kiem-tin-rao-gan-khu-vuc.test.mjs: baseline vuot tran 180 giay/lenh — da dung ca cay tien trinh; BLOCKED ha tang, khong phai ket qua cua code cu
- node --test scripts/*.test.mjs: baseline vuot tran 180 giay/lenh — da dung ca cay tien trinh; BLOCKED ha tang, khong phai ket qua cua code cu

## Variance

none — every multi-run eval is uniform

## Iterations

Round 1: các eval E1, E2, E4, E5, E6a, E6b, E7 đạt; hợp đồng vào trạng thái đã chạy lần đầu.
Round 2: E3 và E6c chạy lại và đạt; E1, E2, E4, E5, E7, E6a, E6b giữ nguyên từ round 1. BLOCKED vì lệnh suite pipeline_a (ID b5lmneqds) chưa ra kết quả sau khoảng 30 phút; cần người điều phối quyết định chờ thêm hay dừng rồi chạy lại với trần dài hơn.
