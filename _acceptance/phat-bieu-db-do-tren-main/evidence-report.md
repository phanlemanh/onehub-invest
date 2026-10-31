---
schema_version: 2
feature_slug: phat-bieu-db-do-tren-main
verdict: REJECT
failed_evals: ["E8"]
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 099db08dbe7a0f22d5cd595427df251daba10e11
human_signoff:
---

# Evidence Report: phat-bieu-db-do-tren-main

Round 1. E8 (`cd pipeline && npm test`) đỏ. Hai ca PB-AC-6 trong `pipeline/scripts/phat-bieu.test.mjs` báo một chỗ gọi `apply_enrichment` ngoài ma trận vai: `pipeline/scripts/idem-063.mjs:54`. Tệp này do chính feature thêm. Chín eval còn lại xanh.

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | test | PASS |
| E2 | AC-2 | test | PASS |
| E3 | AC-3 | test | PASS |
| E4 | AC-4 | test | PASS |
| E5 | AC-5 | script | PASS |
| E6 | AC-6 | test | PASS |
| E7 | AC-7 | script | PASS |
| E8 | AC-8 | test | FAIL |
| E9 | AC-8 | test | PASS |
| E10 | AC-8 | test | PASS |

## Evidence

- eval: E1
  run_id: minted-phat-bieu-db-do-tren-main-E1-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.pb_chung_bai
  verified_at: 2026-10-31T02:37:54Z
  output: |
    ℹ duration_ms 3487.291334

- eval: E2
  run_id: minted-phat-bieu-db-do-tren-main-E2-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.pb_chung_bai
  verified_at: 2026-10-31T02:37:54Z
  output: |
    ℹ duration_ms 3487.291334

- eval: E3
  run_id: minted-phat-bieu-db-do-tren-main-E3-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.pb_chung_bai
  verified_at: 2026-10-31T02:37:54Z
  output: |
    ℹ duration_ms 3487.291334

- eval: E4
  run_id: minted-phat-bieu-db-do-tren-main-E4-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.pb_chung_bai
  verified_at: 2026-10-31T02:37:54Z
  output: |
    ℹ duration_ms 3487.291334

- eval: E5
  run_id: minted-phat-bieu-db-do-tren-main-E5-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.idem_063
  verified_at: 2026-10-31T02:37:54Z
  output: |
    idem-063 thời gian: một lượt apply_enrichment 3 ms trước 063 · 127 ms sau 063

- eval: E6
  run_id: minted-phat-bieu-db-do-tren-main-E6-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.phat_bieu_db_063
  verified_at: 2026-10-31T02:37:54Z
  output: |
    ℹ duration_ms 70780.619416

- eval: E7
  run_id: minted-phat-bieu-db-do-tren-main-E7-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.dc_tu_don
  verified_at: 2026-10-31T02:37:54Z
  output: |
    dc-tu-don đối chứng: còn 2 lược đồ pid chết

- eval: E8
  run_id: minted-phat-bieu-db-do-tren-main-E8-r1
  exit_code: 1
  baseline: n-a
  verifier: config:executors.test.pipeline
  verified_at: 2026-10-31T02:37:54Z
  output: |
    Hai ca của pipeline/scripts/phat-bieu.test.mjs (dòng 50 và 57) đỏ:
    - ca đối chiếu danh sách chỗ gọi apply_enrichment: danh sách thực có thêm
      'pipeline/scripts/idem-063.mjs|apply_enrichment' so với ma trận kỳ vọng.
    - "PB-AC-6 đối chứng: ma trận đổi vai route decide sang máy thì bộ kiểm vai đỏ, nêu tệp route":
      thông báo thực là 'pipeline/scripts/idem-063.mjs:54 chỗ gọi apply_enrichment ngoài ma trận',
      không khớp mẫu /decide\/route\.ts:\d+ chỗ của máy không được truyền 'hitl:'/.

