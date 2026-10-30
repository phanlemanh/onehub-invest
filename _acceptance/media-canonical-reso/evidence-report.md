---
schema_version: 2
feature_slug: media-canonical-reso
verdict: PASS
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 35b0178c274d558249a49e50e5d6bd3ec8ffc4f1
human_signoff: Mạnh 2026-10-30
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
| E12 | AC-10 | script | PASS |
| E13 | AC-6 | script | PASS |
| E14 | AC-10 | test | PASS |
| E15 | AC-10 | test | PASS |

## Evidence

- eval: E12
  run_id: minted-media-canonical-reso-E12-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.media_khong_lui
  verified_at: 2026-10-30T04:00:08Z
  output: |
    node _acceptance/media-canonical-reso/probes/khong-lui.mjs
    KHÔNG LÙI PASS — 4 vi phạm còn lại đều thuộc ba lớp đã biết trước chữ ký (base origin/main)

- eval: E1
  run_id: minted-media-canonical-reso-E1-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.media_db
  verified_at: 2026-10-30T03:45:42Z
  carried_from_round: 1
  output: |
    carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E2
  run_id: minted-media-canonical-reso-E2-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.pipeline
  verified_at: 2026-10-30T03:45:42Z
  carried_from_round: 1
  output: |
    carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E3
  run_id: minted-media-canonical-reso-E3-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.media_db
  verified_at: 2026-10-30T03:45:42Z
  carried_from_round: 1
  output: |
    carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E4
  run_id: minted-media-canonical-reso-E4-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.media_app
  verified_at: 2026-10-30T03:45:42Z
  carried_from_round: 1
  output: |
    carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E5
  run_id: minted-media-canonical-reso-E5-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.media_db
  verified_at: 2026-10-30T03:45:42Z
  carried_from_round: 1
  output: |
    carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E6
  run_id: minted-media-canonical-reso-E6-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.media_app
  verified_at: 2026-10-30T03:45:42Z
  carried_from_round: 1
  output: |
    carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E7
  run_id: minted-media-canonical-reso-E7-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.media_app
  verified_at: 2026-10-30T03:45:42Z
  carried_from_round: 1
  output: |
    carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E8
  run_id: minted-media-canonical-reso-E8-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.media_roundtrip
  verified_at: 2026-10-30T03:45:42Z
  carried_from_round: 1
  output: |
    carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E9
  run_id: minted-media-canonical-reso-E9-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.design.ui_check
  verified_at: 2026-10-30T03:45:42Z
  carried_from_round: 1
  note: carry-forward tu round 1 — delta khong cham paths cua eval
  screenshot: evidence/E9-review.png
  observed: |
    E9-review.png: sheet 'Cung can? binh-thanh 49m² ↔ 51m²' #14 trên nền danh sách thẻ mở. Tin A (S05, 6.00 ty, 49 m²) ghi 'Tin A: khong co anh'; Tin B (nhãn S06, 6.90 ty, 51 m²) có dải 3 ảnh thật (hẻm có cây, phòng khách cửa sáng, đường phố/tòa nhà), không ô nào 'Ảnh hỏng'.
    E9-ho-so-s06.png: sheet 'Cho thue · 1,9 tr · 20 m²', S06, mục 'Anh tin' có 3 thumbnail thật (phòng có bồn rửa, bếp đá granite, bãi xe máy); không có câu 'Chua gan duoc anh'.
    E9-ho-so-s03.png: sheet 'Cho thue · 6 ty', S03, mục 'Anh tin' có 1 thumbnail thật (phòng ngủ cửa sổ, giường trắng), DOM src bắt đầu /api/zalo-media. Cả ba khung khớp Expected.
  network_observed: no-app-traffic

- eval: E10
  run_id: minted-media-canonical-reso-E10-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.pipeline
  verified_at: 2026-10-30T03:45:42Z
  carried_from_round: 1
  output: |
    carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E11
  run_id: minted-media-canonical-reso-E11-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.pipeline
  verified_at: 2026-10-30T03:45:42Z
  carried_from_round: 1
  output: |
    carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E13
  run_id: minted-media-canonical-reso-E13-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.design.floor
  verified_at: 2026-10-30T03:45:42Z
  carried_from_round: 1
  output: |
    carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E14
  run_id: minted-media-canonical-reso-E14-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.zalo_import_job
  verified_at: 2026-10-30T03:45:42Z
  carried_from_round: 1
  output: |
    carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E15
  run_id: minted-media-canonical-reso-E15-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.job_exit
  verified_at: 2026-10-30T03:45:42Z
  carried_from_round: 1
  output: |
    carry-forward tu round 1 — delta khong cham paths cua eval

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-media-canonical-reso-SUITE-npm_test__bb6271-r2
  exit_code: 0
  verified_at: 2026-10-30T04:00:08Z

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-media-canonical-reso-SUITE-lint-r2
  exit_code: 0
  verified_at: 2026-10-30T04:00:08Z

- cmd: cd app && npm test
  run_id: minted-media-canonical-reso-SUITE-npm_test__bd9a35-r2
  exit_code: 0
  verified_at: 2026-10-30T04:00:08Z

- cmd: cd pipeline && npm test
  run_id: minted-media-canonical-reso-SUITE-npm_test__13563d-r2
  exit_code: 0
  verified_at: 2026-10-30T04:00:08Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-media-canonical-reso-SUITE-test_lint_rules-r2
  exit_code: 0
  verified_at: 2026-10-30T04:00:08Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-media-canonical-reso-SUITE-node_scripts_check_portal_compliance_mjs-r2
  exit_code: 0
  verified_at: 2026-10-30T04:00:08Z

## Known limits

## Ngoài hợp đồng

## Analyst

baseline: BLOCKED ha tang — lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «<\tool_use_error>Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.<\/tool_use_error>»

none — không đo được ở round này (baseline BLOCKED hạ tầng); danh sách eval không-phân-biệt rỗng vì không có số đo, không phải vì mọi eval đã red.

### Baseline khong do

- node _acceptance/media-canonical-reso/probes/khong-lui.mjs: BLOCKED ha tang baseline: lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «<\tool_use_error>Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.<\/tool_use_error>»

## Variance

none — every multi-run eval is uniform (mọi eval chạy một lần, không eval nào có phương sai).

## Iterations

Round 1: E12 failed — probe khong-lui.mjs còn 1 dòng ngoài ba lớp đã biết: «lượt chấm cuối không dùng được — cây đổi trong lượt chấm» (probe khong-lui.mjs và itest đổi nội dung trong lúc chấm). Returned to implementation.
Round 2: tất cả eval PASS — E12 chạy lại trên 35b0178c274d558249a49e50e5d6bd3ec8ffc4f1 sau khi lớp 1 của probe nhận trạng thái chính hồ sơ; E1–E11, E13–E15 carry-forward từ round 1 (delta không chạm paths của các eval này); sáu lệnh suite chạy lại và xanh.
