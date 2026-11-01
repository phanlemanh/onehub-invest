---
schema_version: 2
feature_slug: chuyen-huong-ma-thi-truong
verdict: REJECT
failed_evals: [E2, E3, E4, E5, E6, E7, E8]
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: f2feebabab8a43f3c7ddb57a1ec23549c1676a89
human_signoff:
---

# Evidence Report: chuyen-huong-ma-thi-truong

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | script | PASS |
| E2 | AC-2 | script | FAIL |
| E3 | AC-3 | script | FAIL |
| E4 | AC-4 | script | FAIL |
| E5 | AC-5 | script | FAIL |
| E6 | AC-6 | script | FAIL |
| E7 | AC-7 | script | FAIL |
| E8 | AC-8 | script | FAIL |
| E9 | AC-9 | script | PASS |
| E10 | AC-9 | test | PASS |
| E11 | AC-9 | test | PASS |
| E12 | AC-9 | script | PASS |

Ghi chú nguyên nhân thất bại:
- E2 đến E6 chạy chung một lệnh `acceptance.mjs app`. Trên DB «sau» cả 6 ca xanh (ca của E2, E4, E5, E6 và AC-8 phần app đều qua). Lệnh thoát 1 vì 5 ca trên DB «trước» đỏ (CHM-AC-3, CHM-AC-4, CHM-AC-5 và hai ca CHM-AC-8 phần app), nên cả năm eval gắn lệnh này bị tính hỏng. Máy không tách được eval nào đỏ do lỗi tính năng, eval nào đỏ do DB «trước».
- E7, E8 chạy chung lệnh `acceptance.mjs api`. Trên DB «trước» 2 ca xanh (9/9 ô, mã không đích). Lệnh dừng ở bước dựng DB «sau»: `createdb` báo trùng khoá, DB `oneinvest_n1_chm_sau` đã tồn tại. Đây là va chạm hạ tầng chạy song song, không phải kết quả của route; ca «sau» của data-api chưa chạy.
- Lệnh `cd app && npm test` (không gắn eval) thoát 1: 772/774 xanh, ca đỏ duy nhất là ON12-AC-5 (`freshness · S04/danang`, `freshness · S04/haiphong` chưa diễn giải). E12 so với gốc và vẫn cho APP TEST PASS, tức ca này đỏ sẵn ở gốc.

## Evidence

- eval: E1
  run_id: minted-chuyen-huong-ma-thi-truong-E1-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.chm_ma
  verified_at: 2026-11-01T13:51:43Z
  output: |
    MA PASS

- eval: E2
  run_id: minted-chuyen-huong-ma-thi-truong-E2-r1
  exit_code: 1
  baseline: n-a
  verifier: config:executors.script.chm_app
  verified_at: 2026-11-01T13:51:43Z
  output: |
    [sau] ok sau: 32 mã × 2 trang chuyển 308 đúng đích
    [sau] ok sau: phường dong-da và ?tab=x đi theo đích; chiều đỏ ghim 'không chuyển hướng: /vn/thanh-pho-da-nang'
    [truoc] 5 ca đỏ (CHM-AC-3, CHM-AC-4, CHM-AC-5, 2 ca CHM-AC-8)
    FAIL app trên DB truoc
    APP FAIL (1 mục)

- eval: E3
  run_id: minted-chuyen-huong-ma-thi-truong-E3-r1
  exit_code: 1
  baseline: n-a
  verifier: config:executors.script.chm_app
  verified_at: 2026-11-01T13:51:43Z
  output: |
    [truoc] CHM-AC-3 trang thị trường + listing với 32 mã dài (truoc) đỏ
    FAIL app trên DB truoc

- eval: E4
  run_id: minted-chuyen-huong-ma-thi-truong-E4-r1
  exit_code: 1
  baseline: n-a
  verifier: config:executors.script.chm_app
  verified_at: 2026-11-01T13:51:43Z
  output: |
    [truoc] CHM-AC-4 mã dài không đích 404, mã thường không chuyển, không tra thêm (truoc) đỏ
    [sau] ok sau: 404 cho mã không đích, hanoi/hcmc không đụng, đếm truy vấn = mốc gốc; mã dài +1; luôn-tra bị bắt

- eval: E5
  run_id: minted-chuyen-huong-ma-thi-truong-E5-r1
  exit_code: 1
  baseline: n-a
  verifier: config:executors.script.chm_app
  verified_at: 2026-11-01T13:51:43Z
  output: |
    [truoc] CHM-AC-5 Finder / Lợi suất / So sánh nhận mã dài (truoc) đỏ
    [sau] ok sau: Finder chọn da-nang, Lợi suất trùng, So sánh [vn-da-nang, vn-hanoi]; mã không đích bị bỏ

- eval: E6
  run_id: minted-chuyen-huong-ma-thi-truong-E6-r1
  exit_code: 1
  baseline: n-a
  verifier: config:executors.script.chm_app
  verified_at: 2026-11-01T13:51:43Z
  output: |
    [truoc] CHM-AC-8 API app — ma trận 5 ô (truoc) đỏ
    [sau] ok sau: 5/5 ô, đột biến từng route bị bắt

- eval: E7
  run_id: minted-chuyen-huong-ma-thi-truong-E7-r1
  exit_code: 2
  baseline: n-a
  verifier: config:executors.script.chm_api
  verified_at: 2026-11-01T13:51:43Z
  output: |
    [truoc] ok truoc: 9/9 ô, 32 mã dài → data.id = mã dài
    chm: createdb: database creation failed: duplicate key (datname)=(oneinvest_n1_chm_sau) already exists
    ca data-api trên DB sau chưa chạy

