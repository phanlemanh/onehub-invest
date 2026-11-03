---
schema_version: 2
feature_slug: s03-nap-argmax
verdict: PASS
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 4233eea6122b3999dd5faecf2e6f1c9efbac3856
human_signoff:
---

# Evidence Report: s03-nap-argmax

Vòng verify 1, cây `4233eea6` (nhánh `fix/s03-nap-argmax`, gồm `0fdc00b2` của ZCode và test liên làn). Baseline là `0d57687f`
(main lúc chấm). Phiên chấm không viết mã này. Mọi lệnh chạy từ gốc worktree, run-log được append ngay sau mỗi lệnh.

Cả 7 eval đạt `expected`. Test chạy thật khối liệt kê trên cây giả vượt ARG_MAX: khuôn `ls` cũ thoát 126 trên chính cây đó,
còn khối mới thấy đủ 4.000 bản thu đúng thứ tự mốc, bỏ `.partial`, mốc sai và nguồn khác (E1). Liệt kê lỗi thì thoát 3 và
tệp state giữ nguyên (E2). Không còn khuôn `ls -1d` ở hai script, hai khối giống hệt nhau (E3). Bốn bộ hồi quy luật nạp cũ
đều xanh (E4 đến E7). Trên baseline, ba trong bốn ca của test mới đỏ, đúng ba ca AC-1, AC-2 và nửa chữ của AC-3. Phiên chấm
còn chạy khối liệt kê thật trên `collector/snapshots` qua symlink `~/dev/one-invest` (chỉ đọc): 11.109 bản thu S03, đúng thứ tự,
không `.partial`, không nguồn khác, trong khi khuôn glob cũ vượt ARG_MAX trên cây đó (tổng đường dẫn 1.068.013 byte so với
trần 1.048.576). Có hai phát hiện thấp, không chặn: F1 (trong hợp đồng, AC-3 không bắt lệch `TS_RE` giữa hai script) và F2 (ngoài hợp đồng,
danh sách rỗng vẫn thoát 0). Chi tiết ở `review-findings.md`.

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | script | PASS |
| E2 | AC-2 | script | PASS |
| E3 | AC-3 | script | PASS |
| E4 | AC-4 | script | PASS |
| E5 | AC-4 | script | PASS |
| E6 | AC-4 | script | PASS |
| E7 | AC-4 | script | PASS |

## Evidence

E1, E2 và E3 dùng chung một lượt `s03na_unit` (một lệnh, một lần chạy, 4 ca), mỗi eval có dòng run-log riêng.

- eval: E1
  run_id: s03-nap-argmax-E1-r1-20261103T043831Z
  exit_code: 0
  baseline: red
  verifier: config:executors.script.s03na_unit
  verified_at: 2026-11-03T04:38:31Z
  output: |
    ✔ nap-argmax: vượt ARG_MAX vẫn liệt kê đủ, đúng thứ tự mốc; bỏ .partial và mốc sai (35947ms)
    ℹ tests 4
    ℹ pass 4
    ℹ fail 0
  note: Ca này gồm đối chứng khuôn `ls` cũ thoát 126 trên chính cây thử (4.000 thư mục tên dài 190 ký tự, thêm một `.partial`, một mốc `TEST`, một bản thu nguồn khác), rồi chạy khối liệt kê của CẢ HAI script và đòi đúng 4.000 dòng, đúng thứ tự mốc, chỉ bản thu S03. Baseline (`0d57687f`, chép test vào cây tạm): ca này đỏ vì khối cũ trả 0 dòng thay vì 4.000 mà vẫn thoát 0, đúng triệu chứng lỗi im lặng. Phiên chấm đo thêm trên cây thật chỉ đọc, qua symlink `~/dev/one-invest`: khối mới ra 11.109 bản thu, tất cả bản thu S03, mốc đúng thứ tự (đầu 2026-10-19, cuối 2026-11-03), không thư mục bắt đầu bằng dấu chấm, không dòng bỏ qua do sai khuôn mốc. Bản chạy bằng `/bin/bash` 3.2.57, cùng bản launchd dùng.

