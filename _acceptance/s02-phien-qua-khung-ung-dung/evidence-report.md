---
schema_version: 2
feature_slug: s02-phien-qua-khung-ung-dung
verdict: PASS
failed_evals: []
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: d6d4e64edc3dae5ea46711a1041c297097bde198
human_signoff:
---

# Evidence Report: s02-phien-qua-khung-ung-dung

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | script | PASS |
| E2 | AC-2 | script | PASS |
| E3 | AC-4 | script | PASS |
| E4 | AC-5 | script | PASS |
| E5 | AC-9 | script | PASS |
| E6 | AC-10 | script | PASS |
| E7 | AC-6 | script | PASS |
| E8 | AC-7 | script | PASS |
| E9 | AC-8 | script | PASS |
| E10 | AC-3 | script | PASS |
| E11 | AC-3 | script | PASS |
| E12 | AC-10 | script | PASS |
| E13 | AC-10 | test | PASS |
| E14 | AC-9 | script | PASS |
| E15 | AC-6 | script | PASS |
| E16 | AC-9 | script | PASS |
| E17 | AC-4 | script | PASS |

## Evidence

- eval: E1
  run_id: minted-s02-phien-qua-khung-ung-dung-E1-r1
  exit_code: 0
  baseline: red
  verifier: _acceptance/s02-phien-qua-khung-ung-dung/probes/han-va-lam-moi.mjs
  verified_at: 2026-11-26T10:47:49.932Z
  output: |
    đạt: bản thật · AC-1 lề: còn 31 giây → dùng được
    đạt: bản thật · AC-1 lề: còn 29 giây → không dùng
    đạt: bản thật · AC-1 lề: hết hạn 1 giây → không dùng
    đạt: bản thật · AC-1 lề: chuỗi rác → không dùng
    đạt: bản thật · AC-1 lề: rỗng → không dùng
    đạt: bản đột biến (bỏ lề token) bị bắt ở ô: AC-1 lề: còn 29 giây → không dùng
    XANH

- eval: E2
  run_id: minted-s02-phien-qua-khung-ung-dung-E2-r1
  exit_code: 0
  baseline: red
  verifier: _acceptance/s02-phien-qua-khung-ung-dung/probes/han-va-lam-moi.mjs
  verified_at: 2026-11-26T10:47:49.932Z
  output: |
    đạt: bản thật · AC-2 giữ: còn hạn, không ép → dùng lại
    đạt: bản thật · AC-2 giữ: còn hạn, ép làm mới → không dùng lại
    đạt: bản thật · AC-2 giữ: rỗng, không ép → không dùng lại
    đạt: bản thật · AC-2 giữ: hết hạn, không ép → không dùng lại
    đạt: bản đột biến (bỏ vế ép làm mới) bị bắt ở ô: AC-2 giữ: còn hạn, ép làm mới → không dùng lại
    XANH

- eval: E3
  run_id: minted-s02-phien-qua-khung-ung-dung-E3-r1
  exit_code: 0
  baseline: red
  verifier: _acceptance/s02-phien-qua-khung-ung-dung/probes/han-va-lam-moi.mjs
  verified_at: 2026-11-26T10:47:49.932Z
  output: |
    đạt: bản thật · AC-4 đường kế: khung không nạp được → thử đường kế
    đạt: bản thật · AC-4 đường kế: khung nạp được, chưa thấy lời gọi xác thực → DỪNG
    đạt: bản thật · AC-4 đường kế: thấy mã 200 → dừng
    đạt: bản thật · AC-4 đường kế: thấy mã 401 → dừng
    đạt: bản thật · AC-4 đường kế: thấy mã 403 → dừng
    đạt: bản thật · AC-4 đường kế: thấy mã 500 → dừng
    đạt: bản đột biến (khung nạp được vẫn thử đường kế) bị bắt ở ô: AC-4 đường kế: khung nạp được, chưa thấy lời gọi xác thực → DỪNG
    đạt: bản đột biến (luôn thử đường kế) bị bắt ở ô: AC-4 đường kế: khung nạp được, chưa thấy lời gọi xác thực → DỪNG
    XANH

