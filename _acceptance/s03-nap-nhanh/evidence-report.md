---
schema_version: 2
feature_slug: s03-nap-nhanh
verdict: PASS
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 3b96b2b1ee2f9b82d2e50989f635961e3fc6d4ae
human_signoff:
---

# Evidence Report: s03-nap-nhanh

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | script | PASS |
| E2 | AC-2 | script | PASS |
| E3 | AC-3 | script | PASS |
| E4 | AC-4 | script | PASS |
| E5 | AC-5 | script | PASS |
| E6 | AC-6 | script | PASS |
| E7 | AC-7 | script | PASS |
| E8 | AC-7 | script | PASS |
| E9 | AC-8 | script | PASS |
| E10 | AC-8 | script | PASS |

Lệnh khác nhau chạy đúng một lần (dedupe): `snn_test` (E1–E7), `snn_syntax` (E8), `snn_regress` (E9), `snn_scope` (E10).
Mọi eval chạy trên bản chép tệp bọc nạp S03 trong cây tạm (node giả đầu PATH, HOME tạm, DATABASE_URL cổng đóng) —
không DB, không launchctl, không snapshot thật. Node v24.21.0.

## Evidence

- eval: E1
  run_id: s03-nap-nhanh-E1-20261110T093719Z
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.snn_test
  verified_at: 2026-11-10T09:37:19Z
  output: |
    ✔ NN-1 lượt nhanh lành: nạp → transform → media → refresh, BỎ đọc gộp + enrich, mã 0, state tiến, nhả khoá (127.00875ms)
    ℹ tests 11
    ℹ pass 11
    ℹ fail 0
    ℹ cancelled 0
    ℹ skipped 0

- eval: E2
  run_id: s03-nap-nhanh-E2-20261110T093719Z
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.snn_test
  verified_at: 2026-11-10T09:37:19Z
  output: |
    ✔ NN-2 lượt 00:00 (không cờ) giữ nguyên: đủ sáu bước, S03_LUOT_NHANH=0, mã 0 (156.231ms)
    ✔ NN-4 đối chứng: lượt 00:00 gặp khoá sống thì CHỜ (không bỏ lượt) rồi thoát 1 khi bận quá trần — hành vi cũ (659.968167ms)
    ℹ pass 11
    ℹ fail 0

- eval: E3
  run_id: s03-nap-nhanh-E3-20261110T093719Z
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.snn_test
  verified_at: 2026-11-10T09:37:19Z
  output: |
    ✔ NN-3 lượt nhanh gặp khoá sống: in «bỏ lượt», mã 0, không bước nào chạy, không đụng state lẫn khoá (14.147416ms)
    ✔ NN-5 lượt nhanh gặp khoá của PID đã chết: dọn khoá rồi chạy lượt bình thường (145.286ms)
    ✔ NN-10 lượt nhanh gặp khoá CŨ >2h mà PID còn sống: bỏ lượt, KHÔNG gỡ khoá (lượt 00:00 nạp dồn còn giữ) (11.465458ms)
    ℹ pass 11
    ℹ fail 0

- eval: E4
  run_id: s03-nap-nhanh-E4-20261110T093719Z
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.snn_test
  verified_at: 2026-11-10T09:37:19Z
  output: |
    ✔ NN-6 lượt nhanh: transform hỏng → mã ≠0 + JOB FAIL, refresh vẫn chạy, vẫn KHÔNG đọc gộp + enrich (130.230458ms)
    ✔ NN-7 lượt nhanh: nạp hỏng → mã 1, state giữ, không bước sau nào chạy (105.424875ms)
    ℹ pass 11
    ℹ fail 0

- eval: E5
  run_id: s03-nap-nhanh-E5-20261110T093719Z
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.snn_test
  verified_at: 2026-11-10T09:37:19Z
  output: |
    ✔ NN-8 hai lượt nhanh chồng nhau: lượt sau bỏ lượt (mã 0, không bước nào), lượt trước chạy trọn; lượt kế sau đó chạy bình thường (3170.040166ms)
    ℹ pass 11
    ℹ fail 0

