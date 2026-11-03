---
schema_version: 2
feature_slug: can-gia-tot-biet-can
verdict: REJECT
failed_evals: ["E9"]
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 216ca26e365a12098bd4da64d4d1933b5257b8ce
human_signoff:
---

# Evidence Report: can-gia-tot-biet-can

Round 2. Nội dung thay trọn round cũ; lịch sử round nằm ở mục Iterations.

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | test | PASS |
| E2 | AC-2 | test | PASS |
| E3 | AC-3 | test | PASS |
| E11 | AC-3 | script | PASS |
| E4 | AC-4 | test | PASS |
| E5 | AC-5 | test | PASS |
| E6 | AC-6 | test | PASS |
| E12 | AC-6 | test | PASS |
| E7 | AC-7 | test | PASS |
| E8 | AC-8 | test | PASS |
| E9 | AC-9 | ui-check | FAIL |
| E10 | AC-10 | script | PASS |
| E13 | AC-11 | test | PASS |
| E14 | AC-12 | test | PASS |

Lệnh fail không gắn eval nào (ghi rõ, không tính vào bảng trên): `cd app && npm test` (xem khối suite), `cd pipeline && npm test` (xem khối suite). Lệnh `ui-check:E9` gắn với E9.

## Evidence

- eval: E1
  run_id: minted-can-gia-tot-biet-can-E1-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.can_gia_tot
  verified_at: 2026-11-03T12:01:51Z
  output: |
    cd app && node --import tsx --test tests/can-gia-tot-biet-can.test.tsx
    duration_ms 7361.452583

- eval: E2
  run_id: minted-can-gia-tot-biet-can-E2-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.can_gia_tot
  verified_at: 2026-11-03T12:01:51Z
  output: |
    cd app && node --import tsx --test tests/can-gia-tot-biet-can.test.tsx
    duration_ms 7361.452583

- eval: E3
  run_id: minted-can-gia-tot-biet-can-E3-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.can_gia_tot
  verified_at: 2026-11-03T12:01:51Z
  output: |
    cd app && node --import tsx --test tests/can-gia-tot-biet-can.test.tsx
    duration_ms 7361.452583

- eval: E11
  run_id: minted-can-gia-tot-biet-can-E11-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.can_gia_tot_quet_ma
  verified_at: 2026-11-03T12:01:51Z
  output: |
    deals-gate và test:lint-rules đạt
    duration_ms 264.3145

- eval: E4
  run_id: minted-can-gia-tot-biet-can-E4-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.can_gia_tot
  verified_at: 2026-11-03T12:01:51Z
  output: |
    cd app && node --import tsx --test tests/can-gia-tot-biet-can.test.tsx
    duration_ms 7361.452583

- eval: E5
  run_id: minted-can-gia-tot-biet-can-E5-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.can_gia_tot
  verified_at: 2026-11-03T12:01:51Z
  output: |
    cd app && node --import tsx --test tests/can-gia-tot-biet-can.test.tsx
    duration_ms 7361.452583

- eval: E6
  run_id: minted-can-gia-tot-biet-can-E6-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.can_gia_tot
  verified_at: 2026-11-03T12:01:51Z
  output: |
    cd app && node --import tsx --test tests/can-gia-tot-biet-can.test.tsx
    duration_ms 7361.452583

- eval: E12
  run_id: minted-can-gia-tot-biet-can-E12-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.deals_lien_he
  verified_at: 2026-11-03T12:01:51Z
  output: |
    cd app && node --import tsx --test tests/danh-ba-nguoi-deals-lien-he.test.tsx
    duration_ms 2587.728292

- eval: E7
  run_id: minted-can-gia-tot-biet-can-E7-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.can_gia_tot
  verified_at: 2026-11-03T12:01:51Z
  output: |
    cd app && node --import tsx --test tests/can-gia-tot-biet-can.test.tsx
    duration_ms 7361.452583

- eval: E8
  run_id: minted-can-gia-tot-biet-can-E8-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.can_gia_tot_doi_chieu
  verified_at: 2026-11-03T12:01:51Z
  output: |
    cd app && node --import tsx --test tests/can-gia-tot-doi-chieu.test.tsx
    duration_ms 415152.750792

