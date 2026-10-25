---
schema_version: 2
feature_slug: hieu-chuan-mot-bo-so
verdict: REJECT
failed_evals: ["E9","E10"]
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 53c06f0f2feb4099af4a60fbdef73d4b29eed3d0
human_signoff:
---

# Evidence Report: hieu-chuan-mot-bo-so

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | test | PASS |
| E2 | AC-2 | test | PASS |
| E3 | AC-3 | test | PASS |
| E4 | AC-4 | test | PASS |
| E5 | AC-5 | test | PASS |
| E6 | AC-6 | test | PASS |
| E7 | AC-7 | script | PASS |
| E8 | AC-8 | judgment | PASS |
| E9 | AC-9 | test | FAIL |
| E10 | AC-10 | ui-check | FAIL |

Vòng 1 bị REJECT vì hai eval không đạt: E9 (lệnh `node --test scripts/*.test.mjs` thoát khác 0) và E10 (ảnh chụp thật cho thấy chữ đè nhau ở tiêu đề bảng «Độ phủ trung thực» ở khung 1440, cả sáng lẫn tối). Ngoài ra lệnh suite `cd pipeline && npm test` cũng thoát khác 0 (xem mục Analyst).

## Evidence

- eval: E1
  run_id: minted-hieu-chuan-mot-bo-so-E1-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.test.app_ui
  verified_at: 2026-10-25T00:08:38Z
  output: |
    Lệnh `cd app && npm test` xanh toàn bộ, gồm ca HC-AC-1 (market đại diện).
    ℹ duration_ms 12569.405542

- eval: E2
  run_id: minted-hieu-chuan-mot-bo-so-E2-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.test.app_ui
  verified_at: 2026-10-25T00:08:38Z
  output: |
    Lệnh `cd app && npm test` xanh toàn bộ, gồm ca HC-AC-2 (một số tự thu).
    ℹ duration_ms 12569.405542

- eval: E3
  run_id: minted-hieu-chuan-mot-bo-so-E3-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.test.app_ui
  verified_at: 2026-10-25T00:08:38Z
  output: |
    Lệnh `cd app && npm test` xanh toàn bộ, gồm ca HC-AC-3 (định nghĩa tự thu).
    ℹ duration_ms 12569.405542

- eval: E4
  run_id: minted-hieu-chuan-mot-bo-so-E4-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.test.app_ui
  verified_at: 2026-10-25T00:08:38Z
  output: |
    Lệnh `cd app && npm test` xanh toàn bộ, gồm ca HC-AC-4 (mẫu mỏng).
    ℹ duration_ms 12569.405542

- eval: E5
  run_id: minted-hieu-chuan-mot-bo-so-E5-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.test.app_ui
  verified_at: 2026-10-25T00:08:38Z
  output: |
    Lệnh `cd app && npm test` xanh toàn bộ, gồm ca HC-AC-5 (gộp thị trường chưa có số).
    ℹ duration_ms 12569.405542

- eval: E6
  run_id: minted-hieu-chuan-mot-bo-so-E6-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.test.app_ui
  verified_at: 2026-10-25T00:08:38Z
  output: |
    Lệnh `cd app && npm test` xanh toàn bộ, gồm ca HC-AC-6 (đếm).
    ℹ duration_ms 12569.405542

- eval: E7
  run_id: minted-hieu-chuan-mot-bo-so-E7-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.hieu_chuan_do
  verified_at: 2026-10-25T00:08:38Z
  output: |
    Lệnh `cd app && node --import tsx ../scripts/hieu-chuan-do.mjs` chạy xong.
    Dòng cuối: ok   đối chứng: cũ lệch ở 2 khu vực
    Đối chiếu từ lần chụp E10: «25 thị trường hiệu chuẩn», chưa có số: Huế, Hải Phòng, Quảng Ninh, Cà Mau, Hà Tĩnh, Hưng Yên, Ninh Bình, Thái Nguyên, Tây Ninh; mẫu mỏng: không có.

- eval: E8
  judged_by: judge-subagent (fresh context)
  verdict: PASS
  rationale: Hội đồng ba judge cùng đề xuất PASS; chi tiết ở mục Judge panels bên dưới. Đây là đề xuất, người quyết ở Cổng 2.
  required_evidence:
    - (judge không nêu bằng-chứng-thiếu)
  human_override:  # chi nguoi ghi

