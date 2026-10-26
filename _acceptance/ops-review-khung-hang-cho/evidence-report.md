---
schema_version: 2
feature_slug: ops-review-khung-hang-cho
verdict: REJECT
failed_evals: [E2, E6, E9, E10, E19]
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 08ad64dadfbd0830e1d4367868ecaf663e0d8f47
human_signoff:
---

# Evidence Report: ops-review-khung-hang-cho

Round 1. Lệnh fail không gắn riêng một eval: không có. Một lệnh duy nhất fail là `cd app && BASE_URL=${BASE_URL:-http://ui1.localhost:3460} node --import tsx ../scripts/smoke-review-queue.mjs`, bao E2, E6, E9, E10, E19; kết quả nằm trong khối của từng eval bên dưới.

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | test | PASS |
| E2 | AC-1 | script | FAIL |
| E3 | AC-2 | test | PASS |
| E4 | AC-3 | test | PASS |
| E5 | AC-4 | test | PASS |
| E6 | AC-4 | script | FAIL |
| E7 | AC-5 | test | PASS |
| E8 | AC-6 | test | PASS |
| E9 | AC-6 | script | FAIL |
| E10 | AC-7 | script | FAIL |
| E11 | AC-8 | test | PASS |
| E12 | AC-9 | test | PASS |
| E13 | AC-7 | ui-check | PASS |
| E14 | AC-10 | test | PASS |
| E15 | AC-9 | script | PASS |
| E16 | AC-10 | test | PASS |
| E17 | AC-10 | script | PASS |
| E18 | AC-10 | judgment | PASS (đề xuất của hội đồng, chờ người xác nhận) |
| E19 | AC-5 | script | FAIL |

## Evidence

- eval: E1
  run_id: minted-ops-review-khung-hang-cho-E1-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.test.app_ui
  verified_at: 2026-10-26T05:38:21Z
  output: |
    ℹ duration_ms 29466.575125
    __EXIT=0

- eval: E2
  run_id: minted-ops-review-khung-hang-cho-E2-r1
  exit_code: 1
  baseline: n-a
  verifier: config:executors.script.review_queue_smoke
  verified_at: 2026-10-26T05:38:21Z
  output: |
    ok   DB local có 11 thẻ chờ để đo
    ok   [desktop-1280] bảng hàng duyệt: 11 dòng chờ (DB: 11), cùng thứ tự mới nhất trước
    ok   [desktop-1280] đầu Frame «11 thẻ»
    ok   [desktop-1280] cột Thẻ · Loại · Trạng thái · Tạo lúc
    (các dòng ok của eval này đủ; cả lệnh smoke kết thúc với mã khác 0 vì một dòng vi phạm thuộc E19, xem khối E19)

- eval: E3
  run_id: minted-ops-review-khung-hang-cho-E3-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.test.app_ui
  verified_at: 2026-10-26T05:38:21Z
  output: |
    ℹ duration_ms 29466.575125
    __EXIT=0

- eval: E4
  run_id: minted-ops-review-khung-hang-cho-E4-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.test.app_ui
  verified_at: 2026-10-26T05:38:21Z
  output: |
    ℹ duration_ms 29466.575125
    __EXIT=0

- eval: E5
  run_id: minted-ops-review-khung-hang-cho-E5-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.test.app_ui
  verified_at: 2026-10-26T05:38:21Z
  output: |
    ℹ duration_ms 29466.575125
    __EXIT=0

- eval: E6
  run_id: minted-ops-review-khung-hang-cho-E6-r1
  exit_code: 1
  baseline: n-a
  verifier: config:executors.script.review_queue_smoke
  verified_at: 2026-10-26T05:38:21Z
  output: |
    ok   [desktop-1280] sheet thẻ 24: dải ảnh 1 ảnh = loadReviewMedia (1)
    ok   [desktop-1280] sheet thẻ 23 ... thẻ 14: dải ảnh 1 ảnh = loadReviewMedia (1) (mười thẻ còn lại cùng kết quả)
    ok   [desktop-1280] bảng: 0 <img>
    ok   [ops] sheet thẻ 24: 0 dải ảnh
    ok   dọn tài khoản thử: còn 0
    (các dòng ok của eval này đủ; cả lệnh smoke kết thúc với mã khác 0 vì một dòng vi phạm thuộc E19, xem khối E19)

