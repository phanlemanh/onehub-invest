---
schema_version: 2
feature_slug: tam-dung-nguon-tu-cloud
verdict: PASS
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 6104a7720c39fde1817a60c16822435e082450eb
human_signoff:
---

# Evidence Report: tam-dung-nguon-tu-cloud

Round 1.

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | test | PASS |
| E2 | AC-2 | test | PASS |
| E3 | AC-3 | test | PASS |
| E4 | AC-3 | test | PASS |
| E5 | AC-3 | test | PASS |
| E6 | AC-4 | test | PASS |
| E7 | AC-5 | test | PASS |
| E8 | AC-6 | test | PASS |
| E9 | AC-7 | test | PASS |
| E10 | AC-2 | test | PASS |
| E11 | AC-8 | ui-check | PASS |

## Evidence

- eval: E1
  run_id: minted-tam-dung-nguon-tu-cloud-E1-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.tdn_route
  verified_at: 2026-11-12T13:34:11Z
  output: |
    cd app && bash ../db/db-thu.sh oneinvest_suite_tdn --chay node --import tsx --test tests/tam-dung-nguon.test.tsx
    ℹ duration_ms 1108.156708

- eval: E2
  run_id: minted-tam-dung-nguon-tu-cloud-E2-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.tdn_route
  verified_at: 2026-11-12T13:34:11Z
  output: |
    cd app && bash ../db/db-thu.sh oneinvest_suite_tdn --chay node --import tsx --test tests/tam-dung-nguon.test.tsx
    ℹ duration_ms 1108.156708

- eval: E3
  run_id: minted-tam-dung-nguon-tu-cloud-E3-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.tdn_hien
  verified_at: 2026-11-12T13:34:11Z
  output: |
    cd app && node --import tsx --test tests/lenh-hien.test.ts
    ℹ duration_ms 2202.693292

- eval: E4
  run_id: minted-tam-dung-nguon-tu-cloud-E4-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.tdn_ui
  verified_at: 2026-11-12T13:34:11Z
  output: |
    cd app && node --import tsx --test tests/tam-dung-nguon-ui.test.tsx
    ℹ duration_ms 3705.826542

- eval: E5
  run_id: minted-tam-dung-nguon-tu-cloud-E5-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.tdn_route
  verified_at: 2026-11-12T13:34:11Z
  output: |
    cd app && bash ../db/db-thu.sh oneinvest_suite_tdn --chay node --import tsx --test tests/tam-dung-nguon.test.tsx
    ℹ duration_ms 1108.156708

- eval: E6
  run_id: minted-tam-dung-nguon-tu-cloud-E6-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.tdn_hien
  verified_at: 2026-11-12T13:34:11Z
  output: |
    cd app && node --import tsx --test tests/lenh-hien.test.ts
    ℹ duration_ms 2202.693292

- eval: E7
  run_id: minted-tam-dung-nguon-tu-cloud-E7-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.tdn_hien
  verified_at: 2026-11-12T13:34:11Z
  output: |
    cd app && node --import tsx --test tests/lenh-hien.test.ts
    ℹ duration_ms 2202.693292

- eval: E8
  run_id: minted-tam-dung-nguon-tu-cloud-E8-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.tdn_hien
  verified_at: 2026-11-12T13:34:11Z
  output: |
    cd app && node --import tsx --test tests/lenh-hien.test.ts
    ℹ duration_ms 2202.693292

- eval: E9
  run_id: minted-tam-dung-nguon-tu-cloud-E9-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.tdn_dau_cuoi
  verified_at: 2026-11-12T13:34:11Z
  output: |
    cd app && bash ../db/db-thu.sh oneinvest_suite_tdndc --chay node --import tsx --test tests/tam-dung-dau-cuoi.test.tsx
    ℹ duration_ms 1210.084625

- eval: E10
  run_id: minted-tam-dung-nguon-tu-cloud-E10-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.tdn_ui
  verified_at: 2026-11-12T13:34:11Z
  output: |
    cd app && node --import tsx --test tests/tam-dung-nguon-ui.test.tsx
    ℹ duration_ms 3705.826542

