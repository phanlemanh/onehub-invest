---
schema_version: 2
feature_slug: people-hien-so-goc
verdict: PASS
failed_evals: []
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 4872ec78f147ee37b4f9fe0a588116b817bdd321
human_signoff: Mạnh 2026-11-02
---

# Evidence Report: people-hien-so-goc

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
| E12 | AC-10 | ui-check | PASS |
| E13 | AC-11 | test | PASS |

## Evidence

- eval: E1
  run_id: minted-people-hien-so-goc-E1-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.danh_ba_ops
  verified_at: 2026-11-02T08:23:11Z
  output: |
    cd app && node --import tsx --test tests/danh-ba-nguoi-tren-ops.test.tsx
    ℹ duration_ms 3000.085333

- eval: E2
  run_id: minted-people-hien-so-goc-E2-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.danh_ba_ops
  verified_at: 2026-11-02T08:23:11Z
  output: |
    cd app && node --import tsx --test tests/danh-ba-nguoi-tren-ops.test.tsx
    ℹ duration_ms 3000.085333

- eval: E3
  run_id: minted-people-hien-so-goc-E3-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.danh_ba_ops
  verified_at: 2026-11-02T08:23:11Z
  output: |
    cd app && node --import tsx --test tests/danh-ba-nguoi-tren-ops.test.tsx
    ℹ duration_ms 3000.085333

- eval: E4
  run_id: minted-people-hien-so-goc-E4-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.danh_ba_ops
  verified_at: 2026-11-02T08:23:11Z
  output: |
    cd app && node --import tsx --test tests/danh-ba-nguoi-tren-ops.test.tsx
    ℹ duration_ms 3000.085333

- eval: E5
  run_id: minted-people-hien-so-goc-E5-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.danh_ba_ops
  verified_at: 2026-11-02T08:23:11Z
  output: |
    cd app && node --import tsx --test tests/danh-ba-nguoi-tren-ops.test.tsx
    ℹ duration_ms 3000.085333

- eval: E6
  run_id: minted-people-hien-so-goc-E6-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.deals_lien_he
  verified_at: 2026-11-02T08:23:11Z
  output: |
    cd app && node --import tsx --test tests/danh-ba-nguoi-deals-lien-he.test.tsx
    ℹ duration_ms 1599.599792

- eval: E7
  run_id: minted-people-hien-so-goc-E7-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.danh_ba_doi_chieu
  verified_at: 2026-11-02T08:23:11Z
  output: |
    cd app && node --import tsx --test tests/danh-ba-nguoi-doi-chieu.test.tsx
    ℹ duration_ms 25401.774792

- eval: E8
  run_id: minted-people-hien-so-goc-E8-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.shs_chu
  verified_at: 2026-11-02T08:23:11Z
  output: |
    node _acceptance/people-hien-so-goc/probes/chu.mjs
    SHS-AC-8 đạt: chữ đúng quyền mới, ba ô thay bởi, khối 4 đo cổng mới và đỏ khi cổng sai

- eval: E9
  run_id: minted-people-hien-so-goc-E9-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.shs_deals_cu
  verified_at: 2026-11-02T08:23:11Z
  output: |
    cd app && node --import tsx --test tests/deals-phi-ly.test.tsx tests/sellers-chip.test.tsx tests/danh-ba-nguoi-deals-lien-he.test.tsx
    ℹ duration_ms 3886.008

- eval: E10
  run_id: e10-20261102-playwright-cli-e10
  exit_code: 0
  baseline: n-a
  verifier: scripts/ui-capture.sh
  verified_at: 2026-11-02T08:23:11Z
  screenshot: evidence/E10-step1.png
  observed: |
    step1 (1280 sáng, /ops/people lọc S03): bảng Người có số điện thoại dạng 0xxx xxx xxx chữ đen rõ trên nền sáng, cột Nguồn S03, người có số và nhiều tin lên trước. step2: ô tìm chứa chuỗi số liền, còn đúng 1 hàng, số hiện tách nhóm. step3 (1280 tối): trang một người, dòng «SĐT số gốc» chữ trắng rõ trên nền tối, dòng «SĐT bấm» có nhãn «Đã nghỉ».
    step4 (/ops/deals): lưới 4 thẻ Căn giá tốt, mỗi thẻ có khối liên hệ (tên người đăng, nút điện thoại kèm số), không ảnh vỡ. step5-7 (390 sáng): bảng cuộn ngang trong khung, số của hàng đầu nằm trọn khung nhìn, chi tiết và /ops/deals xếp một cột không tràn ngang. step8, step8a: gõ dạng có dấu cách và dạng +84 liền đều ra đúng 1 hàng cùng người. Tất cả khớp Expected.
  network_observed: unscoped-partial

- eval: E11
  run_id: design-gate-b18d576bdb
  exit_code: 0
  baseline: n-a
  verifier: config:executors.design.shs_gate
  verified_at: 2026-11-02T08:23:11Z
  output: |
    design-gate (a11y/slop) chạy tuần tự trên từng tệp giao diện của vòng, tất cả xanh.

- eval: E12
  run_id: minted-people-hien-so-goc-E12-r2
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/people-hien-so-goc/probes/html-vai.mjs
  verified_at: 2026-11-02T08:23:11Z
  screenshot: evidence/E12-output.html
  observed: |
    Eval này không có bước chụp màn hình; frame dự phòng E12-output.html bọc nguyên đầu ra của probe và đã mở bằng Read. Nội dung: 30 dòng «vai · trang · html N · rsc M» cộng dòng cuối «SHS-AC-10 đạt». Vai viewer: cả 10 trang (tìm dạng 1 đến 6, danh sách nguồn S05, trang 2, một người, căn giá tốt) đều html 0 và rsc 0, khớp Expected.
    Vai ops và admin: tìm dạng 1 đến 5 là html 6/rsc 3, dạng 6 là html 4/rsc 2, danh sách S05 là 80/40, trang 2 là 400/200, một người là 4/2, căn giá tốt là 16/8 với ops và 18/9 với admin; tất cả lớn hơn 0 ở cả HTML và RSC. Trong file không có chuỗi nào khớp khuôn SĐT.
  network_observed: n-a (driver)

