---
schema_version: 2
feature_slug: s03-nap-argmax
verdict: PASS
failed_evals: []
reason:
verified_by: fresh-context verification subagent (vòng 3)
enforcement_mode: strict
bypass_used: false
verified_commit: 0f35ee9144b41ddf9f92ae9865ffe53699b762df
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
  run_id: s03-nap-argmax-E1-r3-20261103T052830Z
  exit_code: 0
  baseline: red
  verifier: config:executors.script.s03na_unit
  verified_at: 2026-11-03T05:28:30Z
  output: |
    ✔ nap-argmax: vượt ARG_MAX vẫn liệt kê đủ, đúng thứ tự mốc; bỏ .partial và mốc sai (31541ms)
    4000 thư mục S03 + 1 .partial + 1 mốc sai + 1 nguồn khác; hai script đều thấy đủ 4000, đúng thứ tự
    đối chứng: khuôn ls cũ trên cùng cây thoát 126 (assert đạt)
    ℹ tests 10 · pass 10 · fail 0

- eval: E2
  run_id: s03-nap-argmax-E2-r3-20261103T052830Z
  exit_code: 0
  baseline: red
  verifier: config:executors.script.s03na_unit
  verified_at: 2026-11-03T05:28:30Z
  output: |
    ✔ nap-argmax: liệt kê lỗi thì thoát 3 và không ghi state (10ms)
    ✔ nap-argmax: chạy trọn zalo-import-daily.sh, thiếu thư mục, state có mốc: thoát 3, gỡ khoá, không nạp
    ✔ nap-argmax: chạy trọn apify-facebook-daily.sh, thiếu thư mục, state có mốc: thoát 3, gỡ khoá, không nạp
    ℹ tests 10 · pass 10 · fail 0

- eval: E3
  run_id: s03-nap-argmax-E3-r3-20261103T052830Z
  exit_code: 0
  baseline: red
  verifier: config:executors.script.s03na_unit
  verified_at: 2026-11-03T05:28:30Z
  output: |
    ✔ nap-argmax: không còn khuôn ls glob snapshot; find -maxdepth 2 đúng khuôn ở cả hai bản
    ✔ nap-argmax: khối liệt kê hai bản GIỐNG HỆT nhau (BÁO 2510-5)
    khối so sánh bắt đầu từ TS_RE=, nên gồm cả TS_RE và nhánh danh sách rỗng
    ℹ tests 10 · pass 10 · fail 0

- eval: E4
  run_id: s03-nap-argmax-E4-r3-20261103T052830Z
  exit_code: 0
  baseline: green
  verifier: config:executors.script.au3_ts_format
  verified_at: 2026-11-03T05:28:31Z
  output: |
    ok   zalo-import-daily.sh: should-NOT-fire: tên rác (TEST, thiếu giờ, đuôi lạ) không được nạp
    ok   zalo-import-daily.sh: state tới mốc thật mới nhất, không nhảy theo tên rác
    TS-FORMAT PASS

- eval: E5
  run_id: s03-nap-argmax-E5-r3-20261103T052831Z
  exit_code: 0
  baseline: green
  verifier: config:executors.script.au3_lock
  verified_at: 2026-11-03T05:28:35Z
  output: |
    ok   zalo-import-daily.sh: khoá >2h → gỡ lấy lại, nạp bình thường
    ok   apify-facebook-daily.sh: khoá PID sống → không nạp, báo bận
    LOCK PASS

- eval: E6
  run_id: s03-nap-argmax-E6-r3-20261103T052835Z
  exit_code: 0
  baseline: green
  verifier: config:executors.script.snt_mo_coi
  verified_at: 2026-11-03T05:28:36Z
  output: |
    ok   zalo-import-daily.sh (c): .partial vô hình — không log, không chặn
    ok   zalo-import-daily.sh (c): state không nhảy theo .partial
    MO-COI PASS

- eval: E7
  run_id: s03-nap-argmax-E7-r3-20261103T052836Z
  exit_code: 0
  baseline: green
  verifier: config:executors.test.zalo_import_job
  verified_at: 2026-11-03T05:28:37Z
  output: |
    ✔ ZJ-AC-1 mọi bước lành → mã 0, đúng thứ tự năm bước, không JOB FAIL
    ✔ ZJ-AC-3 nạp hỏng (lỗi thường · DB chưa lên) → state giữ mốc cũ, không transform/refresh
    ℹ tests 8 · pass 8 · fail 0

- eval: E8
  run_id: s03-nap-argmax-E8-r3-20261103T052830Z
  exit_code: 0
  baseline: red
  verifier: config:executors.script.s03na_unit
  verified_at: 2026-11-03T05:28:30Z
  output: |
    ✔ nap-argmax: rỗng khi đã có mốc thật → thoát 3, state giữ nguyên (9ms)
    ✔ nap-argmax: rỗng lần đầu chưa có mốc → thoát 0 (20ms)
    ✔ nap-argmax: chạy trọn zalo-import-daily.sh, thư mục rỗng, state có mốc: thoát 3, gỡ khoá, không nạp
    ✔ nap-argmax: chạy trọn apify-facebook-daily.sh, thư mục rỗng, state có mốc: thoát 3, gỡ khoá, không nạp
    ℹ tests 10 · pass 10 · fail 0

## Known limits

## Ngoài hợp đồng

## Analyst