- eval: E7
  run_id: minted-ops-review-khung-hang-cho-E7-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.test.app_ui
  verified_at: 2026-10-26T05:38:21Z
  output: |
    ℹ duration_ms 29466.575125
    __EXIT=0

- eval: E8
  run_id: minted-ops-review-khung-hang-cho-E8-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.test.app_ui
  verified_at: 2026-10-26T05:38:21Z
  output: |
    ℹ duration_ms 29466.575125
    __EXIT=0

- eval: E9
  run_id: minted-ops-review-khung-hang-cho-E9-r1
  exit_code: 1
  baseline: n-a
  verifier: config:executors.script.review_queue_smoke
  verified_at: 2026-10-26T05:38:21Z
  output: |
    ok   [desktop-1280] HTML + RSC của /ops/review không chứa khoá ai_confidence (DB có 16 thẻ mang ai_confidence)
    ok   [desktop-1280] 11 sheet đã mở: ngoài [data-review-quote] 0 chuỗi khớp /\d+\s*%/ hay «tự tin» (sạch 11)
    (các dòng ok của eval này đủ về mặt chuỗi; cả lệnh smoke kết thúc với mã khác 0 vì một dòng vi phạm thuộc E19. Phép đo dòng đầu chỉ dò TÊN khoá ai_confidence, xem review-findings.md)

- eval: E10
  run_id: minted-ops-review-khung-hang-cho-E10-r1
  exit_code: 1
  baseline: n-a
  verifier: config:executors.script.review_queue_smoke
  verified_at: 2026-10-26T05:38:21Z
  output: |
    ok   [mobile-390] trang không cuộn ngang (scrollWidth 390 = clientWidth 390)
    ok   [mobile-390] bảng cuộn trong Frame (vùng lưới scrollWidth 485 ≥ clientWidth 316)
    ok   [mobile-390] sheet rộng 390 = viewport 390 ± 1
    ok   [mobile-390] Tin A nằm trên Tin B (476 ≤ 512)
    ok   [mobile-390] sheet không cuộn ngang (389 = 389)
    ok   [mobile-390] sheet thẻ 24: ảnh 1 của Tin B trong khung nhìn sau khi cuộn tới, đáy ảnh ≤ đỉnh chân sheet, bấm → hộp phóng to mở
    (các dòng ok của eval này đủ; cả lệnh smoke kết thúc với mã khác 0 vì một dòng vi phạm thuộc E19, xem khối E19)

- eval: E11
  run_id: minted-ops-review-khung-hang-cho-E11-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.test.app_ui
  verified_at: 2026-10-26T05:38:21Z
  output: |
    ℹ duration_ms 29466.575125
    __EXIT=0

- eval: E12
  run_id: minted-ops-review-khung-hang-cho-E12-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.test.app_ui
  verified_at: 2026-10-26T05:38:21Z
  output: |
    ℹ duration_ms 29466.575125
    __EXIT=0