- eval: E13
  run_id: minted-people-hien-so-goc-E13-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.danh_ba_ops
  verified_at: 2026-11-02T08:23:11Z
  output: |
    cd app && node --import tsx --test tests/danh-ba-nguoi-tren-ops.test.tsx
    ℹ duration_ms 3000.085333

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-people-hien-so-goc-SUITE-npm_test__bb6271-r2
  exit_code: 0
  verified_at: 2026-11-02T08:23:11Z

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-people-hien-so-goc-SUITE-lint-r2
  exit_code: 0
  verified_at: 2026-11-02T08:23:11Z

- cmd: cd app && npm test
  run_id: minted-people-hien-so-goc-SUITE-npm_test__bd9a35-r2
  exit_code: 0
  verified_at: 2026-11-02T08:23:11Z

- cmd: cd pipeline && npm test
  run_id: minted-people-hien-so-goc-SUITE-npm_test__13563d-r2
  exit_code: 0
  verified_at: 2026-11-02T08:23:11Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-people-hien-so-goc-SUITE-test_lint_rules-r2
  exit_code: 0
  verified_at: 2026-11-02T08:23:11Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-people-hien-so-goc-SUITE-node_scripts_check_portal_compliance_mjs-r2
  exit_code: 0
  verified_at: 2026-11-02T08:23:11Z

## Known limits

## Ngoài hợp đồng

## Analyst

Carried từ round 1 — baseline không đo lại round này (evals.yaml không đổi từ lần baseline cuối). Field baseline của từng eval ghi n-a.

Eval không-phân-biệt (xanh trên cả code mới lẫn baseline, chứng minh harness hơn là tính năng; nên viết lại để assert hành vi mới hoặc xác nhận là regression-guard có chủ ý):

- `cd app && node --import tsx --test tests/danh-ba-nguoi-tren-ops.test.tsx` — E1, E2, E3, E4, E5, E13
- `cd app && node --import tsx --test tests/danh-ba-nguoi-doi-chieu.test.tsx` — E7
- Lệnh design-gate trên từng tệp giao diện của vòng — E11

## Variance

none — every multi-run eval is uniform

## Iterations

Round 1: E12 failed — probe đo số trên HTML/RSC theo vai chưa đạt Expected; sổ S4 vòng 1 ghi REJECT. Returned to implementation.
Round 2: tất cả 13 eval xanh, kể cả E12; getDeals đã thôi nuốt lỗi DB thành bản cloud; ô portal-deals-airdna/E5 được khai là thay bởi AC-6. Verdict PASS.

### Re-pin lần 1 — 2026-11-02, do đổi AC-8 theo Mạnh, smoke đo đúng AC-6, rút ba khai thay bởi; giữ nguyên chữ ký
run_id: repin-20261102T155004Z-10445
sha: 7f198c7a53a774e49f0a0a095431521fd615b22c · suites: 6 lệnh exit 0 · evals: 11/11 eval máy đạt kỳ vọng · ngoài làn máy: E10, E12 · AC không có chốt máy: AC-10

### Re-pin lần 2 — 2026-11-02, do hoá cũ do #274 đổi deals.ts và test sau khi xác minh, phát hiện lúc gộp main cho hồ sơ nghiệm thu
run_id: repin-20261102T220455Z-57881
sha: b7bde4aeed1ff07b63c58c1a0003752de8b16b61 · suites: 6 lệnh exit 0 · evals: 11/11 eval máy đạt kỳ vọng · ngoài làn máy: E10, E12 · AC không có chốt máy: AC-10

### Re-pin lần 3 — 2026-11-03, do công cụ đo chu.mjs đổi theo khuôn bảng của CG1, gộp main vào nhánh
run_id: repin-20261103T155534Z-93110
sha: 47085d64b7a3b18a89798f9abe9b7b8195f6144c · suites: 6 lệnh exit 0 · evals: 11/11 eval máy đạt kỳ vọng · ngoài làn máy: E10, E12 · diff chạm vật đo ngoài làn máy: E10, E12 — chưa chứng lại, đi vòng S4 delta · AC không có chốt máy: AC-10

### Re-pin lần 4 — 2026-11-03, do hoá cũ do gộp main eb7f7c07 (PR #294) và sửa dữ liệu thử
run_id: repin-20261103T211734Z-51561
sha: 099391b739bcd134a85495a68c17856240495f6f · suites: 6 lệnh exit 0 · evals: 11/11 eval máy đạt kỳ vọng · ngoài làn máy: E10, E12 · diff chạm vật đo ngoài làn máy: E10 — chưa chứng lại, đi vòng S4 delta · AC không có chốt máy: AC-10

### Re-pin lần 5 — 2026-11-06, do SHS-DC đổi cách gọi sang song song (giám sát quyết 06/11)
run_id: repin-20261106T102535Z-59438
sha: 4872ec78f147ee37b4f9fe0a588116b817bdd321 · suites: 6 lệnh exit 0 · evals: 11/11 eval máy đạt kỳ vọng · ngoài làn máy: E10, E12 · diff chạm vật đo ngoài làn máy: E10, E12 — chưa chứng lại, đi vòng S4 delta · AC không có chốt máy: AC-10
