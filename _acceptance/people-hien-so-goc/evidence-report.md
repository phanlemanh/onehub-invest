---
schema_version: 2
feature_slug: people-hien-so-goc
verdict: REJECT
failed_evals: ["E12"]
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 11168c70694ad47974d8ea453b4b425070977c80
human_signoff:
---

# Evidence Report: people-hien-so-goc

Round 1. Verdict tổng REJECT vì E12 (AC-10, đo trên bản chạy thật theo vai) không đạt ở bản chạy chính thức. Mọi eval còn lại đạt.

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | test | PASS |
| E2 | AC-2 | test | PASS |
| E3 | AC-3 | test | PASS |
| E4 | AC-4 | test | PASS |
| E5 | AC-5 | test | PASS |
| E6 | AC-6 | test | PASS |
| E7 | AC-7 | test | PASS |
| E8 | AC-8 | script | PASS |
| E9 | AC-8 | test | PASS |
| E10 | AC-9 | ui-check | PASS |
| E11 | AC-9 | script | PASS |
| E12 | AC-10 | ui-check | FAIL |
| E13 | AC-11 | test | PASS |

## Evidence

- eval: E1
  run_id: minted-people-hien-so-goc-E1-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.test.danh_ba_ops
  verified_at: 2026-11-02T07:06:49Z
  output: |
    cd app && node --import tsx --test tests/danh-ba-nguoi-tren-ops.test.tsx
    ℹ duration_ms 3161.680541

- eval: E2
  run_id: minted-people-hien-so-goc-E2-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.test.danh_ba_ops
  verified_at: 2026-11-02T07:06:49Z
  output: |
    cd app && node --import tsx --test tests/danh-ba-nguoi-tren-ops.test.tsx
    ℹ duration_ms 3161.680541

- eval: E3
  run_id: minted-people-hien-so-goc-E3-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.test.danh_ba_ops
  verified_at: 2026-11-02T07:06:49Z
  output: |
    cd app && node --import tsx --test tests/danh-ba-nguoi-tren-ops.test.tsx
    ℹ duration_ms 3161.680541

- eval: E4
  run_id: minted-people-hien-so-goc-E4-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.test.danh_ba_ops
  verified_at: 2026-11-02T07:06:49Z
  output: |
    cd app && node --import tsx --test tests/danh-ba-nguoi-tren-ops.test.tsx
    ℹ duration_ms 3161.680541

- eval: E5
  run_id: minted-people-hien-so-goc-E5-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.test.danh_ba_ops
  verified_at: 2026-11-02T07:06:49Z
  output: |
    cd app && node --import tsx --test tests/danh-ba-nguoi-tren-ops.test.tsx
    ℹ duration_ms 3161.680541

- eval: E6
  run_id: minted-people-hien-so-goc-E6-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.deals_lien_he
  verified_at: 2026-11-02T07:06:49Z
  output: |
    cd app && node --import tsx --test tests/danh-ba-nguoi-deals-lien-he.test.tsx
    ℹ duration_ms 1242.102625

- eval: E7
  run_id: minted-people-hien-so-goc-E7-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.test.danh_ba_doi_chieu
  verified_at: 2026-11-02T07:06:49Z
  output: |
    cd app && node --import tsx --test tests/danh-ba-nguoi-doi-chieu.test.tsx
    ℹ duration_ms 25615.108542

- eval: E8
  run_id: minted-people-hien-so-goc-E8-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.shs_chu
  verified_at: 2026-11-02T07:06:49Z
  output: |
    node _acceptance/people-hien-so-goc/probes/chu.mjs
    SHS-AC-8 đạt: chữ đúng quyền mới, hai ô thay bởi, khối 4 đo cổng mới và đỏ khi cổng sai

- eval: E9
  run_id: minted-people-hien-so-goc-E9-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.shs_deals_cu
  verified_at: 2026-11-02T07:06:49Z
  output: |
    cd app && node --import tsx --test tests/deals-phi-ly.test.tsx tests/sellers-chip.test.tsx tests/danh-ba-nguoi-deals-lien-he.test.tsx
    ℹ duration_ms 3657.452333

