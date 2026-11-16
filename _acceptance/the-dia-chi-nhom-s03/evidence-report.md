---
schema_version: 2
feature_slug: the-dia-chi-nhom-s03
verdict: REJECT
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 2b2af3a64b27937d72818ede3b20394c61d1ff8a
human_signoff:
---

# Evidence Report: the-dia-chi-nhom-s03

Round 2. Không eval nào khai báo bị đỏ, nhưng một lệnh suite (hồi quy) không gắn eval nào đã đỏ nên verdict là REJECT. Lệnh đó là `cd agent && npm test`, ca LS1-AC-7 báo deadlock detected (mã 40P01) trên DB thử. Chi tiết ở mục Lệnh suite bên dưới.

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | test | PASS (mang từ round 1) |
| E2 | AC-2 | test | PASS (mang từ round 1) |
| E3 | AC-3 | test | PASS (mang từ round 1) |
| E4 | AC-4 | test | PASS (mang từ round 1) |
| E5 | AC-5 | ui-check | PASS (mang từ round 1) |
| E6 | AC-6 | test | PASS (mang từ round 1) |
| E7 | AC-7 | script | PASS (mang từ round 1) |
| E8 | AC-8 | script | PASS (mang từ round 1) |
| E9 | AC-9 | test | PASS (mang từ round 1) |
| E10 | AC-10 | judgment | PASS (đề xuất của hội đồng, chờ người quyết) |

## Evidence

Chín eval E1 đến E9 là carry-forward: delta của round 2 không chạm paths của các eval này nên round này không chạy lại.

- eval: E1
  run_id: minted-the-dia-chi-nhom-s03-E1-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.tg1_db
  verified_at: 2026-11-16T02:41:51Z
  carried_from_round: 1
  output: |
    carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E2
  run_id: minted-the-dia-chi-nhom-s03-E2-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.tg1_unit
  verified_at: 2026-11-16T02:41:51Z
  carried_from_round: 1
  output: |
    carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E3
  run_id: minted-the-dia-chi-nhom-s03-E3-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.tg1_db
  verified_at: 2026-11-16T02:41:51Z
  carried_from_round: 1
  output: |
    carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E4
  run_id: minted-the-dia-chi-nhom-s03-E4-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.tg1_app
  verified_at: 2026-11-16T02:41:51Z
  carried_from_round: 1
  output: |
    carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E5
  run_id: E5-ui-20261116
  exit_code: 0
  baseline: n-a
  verifier: config:dev_server.start
  verified_at: 2026-11-16T02:41:51Z
  carried_from_round: 1
  screenshot: evidence/E5-step1.png
  observed: |
    E5-step1.png (1280, sáng): tiêu đề «Thẻ địa chỉ nhóm», hai badge «28 nhóm có thể» và «28 chờ duyệt» khớp 28 lệnh dựng nháp in; bảng 28 hàng badge vàng «Nháp», nút «Duyệt thẻ»; hàng cuối «Chưa có trong sổ»; email sidebar che «•••@•••».
    E5-step2.png: hộp «Duyệt thẻ TN-008» có bốn ô kèm dòng căn cứ chữ xám (nguồn và số bài), nút Bác và Nhận. E5-step3/4/5: nhận, sửa, bác đổi badge và bộ đếm, toast tương ứng; bác khi ghi chú dưới 3 ký tự bị chặn bằng gợi ý.
    E5-step-o-trong.png: ô trống ghi «Chưa đủ căn cứ (số bài đã đọc)». E5-step-409.png: Alert «Thẻ đã đổi từ lúc anh mở» giữ chữ đã nhập, có nút «Tải lại thẻ». E5-step-viewer.png: vai viewer chỉ có nút Đóng. E5-step6.png và E5-step6-hop.png (375): vừa màn hình, không tràn trang. Khớp expected.
  network_observed: clean
  ghi chú: carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E6
  run_id: minted-the-dia-chi-nhom-s03-E6-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.tg1_app
  verified_at: 2026-11-16T02:41:51Z
  carried_from_round: 1
  output: |
    carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E7
  run_id: minted-the-dia-chi-nhom-s03-E7-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.tg1_that_dem
  verified_at: 2026-11-16T02:41:51Z
  carried_from_round: 1
  output: |
    carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E8
  run_id: minted-the-dia-chi-nhom-s03-E8-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.tg1_that_chat_luong
  verified_at: 2026-11-16T02:41:51Z
  carried_from_round: 1
  output: |
    carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E9
  run_id: minted-the-dia-chi-nhom-s03-E9-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.tg1_lui
  verified_at: 2026-11-16T02:41:51Z
  carried_from_round: 1
  output: |
    carry-forward tu round 1 — delta khong cham paths cua eval

### Judgment

