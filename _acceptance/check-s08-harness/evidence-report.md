---
schema_version: 2
feature_slug: check-s08-harness
verdict: PASS
failed_evals: []
reason:
verified_by: feature-loop:cham-lenh
enforcement_mode: strict
bypass_used: false
verified_commit: 9a6fddd6d7ecdadeebc023b996f52e2694cfe53f
human_signoff:
---

# Evidence Report: check-s08-harness

Vòng verify 1, cây `9a6fddd6` (nhánh `fix/check-s08-harness-import-row`, merge-base `2e25631c`; origin/main lúc chấm
`96c6c4b2`). DB local :5433 chạy. Phiên chấm không viết mã này.

Cả 4 eval đều đạt `expected`, kể cả các vế should-NOT-fire. Bước local-only xanh thật trên cây nhánh (M0 xanh), đột
biến FILL vẫn bị bắt (M1), đối chứng âm cho thấy thiếu `import-s08-row.mjs` là đúng nguyên nhân, và nhánh chỉ đổi
một dòng trong script kiểm cộng hồ sơ và `config.yaml`. «Ngoài hợp đồng» không có mục nào.

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | script | PASS |
| E2 | AC-2 | script | PASS |
| E3 | AC-3 | script | PASS |
| E4 | AC-4 | script | PASS |

## Evidence

E1 và E2 dùng chung một lượt `cs8h_lo`. Mỗi eval có dòng run-log riêng. Dòng `LO OK` chỉ in khi probe thấy đủ bốn
điều: lệnh thoát 0, dòng `S08 LOCAL-ONLY PASS`, dòng M0 «ok» và dòng M1 «ok».

- eval: E1
  run_id: check-s08-harness-E1-r1-20261030T073325Z
  exit_code: 0
  baseline: red
  verifier: config:executors.script.cs8h_lo
  verified_at: 2026-10-30T07:33:25Z
  output: |
    ok   M0 bản gốc: sync-pii.test xanh (exit 0)
    ok   leak gate: cloud có 3 dòng → báo (stg_s08_inventory=3)
    ok   leak gate: cloud 0 dòng → im (0 vi phạm)
    S08 LOCAL-ONLY PASS
    LO OK
  note: baseline đo bằng bản `origin/main` của `pipeline/scripts/check-s08-inventory.mjs` đặt trong một `pipeline/` chép ở scratchpad (bốn tệp nguồn + `lib/` của origin/main, `node_modules` symlink). Bản main cho dòng M0 «SAI», tổng kết local-only báo trượt và lệnh thoát khác 0. Cùng chỗ đó, thay script bằng bản HEAD thì M0 «ok» và PASS. Vậy E1 phân biệt được.

- eval: E2
  run_id: check-s08-harness-E2-r1-20261030T073325Z
  exit_code: 0
  baseline: red
  verifier: config:executors.script.cs8h_lo
  verified_at: 2026-10-30T07:33:25Z
  output: |
    ok   M1 FILL += stg_s08_inventory: sync-pii.test đỏ, ca S08 đỏ
    S08 LOCAL-ONLY PASS
    LO OK
  note: should-fire đạt. Dòng M1 thật còn đuôi ngoặc ghi mã thoát của lượt `node --test` trên bản đột biến (khác 0, đúng ý: test đỏ); đuôi đó được cắt khỏi trích. Ca đỏ là `FILL không chứa stg_s08_inventory`. Trên bản main, M1 cũng «SAI» vì thư mục tạm vỡ ngay lúc nạp module (không có dòng `not ok … stg_s08_inventory`), nên baseline đỏ.

- eval: E3
  run_id: check-s08-harness-E3-r1-20261030T073335Z
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.cs8h_base
  verified_at: 2026-10-30T07:33:35Z
  output: |
    lỗi thư mục tạm: Cannot find module '<mktemp>/import-s08-row.mjs'
    SAI  M0 bản gốc: sync-pii.test xanh
    ok   leak gate: cloud có 3 dòng → báo (stg_s08_inventory=3)
    ok   leak gate: cloud 0 dòng → im (0 vi phạm)
    BASE OK
  note: đối chứng âm. Bản chép script kiểm bỏ `import-s08-row.mjs` khỏi danh sách chép cho M0 «SAI», tổng kết local-only báo trượt và baseline thoát khác 0 — đúng điều probe đòi. Lỗi thư mục tạm nêu đúng `import-s08-row.mjs`. Trích đã rút gọn đường mktemp và cắt đuôi ngoặc mã thoát của dòng M0; dòng M1 baseline cũng «SAI» (không trích).