- eval: E9
  run_id: minted-hieu-chuan-mot-bo-so-E9-r1
  exit_code: 1
  baseline: red
  verifier: config:executors.test.scripts
  verified_at: 2026-10-25T00:08:38Z
  output: |
    Lệnh `node --test scripts/*.test.mjs` thoát khác 0.
    Ca đỏ được log ghi lại: scripts/job-exit.test.mjs dòng 455, «AC-5 chiều đỏ: bản sao push-ops-facts viết cứng localhost:5433 → hộp cát chặn…».
    Lỗi: AssertionError «hộp cát phải chặn kết nối tới :5433», actual false, expected true.
    Phần log giữ lại không cho thấy ca UC-AC-9 của scripts/ui-capture-login.test.mjs; không có bằng chứng ở đây để khẳng định các ca (a)–(e) của E9 đã xanh. Eval bị tính đỏ vì cả lệnh đỏ.

- eval: E10
  run_id: minted-hieu-chuan-mot-bo-so-E10-r1
  exit_code: 1
  baseline: n-a
  verifier: config:dev_server.start
  verified_at: 2026-10-25T00:08:38Z
  screenshot: evidence/E10-sang-1440.png
  observed: |
    E10-sang-1440.png (1440x16000, sáng): đã đăng nhập, thấy shell Ops. Đầu trang «Chất lượng dữ liệu» kèm huy hiệu «13 kiểm · 46 đối tượng · 25 thị trường hiệu chuẩn». Có bảng Độ phủ trung thực, 25 thẻ «Hiệu chuẩn — <khu vực>» (ADR, Công suất, Listing, huy hiệu «0.00× · Lệch»), chân mỗi thẻ có câu «Listing tự thu: số listing đang theo dõi trong cả khu vực (gồm phường con)…». Cuối các thẻ có dòng «Chưa có số: Huế, Hải Phòng, Quảng Ninh, Cà Mau, Hà Tĩnh, Hưng Yên, Ninh Bình, Thái Nguyên, Tây Ninh», rồi bảng «Thị trường S02 · Hiệu chuẩn toàn quốc». Không thẻ nào có nhãn «mẫu mỏng». LỖI: tiêu đề cột bảng Độ phủ trung thực bị đè chữ («S02 · Hiệu chuẩn — đang hoạt động» chồng lên «Số đã mua»; «Lịch sử S02 · Hiệu chuẩn» chồng lên «Cập nhật»).
    E10-toi-1440.png (tối): nền tối, chữ sáng đọc rõ, cùng nội dung như frame sáng (huy hiệu «25 thị trường hiệu chuẩn», câu định nghĩa, dòng «Chưa có số: …», không nhãn «mẫu mỏng»). Cùng lỗi đè chữ ở hai cặp tiêu đề cột của bảng Độ phủ trung thực.
    E10-sang-390.png (390x16000, sáng): đã đăng nhập, huy hiệu «25 thị trường hiệu chuẩn» ở đầu. Thẻ KPI xếp dọc, các bảng cuộn ngang trong khung riêng, không có cuộn ngang cấp trang. Thẻ Hiệu chuẩn xếp gọn, có câu «Listing tự thu: …», dòng «Chưa có số: Huế, Hải Phòng, Quảng Ninh, Cà Mau, Hà Tĩnh, Hưng Yên, Ninh Bình, Thái Nguyên, Tây Ninh» ở cuối trước bảng toàn quốc, không nhãn «mẫu mỏng». Không thấy chữ đè nhau ở 390 (bảng bị cắt trong khung cuộn, đúng thiết kế). Frame này là 16000 px, không phải 40000, vì Chromium không chụp nổi cao hơn.
  network_observed: n-a (driver)

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-hieu-chuan-mot-bo-so-SUITE-npm_test__bb6271-r1
  exit_code: 0
  verified_at: 2026-10-25T00:08:38Z

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-hieu-chuan-mot-bo-so-SUITE-lint-r1
  exit_code: 0
  verified_at: 2026-10-25T00:08:38Z

- cmd: cd pipeline && npm test
  run_id: minted-hieu-chuan-mot-bo-so-SUITE-npm_test__13563d-r1
  exit_code: 1
  verified_at: 2026-10-25T00:08:38Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-hieu-chuan-mot-bo-so-SUITE-test_lint_rules-r1
  exit_code: 0
  verified_at: 2026-10-25T00:08:38Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-hieu-chuan-mot-bo-so-SUITE-node_scripts_check_portal_compliance_mjs-r1
  exit_code: 0
  verified_at: 2026-10-25T00:08:38Z

