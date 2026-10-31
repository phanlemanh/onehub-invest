---
schema_version: 2
feature_slug: thoi-gian-va-hieu-luc
verdict: PASS
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: d92a2782e9126a694cb9184c4eca43dae0b1a807
human_signoff: Mạnh 2026-10-30
---

# Evidence Report: thoi-gian-va-hieu-luc

Round 2. Mọi eval máy đều xanh. Còn một mục judgment (E15) chờ người chốt ở Cổng 2, nên verdict là PENDING-JUDGMENT.

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
| E15 | AC-9 | judgment | UNCERTAIN |

## Evidence

- eval: E1
  run_id: minted-thoi-gian-va-hieu-luc-E1-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.tg_db
  verified_at: 2026-10-30T15:15:05Z
  output: |
    cd pipeline && DATABASE_URL=${TG_DB_URL:-postgres://oneinvest:oneinvest@localhost:5433/oneinvest_p2_tg} node --test --test-concurrency=1 scripts/trang-thai-chao.itest.mjs scripts/bac-du-lieu.itest.mjs
    ℹ duration_ms 6223.2015

- eval: E2
  run_id: minted-thoi-gian-va-hieu-luc-E2-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.tg_db
  verified_at: 2026-10-30T15:15:05Z
  output: |
    (cùng lệnh với E1, một lần chạy phủ E1–E7)
    ℹ duration_ms 6223.2015

- eval: E3
  run_id: minted-thoi-gian-va-hieu-luc-E3-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.tg_db
  verified_at: 2026-10-30T15:15:05Z
  output: |
    (cùng lệnh với E1, một lần chạy phủ E1–E7)
    ℹ duration_ms 6223.2015

- eval: E4
  run_id: minted-thoi-gian-va-hieu-luc-E4-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.tg_db
  verified_at: 2026-10-30T15:15:05Z
  output: |
    (cùng lệnh với E1, một lần chạy phủ E1–E7)
    ℹ duration_ms 6223.2015

- eval: E5
  run_id: minted-thoi-gian-va-hieu-luc-E5-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.tg_db
  verified_at: 2026-10-30T15:15:05Z
  output: |
    (cùng lệnh với E1, một lần chạy phủ E1–E7)
    ℹ duration_ms 6223.2015

- eval: E6
  run_id: minted-thoi-gian-va-hieu-luc-E6-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.tg_db
  verified_at: 2026-10-30T15:15:05Z
  output: |
    (cùng lệnh với E1, một lần chạy phủ E1–E7)
    ℹ duration_ms 6223.2015

- eval: E7
  run_id: minted-thoi-gian-va-hieu-luc-E7-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.tg_db
  verified_at: 2026-10-30T15:15:05Z
  output: |
    (cùng lệnh với E1, một lần chạy phủ E1–E7)
    ℹ duration_ms 6223.2015

- eval: E8
  run_id: minted-thoi-gian-va-hieu-luc-E8-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.tg_roundtrip
  verified_at: 2026-10-30T15:15:05Z
  output: |
    cd pipeline && node scripts/trang-thai-roundtrip.mjs
    AC-8 lỗi chạy → thoát 1

- eval: E9
  run_id: minted-thoi-gian-va-hieu-luc-E9-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.job_exit
  verified_at: 2026-10-30T15:15:05Z
  output: |
    node --test scripts/job-exit.test.mjs
    ℹ duration_ms 4304.8685

- eval: E10
  run_id: minted-thoi-gian-va-hieu-luc-E10-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.idem_059
  verified_at: 2026-10-30T15:15:05Z
  output: |
    IDEMPOTENT PASS (có dữ liệu)

- eval: E11
  run_id: minted-thoi-gian-va-hieu-luc-E11-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.vocab_check
  verified_at: 2026-10-30T15:15:05Z
  output: |
    vocab --check: 4/4 đích khớp sổ

- eval: E12
  run_id: minted-thoi-gian-va-hieu-luc-E12-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.pipeline
  verified_at: 2026-10-30T15:15:05Z
  output: |
    cd pipeline && npm test
    ℹ duration_ms 58123.321

- eval: E13
  run_id: minted-thoi-gian-va-hieu-luc-E13-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.app_ui
  verified_at: 2026-10-30T15:15:05Z
  output: |
    cd app && npm test
    ℹ duration_ms 46058.03475

- eval: E14
  run_id: minted-thoi-gian-va-hieu-luc-E14-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.app
  verified_at: 2026-10-30T15:15:05Z
  output: |
    cd app && npx tsc --noEmit && npm run lint
    (typecheck và lint không báo lỗi)

- eval: E15
  judged_by: hội đồng ba lăng kính (đề xuất, panel giữ nguyên từ round 2)
  verdict: UNCERTAIN
  rationale: Panel giữ nguyên từ round 2 — inputs không đổi, không chấm lại; rationale xem round đó. Đề xuất PASS, chờ người chốt ở Cổng 2.
  required_evidence:
    - (judge không nêu bằng-chứng-thiếu)
  human_override: Mạnh 2026-10-30 — Đạt
  panel_proposal: PASS
  votes:
    - domain-correctness: PASS (r2)
    - operational-feasibility: PASS (r2)
    - spec-alignment: PASS (r2)

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-thoi-gian-va-hieu-luc-SUITE-npm_test-r2
  exit_code: 0
  verified_at: 2026-10-30T15:15:05Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-thoi-gian-va-hieu-luc-SUITE-test_lint_rules-r2
  exit_code: 0
  verified_at: 2026-10-30T15:15:05Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-thoi-gian-va-hieu-luc-SUITE-node_scripts_check_portal_compliance_mjs-r2
  exit_code: 0
  verified_at: 2026-10-30T15:15:05Z

## Known limits

## Ngoài hợp đồng

## Analyst

baseline: BLOCKED ha tang — lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «<\tool_use_error>Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.<\/tool_use_error>»

Danh sách eval không-phân-biệt không đo được ở round này vì toàn bộ baseline bị chặn hạ tầng; mọi field baseline là n-a.

Baseline khong do:
- cd pipeline && DATABASE_URL=${TG_DB_URL:-postgres://oneinvest:oneinvest@localhost:5433/oneinvest_p2_tg} node --test --test-concurrency=1 scripts/trang-thai-chao.itest.mjs scripts/bac-du-lieu.itest.mjs: BLOCKED ha tang baseline: lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «<\tool_use_error>Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.<\/tool_use_error>»
- cd pipeline && DATABASE_URL=${TG_DB_URL:-postgres://oneinvest:oneinvest@localhost:5433/oneinvest_p2_tg} node scripts/trang-thai-roundtrip.mjs: BLOCKED ha tang baseline: lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «<\tool_use_error>Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.<\/tool_use_error>»
- node --test scripts/job-exit.test.mjs: BLOCKED ha tang baseline: lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «<\tool_use_error>Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.<\/tool_use_error>»
- bash db/check-idempotent-tam.sh db/migrations/059_thoi_gian_hieu_luc.sql history_transactional ref_lookup ref_field_lookup && bash db/db-thu.sh oneinvest_p2_idem >/dev/null && (cd pipeline && DATABASE_URL=postgres://oneinvest:oneinvest@localhost:5433/oneinvest_p2_idem node scripts/idem-059.mjs); rc=$?; bash db/db-thu.sh oneinvest_p2_idem --xoa >/dev/null; exit $rc: BLOCKED ha tang baseline: lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «<\tool_use_error>Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.<\/tool_use_error>»
- node pipeline/vocab.mjs --check: BLOCKED ha tang baseline: lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «<\tool_use_error>Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.<\/tool_use_error>»
- cd pipeline && npm test: BLOCKED ha tang baseline: lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «<\tool_use_error>Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.<\/tool_use_error>»
- cd app && npm test: BLOCKED ha tang baseline: lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «<\tool_use_error>Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.<\/tool_use_error>»
- cd app && npx tsc --noEmit && npm run lint: BLOCKED ha tang baseline: lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «<\tool_use_error>Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.<\/tool_use_error>»

none — moi eval feature deu red tren baseline (co phan biet) — KHONG do duoc o round nay vi baseline bi chan ha tang (xem tren).

## Variance

none — every multi-run eval is uniform

## Iterations

Round 1: S4 vòng 1 và vòng 2 bị từ chối ở các vòng trước (E8 deadlock khi chạy cùng tg_db; thiếu đối chứng dương cho AC-6). Đã vá ở 8991f1e8, Mạnh chọn chấm thêm một lượt.
Round 2: E1–E14 xanh trên cây 254c5f63; E15 chờ người chốt ở Cổng 2 (panel giữ nguyên từ round 2, đề xuất PASS).

### Re-pin lần 1 — 2026-10-30, do hoá cũ do gộp origin/main sau chữ ký
run_id: repin-20261030T165552Z-38198
sha: 0941a2194d9a978c7a423527235032f3ce673d72 · suites: 6 lệnh exit 0 · evals: 14/14 eval máy đạt kỳ vọng · ngoài làn máy: E15 (E15 không khai paths)

### Re-pin lần 2 — 2026-10-30, do hoá cũ do gộp origin/main (#215) sau chữ ký
run_id: repin-20261030T171310Z-11596
sha: 077625a5826090375bbe9ac3cf02b9bedc6d45ba · suites: 6 lệnh exit 0 · evals: 14/14 eval máy đạt kỳ vọng · ngoài làn máy: E15 (E15 không khai paths)

### Re-pin lần 3 — 2026-10-30, do sửa test thẻ duyệt cho observed_at (CI app)
run_id: repin-20261030T172852Z-94366
sha: 9c2fbc0cf29959285fd1012c1a1f2285eedfa487 · suites: 6 lệnh exit 0 · evals: 14/14 eval máy đạt kỳ vọng · ngoài làn máy: E15 (E15 không khai paths) · chập chờn (đỏ lần đầu, đạt khi chạy lại): suite 3/6

### Re-pin lần 4 — 2026-10-31, do lỗi tích hợp SD5: dãy bước cloud-sync thêm do-danh-ba-sdt; idem-059 chiều đỏ chạy trên nền trước 059
run_id: repin-20261031T001653Z-71523
sha: 55f3b9522b914d7eafe4f3bb4c0540f78e8938c2 · suites: 6 lệnh exit 0 · evals: 14/14 eval máy đạt kỳ vọng · ngoài làn máy: E15 (E15 không khai paths)

### Re-pin lần 5 — 2026-10-31, do HD11 thêm bước do-the-duyet cuối cloud-sync; dãy bước trong job-exit.test.mjs đổi
run_id: repin-20261031T005125Z-17275
sha: 8dda79719fd65ed5e5e914cdb35ec85dcc1b2c81 · suites: 6 lệnh exit 0 · evals: 14/14 eval máy đạt kỳ vọng · ngoài làn máy: E15 (E15 không khai paths) · chập chờn (đỏ lần đầu, đạt khi chạy lại): suite 3/6

### Re-pin lần 6 — 2026-10-31, do gộp main 4307a0b8 vào nhánh HD11
run_id: repin-20261031T013406Z-45800
sha: 585687ac614970e3f37c2a36c77485ef81fe85a3 · suites: 6 lệnh exit 0 · evals: 14/14 eval máy đạt kỳ vọng · ngoài làn máy: E15 (E15 không khai paths)

### Re-pin lần 7 — 2026-10-31, do gộp main kit 2.36 vào nhánh HD11 trước chữ ký
run_id: repin-20261031T024948Z-82872
sha: 1e669d2e98c2f385196a913762013e47e6279807 · suites: 6 lệnh exit 0 · evals: 14/14 eval máy đạt kỳ vọng · ngoài làn máy: E15 (E15 không khai paths)

### Re-pin lần 8 — 2026-10-31, do gộp main 04e35c5d vào nhánh HD11
run_id: repin-20261031T030713Z-55767
sha: d92a2782e9126a694cb9184c4eca43dae0b1a807 · suites: 6 lệnh exit 0 · evals: 14/14 eval máy đạt kỳ vọng · ngoài làn máy: E15 (E15 không khai paths)
