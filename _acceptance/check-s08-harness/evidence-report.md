---
schema_version: 2
feature_slug: check-s08-harness
verdict: PASS
failed_evals: []
reason:
verified_by: feature-loop:cham-lenh
enforcement_mode: strict
bypass_used: false
verified_commit: 291440bc26bed8533c1397fea0db47b4512d5b90
human_signoff:
---

# Evidence Report: check-s08-harness

Vòng verify 2, cây `291440bc` (nhánh `fix/check-s08-harness-import-row`, merge-base `9733d2c0` = origin/main lúc chấm,
đã fetch). DB local :5433 chạy. Phiên chấm không viết mã này. Khoá s4 thuộc dãy N1 (người điều phối đã xin trước lượt
chấm).

Cả 4 eval đều đạt `expected`, kể cả các vế should-NOT-fire. Bước local-only xanh thật trên cây nhánh (M0 xanh), đột
biến FILL vẫn bị bắt (M1), đối chứng âm cho thấy thiếu `import-s08-row.mjs` đúng là nguyên nhân. Nhánh chỉ đổi một dòng
trong script kiểm, cộng hồ sơ, `config.yaml` và hai tệp máy sinh mà AC-4 vòng này cho phép. Phiên chấm đã soát độ nới
của AC-4 (xem Analyst): regex mới neo đủ hai đầu, chỉ khớp đúng hai tệp ở gốc kho. «Ngoài hợp đồng» không có mục nào.

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | script | PASS |
| E2 | AC-2 | script | PASS |
| E3 | AC-3 | script | PASS |
| E4 | AC-4 | script | PASS |

## Evidence

E1 và E2 dùng chung một lượt `cs8h_lo`, mỗi eval có dòng run-log riêng. Dòng `LO OK` chỉ in khi probe thấy đủ bốn điều:
lệnh thoát 0, dòng `S08 LOCAL-ONLY PASS`, dòng M0 «ok» và dòng M1 «ok». E1–E3 chạy khi `pipeline/node_modules` là
symlink tạm về checkout chính. Symlink được gỡ trước E4 để danh sách tệp của E4 không lẫn nó.

- eval: E1
  run_id: check-s08-harness-E1-r2-20261030T082343Z
  exit_code: 0
  baseline: red
  verifier: config:executors.script.cs8h_lo
  verified_at: 2026-10-30T08:23:43Z
  output: |
    ok   M0 bản gốc: sync-pii.test xanh (exit 0)
    ok   leak gate: cloud có 3 dòng → báo (stg_s08_inventory=3)
    ok   leak gate: cloud 0 dòng → im (0 vi phạm)
    S08 LOCAL-ONLY PASS
    LO OK
  note: Baseline đo lại ở vòng này bằng `pipeline/` của origin/main `9733d2c0` (git archive vào scratchpad, `node_modules` là symlink). Với script của main, M0 và M1 ra «SAI», tổng kết local-only báo trượt và lệnh thoát khác 0. Cũng ở chỗ đó, khi thay script bằng bản HEAD thì cả bốn dòng ra «ok» và có `S08 LOCAL-ONLY PASS`. Vậy E1 phân biệt được bản sửa với bản cũ.

- eval: E2
  run_id: check-s08-harness-E2-r2-20261030T082343Z
  exit_code: 0
  baseline: red
  verifier: config:executors.script.cs8h_lo
  verified_at: 2026-10-30T08:23:43Z
  output: |
    ok   M1 FILL += stg_s08_inventory: sync-pii.test đỏ, ca S08 đỏ
    S08 LOCAL-ONLY PASS
    LO OK
  note: should-fire đạt. Dòng M1 thật còn một đuôi ngoặc ghi mã thoát của lượt `node --test` trên bản đột biến. Mã đó khác 0, đúng ý (test đỏ); đuôi được cắt khỏi trích. Trên bản main, M1 cũng ra «SAI» vì thư mục tạm vỡ ngay lúc nạp module, nên baseline đỏ.

