---
schema_version: 2
feature_slug: s06-region-tinh
verdict: PASS
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 3839846da7c2e15827e3ffda536a2d7a5a52043b
human_signoff:
---

# Evidence Report: s06-region-tinh

Vòng verify 2, cây `3839846d` (nhánh `feat/zcode-gop-0211`, merge-base `cfa59117` = origin/main lúc chấm). Nhánh được dựng lại sau vòng 1, nên mọi eval được chạy lại. Phiên chấm không viết mã này. DB local :5433 đang chạy. Không gọi API thật của nguồn: lời gọi của bộ thu đi vào máy chủ giả.

Cả 6 eval đều đạt `expected`, kể cả vế should-NOT-fire của E2 và E5. Giới hạn ở AC-5 của vòng 1 vẫn còn và đã đo lại trên HEAD: với snapshot nhiều item, các item đứng trước item thiếu mã vẫn được ghi (Known limits, F1). Người ký cần đọc giới hạn này. Hai mục Known limits và Ngoài hợp đồng có nội dung, nên hồ sơ này không xanh-sạch và cần người đọc ở Cổng 2.

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | script | PASS |
| E2 | AC-2 | script | PASS |
| E3 | AC-3 | script | PASS |
| E4 | AC-4 | script | PASS |
| E5 | AC-5 | script | PASS |
| E6 | AC-6 | script | PASS |

## Evidence

E1, E2, E3 chạy cùng lệnh `s06r_unit`; E4, E5 chạy cùng lệnh `s06r_nap`. Mỗi eval có một lượt chạy và một dòng run-log riêng. Mọi lệnh chạy từ gốc worktree. Trích dẫn lấy từ đầu ra thật; chỉ một chỗ được thay chữ: mã thoát của lượt nạp bên trong probe ở E5 ghi thành `<mã khác 0>`.

- eval: E1
  run_id: s06-region-tinh-E1-r2-20261102T045543Z
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.s06r_unit
  verified_at: 2026-11-02T04:55:43Z
  output: |
    ✔ region (tỉnh): params.region → mọi lời gọi mang region=<mã>, meta mang region (358.041792ms)
    ✔ ưu tiên region khi vùng có cả hai mã (298.6245ms)
    ℹ tests 4
    ℹ pass 4
    ℹ fail 0
  note: Hai ca «region (tỉnh)» và «ưu tiên region» đều xanh, 0 ca đỏ. Baseline không đo bằng lệnh eval, xem Analyst.

- eval: E2
  run_id: s06-region-tinh-E2-r2-20261102T045545Z
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.s06r_unit
  verified_at: 2026-11-02T04:55:45Z
  output: |
    ✔ region_v2 (cũ): HN/HCM/ĐN không đổi hành vi — lời gọi region_v2, meta region_v2 (411.661208ms)
    ℹ tests 4
    ℹ pass 4
    ℹ fail 0
  note: should-NOT-fire đạt: test khẳng định 0 lời gọi có `region`. Thân ca không kiểm meta dù tên ca có nói (F3); phiên chấm đo riêng nửa này, xem Analyst.

- eval: E3
  run_id: s06-region-tinh-E3-r2-20261102T045546Z
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.s06r_unit
  verified_at: 2026-11-02T04:55:46Z
  output: |
    ✔ vùng active thiếu cả hai mã → params-hong, 0 lời gọi cho vùng đó, lượt vẫn chạy vùng khác (364.777125ms)
    ℹ tests 4
    ℹ pass 4
    ℹ fail 0
  note: Vế «0 lời gọi» trong test lỏng (F2). Phiên chấm đếm riêng: 8 lời gọi đều thuộc hai vùng có mã, 0 lời gọi lạ, có dòng params-hong.

- eval: E4
  run_id: s06-region-tinh-E4-r2-20261102T045548Z
  exit_code: 0
  baseline: green
  verifier: config:executors.script.s06r_nap
  verified_at: 2026-11-02T04:55:48Z
  output: |
    có mã: exit 0 · dòng [{"region_v2":2010,"city_code":"vn-hai-phong"}]
    CO MA OK
  note: `region_v2` 2010 lấy từ payload (meta chỉ có `region: 2`), `city_code` lấy từ meta. Importer không đổi ở chiều này, nên baseline xanh là đúng.

- eval: E5
  run_id: s06-region-tinh-E5-r2-20261102T045548Z
  exit_code: 0
  baseline: green
  verifier: config:executors.script.s06r_nap
  verified_at: 2026-11-02T04:55:48Z
  output: |
    thiếu mã: <mã khác 0> · dòng 0
    THIEU MA OK
  note: should-NOT-fire đạt: lượt nạp bên trong dừng với mã khác 0 và 0 dòng; bản thân probe thoát 0. Probe chỉ dùng snapshot một item, xem Known limits.

- eval: E6
  run_id: s06-region-tinh-E6-r2-20261102T045548Z
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.s06r_cong
  verified_at: 2026-11-02T04:55:48Z
  output: |
    ✔ TV2b (c)+(d): S06 — vùng active được thu (kể cả vùng MỚI), vùng paused/retired bị bỏ, nạp theo DB (707.981ms)
    ✔ TV2b (f): trạng thái lạ → chặn (fail-closed) — nguồn lẫn đơn vị (479.981667ms)
    ℹ tests 10
    ℹ pass 10
    ℹ fail 0
  note: Làn hồi quy cổng vòng đời, 10 ca xanh. Baseline không đo, xem Analyst.