- eval: E4
  run_id: check-s08-harness-E4-r1-20261030T073339Z
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.cs8h_scope
  verified_at: 2026-10-30T07:33:39Z
  output: |
    _acceptance/check-s08-harness/run-log.jsonl
    _acceptance/config.yaml
    pipeline/scripts/check-s08-inventory.mjs
    -      for (const f of ["sync-cloud.mjs", "sync-pii.test.mjs", "import-airbnb.mjs"]) copyFileSync(join(PIPE, f), join(dir, f));
    +      for (const f of ["sync-cloud.mjs", "sync-pii.test.mjs", "import-airbnb.mjs", "import-s08-row.mjs"]) copyFileSync(join(PIPE, f), join(dir, f));
    SCOPE OK
  note: should-NOT-fire đạt, không có dòng «tệp ngoài phạm vi». Danh sách đủ còn năm tệp `_acceptance/check-s08-harness/{contract.md,evals.yaml,probes/*.sh}`. Tệp ngoài commit duy nhất là run-log.jsonl mới của hồ sơ này. Script kiểm đổi đúng 1 dòng xoá và 1 dòng thêm.

Network truth: không có eval `ui-check` nào. Cả 4 eval là `script`, không có đường mạng: n-a (driver).

Kho sạch sau các lượt chạy: `git status` chỉ có run-log.jsonl mới của hồ sơ này. Baseline và các phép thử răng chạy trên
bản chép trong scratchpad; probe `baseline.sh` tự dựng bản chép script trong `pipeline/scripts/` rồi trap xoá.

## Known limits

## Ngoài hợp đồng

## Analyst

Non-discriminating evals: none — E1 và E2 đỏ trên baseline; E3 và E4 không đo baseline (lý do dưới).

Baseline khong do:
- E3 (`cs8h_base`): bản thân là đối chứng âm dựng trên bản chép script HEAD bỏ đúng tệp được thêm; chạy trên cây
  diffBase thì `sed` không tìm thấy `import-s08-row.mjs` trong danh sách, probe dừng sớm, không chứng minh gì. Phiên
  chấm thay bằng phép đo trực tiếp bản `origin/main` của script (xem note E1): M0 đỏ.
- E4 (`cs8h_scope`): probe đo danh sách tệp đổi `merge-base..HEAD`; trên cây diffBase phép đo rỗng.

Cách đo baseline: dựng `pipeline/` giả trong scratchpad từ `origin/main` (`sync-cloud.mjs`, `sync-pii.test.mjs`,
`import-airbnb.mjs`, `import-s08-row.mjs`, `lib/` qua `git archive`, `node_modules` symlink), đặt
`scripts/check-s08-inventory.mjs` lần lượt bằng bản origin/main rồi bản HEAD, chạy `local-only`. Bản main: M0 và M1
«SAI», tổng kết trượt. Bản HEAD: bốn dòng «ok», `S08 LOCAL-ONLY PASS`. origin/main đã tiến hơn merge-base (PR #199)
nhưng bốn tệp nguồn được chép giống hệt HEAD; `lib/` chỉ thêm `danh-ba-nguoi.mjs` và `vocab.generated.mjs`, không tệp
nào trong chuỗi nạp của `sync-cloud.mjs`. `git merge-tree` HEAD với origin/main sạch.

Thử răng của probe (trên bản chép, không sửa tệp được theo dõi):
- `local-only.sh`: đột biến M1 cấy bảng vô hại `zz_harmless` thay `stg_s08_inventory` → probe đỏ («M1 không bắt
  đột biến»). Chạy trên script của main → probe đỏ («M0 không xanh», «M1 không bắt đột biến»).
- `baseline.sh`: cây nơi `import-airbnb.mjs` không nhập `import-s08-row.mjs` (hình dạng trước 26/10) → bản baseline
  xanh, probe đỏ («baseline phải đỏ», «lỗi không nêu import-s08-row.mjs»).
- `scope.sh` (clone trong scratchpad): thêm tệp untracked ngoài phạm vi → đỏ; sửa `import-s08-row.mjs` → đỏ; đổi
  thêm một dòng trong script kiểm → đỏ («script kiểm đổi hơn một dòng»). Clone lành → SCOPE OK.

Ghi chú điều phối (chép lại): khoá s4 không xin vì vòng này không ghi DB — local-only dùng cloud giả cho leak gate.
Phiên chấm thấy thêm: `sync-pii.test` có một ca chỉ ĐỌC `information_schema` của DB local; không ghi.

## Variance

none — 4 eval tất định, mỗi lệnh chạy một lần trên HEAD. E1 và E2 dùng chung một output.

## Iterations

Round 1: 4/4 eval đạt trên `9a6fddd6`. Baseline đỏ ở E1–E2; E3 là đối chứng âm, E4 không đo baseline. Probe có
răng ở cả ba lệnh. «Ngoài hợp đồng» không có mục nào. PASS.
