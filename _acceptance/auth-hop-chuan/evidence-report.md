---
schema_version: 2
feature_slug: auth-hop-chuan
verdict: REJECT
failed_evals: ["E1","E2","E3","E4","E5"]
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 7b471454c4c8b9b754e58ad3aa250997ba386859
human_signoff:
---

# Evidence Report: auth-hop-chuan

Round 1. Nội dung này thay trọn round cũ; lịch sử các round nằm ở mục Iterations.

Lệnh fail không gắn riêng eval nào: không có. Một lệnh fail gắn chung cho E1..E5 là `cd app && npm test` (một lệnh duy nhất phủ cả năm eval, nên cả năm bị tính chung kết quả của nó).

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | test | FAIL |
| E2 | AC-2 | test | FAIL |
| E3 | AC-3 | test | FAIL |
| E4 | AC-4 | test | FAIL |
| E5 | AC-5 | test | FAIL |
| E6 | AC-5 | script | PASS |
| E7 | AC-6 | test | PASS |
| E8 | AC-6 | test | PASS |
| E9 | AC-7 | ui-check | PASS |
| E10 | AC-5 | script | PASS |

## Evidence

Cả năm eval E1..E5 dùng chung lệnh `cd app && npm test` (verifier `config:executors.test.app_ui`). Lệnh này chạy 485 ca: 484 qua, 1 hỏng. Ca hỏng là CD-AC-7b trong `app/tests/che-do-thu.test.tsx` (tính năng «chế độ thu», không phải tệp `auth-hop-chuan.test.tsx`). Phần đuôi log máy trả về chỉ có các ca cuối và phần tóm tắt nên KHÔNG chứng minh được từng ca AH-AC-1..AH-AC-5 xanh hay đỏ; báo cáo không khẳng định điều đó. Theo luật cổng, lệnh thoát khác 0 thì mọi eval nó phủ đều tính hỏng ở round này.

- eval: E1
  run_id: minted-auth-hop-chuan-E1-r1
  exit_code: 1
  baseline: n-a
  verifier: config:executors.test.app_ui
  verified_at: 2026-10-26T10:00:31Z
  output: |
    ℹ tests 485
    ℹ pass 484
    ℹ fail 1
    ✖ CD-AC-7b hộp thoại → datCheDo thật: thân request, params, Badge (cross-layer)
      assert.ok(u.row(9)?.textContent?.includes("Duy trì")) — tests/che-do-thu.test.tsx:392

- eval: E2
  run_id: minted-auth-hop-chuan-E2-r1
  exit_code: 1
  baseline: n-a
  verifier: config:executors.test.app_ui
  verified_at: 2026-10-26T10:00:31Z
  output: |
    ℹ tests 485
    ℹ pass 484
    ℹ fail 1
    ✖ CD-AC-7b hộp thoại → datCheDo thật: thân request, params, Badge (cross-layer)
      assert.ok(u.row(9)?.textContent?.includes("Duy trì")) — tests/che-do-thu.test.tsx:392

- eval: E3
  run_id: minted-auth-hop-chuan-E3-r1
  exit_code: 1
  baseline: n-a
  verifier: config:executors.test.app_ui
  verified_at: 2026-10-26T10:00:31Z
  output: |
    ℹ tests 485
    ℹ pass 484
    ℹ fail 1
    ✖ CD-AC-7b hộp thoại → datCheDo thật: thân request, params, Badge (cross-layer)
      assert.ok(u.row(9)?.textContent?.includes("Duy trì")) — tests/che-do-thu.test.tsx:392

- eval: E4
  run_id: minted-auth-hop-chuan-E4-r1
  exit_code: 1
  baseline: n-a
  verifier: config:executors.test.app_ui
  verified_at: 2026-10-26T10:00:31Z
  output: |
    ℹ tests 485
    ℹ pass 484
    ℹ fail 1
    ✖ CD-AC-7b hộp thoại → datCheDo thật: thân request, params, Badge (cross-layer)
      assert.ok(u.row(9)?.textContent?.includes("Duy trì")) — tests/che-do-thu.test.tsx:392

- eval: E5
  run_id: minted-auth-hop-chuan-E5-r1
  exit_code: 1
  baseline: n-a
  verifier: config:executors.test.app_ui
  verified_at: 2026-10-26T10:00:31Z
  output: |
    ℹ tests 485
    ℹ pass 484
    ℹ fail 1
    ✖ CD-AC-7b hộp thoại → datCheDo thật: thân request, params, Badge (cross-layer)
      assert.ok(u.row(9)?.textContent?.includes("Duy trì")) — tests/che-do-thu.test.tsx:392

- eval: E6
  run_id: minted-auth-hop-chuan-E6-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.auth_login_smoke
  verified_at: 2026-10-26T10:00:31Z
  output: |
    OK: tài khoản ops thử đăng nhập được http://ui1.localhost:3460

- eval: E7
  run_id: minted-auth-hop-chuan-E7-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.app
  verified_at: 2026-10-26T10:00:31Z
  output: |
    (tsc --noEmit và npm run lint không in gì: sạch)

- eval: E8
  run_id: minted-auth-hop-chuan-E8-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.ui_routes_map
  verified_at: 2026-10-26T10:00:31Z
  output: |
    ℹ duration_ms 70.527709