- eval: E6
  run_id: s03-nap-nhanh-E6-20261110T093719Z
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.snn_test
  verified_at: 2026-11-10T09:37:19Z
  output: |
    ✔ NN-11 cờ lạ (vd --chi-nap của bản cũ) → thoát 2, không bước nào, không đụng state, không lấy khoá (8.739417ms)
    ℹ pass 11
    ℹ fail 0

- eval: E7
  run_id: s03-nap-nhanh-E7-20261110T093719Z
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.snn_test
  verified_at: 2026-11-10T09:37:19Z
  output: |
    ✔ NN-9 plist: 61 mốc mỗi 15′ từ 7:00 tới 22:00, gọi --luot-nhanh, log riêng, không mốc sau 22:00 (4.153459ms)
    ℹ pass 11
    ℹ fail 0
    ℹ skipped 0

- eval: E8
  run_id: s03-nap-nhanh-E8-20261110T093734Z
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.snn_syntax
  verified_at: 2026-11-10T09:37:34Z
  output: |
    pipeline/cron/com.oneinvest.s03-nap-15phut.plist: OK
    SYNTAX OK

- eval: E9
  run_id: s03-nap-nhanh-E9-20261110T093740Z
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.snn_regress
  verified_at: 2026-11-10T09:37:40Z
  output: |
    ✔ PL34-AC-3 dòng job_run trỏ đúng tệp bước có trong kho; đường sai thì đỏ gọi tên (0.715542ms)
    ✔ PL34-AC-4 tập tệp: mọi tệp test nhắc {S03}-import-daily đúng bằng bảy tệp kê trước; thiếu một thì đỏ gọi tên (74.809458ms)
    ℹ tests 123
    ℹ suites 6
    ℹ pass 123
    ℹ fail 0
    ℹ cancelled 0
    ℹ skipped 0
    ℹ duration_ms 74692.353375

- eval: E10
  run_id: s03-nap-nhanh-E10-20261110T093734Z
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.snn_scope
  verified_at: 2026-11-10T09:37:34Z
  output: |
    SCOPE OK
    (diff so với merge-base 1dd31dbb: _acceptance/config.yaml, _acceptance/s03-nap-nhanh/contract.md,
     _acceptance/s03-nap-nhanh/evals.yaml, pipeline/cron/com.oneinvest.s03-nap-15phut.plist,
     scripts/s03-nap-nhanh.test.mjs, scripts/{S03}-import-daily.sh — không dòng NGOAI PHAM VI)

## Known limits

## Ngoài hợp đồng

## Analyst

Non-discriminating evals: không đo được (baseline không chạy ở vòng này).

Baseline khong do:
- E1–E7: tệp `scripts/s03-nap-nhanh.test.mjs` chưa có trên diffBase (merge-base 1dd31dbb) — eval mới, chạy trên code cũ không chứng minh gì.
- E8: plist `pipeline/cron/com.oneinvest.s03-nap-15phut.plist` chưa có trên diffBase.
- E9, E10: không đo — bộ hồi quy và kiểm phạm vi là rào giữ (regression guard), cần một checkout riêng của diffBase mà vòng chấm này không dựng.

Ghi chú người chấm: đã đọc thân các ca NN-1, NN-6, NN-9 — NN-1 khẳng định mọi bước thấy `S03_LUOT_NHANH=1`; NN-6 khẳng
định chuỗi bước đúng bốn bước nhanh (nạp, transform, media, refresh) khi transform hỏng; NN-9 khẳng định đúng dãy 61
mốc 7:00–22:00, có `--luot-nhanh`, không `--chi-nap`, nhãn plist và log riêng, và chạy `plutil -lint`. Khớp AC-1, AC-4, AC-7.

## Variance

none — không eval nào chạy nhiều lần (mọi eval là tất định, runs: 1).

## Iterations

Round 1: cả mười eval đạt (E1–E10). Người chấm: tác tử con ngữ cảnh sạch.
