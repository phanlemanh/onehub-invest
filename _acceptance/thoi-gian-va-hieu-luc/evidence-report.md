---
schema_version: 2
feature_slug: thoi-gian-va-hieu-luc
verdict: REJECT
failed_evals: ["E8"]
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 606ecf6539c8f1c80b0165a3dfe28e2516ab30d5
human_signoff:
---

# Evidence Report: thoi-gian-va-hieu-luc

Round 2. Nội dung này thay trọn round cũ; lịch sử round nằm ở mục Iterations.

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | test | PASS |
| E2 | AC-2 | test | PASS |
| E3 | AC-3 | test | PASS |
| E4 | AC-4 | test | PASS |
| E5 | AC-5 | test | PASS |
| E6 | AC-6 | test | PASS |
| E7 | AC-7 | test | PASS |
| E8 | AC-8 | script | FAIL |
| E9 | AC-9 | test | PASS |
| E10 | AC-9 | script | PASS |
| E11 | AC-9 | script | PASS |
| E12 | AC-9 | test | PASS |
| E13 | AC-9 | test | PASS |
| E14 | AC-9 | test | PASS |
| E15 | AC-9 | judgment | PASS (đề xuất của hội đồng, chờ human_override) |

## Evidence

- eval: E1
  run_id: minted-thoi-gian-va-hieu-luc-E1-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.tg_db
  verified_at: 2026-10-30T14:44:15Z
  output: |
    Lệnh: cd pipeline && node --test --test-concurrency=1 scripts/trang-thai-chao.itest.mjs scripts/bac-du-lieu.itest.mjs (DB thử oneinvest_p2_tg)
    ℹ duration_ms 5650.953542

- eval: E2
  run_id: minted-thoi-gian-va-hieu-luc-E2-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.tg_db
  verified_at: 2026-10-30T14:44:15Z
  output: |
    Lệnh: cd pipeline && node --test --test-concurrency=1 scripts/trang-thai-chao.itest.mjs scripts/bac-du-lieu.itest.mjs (DB thử oneinvest_p2_tg)
    ℹ duration_ms 5650.953542

- eval: E3
  run_id: minted-thoi-gian-va-hieu-luc-E3-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.tg_db
  verified_at: 2026-10-30T14:44:15Z
  output: |
    Lệnh: cd pipeline && node --test --test-concurrency=1 scripts/trang-thai-chao.itest.mjs scripts/bac-du-lieu.itest.mjs (DB thử oneinvest_p2_tg)
    ℹ duration_ms 5650.953542

- eval: E4
  run_id: minted-thoi-gian-va-hieu-luc-E4-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.tg_db
  verified_at: 2026-10-30T14:44:15Z
  output: |
    Lệnh: cd pipeline && node --test --test-concurrency=1 scripts/trang-thai-chao.itest.mjs scripts/bac-du-lieu.itest.mjs (DB thử oneinvest_p2_tg)
    ℹ duration_ms 5650.953542

- eval: E5
  run_id: minted-thoi-gian-va-hieu-luc-E5-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.tg_db
  verified_at: 2026-10-30T14:44:15Z
  output: |
    Lệnh: cd pipeline && node --test --test-concurrency=1 scripts/trang-thai-chao.itest.mjs scripts/bac-du-lieu.itest.mjs (DB thử oneinvest_p2_tg)
    ℹ duration_ms 5650.953542

- eval: E6
  run_id: minted-thoi-gian-va-hieu-luc-E6-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.tg_db
  verified_at: 2026-10-30T14:44:15Z
  output: |
    Lệnh: cd pipeline && node --test --test-concurrency=1 scripts/trang-thai-chao.itest.mjs scripts/bac-du-lieu.itest.mjs (DB thử oneinvest_p2_tg)
    ℹ duration_ms 5650.953542

- eval: E7
  run_id: minted-thoi-gian-va-hieu-luc-E7-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.tg_db
  verified_at: 2026-10-30T14:44:15Z
  output: |
    Lệnh: cd pipeline && node --test --test-concurrency=1 scripts/trang-thai-chao.itest.mjs scripts/bac-du-lieu.itest.mjs (DB thử oneinvest_p2_tg)
    ℹ duration_ms 5650.953542

