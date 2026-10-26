---
schema_version: 2
feature_slug: so-nhom-mot-noi
verdict: REJECT
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: baa80ad32f385697205cec902054be53d087c5ba
human_signoff:
---

# Evidence Report: so-nhom-mot-noi

Round 2. Cả 13 eval của hợp đồng đạt, nhưng verdict là REJECT vì lệnh suite `cd app && npm test` thất bại ở một ca (tests/deals-phi-ly.test.tsx, ca DP-AC-5 bản cloud) và lệnh này không gắn eval nào (xem mục «Lệnh suite (hồi quy)»). Vì vậy `failed_evals` để trống.

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
  run_id: minted-so-nhom-mot-noi-E1-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.so_nhom
  verified_at: 2026-10-26T12:25:35Z
  output: |
    cd pipeline && node --test scripts/so-nhom.itest.mjs
    duration_ms 4518.014209

- eval: E2
  run_id: minted-so-nhom-mot-noi-E2-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.so_nhom
  verified_at: 2026-10-26T12:25:35Z
  output: |
    cd pipeline && node --test scripts/so-nhom.itest.mjs
    duration_ms 4518.014209

- eval: E3
  run_id: minted-so-nhom-mot-noi-E3-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.so_nhom
  verified_at: 2026-10-26T12:25:35Z
  output: |
    cd pipeline && node --test scripts/so-nhom.itest.mjs
    duration_ms 4518.014209

- eval: E4
  run_id: minted-so-nhom-mot-noi-E4-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.so_nhom
  verified_at: 2026-10-26T12:25:35Z
  output: |
    cd pipeline && node --test scripts/so-nhom.itest.mjs
    duration_ms 4518.014209

- eval: E5
  run_id: minted-so-nhom-mot-noi-E5-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.so_nhom
  verified_at: 2026-10-26T12:25:35Z
  output: |
    cd pipeline && node --test scripts/so-nhom.itest.mjs
    duration_ms 4518.014209

- eval: E6
  run_id: minted-so-nhom-mot-noi-E6-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.so_nhom
  verified_at: 2026-10-26T12:25:35Z
  output: |
    cd pipeline && node --test scripts/so-nhom.itest.mjs
    duration_ms 4518.014209

- eval: E7
  run_id: minted-so-nhom-mot-noi-E7-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.so_nhom
  verified_at: 2026-10-26T12:25:35Z
  output: |
    cd pipeline && node --test scripts/so-nhom.itest.mjs
    duration_ms 4518.014209

- eval: E8
  run_id: minted-so-nhom-mot-noi-E8-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.so_nhom
  verified_at: 2026-10-26T12:25:35Z
  output: |
    cd pipeline && node --test scripts/so-nhom.itest.mjs
    duration_ms 4518.014209

- eval: E9
  run_id: minted-so-nhom-mot-noi-E9-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.so_nhom_app
  verified_at: 2026-10-26T12:25:35Z
  output: |
    cd app && node --import tsx --test tests/so-nhom.test.tsx
    duration_ms 2646.059333

- eval: E10
  run_id: E10-20261026-1927
  exit_code: 0
  baseline: n-a
  verifier: scripts/ui-capture.sh
  verified_at: 2026-10-26T12:25:35Z
  screenshot: evidence/E10-step1.png
  observed: |
    Đã mở từng khung bằng Read. Bước 1 (sáng, 1280): khu «Sổ đơn vị thu · Market S02» 0 đơn vị, trạng thái trống «Chưa có đơn vị nào» kèm lệnh `node pipeline/sync-don-vi.mjs` và nút «Sao chép lệnh». Bước 2 (sáng): khu «Nhóm S03» 2/3 đơn vị đang thu, các cột Mã, Tên gốc, Thị trường, Khu đô thị, Trạng thái; ba dòng S03-N001..N003 đều có nhãn «theo cổng S03», dòng S05/S06 thì không có nhãn đó.
    Bước 3 (tối): cùng bố cục, huy hiệu xanh/vàng vẫn đọc được, không vỡ layout. Bước 4 (khổ hẹp 390): cột Mã và Tên gốc hiện, các cột sau cuộn ngang bên trong lưới, trang không cuộn ngang. Bước 5 và 5b: hộp thoại «Khai thị trường, khu đô thị» cho S03-N002 mở được, chọn thêm chip Thành phố Huế cạnh Thành phố Đà Nẵng. Bước 6: sau Lưu, dòng N002 hiện hai thị trường và có toast «Đã khai thị trường, khu đô thị». Khớp expected.
  network_observed: unscoped-partial

- eval: E11
  run_id: minted-so-nhom-mot-noi-E11-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.so_nhom_app
  verified_at: 2026-10-26T12:25:35Z
  output: |
    cd app && node --import tsx --test tests/so-nhom.test.tsx
    duration_ms 2646.059333

- eval: E12
  run_id: minted-so-nhom-mot-noi-E12-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.so_nhom
  verified_at: 2026-10-26T12:25:35Z
  output: |
    cd pipeline && node --test scripts/so-nhom.itest.mjs
    duration_ms 4518.014209

- eval: E13
  run_id: minted-so-nhom-mot-noi-E13-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.vong_doi_nguon
  verified_at: 2026-10-26T12:25:35Z
  output: |
    cd pipeline && node --test scripts/vong-doi.test.mjs scripts/vong-doi.itest.mjs
    duration_ms 845.336875

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-so-nhom-mot-noi-SUITE-npm_test__bb6271-r2
  exit_code: 0
  verified_at: 2026-10-26T12:25:35Z

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-so-nhom-mot-noi-SUITE-lint-r2
  exit_code: 0
  verified_at: 2026-10-26T12:25:35Z

- cmd: cd app && npm test
  run_id: minted-so-nhom-mot-noi-SUITE-npm_test__bd9a35-r2
  exit_code: 1
  verified_at: 2026-10-26T12:25:35Z
  note: 492 ca, 491 đạt, 1 thất bại. Ca thất bại là tests/deals-phi-ly.test.tsx, «DP-AC-5 bản cloud», dòng 97 của tệp test: câu ALTER ... DROP COLUMN trên quan hệ sale_offers bị Postgres từ chối (mã 42809, «This operation is not supported for views»). Lệnh này không gắn eval nào của hợp đồng.

- cmd: cd pipeline && npm test
  run_id: minted-so-nhom-mot-noi-SUITE-npm_test__13563d-r2
  exit_code: 0
  verified_at: 2026-10-26T12:25:35Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-so-nhom-mot-noi-SUITE-test_lint_rules-r2
  exit_code: 0
  verified_at: 2026-10-26T12:25:35Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-so-nhom-mot-noi-SUITE-node_scripts_check_portal_compliance_mjs-r2
  exit_code: 0
  verified_at: 2026-10-26T12:25:35Z

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
