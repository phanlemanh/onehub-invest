---
schema_version: 2
feature_slug: ops-duyet-hop-hang-muc
verdict: PASS
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 2fedfe89e54221d3c5022b4bd8dcb983b32c5b50
human_signoff:
---

# Evidence Report: ops-duyet-hop-hang-muc

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | test | PASS |
| E2 | AC-2 | test | PASS |
| E3 | AC-3 | test | PASS |
| E4 | AC-4 | test | PASS |
| E5 | AC-5 | test | PASS |
| E6 | AC-6 | test | PASS |
| E7 | AC-7 | test | PASS |
| E8 | AC-3 | ui-check | PASS |
| E9 | AC-4 | test | PASS |
| E10 | AC-2 | test | PASS |
| E11 | AC-2 | script | PASS |

## Evidence

- eval: E1
  run_id: minted-ops-duyet-hop-hang-muc-E1-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.app_ui
  verified_at: 2026-11-08T12:59:25Z
  output: |
    cd app && npm test (gộp E1-E7)
    ℹ duration_ms 706869.840625

- eval: E2
  run_id: minted-ops-duyet-hop-hang-muc-E2-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.app_ui
  verified_at: 2026-11-08T12:59:25Z
  output: |
    cd app && npm test (gộp E1-E7)
    ℹ duration_ms 706869.840625

- eval: E3
  run_id: minted-ops-duyet-hop-hang-muc-E3-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.app_ui
  verified_at: 2026-11-08T12:59:25Z
  output: |
    cd app && npm test (gộp E1-E7)
    ℹ duration_ms 706869.840625

- eval: E4
  run_id: minted-ops-duyet-hop-hang-muc-E4-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.app_ui
  verified_at: 2026-11-08T12:59:25Z
  output: |
    cd app && npm test (gộp E1-E7)
    ℹ duration_ms 706869.840625

- eval: E5
  run_id: minted-ops-duyet-hop-hang-muc-E5-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.app_ui
  verified_at: 2026-11-08T12:59:25Z
  output: |
    cd app && npm test (gộp E1-E7)
    ℹ duration_ms 706869.840625

- eval: E6
  run_id: minted-ops-duyet-hop-hang-muc-E6-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.app_ui
  verified_at: 2026-11-08T12:59:25Z
  output: |
    cd app && npm test (gộp E1-E7)
    ℹ duration_ms 706869.840625

- eval: E7
  run_id: minted-ops-duyet-hop-hang-muc-E7-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.app_ui
  verified_at: 2026-11-08T12:59:25Z
  output: |
    cd app && npm test (gộp E1-E7)
    ℹ duration_ms 706869.840625

- eval: E8
  run_id: minted-ops-duyet-hop-hang-muc-E8-r2
  exit_code: 0
  baseline: n-a
  verifier: config:dev_server.start   # tác tử chấm lái ego-browser trên bản dev của worktree (:3463); bản tổng hợp ghi khoá executors.ui_check không có trong config — sửa nhãn theo tiền lệ của kho
  verified_at: 2026-11-08T12:59:25Z
  screenshot: evidence/E8-step1.png
  observed: |
    step1: dải PageHeader sáng, 'Vận hành > Hàng duyệt', tiêu đề 'Hàng duyệt' và ba badge 'Chờ duyệt 663', 'Quá 3 ngày 614', 'Đã quyết hôm nay 8'. Khớp Expected. step2: hộp 'Hạng mục' có 'Tất cả 663' và 7 mục, mỗi mục kèm số chờ và 'cũ nhất N ngày · trung vị ...'; Ghép căn 'trung vị 3 giây', Gộp Người 'trung vị 9 giây'.
    step3: đầu sheet '1/23 · Gộp Người' với nút K, J, biểu tượng bàn phím '?' và nút đóng. step4: Dialog 'Phím tắt' liệt đủ phím (J, ↓, K, ↑, Esc, 1–4, R, ?). step5: sau phím '3' sheet sang '1/21 · Gộp Người' với thẻ kế; toast 'Đã ghi #166532 · Hoãn' có nút 'Hoàn tác' (đối chiếu bằng DOM). step6: sau hoàn tác về đúng thẻ cũ '1/22'.
    step7: Frame 'Quyết định gần đây' dòng đầu '#166532 ... Gộp Người?' badge 'Hoãn', 'Lý do: Hoãn'. step8: tối, 375 px, hộp 'Hạng mục' thành dải ngang cuộn trong hộp, trang không cuộn ngang. Ghi chú lệch quy trình: lần chạy thử đầu đã bấm '3' trên #166531 nên bước 5-6 làm trên #166532; DB thử có thêm 2 lượt Hoãn.
  network_observed: clean

- eval: E9
  run_id: minted-ops-duyet-hop-hang-muc-E9-r2
  exit_code: 0
  baseline: red
  verifier: config:executors.test.app
  verified_at: 2026-11-08T12:59:25Z
  output: |
    cd app && npx tsc --noEmit && npm run lint sạch

- eval: E10
  run_id: minted-ops-duyet-hop-hang-muc-E10-r2
  exit_code: 0
  baseline: green
  verifier: config:executors.test.ui_lint_rules
  verified_at: 2026-11-08T12:59:25Z
  output: |
    ℹ duration_ms 193.586

- eval: E11
  run_id: minted-ops-duyet-hop-hang-muc-E11-r2
  exit_code: 0
  baseline: green
  verifier: config:executors.design.floor
  verified_at: 2026-11-08T12:59:25Z
  output: |
    design-floor-s4 --root . đạt

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-ops-duyet-hop-hang-muc-SUITE-npm_test__bb6271-r2
  exit_code: 0
  verified_at: 2026-11-08T12:59:25Z

- cmd: cd pipeline && npm test
  run_id: minted-ops-duyet-hop-hang-muc-SUITE-npm_test__13563d-r2
  exit_code: 0
  verified_at: 2026-11-08T12:59:25Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-ops-duyet-hop-hang-muc-SUITE-node_scripts_check_portal_compliance_mjs-r2
  exit_code: 0
  verified_at: 2026-11-08T12:59:25Z

## Known limits

## Ngoài hợp đồng

## Analyst

Eval không-phân-biệt (xanh cả trên HEAD lẫn baseline):
- cd app && npm run test:lint-rules: E10 (regression-guard có chủ ý)
- node design-floor-s4.mjs --root .: E11 (regression-guard có chủ ý)

Baseline khong do
- cd app && npm test: baseline vuot tran 180 giay/lenh — da dung ca cay tien trinh; BLOCKED ha tang, khong phai ket qua cua code cu

## Variance

none — every multi-run eval is uniform

## Iterations

Round 2: mọi eval E1-E11 đạt, ba lệnh suite xanh; verdict PASS. Lịch sử round 1 nằm ở bản báo cáo trước, không đưa vào dữ liệu round này.
