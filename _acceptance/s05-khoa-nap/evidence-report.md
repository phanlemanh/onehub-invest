---
schema_version: 2
feature_slug: s05-khoa-nap
verdict: PASS
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 25127eacf0f06642239e9062bf246d6b5a10be25
human_signoff:
---

# Evidence Report: s05-khoa-nap

Vòng verify 2, cây `3839846d` (nhánh `feat/zcode-gop-0211`, merge-base `cfa59117` = origin/main lúc chấm). Nhánh được dựng lại sau vòng 1, nên mọi eval được chạy lại. Phiên chấm không viết mã này. Không gọi nhà cung cấp thật của S05: test và phép đo chạy trên bản chép trong thư mục tạm.

Cả 6 eval đều đạt `expected`, kể cả vế should-NOT-fire của E3. Lỗi biên của vòng 1 vẫn còn và đã tái hiện trên HEAD: `luc` toàn chữ số có số 0 đầu (ví dụ `09`) làm văng vòng chờ, rồi script ghi đè PID của chủ khoá đang sống (F1). F3 của vòng 1 đã hết. Hai mục Known limits và Ngoài hợp đồng có nội dung, nên hồ sơ này không xanh-sạch và cần người đọc ở Cổng 2.

Tên job và tên bước của S05 trong trích dẫn được che thành `<job-S05>` và `<thu-S05>`, vì tên thật chứa tên nguồn và nhà cung cấp. Ngoài chỗ che đó, trích dẫn giữ nguyên.

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | script | PASS |
| E2 | AC-2 | script | PASS |
| E3 | AC-3 | script | PASS |
| E4 | AC-4 | script | PASS |
| E5 | AC-5 | script | PASS |
| E6 | AC-6 | script | PASS |

## Evidence

E1 tới E5 chạy cùng lệnh `s05k_unit`. Mỗi eval có một lượt chạy và một dòng run-log riêng. Mọi lệnh chạy từ gốc worktree.

- eval: E1
  run_id: s05-khoa-nap-E1-r2-20261102T045602Z
  exit_code: 0
  baseline: red
  verifier: config:executors.script.s05k_unit
  verified_at: 2026-11-02T04:56:02Z
  output: |
    ✔ (1) cửa sổ: plist + mặc định collector đều '5 days' (đệm trên khoảng T6→T3) (2.197958ms)
    ℹ tests 5
    ℹ pass 5
    ℹ fail 0

- eval: E2
  run_id: s05-khoa-nap-E2-r2-20261102T045602Z
  exit_code: 0
  baseline: red
  verifier: config:executors.script.s05k_unit
  verified_at: 2026-11-02T04:56:02Z
  output: |
    ✔ (2)+(3) hành vi khoá: luc rác → gỡ như khoá cũ; PID chết → gỡ; khoá khoẻ → chờ có trần (262.381541ms)
    ℹ tests 5
    ℹ pass 5
    ℹ fail 0
  note: Baseline đỏ ở cùng ca: khối khoá cũ văng ở phép tính khi gặp `luc` rác.

- eval: E3
  run_id: s05-khoa-nap-E3-r2-20261102T045603Z
  exit_code: 0
  baseline: red
  verifier: config:executors.script.s05k_unit
  verified_at: 2026-11-02T04:56:03Z
  output: |
    ✔ (2)+(3) hành vi khoá: luc rác → gỡ như khoá cũ; PID chết → gỡ; khoá khoẻ → chờ có trần (250.599958ms)
    ℹ tests 5
    ℹ pass 5
    ℹ fail 0
  note: should-NOT-fire đạt. Phiên chấm chạy riêng khối khoá: khoá khoẻ dừng ở trần, thư mục khoá còn nguyên, PID không đổi. Baseline «red» là của cả ca chung với E2; vòng này không tách riêng vế khoá khoẻ trên mã cũ.

- eval: E4
  run_id: s05-khoa-nap-E4-r2-20261102T045603Z
  exit_code: 0
  baseline: red
  verifier: config:executors.script.s05k_unit
  verified_at: 2026-11-02T04:56:03Z
  output: |
    ✔ (3b) rm -rf không xoá được → có trần, không quay bận vô hạn (65.762041ms)
    ℹ tests 5
    ℹ pass 5
    ℹ fail 0
  note: Baseline đỏ đúng triệu chứng: mã cũ quay bận tới khi test cắt ở 20 giây.

- eval: E5
  run_id: s05-khoa-nap-E5-r2-20261102T045604Z
  exit_code: 0
  baseline: red
  verifier: config:executors.script.s05k_unit
  verified_at: 2026-11-02T04:56:04Z
  output: |
    ✔ (5) bước thu lỗi → dòng ghim JOB FAIL [<job-S05>] bước <thu-S05> mã N (5.431ms)
    ℹ tests 5
    ℹ pass 5
    ℹ fail 0
  note: Ca (5) chỉ grep nguồn script và chạy `job_step` với lệnh giả, không đo vế «trả khác 0 ở cuối lượt» của AC-5 (F2). Phiên chấm đo riêng vế này, xem Analyst. Cây thật đúng AC-5.

