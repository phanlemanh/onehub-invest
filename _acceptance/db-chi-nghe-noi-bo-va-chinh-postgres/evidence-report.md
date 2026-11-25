---
schema_version: 2
feature_slug: db-chi-nghe-noi-bo-va-chinh-postgres
verdict: REJECT
failed_evals: ["E4"]
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 6b866d99d09b3cb2f4fa76eb53c1691e938923ac
human_signoff:
---

# Evidence Report: db-chi-nghe-noi-bo-va-chinh-postgres

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | script | PASS |
| E2 | AC-2 | script | PASS |
| E3 | AC-3 | script | PASS |
| E4 | AC-4 | script | FAIL |
| E5 | AC-5 | script | PASS |
| E5b | AC-5 | judgment | PASS (đề xuất panel, human_override trống) |
| E6 | AC-6 | script | PASS |
| E6b | AC-6 | judgment | FAIL (đề xuất panel, human_override trống) |
| E7 | AC-7 | script | PASS |
| E8 | AC-8 | script | PASS |
| E9 | AC-9 | judgment | PASS (đề xuất panel, human_override trống) |
| E7c | AC-7 | test | PASS |
| E7d | AC-7 | test | PASS |

## Evidence

- eval: E1
  run_id: minted-db-chi-nghe-noi-bo-va-chinh-postgres-E1-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.db_noi_bo_static
  verified_at: 2026-11-24T23:32:45Z
  output: |
    check-db-noi-bo static: ĐẠT

- eval: E2
  run_id: minted-db-chi-nghe-noi-bo-va-chinh-postgres-E2-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.db_noi_bo_mutation
  verified_at: 2026-11-24T23:32:45Z
  output: |
    check-db-noi-bo mutation: ĐẠT

- eval: E3
  run_id: minted-db-chi-nghe-noi-bo-va-chinh-postgres-E3-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.db_noi_bo_cong
  verified_at: 2026-11-24T23:32:45Z
  output: |
    check-db-noi-bo cong: ĐẠT

- eval: E4
  run_id: minted-db-chi-nghe-noi-bo-va-chinh-postgres-E4-r1
  exit_code: 1
  baseline: n-a
  verifier: config:executors.script.db_noi_bo_tham_so
  verified_at: 2026-11-24T23:32:45Z
  output: |
    PASS compose cây: shared_buffers=8GB, work_mem=64MB, maintenance_work_mem=1GB, effective_cache_size=20GB, /dev/shm 1.0G
    PASS compose base 5a418983c: shared_buffers=256MB, work_mem=16MB, maintenance_work_mem=128MB, /dev/shm 64M
    FAIL không dựng được ht8-ts-ap: Container ht8-ts-ap Waiting
    Error response from daemon: No such container (mã container tạm không còn)
    check-db-noi-bo tham-so: KHÔNG ĐẠT

- eval: E5
  run_id: minted-db-chi-nghe-noi-bo-va-chinh-postgres-E5-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.db_noi_bo_do
  verified_at: 2026-11-24T23:32:45Z
  output: |
    check-db-noi-bo do: ĐẠT

- eval: E6
  run_id: minted-db-chi-nghe-noi-bo-va-chinh-postgres-E6-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.db_noi_bo_soat
  verified_at: 2026-11-24T23:32:45Z
  output: |
    check-db-noi-bo soat: ĐẠT

- eval: E7
  run_id: minted-db-chi-nghe-noi-bo-va-chinh-postgres-E7-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.db_noi_bo_cu_khong_gay
  verified_at: 2026-11-24T23:32:45Z
  output: |
    check-db-noi-bo cu-khong-gay: ĐẠT

- eval: E8
  run_id: minted-db-chi-nghe-noi-bo-va-chinh-postgres-E8-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.db_noi_bo_live
  verified_at: 2026-11-24T23:32:45Z
  output: |
    check-db-noi-bo live-ba: ĐẠT

- eval: E7c
  run_id: minted-db-chi-nghe-noi-bo-va-chinh-postgres-E7c-r1
  exit_code: 0
  baseline: red
  verifier: config:executors.suite.pipeline_a
  verified_at: 2026-11-24T23:32:45Z
  output: |
    nửa A bộ test pipeline xong, 0 fail (duration_ms 2963722)

