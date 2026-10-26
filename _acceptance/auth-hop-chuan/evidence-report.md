---
schema_version: 2
feature_slug: auth-hop-chuan
verdict: PASS
failed_evals: []
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 649a6d119bbdf9acc4667949541e49b041adcbda
human_signoff: Mạnh 2026-10-26
---

# Evidence Report: auth-hop-chuan

Round 2. Nội dung này thay trọn round cũ; lịch sử các round nằm ở mục Iterations.

Lệnh fail không gắn riêng eval nào: không có.

Round này chạy lại E1..E6 và E10 trên cây 3e1b4649; E7, E8, E9 mang sang từ round 1 vì delta không chạm paths của các eval này. Không có eval judgment nên không có hội đồng chấm.

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | test | PASS |
| E2 | AC-2 | test | PASS |
| E3 | AC-3 | test | PASS |
| E4 | AC-4 | test | PASS |
| E5 | AC-5 | test | PASS |
| E6 | AC-5 | script | PASS |
| E7 | AC-6 | test | PASS |
| E8 | AC-6 | test | PASS |
| E9 | AC-7 | ui-check | PASS |
| E10 | AC-5 | script | PASS |

## Evidence

Năm eval E1..E5 dùng chung lệnh `cd app && npm test` (verifier `config:executors.test.app_ui`), chạy một lần, toàn bộ bộ test của app đạt.

- eval: E1
  run_id: minted-auth-hop-chuan-E1-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.app_ui
  verified_at: 2026-10-26T10:10:18Z
  output: |
    ℹ duration_ms 23183.307792

- eval: E2
  run_id: minted-auth-hop-chuan-E2-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.app_ui
  verified_at: 2026-10-26T10:10:18Z
  output: |
    ℹ duration_ms 23183.307792

- eval: E3
  run_id: minted-auth-hop-chuan-E3-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.app_ui
  verified_at: 2026-10-26T10:10:18Z
  output: |
    ℹ duration_ms 23183.307792

- eval: E4
  run_id: minted-auth-hop-chuan-E4-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.app_ui
  verified_at: 2026-10-26T10:10:18Z
  output: |
    ℹ duration_ms 23183.307792

- eval: E5
  run_id: minted-auth-hop-chuan-E5-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.app_ui
  verified_at: 2026-10-26T10:10:18Z
  output: |
    ℹ duration_ms 23183.307792

- eval: E6
  run_id: minted-auth-hop-chuan-E6-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.auth_login_smoke
  verified_at: 2026-10-26T10:10:18Z
  output: |
    OK: tài khoản ops thử đăng nhập được http://ui1.localhost:3460

- eval: E7
  run_id: minted-auth-hop-chuan-E7-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.app
  verified_at: 2026-10-26T10:00:31Z
  carried_from_round: 1
  output: |
    carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E8
  run_id: minted-auth-hop-chuan-E8-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.ui_routes_map
  verified_at: 2026-10-26T10:00:31Z
  carried_from_round: 1
  output: |
    carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E9
  run_id: minted-auth-hop-chuan-E9-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.design.ui_check
  verified_at: 2026-10-26T10:00:31Z
  carried_from_round: 1
  screenshot: evidence/E9-step1.png
  observed: |
    Da mo tung frame bang Read. step1 (login 1280 sang): the trang tren nen xam nhat co van nhe, logo One Invest, tieu de Dang nhap, mo ta, o Email va Mat khau, nut den "Dang nhap" ro, link "Chua co tai khoan? Dang ky" va footer; doc ro, khong mang mau troi hay chu gradient (chi la van noi nhe). step2 (register 1280 sang): bo cuc hai cot; trai la huy hieu "2 thi truong Viet Nam · 572 listing tu thu", H1 3 dong dam "Dau tu cho thue ngan han bang so lieu, khong bang cam tinh." mau den thuong, doan mo ta xam; phai la the "Tao tai khoan mien phi" voi Email, Mat khau, nut den "Tao tai khoan ->"; khong tran dong.
    step3 (login 1280 toi): nen gan den, the xam dam, chu trang, nut sang "Dang nhap" tuong phan tot, o nhap co vien; doc ro. step4 (register 1280 toi): nen den, H1 trang, mo ta xam sang, the toi, nut sang "Tao tai khoan"; doc ro, khong gradient. step5 (login 390 sang): the vua man hinh, mo ta xuong 2 dong, nut day du chieu rong, khong cat ngang; chi co huy hieu N cua Next dev o goc duoi trai (cong cu dev, khong thuoc app). step6 (register 390 sang): H1 36px ngat 4 dong gon, mo ta, the form day du, nut "Tao tai khoan" ro, khong tran ngang.
    step7 (login loi 1280 sang): khoi canh bao vien do hong nhat "Sai mat khau" co icon (!) nam trong form tren Email, doc ro. step8 (login loi 1280 toi): canh bao nen do ham, vien do, chu "Sai mat khau" va icon doc ro tren nen toi. Doi chieu Expected: khop ca sang/toi, khong mang mau troi/gradient, tieu de dang ky co chu thuong cua kho, form va nut chinh ro, scrollWidth=clientWidth=390 ca hai trang.
  network_observed: no-app-traffic   # trang SSR không gọi XHR; số liệu thô ở evidence/E9-network.txt
  output: |
    carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E10
  run_id: minted-auth-hop-chuan-E10-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.auth_register_smoke
  verified_at: 2026-10-26T10:10:18Z
  output: |
    dọn: đã xoá tài khoản thử

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-auth-hop-chuan-SUITE-npm_test__bb6271-r2
  exit_code: 0
  verified_at: 2026-10-26T10:10:18Z

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-auth-hop-chuan-SUITE-lint-r2
  exit_code: 0
  verified_at: 2026-10-26T10:10:18Z