- eval: E6
  run_id: s05-khoa-nap-E6-r2-20261102T045604Z
  exit_code: 0
  baseline: green
  verifier: config:executors.script.s05k_hoiquy
  verified_at: 2026-11-02T04:56:04Z
  output: |
    ✔ cửa sổ mặc định phủ khoảng cách lượt dài nhất của lịch Ba/Sáu (≥ 4 ngày) (0.853542ms)
    ✔ S5-AC-1 bảng SLO hai bản: S05 = 96, các mã khác giữ nguyên (0.545ms)
    ✔ S5-AC-3 biên 96 giờ / 96 giờ 59 phút → fresh, 97 giờ → stale ở cả hai bản; chữ hiển thị nêu SLO mới (0.940834ms)
    ℹ tests 77
    ℹ pass 77
    ℹ fail 0
  note: Lệnh trên HEAD đã bỏ đường không tồn tại mà F3 vòng 1 nêu; cả ba tệp đều có thật.

Network truth: không có eval `ui-check` nào. Cả 6 eval là `script`: n-a (driver).

Các lệnh này không ghi DB. Bản chép và harness nằm trong thư mục tạm, kho không có tệp sản phẩm nào đổi sau các lượt chạy.

## Known limits

- Lỗi biên ở `luc` (F1): kiểm số bằng `^[0-9]+$` để lọt giá trị như `09`, mà `$(( ))` đọc số 0 đầu theo hệ bát phân nên báo `value too great for base`. Đo lại trên khối khoá thật của HEAD, chủ khoá là tiến trình đang sống: vòng chờ bị bỏ, script đi tiếp và ghi đè PID, tức hai job cùng ở trong khoá. AC-2 nói «không phải số», nên eval vẫn đạt. `date +%s` không sinh giá trị này, nên chỉ xảy ra khi tệp hỏng.
- Trần chờ được đo với `sleep` thay bằng no-op và, ở ca (3b), trần hạ từ 60 xuống 5. Không đo thời gian thật 60 × 5 giây.
- Test chỉ chấm khối khoá của script S05. Khối của job nạp S03 không có ca riêng; so `diff` trên HEAD thấy 23 dòng giống hệt, nhưng không có gì giữ hai bản khỏi lệch về sau (F4).
- S05 đang paused và plist chưa cài lại: thay đổi chưa có tác dụng lúc chạy thật, như hợp đồng đã nói.

## Ngoài hợp đồng

- Khoá thiếu cả `pid` lẫn `luc`, hoặc PID còn sống nhưng thiếu `luc`, không bao giờ được gỡ. Mỗi lượt chờ tới trần rồi dừng, cho tới khi có người gỡ tay. Khoá dùng chung nên job nạp S03 đang chạy cũng kẹt theo. Đo lại cả hai ca trên HEAD (N1).

## Analyst

Non-discriminating evals: E6 xanh trên cả nhánh lẫn baseline, đúng ý vì đây là hồi quy. E1 tới E5 đỏ trên baseline, nên phân biệt được.

Cách đo baseline: `git archive cfa59117` trong scratchpad, chép `s05-khoa-nap.test.mjs` vào. `s05k_unit`: pass 0, fail 5. `s05k_hoiquy` dùng tệp test của chính baseline: pass 77, fail 0.

Phép đo thêm của phiên chấm trên HEAD, không thay eval, tất cả trong thư mục tạm với HOME tạm:
- AC-5, vế cuối lượt: chạy script thật (bản chép) với bước thu giả thoát mã 7, các bước sau giả lành, không gọi mạng, không DB. Có dòng ghim `JOB FAIL [<job-S05>] bước <thu-S05> mã 7`, các bước sau vẫn chạy, script thoát mã 7.
- Khối khoá thật qua các ca biên: PID chết + `luc` rác, PID sống + `luc` rác, PID sống + `luc` quá 2 giờ đều gỡ rồi vào khoá; khoá khoẻ dừng ở trần, PID giữ nguyên.
- AC-1: plist và hằng số mặc định của bộ thu đều `5 days`.

## Variance

none — 6 eval tất định; năm lượt `s05k_unit` cho cùng kết quả.

## Iterations

Round 1: 6/6 eval đạt trên cây `ba9601af`, PASS kèm F1 tới F5 không chặn.
Round 2: nhánh dựng lại (bỏ một nhánh khác, gộp main mới), 6/6 eval đạt trên `3839846d`. F3 hết do lệnh `s05k_hoiquy` đã sửa; F1, F2, F4, F5, N1 còn. PASS, kèm Known limits và Ngoài hợp đồng cho người đọc ở Cổng 2.

### Re-pin lần 1 — 2026-11-02, do gộp main, siết bộ dò khong-lo-nguon, sửa fixture AU12 sau vòng chấm
run_id: repin-20261102T053124Z-55269
sha: 25127eacf0f06642239e9062bf246d6b5a10be25 · suites: 6 lệnh exit 0 · evals: 6/6 eval máy đạt kỳ vọng
