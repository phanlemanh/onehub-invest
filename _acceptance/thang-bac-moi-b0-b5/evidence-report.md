---
schema_version: 2
feature_slug: thang-bac-moi-b0-b5
verdict: REJECT
failed_evals: [E10]
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 322029304d7db08fe8e26bbd8d7b80df58ce1a78
human_signoff:
---

# Evidence Report: thang-bac-moi-b0-b5

Vòng 1. Một eval giao diện (E10) hỏng; mười bốn eval còn lại qua. Hai lệnh suite không gắn eval (`cd app && npm test`, `cd pipeline && npm test`) cũng đỏ, xem mục Analyst.

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | test | PASS |
| E1b | AC-1 | test | PASS |
| E2 | AC-2 | test | PASS |
| E3 | AC-3 | test | PASS |
| E4 | AC-4 | test | PASS |
| E5 | AC-5 | test | PASS |
| E6 | AC-6 | test | PASS |
| E7 | AC-7 | test | PASS |
| E7b | AC-7 | test | PASS |
| E8 | AC-8 | test | PASS |
| E8b | AC-8 | test | PASS |
| E9 | AC-9 | test | PASS |
| E12 | AC-11 | test | PASS |
| E10 | AC-10 | ui-check | FAIL |
| E11 | AC-10 | script | PASS |

## Evidence

- eval: E1
  run_id: minted-thang-bac-moi-b0-b5-E1-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.tb_app
  verified_at: 2026-11-09T11:38:57Z
  output: |
    cd app && node --import tsx --test tests/thang-bac.test.tsx tests/data-level.test.tsx tests/do-hang-ngay-quality.test.tsx tests/ops-dong-chay.test.tsx
    ℹ duration_ms 49123.972416

- eval: E7
  run_id: minted-thang-bac-moi-b0-b5-E7-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.tb_app
  verified_at: 2026-11-09T11:38:57Z
  output: |
    cùng lệnh với E1 (một lần chạy phủ E1, E7, E8)
    ℹ duration_ms 49123.972416

- eval: E8
  run_id: minted-thang-bac-moi-b0-b5-E8-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.tb_app
  verified_at: 2026-11-09T11:38:57Z
  output: |
    cùng lệnh với E1 (một lần chạy phủ E1, E7, E8)
    ℹ duration_ms 49123.972416

- eval: E1b
  run_id: minted-thang-bac-moi-b0-b5-E1b-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.tb_db
  verified_at: 2026-11-09T11:38:57Z
  output: |
    cd pipeline && bash ../db/db-thu.sh oneinvest_suite_tb --chay node --test --test-concurrency=1 scripts/thang-bac.itest.mjs scripts/bac-du-lieu.itest.mjs
    ℹ duration_ms 928052.15625

- eval: E3
  run_id: minted-thang-bac-moi-b0-b5-E3-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.tb_db
  verified_at: 2026-11-09T11:38:57Z
  output: |
    cùng lệnh với E1b (một lần chạy phủ E1b, E3, E4, E5, E9)
    ℹ duration_ms 928052.15625

- eval: E4
  run_id: minted-thang-bac-moi-b0-b5-E4-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.tb_db
  verified_at: 2026-11-09T11:38:57Z
  output: |
    cùng lệnh với E1b (một lần chạy phủ E1b, E3, E4, E5, E9)
    ℹ duration_ms 928052.15625

- eval: E5
  run_id: minted-thang-bac-moi-b0-b5-E5-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.tb_db
  verified_at: 2026-11-09T11:38:57Z
  output: |
    cùng lệnh với E1b (một lần chạy phủ E1b, E3, E4, E5, E9)
    ℹ duration_ms 928052.15625

- eval: E9
  run_id: minted-thang-bac-moi-b0-b5-E9-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.tb_db
  verified_at: 2026-11-09T11:38:57Z
  output: |
    cùng lệnh với E1b (một lần chạy phủ E1b, E3, E4, E5, E9)
    ℹ duration_ms 928052.15625

- eval: E2
  run_id: minted-thang-bac-moi-b0-b5-E2-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.tb_app_db
  verified_at: 2026-11-09T11:38:57Z
  output: |
    cd app && bash ../db/db-thu.sh oneinvest_suite_tba --chay node --import tsx --test --test-concurrency=1 tests/thang-bac-db.itest.tsx tests/data-level-sql.itest.tsx
    ℹ duration_ms 6613.128833

- eval: E7b
  run_id: minted-thang-bac-moi-b0-b5-E7b-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.tb_app_db
  verified_at: 2026-11-09T11:38:57Z
  output: |
    cùng lệnh với E2 (một lần chạy phủ E2, E7b, E8b, E12)
    ℹ duration_ms 6613.128833