- eval: E10
  run_id: E10-people-hien-so-goc-20261102
  exit_code: 0
  baseline: n-a
  verifier: ui-check:E10
  verified_at: 2026-11-02T07:06:49Z
  screenshot: evidence/E10-step1.png
  observed: |
    Các frame step1 đến step8a (1280 sáng/tối, 390 sáng; /ops/people, trang một người, /ops/deals) cho thấy số đọc rõ ở cả hai nền, dạng tách nhóm, người có số xếp trước; ô tìm gõ hai dạng số đều ra đúng một hàng "1 người khớp".
    Trang một người hiện dòng số gốc và dòng số băm chỉ có đầu băm rút gọn kèm "Đã nghỉ"; /ops/deals có 4 thẻ, mỗi thẻ khối liên hệ với tên người đăng và nút gọi nền đen, không có ảnh vỡ; ở 390 px bảng cuộn ngang trong khung, số nằm trọn khung, không tràn trang. Số cụ thể có trong ảnh nội bộ, không chép vào báo cáo.
  network_observed: clean
  output: |
    Mạng ghi ở evidence/E10-network.txt: /ops/deals sau nạp có 1 tài liệu và 32 tài nguyên tĩnh, không có fetch/XHR (trang SSR), không lỗi 4xx/5xx; console 0 error, 1 warning preload font tĩnh.
    Lần chạy ở cổng :3460 (dãy U1) trong khi config ghi :3456 — cùng host, không có XHR nên không ngoài phạm vi.
    Frame đã lưu: E10-step1.png … E10-step8.png, E10-step8a.png, E10-network.txt.

- eval: E11
  run_id: design-gate-fd11ede3b5, design-gate-8e2d19639b
  exit_code: 0
  baseline: green
  verifier: config:executors.design.shs_gate
  verified_at: 2026-11-02T07:06:49Z
  output: |
    design-gate (a11y/slop, --jsdom) chạy lần lượt trên từng tệp giao diện của vòng, đạt hết.

- eval: E12
  run_id: minted-people-hien-so-goc-E12-r1
  exit_code: 1
  baseline: n-a
  verifier: _acceptance/people-hien-so-goc/probes/html-vai.mjs
  verified_at: 2026-11-02T07:06:49Z
  screenshot: evidence/E12-output.html
  observed: |
    Mở E12-output.txt (bản chạy chính thức): vai viewer cả 10 dòng html 0 · rsc 0 đúng Expected; vai admin ≥1 ở mọi trang; vai ops ≥1 ở tìm, S05, trang 2, một người.
    NHƯNG dòng "ops · căn giá tốt · html 0 · rsc 8": HTML của /ops/deals đếm 0 chuỗi SĐT, trái Expected "ops ≥ 1 ở cả ba trang", probe báo "SHS-AC-10 hỏng 1 chỗ" và thoát 1. Chạy lại ngay sau đó ra html 16 · rsc 8 và đạt, tức kết quả không ổn định giữa hai lần.
  network_observed: n-a (driver)
  output: |
    BASE_URL=http://localhost:3460 node _acceptance/people-hien-so-goc/probes/html-vai.mjs > evidence/E12-output.txt, thoát 1, "SHS-AC-10 hỏng 1 chỗ".
    Server đã chạy sẵn ở :3460 (cwd = app/ của worktree, next-server v16.4.2), dùng chung. Ba tài khoản thử (viewer, ops, admin) đều giữ nguyên.
    Đạt: viewer 0 chuỗi SĐT ở HTML và RSC mọi trang; admin ≥1 ở HTML tìm/danh sách/một người/deals; ops ≥1 ở tìm/danh sách/một người; đối chứng dương vai ops với q > 0.
    Không đạt: ops ≥1 ở HTML /ops/deals (bản chính thức html 0, rsc 8) và thoát 0.
    Chẩn đoán (không ghi đè evidence): chạy lại ra ops deals html 16 · rsc 8, admin 18/9, viewer 0/0, đạt; curl riêng vai ops /ops/deals trả HTTP 200 có 8 liên kết tel:, không BAILOUT.
    Không có ảnh (driver curl/probe); file lưu: evidence/E12-output.txt và bản sao evidence/E12-output.html. Không có E12-network.txt vì driver không đọc network.

