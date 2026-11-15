---
schema_version: 2
feature_slug: tap-nhan-ghep-tin-hai-khu
verdict: PASS
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: fa3c136ef6020d4c8f277d36a14859a3b39e4fa1
human_signoff: Mạnh 2026-11-15
---

# Evidence Report: tap-nhan-ghep-tin-hai-khu

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | script | PASS |
| E2 | AC-2 | script | PASS |
| E3 | AC-3 | test | PASS |
| E4 | AC-4 | test | PASS |
| E5 | AC-5 | script | PASS |
| E5b | AC-5 | ui-check | PASS |
| E6 | AC-6 | script | PASS |
| E7 | AC-7 | script | PASS |
| E7b | AC-7 | script | PASS |
| E8 | AC-8 | script | PASS |
| E9 | AC-9 | script | PASS |
| E10 | AC-10 | script | PASS |

## Evidence

- eval: E1
  run_id: minted-tap-nhan-ghep-tin-hai-khu-E1-r3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.pl35_db
  verified_at: 2026-11-14T15:38:21Z
  output: |
    bash pipeline/scripts/tap-nhan-hai-khu-db.sh itest
    duration_ms 6413.845667

- eval: E2
  run_id: minted-tap-nhan-ghep-tin-hai-khu-E2-r3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.pl35_db
  verified_at: 2026-11-14T15:38:21Z
  output: |
    bash pipeline/scripts/tap-nhan-hai-khu-db.sh itest
    duration_ms 6413.845667

- eval: E3
  run_id: minted-tap-nhan-ghep-tin-hai-khu-E3-r3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.pl35_ham
  verified_at: 2026-11-14T15:38:21Z
  output: |
    node --test pipeline/scripts/tap-nhan-hai-khu.test.mjs
    duration_ms 99.324084

- eval: E4
  run_id: minted-tap-nhan-ghep-tin-hai-khu-E4-r3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.pl35_ham
  verified_at: 2026-11-14T15:38:21Z
  output: |
    node --test pipeline/scripts/tap-nhan-hai-khu.test.mjs
    duration_ms 99.324084

- eval: E5
  run_id: minted-tap-nhan-ghep-tin-hai-khu-E5-r3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.pl35_db
  verified_at: 2026-11-14T15:38:21Z
  output: |
    bash pipeline/scripts/tap-nhan-hai-khu-db.sh itest
    duration_ms 6413.845667

- eval: E5b
  run_id: minted-tap-nhan-ghep-tin-hai-khu-E5b-r3
  exit_code: 0
  baseline: n-a
  verifier: config:dev_server.start   # tác tử chấm lái trình duyệt trên bản dev của worktree (:3460); bản tổng hợp ghi khoá executors.ui không có trong config — sửa nhãn lúc ký theo tiền lệ của kho
  verified_at: 2026-11-14T15:38:21Z
  screenshot: evidence/E5b-step1.png
  observed: |
    Frame step1 (đã mở bằng Read): /ops/labels?lat=hai-khu-ghep&nhom=op1-truc, thẻ #11767 (S03), ba ô Vị trí điền sẵn Mã căn = PR63826, Toà = PR6, Trục = 26, mỗi ô căn cứ «Chữ» đang bật; khớp bảng ghi-thu; chữ đọc được, không tràn khung, email thanh bên đã che.
    Frame step2 (đã mở bằng Read): sau Lưu hiện «Bài gốc #11767», «So với máy — Nhãn đã lưu, không sửa được», «Tôi đã gắn 1/64 tin của nhóm». Frame step2b: bảng «So với máy» hiện Mã căn = PR63826, Toà = pr6, Trục = 28 ở cột Anh gắn; ghi-thu --doc-nhan 11767 in ba dòng eval_labels building, stack, unit_number.
  network_observed: clean

- eval: E6
  run_id: minted-tap-nhan-ghep-tin-hai-khu-E6-r3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.pl35_db
  verified_at: 2026-11-14T15:38:21Z
  output: |
    bash pipeline/scripts/tap-nhan-hai-khu-db.sh itest
    duration_ms 6413.845667

- eval: E7
  run_id: minted-tap-nhan-ghep-tin-hai-khu-E7-r3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.pl35_db
  verified_at: 2026-11-14T15:38:21Z
  output: |
    bash pipeline/scripts/tap-nhan-hai-khu-db.sh itest
    duration_ms 6413.845667