- eval: E7d
  run_id: minted-db-chi-nghe-noi-bo-va-chinh-postgres-E7d-r1
  exit_code: 0
  baseline: red
  verifier: config:executors.suite.pipeline_b
  verified_at: 2026-11-24T23:32:45Z
  output: |
    nửa B bộ test pipeline xong, 0 fail (duration_ms 1500081)

### Judgment (đề xuất panel, chưa người chốt)

- eval: E5b
  judged_by: judge-panel (fresh context)
  verdict: PASS
  rationale: ap-may-thu.md mục 4 có bảng đo trước/sau, nêu thẳng hai truy vấn chậm hơn kèm câu xử lý giữ số và ghi giới hạn; bốn tham số và shm khớp design §4.
  human_override:  # chi nguoi ghi

- eval: E6b
  judged_by: judge-panel (fresh context)
  verdict: FAIL
  rationale: Cả ba lens cùng thấy scripts/check-supabase-lock.sh được tệp soát ghi là docker exec vào one-invest-db nhưng §3 design xếp vào nhóm container riêng không chạm DB thật; lệch thêm ở check-ruler-views.sh và check-db-noi-bo.sh.
  human_override:  # chi nguoi ghi

- eval: E9
  judged_by: judge-panel (fresh context)
  verdict: PASS
  rationale: runtime-map và ap-may-thu.md có đủ sáu ý, khớp compose, đủ năm thứ của hồ sơ áp, và nêu agent không tự chạy lệnh áp.
  human_override:  # chi nguoi ghi

### Lệnh suite (hồi quy)

- cmd: node scripts/suite-neu-doi.mjs agent -- 'cd agent && npm test'
  run_id: minted-db-chi-nghe-noi-bo-va-chinh-postgres-SUITE-node_scripts_suite_neu_doi_mjs_agent_cd_-r1
  exit_code: 0
  verified_at: 2026-11-24T23:32:45Z

- cmd: node scripts/suite-neu-doi.mjs app -- 'cd app && npx tsc --noEmit && npm run lint'
  run_id: minted-db-chi-nghe-noi-bo-va-chinh-postgres-SUITE-lint-r1
  exit_code: 0
  verified_at: 2026-11-24T23:32:45Z

- cmd: node scripts/suite-neu-doi.mjs app_ui -- 'cd app && npm test'
  run_id: minted-db-chi-nghe-noi-bo-va-chinh-postgres-SUITE-node_scripts_suite_neu_doi_mjs_app_ui_cd-r1
  exit_code: 0
  verified_at: 2026-11-24T23:32:45Z

- cmd: node scripts/suite-neu-doi.mjs ui_lint_rules -- 'cd app && npm run test:lint-rules'
  run_id: minted-db-chi-nghe-noi-bo-va-chinh-postgres-SUITE-test_lint_rules-r1
  exit_code: 0
  verified_at: 2026-11-24T23:32:45Z

- cmd: node scripts/suite-neu-doi.mjs portal_static -- 'node scripts/check-portal-compliance.mjs'
  run_id: minted-db-chi-nghe-noi-bo-va-chinh-postgres-SUITE-node_scripts_suite_neu_doi_mjs_portal_st-r1
  exit_code: 0
  verified_at: 2026-11-24T23:32:45Z

## Judge panels (đề xuất)

E5b, đề xuất PASS:
- domain-correctness: PASS — bảng đo trước/sau có mặt, Q1 +9% và Q2 +4% nêu thẳng kèm câu xử lý giữ số và ghi giới hạn; tham số khớp design §4.
- operational-feasibility: PASS — ba truy vấn, trung vị ba lần, máy Mac mini, ngày 24/11/2026; bốn tham số và shm khớp.
- spec-alignment: PASS — bảng Q1–Q3 khớp design §4.