- eval: E4
  run_id: minted-s02-phien-qua-khung-ung-dung-E4-r1
  exit_code: 0
  baseline: red
  verifier: _acceptance/s02-phien-qua-khung-ung-dung/probes/han-va-lam-moi.mjs
  verified_at: 2026-11-26T10:47:49.932Z
  output: |
    đạt: bản thật · AC-5 chẩn đoán: 401 → BỊ TỪ CHỐI, chỉ lệnh đăng nhập
    đạt: bản thật · AC-5 chẩn đoán: 403 → BỊ TỪ CHỐI
    đạt: bản thật · AC-5 chẩn đoán: 200 mà không có token → ứng dụng chạy nhưng không cấp (không đổ cho phiên)
    đạt: bản thật · AC-5 chẩn đoán: khung không nạp được ở hai đường dẫn → KHÔNG nạp được khung, liệt kê đường dẫn, chỉ lệnh đăng nhập
    đạt: bản thật · AC-5 chẩn đoán: khung nạp được mà không có token → nói ứng dụng có mặt nhưng không có phiên, chỉ lệnh đăng nhập
    đạt: bản thật · AC-5 chẩn đoán: danh sách rỗng → KHÔNG nạp được khung (không ném)
    đạt: bản thật · AC-5 chẩn đoán: token còn hạn bị máy chủ từ chối, không nhận được token khác → nói vậy
    đạt: bản đột biến (bỏ nhận 401/403) bị bắt ở ô: AC-5 chẩn đoán: 401 → BỊ TỪ CHỐI, chỉ lệnh đăng nhập
    đạt: bản đột biến (đổ khung nạp được cho «không nạp được») bị bắt ở ô: AC-5 chẩn đoán: khung nạp được mà không có token → nói ứng dụng có mặt nhưng không có phiên, chỉ lệnh đăng nhập
    XANH

- eval: E5
  run_id: minted-s02-phien-qua-khung-ung-dung-E5-r1
  exit_code: 0
  baseline: red
  verifier: _acceptance/s02-phien-qua-khung-ung-dung/probes/han-va-lam-moi.mjs
  verified_at: 2026-11-26T10:47:49.932Z
  output: |
    đạt: bản thật · AC-9 đăng nhập: đúng một tham số trỏ thư mục profile
    đạt: bản thật · AC-9 đăng nhập: tham số cuối là https tới route dữ liệu, không cờ tự động hoá
    đạt: bản thật · AC-9 đăng nhập: bộ thu khai hàm login
    đạt: bản thật · AC-9 đăng nhập: đổi được tệp chạy Chrome bằng biến môi trường
    đạt: bản đột biến (profile sai chỗ) bị bắt ở ô: AC-9 đăng nhập: đúng một tham số trỏ thư mục profile
    đạt: bản đột biến (bỏ biến môi trường Chrome) bị bắt ở ô: AC-9 đăng nhập: đổi được tệp chạy Chrome bằng biến môi trường
    XANH

- eval: E6
  run_id: minted-s02-phien-qua-khung-ung-dung-E6-r1
  exit_code: 0
  baseline: red
  verifier: _acceptance/s02-phien-qua-khung-ung-dung/probes/han-va-lam-moi.mjs
  verified_at: 2026-11-26T10:47:49.932Z
  output: |
    đạt: bản thật · AC-10 profile: biến môi trường thắng
    đạt: bản thật · AC-10 profile: thiếu biến → mặc định
    đạt: bản thật · AC-10 profile: biến rỗng → mặc định
    đạt: bản đột biến (bỏ biến môi trường profile) bị bắt ở ô: AC-10 profile: biến môi trường thắng
    XANH

- eval: E7
  run_id: minted-s02-phien-qua-khung-ung-dung-E7-r1
  exit_code: 0
  baseline: red
  verifier: _acceptance/s02-phien-qua-khung-ung-dung/probes/loi-xac-thuc.mjs
  verified_at: 2026-11-26T10:47:51.126Z
  output: |
    đạt: bản thật · AC-6 401 một lần, làm mới cho token KHÁC → gửi lại bằng token mới và thành công
    đạt: bản thật · AC-6 401 mà làm mới KHÔNG đổi token → không gửi lại, ném LoiXacThuc sau đúng MỘT dòng AUTH FAIL [S02]
    đạt: bản thật · AC-6 401 hai lần (đã đổi token) → ném LoiXacThuc sau đúng MỘT dòng AUTH FAIL [S02]
    đạt: bản thật · AC-6 làm mới hỏng: ném LoiXacThuc, 0 lời gửi, không tính là lời gọi lỗi
    đạt: bản đột biến (bỏ bắt LoiXacThuc) bị bắt ở ô: AC-6 làm mới hỏng: ném LoiXacThuc, 0 lời gửi, không tính là lời gọi lỗi
    đạt: bản đột biến (gửi lại dù token không đổi) bị bắt ở ô: AC-6 401 mà làm mới KHÔNG đổi token → không gửi lại, ném LoiXacThuc sau đúng MỘT dòng AUTH FAIL [S02]
    XANH

