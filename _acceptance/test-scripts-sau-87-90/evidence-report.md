---
schema_version: 2
feature_slug: test-scripts-sau-87-90
verdict: PASS
failed_evals: []
reason:
verified_by: feature-loop:cham-lenh
enforcement_mode: strict
bypass_used: false
verified_commit: a9ec31dd0d5402bc993013bd98945e55459590b2
human_signoff:
---

# Evidence Report: test-scripts-sau-87-90

Vòng verify 1, cây `82f08b8` (nhánh `fix/test-scripts-do-sau-87-90`, merge-base `257de57`). DB local :5433 chạy
(container `one-invest-db`). Phiên chấm không viết mã này.

Cả 7 eval đều đạt `expected`, kể cả các vế should-NOT-fire. Hai bộ test `scripts/` xanh hết, không ca nào bị bỏ qua:
check-freshness 39/39 và job-exit 57/57. Hai đột biến bị bắt đúng lý do, job-exit chạy 3 giây, và nhánh chỉ đổi các
tệp được phép. «Ngoài hợp đồng» không có mục nào.

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | script | PASS |
| E2 | AC-2 | script | PASS |
| E3 | AC-3 | script | PASS |
| E4 | AC-4 | script | PASS |
| E5 | AC-5 | script | PASS |
| E6 | AC-6 | script | PASS |
| E7 | AC-7 | script | PASS |

## Evidence

E1, E3 và E5 dùng chung một lượt `tsd_suites`. E2 và E4 dùng chung một lượt `tsd_mut`. Mỗi eval có dòng run-log riêng.
Probe kiểm dấu ✔ của từng ca có tên bằng `grep -qF "✔ <tên ca>"` mà không in ra. Dòng `SUITES OK` chỉ in khi mọi
kiểm đó đạt.

- eval: E1
  run_id: test-scripts-sau-87-90-E1-r1-20261025T064442Z
  exit_code: 0
  baseline: red
  verifier: config:executors.script.tsd_suites
  verified_at: 2026-10-25T06:44:42Z
  output: |
    ℹ tests 39
    ℹ pass 39
    ℹ fail 0
    ℹ skipped 0
    SUITES OK
  note: SUITES OK đòi «✔ GT-AC-1 importer thật nạp lại snapshot S06 cũ → stale, last = finishedAt» và «✔ GT-AC-1 đối chứng: importer thật nạp snapshot thu 10 giờ → fresh». Trên baseline, chính hai ca này mang dấu ✖, bộ báo «ℹ fail 2», và probe in «FRESHNESS ca chưa xanh» cho cả hai.

- eval: E2
  run_id: test-scripts-sau-87-90-E2-r1-20261025T064500Z
  exit_code: 0
  baseline: red
  verifier: config:executors.script.tsd_mut
  verified_at: 2026-10-25T06:45:00Z
  output: |
    M1 bị bắt (captured_at = giờ nạp)
    M2 bị bắt (thiếu import-airbnb trong dãy)
    MUT OK
  note: đối chứng trên bản chép lành xanh. Probe sẽ in «ĐỐI CHỨNG … không xanh» nếu đỏ, và output không có dòng đó. M1 đổi tham số captured_at ở `import-chotot.mjs:112` thành `new Date().toISOString()`, và GT-AC-1 đỏ với thông điệp «importer phải ghi captured_at = finishedAt». Trên baseline, đối chứng freshness đỏ và M1 đỏ sai lý do (khẳng định cũ «captured_at = giờ nạp (thấy null)»), nên không có MUT OK.

- eval: E3
  run_id: test-scripts-sau-87-90-E3-r1-20261025T064442Z
  exit_code: 0
  baseline: red
  verifier: config:executors.script.tsd_suites
  verified_at: 2026-10-25T06:44:42Z
  output: |
    ℹ tests 57
    ℹ pass 57
    ℹ fail 0
    ℹ skipped 0
    SUITES OK
  note: SUITES OK đòi dấu ✔ cho năm ca. Đó là AC-2 apify-facebook-daily mọi bước lành, AC-3 apify-facebook-daily lành, AC-3 apify-facebook-daily DB tắt hẳn, AC-3 ma trận đủ 10 ca, và AC-5 chiều đỏ với bản sao push-ops-facts viết cứng localhost:5433. Trên baseline, bộ báo «ℹ pass 51» và «ℹ fail 6». Bốn trong năm ca trên mang dấu ✖; ca «DB tắt hẳn» xanh suông vì tệp bọc không thấy snapshot nào để nạp.