- eval: E3
  run_id: check-s08-harness-E3-r2-20261030T082351Z
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.cs8h_base
  verified_at: 2026-10-30T08:23:51Z
  output: |
    lỗi thư mục tạm: Cannot find module '<mktemp>/import-s08-row.mjs'
    SAI  M0 bản gốc: sync-pii.test xanh
    ok   leak gate: cloud có 3 dòng → báo (stg_s08_inventory=3)
    ok   leak gate: cloud 0 dòng → im (0 vi phạm)
    BASE OK
  note: Đối chứng âm. Bản chép script kiểm bỏ `import-s08-row.mjs` khỏi danh sách chép thì M0 ra «SAI», tổng kết local-only báo trượt và baseline thoát khác 0, đúng điều probe đòi. Lỗi thư mục tạm nêu đúng `import-s08-row.mjs`. Trong trích, đường mktemp được rút gọn và đuôi ngoặc mã thoát của dòng M0 bị cắt. Dòng M1 của baseline cũng ra «SAI» (không trích). Bản chép tạm `pipeline/scripts/.check-s08-baseline-*.mjs` đã được trap xoá; `git status` sau lượt chạy chỉ còn run-log.

- eval: E4
  run_id: check-s08-harness-E4-r2-20261030T082357Z
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.cs8h_scope
  verified_at: 2026-10-30T08:23:57Z
  output: |
    LO-TRINH.html
    PRODUCT-MAP.md
    _acceptance/check-s08-harness/contract.md
    _acceptance/check-s08-harness/evals.yaml
    _acceptance/check-s08-harness/evidence-report.md
    _acceptance/check-s08-harness/probes/baseline.sh
    _acceptance/check-s08-harness/probes/local-only.sh
    _acceptance/check-s08-harness/probes/scope.sh
    _acceptance/check-s08-harness/review-findings.md
    _acceptance/check-s08-harness/run-log.jsonl
    _acceptance/config.yaml
    pipeline/scripts/check-s08-inventory.mjs
    -      for (const f of ["sync-cloud.mjs", "sync-pii.test.mjs", "import-airbnb.mjs"]) copyFileSync(join(PIPE, f), join(dir, f));
    +      for (const f of ["sync-cloud.mjs", "sync-pii.test.mjs", "import-airbnb.mjs", "import-s08-row.mjs"]) copyFileSync(join(PIPE, f), join(dir, f));
    SCOPE OK
  note: should-NOT-fire đạt, không có dòng «tệp ngoài phạm vi». Ngoài hồ sơ, danh sách chỉ có `_acceptance/config.yaml` (diff là đúng ba khoá `cs8h_*` cộng một dòng chú thích), một dòng ở script kiểm và hai tệp máy sinh ở gốc kho. Script kiểm đổi đúng 1 dòng xoá và 1 dòng thêm. Lượt vòng 1 không có hai tệp máy sinh vì nhánh chưa gộp main.

Network truth: không có eval `ui-check` nào. Cả 4 eval là `script`, không có đường mạng: n-a (driver).

Kho sạch sau các lượt chạy: symlink `pipeline/node_modules` đã gỡ bằng `rm -f` (thư mục đích ở checkout chính còn
nguyên). `git status` chỉ có run-log.jsonl của hồ sơ này cho tới khi phiên chấm ghi hồ sơ.

## Known limits

## Ngoài hợp đồng

## Analyst

Non-discriminating evals: none. E1 và E2 đỏ trên baseline. E3 và E4 không đo baseline (lý do dưới).

Baseline khong do:
- E3 (`cs8h_base`): eval này tự là đối chứng âm, dựng trên bản chép script HEAD bỏ đúng tệp được thêm. Chạy trên cây
  diffBase thì `sed` không tìm thấy `import-s08-row.mjs` trong danh sách và probe dừng sớm, không chứng minh gì. Phiên
  chấm thay bằng phép đo trực tiếp bản `origin/main` của script (xem note E1): M0 đỏ.
