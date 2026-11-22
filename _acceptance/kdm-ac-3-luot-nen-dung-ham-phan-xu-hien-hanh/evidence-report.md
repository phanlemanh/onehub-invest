---
schema_version: 2
feature_slug: kdm-ac-3-luot-nen-dung-ham-phan-xu-hien-hanh
verdict: BLOCKED
failed_evals: []
reason: "E6c (node --test scripts/*.test.mjs): lenh dai CHUA XONG — tac tu dung cho o __CHUA_XONG, chua co dong __EXIT= (cuoi dau ra la ca RF-4 va chieu do tep boc, khong co dong tong ket). Khong phai loi code; chay lai voi tran thoi gian cong cu dai hon."
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 4d75ae0b2fd601cc9b468573992ff1e9eaa2fcae
human_signoff:
---

# Evidence Report: kdm-ac-3-luot-nen-dung-ham-phan-xu-hien-hanh

Round 2. Cac eval E1-E5 chay lai trong round nay; E7, E6a, E6b mang tu round 1 (delta khong cham paths cua chung); E6c bi chan vi lenh dai chua xong.

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | test | PASS |
| E2 | AC-2 | test | PASS |
| E3 | AC-3 | test | PASS |
| E4 | AC-4 | test | PASS |
| E5 | AC-5 | script | PASS |
| E7 | AC-7 | script | PASS (carry-forward round 1) |
| E6a | AC-6 | test | PASS (carry-forward round 1) |
| E6b | AC-6 | test | PASS (carry-forward round 1) |
| E6c | AC-6 | test | BLOCKED |

## Evidence

- eval: E1
  run_id: minted-kdm-ac-3-luot-nen-dung-ham-phan-xu-hien-hanh-E1-r2
  exit_code: 0
  baseline: green
  verifier: scripts/kiem-tin-rao-gan-khu-vuc.test.mjs
  verified_at: 2026-11-22T14:54:49Z
  output: |
    node --test --test-name-pattern=HT5-AC-1 scripts/kiem-tin-rao-gan-khu-vuc.test.mjs
    ℹ duration_ms 88.633917

- eval: E2
  run_id: minted-kdm-ac-3-luot-nen-dung-ham-phan-xu-hien-hanh-E2-r2
  exit_code: 0
  baseline: green
  verifier: scripts/kiem-tin-rao-gan-khu-vuc.test.mjs
  verified_at: 2026-11-22T14:54:49Z
  output: |
    node --test --test-name-pattern=HT5-AC-2 scripts/kiem-tin-rao-gan-khu-vuc.test.mjs
    ℹ duration_ms 66855.470291

- eval: E3
  run_id: minted-kdm-ac-3-luot-nen-dung-ham-phan-xu-hien-hanh-E3-r2
  exit_code: 0
  baseline: n-a
  verifier: scripts/kiem-tin-rao-gan-khu-vuc.test.mjs
  verified_at: 2026-11-22T14:54:49Z
  output: |
    node --test --test-name-pattern=KDM-AC-3 scripts/kiem-tin-rao-gan-khu-vuc.test.mjs
    ℹ duration_ms 1790458.72475

- eval: E4
  run_id: minted-kdm-ac-3-luot-nen-dung-ham-phan-xu-hien-hanh-E4-r2
  exit_code: 0
  baseline: green
  verifier: scripts/kiem-tin-rao-gan-khu-vuc.test.mjs
  verified_at: 2026-11-22T14:54:49Z
  output: |
    node --test --test-name-pattern=HT5-AC-3 scripts/kiem-tin-rao-gan-khu-vuc.test.mjs
    ℹ duration_ms 388856.915834

- eval: E5
  run_id: minted-kdm-ac-3-luot-nen-dung-ham-phan-xu-hien-hanh-E5-r2
  exit_code: 0
  baseline: red
  verifier: scripts/lib/ci-can-du-lieu.mjs
  verified_at: 2026-11-22T14:54:49Z
  output: |
    dong bo qua HT5-AC-3 co mat, khong dong bo qua HT5-AC-1/HT5-AC-2; ci-test-module.test.mjs
    ℹ duration_ms 21361.415916

