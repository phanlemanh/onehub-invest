---
schema_version: 2
feature_slug: can-gia-tot-cung-loai
verdict: PASS
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 3697415ee12b1e3029a6cdb9d00e548b7e128172
human_signoff:
---

# Evidence Report: can-gia-tot-cung-loai

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | script | PASS |
| E2 | AC-2 | script | PASS |
| E3 | AC-3 | script | PASS |
| E4 | AC-4 | test | PASS |
| E5 | AC-5 | script | PASS |
| E6 | AC-6 | script | PASS |
| E7 | AC-7 | script | PASS |
| E8 | AC-8 | ui-check | PASS |
| E9 | AC-9 | script | PASS |
| E10 | AC-10 | script | PASS |

## Evidence

- eval: E1
  run_id: minted-can-gia-tot-cung-loai-E1-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.cg8_db
  verified_at: 2026-11-12T21:41:25Z
  carried_from_round: 2
  output: |
    carry-forward tu round 2 — delta khong cham paths cua eval

- eval: E2
  run_id: minted-can-gia-tot-cung-loai-E2-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.cg8_db
  verified_at: 2026-11-12T21:41:25Z
  carried_from_round: 2
  output: |
    carry-forward tu round 2 — delta khong cham paths cua eval

- eval: E3
  run_id: minted-can-gia-tot-cung-loai-E3-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.cg8_db
  verified_at: 2026-11-12T21:41:25Z
  carried_from_round: 2
  output: |
    carry-forward tu round 2 — delta khong cham paths cua eval

- eval: E4
  run_id: minted-can-gia-tot-cung-loai-E4-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.cg8_ham
  verified_at: 2026-11-12T21:41:25Z
  carried_from_round: 2
  output: |
    carry-forward tu round 2 — delta khong cham paths cua eval

- eval: E5
  run_id: minted-can-gia-tot-cung-loai-E5-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.cg8_db
  verified_at: 2026-11-12T21:41:25Z
  carried_from_round: 2
  output: |
    carry-forward tu round 2 — delta khong cham paths cua eval

- eval: E6
  run_id: minted-can-gia-tot-cung-loai-E6-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.cg8_db
  verified_at: 2026-11-12T21:41:25Z
  carried_from_round: 2
  output: |
    carry-forward tu round 2 — delta khong cham paths cua eval

- eval: E7
  run_id: minted-can-gia-tot-cung-loai-E7-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.cg8_do
  verified_at: 2026-11-12T21:41:25Z
  carried_from_round: 2
  output: |
    carry-forward tu round 2 — delta khong cham paths cua eval

- eval: E8
  run_id: E8-cg8-r3
  exit_code: 0
  baseline: n-a
  verifier: scripts/ui-capture.sh
  verified_at: 2026-11-13T01:10:40Z
  screenshot: evidence/E8-step1.png
  observed: |
    E8-step1.png (sáng 1280): trang «Căn hộ · 80 m² · Cầu Giấy», huy hiệu 4,2 tỷ / −32.5% / S05. Thẻ «Vì sao giá tốt»: «Rẻ hơn thước căn hộ cùng phường 25 tr/m², tức 32.5%, trên ngưỡng vào danh sách 5% và chưa tới ngưỡng cần xác minh 35%»; Giá/m² 53, Thước phường 78, Số tin dựng thước 49 tin S06, Mức giảm 32.5%. Khớp expected, không tràn.
    E8-step2.png (sáng): tiêu đề «Chưa rõ loại hình · 43 m² · 1PN», huy hiệu «Chưa tính được mức giảm»; banner «Đã rời danh sách — Chưa rõ loại hình — không so được với thước cùng loại»; thẻ không có số trung vị. Khớp, đọc rõ.
    E8-step3.png (tối): «Căn hộ · Đan Phượng», banner «Đã rời danh sách — Phường chưa đủ tin căn hộ để dựng thước»; chữ sáng trên nền tối đọc được, các thẻ không tràn khung. Khớp.
  network_observed: n-a (driver)

- eval: E9
  run_id: minted-can-gia-tot-cung-loai-E9-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.cg8_ranh_gioi
  verified_at: 2026-11-12T21:41:25Z
  carried_from_round: 2
  output: |
    carry-forward tu round 2 — delta khong cham paths cua eval

- eval: E10
  run_id: minted-can-gia-tot-cung-loai-E10-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.cg8_cloud_view
  verified_at: 2026-11-12T21:41:25Z
  carried_from_round: 2
  output: |
    carry-forward tu round 2 — delta khong cham paths cua eval

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-can-gia-tot-cung-loai-SUITE-npm_test__bb6271-r3
  exit_code: 0
  verified_at: 2026-11-13T01:10:40Z

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-can-gia-tot-cung-loai-SUITE-lint-r3
  exit_code: 0
  verified_at: 2026-11-13T01:10:40Z

- cmd: cd app && npm test
  run_id: minted-can-gia-tot-cung-loai-SUITE-npm_test__bd9a35-r3
  exit_code: 0
  verified_at: 2026-11-13T01:10:40Z

- cmd: cd pipeline && npm test
  run_id: minted-can-gia-tot-cung-loai-SUITE-npm_test__13563d-r3
  exit_code: 0
  verified_at: 2026-11-13T01:10:40Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-can-gia-tot-cung-loai-SUITE-test_lint_rules-r3
  exit_code: 0
  verified_at: 2026-11-13T01:10:40Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-can-gia-tot-cung-loai-SUITE-node_scripts_check_portal_compliance_mjs-r3
  exit_code: 0
  verified_at: 2026-11-13T01:10:40Z

## Known limits

## Ngoài hợp đồng

## Analyst

carried tu round 1 — baseline khong do lai round nay

Không có eval không-phân-biệt được liệt kê: [].

## Variance

none — every multi-run eval is uniform

## Iterations

Round 1: baseline đo lần cuối; evals.yaml không đổi từ đó.
Round 2: BLOCKED ở E8 — CSS chưa biên dịch trên bản chạy webpack. Returned to implementation.
Round 3: E8 chụp lại và đạt (dev server :3460, DB oneinvest_u1_cg8); E1-E7, E9, E10 carry-forward từ round 2; sáu lệnh suite đạt.

