---
schema_version: 2
feature_slug: so-nhom-mot-noi
verdict: REJECT
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: cf7aecf9dfa11a00ddb2b4e1c4fb7f461ee67ce7
human_signoff:
---

# Evidence Report: so-nhom-mot-noi

Round 1. Cả 13 eval của hợp đồng đạt, nhưng verdict là REJECT vì lệnh suite `cd app && npm test` thất bại và không gắn eval nào (xem mục «Lệnh suite (hồi quy)»). Vì vậy `failed_evals` để trống.

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | test | PASS |
| E2 | AC-2 | test | PASS |
| E3 | AC-2 | test | PASS |
| E4 | AC-3 | test | PASS |
| E5 | AC-4 | test | PASS |
| E6 | AC-5 | test | PASS |
| E7 | AC-6 | test | PASS |
| E8 | AC-7 | test | PASS |
| E9 | AC-8 | test | PASS |
| E10 | AC-8 | ui-check | PASS |
| E11 | AC-9 | test | PASS |
| E12 | AC-10 | test | PASS |
| E13 | AC-2 | test | PASS |

## Evidence

- eval: E1
  run_id: minted-so-nhom-mot-noi-E1-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.so_nhom
  verified_at: 2026-10-26T12:09:10Z
  output: |
    cd pipeline && node --test scripts/so-nhom.itest.mjs
    ℹ duration_ms 4683.976833

- eval: E2
  run_id: minted-so-nhom-mot-noi-E2-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.so_nhom
  verified_at: 2026-10-26T12:09:10Z
  output: |
    cd pipeline && node --test scripts/so-nhom.itest.mjs
    ℹ duration_ms 4683.976833

- eval: E3
  run_id: minted-so-nhom-mot-noi-E3-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.so_nhom
  verified_at: 2026-10-26T12:09:10Z
  output: |
    cd pipeline && node --test scripts/so-nhom.itest.mjs
    ℹ duration_ms 4683.976833

- eval: E4
  run_id: minted-so-nhom-mot-noi-E4-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.so_nhom
  verified_at: 2026-10-26T12:09:10Z
  output: |
    cd pipeline && node --test scripts/so-nhom.itest.mjs
    ℹ duration_ms 4683.976833

- eval: E5
  run_id: minted-so-nhom-mot-noi-E5-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.so_nhom
  verified_at: 2026-10-26T12:09:10Z
  output: |
    cd pipeline && node --test scripts/so-nhom.itest.mjs
    ℹ duration_ms 4683.976833

- eval: E6
  run_id: minted-so-nhom-mot-noi-E6-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.so_nhom
  verified_at: 2026-10-26T12:09:10Z
  output: |
    cd pipeline && node --test scripts/so-nhom.itest.mjs
    ℹ duration_ms 4683.976833

- eval: E7
  run_id: minted-so-nhom-mot-noi-E7-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.so_nhom
  verified_at: 2026-10-26T12:09:10Z
  output: |
    cd pipeline && node --test scripts/so-nhom.itest.mjs
    ℹ duration_ms 4683.976833

- eval: E8
  run_id: minted-so-nhom-mot-noi-E8-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.so_nhom
  verified_at: 2026-10-26T12:09:10Z
  output: |
    cd pipeline && node --test scripts/so-nhom.itest.mjs
    ℹ duration_ms 4683.976833

- eval: E12
  run_id: minted-so-nhom-mot-noi-E12-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.so_nhom
  verified_at: 2026-10-26T12:09:10Z
  output: |
    cd pipeline && node --test scripts/so-nhom.itest.mjs
    ℹ duration_ms 4683.976833

- eval: E9
  run_id: minted-so-nhom-mot-noi-E9-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.so_nhom_app
  verified_at: 2026-10-26T12:09:10Z
  output: |
    cd app && node --import tsx --test tests/so-nhom.test.tsx
    ℹ duration_ms 2707.774916

- eval: E11
  run_id: minted-so-nhom-mot-noi-E11-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.so_nhom_app
  verified_at: 2026-10-26T12:09:10Z
  output: |
    cd app && node --import tsx --test tests/so-nhom.test.tsx
    ℹ duration_ms 2707.774916

- eval: E13
  run_id: minted-so-nhom-mot-noi-E13-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.vong_doi_nguon
  verified_at: 2026-10-26T12:09:10Z
  output: |
    cd pipeline && node --test scripts/vong-doi.test.mjs scripts/vong-doi.itest.mjs
    ℹ duration_ms 926.306167

