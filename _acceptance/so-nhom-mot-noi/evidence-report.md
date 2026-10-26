---
schema_version: 2
feature_slug: so-nhom-mot-noi
verdict: PASS
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: eefdf71950d04bdceecf8f2448a2030c56872f8f
human_signoff: Mạnh 2026-10-26
---

# Evidence Report: so-nhom-mot-noi

Round 3. Cả 13 eval của hợp đồng đạt và cả sáu lệnh suite hồi quy đều xanh (kể cả `cd app && npm test`, nơi round 2 còn một ca đỏ của main). Không có mục chờ người chốt, không có phương sai.

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
  run_id: minted-so-nhom-mot-noi-E1-r3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.so_nhom
  verified_at: 2026-10-26T12:55:36Z
  output: |
    cd pipeline && node --test scripts/so-nhom.itest.mjs
    duration_ms 4875.628792

- eval: E2
  run_id: minted-so-nhom-mot-noi-E2-r3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.so_nhom
  verified_at: 2026-10-26T12:55:36Z
  output: |
    cd pipeline && node --test scripts/so-nhom.itest.mjs
    duration_ms 4875.628792

- eval: E3
  run_id: minted-so-nhom-mot-noi-E3-r3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.so_nhom
  verified_at: 2026-10-26T12:55:36Z
  output: |
    cd pipeline && node --test scripts/so-nhom.itest.mjs
    duration_ms 4875.628792

- eval: E4
  run_id: minted-so-nhom-mot-noi-E4-r3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.so_nhom
  verified_at: 2026-10-26T12:55:36Z
  output: |
    cd pipeline && node --test scripts/so-nhom.itest.mjs
    duration_ms 4875.628792

- eval: E5
  run_id: minted-so-nhom-mot-noi-E5-r3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.so_nhom
  verified_at: 2026-10-26T12:55:36Z
  output: |
    cd pipeline && node --test scripts/so-nhom.itest.mjs
    duration_ms 4875.628792

- eval: E6
  run_id: minted-so-nhom-mot-noi-E6-r3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.so_nhom
  verified_at: 2026-10-26T12:55:36Z
  output: |
    cd pipeline && node --test scripts/so-nhom.itest.mjs
    duration_ms 4875.628792

- eval: E7
  run_id: minted-so-nhom-mot-noi-E7-r3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.so_nhom
  verified_at: 2026-10-26T12:55:36Z
  output: |
    cd pipeline && node --test scripts/so-nhom.itest.mjs
    duration_ms 4875.628792

- eval: E8
  run_id: minted-so-nhom-mot-noi-E8-r3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.so_nhom
  verified_at: 2026-10-26T12:55:36Z
  output: |
    cd pipeline && node --test scripts/so-nhom.itest.mjs
    duration_ms 4875.628792

- eval: E9
  run_id: minted-so-nhom-mot-noi-E9-r3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.so_nhom_app
  verified_at: 2026-10-26T12:55:36Z
  output: |
    cd app && node --import tsx --test tests/so-nhom.test.tsx
    duration_ms 2691.355625

- eval: E10
  run_id: minted-so-nhom-mot-noi-E10-r3
  exit_code: 0
  baseline: n-a
  verifier: scripts/ui-capture.sh
  verified_at: 2026-10-26T12:55:36Z
  screenshot: evidence/E10-step1.png
  observed: |
    Đã mở từng ảnh bằng Read. Ảnh step3 và step4 tôi kiểm lại bằng số đo thay vì chỉ nhìn.
    - step1 (1280 sáng): khu "Sổ đơn vị thu · Market S02" hiện "0 đơn vị". Hộp trống có tiêu đề "Chưa có đơn vị nào", dòng "Chạy đồng bộ sổ ở máy thu để đưa đơn vị của nguồn này vào: node pipeline/sync-don-vi.mjs" (chữ đơn cách) và nút "Sao chép lệnh". Phía dưới thấy đầu khu Nhóm S03. Khớp Expected.
    - step2 (1280 sáng): khu "Sổ đơn vị thu · Nhóm S03", phụ đề "2/3 đơn vị đang thu · trạng thái theo cổng S03". Có các tab Tất cả 3, Đang thu 2, Tạm dừng 1, Đã gỡ 0. Cột Mã, Tên gốc, Thị trường, Khu đô thị, Trạng thái. Ba dòng S03-N001 (Thành phố Hà Nội, Ecopark, Đang thu), S03-N002 (Đà Nẵng, Huế, Tạm dừng), S03-N003 (— —, Đang thu). Mỗi dòng có "theo cổng S03" dưới badge, và có nút bút chì. Phía dưới là khu S05 và S06, không có chữ "theo cổng". Nền sáng. Khớp.
    - step3 (1280 tối): cùng khu S03, nền gần đen, chữ sáng, badge xanh và vàng vẫn đọc được, đủ cột và "theo cổng S03". Khác step2 về nền (body lab(2.75 0 0) so với lab(100 0 0)). Khớp.
    - step4 (390 sáng): khu S03 hẹp. Chỉ thấy cột Mã và Tên gốc, cột Thị trường bị cắt ở mép phải, thanh cuộn ngang trong khung lưới. Tab strip cũng cuộn ngang. Trang không tràn: scrollWidth=clientWidth=390. Khớp.
    - step5 (1280 sáng): lớp phủ mờ, hộp thoại "Khai thị trường, khu đô thị", mô tả "S03-N002 · Nhóm S03 chưa có tên. Để trống một ô là xoá khai báo của ô đó." Ô "Thị trường" (đã có hai thẻ Đà Nẵng và Huế, ghi chú "Thị trường mà đơn vị này thu tin.") và ô "Khu đô thị" (placeholder "Chọn khu đô thị…", ghi chú nói nhóm chuyên một khu đô thị). Nút Huỷ và Lưu. Khớp.
    - step5b: danh sách thả xuống thị trường mở, "Thành phố Hồ Chí Minh" được chọn (dấu tích), thẻ thứ ba hiện ở ô. Khớp.
    - step6 (1280 sáng): hộp thoại đã đóng, dòng S03-N002 hiện "Thành phố Đà Nẵng, Thành phố Huế, Thành phố Hồ Chí Minh" (xuống ba dòng chữ), Tạm dừng, "theo cổng S03". Khớp.
    Không có điểm nào mâu thuẫn Expected.
  network_observed: clean