- eval: E8
  run_id: minted-s02-phien-qua-khung-ung-dung-E8-r1
  exit_code: 0
  baseline: red
  verifier: _acceptance/s02-phien-qua-khung-ung-dung/probes/loi-xac-thuc.mjs
  verified_at: 2026-11-26T10:47:51.126Z
  output: |
    đạt: bản thật · AC-7 lỗi thường: HTTP 500 → trả null, tính đúng một lời gọi lỗi, không ném
    đạt: bản đột biến (bỏ bắt LoiXacThuc) bị bắt ở ô: AC-6 làm mới hỏng: ném LoiXacThuc, 0 lời gửi, không tính là lời gọi lỗi
    đạt: bản đột biến (bỏ làm mới trước khi gửi) bị bắt ở ô: AC-8 sắp hết hạn: làm mới đúng một lần TRƯỚC lời gửi, API nhận token mới
    đạt: bản đột biến (gửi lại dù token không đổi) bị bắt ở ô: AC-6 401 mà làm mới KHÔNG đổi token → không gửi lại, ném LoiXacThuc sau đúng MỘT dòng AUTH FAIL [S02]
    XANH

- eval: E9
  run_id: minted-s02-phien-qua-khung-ung-dung-E9-r1
  exit_code: 0
  baseline: red
  verifier: _acceptance/s02-phien-qua-khung-ung-dung/probes/loi-xac-thuc.mjs
  verified_at: 2026-11-26T10:47:51.126Z
  output: |
    đạt: bản thật · AC-8 sắp hết hạn: làm mới đúng một lần TRƯỚC lời gửi, API nhận token mới
    đạt: bản thật · AC-8 còn hạn: không làm mới thừa
    đạt: bản đột biến (bỏ làm mới trước khi gửi) bị bắt ở ô: AC-8 sắp hết hạn: làm mới đúng một lần TRƯỚC lời gửi, API nhận token mới
    đạt: bản đột biến (gửi lại dù token không đổi) bị bắt ở ô: AC-6 401 mà làm mới KHÔNG đổi token → không gửi lại, ném LoiXacThuc sau đúng MỘT dòng AUTH FAIL [S02]
    XANH

- eval: E10
  run_id: minted-s02-phien-qua-khung-ung-dung-E10-r1
  exit_code: 0
  baseline: red
  verifier: _acceptance/s02-phien-qua-khung-ung-dung/probes/noi-day.sh
  verified_at: 2026-11-26T10:47:48.260Z
  output: |
    đạt: 1 câu return token của hàm nạp đều đi qua kiểm lề
    đạt: không còn lời chờ cứng
    đạt: 2 lời page.goto đều trỏ APP_ORIGIN + duong hoặc about:blank
    đạt: trình duyệt mở không cửa sổ (headless: true)
    đạt: chiều đỏ (điều kiện bò) bắt đúng: ĐỎ: hàm nạp có câu return token không đi qua kiểm lề
    đạt: chiều đỏ (trả sớm) bắt đúng: ĐỎ: hàm nạp có câu return token không đi qua kiểm lề
    đạt: chiều đỏ (chờ cứng) bắt đúng: ĐỎ: bộ thu còn lời chờ cứng waitForTimeout
    đạt: chiều đỏ (goto chỗ khác) bắt đúng: ĐỎ: có lời page.goto trỏ ngoài APP_ORIGIN + duong hoặc about:blank
    đạt: chiều đỏ (mở có cửa sổ) bắt đúng: ĐỎ: bộ thu mở cửa sổ trình duyệt lên màn hình (headless không phải true)
    XANH