- eval: E10
  run_id: minted-so-nhom-mot-noi-E10-r1
  exit_code: 0
  baseline: n-a
  verifier: scripts/ui-capture.sh
  verified_at: 2026-10-26T12:09:10Z
  screenshot: evidence/E10-step1.png   # khung đầu; còn E10-step2..step6 và E10-step5b-dachon
  observed: |
    Đã mở từng ảnh bằng Read, đối chiếu Expected. step1: khu «Sổ đơn vị thu · Market S02», «0 đơn vị», trạng thái trống «Chưa có đơn vị nào» kèm lệnh «node pipeline/sync-don-vi.mjs» và nút «Sao chép lệnh». step2: khu «Nhóm S03» «2/3 đơn vị đang thu · trạng thái theo gateway», các tab Tất cả 3 / Đang thu 2 / Tạm dừng 1 / Đã gỡ 0, cột Mã, Tên gốc, Thị trường, Dự án, Trạng thái, nút bút chì; mỗi dòng S03 có chữ «theo gateway».
    step3 (tối): cùng bố cục, nhãn Đang thu xanh và Tạm dừng vàng vẫn đọc rõ. step4 (khổ 390): cột Mã và Tên gốc hiện, các cột còn lại cuộn ngang trong lưới, trang không cuộn ngang. step5: hộp «Khai thị trường, dự án» có ô Thị trường, ô Dự án, nút Huỷ và Lưu; step5b: chip «Thành phố Đà Nẵng» đã chọn.
    step6: sau Lưu hộp đóng, dòng S03-N002 hiện «Thành phố Đà Nẵng» ở cột Thị trường, Dự án «—», các dòng khác giữ nguyên. Lưu ý: tên S05/S06 hiện chữ thật ở step6 là dữ liệu giả của lược đồ sn_ui, mask chỉ chạy một lần lúc nạp trang.
  network_observed: clean   # raw status ở evidence/E10-network.txt

### Lệnh suite (hồi quy)

Lệnh `cd app && npm test` thất bại (exit_code ghi dưới), không gắn eval nào. Phần đuôi kết quả cho thấy hai ca đỏ. Ca thứ nhất trong tests/ops-nhan-theo-context.test.tsx (dòng 68): danh sách tệp thực tế có thêm `src/components/ops/sources/so-don-vi-dialog.tsx` và `src/components/ops/sources/so-don-vi.tsx` so với danh sách mong đợi chỉ có `src/components/ops/review-content.tsx`. Ca thứ hai trong tests/ops-review-sources-cloud.test.tsx, ca «RS-AC-3 đối chứng» (dòng 84): có thông báo «Không đọc được sổ đơn vị thu» trong khi mong đợi không có thông báo nào. Các lệnh suite còn lại đạt.

- cmd: cd agent && npm test
  run_id: minted-so-nhom-mot-noi-SUITE-npm_test__bb6271-r1
  exit_code: 0
  verified_at: 2026-10-26T12:09:10Z

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-so-nhom-mot-noi-SUITE-lint-r1
  exit_code: 0
  verified_at: 2026-10-26T12:09:10Z

- cmd: cd app && npm test
  run_id: minted-so-nhom-mot-noi-SUITE-npm_test__bd9a35-r1
  exit_code: 1
  verified_at: 2026-10-26T12:09:10Z

- cmd: cd pipeline && npm test
  run_id: minted-so-nhom-mot-noi-SUITE-npm_test__13563d-r1
  exit_code: 0
  verified_at: 2026-10-26T12:09:10Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-so-nhom-mot-noi-SUITE-test_lint_rules-r1
  exit_code: 0
  verified_at: 2026-10-26T12:09:10Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-so-nhom-mot-noi-SUITE-node_scripts_check_portal_compliance_mjs-r1
  exit_code: 0
  verified_at: 2026-10-26T12:09:10Z

## Known limits

## Ngoài hợp đồng

## Analyst

baseline: BLOCKED ha tang — lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «<\tool_use_error>Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.<\/tool_use_error>»

Mọi field baseline ghi n-a; danh sách eval không-phân-biệt không đo được ở round này.

### Baseline khong do

- cd pipeline && node --test scripts/so-nhom.itest.mjs: BLOCKED ha tang baseline: lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «<\tool_use_error>Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.<\/tool_use_error>»
- cd app && node --import tsx --test tests/so-nhom.test.tsx: BLOCKED ha tang baseline: lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «<\tool_use_error>Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.<\/tool_use_error>»
- cd pipeline && node --test scripts/vong-doi.test.mjs scripts/vong-doi.itest.mjs: BLOCKED ha tang baseline: lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «<\tool_use_error>Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.<\/tool_use_error>»

## Variance

none — every multi-run eval is uniform (mọi eval chạy một lần, không có eval ngẫu nhiên).

## Iterations

Round 1: cả 13 eval đạt, nhưng lệnh suite `cd app && npm test` thất bại ở tests/ops-nhan-theo-context.test.tsx và tests/ops-review-sources-cloud.test.tsx (không gắn eval nào) nên verdict là REJECT. Trả về cho khâu triển khai.