Bằng chứng đã đủ nên Known limits để trống: bốn ca chạy TRỌN bản chép của mỗi script (HOME tạm, node giả, ROOT tạm, thư mục snapshot rỗng và thiếu, state có mốc) kiểm thoát 3, state giữ nguyên từng byte, khoá đã gỡ, không tới bước nạp hay transform. Ca này tái chạy được trong `s03na_unit` (E2, E8), thay cho lần chạy bản sao thủ công của vòng 2.

Đã khai ở Out of scope hoặc là dữ kiện (chuyển từ Known limits của vòng 2, giữ nguyên nội dung):

- `au3 apify` và `au3 chotot` (cùng dòng «lỗi thật được nhận là ECONNREFUSED») đỏ sẵn trên main: đỏ y hệt ở `0d57687f` và ở `ecc80ea3`, không do bản này. Ngoài hợp đồng theo contract. (Vòng 3 không chạy lại.)
- Số tiến trình con mỗi thư mục: vòng lọc dùng basename, sed, grep; vòng nạp dùng basename, sed (chưa kể subshell). Đo chỉ đọc trên cây thật của máy thu ở vòng 2: liệt kê và lọc 11.147 thư mục S03 mất khoảng 73 giây, chưa gồm nạp. Cũ, không gây lỗi; ngoài hợp đồng.
- Cây thật (đo chỉ đọc, chỉ đếm, ở vòng 2): 11.147 thư mục S03, tổng đường dẫn 1.105.625 byte so với ARG_MAX 1.048.576; 0 thư mục `.partial`, 0 thiếu manifest, mọi mốc đúng khuôn; 1.086 mốc mới hơn con trỏ state lúc đó; khuôn `ls` cũ trên cây này không chạy được. Nạp bù chưa làm: là bước triển khai riêng.

Đột biến vòng 3 (bản sao, mỗi lần một script, chạy `scripts/nap-argmax.test.mjs`), cả hai loại đều bị bắt:
- Bỏ dòng `trap` gỡ khoá, thử ở `zalo-import-daily.sh` rồi ở `apify-facebook-daily.sh`: đỏ đúng hai ca chạy trọn của script đó (thư mục rỗng, thiếu thư mục), tám ca còn lại xanh.
- Đổi `exit 3` của nhánh danh sách rỗng thành thoát 0, thử ở cả hai script: đỏ ba ca (ca chạy trọn «thư mục rỗng», «hai khối giống hệt», «rỗng khi đã có mốc»). Ca chạy trọn «thiếu thư mục» vẫn xanh vì đi qua nhánh lỗi `find`, không qua nhánh rỗng; đúng như thiết kế.

Dẫn lại kết quả của vòng 2 (không chạy lại ở vòng 3; mã ba tệp script không đổi từ `92ee45c4`):
- Baseline `0d57687f` với test của nhánh lúc đó: sáu ca, bốn đỏ (khuôn ls còn trong script; vượt ARG_MAX; liệt kê lỗi không thoát 3; rỗng có mốc không thoát 3), hai xanh («hai khối giống hệt» vì cả hai bản cũ chưa có khối mới; «rỗng lần đầu thoát 0» vì ls cũ cũng cho rỗng). Hai ca xanh là bảo vệ chiều should-NOT-fire và so sánh.
- Vòng 2: bốn đột biến bị bắt, gồm bỏ nhánh rỗng (cả hai script), đảo điều kiện lần đầu cũng thoát 3, lệch `TS_RE` giữa hai script (ca hai khối giống hệt), đưa lại `ls -1d` (đỏ năm trên sáu ca).
- Vòng 2: soát `git diff 8b037cf2 92ee45c4 -- scripts/` (cùng khối 7 dòng ở cả hai script) và chạy bản sao ở ROOT tạm: thoát 3, state giữ nguyên, khoá đã gỡ, không bước nạp nào được gọi.

E4, E5, E6, E7 xanh trên baseline: là hồi quy AC-4, chủ ý.

Non-discriminating evals: E4, E5, E6, E7 (hồi quy AC-4 chủ ý, xanh cả hai phía). E1, E2, E3, E8 đỏ trên baseline vòng 2 (phân biệt được).

## Variance

none — every multi-run eval is uniform

## Iterations

Round 1: PASS (không lỗi; một mục ngoài hợp đồng đã trả ZCode).
Round 2: PASS — nhánh danh sách rỗng (AC-5) thêm ở `92ee45c4`; tám eval đạt, bốn đột biến bị bắt; Known limits giữ một mục (chạy trọn script chưa có eval tái chạy được).
Round 3: PASS — thêm bốn ca chạy trọn script; tám eval đạt, hai loại đột biến mới bị bắt; Known limits để trống.

### Re-pin lần 1 — 2026-11-03, do CI Linux: cỡ cây thử trong test theo ARG_MAX, mã script không đổi
run_id: repin-20261103T055406Z-89718
sha: cae5b99b2aa601ac254cb8ab737336763cbdc204 · suites: 6 lệnh exit 0 · evals: 8/8 eval máy đạt kỳ vọng

### Re-pin lần 2 — 2026-11-12, do nhận main 3bfafd37 (sau #426, #423, #431)
run_id: repin-20261112T125131Z-51828
sha: 0f35ee9144b41ddf9f92ae9865ffe53699b762df · suites: 6 lệnh exit 0 · evals: 8/8 eval máy đạt kỳ vọng
