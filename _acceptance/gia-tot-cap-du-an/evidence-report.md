---
schema_version: 2
feature_slug: gia-tot-cap-du-an
verdict: REJECT
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: e45f36333c0639c30995fc29b613f468f35563d3
human_signoff:
---

# Evidence Report: gia-tot-cap-du-an

Round 1 bị REJECT dù cả 10 eval của hợp đồng đều đạt: hai lệnh suite hồi quy không gắn eval nào đã đỏ (`cd app && npm test` và `cd pipeline && npm run test:a`). Chi tiết ở mục «Lệnh suite (hồi quy)» và «Iterations».

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | script | PASS |
| E2 | AC-2 | script | PASS |
| E3 | AC-3 | script | PASS |
| E4 | AC-4 | script | PASS |
| E5 | AC-5 | script | PASS |
| E6 | AC-6 | script | PASS |
| E7 | AC-7 | script | PASS |
| E8 | AC-8 | script | PASS |
| E9 | AC-9 | script | PASS |
| E10 | AC-10 | ui-check | PASS |

## Evidence

- eval: E1
  run_id: minted-gia-tot-cap-du-an-E1-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.cg10_db
  verified_at: 2026-11-15T12:50:06Z
  output: |
    cd pipeline && bash ../db/db-thu.sh oneinvest_suite_cg10 --chay node --test --test-concurrency=1 scripts/gia-tot-du-an.test.mjs scripts/hang-gia.test.mjs
    ℹ duration_ms 51141.934209

- eval: E2
  run_id: minted-gia-tot-cap-du-an-E2-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.cg10_db
  verified_at: 2026-11-15T12:50:06Z
  output: |
    cùng lệnh với E1 (ma trận 8 ô, ca CG9 hang-gia.test.mjs chạy trong cùng lệnh)
    ℹ duration_ms 51141.934209

- eval: E3
  run_id: minted-gia-tot-cap-du-an-E3-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.cg10_db
  verified_at: 2026-11-15T12:50:06Z
  output: |
    cùng lệnh với E1 (thuê theo giá tháng, khoá số phòng ngủ)
    ℹ duration_ms 51141.934209

- eval: E4
  run_id: minted-gia-tot-cap-du-an-E4-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.cg10_db
  verified_at: 2026-11-15T12:50:06Z
  output: |
    cùng lệnh với E1 (lược đồ không view, lược đồ khác public, chưa áp 106, chạy lại)
    ℹ duration_ms 51141.934209

- eval: E5
  run_id: minted-gia-tot-cap-du-an-E5-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.cg10_db
  verified_at: 2026-11-15T12:50:06Z
  output: |
    cùng lệnh với E1 (áp 106 hai lần, project_area_band)
    ℹ duration_ms 51141.934209

- eval: E6
  run_id: minted-gia-tot-cap-du-an-E6-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.cg10_doc
  verified_at: 2026-11-15T12:50:06Z
  output: |
    cd app && bash ../db/db-thu.sh oneinvest_suite_cg10_doc --chay node --import tsx --test --test-concurrency=1 tests/gia-tot-du-an-doc.test.tsx
    ℹ duration_ms 13493.52325

- eval: E7
  run_id: minted-gia-tot-cap-du-an-E7-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.cg10_doc
  verified_at: 2026-11-15T12:50:06Z
  output: |
    cùng lệnh với E6 (getDeals lọc dự án, mỗi căn một dòng, đếm tab)
    ℹ duration_ms 13493.52325

- eval: E8
  run_id: minted-gia-tot-cap-du-an-E8-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.cg10_ranh
  verified_at: 2026-11-15T12:50:06Z
  output: |
    node scripts/hang-gia-ranh-gioi.mjs --doi-chung && node scripts/hang-gia-ranh-gioi.mjs --base origin/main
    KẾT: trong ranh giới

- eval: E9
  run_id: minted-gia-tot-cap-du-an-E9-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.cg10_do
  verified_at: 2026-11-15T12:50:06Z
  output: |
    bash pipeline/scripts/gia-tot-du-an-db.sh do
    đối chứng hỏng: đỏ đúng (lech > 0)

- eval: E10
  run_id: minted-gia-tot-cap-du-an-E10-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.ui-check
  verified_at: 2026-11-15T12:50:06Z
  screenshot: evidence/E10-step1.png
  observed: |
    step1 (sáng, 1280): tiêu đề «Căn giá tốt · Vinhomes Ocean Park 1», chip «Giảm từ 5%», «45 ngày gần nhất», nút «Bỏ lọc dự án»; tab Tất cả 140 / Đủ để gọi 89 / Cần xác minh 0 / Còn thiếu 51; 25 dòng, mỗi căn một dòng; dòng 17 hiện «Gia Lâm · 2 tin» ở dòng phụ dưới tên căn; thumbnail và SĐT bị khối xám che, email sidebar che. step2 (sáng): tab Cần xác minh đang chọn, đếm 0, bảng trống «Mục này chưa có căn.», phân trang 0–0 / 0. step3 (tối): trang một căn OP1 36 m² nhãn gia-tot, thẻ «Vì sao giá tốt» câu «So với 122 căn cùng dự án Vinhomes Ocean Park 1, cùng loại (căn hộ), cùng 0PN: thấp hơn trung vị 9.8%, nằm trong 20% rẻ nhất — Giá tốt.», Giá/m² 54, thước dự án 60 tr/m², 122 tin S06, mức giảm 9.8%; ảnh và SĐT che; không có huy hiệu «Giá tốt» riêng. step4 (tối): căn thuê 1PN, «Diện tích ≈ 43–50 m² · suy ra», banner «Còn thiếu: Chưa có diện tích…», câu «So với 116 căn cùng dự án Vinhomes Ocean Park 1, cùng loại (căn hộ), cùng 1PN, theo giá thuê tháng: thấp hơn trung vị 14.3%», SĐT che. step5 (sáng): không có tên dự án trong tiêu đề, thẻ trống «Không tìm thấy dự án» + «Mã dự án trên đường dẫn không có trong danh bạ.» + nút «Bỏ lọc dự án». step6 (tối): «Căn giá tốt · Citi Soho», nút «Bỏ lọc dự án» ở đầu, thẻ trống «Dự án chưa đủ căn để xếp hạng» + câu nêu Citi Soho và nút «Bỏ lọc dự án». Số liệu trên màn khớp DB; sáng và tối đọc rõ.
  network_observed: n-a (driver)

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-gia-tot-cap-du-an-SUITE-npm_test__bb6271-r1
  exit_code: 0
  verified_at: 2026-11-15T12:50:06Z

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-gia-tot-cap-du-an-SUITE-lint-r1
  exit_code: 0
  verified_at: 2026-11-15T12:50:06Z