- eval: E8
  run_id: minted-thoi-gian-va-hieu-luc-E8-r2
  exit_code: 1
  baseline: n-a
  verifier: config:executors.script.tg_roundtrip
  verified_at: 2026-10-30T14:44:15Z
  output: |
    AC-8 lần một: 28980 tin · active 28646 · active_under_contract 0 · closed 0 · withdrawn 0 · unknown 334 · 0 phát biểu mới · tổng khớp
    AC-8 lần hai: 0 phát biểu mới, cùng đếm
    AC-8 tin sống unknown: 0
    AC-8 withdrawn = 0 = 0 tin S06 het_trong_luot đếm độc lập
    AC-8 tin S03/S05 het_trong_luot không thành withdrawn: 37 (vắng lượt nhóm không phải bằng chứng gỡ — AC-4)
    trang-thai-roundtrip: deadlock detected
  ghi chú: script dừng với lỗi deadlock sau bốn dòng AC-8 đầu; không thấy dòng «AC-8 căn bị vế lịch sử giá loại» và không thấy dòng chiều đỏ «AC-8 lỗi chạy → thoát» mà expected đòi, nên eval không đạt.

- eval: E9
  run_id: minted-thoi-gian-va-hieu-luc-E9-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.job_exit
  verified_at: 2026-10-30T14:44:15Z
  output: |
    Lệnh: node --test scripts/job-exit.test.mjs
    ℹ duration_ms 4191.83

- eval: E10
  run_id: minted-thoi-gian-va-hieu-luc-E10-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.idem_059
  verified_at: 2026-10-30T14:44:15Z
  output: |
    IDEMPOTENT PASS (có dữ liệu)

- eval: E11
  run_id: minted-thoi-gian-va-hieu-luc-E11-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.vocab_check
  verified_at: 2026-10-30T14:44:15Z
  output: |
    vocab --check: 4/4 đích khớp sổ

- eval: E12
  run_id: minted-thoi-gian-va-hieu-luc-E12-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.pipeline
  verified_at: 2026-10-30T14:44:15Z
  output: |
    Lệnh: cd pipeline && npm test
    ℹ duration_ms 49346.1165

- eval: E13
  run_id: minted-thoi-gian-va-hieu-luc-E13-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.app_ui
  verified_at: 2026-10-30T14:44:15Z
  output: |
    Lệnh: cd app && npm test
    ℹ duration_ms 41938.748542

- eval: E14
  run_id: minted-thoi-gian-va-hieu-luc-E14-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.app
  verified_at: 2026-10-30T14:44:15Z
  output: |
    Lệnh: cd app && npx tsc --noEmit && npm run lint
    (không có dòng lỗi)

- eval: E15
  judged_by: judge panel (fresh context, ba lăng kính)
  verdict: PASS
  rationale: Đề xuất của hội đồng. CONTEXT.md có hai khối in đậm «Trạng thái chào» (cột sale_offer_records.offer_status, «chỉ đổi theo bằng chứng, quá cửa sổ không đổi») và «Lịch sử giá» (bảng history_transactional, gom theo căn qua view property_price_history); mappings.yaml có trục offer_status (columns sale_offer_records.offer_status) và trục assertion_field (columns field_assertions.field).
  votes:
    - domain-correctness: PASS — CONTEXT.md có hai khối in đậm «Trạng thái chào» (nêu cột sale_offer_records.offer_status, «chỉ đổi theo bằng chứng, quá cửa sổ không đổi») và «Lịch sử giá» (nêu bảng history_transactional, gom theo căn qua view property_price_history). mappings.yaml có trục offer_status với columns [sale_offer_records.offer_status], và trục assertion_field với columns [field_assertions.field] kèm giá trị offer_status.
    - operational-feasibility: PASS — CONTEXT.md có khối in đậm «Trạng thái chào» (dòng 156-157) nêu cột sale_offer_records.offer_status và luật «Chỉ đổi theo bằng chứng, quá cửa sổ không đổi». Khối «Lịch sử giá» (dòng 190-191) nêu bảng history_transactional và «gom theo căn». Trong pipeline/mappings.yaml, trục offer_status có columns [sale_offer_records.offer_status] (dòng 430), và trục assertion_field có columns [field_assertions.field] (dòng 330) cùng giá trị offer_status.
    - spec-alignment: PASS — CONTEXT.md có khối in đậm «Trạng thái chào» (cột sale_offer_records.offer_status, «Chỉ đổi theo bằng chứng, quá cửa sổ không đổi») và «Lịch sử giá» (bảng history_transactional, «gom theo căn»). Trong mappings.yaml, trục offer_status có columns [sale_offer_records.offer_status], và trục assertion_field có columns [field_assertions.field] kèm value offer_status.
  human_override:  # chi nguoi ghi

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-thoi-gian-va-hieu-luc-SUITE-npm_test-r2
  exit_code: 0
  verified_at: 2026-10-30T14:44:15Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-thoi-gian-va-hieu-luc-SUITE-test_lint_rules-r2
  exit_code: 0
  verified_at: 2026-10-30T14:44:15Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-thoi-gian-va-hieu-luc-SUITE-node_scripts_check_portal_compliance_mjs-r2
  exit_code: 0
  verified_at: 2026-10-30T14:44:15Z