- eval: E7
  run_id: minted-kdm-ac-3-luot-nen-dung-ham-phan-xu-hien-hanh-E7-r1
  exit_code: 0
  verifier: scripts/phat-bieu-cat-chuyen.mjs
  verified_at: 2026-11-22T13:41:33Z
  carried_from_round: 1
  note: carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E6a
  run_id: minted-kdm-ac-3-luot-nen-dung-ham-phan-xu-hien-hanh-E6a-r1
  exit_code: 0
  verifier: config:executors.suite.pipeline_a
  verified_at: 2026-11-22T13:41:33Z
  carried_from_round: 1
  note: carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E6b
  run_id: minted-kdm-ac-3-luot-nen-dung-ham-phan-xu-hien-hanh-E6b-r1
  exit_code: 0
  verifier: config:executors.suite.pipeline_b
  verified_at: 2026-11-22T13:41:33Z
  carried_from_round: 1
  note: carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E6c
  run_id: minted-kdm-ac-3-luot-nen-dung-ham-phan-xu-hien-hanh-E6c-r2
  verifier: config:executors.test.scripts
  status: BLOCKED (cannotRun) — lenh dai chua xong, dau ra dung o __CHUA_XONG, khong co dong tong ket
  output: |
    ✔ RF-4 mọi nhãn bước tệp bọc truyền vào đều không chứa khoảng trắng (255.437625ms)
    ✔ chiều đỏ tệp bọc: bản đột biến làm đúng ca tương ứng đỏ (1591.108333ms)
    __CHUA_XONG

### Lệnh suite (hồi quy)

- cmd: node scripts/suite-neu-doi.mjs agent -- 'cd agent && npm test'
  run_id: minted-kdm-ac-3-luot-nen-dung-ham-phan-xu-hien-hanh-SUITE-node_scripts_suite_neu_doi_mjs_agent_cd_-r2
  exit_code: 0
  verified_at: 2026-11-22T14:54:49Z

- cmd: node scripts/suite-neu-doi.mjs app -- 'cd app && npx tsc --noEmit && npm run lint'
  run_id: minted-kdm-ac-3-luot-nen-dung-ham-phan-xu-hien-hanh-SUITE-lint-r2
  exit_code: 0
  verified_at: 2026-11-22T14:54:49Z

- cmd: node scripts/suite-neu-doi.mjs app_ui -- 'cd app && npm test'
  run_id: minted-kdm-ac-3-luot-nen-dung-ham-phan-xu-hien-hanh-SUITE-node_scripts_suite_neu_doi_mjs_app_ui_cd-r2
  exit_code: 0
  verified_at: 2026-11-22T14:54:49Z

- cmd: node scripts/suite-neu-doi.mjs pipeline_a -- 'cd pipeline && npm run test:a'
  run_id: minted-kdm-ac-3-luot-nen-dung-ham-phan-xu-hien-hanh-SUITE-test_a-r2
  exit_code: 0
  verified_at: 2026-11-22T14:54:49Z

- cmd: node scripts/suite-neu-doi.mjs pipeline_b -- 'cd pipeline && npm run test:b'
  run_id: minted-kdm-ac-3-luot-nen-dung-ham-phan-xu-hien-hanh-SUITE-test_b-r2
  exit_code: 0
  verified_at: 2026-11-22T14:54:49Z

- cmd: node scripts/suite-neu-doi.mjs ui_lint_rules -- 'cd app && npm run test:lint-rules'
  run_id: minted-kdm-ac-3-luot-nen-dung-ham-phan-xu-hien-hanh-SUITE-test_lint_rules-r2
  exit_code: 0
  verified_at: 2026-11-22T14:54:49Z

- cmd: node scripts/suite-neu-doi.mjs portal_static -- 'node scripts/check-portal-compliance.mjs'
  run_id: minted-kdm-ac-3-luot-nen-dung-ham-phan-xu-hien-hanh-SUITE-node_scripts_suite_neu_doi_mjs_portal_st-r2
  exit_code: 0
  verified_at: 2026-11-22T14:54:49Z

## Known limits

## Ngoài hợp đồng

## Analyst

Eval khong-phan-biet (pass tren ca HEAD lan baseline; kiem tra regression-guard co chu y hay can viet lai de assert hanh vi moi):
- E1 (node --test --test-name-pattern=HT5-AC-1 scripts/kiem-tin-rao-gan-khu-vuc.test.mjs): baseline green
- E2 (node --test --test-name-pattern=HT5-AC-2 scripts/kiem-tin-rao-gan-khu-vuc.test.mjs): baseline green
- E4 (node --test --test-name-pattern=HT5-AC-3 scripts/kiem-tin-rao-gan-khu-vuc.test.mjs): baseline green

Baseline khong do
- node --test --test-name-pattern=KDM-AC-3 scripts/kiem-tin-rao-gan-khu-vuc.test.mjs: baseline vuot tran 180 giay/lenh — da dung ca cay tien trinh; BLOCKED ha tang, khong phai ket qua cua code cu
- node --test scripts/*.test.mjs: baseline vuot tran 180 giay/lenh — da dung ca cay tien trinh; BLOCKED ha tang, khong phai ket qua cua code cu

## Variance

none — moi eval nhieu lan chay deu dong nhat (moi eval chay 1 lan, deterministic)

## Iterations

Round 1: E7, E6a, E6b dat; cac eval con lai chay lai o round 2 do delta cham paths cua chung.
Round 2: E1-E5 dat; E6c BLOCKED — lenh node --test scripts/*.test.mjs chua xong trong tran thoi gian cong cu (khong co dong tong ket), can chay lai voi tran dai hon.