- cmd: cd app && npm test
  run_id: minted-gia-tot-cap-du-an-SUITE-npm_test__bd9a35-r1
  exit_code: 1
  verified_at: 2026-11-15T12:50:06Z
  ghi chú: đỏ, không gắn eval nào. Ca SHS-AC-6 trong tests/danh-ba-nguoi-deals-lien-he.test.tsx báo «bản chép không áp được» với dòng import `dealHang, dealTheoVai, getDeals` từ `@/lib/deals`. Ca OD1-AC-9 trong tests/ops-duyet-nhip.test.tsx báo «TRANG QUEN CHO GHEP: danh sách».

- cmd: cd pipeline && npm run test:a
  run_id: minted-gia-tot-cap-du-an-SUITE-test_a-r1
  exit_code: 1
  verified_at: 2026-11-15T12:50:06Z
  ghi chú: đỏ, không gắn eval nào. 252 ca đạt, 1 ca đỏ. Ca CN-1 trong scripts/chia-nua.test.mjs đòi tệp scripts/gia-tot-du-an.test.mjs được xếp vào một nửa trong test-nua.json mà chưa có.

- cmd: cd pipeline && npm run test:b
  run_id: minted-gia-tot-cap-du-an-SUITE-test_b-r1
  exit_code: 0
  verified_at: 2026-11-15T12:50:06Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-gia-tot-cap-du-an-SUITE-test_lint_rules-r1
  exit_code: 0
  verified_at: 2026-11-15T12:50:06Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-gia-tot-cap-du-an-SUITE-node_scripts_check_portal_compliance_mjs-r1
  exit_code: 0
  verified_at: 2026-11-15T12:50:06Z

## Known limits

## Ngoài hợp đồng

## Analyst

none — mọi eval feature đều red trên baseline (có phân biệt)

Baseline không đo (cả bốn lệnh feature đều ghi n-a):
- cd pipeline && bash ../db/db-thu.sh oneinvest_suite_cg10 --chay node --test --test-concurrency=1 scripts/gia-tot-du-an.test.mjs scripts/hang-gia.test.mjs: bo qua baseline: tep pipeline/scripts/gia-tot-du-an.test.mjs co o cay dang kiem nhung chua co o merge-base 5feee127a1ee2780846d8ac397f80e558396009a — eval moi, chay tren code cu khong phan biet gi
- cd app && bash ../db/db-thu.sh oneinvest_suite_cg10_doc --chay node --import tsx --test --test-concurrency=1 tests/gia-tot-du-an-doc.test.tsx: bo qua baseline: tep app/tests/gia-tot-du-an-doc.test.tsx co o cay dang kiem nhung chua co o merge-base 5feee127a1ee2780846d8ac397f80e558396009a — eval moi, chay tren code cu khong phan biet gi
- cd app && bash ../db/db-thu.sh oneinvest_suite_cg10_ranh --chay node --import tsx --test --test-concurrency=1 --test-name-pattern=CG10-AC-8 tests/gia-tot-du-an-doc.test.tsx && cd ../pipeline && node --test --test-concurrency=1 --test-name-pattern=CG10-AC-8 scripts/gia-tot-du-an.test.mjs && node scripts/hang-gia-ranh-gioi.mjs --doi-chung && node scripts/hang-gia-ranh-gioi.mjs --base origin/main: bo qua baseline: tep app/tests/gia-tot-du-an-doc.test.tsx co o cay dang kiem nhung chua co o merge-base 5feee127a1ee2780846d8ac397f80e558396009a — eval moi, chay tren code cu khong phan biet gi
- bash pipeline/scripts/gia-tot-du-an-db.sh do: bo qua baseline: tep pipeline/scripts/gia-tot-du-an-db.sh co o cay dang kiem nhung chua co o merge-base 5feee127a1ee2780846d8ac397f80e558396009a — eval moi, chay tren code cu khong phan biet gi

## Variance

none — mọi eval nhiều lần chạy đều đồng nhất (mọi eval chạy một lần, xác định)

## Iterations

Round 1: cả 10 eval của hợp đồng đạt nhưng hai lệnh suite không gắn eval nào đỏ: `cd app && npm test` (SHS-AC-6, OD1-AC-9) và `cd pipeline && npm run test:a` (CN-1: gia-tot-du-an.test.mjs chưa xếp vào test-nua.json). Trả về triển khai.