E6b, đề xuất FAIL:
- domain-correctness: FAIL — scripts/check-supabase-lock.sh bị §3 xếp vào container riêng trong khi tệp soát ghi docker exec vào one-invest-db; check-ruler-views.sh cũng lệch (tệp soát ghi docker compose / khác, §3 ghi docker exec).
- operational-feasibility: FAIL — 21 trên 22 tệp khớp §3, riêng check-supabase-lock.sh không khớp; check-db-noi-bo.sh lệch nhẹ (tệp soát ghi docker run --network container:, §3 chỉ nêu docker exec pg_dump ở chế độ do).
- spec-alignment: FAIL — 21 trong 22 dòng khớp; check-supabase-lock.sh xếp sai (hàng 45 của §3 thay vì hàng 44); hàng 45 cần ghi thêm check-db-noi-bo.sh dùng docker run --network container:.
- Bằng chứng còn thiếu: sửa §3 của design doc cho khớp tệp soát (hoặc chạy lại bộ soát và đối chiếu lệnh grep docker trong từng tệp); human_override để trống cho người quyết ở Cổng 2.

E9, đề xuất PASS:
- domain-correctness: PASS — runtime-map dòng 312-328 khớp compose ở cả sáu điểm; ap-may-thu.md đủ năm thứ và khung giờ 22:05–23:55.
- operational-feasibility: PASS — sáu ý đủ, nêu docker restart không sinh lại cấu hình.
- spec-alignment: PASS — đúng 127.0.0.1:5433, bốn tham số, shm_size 1gb, lệnh kiểm live, agent không tự chạy lệnh áp.

## Known limits

## Ngoài hợp đồng

## Analyst

none — mọi eval feature đều red trên baseline (có phân biệt) hoặc không đo được baseline (xem dưới); không eval nào pass trên cả HEAD lẫn baseline.

Lệnh fail không gắn eval: không có. Lệnh `bash scripts/check-db-noi-bo.sh tham-so` fail (mã 1) gắn E4.

Baseline không đo
- bash scripts/check-db-noi-bo.sh static: bo qua baseline: tep scripts/check-db-noi-bo.sh co o cay dang kiem nhung chua co o merge-base 8aae9497c771760a47f0681735e13b30e02f85c1 — eval moi, chay tren code cu khong phan biet gi
- bash scripts/check-db-noi-bo.sh mutation: bo qua baseline: tep scripts/check-db-noi-bo.sh co o cay dang kiem nhung chua co o merge-base 8aae9497c771760a47f0681735e13b30e02f85c1 — eval moi, chay tren code cu khong phan biet gi
- bash scripts/check-db-noi-bo.sh cong: bo qua baseline: tep scripts/check-db-noi-bo.sh co o cay dang kiem nhung chua co o merge-base 8aae9497c771760a47f0681735e13b30e02f85c1 — eval moi, chay tren code cu khong phan biet gi
- bash scripts/check-db-noi-bo.sh tham-so: bo qua baseline: tep scripts/check-db-noi-bo.sh co o cay dang kiem nhung chua co o merge-base 8aae9497c771760a47f0681735e13b30e02f85c1 — eval moi, chay tren code cu khong phan biet gi
- bash scripts/check-db-noi-bo.sh do: bo qua baseline: tep scripts/check-db-noi-bo.sh co o cay dang kiem nhung chua co o merge-base 8aae9497c771760a47f0681735e13b30e02f85c1 — eval moi, chay tren code cu khong phan biet gi
- bash scripts/check-db-noi-bo.sh soat: bo qua baseline: tep scripts/check-db-noi-bo.sh co o cay dang kiem nhung chua co o merge-base 8aae9497c771760a47f0681735e13b30e02f85c1 — eval moi, chay tren code cu khong phan biet gi
- bash scripts/check-db-noi-bo.sh cu-khong-gay: bo qua baseline: tep scripts/check-db-noi-bo.sh co o cay dang kiem nhung chua co o merge-base 8aae9497c771760a47f0681735e13b30e02f85c1 — eval moi, chay tren code cu khong phan biet gi
- bash scripts/check-db-noi-bo.sh live-ba: bo qua baseline: tep scripts/check-db-noi-bo.sh co o cay dang kiem nhung chua co o merge-base 8aae9497c771760a47f0681735e13b30e02f85c1 — eval moi, chay tren code cu khong phan biet gi

## Variance

none — mọi eval nhiều lần chạy đều đồng nhất (mọi eval chạy một lần, xác định).

## Iterations

Round 1: E4 failed — bước dựng container tạm ht8-ts-ap trong đường áp tham số không dựng được (container không còn khi compose chờ), nên ba bước main→cây, restart, cây→main chưa được đo. Panel E6b cũng đề xuất FAIL vì §3 design lệch tệp soát. Returned to implementation.