## Judge panels

Panel đề xuất cho E8: ba judge, đề xuất PASS. Đây chỉ là đề xuất; `human_override` để trống cho người quyết ở Cổng 2.

- domain-correctness: PASS — CONTEXT.md dòng 329-339 có đủ ba mục, mỗi mục có nhãn, Code (ourListings, isThin/MAU_MONG_DUOI, splitCalibrated), định nghĩa và _Avoid_. Nghĩa khớp ba câu hỏi đã chốt: «Listing tự thu» đếm listing đang theo dõi trong cả khu vực gồm phường con; «Mẫu mỏng» là cỡ mẫu dưới ngưỡng 5 listing; «Thị trường hiệu chuẩn» là thị trường có ít nhất một số, phần còn lại gộp ở dòng «Chưa có số». Judge chỉ đọc CONTEXT.md nên không kiểm được chữ trên trang hay giá trị ngưỡng 5 so với Cổng Phạm vi, và câu hỏi cũng không nêu số ngưỡng.
- operational-feasibility: PASS — CONTEXT.md dòng 329-339 có đủ ba mục, mỗi mục có nhãn, Code, định nghĩa và _Avoid_. Nghĩa khớp ba câu hỏi đã chốt: «Listing tự thu» là số listing đang theo dõi trong cả khu vực gồm phường con. «Mẫu mỏng» là cỡ mẫu ADR/công suất dưới 5 listing. «Thị trường hiệu chuẩn» là thị trường có ít nhất một số, phần còn lại gộp ở dòng «Chưa có số».
- spec-alignment: PASS — CONTEXT.md dòng 329-339 có đủ ba mục, mỗi mục có nhãn, `Code:` và `_Avoid_`. «Listing tự thu» là số listing đang theo dõi trong cả khu vực gồm phường con. «Mẫu mỏng» là ADR/công suất tính từ dưới 5 listing. «Thị trường hiệu chuẩn» là thị trường có ít nhất một số, và các thị trường còn lại gộp ở dòng «Chưa có số: …». Cả ba khớp với ba câu hỏi đã chốt trong câu hỏi phản biện.

## Known limits

## Ngoài hợp đồng

## Analyst

Eval không-phân-biệt (xanh trên cả HEAD lẫn baseline, chứng minh khung chạy chứ chưa chứng minh tính năng): lệnh `cd app && npm test` cho E1, E2, E3, E4, E5, E6. Nên viết lại để assert hành vi mới, hoặc xác nhận đây là regression-guard có chủ ý.

Baseline khong do
- cd app && node --import tsx ../scripts/hieu-chuan-do.mjs: bo qua baseline: tep scripts/hieu-chuan-do.mjs co o cay dang kiem nhung chua co o merge-base 9146509944a827e0b4a42306c4cdbbec3a654be8 — eval moi, chay tren code cu khong phan biet gi

Lệnh fail không gắn eval:
- cd pipeline && npm test: thoát khác 0, 128 ca xanh trên 129. Ca đỏ duy nhất là scripts/entrypoint-symlink.test.mjs dòng 134, «AC-3 không còn khuôn cũ»: báo «AC-3 còn lối vào khuôn cũ: scripts/ui-capture-login.mjs». Tệp ui-capture-login.mjs là tệp mới của feature này, nên đây nhiều khả năng là va chạm giữa test cũ của pipeline và tệp mới; cần người xem lại.
- Lệnh của E9 (`node --test scripts/*.test.mjs`) và lệnh của E10 (ui-check) đã nằm trong khối eval tương ứng ở trên.

## Variance

none — every multi-run eval is uniform

## Iterations

Round 1: E9, E10 failed — E9: lệnh `node --test scripts/*.test.mjs` đỏ ở ca AC-5 của job-exit.test.mjs (hộp cát không chặn kết nối tới :5433); E10: chữ đè nhau ở hàng tiêu đề bảng «Độ phủ trung thực» ở khung 1440, sáng và tối. Lệnh suite `cd pipeline && npm test` cũng đỏ ở ca AC-3 của entrypoint-symlink.test.mjs. Returned to implementation.
