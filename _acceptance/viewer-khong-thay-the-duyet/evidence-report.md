---
schema_version: 2
feature_slug: viewer-khong-thay-the-duyet
verdict: PASS
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 2c8414f9c968c060892ff8d62566eaf3a1925196
human_signoff:
---

# Evidence Report: viewer-khong-thay-the-duyet

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
| E9 | AC-9 | ui-check | PASS |
| E10 | AC-9 | test | PASS |

## Evidence

- eval: E1
  run_id: minted-viewer-khong-thay-the-duyet-E1-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.viewer_the_duyet
  verified_at: 2026-10-29T08:28:56Z
  output: |
    cd app && node --import tsx --test tests/viewer-the-duyet.test.tsx
    ca 'VT-AC-1' xanh (một lần chạy chung với E2-E6, E8)
    ℹ duration_ms 2482.2255

- eval: E2
  run_id: minted-viewer-khong-thay-the-duyet-E2-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.viewer_the_duyet
  verified_at: 2026-10-29T08:28:56Z
  output: |
    cd app && node --import tsx --test tests/viewer-the-duyet.test.tsx
    ca 'VT-AC-2' xanh (một lần chạy chung với E1, E3-E6, E8)
    ℹ duration_ms 2482.2255

- eval: E3
  run_id: minted-viewer-khong-thay-the-duyet-E3-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.viewer_the_duyet
  verified_at: 2026-10-29T08:28:56Z
  output: |
    cd app && node --import tsx --test tests/viewer-the-duyet.test.tsx
    ca 'VT-AC-3' xanh (một lần chạy chung với E1, E2, E4-E6, E8)
    ℹ duration_ms 2482.2255

- eval: E4
  run_id: minted-viewer-khong-thay-the-duyet-E4-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.viewer_the_duyet
  verified_at: 2026-10-29T08:28:56Z
  output: |
    cd app && node --import tsx --test tests/viewer-the-duyet.test.tsx
    ca 'VT-AC-4' xanh (một lần chạy chung với E1-E3, E5, E6, E8)
    ℹ duration_ms 2482.2255

- eval: E5
  run_id: minted-viewer-khong-thay-the-duyet-E5-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.viewer_the_duyet
  verified_at: 2026-10-29T08:28:56Z
  output: |
    cd app && node --import tsx --test tests/viewer-the-duyet.test.tsx
    ca 'VT-AC-5' xanh (một lần chạy chung với E1-E4, E6, E8)
    ℹ duration_ms 2482.2255

- eval: E6
  run_id: minted-viewer-khong-thay-the-duyet-E6-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.viewer_the_duyet
  verified_at: 2026-10-29T08:28:56Z
  output: |
    cd app && node --import tsx --test tests/viewer-the-duyet.test.tsx
    ca 'VT-AC-6' xanh (một lần chạy chung với E1-E5, E8)
    ℹ duration_ms 2482.2255

- eval: E7
  run_id: minted-viewer-khong-thay-the-duyet-E7-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.app_ui
  verified_at: 2026-10-29T08:28:56Z
  output: |
    cd app && npm test
    cả bộ test app chạy một tiến trình, không chạy chồng
    ℹ duration_ms 41458.69425

- eval: E8
  run_id: minted-viewer-khong-thay-the-duyet-E8-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.viewer_the_duyet
  verified_at: 2026-10-29T08:28:56Z
  output: |
    cd app && node --import tsx --test tests/viewer-the-duyet.test.tsx
    ca 'VT-AC-8' xanh (một lần chạy chung với E1-E6)
    ℹ duration_ms 2482.2255