Network truth: không có eval `ui-check` nào. Cả 6 eval là `script`: n-a (driver).

Dọn dẹp: `s06r_nap` dùng lược đồ tạm. `s06r_unit` và `s06r_cong` tự tạo một DATABASE tạm rồi xoá (F4), không phải lược đồ tạm. Sau các lượt chạy, đọc `pg_database` và `pg_namespace`: không còn DB `zcode_s06r%`, không còn lược đồ `acc_%` hay `zcode_%`. Không ghi vào bảng thật nào.

Sự cố ghi log của phiên chấm: lượt gọi đầu của bọc chạy eval bị lỗi tách từ, không chạy lệnh nào mà vẫn ghi 6 dòng round 2 với `cmd` rỗng vào `run-log.jsonl`. Phiên chấm gỡ đúng 6 dòng đó rồi chạy thật. Các dòng round 2 còn lại đều là lượt chạy thật; dòng round 1 không đổi.

## Known limits

- AC-5 chỉ được eval chấm trên snapshot một item. Đo lại trên HEAD, lược đồ tạm, snapshot ba item với item giữa thiếu mã: lượt nạp dừng với mã khác 0, lỗi là vi phạm NOT NULL ở cột `region_v2`, bảng stg chỉ có item đầu, item thứ ba bị bỏ, bảng snapshot có 1 dòng cho snapshot lỗi. Vế «không có dòng thiếu mã vùng lọt vào» đúng. Vế «không có dòng nào được ghi» chỉ đúng khi item thiếu mã đứng đầu (F1). Người ký cần chốt cách đọc AC-5.
- Việc API thật vẫn trả `region_v2` trong payload ở chế độ `region` là báo cáo của ZCode, không chấm lại ở đây (hợp đồng đã khai ngoài phạm vi). Nếu giả định này sai, nhánh AC-5 sẽ kích hoạt ở lượt thật đầu tiên.
- `s06r_nap` xanh cả trên baseline: E4 và E5 khoá biên nạp, không chứng minh thay đổi nào của nhánh.
- Vòng này không đo baseline bằng lệnh `s06r_unit` và `s06r_cong`, vì hai lệnh đó cần CREATE DATABASE mà lời giao vòng 2 không cho thêm. Có phép đo thay thế cho hành vi bộ thu, không có cho E6 (mục Analyst).

## Ngoài hợp đồng

- Một lần nạp hỏng ở một vùng dừng cả chuỗi hằng ngày của S06: job hằng ngày đặt cờ lỗi rồi dừng trước transform, nên các vùng đang chạy cũng không được transform trong lượt đó (đọc lại trên HEAD). Hành vi có từ trước, nhưng chế độ `region` thêm một đường mới dẫn tới nó: chỉ cần một tin thiếu `region_v2`. Nên đưa vào lời GIAO bật Hải Phòng và Bình Dương một bước đo payload thật trước khi bật (N1).

## Analyst

Non-discriminating evals: E4, E5 xanh trên cả nhánh lẫn baseline; đây là chủ ý vì hai eval khoá biên nạp mà hợp đồng nói importer không đổi. E1, E2, E3, E6 là n-a ở vòng này.

Baseline khong do: E1, E2, E3 (`s06r_unit`) và E6 (`s06r_cong`). Lý do: lệnh tự CREATE DATABASE, lời giao vòng 2 không cho tạo thêm trong phép đo baseline. E4, E5 đo bằng `git archive cfa59117` trong scratchpad, chép probe vào: cả hai dòng OK.

Phép đo thay thế, chạy bộ thu thật với máy chủ giả trên lược đồ tạm (không tạo DATABASE), ba vùng active (chỉ `region_v2`, có cả hai mã, thiếu cả hai), không thay eval:
- HEAD: bộ thu thoát 0, có dòng params-hong. 8 lời gọi: 4 `region_v2=12000`, 4 `region=2`, 0 `region_v2=2100`, 0 lời gọi lạ. Meta vùng cũ có `region_v2`, không có `region`. Meta vùng có cả hai mã có `region`, không có `region_v2`. Hai điều này lấp các chỗ test lỏng ở F2 và F3.
- Baseline `cfa59117`: 8 lời gọi, 0 `region=2`, 4 `region_v2=2100`; meta vùng có cả hai mã không có `region`. Tức mã cũ bỏ qua `params.region`, nên AC-1 phân biệt được thay đổi của nhánh.

## Variance

none — mỗi eval tất định; ba lượt `s06r_unit` và hai lượt `s06r_nap` cho cùng kết quả.

## Iterations

Round 1: 6/6 eval đạt trên cây `ba9601af`, PASS kèm F1, F2, F3 không chặn.
Round 2: nhánh dựng lại (bỏ một nhánh khác, gộp main mới), 6/6 eval đạt trên `3839846d`. Mã bộ thu, importer, test và probe của hồ sơ không đổi so với vòng 1. F1, F2, F3, N1 còn; thêm F4. PASS, kèm Known limits và Ngoài hợp đồng cho người đọc ở Cổng 2.