- eval: E9
  run_id: minted-auth-hop-chuan-E9-r1
  exit_code: 0
  baseline: n-a
  verifier: ui-check:E9
  verified_at: 2026-10-26T10:00:31Z
  screenshot: evidence/E9-step1.png
  observed: |
    Da mo tung frame bang Read. step1 (login 1280 sang): the trang tren nen xam nhat co van nhe, logo One Invest, tieu de Dang nhap, mo ta, o Email va Mat khau, nut den "Dang nhap" ro, link "Chua co tai khoan? Dang ky" va footer; doc ro, khong mang mau troi hay chu gradient (chi la van noi nhe). step2 (register 1280 sang): bo cuc hai cot; trai la huy hieu "2 thi truong Viet Nam · 572 listing tu thu", H1 3 dong dam "Dau tu cho thue ngan han bang so lieu, khong bang cam tinh." mau den thuong, doan mo ta xam; phai la the "Tao tai khoan mien phi" voi Email, Mat khau, nut den "Tao tai khoan ->"; khong tran dong.
    step3 (login 1280 toi): nen gan den, the xam dam, chu trang, nut sang "Dang nhap" tuong phan tot, o nhap co vien; doc ro. step4 (register 1280 toi): nen den, H1 trang, mo ta xam sang, the toi, nut sang "Tao tai khoan"; doc ro, khong gradient. step5 (login 390 sang): the vua man hinh, mo ta xuong 2 dong, nut day du chieu rong, khong cat ngang; chi co huy hieu N cua Next dev o goc duoi trai (cong cu dev, khong thuoc app). step6 (register 390 sang): H1 36px ngat 4 dong gon, mo ta, the form day du, nut "Tao tai khoan" ro, khong tran ngang.
    step7 (login loi 1280 sang): khoi canh bao vien do hong nhat "Sai mat khau" co icon (!) nam trong form tren Email, doc ro. step8 (login loi 1280 toi): canh bao nen do ham, vien do, chu "Sai mat khau" va icon doc ro tren nen toi. Doi chieu Expected: khop ca sang/toi, khong mang mau troi/gradient, tieu de dang ky co chu thuong cua kho, form va nut chinh ro, scrollWidth=clientWidth=390 ca hai trang.
  network_observed: no-app-traffic   # trang SSR không gọi XHR; số liệu thô ở evidence/E9-network.txt
  output: |
    A7 PASS form va nut chinh: button[type=submit] ton tai tren ca hai trang; nut Dang nhap / Tao tai khoan tuong phan cao ca sang lan toi.
    Console: 0 error; 1 warning link-preload font Google khong dung (static asset, chi note).
    Evidence luu: E9-step1.png .. E9-step8.png (login/register 1280 sang/toi, 390 sang, login co loi sang/toi) va E9-network.txt trong _acceptance/auth-hop-chuan/evidence/.
    Luu y: ui-capture in "be rong: khong do duoc" nen scrollWidth/clientWidth do rieng bang playwright-cli.

- eval: E10
  run_id: minted-auth-hop-chuan-E10-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.auth_register_smoke
  verified_at: 2026-10-26T10:00:31Z
  output: |
    dọn: đã xoá tài khoản thử

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-auth-hop-chuan-SUITE-npm_test__bb6271-r1
  exit_code: 0
  verified_at: 2026-10-26T10:00:31Z

- cmd: cd pipeline && npm test
  run_id: minted-auth-hop-chuan-SUITE-npm_test__13563d-r1
  exit_code: 0
  verified_at: 2026-10-26T10:00:31Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-auth-hop-chuan-SUITE-test_lint_rules-r1
  exit_code: 0
  verified_at: 2026-10-26T10:00:31Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-auth-hop-chuan-SUITE-node_scripts_check_portal_compliance_mjs-r1
  exit_code: 0
  verified_at: 2026-10-26T10:00:31Z

## Known limits

## Ngoài hợp đồng

## Analyst

baseline: BLOCKED ha tang — lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «<\tool_use_error>Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.<\/tool_use_error>»

Danh sách eval không-phân-biệt (xanh cả HEAD lẫn baseline): không đo được ở round này vì baseline bị chặn hạ tầng; mọi trường baseline ghi n-a.

Baseline khong do:
- cd app && npm test: BLOCKED ha tang baseline: lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «<\tool_use_error>Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.<\/tool_use_error>»
- bash scripts/dev-ops-login-check.sh ${BASE_URL:-http://ui1.localhost:3460}: BLOCKED ha tang baseline: lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «<\tool_use_error>Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.<\/tool_use_error>»
- cd app && npx tsc --noEmit && npm run lint: BLOCKED ha tang baseline: lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «<\tool_use_error>Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.<\/tool_use_error>»
- cd app && node --test eslint-plugin-onehub-ui/tests/routes-map.test.mjs: BLOCKED ha tang baseline: lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «<\tool_use_error>Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.<\/tool_use_error>»
- node scripts/dev-register-check.mjs ${BASE_URL:-http://ui1.localhost:3460}: BLOCKED ha tang baseline: lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «<\tool_use_error>Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.<\/tool_use_error>»

## Variance

none — không eval nào chạy nhiều lần (mọi eval runs 1), không có pass_rate lẫn lộn.

## Iterations

Round 1: E1, E2, E3, E4, E5 failed — lệnh chung `cd app && npm test` hỏng 1 trong 485 ca: CD-AC-7b ở `app/tests/che-do-thu.test.tsx` dòng 392 (assert hàng 9 chứa «Duy trì»), nằm ngoài tệp kiểm của tính năng này; log đuôi không cho thấy riêng ca AH-AC-1..AH-AC-5. E6, E7, E8, E9, E10 đạt; bốn lệnh suite hồi quy đạt. Returned to implementation.