- eval: E9
  run_id: minted-viewer-khong-thay-the-duyet-E9-r1
  exit_code: 0
  baseline: n-a
  verifier: scripts/ui-capture.sh
  verified_at: 2026-10-29T08:28:56Z
  screenshot: evidence/E9-step1.png
  observed: |
    E9-step1.png (viewer, /ops/review): sidebar ghi viewer-test@local.test / 'Người xem'; tieu de 'Hàng duyệt', dong '11 thẻ đang chờ', chip 'entity_match: 11', mot Alert tim 'Nội dung thẻ chỉ hiện cho vai Vận hành trở lên.' va trang trong phia duoi — khong co hang the nao. Khop expected.
    E9-step2.png (viewer, /ops/data-flow): trang 'Dòng chảy dữ liệu' 36.226 bai, sankey S03/S06, bo loc nguon Tất cả/S03/S05/S06; khung dan nhap cho buoc mo sheet.
    E9-step3.png (viewer, sheet S03 'Cho thuê · 6 tỷ'): cac khoi Truong loi 2/5, Phan loai, Truong da doc, Lam giau va can, 'Ảnh tin' voi 'Ảnh tin chỉ hiện cho quản trị viên.'
    E9-step3b.png (viewer, sheet cuon cuoi): tiep tuc toi muc cuoi 'Bài gốc' voi dung cau 'Bài gốc chỉ hiện cho vai Vận hành trở lên.'; khong co khoi trich bai/ten nhom/SDT. Khop expected.
    E9-step4.png (admin ops-test@local.test, 'Quản trị', /ops/review): 'Danh sách thẻ' 11 thẻ, luoi 11 hang 'Cùng căn? ...' #24..#14 loai Ghép căn, trang thai Chờ duyệt; khong co cau han che. Khop expected.
    E9-step5.png (admin, sheet cung ban ghi): dau sheet giong viewer, muc 'Ảnh tin' co o anh hong ('Ảnh hỏng').
    E9-step5b.png (admin, sheet cuon cuoi): muc 'Bài gốc' co khoi trich bai day du (tieu de nhom, 'Cho thuê', Mã căn, Loại căn, Giá thuê, Lh..., duong dan anh) — co khoi trich bai, khop expected. Lech de bai duy nhat: ban ghi la S03 vi khong co ban ghi S05 trong luoi.
  network_observed: clean   # words only — raw statuses live in evidence/E9-network.txt

- eval: E10
  run_id: minted-viewer-khong-thay-the-duyet-E10-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.dev_ops_account
  verified_at: 2026-10-29T08:28:56Z
  output: |
    node --test scripts/dev-ops-account.test.mjs
    ca mới trong describe 'vai viewer' và các ca cũ của tệp đều xanh
    ℹ duration_ms 528.630125

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-viewer-khong-thay-the-duyet-SUITE-npm_test__bb6271-r1
  exit_code: 0
  verified_at: 2026-10-29T08:28:56Z

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-viewer-khong-thay-the-duyet-SUITE-lint-r1
  exit_code: 0
  verified_at: 2026-10-29T08:28:56Z

- cmd: cd pipeline && npm test
  run_id: minted-viewer-khong-thay-the-duyet-SUITE-npm_test__13563d-r1
  exit_code: 0
  verified_at: 2026-10-29T08:28:56Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-viewer-khong-thay-the-duyet-SUITE-test_lint_rules-r1
  exit_code: 0
  verified_at: 2026-10-29T08:28:56Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-viewer-khong-thay-the-duyet-SUITE-node_scripts_check_portal_compliance_mjs-r1
  exit_code: 0
  verified_at: 2026-10-29T08:28:56Z

## Known limits

## Ngoài hợp đồng

## Analyst

baseline: BLOCKED ha tang — lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.»

Baseline khong do:
- cd app && node --import tsx --test tests/viewer-the-duyet.test.tsx: BLOCKED ha tang baseline: lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.»
- cd app && npm test: BLOCKED ha tang baseline: lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.»
- node --test scripts/dev-ops-account.test.mjs: BLOCKED ha tang baseline: lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.»

Eval không-phân-biệt: none — baseline không đo được ở round này nên danh sách xanh-cả-hai-phía không xác định được; không có eval nào bị xác nhận là không-phân-biệt.

## Variance

none — every multi-run eval is uniform (mọi eval chạy một lần, deterministic)

## Iterations

Round 1: E1-E10 đều đạt, không eval nào hỏng; không có judgment item. Verdict PASS.
