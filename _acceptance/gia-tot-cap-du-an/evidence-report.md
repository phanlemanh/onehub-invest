---
schema_version: 2
feature_slug: gia-tot-cap-du-an
verdict: PASS
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: e0b197c45e76e598d023f30192b88314605bb495
human_signoff:
---

# Evidence Report: gia-tot-cap-du-an

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
  carried_from_round: 1
  output: |
    carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E2
  run_id: minted-gia-tot-cap-du-an-E2-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.cg10_db
  verified_at: 2026-11-15T12:50:06Z
  carried_from_round: 1
  output: |
    carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E3
  run_id: minted-gia-tot-cap-du-an-E3-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.cg10_db
  verified_at: 2026-11-15T12:50:06Z
  carried_from_round: 1
  output: |
    carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E4
  run_id: minted-gia-tot-cap-du-an-E4-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.cg10_db
  verified_at: 2026-11-15T12:50:06Z
  carried_from_round: 1
  output: |
    carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E5
  run_id: minted-gia-tot-cap-du-an-E5-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.cg10_db
  verified_at: 2026-11-15T12:50:06Z
  carried_from_round: 1
  output: |
    carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E6
  run_id: minted-gia-tot-cap-du-an-E6-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.cg10_doc
  verified_at: 2026-11-15T15:04:18Z
  output: |
    cd app && bash ../db/db-thu.sh oneinvest_suite_cg10_doc --chay node --import tsx --test --test-concurrency=1 tests/gia-tot-du-an-doc.test.tsx
    ℹ duration_ms 8915.048208

- eval: E7
  run_id: minted-gia-tot-cap-du-an-E7-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.cg10_doc
  verified_at: 2026-11-15T15:04:18Z
  output: |
    cd app && bash ../db/db-thu.sh oneinvest_suite_cg10_doc --chay node --import tsx --test --test-concurrency=1 tests/gia-tot-du-an-doc.test.tsx
    ℹ duration_ms 8915.048208

- eval: E8
  run_id: minted-gia-tot-cap-du-an-E8-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.cg10_ranh
  verified_at: 2026-11-15T15:04:18Z
  output: |
    ca CG10-AC-8 (app + pipeline) xanh, hang-gia-ranh-gioi --doi-chung do dung, --base origin/main:
    KẾT: trong ranh giới

- eval: E9
  run_id: minted-gia-tot-cap-du-an-E9-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.cg10_do
  verified_at: 2026-11-15T12:50:06Z
  carried_from_round: 1
  output: |
    carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E10
  run_id: minted-gia-tot-cap-du-an-E10-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.ui-check
  verified_at: 2026-11-15T12:50:06Z
  carried_from_round: 1
  screenshot: evidence/E10-step1.png
  observed: |
    step1 (sáng, 1280): tiêu đề «Căn giá tốt · Vinhomes Ocean Park 1», chip «Giảm từ 5%», «45 ngày gần nhất», nút «Bỏ lọc dự án»; tab Tất cả 140 / Đủ để gọi 89 / Cần xác minh 0 / Còn thiếu 51; 25 dòng, mỗi căn một dòng; dòng 17 hiện «Gia Lâm · 2 tin» ở dòng phụ dưới tên căn; thumbnail và SĐT bị khối xám che, email sidebar che. step2 (sáng): tab Cần xác minh đang chọn, đếm 0, bảng trống «Mục này chưa có căn.», phân trang 0–0 / 0. step3 (tối): trang một căn OP1 36 m² nhãn gia-tot, thẻ «Vì sao giá tốt» câu «So với 122 căn cùng dự án Vinhomes Ocean Park 1, cùng loại (căn hộ), cùng 0PN: thấp hơn trung vị 9.8%, nằm trong 20% rẻ nhất — Giá tốt.», Giá/m² 54, thước dự án 60 tr/m², 122 tin S06, mức giảm 9.8%; ảnh và SĐT che; không có huy hiệu «Giá tốt» riêng. step4 (tối): căn thuê 1PN, «Diện tích ≈ 43–50 m² · suy ra», banner «Còn thiếu: Chưa có diện tích…», câu «So với 116 căn cùng dự án Vinhomes Ocean Park 1, cùng loại (căn hộ), cùng 1PN, theo giá thuê tháng: thấp hơn trung vị 14.3%», SĐT che. step5 (sáng): không có tên dự án trong tiêu đề, thẻ trống «Không tìm thấy dự án» + «Mã dự án trên đường dẫn không có trong danh bạ.» + nút «Bỏ lọc dự án». step6 (tối): «Căn giá tốt · Citi Soho», nút «Bỏ lọc dự án» ở đầu, thẻ trống «Dự án chưa đủ căn để xếp hạng» + câu nêu Citi Soho và nút «Bỏ lọc dự án». Số liệu trên màn khớp DB; sáng và tối đọc rõ.
  network_observed: n-a (driver)
  note: carry-forward tu round 1 — delta khong cham paths cua eval

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-gia-tot-cap-du-an-SUITE-npm_test__bb6271-r2
  exit_code: 0
  verified_at: 2026-11-15T15:04:18Z

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-gia-tot-cap-du-an-SUITE-lint-r2
  exit_code: 0
  verified_at: 2026-11-15T15:04:18Z

- cmd: cd app && npm test
  run_id: minted-gia-tot-cap-du-an-SUITE-npm_test__bd9a35-r2
  exit_code: 0
  verified_at: 2026-11-15T15:04:18Z

- cmd: cd pipeline && npm run test:a
  run_id: minted-gia-tot-cap-du-an-SUITE-test_a-r2
  exit_code: 0
  verified_at: 2026-11-15T15:04:18Z

- cmd: cd pipeline && npm run test:b
  run_id: minted-gia-tot-cap-du-an-SUITE-test_b-r2
  exit_code: 0
  verified_at: 2026-11-15T15:04:18Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-gia-tot-cap-du-an-SUITE-test_lint_rules-r2
  exit_code: 0
  verified_at: 2026-11-15T15:04:18Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-gia-tot-cap-du-an-SUITE-node_scripts_check_portal_compliance_mjs-r2
  exit_code: 0
  verified_at: 2026-11-15T15:04:18Z

## Known limits

## Ngoài hợp đồng

## Analyst

carried tu round 1 — baseline khong do lai round nay. Moi eval ghi baseline n-a. Khong eval nao bi liet ke la khong-phan-biet.

## Variance

none — every multi-run eval is uniform

## Iterations

Round 1: lenh suite app npm test va pipeline test:a bao do (S4 luot 1 bi tu choi) — da sua test-nua xep tep test moi, tach dong import trang cho ca nguon SHS/OD1, bang khoa cu AC-8 kiem ca kieu. Returned to implementation.
Round 2: E6, E7, E8 chay lai va cac lenh suite xanh; E1–E5, E9, E10 carry-forward tu round 1. Verdict PASS.