- eval: E2
  run_id: s03-nap-argmax-E2-r1-20261103T043831Z
  exit_code: 0
  baseline: red
  verifier: config:executors.script.s03na_unit
  verified_at: 2026-11-03T04:38:31Z
  output: |
    ✔ nap-argmax: liệt kê lỗi thì thoát 3 và không ghi state (10ms)
    ℹ tests 4
    ℹ pass 4
    ℹ fail 0
  note: Ca trỏ ROOT vào thư mục không có, đòi trạng thái thoát 3 và tệp state còn nguyên nội dung cũ, ở cả hai script. Baseline: ca đỏ vì khối cũ thoát 0 thay vì 3. Test chỉ chạy khối trích, không chạy cả script, nên phiên chấm chạy thêm một BẢN SAO `zalo-import-daily.sh` đặt trong thư mục tạm của scratchpad (ROOT tạm không có `collector/snapshots`, không DB, dừng trước mọi bước node): thoát 3, state vẫn là giá trị cũ, thư mục khoá `apify-daily.state.lock` đã được trap gỡ (trong `pipeline/logs` chỉ còn tệp state). `apify-facebook-daily.sh` đặt `trap … EXIT` ở dòng 87, trước nhánh thoát 3 ở dòng 104, và trap xoá `$LOCK_DIR`; chỉ đọc mã, không chạy vì script này mở đầu bằng bước thu gọi mạng.

- eval: E3
  run_id: s03-nap-argmax-E3-r1-20261103T043831Z
  exit_code: 0
  baseline: red
  verifier: config:executors.script.s03na_unit
  verified_at: 2026-11-03T04:38:31Z
  output: |
    ✔ nap-argmax: không còn khuôn ls glob snapshot; find -maxdepth 2 đúng khuôn ở cả hai bản (0.56ms)
    ✔ nap-argmax: khối liệt kê hai bản GIỐNG HỆT nhau (BÁO 2510-5) (0.16ms)
    ℹ pass 4
    ℹ fail 0
  note: Baseline: ca chữ thứ nhất đỏ (còn `ls -1d` và thiếu `find`), ca «giống hệt» xanh vì hai bản cũ vốn giống nhau, nên chỉ nửa đầu của eval này phân biệt được. Ca «giống hệt» là hàng rào hồi quy. Phiên chấm cũng `diff` tay đoạn từ `TS_RE=` đến `done); do` của hai script ở HEAD: giống hệt từng byte. Đột biến cho thấy giới hạn của ca này, xem F1.

- eval: E4
  run_id: s03-nap-argmax-E4-r1-20261103T043836Z
  exit_code: 0
  baseline: green
  verifier: config:executors.script.au3_ts_format
  verified_at: 2026-11-03T04:38:36Z
  output: |
    ok   apify-facebook-daily.sh: nạp đủ ba khuôn tên thật (6 chữ số, 9 chữ số, có -1) đúng thứ tự thời gian
    ok   apify-facebook-daily.sh: should-NOT-fire: tên rác (TEST, thiếu giờ, đuôi lạ) không được nạp
    ok   zalo-import-daily.sh: nạp đủ ba khuôn tên thật (6 chữ số, 9 chữ số, có -1) đúng thứ tự thời gian
    ok   zalo-import-daily.sh: should-NOT-fire: tên rác (TEST, thiếu giờ, đuôi lạ) không được nạp
    TS-FORMAT PASS

- eval: E5
  run_id: s03-nap-argmax-E5-r1-20261103T043847Z
  exit_code: 0
  baseline: green
  verifier: config:executors.script.au3_lock
  verified_at: 2026-11-03T04:38:47Z
  output: |
    ok   zalo-import-daily.sh: không gỡ khoá của job khác
    ok   zalo-import-daily.sh: chạy xong tự gỡ khoá của mình (trap)
    ok   apify-facebook-daily.sh: PID sống → chờ hết lượt, thoát ≠0, KHÔNG nạp
    ok   zalo-import-daily.sh: PID sống → chờ hết lượt, thoát ≠0, KHÔNG nạp
    LOCK PASS

- eval: E6
  run_id: s03-nap-argmax-E6-r1-20261103T043848Z
  exit_code: 0
  baseline: green
  verifier: config:executors.script.snt_mo_coi
  verified_at: 2026-11-03T04:38:48Z
  output: |
    ok   zalo-import-daily.sh (a): nạp snapshot TRƯỚC mồ côi rồi dừng
    ok   zalo-import-daily.sh (b): snapshot SAU mồ côi vẫn được nạp
    ok   zalo-import-daily.sh (c): dir .partial không được nạp
    ok   apify-facebook-daily.sh (c): dir .partial không được nạp
    MO-COI PASS

