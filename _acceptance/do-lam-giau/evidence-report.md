---
schema_version: 2
feature_slug: do-lam-giau
verdict: PASS
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 70508a6a0f1a3ca5fc76d68a7a6f2027e20d6a41
human_signoff:
---

# Evidence Report: do-lam-giau

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | test | PASS |
| E2 | AC-2 | test | PASS |
| E3 | AC-3 | test | PASS |
| E4 | AC-4 | test | PASS |
| E5 | AC-5 | test | PASS |
| E6 | AC-6 | test | PASS |
| E7 | AC-7 | test | PASS (carry-forward tu round 2) |
| E8 | AC-7 | ui-check | PASS (carry-forward tu round 2) |
| E9 | AC-8 | test | PASS |
| E10 | AC-9 | test | PASS (carry-forward tu round 1) |

## Evidence

- eval: E1
  run_id: minted-do-lam-giau-E1-r3
  exit_code: 0
  baseline: red
  verifier: config:executors.test.pipeline
  verified_at: 2026-11-09T01:14:06Z
  output: |
    cd pipeline && npm test (ca DO3-AC-1 va DO3-AC-1-THAT nam trong bo chay)
    duration_ms 909672.251542

- eval: E2
  run_id: minted-do-lam-giau-E2-r3
  exit_code: 0
  baseline: red
  verifier: config:executors.test.pipeline
  verified_at: 2026-11-09T01:14:06Z
  output: |
    cd pipeline && npm test (ca DO3-AC-2 nam trong bo chay)
    duration_ms 909672.251542

- eval: E3
  run_id: minted-do-lam-giau-E3-r3
  exit_code: 0
  baseline: red
  verifier: config:executors.test.pipeline
  verified_at: 2026-11-09T01:14:06Z
  output: |
    cd pipeline && npm test (ca DO3-AC-3 nam trong bo chay)
    duration_ms 909672.251542

- eval: E4
  run_id: minted-do-lam-giau-E4-r3
  exit_code: 0
  baseline: red
  verifier: config:executors.test.pipeline
  verified_at: 2026-11-09T01:14:06Z
  output: |
    cd pipeline && npm test (ca DO3-AC-4 nam trong bo chay)
    duration_ms 909672.251542

- eval: E5
  run_id: minted-do-lam-giau-E5-r3
  exit_code: 0
  baseline: red
  verifier: config:executors.test.pipeline
  verified_at: 2026-11-09T01:14:06Z
  output: |
    cd pipeline && npm test (ca DO3-AC-5 nam trong bo chay)
    duration_ms 909672.251542

- eval: E6
  run_id: minted-do-lam-giau-E6-r3
  exit_code: 0
  baseline: red
  verifier: config:executors.test.pipeline
  verified_at: 2026-11-09T01:14:06Z
  output: |
    cd pipeline && npm test (ca DO3-AC-6 nam trong bo chay)
    duration_ms 909672.251542

- eval: E9
  run_id: minted-do-lam-giau-E9-r3
  exit_code: 0
  baseline: red
  verifier: config:executors.test.pipeline
  verified_at: 2026-11-09T01:14:06Z
  output: |
    cd pipeline && npm test (ca DO3-AC-8 nam trong bo chay)
    duration_ms 909672.251542

- eval: E7
  run_id: minted-do-lam-giau-E7-r2
  exit_code: 0
  verifier: config:executors.test.app_ui
  verified_at: 2026-11-09T00:39:17Z
  carried_from_round: 2
  output: |
    carry-forward tu round 2 — delta khong cham paths cua eval

- eval: E8
  run_id: minted-do-lam-giau-E8-r2
  exit_code: 0
  verifier: ui-check
  verified_at: 2026-11-09T00:39:17Z
  carried_from_round: 2
  screenshot: evidence/E8-step1.png
  observed: |
    step1 (1280 sáng): khối «Làm giàu» sau «Đo hằng ngày», tab lát Tổng/Thị trường/Phường/xã/Khu đô thị/Toà. Bảng «Thay đổi theo ngày · 2026-11-09»: Số qua người đăng Đã đo 907, thêm 1, đổi 1, máy rút 1, người sửa 0, «không có đường người rút»; Quy ước nhóm Đã đo 34.580, 1/1/1/1, «không có đường người rút»; Diện tích suy ra và Danh mục CĐT badge «Chưa chạy» với dấu —. Bảng «Kiểm ngược theo tuần»: 87,2% n=1.213 cận dưới 85,2%; 91,0% n=8.095 cận 90,4%; tuần trước giống, chênh 0,0%; hai đường kia «Chưa chạy». Khớp Expected.
    step2 (1280 sáng, bấm Phường/xã): tab Phường/xã được chọn, URL ?lat-do=phuong, hai bảng «Thay đổi theo phường/xã» (ô vn-hanoi-ba-dinh…, dòng Tổng 907/1/1/1, phân trang 1–10/24) và «Kiểm ngược theo phường/xã» (đúng/sai/không ra, tỉ lệ 100,0% n=6, «ít mẫu · n=2»); ghi chú Diện tích suy ra/Danh mục CĐT chưa chạy. Khớp.
    step3 (1280 tối): cùng nội dung step1 trên nền đen, chữ trắng/xám sáng, badge xanh «Đã đo» và đỏ «Không đạt» đọc được, không chữ chìm. Khớp.
    step4 (375 sáng): thanh bên ẩn, khối «Làm giàu» xếp một cột, tab lát cuộn ngang, hai bảng nằm trong khung có thanh cuộn ngang riêng (cắt cột sau Trạng thái), trang không tràn ngang; scrollWidth=clientWidth=375. Khớp.
  network_observed: n-a (driver)
  # carry-forward tu round 2 — delta khong cham paths cua eval

- eval: E10
  run_id: minted-do-lam-giau-E10-r1
  exit_code: 0
  verifier: config:executors.test.job_exit
  verified_at: 2026-11-08T23:21:32Z
  carried_from_round: 1
  output: |
    carry-forward tu round 1 — delta khong cham paths cua eval

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-do-lam-giau-SUITE-npm_test__bb6271-r3
  exit_code: 0
  verified_at: 2026-11-09T01:14:06Z

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-do-lam-giau-SUITE-lint-r3
  exit_code: 0
  verified_at: 2026-11-09T01:14:06Z

- cmd: cd app && npm test
  run_id: minted-do-lam-giau-SUITE-npm_test__bd9a35-r3
  exit_code: 0
  verified_at: 2026-11-09T01:14:06Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-do-lam-giau-SUITE-test_lint_rules-r3
  exit_code: 0
  verified_at: 2026-11-09T01:14:06Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-do-lam-giau-SUITE-node_scripts_check_portal_compliance_mjs-r3
  exit_code: 0
  verified_at: 2026-11-09T01:14:06Z

## Known limits

## Ngoài hợp đồng

## Analyst

none — moi eval feature deu red tren baseline (co phan biet)

## Variance

none — every multi-run eval is uniform

## Iterations

Round 1: E7 do (app_ui) — cac eval khac xanh; round tra ve trien khai (loi duong dang chay ve 0 gia tri bi bao «chua chay»).
Round 2: E1-E10 xanh nhung con hai finding muc cao trong hop dong AC-2 (duong mat het gia tri: lan chay sau lai thanh «chua chay» va xoa dong may_rut). Tra ve trien khai.
Round 3: E1-E6, E9 chay lai tren 70508a6a (dau «da lap moc» ben); E7, E8 carry-forward tu round 2, E10 tu round 1. Tat ca PASS.
