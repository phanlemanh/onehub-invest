---
schema_version: 2
feature_slug: freshness-do-gio-thu-that-s03
verdict: PASS
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 4add073567b7bdc1279d0f62eb3860b7513bd97c
human_signoff: Mạnh 2026-10-23
---

# Evidence Report: freshness-do-gio-thu-that-s03

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | test | PASS |
| E2 | AC-2 | test | PASS |
| E3 | AC-3 | test | PASS |
| E4 | AC-4 | test | PASS |
| E5 | AC-5 | test | PASS |
| E6 | AC-6 | test | PASS |
| E7 | AC-7 | judgment | PASS |
| E8 | AC-8 | test | PASS |

## Evidence

- eval: E1
  run_id: minted-freshness-do-gio-thu-that-s03-E1-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.test.scripts
  verified_at: 2026-10-23T12:12:27Z
  output: |
    node --test scripts/*.test.mjs chạy xong, mã thoát 0. Ca "GT-AC-1 importer thật nạp lại snapshot S06 cũ" và ca đối chứng "importer thật nạp snapshot thu 10 giờ" đều ok, không skip.

- eval: E2
  run_id: minted-freshness-do-gio-thu-that-s03-E2-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.test.scripts
  verified_at: 2026-10-23T12:12:27Z
  output: |
    node --test scripts/*.test.mjs chạy xong, mã thoát 0. Ca "GT-AC-2 S03/S05 nạp lại snapshot cũ" và ca đối chứng "snapshot thu trong SLO" đều ok, không skip.

- eval: E3
  run_id: minted-freshness-do-gio-thu-that-s03-E3-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.test.scripts
  verified_at: 2026-10-23T12:12:27Z
  output: |
    node --test scripts/*.test.mjs chạy xong, mã thoát 0. Ca "GT-AC-3 S03 cũ + S05 mới" và chiều ngược "S03 mới + S05 cũ" đều ok, không skip.

- eval: E4
  run_id: minted-freshness-do-gio-thu-that-s03-E4-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.test.scripts
  verified_at: 2026-10-23T12:12:27Z
  output: |
    node --test scripts/*.test.mjs chạy xong, mã thoát 0. Mười ca biên (tuổi = SLO fresh, tuổi = SLO+1 stale) cho S01, S02, S03, S05, S06 và ca "ma trận biên đủ 10 ca" đều ok, không skip.

- eval: E5
  run_id: minted-freshness-do-gio-thu-that-s03-E5-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.test.scripts
  verified_at: 2026-10-23T12:12:27Z
  output: |
    node --test scripts/*.test.mjs chạy xong, mã thoát 0. Ca "GT-AC-5 S01 hanoi fresh + hcmc stale cùng lúc, S04 completed quá hạn vẫn không đo" ok, không skip.

- eval: E6
  run_id: minted-freshness-do-gio-thu-that-s03-E6-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.test.scripts
  verified_at: 2026-10-23T12:12:27Z
  output: |
    node --test scripts/*.test.mjs chạy xong, mã thoát 0. Ca chẩn đoán "GT-AC-6 DB hiện tại" đã chạy và in dòng gt-live cho S03/S05/S06 (nạp, thu, lệch-snapshot) cùng giờ chấm.

- eval: E8
  run_id: minted-freshness-do-gio-thu-that-s03-E8-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.test.scripts
  verified_at: 2026-10-23T12:12:27Z
  output: |
    node --test scripts/*.test.mjs chạy xong, mã thoát 0. Ca "GT-AC-8 TIME_SOURCE bằng ma trận viết trước", "SQL từng probe lấy max(đúng cột)" và chiều đỏ "bản sao đổi probe S06 về captured_at → bị bắt, nêu S06" đều ok.

### Judgment

Panel đề xuất cho E7: ba góc nhìn domain-correctness, operational-feasibility, spec-alignment. Đề xuất chung: PASS.

- eval: E7
  judged_by: judge panel (domain-correctness, operational-feasibility, spec-alignment), fresh context
  verdict: PASS
  rationale: Chú thích đầu check-freshness.mjs và mục độ tươi của ops-check/SKILL.md đều ghi S01/S03/S05/S06 tính theo airbnb_snapshots.collected_at (giờ thu), S02 theo airdna_markets.captured_at (giờ tải), S04 không đo. Chỗ nhắc captured_at của bảng stg chỉ để phủ định, không câu nào nói S03/S05/S06 đo cột nạp; chỉ cụm «bảng nạp thật» hơi mơ hồ nhưng câu liền sau nêu đúng cột.
  votes:
    - domain-correctness: PASS — cả hai tài liệu nêu đúng cột và bảng của từng mã; S04 không đo khớp phạm vi contract.md; cụm «bảng nạp thật» mơ hồ nhẹ nhưng không gây hiểu sai.
    - operational-feasibility: PASS — hai tài liệu khớp AC-7; câu nhắc captured_at của stg chỉ để phủ định; người vận hành đọc ra đúng giờ THU.
    - spec-alignment: PASS — chú thích dòng 7-14 và bước 1 của ops-check khớp contract: S04 không đo, S03/S05 tách theo agent_id, S06 lấy từ stg_chotot_ads.
  human_override:  # chi nguoi ghi

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-freshness-do-gio-thu-that-s03-SUITE-npm_test__bb6271-r1
  exit_code: 0
  verified_at: 2026-10-23T12:12:27Z

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-freshness-do-gio-thu-that-s03-SUITE-lint-r1
  exit_code: 0
  verified_at: 2026-10-23T12:12:27Z

- cmd: cd app && npm test
  run_id: minted-freshness-do-gio-thu-that-s03-SUITE-npm_test__bd9a35-r1
  exit_code: 0
  verified_at: 2026-10-23T12:12:27Z

- cmd: cd pipeline && npm test
  run_id: minted-freshness-do-gio-thu-that-s03-SUITE-npm_test__13563d-r1
  exit_code: 0
  verified_at: 2026-10-23T12:12:27Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-freshness-do-gio-thu-that-s03-SUITE-test_lint_rules-r1
  exit_code: 0
  verified_at: 2026-10-23T12:12:27Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-freshness-do-gio-thu-that-s03-SUITE-node_scripts_check_portal_compliance_mjs-r1
  exit_code: 0
  verified_at: 2026-10-23T12:12:27Z

## Known limits

## Ngoài hợp đồng

## Analyst

Eval không-phân-biệt (xanh trên cả HEAD lẫn baseline diffBase, chứng minh harness chứ chưa chứng minh feature; nên viết lại để assert hành vi mới hoặc xác nhận là regression-guard có chủ ý):

- node --test scripts/*.test.mjs, phủ E1, E2, E3, E4, E5, E6, E8 (baseline: green)

## Variance

none — every multi-run eval is uniform

## Iterations

Round 1: E1, E2, E3, E4, E5, E6, E8 đều đạt, E7 do hội đồng chấm PASS; verdict PASS.