- eval: E4
  run_id: test-scripts-sau-87-90-E4-r1-20261025T064500Z
  exit_code: 0
  baseline: red
  verifier: config:executors.script.tsd_mut
  verified_at: 2026-10-25T06:45:00Z
  output: |
    M2 bị bắt (thiếu import-airbnb trong dãy)
    MUT OK
  note: should-NOT-fire đạt. Đối chứng «AC-2 apify-facebook-daily mọi bước lành» trên bản chép lành có «ℹ pass 1» và «ℹ fail 0», và output không có dòng «ĐỐI CHỨNG job-exit không xanh». Trên baseline, vế M2 «bị bắt» suông, vì ảnh mẫu cũ sai khuôn nên import-airbnb vốn không được gọi. Chính đối chứng mới phân biệt: nó đỏ trên baseline, với dãy thực tế thiếu import-airbnb.

- eval: E5
  run_id: test-scripts-sau-87-90-E5-r1-20261025T064442Z
  exit_code: 0
  baseline: green
  verifier: config:executors.script.tsd_suites
  verified_at: 2026-10-25T06:44:42Z
  output: |
    job-exit chạy 3s
    SUITES OK
  note: should-NOT-fire đạt, output không có dòng «≥ 60s». Baseline xanh ở vế thời gian (job-exit chạy 2 giây) vì trên main tệp bọc apify không nạp gì nên không có vòng thử lại. Phiên chấm làm thêm phép bỏ đi trên bản chép HEAD, xoá dòng sleep giả: job-exit chạy 103 giây, 57/57 xanh. Vậy N < 60 thật sự nhờ sleep giả. Xem Analyst.

- eval: E6
  run_id: test-scripts-sau-87-90-E6-r1-20261025T064507Z
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.tsd_scope
  verified_at: 2026-10-25T06:45:07Z
  output: |
    ok  LO-TRINH.html
    ok  PRODUCT-MAP.md
    ok  _acceptance/config.yaml
    ok  _acceptance/test-scripts-sau-87-90/contract.md
    ok  _acceptance/test-scripts-sau-87-90/evals.yaml
    ok  _acceptance/test-scripts-sau-87-90/probes/ac7.sh
    ok  _acceptance/test-scripts-sau-87-90/probes/mut.sh
    ok  _acceptance/test-scripts-sau-87-90/probes/scope.sh
    ok  _acceptance/test-scripts-sau-87-90/probes/suites.sh
    ok  scripts/check-freshness.test.mjs
    ok  scripts/job-exit.test.mjs
    SCOPE OK
  note: should-NOT-fire đạt, không có dòng «NGOÀI PHẠM VI». Probe đo các commit `merge-base..HEAD`. Tệp duy nhất ngoài commit là run-log.jsonl mới của hồ sơ này.

- eval: E7
  run_id: test-scripts-sau-87-90-E7-r1-20261025T064507Z
  exit_code: 0
  baseline: green
  verifier: config:executors.script.tsd_ac7
  verified_at: 2026-10-25T06:45:07Z
  output: |
    ℹ pass 5
    ℹ fail 0
    ℹ skipped 0
    literal "chotot-ads": 1 dòng
    mã ống trước khối GT (dòng 358): 0 dòng
    AC7 OK
  note: phiên chấm grep thêm cả `chotot-ads` lẫn `S06_PIPE`. Mọi lần xuất hiện nằm ở dòng 365, 369, 373, 381 và 405, gồm helper `chototSnapshot`, `noS06` và hằng, đều chỉ do GT-AC-1 (dòng 410–443) dùng. Số dòng ngoài khối GT-AC-1 là 0.

Network truth: không có eval `ui-check` nào. Cả 7 eval là `script`, không có đường mạng: n-a (driver).

Kho sạch sau các lượt chạy: `git status` chỉ có run-log.jsonl mới của hồ sơ này. Đột biến và baseline chạy trên bản
chép trong scratchpad (probe `mut.sh` tự dùng `mktemp` và trap xoá).