- eval: E10
  panel đề xuất: PASS, ba góc nhìn (domain-correctness, operational-feasibility, spec-alignment)
  - domain-correctness: PASS — Cả hai ảnh đều có dòng chú dưới mỗi ô. Thẻ đủ ô ghi «từ bài đã đọc, 44 bài», «theo dự án» (phường·tỉnh), «từ bài đã đọc: 248 bán, 1.001 thuê». Thẻ trống ghi «Chưa đủ căn cứ (1 bài đã đọc)» ở mọi ô, và phân khu đủ căn cứ cũng có chú riêng. CONTEXT.md có mục «Thẻ địa chỉ nhóm» với nhãn, định nghĩa, mã code `group_address_card`, mã thẻ `TN-001`, slug `group-cards` và _Avoid_.
  - operational-feasibility: PASS — Ảnh TN-008 ghi nguồn và số bài cho từng ô: dự án «từ bài đã đọc, 44 bài», phường·tỉnh «theo dự án», phân khu «Chưa đủ căn cứ (1.351 bài đã đọc)», bán/thuê «248 bán, 1.001 thuê». Ảnh TN-005 (ô trống) ghi «Chưa đủ căn cứ (1 bài đã đọc)» ở cả bốn ô. CONTEXT.md có mục «Thẻ địa chỉ nhóm» đủ nhãn, mã, định nghĩa, slug `group-cards` và _Avoid_.
  - spec-alignment: PASS — Thẻ TN-008 ghi nguồn và số bài ngay dưới mỗi ô. Phân khu để trống kèm lý do «Chưa đủ căn cứ (1.351 bài đã đọc)». Thẻ TN-005 ghi «Chưa đủ căn cứ (1 bài đã đọc)» ở cả bốn ô. CONTEXT.md có mục «Thẻ địa chỉ nhóm» đủ định nghĩa, code, mã thẻ, slug và _Avoid_. Ô phường·tỉnh chỉ ghi «theo dự án», không kèm số bài; vì suy ra từ dự án nên coi là chấp nhận được.
  human_override:  # chi nguoi ghi

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-the-dia-chi-nhom-s03-SUITE-npm_test__bb6271-r2
  exit_code: 1
  verified_at: 2026-11-16T04:07:28Z
  ghi chú: không gắn eval nào. 343 ca, 341 đạt, 1 đỏ, 1 bỏ qua. Ca đỏ là «LS1-AC-7 đầu ghi khớp fixture thẻ mà app duyệt qua route» (tests/doc-toan-bo-the.test.ts), lỗi deadlock detected, mã 40P01, giữa hai tiến trình trên cùng một DB thử. Chưa rõ do tranh chấp khoá khi chạy song song hay do lỗi thật; cần chạy lại riêng ca này để phân biệt.

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-the-dia-chi-nhom-s03-SUITE-lint-r2
  exit_code: 0
  verified_at: 2026-11-16T04:07:28Z

- cmd: cd app && npm test
  run_id: minted-the-dia-chi-nhom-s03-SUITE-npm_test__bd9a35-r2
  exit_code: 0
  verified_at: 2026-11-16T04:07:28Z

- cmd: cd pipeline && npm run test:a
  run_id: minted-the-dia-chi-nhom-s03-SUITE-test_a-r2
  exit_code: 0
  verified_at: 2026-11-16T04:07:28Z

- cmd: cd pipeline && npm run test:b
  run_id: minted-the-dia-chi-nhom-s03-SUITE-test_b-r2
  exit_code: 0
  verified_at: 2026-11-16T04:07:28Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-the-dia-chi-nhom-s03-SUITE-test_lint_rules-r2
  exit_code: 0
  verified_at: 2026-11-16T04:07:28Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-the-dia-chi-nhom-s03-SUITE-node_scripts_check_portal_compliance_mjs-r2
  exit_code: 0
  verified_at: 2026-11-16T04:07:28Z

## Known limits

## Ngoài hợp đồng

## Analyst

carried tu round 1 — baseline khong do lai round nay. Mọi eval ghi baseline n-a vì round này không đo lại. Không có eval nào bị đánh dấu không-phân-biệt.

Lệnh fail không gắn eval: `cd agent && npm test` (ca LS1-AC-7, deadlock detected). Người quyết cần chạy lại ca này riêng để biết đó là tranh chấp khoá khi chạy song song hay lỗi thật.

## Variance

none — không eval nào có runs lớn hơn 1; mọi eval là deterministic và không có kết quả hỗn hợp.

## Iterations

Round 1: E1 đến E9 chạy và đạt; E10 do hội đồng đề xuất PASS. Đã sửa tiếp ở S4 r1 và r2 (khai tệp TG1 vào kiểm kê, kê trang group-cards vào quét nhãn Ops).
Round 2: E1 đến E9 mang từ round 1, E10 giữ đề xuất. Lệnh suite `cd agent && npm test` đỏ ở ca LS1-AC-7 (deadlock detected), không gắn eval nào, nên verdict REJECT. Trả về triển khai để xác định ca này là flaky hay lỗi thật.