- eval: E13
  run_id: minted-people-hien-so-goc-E13-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.test.danh_ba_ops
  verified_at: 2026-11-02T07:06:49Z
  output: |
    cd app && node --import tsx --test tests/danh-ba-nguoi-tren-ops.test.tsx
    ℹ duration_ms 3161.680541

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-people-hien-so-goc-SUITE-npm_test__bb6271-r1
  exit_code: 0
  verified_at: 2026-11-02T07:06:49Z

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-people-hien-so-goc-SUITE-lint-r1
  exit_code: 0
  verified_at: 2026-11-02T07:06:49Z

- cmd: cd app && npm test
  run_id: minted-people-hien-so-goc-SUITE-npm_test__bd9a35-r1
  exit_code: 0
  verified_at: 2026-11-02T07:06:49Z

- cmd: cd pipeline && npm test
  run_id: minted-people-hien-so-goc-SUITE-npm_test__13563d-r1
  exit_code: 0
  verified_at: 2026-11-02T07:06:49Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-people-hien-so-goc-SUITE-test_lint_rules-r1
  exit_code: 0
  verified_at: 2026-11-02T07:06:49Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-people-hien-so-goc-SUITE-node_scripts_check_portal_compliance_mjs-r1
  exit_code: 0
  verified_at: 2026-11-02T07:06:49Z

## Known limits

## Ngoài hợp đồng

## Analyst

Lệnh fail gắn eval: lệnh ui-check:E12 (eval E12) thoát 1 ở bản chạy chính thức; không có lệnh fail nào không gắn eval.

Eval không phân biệt (xanh trên cả code mới lẫn baseline, chứng minh harness chứ chưa chứng minh tính năng; nên viết lại để assert hành vi mới hoặc xác nhận là regression-guard có chủ ý):
- cd app && node --import tsx --test tests/danh-ba-nguoi-tren-ops.test.tsx: E1, E2, E3, E4, E5, E13
- cd app && node --import tsx --test tests/danh-ba-nguoi-doi-chieu.test.tsx: E7
- Lệnh design-gate lặp trên từng tệp giao diện của vòng: E11

Baseline không đo:
- cd app && node --import tsx --test tests/danh-ba-nguoi-deals-lien-he.test.tsx: bo qua baseline: tep app/tests/danh-ba-nguoi-deals-lien-he.test.tsx co o cay dang kiem nhung chua co o merge-base d531d2d864b209ca74b164d3a99a222631978192 — eval moi, chay tren code cu khong phan biet gi
- node _acceptance/people-hien-so-goc/probes/chu.mjs: bo qua baseline: tep _acceptance/people-hien-so-goc/probes/chu.mjs co o cay dang kiem nhung chua co o merge-base d531d2d864b209ca74b164d3a99a222631978192 — eval moi, chay tren code cu khong phan biet gi
- cd app && node --import tsx --test tests/deals-phi-ly.test.tsx tests/sellers-chip.test.tsx tests/danh-ba-nguoi-deals-lien-he.test.tsx: bo qua baseline: tep app/tests/danh-ba-nguoi-deals-lien-he.test.tsx co o cay dang kiem nhung chua co o merge-base d531d2d864b209ca74b164d3a99a222631978192 — eval moi, chay tren code cu khong phan biet gi

## Variance

E12 (chạy một lần, máy không gắn cờ phương sai): nghi flaky. Bản chạy chính thức cho ops · căn giá tốt html 0 · rsc 8; chạy lại một lần ngay sau đó cho html 16 · rsc 8 và đạt. Gốc của lần lệch chưa rõ, cần người viết điều tra trước khi chạy lại vòng sau. Các eval khác: none — mọi eval chạy một lần và đồng nhất.

## Iterations

Round 1: E12 không đạt — vai Vận hành ở /ops/deals có HTML đếm 0 chuỗi SĐT dù payload RSC có 8, lần chạy lại thì ra đủ; kết quả không ổn định. Trả về cho khâu triển khai.
