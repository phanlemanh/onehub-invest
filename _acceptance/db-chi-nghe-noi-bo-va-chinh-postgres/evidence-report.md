---
schema_version: 2
feature_slug: db-chi-nghe-noi-bo-va-chinh-postgres
verdict: PASS
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: d1d622cdaa2530d7bc80be8960d975130f1bb69a
human_signoff: Mạnh 2026-11-26
---

# Evidence Report: db-chi-nghe-noi-bo-va-chinh-postgres

Round 2.

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | script | PASS |
| E2 | AC-2 | script | PASS |
| E3 | AC-3 | script | PASS |
| E4 | AC-4 | script | PASS |
| E5 | AC-5 | script | PASS |
| E5b | AC-5 | judgment | PASS |
| E6 | AC-6 | script | PASS |
| E6b | AC-6 | judgment | PASS |
| E7 | AC-7 | script | PASS |
| E8 | AC-8 | script | PASS |
| E9 | AC-9 | judgment | PASS |
| E7c | AC-7 | test | PASS |
| E7d | AC-7 | test | PASS |

## Evidence

- eval: E1
  run_id: minted-db-chi-nghe-noi-bo-va-chinh-postgres-E1-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.db_noi_bo_static
  verified_at: 2026-11-25T01:15:27Z
  output: |
    check-db-noi-bo static: ĐẠT

- eval: E2
  run_id: minted-db-chi-nghe-noi-bo-va-chinh-postgres-E2-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.db_noi_bo_mutation
  verified_at: 2026-11-25T01:15:27Z
  output: |
    check-db-noi-bo mutation: ĐẠT

- eval: E3
  run_id: minted-db-chi-nghe-noi-bo-va-chinh-postgres-E3-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.db_noi_bo_cong
  verified_at: 2026-11-25T01:15:27Z
  output: |
    check-db-noi-bo cong: ĐẠT

- eval: E4
  run_id: minted-db-chi-nghe-noi-bo-va-chinh-postgres-E4-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.db_noi_bo_tham_so
  verified_at: 2026-11-25T01:15:27Z
  output: |
    check-db-noi-bo tham-so: ĐẠT

- eval: E5
  run_id: minted-db-chi-nghe-noi-bo-va-chinh-postgres-E5-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.db_noi_bo_do
  verified_at: 2026-11-25T01:15:27Z
  output: |
    check-db-noi-bo do: ĐẠT

- eval: E6
  run_id: minted-db-chi-nghe-noi-bo-va-chinh-postgres-E6-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.db_noi_bo_soat
  verified_at: 2026-11-25T01:15:27Z
  output: |
    check-db-noi-bo soat: ĐẠT

- eval: E7
  run_id: minted-db-chi-nghe-noi-bo-va-chinh-postgres-E7-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.db_noi_bo_cu_khong_gay
  verified_at: 2026-11-25T01:15:27Z
  output: |
    check-db-noi-bo cu-khong-gay: ĐẠT

- eval: E8
  run_id: minted-db-chi-nghe-noi-bo-va-chinh-postgres-E8-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.db_noi_bo_live
  verified_at: 2026-11-25T01:15:27Z
  output: |
    check-db-noi-bo live-ba: ĐẠT

- eval: E7c
  run_id: minted-db-chi-nghe-noi-bo-va-chinh-postgres-E7c-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.suite.pipeline_a
  verified_at: 2026-11-25T01:15:27Z
  output: |
    nửa A bộ test pipeline xong, duration_ms 3600872.946666

- eval: E7d
  run_id: minted-db-chi-nghe-noi-bo-va-chinh-postgres-E7d-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.suite.pipeline_b
  verified_at: 2026-11-25T01:15:27Z
  output: |
    nửa B bộ test pipeline xong, duration_ms 1719912.122375

### Judgment

- eval: E5b
  judged_by: hội đồng judge (fresh context), đề xuất PASS
  verdict: PASS
  rationale: ap-may-thu.md §4 có bảng đo trước/sau Q1–Q3 (trung vị ba lần, Mac mini, 25/11/2026). Q1 chậm hơn khoảng 10% được nêu thẳng kèm xử lý giữ số và ghi giới hạn. Tham số khớp design §4.
  votes:
    - domain-correctness: PASS — số trong bảng khớp các phần trăm nêu (Q1 +10%, Q2 -8%, Q3 -23%); tham số 8GB/64MB/1GB/20GB và shm 1GB khớp design §4, cột base khớp mốc cũ.
    - operational-feasibility: PASS — bảng đo có ms trước, ms sau, Workers Launched; ghi máy, ngày, số lần; Q1 chậm hơn được nêu thẳng kèm lý do giữ số.
    - spec-alignment: PASS — trung vị ba lần cho Q1–Q3, Q1 chậm hơn nêu thẳng, tham số khớp design §4 và cột base khớp §1.
  human_override:  # chi nguoi ghi

