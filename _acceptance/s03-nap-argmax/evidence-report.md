---
schema_version: 2
feature_slug: s03-nap-argmax
verdict: PASS
failed_evals: []
reason:
verified_by: fresh-context verification subagent (vòng 2)
enforcement_mode: strict
bypass_used: false
verified_commit: ecc80ea3d30157ff45194428c0351d8a8a664b48
human_signoff:
---

# Evidence Report: s03-nap-argmax

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | script | PASS |
| E2 | AC-2 | script | PASS |
| E3 | AC-3 | script | PASS |
| E4 | AC-4 | script | PASS |
| E5 | AC-4 | script | PASS |
| E6 | AC-4 | script | PASS |
| E7 | AC-4 | script | PASS |
| E8 | AC-5 | script | PASS |

## Evidence

- eval: E1
  run_id: s03-nap-argmax-E1-r2-20261103T051536Z
  exit_code: 0
  baseline: red
  verifier: config:executors.script.s03na_unit
  verified_at: 2026-11-03T05:15:36Z
  output: |
    ✔ nap-argmax: vượt ARG_MAX vẫn liệt kê đủ, đúng thứ tự mốc; bỏ .partial và mốc sai (34909ms)
    4000 thư mục S03 + 1 .partial + 1 mốc sai + 1 nguồn khác; hai script đều thấy đủ 4000, đúng thứ tự
    đối chứng: khuôn ls cũ trên cùng cây thoát 126 (assert đạt)
    ℹ tests 6 · pass 6 · fail 0

- eval: E2
  run_id: s03-nap-argmax-E2-r2-20261103T051536Z
  exit_code: 0
  baseline: red
  verifier: config:executors.script.s03na_unit
  verified_at: 2026-11-03T05:15:36Z
  output: |
    ✔ nap-argmax: liệt kê lỗi thì thoát 3 và không ghi state (10ms)
    ROOT không tồn tại, cả hai script: mã thoát 3, tệp state giữ nguyên nội dung cũ
    ℹ tests 6 · pass 6 · fail 0

- eval: E3
  run_id: s03-nap-argmax-E3-r2-20261103T051536Z
  exit_code: 0
  baseline: red
  verifier: config:executors.script.s03na_unit
  verified_at: 2026-11-03T05:15:36Z
  output: |
    ✔ nap-argmax: không còn khuôn ls glob snapshot; find -maxdepth 2 đúng khuôn ở cả hai bản
    ✔ nap-argmax: khối liệt kê hai bản GIỐNG HỆT nhau (BÁO 2510-5)
    khối so sánh nay bắt đầu từ TS_RE=, nên gồm cả TS_RE và nhánh danh sách rỗng
    ℹ tests 6 · pass 6 · fail 0

- eval: E4
  run_id: s03-nap-argmax-E4-r2-20261103T051536Z
  exit_code: 0
  baseline: green
  verifier: config:executors.script.au3_ts_format
  verified_at: 2026-11-03T05:15:36Z
  output: |
    ok   zalo-import-daily.sh: should-NOT-fire: tên rác (TEST, thiếu giờ, đuôi lạ) không được nạp
    ok   zalo-import-daily.sh: state tới mốc thật mới nhất, không nhảy theo tên rác
    TS-FORMAT PASS

- eval: E5
  run_id: s03-nap-argmax-E5-r2-20261103T051536Z
  exit_code: 0
  baseline: green
  verifier: config:executors.script.au3_lock
  verified_at: 2026-11-03T05:15:41Z
  output: |
    ok   zalo-import-daily.sh: khoá >2h → gỡ lấy lại, nạp bình thường
    ok   apify-facebook-daily.sh: khoá PID sống → không nạp, báo bận
    LOCK PASS

- eval: E6
  run_id: s03-nap-argmax-E6-r2-20261103T051541Z
  exit_code: 0
  baseline: green
  verifier: config:executors.script.snt_mo_coi
  verified_at: 2026-11-03T05:15:42Z
  output: |
    ok   zalo-import-daily.sh (c): .partial vô hình — không log, không chặn
    ok   zalo-import-daily.sh (c): state không nhảy theo .partial
    MO-COI PASS

- eval: E7
  run_id: s03-nap-argmax-E7-r2-20261103T051542Z
  exit_code: 0
  baseline: green
  verifier: config:executors.script.zalo_import_job
  verified_at: 2026-11-03T05:15:43Z
  output: |
    ✔ ZJ-AC-1 mọi bước lành → mã 0, đúng thứ tự năm bước, không JOB FAIL
    ✔ ZJ-AC-3 nạp hỏng (lỗi thường · DB chưa lên) → state giữ mốc cũ, không transform/refresh
    ℹ tests 8 · pass 8 · fail 0

