---
schema_version: 2
feature_slug: ops-duyet-nhip-va-chu
verdict: PASS
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: cd0370c04bd939e1f0ccf334ae940454bebe5cc5
human_signoff: Mạnh 2026-11-08
---

# Evidence Report: ops-duyet-nhip-va-chu

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | test | PASS |
| E2 | AC-2 | test | PASS |
| E3 | AC-3 | test | PASS |
| E4 | AC-4 | test | PASS |
| E5 | AC-5 | test | PASS |
| E6 | AC-6 | test | PASS |
| E7 | AC-7 | test | PASS |
| E8 | AC-8 | test | PASS |
| E9 | AC-9 | test | PASS |
| E10 | AC-10 | test | PASS |
| E11 | AC-4 | ui-check | PASS |
| E12 | AC-8 | test | PASS |
| E13 | AC-8 | test | PASS |
| E14 | AC-7 | script | PASS |

## Evidence

- eval: E1
  run_id: minted-ops-duyet-nhip-va-chu-E1-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.app_ui
  verified_at: 2026-11-08T08:25:37Z
  output: |
    cd app && npm test chạy một lần, bộ test xanh (duration_ms 841688).

- eval: E2
  run_id: minted-ops-duyet-nhip-va-chu-E2-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.app_ui
  verified_at: 2026-11-08T08:25:37Z
  output: |
    cd app && npm test chạy một lần, bộ test xanh (duration_ms 841688).

- eval: E3
  run_id: minted-ops-duyet-nhip-va-chu-E3-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.app_ui
  verified_at: 2026-11-08T08:25:37Z
  output: |
    cd app && npm test chạy một lần, bộ test xanh (duration_ms 841688).

- eval: E4
  run_id: minted-ops-duyet-nhip-va-chu-E4-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.app_ui
  verified_at: 2026-11-08T08:25:37Z
  output: |
    cd app && npm test chạy một lần, bộ test xanh (duration_ms 841688).

- eval: E5
  run_id: minted-ops-duyet-nhip-va-chu-E5-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.app_ui
  verified_at: 2026-11-08T08:25:37Z
  output: |
    cd app && npm test chạy một lần, bộ test xanh (duration_ms 841688).

- eval: E6
  run_id: minted-ops-duyet-nhip-va-chu-E6-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.app_ui
  verified_at: 2026-11-08T08:25:37Z
  output: |
    cd app && npm test chạy một lần, bộ test xanh (duration_ms 841688).

- eval: E7
  run_id: minted-ops-duyet-nhip-va-chu-E7-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.app_ui
  verified_at: 2026-11-08T08:25:37Z
  output: |
    cd app && npm test chạy một lần, bộ test xanh (duration_ms 841688).

- eval: E8
  run_id: minted-ops-duyet-nhip-va-chu-E8-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.app_ui
  verified_at: 2026-11-08T08:25:37Z
  output: |
    cd app && npm test chạy một lần, bộ test xanh (duration_ms 841688).

- eval: E9
  run_id: minted-ops-duyet-nhip-va-chu-E9-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.app_ui
  verified_at: 2026-11-08T08:25:37Z
  output: |
    cd app && npm test chạy một lần, bộ test xanh (duration_ms 841688).

- eval: E10
  run_id: minted-ops-duyet-nhip-va-chu-E10-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.app_ui
  verified_at: 2026-11-08T08:25:37Z
  output: |
    cd app && npm test chạy một lần, bộ test xanh (duration_ms 841688).

