---
schema_version: 2
feature_slug: ops-review-khung-hang-cho
verdict: PASS
failed_evals: []
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 2088f2966c1f86dd843d8843ab7d51729711065c
human_signoff: Mạnh 2026-10-26
---

# Evidence Report: ops-review-khung-hang-cho

Round 3. Mọi eval có đo trong lượt này đều xanh trên commit đã ghim (sau bản vá S4-r2 lối 2: gọt «tự tin NN%» khỏi căn cứ của LLM ở `toReviewItem`, đo theo giá trị). E15, E16, E17 là carry-forward từ round 1 (delta không chạm paths của chúng); E18 giữ panel của round 2. Lệnh fail không gắn eval: không có. Mốc `verified_at` của lượt này chỉ có ngày (payload máy không mang giờ).

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | test | PASS |
| E2 | AC-1 | script | PASS |
| E3 | AC-2 | test | PASS |
| E4 | AC-3 | test | PASS |
| E5 | AC-4 | test | PASS |
| E6 | AC-4 | script | PASS |
| E7 | AC-5 | test | PASS |
| E8 | AC-6 | test | PASS |
| E9 | AC-6 | script | PASS |
| E10 | AC-7 | script | PASS |
| E11 | AC-8 | test | PASS |
| E12 | AC-9 | test | PASS |
| E13 | AC-7 | ui-check | PASS |
| E14 | AC-10 | test | PASS |
| E15 | AC-9 | script | PASS (carry-forward từ round 1) |
| E16 | AC-10 | test | PASS (carry-forward từ round 1) |
| E17 | AC-10 | script | PASS (carry-forward từ round 1) |
| E18 | AC-10 | judgment | PASS (đề xuất của hội đồng, panel giữ nguyên từ round 2, chờ người xác nhận) |
| E19 | AC-5 | script | PASS |

## Evidence

- eval: E1
  run_id: minted-ops-review-khung-hang-cho-E1-r3
  exit_code: 0
  baseline: green
  verifier: config:executors.test.app_ui
  verified_at: 2026-10-26T07:26:28Z
  output: |
    ℹ duration_ms 34078.990083

- eval: E2
  run_id: rqsmokef0e9a37c
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.review_queue_smoke
  verified_at: 2026-10-26T07:26:28Z
  output: |
    SMOKE PASS (rqsmokef0e9a37c)

- eval: E3
  run_id: minted-ops-review-khung-hang-cho-E3-r3
  exit_code: 0
  baseline: green
  verifier: config:executors.test.app_ui
  verified_at: 2026-10-26T07:26:28Z
  output: |
    ℹ duration_ms 34078.990083

- eval: E4
  run_id: minted-ops-review-khung-hang-cho-E4-r3
  exit_code: 0
  baseline: green
  verifier: config:executors.test.app_ui
  verified_at: 2026-10-26T07:26:28Z
  output: |
    ℹ duration_ms 34078.990083

- eval: E5
  run_id: minted-ops-review-khung-hang-cho-E5-r3
  exit_code: 0
  baseline: green
  verifier: config:executors.test.app_ui
  verified_at: 2026-10-26T07:26:28Z
  output: |
    ℹ duration_ms 34078.990083

- eval: E6
  run_id: rqsmokef0e9a37c
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.review_queue_smoke
  verified_at: 2026-10-26T07:26:28Z
  output: |
    SMOKE PASS (rqsmokef0e9a37c)

- eval: E7
  run_id: minted-ops-review-khung-hang-cho-E7-r3
  exit_code: 0
  baseline: green
  verifier: config:executors.test.app_ui
  verified_at: 2026-10-26T07:26:28Z
  output: |
    ℹ duration_ms 34078.990083

- eval: E8
  run_id: minted-ops-review-khung-hang-cho-E8-r3
  exit_code: 0
  baseline: green
  verifier: config:executors.test.app_ui
  verified_at: 2026-10-26T07:26:28Z
  output: |
    ℹ duration_ms 34078.990083

- eval: E9
  run_id: rqsmokef0e9a37c
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.review_queue_smoke
  verified_at: 2026-10-26T07:26:28Z
  output: |
    SMOKE PASS (rqsmokef0e9a37c)

