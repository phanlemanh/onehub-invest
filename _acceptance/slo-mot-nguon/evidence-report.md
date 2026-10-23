---
schema_version: 2
feature_slug: slo-mot-nguon
verdict: PASS
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 4b2d81bba24e34a5b569f1dd196e102ba8db9c7e
human_signoff:
---

# Evidence Report: slo-mot-nguon

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | test | PASS |
| E2 | AC-2 | test | PASS |
| E3 | AC-3 | test | PASS |
| E4 | AC-4 | test | PASS |
| E5 | AC-5 | test | PASS |
| E6 | AC-6 | test | PASS |
| E7 | AC-7 | test | PASS |
| E8 | AC-8 | judgment | PASS |
| E9 | AC-9 | test | PASS |

## Evidence

- eval: E1
  run_id: minted-slo-mot-nguon-E1-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.test.scripts
  verified_at: 2026-10-23T22:23:49Z
  output: |
    Lệnh: node --test scripts/*.test.mjs
    Các ca 'SL-AC-1 hằng + SQL hai bản bằng nhau', 'SL-AC-1 readFreshness hai bản ra cùng hàng trên client giả (ma trận 5 mã × 3 + mã không SLO)' và chiều đỏ 'SL-AC-1 bản sao TS đổi SLO S03 → ca đỏ nêu S03' đều ok.

- eval: E2
  run_id: minted-slo-mot-nguon-E2-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.test.app_ui
  verified_at: 2026-10-23T22:23:49Z
  output: |
    Lệnh: cd app && npm test
    Ca 'SL-AC-2 getCoverageOverview khớp readFreshness trên lược đồ tạm' và chiều đỏ 'SL-AC-2 bản nạp lại collected_at cũ vẫn quá hạn' ok.
    ℹ duration_ms 838.193875

- eval: E3
  run_id: minted-slo-mot-nguon-E3-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.test.app_ui
  verified_at: 2026-10-23T22:23:49Z
  output: |
    Lệnh: cd app && npm test
    Ca 'SL-AC-3 getSourceFeedHealth: tuổi lớn nhất theo thành phố, Trễ SLO, Chưa có dữ liệu thay Ổn, Chưa khai SLO ngoài y, S04 Ngừng, thấy thành phố canh' ok.
    ℹ duration_ms 838.193875

- eval: E4
  run_id: minted-slo-mot-nguon-E4-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.test.app_ui
  verified_at: 2026-10-23T22:23:49Z
  output: |
    Lệnh: cd app && npm test
    Ca 'SL-AC-4 summarizeFreshness ma trận 5 ca, hai trang cùng {x,y}' ok.
    ℹ duration_ms 838.193875

- eval: E5
  run_id: minted-slo-mot-nguon-E5-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.test.app_ui
  verified_at: 2026-10-23T22:23:49Z
  output: |
    Lệnh: cd app && npm test
    Ca 'SL-AC-5 trọn trang /ops và trọn CollectionsView mang cùng data-slo-summary ở ô và đầu trang' và chiều đỏ 'SL-AC-5 S01 quá hạn một thành phố → hai ô cùng giảm 1' ok.
    ℹ duration_ms 838.193875

- eval: E6
  run_id: minted-slo-mot-nguon-E6-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.test.app_ui
  verified_at: 2026-10-23T22:23:49Z
  output: |
    Lệnh: cd app && npm test
    Ca 'SL-AC-6 fmtAge 12/72/840 giờ → 12 giờ/3 ngày/35 ngày, hai trang cùng chữ' ok.
    ℹ duration_ms 838.193875

- eval: E7
  run_id: minted-slo-mot-nguon-E7-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.test.app_ui
  verified_at: 2026-10-23T22:23:49Z
  output: |
    Lệnh: cd app && npm test
    Ca 'SL-AC-7 /api/v1/ops/coverage trả hàng /ops kèm ageHours/sloHours, giữ ageDays/sloDays' ok.
    ℹ duration_ms 838.193875

- eval: E8
  judged_by: judge panel (3 lens, fresh context): domain-correctness, operational-feasibility, spec-alignment
  verdict: PASS
  rationale: Mục 1 của SKILL.md nói đủ ba ý của AC-8 - hai trang /ops và /ops/collections dùng cùng định nghĩa từng ô nguồn × thành phố với CLI (app/src/lib/freshness.ts giữ khớp scripts/lib/freshness.mjs bằng scripts/freshness-parity.test.mjs), «x/y nguồn đạt SLO» chỉ hiện trên hai trang còn CLI không in x/y, và một nguồn đạt khi mọi thành phố có dữ liệu của nó đạt. Các mốc SLO (S05 12 giờ, S03 3 ngày, S02 35 ngày) khớp contract và không đụng Out of scope. Lưu ý nhỏ từ lens domain-correctness - câu «ô nào CLI báo lỗi thì trên trang nguồn đó không đạt» hơi gọn với nguồn chưa khai SLO (trang không đếm nguồn đó), nhưng không mâu thuẫn contract.
  votes:
    - domain-correctness: PASS - ba ý của AC-8 đủ, các con số SLO khớp contract, chỉ ghi chú câu về ô CLI báo lỗi hơi gọn với nguồn chưa khai SLO.
    - operational-feasibility: PASS - mục 1 (dòng 16-20) đủ ba ý, các câu về y và mốc SLO khớp AC-2, AC-3, AC-4, AC-6, Out of scope (cloud, đổi số SLO) không bị đụng.
    - spec-alignment: PASS - định nghĩa x/y khớp AC-3 và AC-4, SKILL.md không nhắc điều gì nằm trong Out of scope.
  human_override:  # chi nguoi ghi

- eval: E9
  run_id: minted-slo-mot-nguon-E9-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.test.app_ui
  verified_at: 2026-10-23T22:23:49Z
  output: |
    Lệnh: cd app && npm test
    Ca 'SL-AC-9 lược đồ bảng thô 0 dòng như cloud → không lỗi, mảng rỗng, 0/0 Chưa có nguồn nào' và chiều đỏ 'SL-AC-9 một mã active, bảng nạp rỗng → Chưa có dữ liệu, không lỗi' ok.
    ℹ duration_ms 838.193875

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-slo-mot-nguon-SUITE-npm_test__bb6271-r1
  exit_code: 0
  verified_at: 2026-10-23T22:23:49Z

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-slo-mot-nguon-SUITE-lint-r1
  exit_code: 0
  verified_at: 2026-10-23T22:23:49Z

- cmd: cd pipeline && npm test
  run_id: minted-slo-mot-nguon-SUITE-npm_test__13563d-r1
  exit_code: 0
  verified_at: 2026-10-23T22:23:49Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-slo-mot-nguon-SUITE-test_lint_rules-r1
  exit_code: 0
  verified_at: 2026-10-23T22:23:49Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-slo-mot-nguon-SUITE-node_scripts_check_portal_compliance_mjs-r1
  exit_code: 0
  verified_at: 2026-10-23T22:23:49Z

## Known limits

## Ngoài hợp đồng

## Analyst

Baseline không đo: không có.

Eval không phân biệt (xanh trên cả HEAD lẫn baseline, chứng minh harness chứ chưa chắc chứng minh feature; nên viết lại để assert hành vi mới hoặc xác nhận là regression-guard có chủ ý):

- lệnh `node --test scripts/*.test.mjs` phủ E1 (baseline: green)
- lệnh `cd app && npm test` phủ E2, E3, E4, E5, E6, E7, E9 (baseline: green)

Các lệnh suite còn lại xanh ở cả hai phía là regression-guard bình thường, không liệt kê.

## Variance

none — mọi eval chạy một lần, deterministic, không có eval nào ngẫu nhiên hay flaky.

## Iterations

Round 1: E1-E9 đều đạt (E8 do hội đồng judge chấm PASS), năm lệnh suite hồi quy xanh; không có eval fail.