Lệnh fail không gắn eval nào: không có. Lệnh fail duy nhất là lệnh của E8 (cd pipeline && DATABASE_URL=${TG_DB_URL:-postgres://oneinvest:oneinvest@localhost:5433/oneinvest_p2_tg} node scripts/trang-thai-roundtrip.mjs), đã gắn eval E8.

## Known limits

## Ngoài hợp đồng

## Analyst

baseline: BLOCKED ha tang — lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.»

Mọi field baseline ở round này là n-a, nên danh sách eval không-phân-biệt KHÔNG đo được ở round này; không thể khẳng định eval nào có phân biệt code cũ với code mới.

Baseline khong do:
- cd pipeline && DATABASE_URL=${TG_DB_URL:-postgres://oneinvest:oneinvest@localhost:5433/oneinvest_p2_tg} node --test --test-concurrency=1 scripts/trang-thai-chao.itest.mjs scripts/bac-du-lieu.itest.mjs: BLOCKED ha tang baseline: lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.»
- cd pipeline && DATABASE_URL=${TG_DB_URL:-postgres://oneinvest:oneinvest@localhost:5433/oneinvest_p2_tg} node scripts/trang-thai-roundtrip.mjs: BLOCKED ha tang baseline: lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.»
- node --test scripts/job-exit.test.mjs: BLOCKED ha tang baseline: lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.»
- bash db/check-idempotent-tam.sh db/migrations/059_thoi_gian_hieu_luc.sql history_transactional ref_lookup ref_field_lookup && bash db/db-thu.sh oneinvest_p2_idem >/dev/null && (cd pipeline && DATABASE_URL=postgres://oneinvest:oneinvest@localhost:5433/oneinvest_p2_idem node scripts/idem-059.mjs); rc=$?; bash db/db-thu.sh oneinvest_p2_idem --xoa >/dev/null; exit $rc: BLOCKED ha tang baseline: lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.»
- node pipeline/vocab.mjs --check: BLOCKED ha tang baseline: lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.»
- cd pipeline && npm test: BLOCKED ha tang baseline: lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.»
- cd app && npm test: BLOCKED ha tang baseline: lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.»
- cd app && npx tsc --noEmit && npm run lint: BLOCKED ha tang baseline: lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.»

## Variance

none — mọi eval chạy một lần, xác định; không eval nào có pass_rate lẫn lộn.

## Iterations

Round 1: kết quả chi tiết của vòng này nằm ở gói bằng chứng r1 đã commit (cc3463bd, 606ecf65); không được truyền kèm ở lần soạn này nên không chép lại.
Round 2: E8 failed — trang-thai-roundtrip.mjs báo «deadlock detected» sau bốn dòng AC-8 đầu, chưa in dòng «căn bị vế lịch sử giá loại» và chưa chạy chiều đỏ. Trả về cho khâu triển khai.