- cmd: cd pipeline && npm test
  run_id: minted-auth-hop-chuan-SUITE-npm_test__13563d-r2
  exit_code: 0
  verified_at: 2026-10-26T10:10:18Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-auth-hop-chuan-SUITE-test_lint_rules-r2
  exit_code: 0
  verified_at: 2026-10-26T10:10:18Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-auth-hop-chuan-SUITE-node_scripts_check_portal_compliance_mjs-r2
  exit_code: 0
  verified_at: 2026-10-26T10:10:18Z

## Known limits

## Ngoài hợp đồng

## Analyst

baseline: BLOCKED ha tang — lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «<\tool_use_error>Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.<\/tool_use_error>»

Danh sách eval không-phân-biệt (xanh cả HEAD lẫn baseline): không đo được ở round này vì baseline bị chặn hạ tầng; mọi trường baseline ghi n-a.

Baseline khong do:
- cd app && npm test: BLOCKED ha tang baseline: lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «<\tool_use_error>Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.<\/tool_use_error>»
- bash scripts/dev-ops-login-check.sh ${BASE_URL:-http://ui1.localhost:3460}: BLOCKED ha tang baseline: lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «<\tool_use_error>Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.<\/tool_use_error>»
- node scripts/dev-register-check.mjs ${BASE_URL:-http://ui1.localhost:3460}: BLOCKED ha tang baseline: lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «<\tool_use_error>Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.<\/tool_use_error>»

## Variance

none — không eval nào chạy nhiều lần (mọi eval runs 1), không có pass_rate lẫn lộn.

## Iterations

Round 1: E1, E2, E3, E4, E5 failed — lệnh chung `cd app && npm test` hỏng 1 trong 485 ca: CD-AC-7b ở `app/tests/che-do-thu.test.tsx` dòng 392 (assert hàng 9 chứa «Duy trì»), nằm ngoài tệp kiểm của tính năng này; log đuôi không cho thấy riêng ca AH-AC-1..AH-AC-5. E6, E7, E8, E9, E10 đạt; bốn lệnh suite hồi quy đạt. Returned to implementation.
Round 2: E1..E6 và E10 chạy lại trên cây 3e1b4649 sau bản sửa S4-r1 (so action với đúng hàm, quét <style> cả document có đối chứng dương, đo safeNext trên trang thật) — tất cả đạt; năm lệnh suite hồi quy đạt. E7, E8, E9 mang sang từ round 1 (delta không chạm paths của chúng).

### Re-pin lần 1 — 2026-10-26, do ô E4 thay bởi auth-error-thu-lai-retry#AC-1 (superseded_by)
run_id: repin-20261026T132451Z-32748
sha: 11d47d6f44dc8b4a3168bb3b717d92c5b38dffcf · suites: 6 lệnh exit 0 · evals: 8/8 eval máy đạt kỳ vọng · không chạy theo hồ sơ: E4 · thay bởi hồ sơ đã ký: E4→auth-error-thu-lai-retry#AC-1 · ngoài làn máy: E9 · diff chạm vật đo ngoài làn máy: E9 — chưa chứng lại, đi vòng S4 delta · AC không có chốt máy: AC-4, AC-7

### Re-pin lần 2 — 2026-10-26, do gộp main + sửa AER-AC-2 so cặp commit cố định (aer-ac2-so-cap-co-dinh)
run_id: repin-20261026T143917Z-34922
sha: 649a6d119bbdf9acc4667949541e49b041adcbda · suites: 6 lệnh exit 0 · evals: 8/8 eval máy đạt kỳ vọng · không chạy theo hồ sơ: E4 · thay bởi hồ sơ đã ký: E4→auth-error-thu-lai-retry#AC-1 · ngoài làn máy: E9 · AC không có chốt máy: AC-4, AC-7