- eval: E7
  run_id: s03-nap-argmax-E7-r1-20261103T043849Z
  exit_code: 0
  baseline: green
  verifier: config:executors.script.zalo_import_job
  verified_at: 2026-11-03T04:38:49Z
  output: |
    ✔ ZJ-AC-3 nạp hỏng (lỗi thường · DB chưa lên) → mã 1, không transform/refresh, không JOB FAIL, state giữ mốc cũ (276ms)
    ✔ ZJ-AC-5 vòng transform-zalo-boc-job-run (PR #96) không đổi phần nạp làn ZCode (39ms)
    ℹ tests 8
    ℹ pass 8
    ℹ fail 0

Network truth: không có eval `ui-check` nào. Cả 7 eval là `script`, không có đường mạng: n-a (driver).

Kho sạch sau các lượt chạy: `git status` chỉ có run-log.jsonl của hồ sơ này cho tới khi phiên chấm ghi báo cáo. Worktree
baseline tạm (`git worktree`) và các bản sao đột biến trong scratchpad đã được gỡ. Không chạm DB, `collector/snapshots`,
OpenClaw hay launchd; khối liệt kê trên cây thật chỉ gọi `find` và in số đếm.

## Known limits

## Ngoài hợp đồng

- F2 (thấp, không chặn): lỗi im lặng còn sót cùng họ với lỗi đã sửa. `find` chạy được nhưng ra danh sách RỖNG (ROOT sai, thư mục
  `collector/snapshots` bị dọn nhầm) thì vòng lặp rỗng, job vẫn ghi lại state cũ và thoát 0; và lỗi của chuỗi `| sort | while …`
  nằm trong `$(…)` không làm job đỏ (`pipefail` không áp ra ngoài thay thế lệnh). AC-2 chỉ đòi «bước liệt kê lỗi», nên không phải
  lỗi trong hợp đồng. Người ký quyết có xin ZCode thêm nhánh «danh sách rỗng trong khi state đã có mốc thì thoát khác 0» hay không.

## Analyst

Non-discriminating evals: E4, E5, E6 và E7 xanh trên cả nhánh lẫn baseline. Đó là hàng rào hồi quy theo ý hợp đồng (AC-4),
không phải bằng chứng cho tính năng mới. Riêng nửa «hai khối giống hệt» của E3 cũng xanh trên baseline vì hai bản cũ vốn giống
nhau. E1, E2 và nửa đầu E3 đỏ trên baseline, nên tính năng được phân biệt bởi ba ca của test mới.

Baseline khong do: không có mục nào ở trạng thái n-a. Cách đo: `git worktree add --detach` tại `0d57687f` trong scratchpad,
chép `scripts/nap-argmax.test.mjs` của nhánh vào, chạy test mới (4 ca: 1 xanh, 3 đỏ) rồi chạy E4 đến E7 (cả bốn xanh).

Đột biến trên bản sao (không đụng worktree chính), mỗi lần chỉ sửa script rồi chạy `nap-argmax.test.mjs`:
- (a) đưa lại khuôn `ls -1d` glob ở `apify-facebook-daily.sh`: BỊ BẮT, cả 4 ca đỏ.
- (b) bỏ nhánh thoát 3 ở `zalo-import-daily.sh`: BỊ BẮT (ca chữ, ca «giống hệt», ca thoát 3); ca ARG_MAX vẫn xanh, đúng kỳ vọng.
- (b2) giữ dòng báo lỗi nhưng bỏ lệnh thoát 3: BỊ BẮT bởi ca thoát 3 (hành vi: state bị ghi) và ca «giống hệt»; ca chữ không bắt.
- (c) lệch một chữ trong chú thích bên trong khối ở một script: BỊ BẮT, chỉ bởi ca «giống hệt».
- (c2) đổi `-maxdepth 2` thành 3 ở một script: BỊ BẮT bởi ca chữ và ca «giống hệt»; ca hành vi vẫn xanh.
- (c3) lệch `TS_RE` (nằm trên khối so sánh) ở `apify-facebook-daily.sh`: KHÔNG BỊ BẮT, cả 4 ca xanh, và `au3 ts-format`, `mo-coi`
  cũng xanh trên cùng đột biến. Xem F1.
- (d) bỏ `sort` ở `zalo-import-daily.sh`: BỊ BẮT (3 ca đỏ), nhưng do test tách khối theo đúng chuỗi cuối `done | sort | while …`
  nên báo «không tách được khối liệt kê», chứ không phải do kiểm thứ tự mốc.

## Variance

none. 7 eval tất định, mỗi lệnh chạy một lần trên HEAD. E1, E2 và E3 dùng chung một output.

## Iterations

Round 1: 7/7 eval đạt trên `4233eea6`. Baseline đỏ ở ba ca của test mới (AC-1, AC-2, nửa chữ của AC-3); E4 đến E7 xanh trên
cả hai cây (hồi quy). Đột biến: 6/7 bị bắt, riêng lệch `TS_RE` lọt (F1). Hai phát hiện thấp, không chặn (F1, F2). PASS.