- eval: E11
  run_id: minted-s02-phien-qua-khung-ung-dung-E11-r1
  exit_code: 0
  baseline: red
  verifier: _acceptance/s02-phien-qua-khung-ung-dung/probes/han-va-lam-moi.mjs
  verified_at: 2026-11-26T10:47:49.932Z
  output: |
    đạt: bản thật · AC-3 ứng viên: route dữ liệu đứng cuối, không lặp, đều là đường dẫn tương đối
    đạt: bản đột biến (sau 401 vẫn thử mọi đường) bị bắt ở ô: AC-6 trình lấy token: sau 401 chỉ nạp MỘT đường dẫn, loại đúng token bị từ chối, không trả lại nó
    đạt: bản đột biến (đọc token không kiểm kiểu) bị bắt ở ô: AC-6 đọc token: appToken không phải chuỗi → rỗng (TypeError không lọt ra khỏi bước đọc)
    đạt: bản đột biến (xếp đường không dừng khi khung đã nạp) bị bắt ở ô: AC-4 xếp đường: khung nạp được mà không có token → DỪNG, không nạp đường khác (kể cả route dữ liệu)
    XANH

- eval: E12
  run_id: minted-s02-phien-qua-khung-ung-dung-E12-r1
  exit_code: 0
  baseline: red
  verifier: _acceptance/s02-phien-qua-khung-ung-dung/probes/vung.sh
  verified_at: 2026-11-26T10:47:48.462Z
  output: |
    tệp đổi so với caadfbb1c67d4a4296357875fa4e6fbef42d6f50: 17
    đạt: chiều đỏ — cấy pipeline/transform-ngoai-vung.mjs thì bộ lọc gọi tên nó
    đạt: có tệp bộ thu S02 (xuất docExpAppToken)
    đạt: có collector/src/core/types.ts
    đạt: có collector/src/cli.ts
    đạt: có collector/src/test/s02-phien-qua-khung-ung-dung.test.ts
    đạt: có collector/CLAUDE.md
    đạt: có collector/AGENTS.md
    XANH: mọi tệp đổi nằm trong vùng

- eval: E13
  run_id: minted-s02-phien-qua-khung-ung-dung-E13-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.collector
  verified_at: 2026-11-26T10:49:52.112Z
  output: |
    ℹ tests 118
    ℹ suites 0
    ℹ pass 118
    ℹ fail 0
    ℹ cancelled 0
    ℹ skipped 0
    ℹ todo 0
    ℹ duration_ms 110244.007291

- eval: E14
  run_id: minted-s02-phien-qua-khung-ung-dung-E14-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.script.cli
  verified_at: 2026-11-26T10:47:54.319Z
  output: |
    > one-invest-collector@0.1.0 build
    > tsc -p tsconfig.json && cp -R src/test/fixtures dist/test/
    > one-invest-collector@0.1.0 collect
    > node dist/cli.js list-sources
    … (người chấm lọc bỏ 7 dòng liệt kê bộ thu của lệnh list-sources — tên nguồn thật không dán vào hồ sơ; trong đó có dòng của bộ thu S02)

- eval: E15
  run_id: minted-s02-phien-qua-khung-ung-dung-E15-r1
  exit_code: 0
  baseline: red
  verifier: _acceptance/s02-phien-qua-khung-ung-dung/probes/han-va-lam-moi.mjs
  verified_at: 2026-11-26T10:47:49.932Z
  output: |
    đạt: bản thật · AC-6 trình lấy token: không có token → ném LoiXacThuc sau đúng MỘT dòng AUTH FAIL [S02]
    đạt: bản thật · AC-6 trình lấy token: bước nạp ném lỗi THƯỜNG → vẫn dừng cả lượt bằng LoiXacThuc, một dòng AUTH FAIL
    đạt: bản thật · AC-6 trình lấy token: sau 401 chỉ nạp MỘT đường dẫn, loại đúng token bị từ chối, không trả lại nó
    đạt: bản thật · AC-6 trình lấy token: sau 401 nhận được token KHÁC → trả token mới
    đạt: bản thật · AC-6 đọc token: appToken không phải chuỗi → rỗng (TypeError không lọt ra khỏi bước đọc)
    đạt: bản đột biến (quên đổi lỗi thường thành lỗi dừng cả lượt) bị bắt ở ô: AC-6 trình lấy token: bước nạp ném lỗi THƯỜNG → vẫn dừng cả lượt bằng LoiXacThuc, một dòng AUTH FAIL
    đạt: bản đột biến (trả lại token bị từ chối) bị bắt ở ô: AC-6 trình lấy token: sau 401 chỉ nạp MỘT đường dẫn, loại đúng token bị từ chối, không trả lại nó
    đạt: bản đột biến (sau 401 vẫn thử mọi đường) bị bắt ở ô: AC-6 trình lấy token: sau 401 chỉ nạp MỘT đường dẫn, loại đúng token bị từ chối, không trả lại nó
    đạt: bản đột biến (đọc token không kiểm kiểu) bị bắt ở ô: AC-6 đọc token: appToken không phải chuỗi → rỗng (TypeError không lọt ra khỏi bước đọc)
    XANH

