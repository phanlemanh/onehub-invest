---
schema_version: 2
feature_slug: tam-dung-nguon-tu-cloud
verdict: PASS
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: de8873bd26e7987de0cfb6df74d2f52c3b2b00b4
human_signoff:
---

# Evidence Report: tam-dung-nguon-tu-cloud

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
  run_id: minted-tam-dung-nguon-tu-cloud-E1-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.tdn_route
  verified_at: 2026-11-12T23:38:27Z
  output: |
    cd app && bash ../db/db-thu.sh oneinvest_suite_tdn --chay node --import tsx --test tests/tam-dung-nguon.test.tsx
    ℹ duration_ms 1278.186

- eval: E2
  run_id: minted-tam-dung-nguon-tu-cloud-E2-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.tdn_route
  verified_at: 2026-11-12T23:38:27Z
  output: |
    cd app && bash ../db/db-thu.sh oneinvest_suite_tdn --chay node --import tsx --test tests/tam-dung-nguon.test.tsx
    ℹ duration_ms 1278.186

- eval: E5
  run_id: minted-tam-dung-nguon-tu-cloud-E5-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.tdn_route
  verified_at: 2026-11-12T23:38:27Z
  output: |
    cd app && bash ../db/db-thu.sh oneinvest_suite_tdn --chay node --import tsx --test tests/tam-dung-nguon.test.tsx
    ℹ duration_ms 1278.186

- eval: E3
  run_id: minted-tam-dung-nguon-tu-cloud-E3-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.tdn_hien
  verified_at: 2026-11-12T23:38:27Z
  output: |
    cd app && node --import tsx --test tests/lenh-hien.test.ts
    ℹ duration_ms 2484.155708

- eval: E6
  run_id: minted-tam-dung-nguon-tu-cloud-E6-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.tdn_hien
  verified_at: 2026-11-12T23:38:27Z
  output: |
    cd app && node --import tsx --test tests/lenh-hien.test.ts
    ℹ duration_ms 2484.155708

- eval: E7
  run_id: minted-tam-dung-nguon-tu-cloud-E7-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.tdn_hien
  verified_at: 2026-11-12T23:38:27Z
  output: |
    cd app && node --import tsx --test tests/lenh-hien.test.ts
    ℹ duration_ms 2484.155708

- eval: E8
  run_id: minted-tam-dung-nguon-tu-cloud-E8-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.tdn_hien
  verified_at: 2026-11-12T23:38:27Z
  output: |
    cd app && node --import tsx --test tests/lenh-hien.test.ts
    ℹ duration_ms 2484.155708

- eval: E4
  run_id: minted-tam-dung-nguon-tu-cloud-E4-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.tdn_ui
  verified_at: 2026-11-12T23:38:27Z
  output: |
    cd app && node --import tsx --test tests/tam-dung-nguon-ui.test.tsx
    ℹ duration_ms 3940.1095

- eval: E10
  run_id: minted-tam-dung-nguon-tu-cloud-E10-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.tdn_ui
  verified_at: 2026-11-12T23:38:27Z
  output: |
    cd app && node --import tsx --test tests/tam-dung-nguon-ui.test.tsx
    ℹ duration_ms 3940.1095

- eval: E9
  run_id: minted-tam-dung-nguon-tu-cloud-E9-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.tdn_dau_cuoi
  verified_at: 2026-11-12T23:38:27Z
  output: |
    cd app && bash ../db/db-thu.sh oneinvest_suite_tdndc --chay node --import tsx --test tests/tam-dung-dau-cuoi.test.tsx
    ℹ duration_ms 1070.651667

- eval: E11
  run_id: minted-tam-dung-nguon-tu-cloud-E11-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.ui-check
  verified_at: 2026-11-12T23:38:27Z
  screenshot: evidence/E11-step1.png
  observed: |
    E11-step1.png: ops, trang Thu thap, dau trang (the KPI, bieu do Luong 7 ngay, Can chu y); anh KHONG chua luoi, luoi duoc assert qua DOM text. E11-step2.png: hop thoai 'Tam dung S05?' nen mo; dong 'Trang thai: Dang chay -> Tam dung' kem badge vang 'Tam dung'; o Ly do trong (0/500); nut 'Gui lenh' mo/xam (tat); phia sau mo thay cot 'Thao tac' voi nut 'Tam dung' o cac hang. E11-step4.png: vung 'Lenh gan day' co 1 dong S05, Tam dung, Ban, 'thu TV4b — het credit', badge 'Cho may thu nhan' + 'May thu chua keo lenh lan nao'. E11-step5.png: dang nhap viewer-test@local.test (Nguoi xem), dau trang Thu thap. E11-step5-luoi.png: luoi Suc khoe nguon cua viewer, cot Nguon, Trang thai, Chay cuoi, Do tuoi, 24h, Staging, Tin rao, KHONG co cot Thao tac, hang S05 khong nut. Khong co mau thuan voi Expected.
  network_observed: n-a (driver)

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-tam-dung-nguon-tu-cloud-SUITE-npm_test__bb6271-r2
  exit_code: 0
  verified_at: 2026-11-12T23:38:27Z

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-tam-dung-nguon-tu-cloud-SUITE-lint-r2
  exit_code: 0
  verified_at: 2026-11-12T23:38:27Z

- cmd: cd app && npm test
  run_id: minted-tam-dung-nguon-tu-cloud-SUITE-npm_test__bd9a35-r2
  exit_code: 0
  verified_at: 2026-11-12T23:38:27Z

- cmd: cd pipeline && npm test
  run_id: minted-tam-dung-nguon-tu-cloud-SUITE-npm_test__13563d-r2
  exit_code: 0
  verified_at: 2026-11-12T23:38:27Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-tam-dung-nguon-tu-cloud-SUITE-test_lint_rules-r2
  exit_code: 0
  verified_at: 2026-11-12T23:38:27Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-tam-dung-nguon-tu-cloud-SUITE-node_scripts_check_portal_compliance_mjs-r2
  exit_code: 0
  verified_at: 2026-11-12T23:38:27Z

## Known limits

## Ngoài hợp đồng

## Analyst

carried tu round 1 — baseline khong do lai round nay. Khong co eval khong-phan-biet duoc liet ke: [].

## Variance

none — every multi-run eval is uniform

## Iterations

Round 1: 11/11 eval xanh nhung suite tsc do vi thieu kieu sinh cua Next — S4 r1 REJECT, tra ve implementation.
Round 2: 11/11 eval xanh va ca sau lenh suite xanh tren commit de8873bd — PASS.