- eval: E8
  run_id: minted-chuyen-huong-ma-thi-truong-E8-r1
  exit_code: 2
  baseline: n-a
  verifier: config:executors.script.chm_api
  verified_at: 2026-11-01T13:51:43Z
  output: |
    [truoc] ok truoc: 404 nêu nguyên mã, listings rỗng, vn-hanoi đếm = mốc gốc, luôn-tra bị bắt
    chm: createdb: database creation failed: duplicate key (datname)=(oneinvest_n1_chm_sau) already exists
    ca DB sau chưa chạy

- eval: E9
  run_id: minted-chuyen-huong-ma-thi-truong-E9-r1
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/chuyen-huong-ma-thi-truong/probes/scope.sh
  verified_at: 2026-11-01T13:51:43Z
  output: |
    SCOPE OK

- eval: E10
  run_id: minted-chuyen-huong-ma-thi-truong-E10-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.test.ui_route_slugs
  verified_at: 2026-11-01T13:51:43Z
  output: |
    route-slugs.test.mjs: fail 0

- eval: E11
  run_id: minted-chuyen-huong-ma-thi-truong-E11-r1
  exit_code: 0
  baseline: red
  verifier: config:executors.test.app
  verified_at: 2026-11-01T13:51:43Z
  output: |
    app tsc --noEmit và lint không lỗi

- eval: E12
  run_id: minted-chuyen-huong-ma-thi-truong-E12-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.chm_app_test
  verified_at: 2026-11-01T13:51:43Z
  output: |
    APP TEST PASS

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-chuyen-huong-ma-thi-truong-SUITE-npm_test__bb6271-r1
  exit_code: 0
  verified_at: 2026-11-01T13:51:43Z

- cmd: cd app && npm test
  run_id: minted-chuyen-huong-ma-thi-truong-SUITE-npm_test__bd9a35-r1
  exit_code: 1
  verified_at: 2026-11-01T13:51:43Z

- cmd: cd pipeline && npm test
  run_id: minted-chuyen-huong-ma-thi-truong-SUITE-npm_test__13563d-r1
  exit_code: 0
  verified_at: 2026-11-01T13:51:43Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-chuyen-huong-ma-thi-truong-SUITE-test_lint_rules-r1
  exit_code: 0
  verified_at: 2026-11-01T13:51:43Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-chuyen-huong-ma-thi-truong-SUITE-node_scripts_check_portal_compliance_mjs-r1
  exit_code: 0
  verified_at: 2026-11-01T13:51:43Z

## Known limits

## Ngoài hợp đồng

## Analyst

Eval không-phân-biệt (xanh trên cả HEAD lẫn baseline): E10 (`cd app && node --test eslint-plugin-onehub-ui/tests/route-slugs.test.mjs`). Đây là regression-guard có chủ ý: luật slug URL không được vỡ vì diff không thêm route.

Baseline khong do:
- node scripts/chuyen-huong-ma-thi-truong/acceptance.mjs ma: bo qua baseline: tep scripts/chuyen-huong-ma-thi-truong/acceptance.mjs co o cay dang kiem nhung chua co o merge-base a86804f700bbad07462d47a2b0d6500a3ecfa37e — eval moi, chay tren code cu khong phan biet gi
- node scripts/chuyen-huong-ma-thi-truong/acceptance.mjs app: bo qua baseline: tep scripts/chuyen-huong-ma-thi-truong/acceptance.mjs co o cay dang kiem nhung chua co o merge-base a86804f700bbad07462d47a2b0d6500a3ecfa37e — eval moi, chay tren code cu khong phan biet gi
- node scripts/chuyen-huong-ma-thi-truong/acceptance.mjs api: bo qua baseline: tep scripts/chuyen-huong-ma-thi-truong/acceptance.mjs co o cay dang kiem nhung chua co o merge-base a86804f700bbad07462d47a2b0d6500a3ecfa37e — eval moi, chay tren code cu khong phan biet gi
- bash _acceptance/chuyen-huong-ma-thi-truong/probes/scope.sh "$PWD": bo qua baseline: tep _acceptance/chuyen-huong-ma-thi-truong/probes/scope.sh co o cay dang kiem nhung chua co o merge-base a86804f700bbad07462d47a2b0d6500a3ecfa37e — eval moi, chay tren code cu khong phan biet gi
- node scripts/chuyen-huong-ma-thi-truong/acceptance.mjs app-test: bo qua baseline: tep scripts/chuyen-huong-ma-thi-truong/acceptance.mjs co o cay dang kiem nhung chua co o merge-base a86804f700bbad07462d47a2b0d6500a3ecfa37e — eval moi, chay tren code cu khong phan biet gi

## Variance

none — every multi-run eval is uniform

## Iterations

Round 1: E2, E3, E4, E5, E6, E7, E8 failed — lệnh `acceptance.mjs app` thoát lỗi vì 5 ca trên DB «trước» đỏ (DB «sau» xanh hết), lệnh `acceptance.mjs api` dừng vì DB thử `oneinvest_n1_chm_sau` đã tồn tại khi dựng lại; thêm `cd app && npm test` đỏ ở ca ON12-AC-5 (không gắn eval). Returned to implementation.