- eval: E9
  run_id: minted-phat-bieu-db-do-tren-main-E9-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.app_ui
  verified_at: 2026-10-31T02:37:54Z
  output: |
    ℹ duration_ms 66534.529166

- eval: E10
  run_id: minted-phat-bieu-db-do-tren-main-E10-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.app
  verified_at: 2026-10-31T02:37:54Z
  output: |
    tsc --noEmit và lint app: 0 lỗi

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-phat-bieu-db-do-tren-main-SUITE-npm_test-r1
  exit_code: 0
  verified_at: 2026-10-31T02:37:54Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-phat-bieu-db-do-tren-main-SUITE-test_lint_rules-r1
  exit_code: 0
  verified_at: 2026-10-31T02:37:54Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-phat-bieu-db-do-tren-main-SUITE-node_scripts_check_portal_compliance_mjs-r1
  exit_code: 0
  verified_at: 2026-10-31T02:37:54Z

Lệnh fail không gắn eval: không có. Lệnh `cd pipeline && npm test` đã gắn E8.

## Known limits

## Ngoài hợp đồng

## Analyst

baseline: BLOCKED ha tang — lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.»

none — không đo được ở round này vì baseline bị chặn hạ tầng; mọi field baseline là n-a, nên chưa kết luận được eval nào phân biệt hay không.

Baseline khong do:
- cd pipeline && DATABASE_URL=${PB_DB_URL:-postgres://oneinvest:oneinvest@localhost:5433/oneinvest_p2_pd} node --test --test-concurrency=1 scripts/phat-bieu-chung-bai.itest.mjs: BLOCKED ha tang baseline: lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.»
- bash db/db-thu.sh oneinvest_p2_idem >/dev/null && cd pipeline && DATABASE_URL=postgres://oneinvest:oneinvest@localhost:5433/oneinvest_p2_idem node scripts/idem-063.mjs: BLOCKED ha tang baseline: lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.»
- bash db/db-thu.sh oneinvest_p2_pd >/dev/null && P=(docker exec -i -e PGPASSWORD=oneinvest one-invest-db psql -U oneinvest -h localhost -d oneinvest_p2_pd -q -v ON_ERROR_STOP=1) && "${P[@]}" < db/migrations/063_phat_bieu_theo_bai_dang.sql && echo "dc_ trên bản chép: $("${P[@]}" -tA -c "SELECT count(*) FROM pg_namespace WHERE nspname ~ '^dc_'")" && "${P[@]}" -c "CREATE SCHEMA IF NOT EXISTS dc_thu_e6; CREATE OR REPLACE VIEW dc_thu_e6.sale_offers AS SELECT * FROM public.sale_offer_records WHERE false" && echo "đối chứng PD-AC-1: không lọc $("${P[@]}" -tA -c "SELECT count(*) FROM information_schema.columns WHERE table_name = 'sale_offers' AND column_name = 'field_provenance'") · lọc current_schema $("${P[@]}" -tA -c "SELECT count(*) FROM information_schema.columns WHERE table_schema = current_schema() AND table_name = 'sale_offers' AND column_name = 'field_provenance'")" && cd pipeline && DATABASE_URL=postgres://oneinvest:oneinvest@localhost:5433/oneinvest_p2_pd node --test --test-concurrency=1 scripts/phat-bieu-db.itest.mjs: BLOCKED ha tang baseline: lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.»
- cd app && node --import tsx scripts/dc-tu-don.ts: BLOCKED ha tang baseline: lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.»
- cd pipeline && npm test: BLOCKED ha tang baseline: lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.»
- cd app && npm test: BLOCKED ha tang baseline: lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.»
- cd app && npx tsc --noEmit && npm run lint: BLOCKED ha tang baseline: lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.»

## Variance

none — mọi eval chạy một lần, không có eval ngẫu nhiên.

## Iterations

Round 1: E8 failed — `pipeline/scripts/idem-063.mjs:54` gọi `apply_enrichment` ngoài ma trận vai của bộ kiểm PB-AC-6. Returned to implementation.
