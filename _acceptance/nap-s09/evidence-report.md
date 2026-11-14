---
schema_version: 2
feature_slug: nap-s09
verdict: PASS
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 4d53bf33d81056962e9a5d7b856203768cea298e
human_signoff: Mạnh 2026-11-14
---

# Evidence Report: nap-s09

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | test | PASS |
| E2 | AC-2 | test | PASS |
| E3 | AC-3 | test | PASS |
| E4 | AC-4 | script | PASS |
| E5 | AC-5 | judgment | PASS |
| E6 | AC-6 | script | PASS |

## Evidence

- eval: E1
  run_id: minted-nap-s09-E1-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.ns09_test
  verified_at: 2026-11-14T08:37:31Z
  output: |
    bash db/db-thu.sh oneinvest_suite_nap_s09 --chay node --test pipeline/tests/import-s09.test.mjs
    duration_ms 585.804917

- eval: E2
  run_id: minted-nap-s09-E2-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.ns09_test
  verified_at: 2026-11-14T08:37:31Z
  output: |
    bash db/db-thu.sh oneinvest_suite_nap_s09 --chay node --test pipeline/tests/import-s09.test.mjs
    duration_ms 585.804917

- eval: E3
  run_id: minted-nap-s09-E3-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.ns09_test
  verified_at: 2026-11-14T08:37:31Z
  output: |
    bash db/db-thu.sh oneinvest_suite_nap_s09 --chay node --test pipeline/tests/import-s09.test.mjs
    duration_ms 585.804917

- eval: E4
  run_id: minted-nap-s09-E4-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.ns09_that
  verified_at: 2026-11-14T08:37:31Z
  output: |
    E4: mọi ô đạt kỳ vọng

- eval: E5
  judged_by: judge panel (domain-correctness, operational-feasibility, spec-alignment)
  verdict: PASS
  rationale: Đề xuất PASS của hội đồng, cả ba lens cùng PASS. Mục schemaVersion 13 trong DATA-CONTRACT.md (dòng 240-254) nêu đủ năm điều và khớp 097 cùng dongItemS09, không câu nào mâu thuẫn.
  panel_votes:
    - domain-correctness: PASS — Mục v13 nêu đúng hai kind danh-muc và du-an, khoá dự án là data.id, item chỉ dùng khi chiTiet.meta.code = "200", bảng đích stg_s09_item, cấm dùng item.meta lẫn manifest notes. 097 khớp từng điểm (CHECK kind hai giá trị, project_id sinh từ payload chiTiet data id, detail_ok sinh từ meta.code, view lọc detail_ok, không có cột meta). dongItemS09 bỏ đúng ba lý do. Mã khác 200 vẫn được lưu nhưng detail_ok là false nên view loại ra, nên không mâu thuẫn.
    - operational-feasibility: PASS — Mục v13 khớp 097 và dongItemS09: project_id sinh từ payload chiTiet data id, detail_ok là meta.code = '200', CHECK kind chỉ nhận hai giá trị, view chỉ đọc khi detail_ok; ba lý do bỏ và chỉ ghi năm cột. Không thấy câu nào mâu thuẫn.
    - spec-alignment: PASS — Mục v13 khớp 097 (CHECK kind, cột sinh project_id, detail_ok, view lọc detail_ok) và dongItemS09 (tập KIND, bỏ du-an thiếu data.id). Lưu ý nhỏ: bộ nạp không bỏ item có meta.code khác "200"; việc loại nằm ở detail_ok và view, nên hợp với câu "không dùng".
  required_evidence:
    - (judge không nêu bằng-chứng-thiếu)
  human_override:  # chi nguoi ghi

- eval: E6
  run_id: minted-nap-s09-E6-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.ns09_ranh_gioi
  verified_at: 2026-11-14T08:37:31Z
  output: |
    tep=18 ngoai_vung=0 sync_cloud_doi=0 app_doi=0 migration_doi=0 ten_nguon=0 ten_nguon_commit=0 test_nua=ok

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-nap-s09-SUITE-npm_test__bb6271-r1
  exit_code: 0
  verified_at: 2026-11-14T08:37:31Z

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-nap-s09-SUITE-lint-r1
  exit_code: 0
  verified_at: 2026-11-14T08:37:31Z

- cmd: cd app && npm test
  run_id: minted-nap-s09-SUITE-npm_test__bd9a35-r1
  exit_code: 0
  verified_at: 2026-11-14T08:37:31Z

- cmd: cd pipeline && npm run test:a
  run_id: minted-nap-s09-SUITE-test_a-r1
  exit_code: 0
  verified_at: 2026-11-14T08:37:31Z

- cmd: cd pipeline && npm run test:b
  run_id: minted-nap-s09-SUITE-test_b-r1
  exit_code: 0
  verified_at: 2026-11-14T08:37:31Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-nap-s09-SUITE-test_lint_rules-r1
  exit_code: 0
  verified_at: 2026-11-14T08:37:31Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-nap-s09-SUITE-node_scripts_check_portal_compliance_mjs-r1
  exit_code: 0
  verified_at: 2026-11-14T08:37:31Z

## Known limits

## Ngoài hợp đồng

## Analyst

none — không eval nào xanh cả trên baseline lẫn trên nhánh; các eval feature đều chưa có baseline để so (xem dưới).

Baseline khong do
- bash db/db-thu.sh oneinvest_suite_nap_s09 --chay node --test pipeline/tests/import-s09.test.mjs: bo qua baseline: tep pipeline/tests/import-s09.test.mjs co o cay dang kiem nhung chua co o merge-base b8953e89d25e344a5a1e86fe50cb99c5a2e553dd — eval moi, chay tren code cu khong phan biet gi
- node pipeline/scripts/nap-s09-that.mjs: bo qua baseline: tep pipeline/scripts/nap-s09-that.mjs co o cay dang kiem nhung chua co o merge-base b8953e89d25e344a5a1e86fe50cb99c5a2e553dd — eval moi, chay tren code cu khong phan biet gi
- node pipeline/scripts/nap-s09-ranh-gioi.mjs --base origin/main: bo qua baseline: tep pipeline/scripts/nap-s09-ranh-gioi.mjs co o cay dang kiem nhung chua co o merge-base b8953e89d25e344a5a1e86fe50cb99c5a2e553dd — eval moi, chay tren code cu khong phan biet gi

## Variance

none — every multi-run eval is uniform

## Iterations

Round 1: tất cả eval đạt, không eval nào hỏng; verdict PASS.
