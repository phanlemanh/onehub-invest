---
schema_version: 2
feature_slug: dbv-itest-xanh-lai-tren-main
verdict: BLOCKED
failed_evals: ["E5"]
reason: "Lệnh node --test --test-concurrency=1 pipeline/scripts/danh-ba-vat-the.itest.mjs dừng ở bước dựng DB, chưa tới assertion nào. ci-db-init (scripts/ci-db-init.mjs --migrations) báo 'Connection terminated unexpectedly' từ pg client; stack trỏ taoDbThu (pipeline/scripts/db-thu-dbv.mjs:43) gọi từ dbCa (danh-ba-vat-the.itest.mjs:221). Nguyên nhân khả dĩ: DB thử nghiệm/container local không sẵn sàng hoặc kết nối bị đóng giữa chừng. Không có kết quả của bộ test nên E1, E2, E3, E6 không chấm được. Không chạy lại nhiều lần theo hướng dẫn."
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 4a6bc82d038a5dabe2ae87d241dde6c8d8c6490f
human_signoff:
---

# Evidence Report: dbv-itest-xanh-lai-tren-main

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | test | BLOCKED |
| E2 | AC-2 | test | BLOCKED |
| E3 | AC-3 | test | BLOCKED |
| E4 | AC-3 | script | PASS |
| E5 | AC-4 | script | FAIL |
| E6 | AC-5 | test | BLOCKED |

## Evidence

- eval: E1
  run_id: minted-dbv-itest-xanh-lai-tren-main-E1-r1
  exit_code: 1
  baseline: red
  verifier: config:executors.test.dbv_db
  verified_at: 2026-11-12T06:49:43Z
  output: |
    Lệnh: node --test --test-concurrency=1 pipeline/scripts/danh-ba-vat-the.itest.mjs
    Dừng ở bước dựng DB, chưa tới assertion: ci-db-init báo "Connection terminated unexpectedly" (pg client).
    Stack: taoDbThu (pipeline/scripts/db-thu-dbv.mjs:43) <- dbCa (danh-ba-vat-the.itest.mjs:221).
    Không có kết quả đạt/hỏng của bộ test; eval không chấm được (BLOCKED).

- eval: E2
  run_id: minted-dbv-itest-xanh-lai-tren-main-E2-r1
  exit_code: 1
  baseline: red
  verifier: config:executors.test.dbv_db
  verified_at: 2026-11-12T06:49:43Z
  output: |
    Cùng lần chạy với E1: dừng ở bước dựng DB (taoDbThu, db-thu-dbv.mjs:43), chưa tới ca DBV-AC-3 … DBV-AC-12.
    Eval không chấm được (BLOCKED).

- eval: E3
  run_id: minted-dbv-itest-xanh-lai-tren-main-E3-r1
  exit_code: 1
  baseline: red
  verifier: config:executors.test.dbv_db
  verified_at: 2026-11-12T06:49:43Z
  output: |
    Cùng lần chạy với E1: không có dòng tổng TAP (tests 18, pass 18, fail 0, skipped 0, todo 0) vì test dừng trước khi chạy ca nào.
    Eval không chấm được (BLOCKED).

- eval: E4
  run_id: minted-dbv-itest-xanh-lai-tren-main-E4-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.dbvx_giu
  verified_at: 2026-11-12T06:49:43Z
  output: |
    DBVX-GIU PASS

- eval: E5
  run_id: minted-dbv-itest-xanh-lai-tren-main-E5-r1
  exit_code: 1
  baseline: n-a
  verifier: config:executors.script.dbvx_doi_chung
  verified_at: 2026-11-12T06:49:43Z
  output: |
    HEAD 4a6bc82d038a5dabe2ae87d241dde6c8d8c6490f
    DOI CHUNG A DO (nhieu-tinh)
    DOI CHUNG B DO (thong diep ghim)
    DB THU TRUOC 0 SAU 4 — sót: oneinvest_dbv_19475, oneinvest_dbv_19475_082, oneinvest_dbv_19475_truoc, oneinvest_dbv_19475_a8
    DBVX-DOI-CHUNG FAIL
    Hai phép đối chứng A và B đều đỏ đúng kỳ vọng, nhưng số DB thử không bằng nhau (trước 0, sau 4): probe để sót bốn DB oneinvest_dbv_*.

- eval: E6
  run_id: minted-dbv-itest-xanh-lai-tren-main-E6-r1
  exit_code: 1
  baseline: red
  verifier: config:executors.test.dbv_db
  verified_at: 2026-11-12T06:49:43Z
  output: |
    Cùng lần chạy với E1: dừng ở bước dựng DB, chưa tới ca DBV-AC-9 và DBM-AC-5.
    Eval không chấm được (BLOCKED).

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-dbv-itest-xanh-lai-tren-main-SUITE-npm_test__bb6271-r1
  exit_code: 0
  verified_at: 2026-11-12T06:49:43Z

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-dbv-itest-xanh-lai-tren-main-SUITE-lint-r1
  exit_code: 0
  verified_at: 2026-11-12T06:49:43Z

- cmd: cd app && npm test
  run_id: minted-dbv-itest-xanh-lai-tren-main-SUITE-npm_test__bd9a35-r1
  exit_code: 0
  verified_at: 2026-11-12T06:49:43Z

- cmd: cd pipeline && npm test
  run_id: minted-dbv-itest-xanh-lai-tren-main-SUITE-npm_test__13563d-r1
  exit_code: 0
  verified_at: 2026-11-12T06:49:43Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-dbv-itest-xanh-lai-tren-main-SUITE-test_lint_rules-r1
  exit_code: 0
  verified_at: 2026-11-12T06:49:43Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-dbv-itest-xanh-lai-tren-main-SUITE-node_scripts_check_portal_compliance_mjs-r1
  exit_code: 0
  verified_at: 2026-11-12T06:49:43Z

## Known limits

## Ngoài hợp đồng

## Analyst

none — moi eval feature deu red tren baseline (co phan biet), trừ hai eval không đo được baseline dưới đây.

Baseline khong do
- node _acceptance/dbv-itest-xanh-lai-tren-main/probes/giu.mjs: bo qua baseline: tep _acceptance/dbv-itest-xanh-lai-tren-main/probes/giu.mjs co o cay dang kiem nhung chua co o merge-base e01513de2abf543e09febe2fda452858e1898789 — eval moi, chay tren code cu khong phan biet gi
- node _acceptance/dbv-itest-xanh-lai-tren-main/probes/doi-chung.mjs: bo qua baseline: tep _acceptance/dbv-itest-xanh-lai-tren-main/probes/doi-chung.mjs co o cay dang kiem nhung chua co o merge-base e01513de2abf543e09febe2fda452858e1898789 — eval moi, chay tren code cu khong phan biet gi

Lệnh fail không gắn eval: không có. Lệnh node _acceptance/dbv-itest-xanh-lai-tren-main/probes/doi-chung.mjs gắn E5.

## Variance

none — every multi-run eval is uniform

## Iterations

Round 1: E5 hỏng (probe đối chứng để sót bốn DB thử oneinvest_dbv_*, số trước và sau không bằng nhau); E1, E2, E3, E6 BLOCKED vì bộ test pipeline/scripts/danh-ba-vat-the.itest.mjs không dựng được DB thử (kết nối pg bị đóng ở ci-db-init). Cần khôi phục DB local :5433 rồi chạy lại.