- eval: E11
  run_id: minted-tam-dung-nguon-tu-cloud-E11-r1
  exit_code: 0
  baseline: n-a
  verifier: ui-check
  verified_at: 2026-11-12T13:34:11Z
  screenshot: evidence/E11-step1.png
  observed: |
    step1: lưới 'Sức khoẻ nguồn' có các cột Nguồn, Trạng thái, Chạy cuối, Độ tươi, 24h, Staging, Tin rao, Thao tác. Hàng S05 hiện 'Trễ SLO' và nút 'Tạm dừng'. S04 và S07 không có nút. Đăng nhập là ops-test@local.test, Quản trị.
    step2: hộp thoại 'Tạm dừng S05?' có dòng 'Lượt thu kế tiếp của S05 không chạy. Bật lại cần quản trị viên.' và dòng 'Trạng thái: Đang chạy → Tạm dừng'. Ô Lý do trống, bộ đếm 0/500. Nút 'Gửi lệnh' mờ.
    step3: ô Lý do có 'thử TV4b — hết credit', bộ đếm 21/500. Nút 'Gửi lệnh' sáng.
    step4: hàng S05 đổi nút thành nhãn vàng 'Đang có lệnh chờ'. Toast 'Đã gửi lệnh tạm dừng S05' đọc được từ DOM nhưng không có trong ảnh.
    step5: 'Lệnh gần đây' có một dòng: S05, Tạm dừng, Bạn, 'thử TV4b — hết credit', nhãn 'Chờ máy thu nhận' và dòng 'Máy thu chưa kéo lệnh lần nào'.
    step6: vai viewer-test@local.test (Người xem). Lưới chỉ có 7 cột, không có 'Thao tác', không nút 'Tạm dừng'. Vùng 'Lệnh gần đây' vẫn đọc được. Dòng S05 hiện 'Thành viên khác' và 'Chờ máy thu nhận'.
    Tất cả khớp Expected.
  network_observed: n-a (driver)

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-tam-dung-nguon-tu-cloud-SUITE-npm_test__bb6271-r1
  exit_code: 0
  verified_at: 2026-11-12T13:34:11Z

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-tam-dung-nguon-tu-cloud-SUITE-lint-r1
  exit_code: 0
  verified_at: 2026-11-12T13:34:11Z

- cmd: cd app && npm test
  run_id: minted-tam-dung-nguon-tu-cloud-SUITE-npm_test__bd9a35-r1
  exit_code: 0
  verified_at: 2026-11-12T13:34:11Z

- cmd: cd pipeline && npm test
  run_id: minted-tam-dung-nguon-tu-cloud-SUITE-npm_test__13563d-r1
  exit_code: 0
  verified_at: 2026-11-12T13:34:11Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-tam-dung-nguon-tu-cloud-SUITE-test_lint_rules-r1
  exit_code: 0
  verified_at: 2026-11-12T13:34:11Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-tam-dung-nguon-tu-cloud-SUITE-node_scripts_check_portal_compliance_mjs-r1
  exit_code: 0
  verified_at: 2026-11-12T13:34:11Z

## Known limits

## Ngoài hợp đồng

## Analyst

none — moi eval feature deu red tren baseline (co phan biet)

Ghi chú: baseline của các eval dưới đây là n-a (không đo), nên chưa có bằng chứng red; không phải green-on-both.

Baseline khong do
- cd app && bash ../db/db-thu.sh oneinvest_suite_tdn --chay node --import tsx --test tests/tam-dung-nguon.test.tsx: bo qua baseline: tep app/tests/tam-dung-nguon.test.tsx co o cay dang kiem nhung chua co o merge-base e01513de2abf543e09febe2fda452858e1898789 — eval moi, chay tren code cu khong phan biet gi
- cd app && node --import tsx --test tests/lenh-hien.test.ts: bo qua baseline: tep app/tests/lenh-hien.test.ts co o cay dang kiem nhung chua co o merge-base e01513de2abf543e09febe2fda452858e1898789 — eval moi, chay tren code cu khong phan biet gi
- cd app && node --import tsx --test tests/tam-dung-nguon-ui.test.tsx: bo qua baseline: tep app/tests/tam-dung-nguon-ui.test.tsx co o cay dang kiem nhung chua co o merge-base e01513de2abf543e09febe2fda452858e1898789 — eval moi, chay tren code cu khong phan biet gi
- cd app && bash ../db/db-thu.sh oneinvest_suite_tdndc --chay node --import tsx --test tests/tam-dung-dau-cuoi.test.tsx: bo qua baseline: tep app/tests/tam-dung-dau-cuoi.test.tsx co o cay dang kiem nhung chua co o merge-base e01513de2abf543e09febe2fda452858e1898789 — eval moi, chay tren code cu khong phan biet gi

## Variance

none — every multi-run eval is uniform

## Iterations

Round 1: tất cả 11 eval đạt, không có judgment item chờ người; năm phát hiện ngoài hợp đồng ghi ở review-findings.md để người quyết ở Gate 2.