- eval: E8
  run_id: s03-nap-argmax-E8-r2-20261103T051536Z
  exit_code: 0
  baseline: red
  verifier: config:executors.script.s03na_unit
  verified_at: 2026-11-03T05:15:36Z
  output: |
    ✔ nap-argmax: rỗng khi đã có mốc thật → thoát 3, state giữ nguyên (11ms)
    ✔ nap-argmax: rỗng lần đầu chưa có mốc → thoát 0 (25ms)
    cả hai script; stderr có dòng lý do «không liệt kê được snapshot nào»; tệp state không được tạo
    ℹ tests 6 · pass 6 · fail 0

## Known limits

- `au3 apify` và `au3 chotot` (cùng dòng «lỗi thật được nhận là ECONNREFUSED») đỏ sẵn trên main: đỏ y hệt ở `0d57687f` và ở `ecc80ea3`, không do bản này. Ngoài hợp đồng theo contract.
- Số tiến trình con mỗi thư mục: vòng lọc dùng basename, sed, grep; vòng nạp dùng basename, sed (chưa kể subshell). Đo chỉ đọc trên cây thật của máy thu: liệt kê và lọc 11.147 thư mục S03 mất khoảng 73 giây, chưa gồm nạp. Cũ, không gây lỗi; ngoài hợp đồng.
- Cây thật (chỉ đọc, chỉ đếm): 11.147 thư mục S03, tổng đường dẫn 1.105.625 byte so với ARG_MAX 1.048.576; 0 thư mục `.partial`, 0 thiếu manifest, mọi mốc đúng khuôn; 1.086 mốc mới hơn con trỏ state hiện tại; khuôn `ls` cũ trên cây này không chạy được. Nạp bù chưa làm: là bước triển khai riêng.
- Bốn ca của `s03na_unit` chạy khối liệt kê tách khỏi script, không chạy trọn script; phần khoá và dọn khoá khi thoát 3 được soát riêng bằng chạy bản sao (xem Analyst).

## Ngoài hợp đồng

không có

## Analyst

Baseline = `0d57687f` (merge-base của hai đầu nhánh), chép `scripts/nap-argmax.test.mjs` của nhánh sang rồi chạy: sáu ca, bốn đỏ (khuôn ls còn trong script; vượt ARG_MAX; liệt kê lỗi không thoát 3; rỗng có mốc không thoát 3), hai xanh (hai khối giống hệt vì cả hai bản cũ đều chưa có khối mới; rỗng lần đầu thoát 0 vì ls cũ cũng cho rỗng). Hai ca xanh là bảo vệ chiều should-NOT-fire và so sánh, không phải ca phân biệt.

E4, E5, E6, E7 xanh trên baseline: là hồi quy AC-4, chủ ý.

Đột biến trên bản sao (mỗi lần một script, chạy `scripts/nap-argmax.test.mjs`), tất cả bị bắt:
- (a) bỏ nhánh danh sách rỗng ở `zalo-import-daily.sh`: đỏ hai ca (hai khối giống hệt; rỗng có mốc). Làm lại ở `apify-facebook-daily.sh`: đỏ cùng hai ca.
- (b) đảo điều kiện thành `[ -z "$DS_DIR" ]` (lần đầu cũng thoát 3): đỏ hai ca (hai khối giống hệt; rỗng lần đầu thoát 0).
- (c) lệch `TS_RE` giữa hai script (bỏ `Z?` ở một bên): đỏ ca hai khối giống hệt. Vòng 1 không bắt, nay bắt vì khối so sánh bắt đầu từ `TS_RE=`. Chỉ ca này bắt, không ca hành vi nào chạm.
- (d) đưa lại `ls -1d` với glob ở `apify-facebook-daily.sh` (vẫn giữ nhánh `||`): đỏ năm trên sáu ca, gồm khuôn ls, hai khối giống hệt, vượt ARG_MAX, rỗng có mốc, rỗng lần đầu.

Soát `git diff 8b037cf2 92ee45c4 -- scripts/`: hai script nhận đúng cùng một khối thêm 7 dòng; thêm 2 ca và đổi mốc cắt khối so sánh. Không thay đổi nào ngoài đó. Từ `92ee45c4` đến HEAD không có thay đổi nào ở ba tệp này (chỉ gộp main).

Chạy trọn bản sao từng script ở ROOT tạm (thư mục snapshot rỗng, state có mốc, HOME tạm, bước node là stub ghi dấu): cả hai thoát 3, state giữ nguyên từng byte, thư mục khoá đã gỡ, không bước nạp hay transform nào được gọi (riêng `apify-facebook-daily.sh` bước thu chạy trước nhánh này theo thiết kế cũ, stub). Chạy lại ca chưa có state trên cùng cây rỗng: không thoát 3, state ghi mốc mặc định.

Non-discriminating evals: E4, E5, E6, E7 (hồi quy AC-4 chủ ý, xanh cả hai phía). E1, E2, E3, E8 đỏ trên baseline (phân biệt được).

## Variance

none — every multi-run eval is uniform

## Iterations

Round 1: PASS (không lỗi; một mục ngoài hợp đồng đã trả ZCode).
Round 2: PASS — nhánh danh sách rỗng (AC-5) thêm ở `92ee45c4`; tám eval đạt, bốn đột biến đều bị bắt.
