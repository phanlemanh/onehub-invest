---
schema_version: 2
feature_slug: can-gia-tot-sua-ba-loi
verdict: BLOCKED
failed_evals: []
reason: "ui-check:E7 — Cổng :3460 đã có sẵn một next-server (PID 58651) nhưng cwd của nó là worktree khác (.claude/worktrees/brave-northcutt-955c6a/app), không phải worktree determined-wiles-0e6f3b. Code ở hai nơi khác nhau: app/src/lib/deals.ts, app/src/lib/deals-chi-tiet.ts và app/src/app/ops/deals/[offerId]/page.tsx đều khác. Dùng chung server này thì chỉ chụp được code chưa sửa của worktree kia, không kiểm được tính năng can-gia-tot-sua-ba-loi. Server đó không do tôi khởi động nên tôi không tắt. Vì vậy không thể khởi động app-3460-worktree trên :3460 như steps yêu cầu. Cần giải phóng :3460 hoặc cho phép chạy bản worktree này ở cổng khác rồi chạy lại E7."
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 4cd3a5ea8b9f7c8617bcb04d3cd686b55e8dccb3
human_signoff:
---

# Evidence Report: can-gia-tot-sua-ba-loi

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | test | PASS |
| E2 | AC-2 | test | PASS |
| E3 | AC-3 | test | PASS |
| E4 | AC-4 | test | PASS |
| E5 | AC-4 | script | PASS (carry-forward từ round 1) |
| E6 | AC-4 | script | PASS |
| E7 | AC-5 | ui-check | BLOCKED |
| E8 | AC-6 | test | PASS |
| E9 | AC-7 | test | PASS (carry-forward từ round 2) |

Lệnh suite ngoài eval: `cd app && npm test` có một test hỏng (SD-AC-6, deadlock cơ sở dữ liệu khi nạp dữ liệu thử); các lệnh suite còn lại đều xanh. Lệnh này không gắn eval nào, nên không vào cột failed_evals.

## Evidence

- eval: E1
  run_id: minted-can-gia-tot-sua-ba-loi-E1-r3
  exit_code: 0
  baseline: red
  verifier: config:executors.test.can_gia_tot_sua_ba_loi
  verified_at: 2026-11-04T04:23:52Z
  output: |
    cd app && node --import tsx --test --test-name-pattern=CGB-AC tests/can-gia-tot-biet-can.test.tsx
    ℹ duration_ms 11510.867708

- eval: E2
  run_id: minted-can-gia-tot-sua-ba-loi-E2-r3
  exit_code: 0
  baseline: red
  verifier: config:executors.test.can_gia_tot_sua_ba_loi
  verified_at: 2026-11-04T04:23:52Z
  output: |
    cd app && node --import tsx --test --test-name-pattern=CGB-AC tests/can-gia-tot-biet-can.test.tsx
    ℹ duration_ms 11510.867708

- eval: E3
  run_id: minted-can-gia-tot-sua-ba-loi-E3-r3
  exit_code: 0
  baseline: red
  verifier: config:executors.test.can_gia_tot_sua_ba_loi
  verified_at: 2026-11-04T04:23:52Z
  output: |
    cd app && node --import tsx --test --test-name-pattern=CGB-AC tests/can-gia-tot-biet-can.test.tsx
    ℹ duration_ms 11510.867708

- eval: E4
  run_id: minted-can-gia-tot-sua-ba-loi-E4-r3
  exit_code: 0
  baseline: red
  verifier: config:executors.test.can_gia_tot
  verified_at: 2026-11-04T04:23:52Z
  output: |
    cd app && node --import tsx --test tests/can-gia-tot-biet-can.test.tsx
    ℹ duration_ms 15258.60075

- eval: E5
  run_id: minted-can-gia-tot-sua-ba-loi-E5-r1
  exit_code: 0
  verifier: config:executors.script.can_gia_tot_quet_ma
  verified_at: 2026-11-04T01:50:32Z
  carried_from_round: 1
  # carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E6
  run_id: minted-can-gia-tot-sua-ba-loi-E6-r3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.can_gia_tot_ca_cu
  verified_at: 2026-11-04T04:23:52Z
  output: |
    ca-cu-khong-doi: 0 dòng cũ bị đổi so với daccb40340558dd819beca8927d897ba90bfeddf