- eval: E11
  run_id: minted-ops-duyet-nhip-va-chu-E11-r2
  exit_code: 0
  baseline: n-a
  verifier: config:dev_server.start   # tác tử chấm lái ego-browser trên bản dev của worktree (:3463); bản tổng hợp ghi khoá executors.ui_check không có trong config — sửa nhãn theo tiền lệ của kho
  verified_at: 2026-11-08T08:25:37Z
  screenshot: evidence/E11-step1.png
  observed: |
    step1: Frame «Nhịp duyệt 7 ngày», sáng, 1280 px, bảng 6 cột đủ; Ghép căn 5/2/6,8 giây/19,3 giây/0, Gộp Người 26/2/3,3 giây/1 phút 12 giây/0, năm hạng mục còn lại 0 lượt đo. step2: 3 hàng #213462, #213461, #213460, cột Loại là badge «Người», Trạng thái «Chờ duyệt». step3: đầu sheet «Cùng căn? Phường Thanh Xuân · 76 m² và 82 m²», #105728, badge «Ghép căn» và «Không chắc»; chân sheet nút «Không chắc» và «Lý do: thử OD1». step4: Frame sau tải lại, Ghép căn 4 chờ / 3 đo / 3,2 giây, Gộp Người 26 / 2. step5: ô Căn «Chưa có ảnh», «Chưa rõ loại hình · 76 m² · 3PN», «Thanh Xuân», badge cam «Đang chờ ghép». step6: đầu sheet thẻ #105727 «Cùng căn? Phường Thanh Xuân · 76 m² và 83 m²», badge «Ghép căn», «Chờ duyệt» (URL ?card=105727). step7: Alert vàng có biểu tượng cảnh báo, chữ «Không tìm thấy thẻ #999999». step8: tối 375 px, Frame «Nhịp duyệt 7 ngày», cột Hạng mục và Thẻ chờ thấy đủ, cột «Đã quyết có…» bị cắt trong Frame; Ghép căn 4, Gộp Người 25 (số sau lượt thử). Không có cuộn ngang ở cấp trang.
  network_observed: n-a (driver)

- eval: E12
  run_id: minted-ops-duyet-nhip-va-chu-E12-r2
  exit_code: 0
  baseline: red
  verifier: config:executors.test.app
  verified_at: 2026-11-08T08:25:37Z
  output: |
    tsc --noEmit và npm run lint chạy sạch.

- eval: E13
  run_id: minted-ops-duyet-nhip-va-chu-E13-r2
  exit_code: 0
  baseline: green
  verifier: config:executors.test.ui_lint_rules
  verified_at: 2026-11-08T08:25:37Z
  output: |
    npm run test:lint-rules xanh (duration_ms 205.86).

- eval: E14
  run_id: minted-ops-duyet-nhip-va-chu-E14-r2
  exit_code: 0
  baseline: green
  verifier: config:executors.design.floor
  verified_at: 2026-11-08T08:25:37Z
  output: |
    design-floor-s4 --root . sạch, không thêm mã màu hex thô.

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-ops-duyet-nhip-va-chu-SUITE-npm_test__bb6271-r2
  exit_code: 0
  verified_at: 2026-11-08T08:25:37Z

- cmd: cd pipeline && npm test
  run_id: minted-ops-duyet-nhip-va-chu-SUITE-npm_test__13563d-r2
  exit_code: 0
  verified_at: 2026-11-08T08:25:37Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-ops-duyet-nhip-va-chu-SUITE-node_scripts_check_portal_compliance_mjs-r2
  exit_code: 0
  verified_at: 2026-11-08T08:25:37Z

## Known limits

## Ngoài hợp đồng

## Analyst

Eval không-phân-biệt (xanh cả trên HEAD lẫn baseline, chứng minh harness hơn là tính năng):
- cd app && npm run test:lint-rules: E13 (regression-guard có chủ ý)
- node design-floor-s4.mjs --root .: E14 (regression-guard có chủ ý)

Baseline khong do
- cd app && npm test: baseline vuot tran 180 giay/lenh — da dung ca cay tien trinh; BLOCKED ha tang, khong phai ket qua cua code cu

## Variance

none — every multi-run eval is uniform

## Iterations

Round 1: lịch sử round cũ không kèm theo trong dữ liệu round này.
Round 2: toàn bộ 14 eval và 3 lệnh suite đạt; verdict PASS.