## Known limits

## Ngoài hợp đồng

## Analyst

Non-discriminating evals:
- **E5 (`tsd_suites`, vế thời gian)**: xanh trên baseline, nhưng không phải vì AC-5 đã đạt. Trên main, ảnh mẫu
  apify sai khuôn TS_RE nên không có lần nạp nào, và vì thế không có vòng thử lại `sleep 20`. Phiên chấm làm phép bỏ
  đi trên bản chép HEAD, xoá đúng dòng sleep giả: job-exit chạy 103 giây, xanh. Với ảnh mẫu mới, eval phân biệt được
  có và không có sleep giả. Cột baseline không thể hiện điều này vì baseline đo cây trước khi sửa ảnh mẫu.
- E7 (`tsd_ac7`) xanh trên baseline: đây là guard hồi quy có chủ ý, vì AC-7 đòi «không nới soát lộ». Trên main
  literal mã ống cũng đúng 1 dòng và nằm sau khối GT.

Baseline khong do:
- E6 (`tsd_scope`): probe đo danh sách tệp đổi `merge-base..HEAD` của nhánh. Trên cây diffBase không có commit nào
  của nhánh nên phép đo rỗng, chạy cũng không chứng minh gì.

Cách đo baseline: rsync `pipeline/` (không node_modules) và `scripts/` của HEAD sang scratchpad, symlink
`pipeline/node_modules` và `app` về kho, rồi ghi đè hai tệp test bằng `git show origin/main:scripts/<tệp>`. origin/main
(`7cef730`) và merge-base `257de57` giống hệt nhau ở hai tệp test, ở `pipeline/`, `scripts/lib/` và tệp bọc apify. Chạy
bốn probe hiện hành với gốc là bản chép đó:
- suites: check-freshness «ℹ fail 2» (hai ca GT-AC-1), job-exit «ℹ fail 6», không có SUITES OK.
- mut: đối chứng freshness và job-exit đều đỏ, M1 đỏ sai lý do, không có MUT OK.
- ac7: AC7 OK.

Kiểm thêm, không phải eval:
- Trục «freshness đo theo giờ thu, không theo captured_at» ban đầu do GT-AC-1 canh. Từ #87 hai giá trị bằng nhau, nên
  GT-AC-1 không còn tự phân biệt được trục này. Đột biến probe S06 của `scripts/lib/freshness.mjs` sang
  `max(c.captured_at)` trên bản chép: GT-AC-4 (S06 tuổi = SLO+1) và GT-AC-8 (ma trận mã → cột) đỏ, «ℹ fail 4».
  Trục vẫn có răng.
- Hai bộ test không xoá thư mục `mkdtemp` của mình (`freshness-gt-*`, `job-exit-*`). Trong `$TMPDIR` hiện có
  73 và 105 thư mục như vậy, khoảng 46 MB. Đây là nếp có sẵn trên main, không do diff này gây ra.
- Chú thích đầu `scripts/lib/freshness.mjs` còn nói importer ghi `now()`. Hợp đồng đã khai mục này ngoài phạm vi.

## Variance

none — 7 eval tất định, mỗi lệnh chạy một lần trên HEAD. Các eval dùng chung lệnh dùng chung một output (E1/E3/E5;
E2/E4).

## Iterations

Round 1: 7/7 eval đạt trên `82f08b8`. Baseline đỏ ở E1–E4. E5 xanh suông trên baseline, nhưng phép bỏ sleep giả cho
103 giây nên eval phân biệt được. E6 không đo baseline, E7 là guard. «Ngoài hợp đồng» không có mục nào. PASS.

### Re-pin lần 1 — 2026-10-25, do gộp main e962e78 sau khi PR #98 xung đột
run_id: repin-20261025T065908Z-19092
sha: 439f324f91f9560f0825bf7bebd7d6bc2cdccae3 · suites: 6 lệnh exit 0 · evals: 7/7 eval máy đạt kỳ vọng

### Re-pin lần 2 — 2026-10-25, do gộp main e6d5d02 sau khi #100 merge
run_id: repin-20261025T071617Z-86152
sha: a9ec31dd0d5402bc993013bd98945e55459590b2 · suites: 6 lệnh exit 0 · evals: 7/7 eval máy đạt kỳ vọng