- eval: E7
  run_id: minted-can-gia-tot-sua-ba-loi-E7-r3
  verifier: ui-check
  baseline: n-a
  network_observed: n-a (driver)
  trạng thái: BLOCKED, không chụp frame nào, không có screenshot.
  output: |
    Đã kiểm: lsof :3460 thấy LISTEN bởi PID 58651; cwd của tiến trình là brave-northcutt-955c6a/app. So hai worktree thì khác nhau ở deals.ts, deals-chi-tiet.ts, ops/deals/[offerId]/page.tsx. curl localhost:3460/ops trả 307. Chưa đăng nhập, chưa chụp frame, chưa ghi E7-network.txt. Không sửa code, không tắt server nào.

- eval: E8
  run_id: minted-can-gia-tot-sua-ba-loi-E8-r3
  exit_code: 0
  baseline: red
  verifier: config:executors.test.can_gia_tot_ten_invest
  verified_at: 2026-11-04T04:23:52Z
  output: |
    cd app && node --import tsx --test --test-name-pattern=CGB-AC-6 tests/tin-rao-cong-khai.test.tsx
    ℹ duration_ms 2366.159375

- eval: E9
  run_id: minted-can-gia-tot-sua-ba-loi-E9-r2
  exit_code: 0
  verifier: config:executors.test.can_gia_tot_doi_chieu
  verified_at: 2026-11-04T02:08:01Z
  carried_from_round: 2
  # carry-forward tu round 2 — delta khong cham paths cua eval

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-can-gia-tot-sua-ba-loi-SUITE-npm_test__bb6271-r3
  exit_code: 0
  verified_at: 2026-11-04T04:23:52Z

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-can-gia-tot-sua-ba-loi-SUITE-lint-r3
  exit_code: 0
  verified_at: 2026-11-04T04:23:52Z

- cmd: cd app && npm test
  run_id: minted-can-gia-tot-sua-ba-loi-SUITE-npm_test__bd9a35-r3
  verified_at: 2026-11-04T04:23:52Z
  kết quả: 880 test, 874 đạt, 1 hỏng, 5 bỏ qua. Test hỏng là SD-AC-6 trong tests/sellers-chip.test.tsx (chip Căn giá tốt có số tin người bán): cơ sở dữ liệu báo deadlock (mã 40P01) ở bước nap-060.mjs napSdtE164 trong withTx. Đây là tranh chấp khoá giữa hai tiến trình trên DB dùng chung, không nằm trong paths của tính năng.

- cmd: cd pipeline && npm test
  run_id: minted-can-gia-tot-sua-ba-loi-SUITE-npm_test__13563d-r3
  exit_code: 0
  verified_at: 2026-11-04T04:23:52Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-can-gia-tot-sua-ba-loi-SUITE-test_lint_rules-r3
  exit_code: 0
  verified_at: 2026-11-04T04:23:52Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-can-gia-tot-sua-ba-loi-SUITE-node_scripts_check_portal_compliance_mjs-r3
  exit_code: 0
  verified_at: 2026-11-04T04:23:52Z

## Known limits

## Ngoài hợp đồng

## Analyst

none — moi eval feature deu red tren baseline (co phan biet)

Baseline khong do
- bash _acceptance/can-gia-tot-sua-ba-loi/probes/ca-cu-khong-doi.sh: bo qua baseline: tep _acceptance/can-gia-tot-sua-ba-loi/probes/ca-cu-khong-doi.sh co o cay dang kiem nhung chua co o merge-base daccb40340558dd819beca8927d897ba90bfeddf — eval moi, chay tren code cu khong phan biet gi

## Variance

none — every multi-run eval is uniform

## Iterations

Round 1: E5 chạy và đạt; các eval còn lại được chạy ở các round sau. Hồ sơ gốc ở run-log.
Round 2: E9 chạy và đạt (đối chiếu CGT-DC).
Round 3: E1, E2, E3, E4, E6, E8 đạt; E5, E9 mang sang; E7 BLOCKED vì cổng :3460 đang do worktree khác giữ. Cần giải phóng cổng hoặc cho phép chạy cổng khác rồi chạy lại E7; lệnh suite app npm test có một test deadlock cần chạy lại.