- E4 (`cs8h_scope`): probe đo danh sách tệp đổi từ merge-base tới HEAD. Trên cây diffBase, phép đo đó rỗng.

Soát độ nới của AC-4 (commit `291440bc`). Thử trên clone trong scratchpad, checkout `291440bc`, `origin/main` ghim
`9733d2c0`:
- Clone lành ra SCOPE OK.
- Từng tệp untracked sau đều làm probe đỏ với dòng «tệp ngoài phạm vi»: `app/PRODUCT-MAP.md`, `docs/plan/LO-TRINH.html`,
  `PRODUCT-MAP.md.bak`, `xPRODUCT-MAP.md`, `LO-TRINHxhtml`, `PRODUCT-MAPxmd`, `_acceptance/check-s08-harnessX/a.md`,
  `_acceptance/other-slug/contract.md`. Regex neo `^…$`, dấu chấm đã thoát, hai tên mới chỉ khớp ở gốc kho. Không tệp
  nào khác lọt qua phần thêm.
- Sửa mã sản phẩm (`pipeline/import-s08-row.mjs`) vẫn làm probe đỏ.
- Sửa tay nội dung `PRODUCT-MAP.md` thì probe vẫn ra SCOPE OK. AC-4 chỉ xét tên tệp, nên đây là hệ quả có chủ ý của
  việc cho phép. Nội dung hai tệp được CI giữ bằng `node scripts/product-map.mjs --root . --check`
  (`.github/workflows/acceptance-gate.yml`), và hai tệp cũng nằm trong `t1_skip_globs`. Phiên chấm đã chạy `--check` trên
  cây sau khi ghi `machine-cleared`, và cả hai tệp khớp bản sinh. Diff của hai tệp so với main chỉ là mục
  `check-s08-harness`: số «Đã giao» tăng 90 lên 91, thêm một dòng hồ sơ, và đếm «hồ sơ không thuộc kế hoạch» tăng 93 lên 94.
- Khuôn này khớp hồ sơ tiền lệ `test-scripts-sau-87-90` (AC-6, `probes/scope.sh` cho phép đúng `PRODUCT-MAP.md|LO-TRINH.html`).

Cách đo baseline: `git archive 9733d2c0 pipeline` vào scratchpad, với `node_modules` là symlink. Đặt
`scripts/check-s08-inventory.mjs` lần lượt bằng bản origin/main rồi bản `291440bc`, chạy `local-only` mỗi bản. Bản main
cho M0 và M1 «SAI», tổng kết trượt. Bản HEAD cho bốn dòng «ok» và `S08 LOCAL-ONLY PASS`. Merge-base trùng origin/main nên
không có lệch main.

Phiên chấm không ghi DB. Local-only dùng cloud giả cho leak gate; `sync-pii.test` chỉ có một ca ĐỌC `information_schema`.

## Variance

none. 4 eval tất định, mỗi lệnh chạy một lần trên HEAD. E1 và E2 dùng chung một output.

## Iterations

Round 1: 4/4 eval đạt trên `9a6fddd6`. Baseline đỏ ở E1–E2; E3 là đối chứng âm, E4 không đo baseline. Probe có răng
ở cả ba lệnh. «Ngoài hợp đồng» không có mục nào. PASS.

Round 2: nhánh gộp origin/main (tới `9733d2c0`). Sau đó CI bắt sinh lại `PRODUCT-MAP.md` và `LO-TRINH.html`, và repin
đỏ ở E4 vì AC-4 vòng 1 không liệt hai tệp máy sinh. Commit `291440bc` nới AC-4 và `probes/scope.sh` cho đúng hai tệp đó.
Ý «không tệp mã sản phẩm nào» giữ nguyên, và mã sản phẩm không đổi. Kết quả: 4/4 eval đạt trên `291440bc`. Baseline
E1–E2 được đo lại trên main mới và vẫn đỏ. Độ nới của AC-4 đã soát: không tệp ngoài hai tên đó lọt qua. «Ngoài hợp đồng»
không có mục nào. PASS.