- eval: E6b
  judged_by: hội đồng judge (fresh context), đề xuất PASS
  verdict: PASS
  rationale: Cả 22 tệp trong soat-ben-noi.txt đều có hàng ở bảng §3 (trực tiếp hoặc qua glob), cách nối khớp, mỗi hàng có hệ quả sau khi chỉ nghe 127.0.0.1.
  votes:
    - domain-correctness: PASS — 22 tệp đều có hàng khớp, kể cả nhóm glob db/check-idempotent*.sh; hàng up -d nêu rõ nó tạo lại container.
    - operational-feasibility: PASS — bảng §3 phủ đủ, cách nối khớp phân loại của tệp soát, có cột hệ quả.
    - spec-alignment: PASS — mọi tệp có hàng; §3 thêm ci-test-local.mjs ngoài danh sách soát nhưng không trái với tệp soát.
  human_override:  # chi nguoi ghi

- eval: E9
  judged_by: hội đồng judge (fresh context), đề xuất PASS
  verdict: PASS
  rationale: runtime-map (dòng 312-328) và ap-may-thu.md khớp compose ở cả sáu điểm; cả hai ghi agent không tự chạy lệnh áp và cần lời riêng của Mạnh.
  votes:
    - domain-correctness: PASS — cổng 127.0.0.1:5433 kèm lý do A1 và tầng A, bốn tham số cùng shm_size 1gb, lệnh live, đổi tham số bằng --force-recreate; ap-may-thu.md đủ năm thứ.
    - operational-feasibility: PASS — sáu điều khớp compose; khung giờ 22:05–23:55 ngoài lượt job.
    - spec-alignment: PASS — sáu ý khớp compose; ap-may-thu.md đủ lệnh áp, số chạy thử, sao lưu, cách lùi, lệnh kiểm sau.
  human_override:  # chi nguoi ghi

### Lệnh suite (hồi quy)

- cmd: node scripts/suite-neu-doi.mjs agent -- 'cd agent && npm test'
  run_id: minted-db-chi-nghe-noi-bo-va-chinh-postgres-SUITE-node_scripts_suite_neu_doi_mjs_agent_cd_-r2
  exit_code: 0
  verified_at: 2026-11-25T01:15:27Z

- cmd: node scripts/suite-neu-doi.mjs app -- 'cd app && npx tsc --noEmit && npm run lint'
  run_id: minted-db-chi-nghe-noi-bo-va-chinh-postgres-SUITE-lint-r2
  exit_code: 0
  verified_at: 2026-11-25T01:15:27Z

- cmd: node scripts/suite-neu-doi.mjs app_ui -- 'cd app && npm test'
  run_id: minted-db-chi-nghe-noi-bo-va-chinh-postgres-SUITE-node_scripts_suite_neu_doi_mjs_app_ui_cd-r2
  exit_code: 0
  verified_at: 2026-11-25T01:15:27Z

- cmd: node scripts/suite-neu-doi.mjs ui_lint_rules -- 'cd app && npm run test:lint-rules'
  run_id: minted-db-chi-nghe-noi-bo-va-chinh-postgres-SUITE-test_lint_rules-r2
  exit_code: 0
  verified_at: 2026-11-25T01:15:27Z

- cmd: node scripts/suite-neu-doi.mjs portal_static -- 'node scripts/check-portal-compliance.mjs'
  run_id: minted-db-chi-nghe-noi-bo-va-chinh-postgres-SUITE-node_scripts_suite_neu_doi_mjs_portal_st-r2
  exit_code: 0
  verified_at: 2026-11-25T01:15:27Z

## Known limits

## Ngoài hợp đồng

## Analyst

carried tu round 1 — baseline khong do lai round nay

none — không eval nào pass trên cả HEAD lẫn baseline được liệt kê; lệnh suite xanh cả hai phía là regression-guard thông thường.

## Variance

none — mọi eval chạy một lần, không eval nào có phương sai.

## Iterations

Round 1: baseline được đo ở round 1 (chi tiết xem lịch sử round đó).
Round 2: toàn bộ eval máy và lệnh suite xanh, ba mục judgment đề xuất PASS (human_override để trống cho người quyết ở Cổng 2); verdict PASS.

### Re-pin lần 1 — 2026-11-26, do ghim lại bằng làn eval
run_id: repin-20261126T160602Z-30047
sha: d1d622cdaa2530d7bc80be8960d975130f1bb69a · suites: 8 lệnh exit 0 · evals: 10/10 eval máy đạt kỳ vọng · ngoài làn máy: E5b, E6b, E9 · AC không có chốt máy: AC-9