- eval: E10
  run_id: rqsmokef0e9a37c
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.review_queue_smoke
  verified_at: 2026-10-26T07:26:28Z
  output: |
    SMOKE PASS (rqsmokef0e9a37c)

- eval: E11
  run_id: minted-ops-review-khung-hang-cho-E11-r3
  exit_code: 0
  baseline: green
  verifier: config:executors.test.app_ui
  verified_at: 2026-10-26T07:26:28Z
  output: |
    ℹ duration_ms 34078.990083

- eval: E12
  run_id: minted-ops-review-khung-hang-cho-E12-r3
  exit_code: 0
  baseline: green
  verifier: config:executors.test.app_ui
  verified_at: 2026-10-26T07:26:28Z
  output: |
    ℹ duration_ms 34078.990083

- eval: E13
  run_id: e13-verify-u1-20261026
  exit_code: 0
  baseline: n-a
  verifier: config:executors.design.ui_check
  verified_at: 2026-10-26T07:26:28Z
  screenshot: evidence/E13-step1.png
  observed: |
    Đã mở từng file frame bằng Read.
    - step1 (1280 sáng): trang «Hàng duyệt», khung «Danh sách thẻ — 11 thẻ», bộ lọc «Mọi loại» và «Chờ duyệt». Bảng có 4 cột Thẻ/Loại/Trạng thái/Tạo lúc, chữ rõ. Badge «Ghép căn» màu tím, «Chờ duyệt» màu vàng cam, hai màu tách rõ. Không có chữ «tự tin» hay «%».
    - step2: bộ lọc đổi thành «Ghép căn», vẫn 11 hàng, bố cục như step1.
    - step3: sheet bên phải. Đầu sheet gồm tên thẻ «Cùng căn? binh-thanh 52m² ↔ 60m²», dòng «#24 · 2026-10-22 15:59», badge «Ghép căn», «Chờ duyệt» và nút X, có đường kẻ ngăn với thân. Thân có «AI: chưa chắc», «Điểm B: 0.908», đoạn lý do (có 5.3%, 15%, 15.4%, 10% nằm trong lời máy), hai thẻ Tin A (S05) và Tin B (S06) đặt cạnh nhau. Dải ảnh là 1 ô ảnh vuông bo góc dưới Tin B, ảnh nhà không méo. Tin A ghi «không có ảnh». Chân sheet có đường kẻ riêng với 3 nút «Cùng căn / Khác căn / Không chắc». Không có «tự tin».
    - step4 (1280 tối): nền đen, sheet «Bổ sung dữ liệu: offer_c5ac… (2 trường)». Badge «Bổ sung tin» xám và «Từ chối» đỏ nền tối đọc rõ. Thân có đoạn tin, «Tin: không có ảnh», cặp WC 10 và Đường Bạch Đằng. Chân sheet có badge «Đã bỏ». Chữ sáng trên nền tối, không có % hay «tự tin».
    - step4-table-dark: bảng 4 thẻ Bổ sung tin tối màu, cột Loại/Trạng thái đọc rõ, badge xám và đỏ tách nhau.
    - step5 (390 sáng): bố cục di động. Bảng nằm trong Frame và cuộn ngang trong khung (cột Loại bị cắt trong khung). Dưới tên thẻ có #24 cùng badge «Ghép căn» và «Chờ duyệt» tách màu. Trang không bị tràn ngang.
    - step6 (390, sheet đã cuộn): đầu sheet cố định (tên thẻ, #24, hai badge, nút X). Tin A rồi Tin B xếp dọc, mỗi thẻ rộng gần hết bề ngang. Ô ảnh Tin B nằm cuối thân sheet, trong sheet, không méo. Chân sheet cố định với 3 nút quyết định, chỉ báo «N» của Next dev đè nhẹ lên nút đầu. Không có «tự tin»; % chỉ có ở đoạn lý do của máy, không nằm trong khung chụp này.
    Đối chiếu Expected: khớp toàn bộ.
  network_observed: clean

- eval: E14
  run_id: minted-ops-review-khung-hang-cho-E14-r3
  exit_code: 0
  baseline: red
  verifier: config:executors.test.app
  verified_at: 2026-10-26T07:26:28Z
  output: |
    tsc --noEmit sạch; eslint và check-bare-disables không báo lỗi (đuôi log rỗng, lệnh kết thúc thành công)

- eval: E15
  run_id: minted-ops-review-khung-hang-cho-E15-r1
  exit_code: 0
  verifier: config:executors.script.review_media_no_cloud
  verified_at: 2026-10-26T05:38:21Z
  carried_from_round: 1
  output: |
    carry-forward từ round 1 — delta không chạm paths của eval

- eval: E16
  run_id: minted-ops-review-khung-hang-cho-E16-r1
  exit_code: 0
  verifier: config:executors.test.ui_routes_map
  verified_at: 2026-10-26T05:38:21Z
  carried_from_round: 1
  output: |
    carry-forward từ round 1 — delta không chạm paths của eval

- eval: E17
  run_id: design-gate-8d3788f952
  exit_code: 0
  verifier: config:executors.script.review_queue_design_gate
  verified_at: 2026-10-26T05:38:21Z
  carried_from_round: 1
  output: |
    carry-forward từ round 1 — delta không chạm paths của eval

- eval: E18
  judged_by: hội đồng 3 lens (fresh context): domain-correctness, operational-feasibility, spec-alignment
  verdict: PASS
  rationale: panel giữ nguyên từ round 2 — inputs không đổi, không chấm lại; rationale xem round 2.
  votes:
    - domain-correctness: PASS (r2)
    - operational-feasibility: PASS (r2)
    - spec-alignment: PASS (r2)
  human_override:  # chi nguoi ghi

- eval: E19
  run_id: rqsmokef0e9a37c
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.review_queue_smoke
  verified_at: 2026-10-26T07:26:28Z
  output: |
    SMOKE PASS (rqsmokef0e9a37c)

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-ops-review-khung-hang-cho-SUITE-npm_test__bb6271-r3
  exit_code: 0
  verified_at: 2026-10-26T07:26:28Z

- cmd: cd pipeline && npm test
  run_id: minted-ops-review-khung-hang-cho-SUITE-npm_test__13563d-r3
  exit_code: 0
  verified_at: 2026-10-26T07:26:28Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-ops-review-khung-hang-cho-SUITE-test_lint_rules-r3
  exit_code: 0
  verified_at: 2026-10-26T07:26:28Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-ops-review-khung-hang-cho-SUITE-node_scripts_check_portal_compliance_mjs-r3
  exit_code: 0
  verified_at: 2026-10-26T07:26:28Z

## Known limits

## Ngoài hợp đồng

## Analyst

Eval không phân biệt (xanh cả trên HEAD lẫn baseline, chứng minh harness chứ không phải tính năng; nên viết lại để assert hành vi mới hoặc xác nhận là regression-guard có chủ ý):

- cd app && npm test: E1, E3, E4, E5, E7, E8, E11, E12

### Baseline khong do

- cd app && BASE_URL=${BASE_URL:-http://ui1.localhost:3460} node --import tsx ../scripts/smoke-review-queue.mjs: bo qua baseline: tep scripts/smoke-review-queue.mjs co o cay dang kiem nhung chua co o merge-base 85072b33773e8aa677ea04a9da2ade36063e7d06 — eval moi, chay tren code cu khong phan biet gi

## Variance

none — every multi-run eval is uniform

## Iterations

Round 1: E2, E6, E9, E10, E19 failed — một lệnh smoke dùng chung bị đỏ vì DB local không có thẻ bổ sung tin chờ để đo ma trận nút của sheet bổ sung tin (E19); ngoài ra ba finding trong hợp đồng (AC-6) cho rằng giá trị độ tự tin vẫn tới trình duyệt qua evidence.fields. Returned to implementation.
Round 2: BLOCKED vì DB local :5433 không chạy (app test, smoke, agent/pipeline test, E13 không đo được); ba finding AC-6 còn lại (độ tự tin lọt qua `basis`). Returned to implementation (S4-r2).
Round 3: toàn bộ eval đo được đều xanh trên commit 2088f296 (smoke, app test, tsc + lint, E13 bốn khung sáng/tối/di động); E15, E16, E17 carry-forward từ round 1, E18 giữ panel round 2. Chờ người ký ở Cổng 2.