- eval: E9
  run_id: E9-verify-ego-browser-20261103
  exit_code: 1
  baseline: n-a
  verifier: config:executors.ui-check.ego_browser
  verified_at: 2026-11-03T12:01:51Z
  screenshot: evidence/E9-step1.png
  observed: |
    step1: 1280 sáng, tab «Đủ để gọi 0» chọn, bảng rỗng «Tab này chưa có căn.», 4 tab đủ nhãn, sidebar đọc rõ.
    step2 đến step4c, step5 đến step9: chip phường, sheet 2/4, tab cùng tiêu chí rỗng có nút, lightbox 2/5, trang một căn, bản tối và bản 390 đều đọc rõ, ảnh và giá trị đã làm mờ.
    step4d: về bảng bằng nút Back, bảng 4 hàng, KHÔNG sheet, KHÔNG hàng nào có nền chọn, mâu thuẫn với Expected (ghi ở F1). step4e: tải ?can=, sau Esc hàng 4 có nền chọn nhạt.
  network_observed: n-a (driver)
  output: |
    Driver ego-browser, đăng nhập tài khoản thử vai Vận hành, server :3460 có sẵn, DB :5433 dữ liệu thật 4 căn.
    ASSERTION PASS: A1 đến A9 (tab, chip, J/K, tab cùng tiêu chí, lightbox, href tel, naturalWidth ảnh, sáng/tối, 390 không tràn document).
    A7 tỉ lệ ảnh hỏng: căn 1 không có dòng media; căn 2 hỏng 5/5 nhưng là căn chỉ còn link hết hạn theo E10 nên không tính lỗi; căn 3 hỏng 0/2; căn 4 hỏng 0/5.
    ASSERTION FAIL F1: «Quay về» bằng nút Back từ trang một căn ra /ops/deals?can=<id> nhưng sheet KHÔNG mở lại và KHÔNG hàng nào giữ data-state=selected (lặp 2 lần, chờ đến 5 giây). Tải thẳng ?can= thì đúng. Trang một căn chỉ có breadcrumb trỏ /ops/deals không kèm ?can.
    KHÔNG ĐO ĐƯỢC TRÊN DỮ LIỆU THẬT (E13, E14 chứng trên fixture): chuyển trang (chỉ 4 căn), tab «Đủ để gọi» có căn (0), tab cùng tiêu chí có căn (cả 4 căn đều 0).
    Mạng: driver không đọc được network; resource timing không có XHR lỗi, ảnh link hết hạn của căn 2 là tĩnh.

- eval: E10
  run_id: minted-can-gia-tot-biet-can-E10-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.can_gia_tot_ba_vai
  verified_at: 2026-11-03T12:01:51Z
  output: |
    CGT ba vai: ĐẠT

- eval: E13
  run_id: minted-can-gia-tot-biet-can-E13-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.can_gia_tot
  verified_at: 2026-11-03T12:01:51Z
  output: |
    cd app && node --import tsx --test tests/can-gia-tot-biet-can.test.tsx
    duration_ms 7361.452583

- eval: E14
  run_id: minted-can-gia-tot-biet-can-E14-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.can_gia_tot
  verified_at: 2026-11-03T12:01:51Z
  output: |
    cd app && node --import tsx --test tests/can-gia-tot-biet-can.test.tsx
    duration_ms 7361.452583

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-can-gia-tot-biet-can-SUITE-npm_test__bb6271-r2
  exit_code: 0
  verified_at: 2026-11-03T12:01:51Z

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-can-gia-tot-biet-can-SUITE-lint-r2
  exit_code: 0
  verified_at: 2026-11-03T12:01:51Z

- cmd: cd app && npm test
  run_id: minted-can-gia-tot-biet-can-SUITE-npm_test__bd9a35-r2
  exit_code: 1
  verified_at: 2026-11-03T12:01:51Z
  ghi chú: không gắn eval nào. Bài ON12-AC-2 (tests/ops-nhan-theo-context.test.tsx) đỏ vì còn chữ tiếng Anh trên cổng Ops: `src/components/ops/deal-body.tsx:124` «quận» trong «Quận» và `src/components/ops/deals-grid.tsx:233` «Tab» trong «Tab này chưa có căn.».

- cmd: cd pipeline && npm test
  run_id: minted-can-gia-tot-biet-can-SUITE-npm_test__13563d-r2
  exit_code: 1
  verified_at: 2026-11-03T12:01:51Z
  ghi chú: không gắn eval nào. 438 trên 439 bài đạt; bài GS-AC-2 trong scripts/gan-sdt-s06.test.mjs không lấy được khoá bảng public.field_assertions (tranh chấp khoá DB dùng chung), không liên quan mã của feature này.

- cmd: cd app && npm run test:lint-rules
  run_id: minted-can-gia-tot-biet-can-SUITE-test_lint_rules-r2
  exit_code: 0
  verified_at: 2026-11-03T12:01:51Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-can-gia-tot-biet-can-SUITE-node_scripts_check_portal_compliance_mjs-r2
  exit_code: 0
  verified_at: 2026-11-03T12:01:51Z

## Known limits

## Ngoài hợp đồng

## Analyst

carried tự round 1 — baseline không đo lại round này. Mọi eval ghi `baseline: n-a` vì round này không đo.

Eval không phân biệt (đạt trên cả code mới lẫn baseline, chứng minh harness hơn là feature):
- E12 (`cd app && node --import tsx --test tests/danh-ba-nguoi-deals-lien-he.test.tsx`): nên viết lại để assert hành vi mới, hoặc xác nhận đây là regression-guard có chủ ý.

## Variance

none — mọi eval chạy một lần, kết quả đồng nhất.

## Iterations

Round 1: S4 vòng 1 của CG1 trả về 17 lỗi, đã sửa trong commit 216ca26e. Returned to implementation.
Round 2: E9 failed — F1, nút Back của trình duyệt từ trang một căn về bảng không mở lại sheet và không giữ nền chọn của hàng vừa xem. Hai lệnh suite `cd app && npm test` (chữ tiếng Anh «Quận», «Tab» trên cổng Ops) và `cd pipeline && npm test` (tranh chấp khoá DB) cũng đỏ, không gắn eval. Returned to implementation.