- eval: E13
  run_id: minted-ops-review-khung-hang-cho-E13-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.design.ui_check
  verified_at: 2026-10-26T05:38:21Z
  screenshot: evidence/E13-step1.png   # khung đầu; còn E13-step2..step6 và E13-step4-table-dark
  observed: |
    step1 (1280 sáng, /ops/review): tiêu đề "Hàng duyệt"; Frame "Danh sách thẻ" đọc "11 thẻ", bộ lọc "Mọi loại" và "Chờ duyệt"; cột Thẻ, Loại, Trạng thái, Tạo lúc; 11 dòng (#24 xuống #14), mỗi dòng badge "Ghép căn" màu tím và "Chờ duyệt" màu hổ phách, tách màu rõ, không có "%" hay "tự tin".
    step2 (lọc Ghép căn): vẫn 11 dòng, đúng vì cả 11 thẻ chờ đều là ghép căn. step3 (sheet #24, 1280): sheet chiếm bên phải 672 px; đầu có tên thẻ, "#24 · 2026-10-22 15:59 (GMT+7)", hai badge, nút đóng; thân có chip "AI: chưa chắc" và "Điểm B: 0.908", Tin A (S05) và Tin B (S06) cạnh nhau với Giá, Diện tích, Giá/m², Phường, Loại, Địa chỉ; Tin A "không có ảnh", Tin B một ảnh dọc cắt vuông không méo; chân có Cùng căn, Khác căn, Không chắc, tách khỏi thân bằng đường kẻ.
    step4 (1280 tối, thẻ Bổ sung tin #162 đã Từ chối): nền tối chữ sáng đọc được; badge "Bổ sung tin" xám và "Từ chối" đỏ; thân có nguyên văn tin, "Tin: không có ảnh", WC 10, Đường Bạch Đằng; chân chỉ có "Đã bỏ", không nút quyết định. Khung phụ E13-step4-table-dark cho thấy bảng tối đọc được, bốn loại badge khác màu.
    step5 (390 sáng): bảng cuộn ngang trong Frame, cột "Loại" bị cắt ở mép, trang không cuộn ngang. step6 (390, sheet #24 cuộn tới ảnh): sheet đầy 390 px, Tin A xếp trên Tin B, dải ảnh một ô vuông không méo, chân cố định có ba nút; biểu tượng "N" của Next.js dev đè lên nút Cùng căn (chỉ có ở dev); scrollWidth bằng clientWidth bằng 390. Khớp expected.
  network_observed: no-app-traffic

- eval: E14
  run_id: minted-ops-review-khung-hang-cho-E14-r1
  exit_code: 0
  baseline: red
  verifier: config:executors.test.app
  verified_at: 2026-10-26T05:38:21Z
  output: |
    tsc --noEmit và eslint không in lỗi
    __EXIT=0

- eval: E15
  run_id: minted-ops-review-khung-hang-cho-E15-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.script.review_media_no_cloud
  verified_at: 2026-10-26T05:38:21Z
  output: |
    LOCAL-ONLY PASS
    __EXIT=0

- eval: E16
  run_id: minted-ops-review-khung-hang-cho-E16-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.test.ui_routes_map
  verified_at: 2026-10-26T05:38:21Z
  output: |
    ℹ duration_ms 54.757459
    __EXIT=0

- eval: E17
  run_id: design-gate-8d3788f952
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.review_queue_design_gate
  verified_at: 2026-10-26T05:38:21Z
  output: |
    design gate chạy trên app/src/components/ops/review/review-queue.tsx, không P0
    __EXIT=0

- eval: E18
  judged_by: hội đồng 3 lens (fresh context): domain-correctness, operational-feasibility, spec-alignment
  verdict: PASS
  rationale: Cả ba lens thấy routes.md, catalog.md và spec nói nhất quán về `solution-agents-5` đã dựng khung (Frame, data-grid lọc theo loại thẻ và trạng thái, Sheet chi tiết trong `components/ops/review/`), dải ảnh `c-attachment-3` nằm trong sheet, không hiện độ tự tin (Q9), lọc theo bậc thuộc PL23. Không còn chữ «(chờ)» hay «vòng sau» gắn với `solution-agents-5`.
  votes:
    - domain-correctness: PASS — routes.md dòng `/ops/review` và catalog.md hai dòng `solution-agents-5`, `c-attachment-3` khớp spec; spec ghi bỏ lọc theo bậc (dời sang PL23) và không hiện độ tự tin.
    - operational-feasibility: PASS — không còn «lọc theo loại thẻ + độ tin»; các lần nhắc «độ tin» đều là phủ định hoặc trích lại thước cũ để lật.
    - spec-alignment: PASS — dòng 85-86 catalog.md, routes.md và các mục «Đã loại», 4, 5 của spec nói cùng ý; chữ «chờ (B5…)» trong routes.md chỉ nói về `/ops/deals`.
  human_override:  # chi nguoi ghi

- eval: E19
  run_id: minted-ops-review-khung-hang-cho-E19-r1
  exit_code: 1
  baseline: n-a
  verifier: config:executors.script.review_queue_smoke
  verified_at: 2026-10-26T05:38:21Z
  output: |
    FAIL [desktop-1280] có thẻ chờ cả hai loại để bấm (ghép căn 24, bổ sung tin —)
    ok   [desktop-1280] Cùng căn → POST /api/v1/ops/review/24/decide {"status":"approved"}
    ok   [desktop-1280] Khác căn → POST /api/v1/ops/review/24/decide {"status":"rejected"}
    ok   [desktop-1280] Không chắc → POST /api/v1/ops/review/24/decide {"status":"deferred"}
    ok   [desktop-1280] lỗi route: dòng «Lỗi: đã quyết» trong sheet, nút còn bấm được
    ok   DB không đổi: review_queue 16=16 (đã quyết 5=5), sale_offers 18769=18769
    review-queue smoke: 1 vi phạm

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-ops-review-khung-hang-cho-SUITE-npm_test__bb6271-r1
  exit_code: 0
  verified_at: 2026-10-26T05:38:21Z

- cmd: cd pipeline && npm test
  run_id: minted-ops-review-khung-hang-cho-SUITE-npm_test__13563d-r1
  exit_code: 0
  verified_at: 2026-10-26T05:38:21Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-ops-review-khung-hang-cho-SUITE-test_lint_rules-r1
  exit_code: 0
  verified_at: 2026-10-26T05:38:21Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-ops-review-khung-hang-cho-SUITE-node_scripts_check_portal_compliance_mjs-r1
  exit_code: 0
  verified_at: 2026-10-26T05:38:21Z

## Known limits

## Ngoài hợp đồng

## Analyst

Eval không-phân-biệt (xanh ở cả HEAD lẫn baseline, chứng minh khung đo chứ chưa chứng minh tính năng; nên viết lại để assert hành vi mới hoặc xác nhận là regression-guard có chủ ý):
- E1, E3, E4, E5, E7, E8, E11, E12 (lệnh `cd app && npm test`)
- E15 (lệnh `node scripts/check-review-media-local-only.mjs`)
- E16 (lệnh `cd app && node --test eslint-plugin-onehub-ui/tests/routes-map.test.mjs`)

Nguyên nhân round này: cả năm eval E2, E6, E9, E10, E19 cùng một lệnh smoke nên máy ghi cùng kết quả. Dòng vi phạm duy nhất là `FAIL [desktop-1280] có thẻ chờ cả hai loại để bấm (ghép căn 24, bổ sung tin —)`: DB local hiện có 11 thẻ chờ đều là ghép căn, không có thẻ bổ sung tin chờ, nên ma trận ba nút «Áp dụng» / «Bỏ» / «Để sau» của sheet bổ sung tin (vế của E19) chưa được đo. Các dòng ok của E2, E6, E9, E10 đủ như expected nhưng mã thoát của lệnh khác 0 nên chúng vẫn nằm trong failed_evals. Riêng dòng ok của E9 chỉ dò tên khoá `ai_confidence`; ba finding trong hợp đồng của AC-6 (xem review-findings.md) nói giá trị này còn tới trình duyệt qua `evidence.fields[].confidence`.

### Baseline khong do

- cd app && BASE_URL=${BASE_URL:-http://ui1.localhost:3460} node --import tsx ../scripts/smoke-review-queue.mjs: bo qua baseline: tep scripts/smoke-review-queue.mjs co o cay dang kiem nhung chua co o merge-base 85072b33773e8aa677ea04a9da2ade36063e7d06 — eval moi, chay tren code cu khong phan biet gi
- node /Users/manhphan/.claude/plugins/cache/acceptance-gate-kit/acceptance-gate/2.32.0/scripts/design-gate.mjs --jsdom app app/src/components/ops/review/review-queue.tsx: bo qua baseline: tep app/src/components/ops/review/review-queue.tsx co o cay dang kiem nhung chua co o merge-base 85072b33773e8aa677ea04a9da2ade36063e7d06 — eval moi, chay tren code cu khong phan biet gi

## Variance

none — every multi-run eval is uniform

## Iterations

Round 1: E2, E6, E9, E10, E19 failed — một lệnh smoke dùng chung kết thúc với mã khác 0 vì DB local không có thẻ bổ sung tin chờ để đo ma trận nút của sheet bổ sung tin (E19); ngoài ra ba finding trong hợp đồng (AC-6) cho rằng giá trị ai_confidence vẫn tới trình duyệt qua evidence.fields. Returned to implementation.