- eval: E11
  run_id: minted-so-nhom-mot-noi-E11-r3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.so_nhom_app
  verified_at: 2026-10-26T12:55:36Z
  output: |
    cd app && node --import tsx --test tests/so-nhom.test.tsx
    duration_ms 2691.355625

- eval: E12
  run_id: minted-so-nhom-mot-noi-E12-r3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.so_nhom
  verified_at: 2026-10-26T12:55:36Z
  output: |
    cd pipeline && node --test scripts/so-nhom.itest.mjs
    duration_ms 4875.628792

- eval: E13
  run_id: minted-so-nhom-mot-noi-E13-r3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.vong_doi_nguon
  verified_at: 2026-10-26T12:55:36Z
  output: |
    cd pipeline && node --test scripts/vong-doi.test.mjs scripts/vong-doi.itest.mjs
    duration_ms 863.355

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-so-nhom-mot-noi-SUITE-npm_test__bb6271-r3
  exit_code: 0
  verified_at: 2026-10-26T12:55:36Z

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-so-nhom-mot-noi-SUITE-lint-r3
  exit_code: 0
  verified_at: 2026-10-26T12:55:36Z

- cmd: cd app && npm test
  run_id: minted-so-nhom-mot-noi-SUITE-npm_test__bd9a35-r3
  exit_code: 0
  verified_at: 2026-10-26T12:55:36Z

- cmd: cd pipeline && npm test
  run_id: minted-so-nhom-mot-noi-SUITE-npm_test__13563d-r3
  exit_code: 0
  verified_at: 2026-10-26T12:55:36Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-so-nhom-mot-noi-SUITE-test_lint_rules-r3
  exit_code: 0
  verified_at: 2026-10-26T12:55:36Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-so-nhom-mot-noi-SUITE-node_scripts_check_portal_compliance_mjs-r3
  exit_code: 0
  verified_at: 2026-10-26T12:55:36Z

## Known limits

## Ngoài hợp đồng

## Analyst

baseline: BLOCKED ha tang — lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «<\tool_use_error>Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.<\/tool_use_error>»

Không có eval nào được đo baseline ở round này, nên mọi field baseline đều là n-a và không thể kết luận eval nào có phân biệt hay không.

none — không đo được ở round này (baseline BLOCKED hạ tầng); danh sách eval không-phân-biệt không áp dụng.

### Baseline khong do

- cd pipeline && node --test scripts/so-nhom.itest.mjs: BLOCKED ha tang baseline: lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «<\tool_use_error>Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.<\/tool_use_error>»
- cd app && node --import tsx --test tests/so-nhom.test.tsx: BLOCKED ha tang baseline: lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «<\tool_use_error>Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.<\/tool_use_error>»
- cd pipeline && node --test scripts/vong-doi.test.mjs scripts/vong-doi.itest.mjs: BLOCKED ha tang baseline: lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «<\tool_use_error>Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.<\/tool_use_error>»

## Variance

none — every multi-run eval is uniform (mọi eval chạy một lần, không có phương sai).

## Iterations

Round 1: cả 13 eval đạt, nhưng lệnh suite `cd app && npm test` thất bại ở tests/ops-nhan-theo-context.test.tsx và tests/ops-review-sources-cloud.test.tsx (không gắn eval nào) nên verdict là REJECT. Trả về cho khâu triển khai.
Round 2: cả 13 eval đạt, nhưng lệnh suite `cd app && npm test` vẫn thất bại ở một ca khác, tests/deals-phi-ly.test.tsx «DP-AC-5 bản cloud» (DROP COLUMN trên sale_offers bị từ chối vì là view), không gắn eval nào nên verdict vẫn là REJECT. Trả về cho khâu triển khai.
Round 3: cả 13 eval đạt và cả sáu lệnh suite hồi quy xanh sau khi nhánh gộp main (ca DP-AC-5 đã sửa ở main), nên verdict là PASS. Các phát hiện ngoài hợp đồng nằm ở review-findings.md để người quyết ở Gate 2.