- eval: E7b
  run_id: minted-tap-nhan-ghep-tin-hai-khu-E7b-r3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.pl35_ranh_gioi
  verified_at: 2026-11-14T15:38:21Z
  output: |
    quet_tep=10 doc_pl20=0 tep=34 migration_doi=0 sync_cloud_doi=0 app_doi=0 ten_nguon=0 ten_nguon_commit=0

- eval: E8
  run_id: minted-tap-nhan-ghep-tin-hai-khu-E8-r3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.pl35_db
  verified_at: 2026-11-14T15:38:21Z
  output: |
    bash pipeline/scripts/tap-nhan-hai-khu-db.sh itest
    duration_ms 6413.845667

- eval: E9
  run_id: minted-tap-nhan-ghep-tin-hai-khu-E9-r3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.pl35_do
  verified_at: 2026-11-14T15:38:21Z
  output: |
    PL35-AC-9 xanh

- eval: E10
  run_id: minted-tap-nhan-ghep-tin-hai-khu-E10-r3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.pl35_ranh_gioi
  verified_at: 2026-11-14T15:38:21Z
  output: |
    quet_tep=10 doc_pl20=0 tep=34 migration_doi=0 sync_cloud_doi=0 app_doi=0 ten_nguon=0 ten_nguon_commit=0

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-tap-nhan-ghep-tin-hai-khu-SUITE-npm_test__bb6271-r3
  exit_code: 0
  verified_at: 2026-11-14T15:38:21Z

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-tap-nhan-ghep-tin-hai-khu-SUITE-lint-r3
  exit_code: 0
  verified_at: 2026-11-14T15:38:21Z

- cmd: cd app && npm test
  run_id: minted-tap-nhan-ghep-tin-hai-khu-SUITE-npm_test__bd9a35-r3
  exit_code: 0
  verified_at: 2026-11-14T15:38:21Z

- cmd: cd pipeline && npm run test:a
  run_id: bs0lz1a4t
  exit_code: 0
  verified_at: 2026-11-14T15:38:21Z

- cmd: cd pipeline && npm run test:b
  run_id: minted-tap-nhan-ghep-tin-hai-khu-SUITE-test_b-r3
  exit_code: 0
  verified_at: 2026-11-14T15:38:21Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-tap-nhan-ghep-tin-hai-khu-SUITE-test_lint_rules-r3
  exit_code: 0
  verified_at: 2026-11-14T15:38:21Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-tap-nhan-ghep-tin-hai-khu-SUITE-node_scripts_check_portal_compliance_mjs-r3
  exit_code: 0
  verified_at: 2026-11-14T15:38:21Z

## Known limits

## Ngoài hợp đồng

## Analyst

none — moi eval feature deu red tren baseline (co phan biet)

Baseline khong do
- bash pipeline/scripts/tap-nhan-hai-khu-db.sh itest: bo qua baseline: tep pipeline/scripts/tap-nhan-hai-khu-db.sh co o cay dang kiem nhung chua co o merge-base 4f94da570085b820af23cd741ac57cb349eb709c — eval moi, chay tren code cu khong phan biet gi
- node --test pipeline/scripts/tap-nhan-hai-khu.test.mjs: bo qua baseline: tep pipeline/scripts/tap-nhan-hai-khu.test.mjs co o cay dang kiem nhung chua co o merge-base 4f94da570085b820af23cd741ac57cb349eb709c — eval moi, chay tren code cu khong phan biet gi
- node pipeline/scripts/tap-nhan-hai-khu-ranh-gioi.mjs --base origin/main: bo qua baseline: tep pipeline/scripts/tap-nhan-hai-khu-ranh-gioi.mjs co o cay dang kiem nhung chua co o merge-base 4f94da570085b820af23cd741ac57cb349eb709c — eval moi, chay tren code cu khong phan biet gi
- bash pipeline/scripts/tap-nhan-hai-khu-db.sh do: bo qua baseline: tep pipeline/scripts/tap-nhan-hai-khu-db.sh co o cay dang kiem nhung chua co o merge-base 4f94da570085b820af23cd741ac57cb349eb709c — eval moi, chay tren code cu khong phan biet gi

## Variance

none — every multi-run eval is uniform

## Iterations

Round 1: bị REJECT (hồ sơ và ảnh chứng lượt 1 đã lưu). Returned to implementation.
Round 2: sửa E5b mở thẳng tầng trục, ghi cách sửa hợp lệ, thêm test giữ danh sách model khớp agent. Returned to implementation.
Round 3: mọi eval xanh, ba tám lệnh suite hồi quy xanh; verdict PASS.