- eval: E8b
  run_id: minted-thang-bac-moi-b0-b5-E8b-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.tb_app_db
  verified_at: 2026-11-09T11:38:57Z
  output: |
    cùng lệnh với E2 (một lần chạy phủ E2, E7b, E8b, E12)
    ℹ duration_ms 6613.128833

- eval: E12
  run_id: minted-thang-bac-moi-b0-b5-E12-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.tb_app_db
  verified_at: 2026-11-09T11:38:57Z
  output: |
    cùng lệnh với E2 (một lần chạy phủ E2, E7b, E8b, E12)
    ℹ duration_ms 6613.128833

- eval: E6
  run_id: minted-thang-bac-moi-b0-b5-E6-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.test.tb_bao_cao
  verified_at: 2026-11-09T11:38:57Z
  output: |
    node --test scripts/bao-cao-ngay.test.mjs
    ℹ duration_ms 507.897917

- eval: E11
  run_id: minted-thang-bac-moi-b0-b5-E11-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.design.tb_gate
  verified_at: 2026-11-09T11:38:57Z
  output: |
    design-gate --jsdom app trên do-hang-ngay.tsx, record-sheet.tsx, records-filter.tsx
    không có lỗi P0

- eval: E10
  run_id: minted-thang-bac-moi-b0-b5-E10-r1
  exit_code: 1
  baseline: n-a
  verifier: config:executors.design.ui_check
  verified_at: 2026-11-09T11:38:57Z
  screenshot: evidence/E10-step3-1280-light.png
  observed: |
    E10-step3-1280-light.png: ngan chi tiet ben phai tren nen mo; tieu de 'Cho thue · 3,6 tr d · 25 m²'; badge tim 'B1 · Tin'; 'Truong loi 5/5' voi 5 badge xanh (Loai tin, Loai hinh, Gia, Dien tich, Phuong); cau 'Len B2 can dinh vi tin vao du an, toa hoac truc cua danh ba.' — dung expected, chu ro, khong de chu. E10-step3-1280-dark.png: cung bo cuc nen den, chu sang ro, badge B1 tim va badge xanh doc duoc. E10-step3-390-light.png: sheet full rong 390, cac badge xuong dong, cau 'Len B2...' xuong 2 dong, khong tran, khong cuon ngang; nut N cua devtools che mot dong cuoi (khong thuoc app). /ops/quality (xem tam, khong luu evidence): khoi 'Do hang ngay' 1280 toi cho thay hai dong: 'Thang bac 08/11 (B2 Dinh vi, B3 Gan can) ap tu — — dong chuyen bac tinh tu ngay nay. Ngay doi thang la lan ha mot lan, khong phai tut bac.' va 'Dong chuyen bac: ngay doi thang — da lap moc 81.922 don vi...'; ngay ap la '—' (thieu) => mau thuan expected 'nêu ngay ap'. 390 sang: cung dong 'ap tu — —', bang tab Tin hieu/Lam giau bi cat o mep phai (scrollWidth 429 > 390).
  network_observed: n-a (driver)
  output: |
    Server :3464 co san (next dev cua worktree, DATABASE_URL=oneinvest_tb087). Dang nhap tai khoan ops thu (admin) OK.
    Frame luu: E10-step3-1280-light.png, E10-step3-1280-dark.png, E10-step3-390-light.png. Frame /ops/quality (step 1, 2) KHONG luu duoc: capture.ui thoat voi ma 5 'tang A con lo sau khi che (9 ten)' — chu ten thi truong tren /ops/quality trung danh sach ten tang A.
    1. /ops/quality HTTP 200 sau dang nhap: PASS.
    2. Khoi «Do hang ngay» co dong thang 08/11 + 'Ngay doi thang la lan ha mot lan, khong phai tut bac': PASS phan chu.
    3. Dong neu NGAY AP: FAIL. Hien 'ap tu — —'. Nguyen nhan: dq_check_results do1-chuyen-bac co thang.tu_ngay '2026-11-09' (chuoi chi-ngay) nhung fmtVnDate -> toInstant (app/src/lib/format.ts) doi gio+mui gio nen tra null -> '—' (do-hang-ngay.tsx:110).
    4. Dong 'Dong chuyen bac: ngay doi thang — da lap moc 81.922 don vi': PASS.
    5. 390px khong cuon ngang toan trang: FAIL. clientWidth 390, scrollWidth 429; nguon DIV.group/tabs (tab 'Tong/Thi truong/Phuong-xa/Khu do thi') right=429.
    6. Nen toi chu ro: PASS.
    7. /ops/data-flow ngan chi tiet tin S06 B1 5/5 truong loi, co badge 'B1 · Tin' va cau 'Len B2 can dinh vi tin vao du an, toa hoac truc cua danh ba.': PASS (1280 sang, toi, 390), khong cuon ngang o 390, 0 ro ri ten tang A.
    Luu y: anh sheet co thumbnail anh tin (co dau chu tren anh) — xem lai truoc khi day len kho cong khai.

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-thang-bac-moi-b0-b5-SUITE-npm_test__bb6271-r1
  exit_code: 0
  verified_at: 2026-11-09T11:38:57Z

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-thang-bac-moi-b0-b5-SUITE-lint-r1
  exit_code: 0
  verified_at: 2026-11-09T11:38:57Z

