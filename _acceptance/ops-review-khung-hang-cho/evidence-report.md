---
schema_version: 2
feature_slug: ops-review-khung-hang-cho
verdict: BLOCKED
failed_evals: ["E1","E3","E4","E5","E7","E8","E11","E12"]
reason: |
  Máy không đo được trọn vẹn vì DB local PostGIS :5433 không chạy (colima không chạy, docker.sock không có), nên kết quả không phải PASS/FAIL thật của tính năng ở các lệnh dưới đây:
  - cd app && BASE_URL=${BASE_URL:-http://ui1.localhost:3460} node --import tsx ../scripts/smoke-review-queue.mjs: chạy xong nhưng smoke không kết nối được DB local (ECONNREFUSED tới ::1:5433 và 127.0.0.1:5433 trong taoTheThu, dòng 127). Cần khởi động DB (docker compose -f db/docker-compose.yml up -d) rồi chạy lại lệnh đã ghim.
  - cd agent && npm test: chạy xong, không bị công cụ giết; test cần DB (tests/enrich-revert.test.ts AC-2, AC-10) lỗi ECONNREFUSED ::1:5433 và 127.0.0.1:5433. Cần bật DB rồi chạy lại.
  - cd pipeline && npm test: chạy xong, không bị công cụ giết; test cần DB (scripts/write-offers.test.mjs:307 và :316) lỗi ECONNREFUSED ::1:5433 và 127.0.0.1:5433. Lỗi do môi trường, không phải kết quả logic. Cần bật DB rồi chạy lại.
  - ui-check:E13: máy chủ dev :3460 có chạy nhưng Postgres local :5433 tắt (colima không chạy, cổng 5433 đóng). /ops/review bắt buộc đăng nhập mà phiên lưu ở DB nên không đăng nhập được bằng tài khoản thử và không chụp được bước nào. Không tự bật colima/DB vì đó là hạ tầng dùng chung của máy. Chạy lại: colima start, docker compose -f db/docker-compose.yml up -d, node scripts/dev-ops-account.mjs, rồi chạy lại E13.
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 02c3ef65f4cce9619ce68b7490b0bd32ac4af57a
human_signoff:
---

# Evidence Report: ops-review-khung-hang-cho

Round 2. Lệnh fail có gắn eval: `cd app && npm test` bao E1, E3, E4, E5, E7, E8, E11, E12 (0 trên 1 lần chạy). Phần đuôi log của lệnh này chỉ còn thấy ca của `tests/ty-le-listing-gop.test.tsx` lỗi ECONNREFUSED tới DB :5433, nên chưa rõ các ca RQ-AC của chính tính năng đỏ hay xanh khi DB chạy; cần chạy lại sau khi bật DB. Lệnh fail không gắn eval: không có. Các mốc `verified_at` của lượt round 2 chưa có trong payload máy nên không điền (không bịa); mã run_id của lượt này sẽ được đối chiếu với run-log.jsonl.

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | test | FAIL |
| E2 | AC-1 | script | BLOCKED |
| E3 | AC-2 | test | FAIL |
| E4 | AC-3 | test | FAIL |
| E5 | AC-4 | test | FAIL |
| E6 | AC-4 | script | BLOCKED |
| E7 | AC-5 | test | FAIL |
| E8 | AC-6 | test | FAIL |
| E9 | AC-6 | script | BLOCKED |
| E10 | AC-7 | script | BLOCKED |
| E11 | AC-8 | test | FAIL |
| E12 | AC-9 | test | FAIL |
| E13 | AC-7 | ui-check | BLOCKED |
| E14 | AC-10 | test | PASS |
| E15 | AC-9 | script | PASS (carry-forward từ round 1) |
| E16 | AC-10 | test | PASS (carry-forward từ round 1) |
| E17 | AC-10 | script | PASS (carry-forward từ round 1) |
| E18 | AC-10 | judgment | PASS (đề xuất của hội đồng, chờ người xác nhận) |
| E19 | AC-5 | script | BLOCKED |

## Evidence

- eval: E1
  run_id: minted-ops-review-khung-hang-cho-E1-r2
  exit_code: 1
  baseline: red
  verifier: config:executors.test.app_ui
  output: |
    test at tests/ty-le-listing-gop.test.tsx: ca "TL-AC-2/3/4/5 thẻ và bảng Độ phủ trên fixture" lỗi AggregateError [ECONNREFUSED] tới ::1:5433 và 127.0.0.1:5433
    ca "TL-AC-6 câu chú thích của thẻ khu vực gộp" lỗi AssertionError: ca TL-AC-2/3/4/5 phải chạy trước
    (đuôi log của cả lệnh app_ui; DB local :5433 không chạy)

- eval: E2
  run_id: minted-ops-review-khung-hang-cho-E2-r2
  exit_code: 1
  baseline: n-a
  verifier: config:executors.script.review_queue_smoke
  output: |
    AggregateError [ECONNREFUSED]
    at async taoTheThu (scripts/smoke-review-queue.mjs:127:20)
    Error: connect ECONNREFUSED ::1:5433
    Error: connect ECONNREFUSED 127.0.0.1:5433
    (smoke dừng trước khi đo; không có dòng ok/FAIL nào của eval)

- eval: E3
  run_id: minted-ops-review-khung-hang-cho-E3-r2
  exit_code: 1
  baseline: red
  verifier: config:executors.test.app_ui
  output: |
    cùng lệnh app_ui với E1: lệnh kết thúc với mã khác 0, đuôi log là ca TL-AC của ty-le-listing-gop lỗi ECONNREFUSED ::1:5433 và 127.0.0.1:5433

- eval: E4
  run_id: minted-ops-review-khung-hang-cho-E4-r2
  exit_code: 1
  baseline: red
  verifier: config:executors.test.app_ui
  output: |
    cùng lệnh app_ui với E1: lệnh kết thúc với mã khác 0, đuôi log là ca TL-AC của ty-le-listing-gop lỗi ECONNREFUSED ::1:5433 và 127.0.0.1:5433

- eval: E5
  run_id: minted-ops-review-khung-hang-cho-E5-r2
  exit_code: 1
  baseline: red
  verifier: config:executors.test.app_ui
  output: |
    cùng lệnh app_ui với E1: lệnh kết thúc với mã khác 0, đuôi log là ca TL-AC của ty-le-listing-gop lỗi ECONNREFUSED ::1:5433 và 127.0.0.1:5433

- eval: E6
  run_id: minted-ops-review-khung-hang-cho-E6-r2
  exit_code: 1
  baseline: n-a
  verifier: config:executors.script.review_queue_smoke
  output: |
    cùng lệnh smoke với E2: AggregateError [ECONNREFUSED] tại taoTheThu (scripts/smoke-review-queue.mjs:127), DB :5433 không chạy; không có dòng đo nào

- eval: E7
  run_id: minted-ops-review-khung-hang-cho-E7-r2
  exit_code: 1
  baseline: red
  verifier: config:executors.test.app_ui
  output: |
    cùng lệnh app_ui với E1: lệnh kết thúc với mã khác 0, đuôi log là ca TL-AC của ty-le-listing-gop lỗi ECONNREFUSED ::1:5433 và 127.0.0.1:5433

- eval: E8
  run_id: minted-ops-review-khung-hang-cho-E8-r2
  exit_code: 1
  baseline: red
  verifier: config:executors.test.app_ui
  output: |
    cùng lệnh app_ui với E1: lệnh kết thúc với mã khác 0, đuôi log là ca TL-AC của ty-le-listing-gop lỗi ECONNREFUSED ::1:5433 và 127.0.0.1:5433

- eval: E9
  run_id: minted-ops-review-khung-hang-cho-E9-r2
  exit_code: 1
  baseline: n-a
  verifier: config:executors.script.review_queue_smoke
  output: |
    cùng lệnh smoke với E2: AggregateError [ECONNREFUSED] tại taoTheThu (scripts/smoke-review-queue.mjs:127), DB :5433 không chạy; không có dòng đo nào

- eval: E10
  run_id: minted-ops-review-khung-hang-cho-E10-r2
  exit_code: 1
  baseline: n-a
  verifier: config:executors.script.review_queue_smoke
  output: |
    cùng lệnh smoke với E2: AggregateError [ECONNREFUSED] tại taoTheThu (scripts/smoke-review-queue.mjs:127), DB :5433 không chạy; không có dòng đo nào

- eval: E11
  run_id: minted-ops-review-khung-hang-cho-E11-r2
  exit_code: 1
  baseline: red
  verifier: config:executors.test.app_ui
  output: |
    cùng lệnh app_ui với E1: lệnh kết thúc với mã khác 0, đuôi log là ca TL-AC của ty-le-listing-gop lỗi ECONNREFUSED ::1:5433 và 127.0.0.1:5433

- eval: E12
  run_id: minted-ops-review-khung-hang-cho-E12-r2
  exit_code: 1
  baseline: red
  verifier: config:executors.test.app_ui
  output: |
    cùng lệnh app_ui với E1: lệnh kết thúc với mã khác 0, đuôi log là ca TL-AC của ty-le-listing-gop lỗi ECONNREFUSED ::1:5433 và 127.0.0.1:5433

- eval: E13
  run_id: minted-ops-review-khung-hang-cho-E13-r2
  exit_code: 1
  baseline: n-a
  verifier: config:executors.design.ui_check
  network_observed: n-a (tool-error: không đăng nhập được vì DB :5433 tắt; chỉ thấy trang /login lỗi máy chủ và asset tĩnh, chưa có traffic /ops/review)
  output: |
    Không chụp được khung nào ở round 2, nên khối này không có khung và không có mô tả nhìn thấy.
    1. Máy chủ dev :3460: có chạy; /ops/review chuyển hướng về /login (đạt). /login trả trang bình thường khi không mang cookie phiên.
    2. Tài khoản thử: tệp .claude/ops-test-account.json có đủ email, mật khẩu, loginUrl (mật khẩu không đọc ra).
    3. Trình duyệt thật: goto /login hết thời gian chờ, document.readyState kẹt ở "loading"; Browser pane thấy màn hình tối trống và lỗi máy chủ ở /login.
    4. Nguyên nhân: tra phiên cần DB; cổng 5433 đóng, colima không chạy, docker.sock không có.
    5. Các bước chụp 1280 sáng, 1280 tối, 390 sáng và đo scrollWidth/clientWidth không chạy được.
    Lưu ý: các tệp evidence/E13-step1..6.png, E13-step4-table-dark.png và E13-network.txt đang có trên đĩa là của round 1 (12:40-12:42), không phải bằng chứng của lượt chấm này và không được dùng làm bằng chứng cho round 2.

- eval: E14
  run_id: minted-ops-review-khung-hang-cho-E14-r2
  exit_code: 0
  baseline: red
  verifier: config:executors.test.app
  output: |
    tsc --noEmit và eslint không in lỗi

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
  rationale: Cả ba lens thấy routes.md, catalog.md và spec nói nhất quán về `solution-agents-5` đã dựng khung (Frame, data-grid lọc theo loại thẻ và trạng thái, Sheet chi tiết trong `components/ops/review/`), dải ảnh `c-attachment-3` nằm trong sheet, không hiện độ tự tin (Q9), lọc theo bậc thuộc PL23. Không còn chữ «(chờ)» hay «vòng sau» gắn với `solution-agents-5`; cụm «theo độ tin» chỉ còn ở dạng bị bỏ hoặc trích lại.
  votes:
    - domain-correctness: PASS — routes.md dòng 58 và catalog.md dòng 85-86 khớp nhau và khớp spec: Frame + data-grid lọc theo loại thẻ và trạng thái, sheet ở `components/ops/review/`, dải ảnh `c-attachment-3` nằm trong sheet, không hiện độ tự tin (Q9), lọc theo bậc thuộc PL23.
    - operational-feasibility: PASS — ba tệp và spec (dòng 46, 105, 114) nói cùng một ý; không có «(chờ)» hay «vòng sau» cho `solution-agents-5`, không có «lọc theo loại thẻ + độ tin»; lần nhắc «theo độ tin» duy nhất trong spec là câu trích «bỏ "theo độ tin"».
    - spec-alignment: PASS — routes.md dòng 58, catalog.md dòng 85-86 và spec (loại phương án «Lọc theo bậc căn cứ» vì thuộc PL23, cấm hiện độ tự tin) nhất quán; «theo độ tin» chỉ xuất hiện khi trích BOI-CANH là thứ bị bỏ.
  human_override:  # chi nguoi ghi

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-ops-review-khung-hang-cho-SUITE-npm_test__bb6271-r2
  exit_code: 1

- cmd: cd pipeline && npm test
  run_id: minted-ops-review-khung-hang-cho-SUITE-npm_test__13563d-r2
  exit_code: 1

- cmd: cd app && npm run test:lint-rules
  run_id: minted-ops-review-khung-hang-cho-SUITE-test_lint_rules-r2
  exit_code: 0

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-ops-review-khung-hang-cho-SUITE-node_scripts_check_portal_compliance_mjs-r2
  exit_code: 0

- eval: E19
  run_id: minted-ops-review-khung-hang-cho-E19-r2
  exit_code: 1
  baseline: n-a
  verifier: config:executors.script.review_queue_smoke
  output: |
    cùng lệnh smoke với E2: AggregateError [ECONNREFUSED] tại taoTheThu (scripts/smoke-review-queue.mjs:127), DB :5433 không chạy; chưa có ma trận nút nào được đo

## Known limits

## Ngoài hợp đồng

## Analyst

none — mọi eval tính năng có đo baseline đều red trên baseline (có phân biệt); E2, E6, E9, E10, E13, E19 không có baseline đo được.

Nguyên nhân round này: toàn bộ DB local PostGIS :5433 đang tắt (colima không chạy). Hệ quả: smoke (E2, E6, E9, E10, E19), ui-check E13 và hai lệnh suite `cd agent && npm test`, `cd pipeline && npm test` không đo được; lệnh `cd app && npm test` (E1, E3, E4, E5, E7, E8, E11, E12) kết thúc với mã khác 0 mà đuôi log thấy được cũng là lỗi kết nối DB, nên chưa tách được ca nào là lỗi của chính tính năng. Cần bật DB (colima start; docker compose -f db/docker-compose.yml up -d; node scripts/dev-ops-account.mjs) rồi chạy lại verify.

Ba finding trong hợp đồng của AC-6 (xem review-findings.md) cho rằng giá trị độ tự tin vẫn tới trình duyệt qua `evidence.fields[].basis` («tự tin 82%»), và các phép đo E8, E9 chỉ dò tên khoá; đây là lỗi thật cần sửa bất kể kết quả chạy lại.

### Baseline khong do

- cd app && BASE_URL=${BASE_URL:-http://ui1.localhost:3460} node --import tsx ../scripts/smoke-review-queue.mjs: bo qua baseline: tep scripts/smoke-review-queue.mjs co o cay dang kiem nhung chua co o merge-base 85072b33773e8aa677ea04a9da2ade36063e7d06 — eval moi, chay tren code cu khong phan biet gi

## Variance

none — every multi-run eval is uniform

## Iterations

Round 1: E2, E6, E9, E10, E19 failed — một lệnh smoke dùng chung kết thúc với mã khác 0 vì DB local không có thẻ bổ sung tin chờ để đo ma trận nút của sheet bổ sung tin (E19); ngoài ra ba finding trong hợp đồng (AC-6) cho rằng giá trị ai_confidence vẫn tới trình duyệt qua evidence.fields. Returned to implementation.
Round 2: E1, E3, E4, E5, E7, E8, E11, E12 failed (lệnh `cd app && npm test` kết thúc với mã khác 0, đuôi log là lỗi kết nối DB) và smoke, `agent`/`pipeline` test, E13 BLOCKED vì DB local :5433 không chạy; sau S4-r1 vẫn còn ba finding AC-6 (độ tự tin lọt qua `basis`). Cần bật DB rồi verify lại, và xử lý finding AC-6.
