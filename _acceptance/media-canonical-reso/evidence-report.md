---
schema_version: 2
feature_slug: media-canonical-reso
verdict: REJECT
failed_evals: [E12]
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 57b519f8c90d7f5d9dd1a4ca47aed34d1400a4e9
human_signoff:
---

# Evidence Report: media-canonical-reso

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | test | PASS |
| E2 | AC-1 | test | PASS |
| E3 | AC-2 | test | PASS |
| E4 | AC-3 | test | PASS |
| E5 | AC-4 | test | PASS |
| E6 | AC-5 | test | PASS |
| E7 | AC-6 | test | PASS |
| E8 | AC-7 | script | PASS |
| E9 | AC-8 | ui-check | PASS |
| E10 | AC-9 | test | PASS |
| E11 | AC-10 | test | PASS |
| E12 | AC-10 | script | FAIL |
| E13 | AC-6 | script | PASS |
| E14 | AC-10 | test | PASS |
| E15 | AC-10 | test | PASS |

## Evidence

- eval: E1
  run_id: minted-media-canonical-reso-E1-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.media_db
  verified_at: 2026-10-30T03:45:42Z
  output: |
    cd pipeline && DATABASE_URL=${MEDIA_DB_URL:-postgres://oneinvest:oneinvest@localhost:5433/oneinvest_p2_media} node --test scripts/media-canonical.itest.mjs
    ℹ duration_ms 15653.376834

- eval: E3
  run_id: minted-media-canonical-reso-E3-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.media_db
  verified_at: 2026-10-30T03:45:42Z
  output: |
    (cùng lệnh với E1) ℹ duration_ms 15653.376834

- eval: E5
  run_id: minted-media-canonical-reso-E5-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.media_db
  verified_at: 2026-10-30T03:45:42Z
  output: |
    (cùng lệnh với E1) ℹ duration_ms 15653.376834

- eval: E2
  run_id: minted-media-canonical-reso-E2-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.pipeline
  verified_at: 2026-10-30T03:45:42Z
  output: |
    cd pipeline && npm test
    ℹ duration_ms 34351.80725

- eval: E10
  run_id: minted-media-canonical-reso-E10-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.pipeline
  verified_at: 2026-10-30T03:45:42Z
  output: |
    (cùng lệnh với E2) ℹ duration_ms 34351.80725

- eval: E11
  run_id: minted-media-canonical-reso-E11-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.pipeline
  verified_at: 2026-10-30T03:45:42Z
  output: |
    (cùng lệnh với E2) ℹ duration_ms 34351.80725

- eval: E4
  run_id: minted-media-canonical-reso-E4-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.media_app
  verified_at: 2026-10-30T03:45:42Z
  output: |
    cd app && node --import tsx --test tests/media-canonical.test.tsx
    ℹ duration_ms 2274.795333

- eval: E6
  run_id: minted-media-canonical-reso-E6-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.media_app
  verified_at: 2026-10-30T03:45:42Z
  output: |
    (cùng lệnh với E4) ℹ duration_ms 2274.795333

- eval: E7
  run_id: minted-media-canonical-reso-E7-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.media_app
  verified_at: 2026-10-30T03:45:42Z
  output: |
    (cùng lệnh với E4) ℹ duration_ms 2274.795333

- eval: E8
  run_id: minted-media-canonical-reso-E8-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.media_roundtrip
  verified_at: 2026-10-30T03:45:42Z
  output: |
    cd app && DATABASE_URL=${MEDIA_DB_URL:-postgres://oneinvest:oneinvest@localhost:5433/oneinvest_p2_media} node --import tsx scripts/media-roundtrip.ts
    ROUNDTRIP PASS

- eval: E9
  run_id: minted-media-canonical-reso-E9-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.design.ui_check
  verified_at: 2026-10-30T03:45:42Z
  screenshot: evidence/E9-review.png
  observed: |
    E9-review.png: sheet 'Cung can? binh-thanh 49m² ↔ 51m²' #14 trên nền danh sách thẻ mở. Tin A (S05, 6.00 ty, 49 m²) ghi 'Tin A: khong co anh'; Tin B (nhãn S06, 6.90 ty, 51 m²) có dải 3 ảnh thật (hẻm có cây, phòng khách cửa sáng, đường phố/tòa nhà), không ô nào 'Ảnh hỏng'.
    E9-ho-so-s06.png: sheet 'Cho thue · 1,9 tr · 20 m²', S06, mục 'Anh tin' có 3 thumbnail thật (phòng có bồn rửa, bếp đá granite, bãi xe máy); không có câu 'Chua gan duoc anh'.
    E9-ho-so-s03.png: sheet 'Cho thue · 6 ty', S03, mục 'Anh tin' có 1 thumbnail thật (phòng ngủ cửa sổ, giường trắng), DOM src bắt đầu /api/zalo-media. Cả ba khung khớp Expected.
  network_observed: no-app-traffic
  output: |
    Frame đã lưu dưới _acceptance/media-canonical-reso/evidence/: E9-review.png, E9-ho-so-s06.png, E9-ho-so-s03.png, E9-network.txt.
    Ghi chú: khung E9-ho-so-s03 và E9-review do playwright chụp trực tiếp, không qua bước che tầng A của ui-capture; khung S03 hiện tên nhóm cộng đồng và nội dung bài gốc (tầng C theo AGENTS.md mục 6).

- eval: E12
  run_id: minted-media-canonical-reso-E12-r1
  exit_code: 1
  baseline: n-a
  verifier: config:executors.script.media_khong_lui
  verified_at: 2026-10-30T03:45:42Z
  output: |
    node _acceptance/media-canonical-reso/probes/khong-lui.mjs
    chạy lại ops-dong-chay-df0: 7/7 lệnh xanh
    chạy lại review-media-backend: 4/4 lệnh xanh
    chạy lại transform-zalo-boc-job-run: 1/1 lệnh xanh
    khong-lui: 1 dòng ngoài ba lớp đã biết trước chữ ký (tổng 4 vi phạm):
    VIOLATION [media-canonical-reso]: lượt chấm cuối không dùng được — cây đổi trong lượt chấm (_acceptance/media-canonical-reso/probes/khong-lui.mjs (đổi nội dung); pipeline/scripts/media-canonical.itest.mjs (đổ…

- eval: E13
  run_id: minted-media-canonical-reso-E13-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.design.floor
  verified_at: 2026-10-30T03:45:42Z
  output: |
    node "…/scripts/design-floor-s4.mjs" --root .
    (không in dòng nào, thoát 0)

- eval: E14
  run_id: minted-media-canonical-reso-E14-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.zalo_import_job
  verified_at: 2026-10-30T03:45:42Z
  output: |
    node --test scripts/zalo-import-job.test.mjs
    ℹ duration_ms 1516.432458

- eval: E15
  run_id: minted-media-canonical-reso-E15-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.job_exit
  verified_at: 2026-10-30T03:45:42Z
  output: |
    node --test scripts/job-exit.test.mjs
    ℹ duration_ms 4030.92975

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-media-canonical-reso-SUITE-npm_test__bb6271-r1
  exit_code: 0
  verified_at: 2026-10-30T03:45:42Z

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-media-canonical-reso-SUITE-lint-r1
  exit_code: 0
  verified_at: 2026-10-30T03:45:42Z

- cmd: cd app && npm test
  run_id: minted-media-canonical-reso-SUITE-npm_test__bd9a35-r1
  exit_code: 0
  verified_at: 2026-10-30T03:45:42Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-media-canonical-reso-SUITE-test_lint_rules-r1
  exit_code: 0
  verified_at: 2026-10-30T03:45:42Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-media-canonical-reso-SUITE-node_scripts_check_portal_compliance_mjs-r1
  exit_code: 0
  verified_at: 2026-10-30T03:45:42Z

## Known limits

## Ngoài hợp đồng

## Analyst

baseline: BLOCKED ha tang — lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «<\tool_use_error>Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.<\/tool_use_error>»

Eval không-phân-biệt: không xác định được ở round này, vì baseline bị chặn hạ tầng nên mọi field baseline đều n-a và không eval nào được đo green hay red trên code cũ.

Lệnh đỏ không gán eval: không có. Lệnh đỏ duy nhất (`node _acceptance/media-canonical-reso/probes/khong-lui.mjs`) gán cho E12.

### Baseline khong do

- cd pipeline && DATABASE_URL=${MEDIA_DB_URL:-postgres://oneinvest:oneinvest@localhost:5433/oneinvest_p2_media} node --test scripts/media-canonical.itest.mjs: BLOCKED ha tang baseline: lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «<\tool_use_error>Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.<\/tool_use_error>»
- cd pipeline && npm test: BLOCKED ha tang baseline: lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «<\tool_use_error>Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.<\/tool_use_error>»
- cd app && node --import tsx --test tests/media-canonical.test.tsx: BLOCKED ha tang baseline: lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «<\tool_use_error>Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.<\/tool_use_error>»
- cd app && DATABASE_URL=${MEDIA_DB_URL:-postgres://oneinvest:oneinvest@localhost:5433/oneinvest_p2_media} node --import tsx scripts/media-roundtrip.ts: BLOCKED ha tang baseline: lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «<\tool_use_error>Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.<\/tool_use_error>»
- node _acceptance/media-canonical-reso/probes/khong-lui.mjs: BLOCKED ha tang baseline: lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «<\tool_use_error>Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.<\/tool_use_error>»
- node "${CLAUDE_PLUGIN_ROOT:-$(node $HOME/.claude/plugins/marketplaces/acceptance-gate-kit/feature-loop/scripts/resolve-plugin.mjs --plugin acceptance-gate --require scripts/design-floor-s4.mjs)}/scripts/design-floor-s4.mjs" --root .: BLOCKED ha tang baseline: lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «<\tool_use_error>Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.<\/tool_use_error>»
- node --test scripts/zalo-import-job.test.mjs: BLOCKED ha tang baseline: lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «<\tool_use_error>Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.<\/tool_use_error>»
- node --test scripts/job-exit.test.mjs: BLOCKED ha tang baseline: lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «<\tool_use_error>Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.<\/tool_use_error>»

## Variance

none — mọi eval chạy một lần (runs 1, xác định), không eval nào có pass_rate hỗn hợp và không eval nào flaky.

## Iterations

Round 1: E12 failed — probe khong-lui.mjs còn 1 dòng ngoài ba lớp đã biết: «lượt chấm cuối không dùng được — cây đổi trong lượt chấm» (probe khong-lui.mjs và itest đổi nội dung trong lúc chấm). Returned to implementation.