- eval: E16
  run_id: minted-s02-phien-qua-khung-ung-dung-E16-r1
  exit_code: 0
  baseline: red
  verifier: _acceptance/s02-phien-qua-khung-ung-dung/probes/lenh-login.sh
  verified_at: 2026-11-26T10:47:52.981Z
  output: |
    == bản thật
    đạt: login mở đúng profile rồi dừng — thoát 0, in hướng dẫn, không in Usage
    đạt: không mở được Chrome → thoát 1 có lý do, không in Usage
    đạt: chiều đỏ (login rơi sang nhánh lệnh kế) bắt đúng: ĐỎ: lệnh login không dừng sau khi mở cửa sổ (thoát khác 0, thiếu hướng dẫn, hoặc in Usage)
    XANH

- eval: E17
  run_id: minted-s02-phien-qua-khung-ung-dung-E17-r1
  exit_code: 0
  baseline: red
  verifier: _acceptance/s02-phien-qua-khung-ung-dung/probes/han-va-lam-moi.mjs
  verified_at: 2026-11-26T10:47:49.932Z
  output: |
    đạt: bản thật · AC-4 xếp đường: khung không nạp được ở đường đầu → thử đường kế, gặp token thì dừng
    đạt: bản thật · AC-4 xếp đường: khung nạp được mà không có token → DỪNG, không nạp đường khác (kể cả route dữ liệu)
    đạt: bản thật · AC-4 xếp đường: mọi đường bị thử thách → thử đủ ba rồi dừng
    đạt: bản đột biến (xếp đường không dừng khi khung đã nạp) bị bắt ở ô: AC-4 xếp đường: khung nạp được mà không có token → DỪNG, không nạp đường khác (kể cả route dữ liệu)
    XANH

## Known limits

## Ngoài hợp đồng

## Analyst

Baseline khong do: E13 — lệnh test của collector là lệnh nặng; brief chỉ cho chạy sáu lệnh nhẹ ở cây gốc và cấm chạy lệnh test ở đó, nên baseline của E13 không đo (n-a).

Non-discriminating evals: E14 — lệnh CLI (build rồi list-sources) xanh ở cả hai cây và bảy dòng liệt kê bộ thu in ra giống hệt ở hai cây; đây là lớp bảo vệ hồi quy, không chứng minh tính năng của hàng này.

Ghi chú về baseline của mười lăm eval còn lại (đều red): đo ở lượt trước trên cùng cây gốc `caadfbb`, năm phép đo giống hệt (đã đối chiếu từng tệp ở lượt này); mã nhánh của lượt này giống hệt mã đã đo nên dùng lại, không chạy lại cây gốc theo lời điều phối. E16 đỏ vì phép đo dừng ngay ở ca gác của chính nó (cây gốc chưa có bộ thu nào khai hàm `login`); E10 đỏ vì cây gốc không có hàm nạp một đường dẫn.

## Variance

none — every multi-run eval is uniform

## Iterations

Round 1 (mã `d6d4e64e`, mã nguồn giống hệt `13c81e3`): đủ 17 eval đạt — không eval nào trượt, không mục nào chờ người chốt. Sổ chạy 17 dòng ghi ngay lúc chạy trong lượt này, cùng một sha.

Hai lượt chấm độc lập trước đó trên mã cũ (`4f38b65`, `13c81e3`) mỗi lượt đạt 16 eval nhẹ và không chạy E13 (lượt một: khoá chạy nặng còn giữ; lượt hai: HEAD đổi ngay trước khi chạy lệnh test) — cây đổi nên kết quả không mang sang báo cáo này. Trước lượt này, sổ chạy ở HEAD gồm 16 dòng của lượt cũ (sha `13c81e3`) và một dòng E13 không do lượt chấm độc lập này ghi; lượt này thay toàn bộ sổ.
