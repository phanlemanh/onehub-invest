---
schema_version: 2
feature_slug: thoi-gian-va-hieu-luc
verdict: PENDING-JUDGMENT
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: a8019a2600892b1eedee19f1ebd0db4174fa8bdf
human_signoff:
---

# Evidence Report: thoi-gian-va-hieu-luc

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | test | PASS |
| E2 | AC-2 | test | PASS |
| E3 | AC-3 | test | PASS |
| E4 | AC-4 | test | PASS |
| E5 | AC-5 | test | PASS |
| E6 | AC-6 | test | PASS |
| E7 | AC-7 | test | PASS |
| E8 | AC-8 | script | PASS |
| E9 | AC-9 | test | PASS |
| E10 | AC-9 | script | PASS |
| E11 | AC-9 | script | PASS |
| E12 | AC-9 | test | PASS |
| E13 | AC-9 | test | PASS |
| E14 | AC-9 | test | PASS |
| E15 | AC-9 | judgment | PASS (panel đề xuất, chờ người chốt ở Cổng 2) |

## Evidence

- eval: E1
  run_id: minted-thoi-gian-va-hieu-luc-E1-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.tg_db
  verified_at: 2026-10-30T14:29:35Z
  output: |
    cmd: cd pipeline && DATABASE_URL=${TG_DB_URL:-postgres://oneinvest:oneinvest@localhost:5433/oneinvest_p2_tg} node --test scripts/trang-thai-chao.itest.mjs (một lần chạy chung cho E1–E7, 1/1 lần đạt)
    ℹ duration_ms 4523.011166

- eval: E2
  run_id: minted-thoi-gian-va-hieu-luc-E2-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.tg_db
  verified_at: 2026-10-30T14:29:35Z
  output: |
    cmd: cd pipeline && DATABASE_URL=${TG_DB_URL:-postgres://oneinvest:oneinvest@localhost:5433/oneinvest_p2_tg} node --test scripts/trang-thai-chao.itest.mjs (một lần chạy chung cho E1–E7, 1/1 lần đạt)
    ℹ duration_ms 4523.011166

- eval: E3
  run_id: minted-thoi-gian-va-hieu-luc-E3-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.tg_db
  verified_at: 2026-10-30T14:29:35Z
  output: |
    cmd: cd pipeline && DATABASE_URL=${TG_DB_URL:-postgres://oneinvest:oneinvest@localhost:5433/oneinvest_p2_tg} node --test scripts/trang-thai-chao.itest.mjs (một lần chạy chung cho E1–E7, 1/1 lần đạt)
    ℹ duration_ms 4523.011166

- eval: E4
  run_id: minted-thoi-gian-va-hieu-luc-E4-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.tg_db
  verified_at: 2026-10-30T14:29:35Z
  output: |
    cmd: cd pipeline && DATABASE_URL=${TG_DB_URL:-postgres://oneinvest:oneinvest@localhost:5433/oneinvest_p2_tg} node --test scripts/trang-thai-chao.itest.mjs (một lần chạy chung cho E1–E7, 1/1 lần đạt)
    ℹ duration_ms 4523.011166

- eval: E5
  run_id: minted-thoi-gian-va-hieu-luc-E5-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.tg_db
  verified_at: 2026-10-30T14:29:35Z
  output: |
    cmd: cd pipeline && DATABASE_URL=${TG_DB_URL:-postgres://oneinvest:oneinvest@localhost:5433/oneinvest_p2_tg} node --test scripts/trang-thai-chao.itest.mjs (một lần chạy chung cho E1–E7, 1/1 lần đạt)
    ℹ duration_ms 4523.011166

- eval: E6
  run_id: minted-thoi-gian-va-hieu-luc-E6-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.tg_db
  verified_at: 2026-10-30T14:29:35Z
  output: |
    cmd: cd pipeline && DATABASE_URL=${TG_DB_URL:-postgres://oneinvest:oneinvest@localhost:5433/oneinvest_p2_tg} node --test scripts/trang-thai-chao.itest.mjs (một lần chạy chung cho E1–E7, 1/1 lần đạt)
    ℹ duration_ms 4523.011166

- eval: E7
  run_id: minted-thoi-gian-va-hieu-luc-E7-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.tg_db
  verified_at: 2026-10-30T14:29:35Z
  output: |
    cmd: cd pipeline && DATABASE_URL=${TG_DB_URL:-postgres://oneinvest:oneinvest@localhost:5433/oneinvest_p2_tg} node --test scripts/trang-thai-chao.itest.mjs (một lần chạy chung cho E1–E7, 1/1 lần đạt)
    ℹ duration_ms 4523.011166

- eval: E8
  run_id: minted-thoi-gian-va-hieu-luc-E8-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.tg_roundtrip
  verified_at: 2026-10-30T14:29:35Z
  output: |
    cmd: cd pipeline && DATABASE_URL=${TG_DB_URL:-postgres://oneinvest:oneinvest@localhost:5433/oneinvest_p2_tg} node scripts/trang-thai-roundtrip.mjs (1/1 lần đạt)
    AC-8 lỗi chạy → thoát 1

- eval: E9
  run_id: minted-thoi-gian-va-hieu-luc-E9-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.job_exit
  verified_at: 2026-10-30T14:29:35Z
  output: |
    cmd: node --test scripts/job-exit.test.mjs (1/1 lần đạt)
    ℹ duration_ms 4020.631541

- eval: E10
  run_id: minted-thoi-gian-va-hieu-luc-E10-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.idem_059
  verified_at: 2026-10-30T14:29:35Z
  output: |
    cmd: bash db/check-idempotent-tam.sh db/migrations/059_thoi_gian_hieu_luc.sql history_transactional ref_lookup ref_field_lookup (1/1 lần đạt)
    IDEMPOTENT PASS

- eval: E11
  run_id: minted-thoi-gian-va-hieu-luc-E11-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.vocab_check
  verified_at: 2026-10-30T14:29:35Z
  output: |
    cmd: node pipeline/vocab.mjs --check (1/1 lần đạt)
    vocab --check: 4/4 đích khớp sổ

- eval: E12
  run_id: minted-thoi-gian-va-hieu-luc-E12-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.pipeline
  verified_at: 2026-10-30T14:29:35Z
  output: |
    cmd: cd pipeline && npm test (1/1 lần đạt)
    ℹ duration_ms 44523.686916

- eval: E13
  run_id: minted-thoi-gian-va-hieu-luc-E13-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.app_ui
  verified_at: 2026-10-30T14:29:35Z
  output: |
    cmd: cd app && npm test (1/1 lần đạt)
    ℹ duration_ms 42588.263583

- eval: E14
  run_id: minted-thoi-gian-va-hieu-luc-E14-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.app
  verified_at: 2026-10-30T14:29:35Z
  output: |
    cmd: cd app && npx tsc --noEmit && npm run lint (1/1 lần đạt)
    (đầu ra rỗng: typecheck và lint không báo lỗi)

- eval: E15
  judged_by: judge panel đề xuất (3 lens, fresh context) — chưa có người chốt
  verdict: PASS
  rationale: Panel đề xuất PASS; cả ba lens thấy CONTEXT.md có khối in đậm «Trạng thái chào» và «Lịch sử giá», và mappings.yaml có trục offer_status (cột sale_offer_records.offer_status) cùng trục assertion_field (cột field_assertions.field). Đây chỉ là đề xuất, người chốt ở Cổng 2.
  votes:
    - domain-correctness: PASS — CONTEXT.md có khối in đậm «Trạng thái chào» (nêu cột sale_offer_records.offer_status, luật «Chỉ đổi theo bằng chứng, quá cửa sổ không đổi») và «Lịch sử giá» (nêu bảng history_transactional, gom theo căn qua view property_price_history). mappings.yaml có trục offer_status với columns [sale_offer_records.offer_status], và trục assertion_field với columns [field_assertions.field] cùng giá trị offer_status.
    - operational-feasibility: PASS — CONTEXT.md dòng 156-157 có khối in đậm «Trạng thái chào», nêu cột `sale_offer_records.offer_status` và luật «Chỉ đổi theo bằng chứng, quá cửa sổ không đổi». Dòng 190-191 có khối in đậm «Lịch sử giá», nêu bảng `history_transactional` và việc gom theo căn. Trong mappings.yaml, trục `offer_status` (dòng 427-430) có `columns: [sale_offer_records.offer_status]`, và trục `assertion_field` (dòng 324-330) có `columns: [field_assertions.field]`. Hai trục này nằm cùng cấp thụt lề.
    - spec-alignment: PASS — CONTEXT.md dòng 156-158 có khối in đậm «Trạng thái chào» nêu cột `sale_offer_records.offer_status` và luật «Chỉ đổi theo bằng chứng, quá cửa sổ không đổi». Dòng 190-191 có khối in đậm «Lịch sử giá» nêu bảng `history_transactional` và việc gom theo căn. Trong mappings.yaml, trục `offer_status` (dòng 427-430) có `columns: [sale_offer_records.offer_status]`, và trục `assertion_field` (dòng 324-338) có `columns: [field_assertions.field]` với giá trị `offer_status`.
  human_override:  # chi nguoi ghi

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-thoi-gian-va-hieu-luc-SUITE-npm_test-r1
  exit_code: 0
  verified_at: 2026-10-30T14:29:35Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-thoi-gian-va-hieu-luc-SUITE-test_lint_rules-r1
  exit_code: 0
  verified_at: 2026-10-30T14:29:35Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-thoi-gian-va-hieu-luc-SUITE-node_scripts_check_portal_compliance_mjs-r1
  exit_code: 0
  verified_at: 2026-10-30T14:29:35Z

## Known limits

## Ngoài hợp đồng

Có 4 lỗi ngoài hợp đồng chưa qua bác bỏ đối kháng, người quyết ở Cổng 2 (chi tiết ở review-findings.md): probe mgn_mu chèn field_assertions thiếu observed_at (đề xuất new-contract); test nạp 059 chỉ giữ khoá 56056 (đề xuất known-limits); phat-bieu-db.itest nạp lại 045 làm hàm chặn tụt về bản cũ (đề xuất known-limits); «đếm độc lập» của AC-8 dùng chung câu SQL với CLI (đề xuất known-limits).

## Analyst

baseline: BLOCKED ha tang — lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «<\tool_use_error>Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.<\/tool_use_error>»

Eval không-phân-biệt: không đo được ở round này. Baseline bị chặn hạ tầng nên mọi field baseline là n-a; chưa eval nào được xác nhận là phân biệt, cũng chưa eval nào bị xác nhận là không-phân-biệt.

Hai phép đo yếu trong hợp đồng (chi tiết ở review-findings.md, mục Trong hợp đồng): E7 hứa «bộ itest PL16 vẫn xanh» nhưng lệnh của nó không chạy bac-du-lieu.itest.mjs; E10 đo tính lũy đẳng của 059 trên DB chỉ có lược đồ nên bước điền lùi history_transactional chạy trên bảng rỗng.

### Baseline khong do

- cd pipeline && DATABASE_URL=${TG_DB_URL:-postgres://oneinvest:oneinvest@localhost:5433/oneinvest_p2_tg} node --test scripts/trang-thai-chao.itest.mjs: BLOCKED ha tang baseline: lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «<\tool_use_error>Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.<\/tool_use_error>»
- cd pipeline && DATABASE_URL=${TG_DB_URL:-postgres://oneinvest:oneinvest@localhost:5433/oneinvest_p2_tg} node scripts/trang-thai-roundtrip.mjs: BLOCKED ha tang baseline: lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «<\tool_use_error>Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.<\/tool_use_error>»
- node --test scripts/job-exit.test.mjs: BLOCKED ha tang baseline: lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «<\tool_use_error>Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.<\/tool_use_error>»
- bash db/check-idempotent-tam.sh db/migrations/059_thoi_gian_hieu_luc.sql history_transactional ref_lookup ref_field_lookup: BLOCKED ha tang baseline: lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «<\tool_use_error>Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.<\/tool_use_error>»
- node pipeline/vocab.mjs --check: BLOCKED ha tang baseline: lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «<\tool_use_error>Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.<\/tool_use_error>»
- cd pipeline && npm test: BLOCKED ha tang baseline: lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «<\tool_use_error>Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.<\/tool_use_error>»
- cd app && npm test: BLOCKED ha tang baseline: lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «<\tool_use_error>Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.<\/tool_use_error>»
- cd app && npx tsc --noEmit && npm run lint: BLOCKED ha tang baseline: lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «<\tool_use_error>Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.<\/tool_use_error>»

## Variance

none — mọi eval chạy một lần, xác định; không có eval ngẫu nhiên nhiều lần chạy nên không có pass_rate hỗn hợp

## Iterations

Round 1: 14 eval máy đều đạt, không eval nào đỏ. E15 (judgment) có đề xuất PASS từ panel ba lens nhưng chưa có human_override nên verdict giữ PENDING-JUDGMENT. Baseline bị chặn hạ tầng nên mọi field baseline là n-a. Giờ chạy chính xác không đo được nên verified_at ghi theo ngày chạy.
