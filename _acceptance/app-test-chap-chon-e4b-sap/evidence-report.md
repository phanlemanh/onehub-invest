---
schema_version: 2
feature_slug: app-test-chap-chon-e4b-sap
verdict: REJECT
failed_evals: ["E2"]
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: cc30a9d7fbb2f984621e3d637eac9a735d86e6b3
human_signoff:
---

# Evidence Report: app-test-chap-chon-e4b-sap

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | test | PASS |
| E2 | AC-2 | test | FAIL |
| E3 | AC-2 | test | PASS |
| E4 | AC-2 | test | PASS |
| E5 | AC-3 | judgment | PASS (đề xuất của hội đồng, chờ người xác nhận) |

## Evidence

- eval: E1
  run_id: minted-app-test-chap-chon-e4b-sap-E1-r3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.app_ui
  verified_at: 2026-11-11T02:21:44Z
  output: |
    cd app && npm test
    ℹ duration_ms 830226.150541

- eval: E2
  run_id: minted-app-test-chap-chon-e4b-sap-E2-r3
  exit_code: 1
  baseline: n-a
  verifier: config:executors.test.tir_doi_chieu
  verified_at: 2026-11-11T02:21:44Z
  output: |
    cd app && node --import tsx --test tests/tin-rao-doi-chieu.test.tsx
    E4B-AC-4: 20 tổ hợp · 80 khẳng định · 28 dòng mang cờ nhiều tên
    ✔ E4B-AC-4 cùng kết quả như bản trước vòng ở 20 tổ hợp viết trước; bản phá đếm trong trang đỏ LECH CAU CU
    E4B-AC-3 vn-hcmc sale newest: cũ 862 ms · mới 450 ms
    E4B-AC-3 vn-hcmc sale price-asc: cũ 854 ms · mới 478 ms
    E4B-AC-3 vn-hcmc sale price-desc: cũ 1620 ms · mới 791 ms
    E4B-AC-3 vn-hcmc sale perm2-asc: cũ 951 ms · mới 347 ms
    ✖ E4B-AC-3 biên: mỗi sort bản mới dưới 700 ms, đo xen kẽ với bản trước vòng
    ✔ E4B-AC-7 khối đo thời gian của E4b giống hệt bản trước vòng; bản phá đổi trần đỏ TRAN BI NOI
    ℹ tests 4 · pass 3 · fail 1
    AssertionError: actual ['BIEN price-desc 791 ms'], expected []

- eval: E3
  run_id: minted-app-test-chap-chon-e4b-sap-E3-r3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.can_gia_tot_doi_chieu
  verified_at: 2026-11-11T02:21:44Z
  output: |
    cd app && node --import tsx --test tests/can-gia-tot-doi-chieu.test.tsx
    ℹ duration_ms 1006351.846625

- eval: E4
  run_id: minted-app-test-chap-chon-e4b-sap-E4-r3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.app_ui
  verified_at: 2026-11-11T02:21:44Z
  output: |
    cd app && npm test
    ℹ duration_ms 830226.150541

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-app-test-chap-chon-e4b-sap-SUITE-npm_test__bb6271-r3
  exit_code: 0
  verified_at: 2026-11-11T02:21:44Z

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-app-test-chap-chon-e4b-sap-SUITE-lint-r3
  exit_code: 0
  verified_at: 2026-11-11T02:21:44Z

- cmd: cd pipeline && npm test
  run_id: minted-app-test-chap-chon-e4b-sap-SUITE-npm_test__13563d-r3
  exit_code: 0
  verified_at: 2026-11-11T02:21:44Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-app-test-chap-chon-e4b-sap-SUITE-test_lint_rules-r3
  exit_code: 0
  verified_at: 2026-11-11T02:21:44Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-app-test-chap-chon-e4b-sap-SUITE-node_scripts_check_portal_compliance_mjs-r3
  exit_code: 0
  verified_at: 2026-11-11T02:21:44Z

### Judgment

- eval: E5
  judged_by: hội đồng judge (đề xuất, giữ nguyên từ round 2)
  proposal: PASS
  panel giu nguyen tu round 2 — inputs khong doi, khong cham lai; rationale xem round do.
  votes:
    - domain-correctness: PASS (r2)
    - operational-feasibility: PASS (r2)
    - spec-alignment: PASS (r2)
  human_override:  # chi nguoi ghi

## Known limits

## Ngoài hợp đồng

## Analyst

carried tu round 1 — baseline khong do lai round nay. Eval không-phân-biệt: không có. Lệnh suite xanh cả hai phía là regression-guard bình thường, không liệt kê.

## Variance

none — every multi-run eval is uniform

## Iterations

Round 1 và round 2: lịch sử không nằm trong dữ liệu round này; xem run-log.jsonl.
Round 3: E2 failed — E4B-AC-3 biên: sort price-desc của bản mới đo 791 ms, vượt trần 700 ms (ba sort còn lại 450, 478, 347 ms đạt). Returned to implementation.