- cmd: cd app && npm test
  run_id: bwgvv8oot
  exit_code: 1
  verified_at: 2026-11-09T11:38:57Z

- cmd: cd pipeline && npm test
  run_id: minted-thang-bac-moi-b0-b5-SUITE-npm_test__13563d-r1
  exit_code: 1
  verified_at: 2026-11-09T11:38:57Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-thang-bac-moi-b0-b5-SUITE-test_lint_rules-r1
  exit_code: 0
  verified_at: 2026-11-09T11:38:57Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-thang-bac-moi-b0-b5-SUITE-node_scripts_check_portal_compliance_mjs-r1
  exit_code: 0
  verified_at: 2026-11-09T11:38:57Z

## Known limits

## Ngoài hợp đồng

## Analyst

Eval không phân biệt (xanh cả trên HEAD lẫn baseline):
- E6: node --test scripts/bao-cao-ngay.test.mjs — baseline green, nên chạy trên code cũ cũng qua; cần viết lại để assert hành vi mới hoặc xác nhận là regression-guard có chủ ý.
- E11: cổng design-gate --jsdom trên ba tệp giao diện — baseline green, cùng ý như trên.

Lệnh suite đỏ không gắn eval nào (không tính vào failed_evals, ghi để người quyết):
- cd app && npm test: 1090 qua, 1 hỏng, ca `ON12-AC-5 bảng kiểm chất lượng trên DB local diễn giải đủ` (tests/ops-nhan-theo-context.test.tsx) báo các dòng `do3-thay-doi` và `do3-kiem-nguoc` chưa diễn giải trên DB local dùng chung.
- cd pipeline && npm test: ca `PX1-AC-10` (scripts/nap-dvhc-cu.test.mjs) lỗi khoá ngoại sale_offers_area_id_fkey khi xoá areas `vn-da-nang-hoang-sa` còn được sale_offer_records tham chiếu.
- cd app && npx tsc --noEmit && npm run lint, cd agent && npm test, test:lint-rules, check-portal-compliance: đều xanh.

Baseline không đo:
- cd app && node --import tsx --test tests/thang-bac.test.tsx tests/data-level.test.tsx tests/do-hang-ngay-quality.test.tsx tests/ops-dong-chay.test.tsx: bo qua baseline: tep app/tests/thang-bac.test.tsx co o cay dang kiem nhung chua co o merge-base 3bc0f0c0db2896e9dcacb876f5d35372b60e21a6 — eval moi, chay tren code cu khong phan biet gi
- cd pipeline && bash ../db/db-thu.sh oneinvest_suite_tb --chay node --test --test-concurrency=1 scripts/thang-bac.itest.mjs scripts/bac-du-lieu.itest.mjs: bo qua baseline: tep pipeline/scripts/thang-bac.itest.mjs co o cay dang kiem nhung chua co o merge-base 3bc0f0c0db2896e9dcacb876f5d35372b60e21a6 — eval moi, chay tren code cu khong phan biet gi
- cd app && bash ../db/db-thu.sh oneinvest_suite_tba --chay node --import tsx --test --test-concurrency=1 tests/thang-bac-db.itest.tsx tests/data-level-sql.itest.tsx: bo qua baseline: tep app/tests/thang-bac-db.itest.tsx co o cay dang kiem nhung chua co o merge-base 3bc0f0c0db2896e9dcacb876f5d35372b60e21a6 — eval moi, chay tren code cu khong phan biet gi

## Variance

none — mọi eval chạy một lần, xác định, không có phương sai.

## Iterations

Round 1: E10 hỏng — dòng thang bậc ở «Đo hằng ngày» hiện «áp từ — —» vì ngày áp là chuỗi chỉ-ngày mà fmtVnDate đòi giờ + múi giờ; ở 390 px vùng cuộn thân trang rộng 429 do hàng tab «Tổng/Thị trường/Phường-xã/Khu đô thị». Trả về thi công.
