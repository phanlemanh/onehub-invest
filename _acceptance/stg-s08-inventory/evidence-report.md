---
schema_version: 2
feature_slug: stg-s08-inventory
verdict: BLOCKED
failed_evals: []
reason: "E4 (config:executors.test.pipeline) không chạy được trọn vì môi trường — worktree thiếu agent/node_modules (không nằm trong .worktreeinclude), nên ca AC-1 của pipeline/scripts/entrypoint-symlink.test.mjs đỏ ở dòng tsx (agent/scripts/enrich-revert.ts); suite báo 93/94, ca S08 xanh. Chẩn đoán: worktree tạm cùng HEAD có agent/node_modules thì tệp test đó xanh 4/4. Cách chữa: cung cấp agent/node_modules cho worktree rồi chạy lại E4, không cần sửa code."
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: d00d67a4881cf60807d76368d4b29e6d99357521
human_signoff:
---

# Evidence Report: stg-s08-inventory

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | script | PASS |
| E2 | AC-1 | script | PASS |
| E3 | AC-2 | script | PASS |
| E4 | AC-3 | test | BLOCKED (môi trường: thiếu agent/node_modules) |
| E5 | AC-3 | script | PASS |
| E6 | AC-4 | script | PASS |
| E7 | AC-5 | script | PASS |

## Evidence

- eval: E1
  run_id: stg-s08-inventory-E1-20261024T162831
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.migration_040
  verified_at: 2026-10-24T09:28:31Z
  output: |
    áp 2 lần: ok · schema lần1=53479616e4f98e15f8ea4239b24fc333 lần2=53479616e4f98e15f8ea4239b24fc333 · bảng: stg_s08_inventory · dòng trước: 0 · sau lần1: 0 · sau lần2: 0 · dòng trùng: 0
    IDEMPOTENT PASS

- eval: E2
  run_id: stg-s08-inventory-E2-20261024T162837
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.idempotent_selftest
  verified_at: 2026-10-24T09:28:37Z
  output: |
    lần 2: áp /var/folders/.../nonidem.64HIGsZFC7.sql lỗi (không idempotent)
    SELFTEST PASS: migration không idempotent bị bắt

- eval: E3
  run_id: stg-s08-inventory-E3-20261024T162841
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.s08_shape
  verified_at: 2026-10-24T09:28:41Z
  output: |
    ok   dòng hợp lệ (notSold) vào được
    ok   snapshot không tồn tại → FK từ chối (23503)
    ok   state ngoài {notSold, sold} → CHECK từ chối (23514)
    ok   trùng (source_id, snapshot_id) → khoá từ chối (23505)
    ok   cùng căn ở snapshot sau (sold) vào được — giữ vòng đời
    ok   xoá snapshot → dòng staging của nó xoá theo (ON DELETE CASCADE)
    S08 SHAPE PASS

- eval: E4
  run_id: stg-s08-inventory-E4-20261024T162848
  exit_code: 1
  baseline: n-a
  verifier: config:executors.test.pipeline
  verified_at: 2026-10-24T09:28:48Z
  output: |
    ✖ AC-1 mười hai lối vào chạy qua symlink (1338.669417ms)
    ✔ FILL không chứa bảng staging stg_* nào (0.502792ms)
    ✔ FILL không chứa stg_s08_inventory (S08 chỉ dùng nội bộ — AGENTS.md luật 5, migration 040) (0.047916ms)
    ✔ FILL không chứa raw/registry tầng A (0.046166ms)
    ℹ tests 94
    ℹ pass 93
    ℹ fail 1
    test at scripts/entrypoint-symlink.test.mjs:62:1
      actual: [ 'AC-1 lối vào câm (symlink): agent/scripts/enrich-revert.ts', 'AC-1 lối vào câm (abs): agent/scripts/enrich-revert.ts', 'AC-1 lối vào câm (rel): agent/scripts/enrich-revert.ts' ]
    (chẩn đoán, không phải eval: worktree tạm cùng HEAD d00d67a + symlink agent/node_modules của checkout chính → entrypoint-symlink.test.mjs: tests 4 · pass 4 · fail 0; worktree tạm đã gỡ)

- eval: E5
  run_id: stg-s08-inventory-E5-20261024T162919
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.s08_local_only
  verified_at: 2026-10-24T09:29:19Z
  output: |
    ok   M0 bản gốc: sync-pii.test xanh
    ok   M1 FILL += stg_s08_inventory: sync-pii.test đỏ, ca S08 đỏ
    ok   leak gate: cloud có 3 dòng → báo (stg_s08_inventory=3)
    ok   leak gate: cloud 0 dòng → im (0 vi phạm)
    S08 LOCAL-ONLY PASS

- eval: E6
  run_id: stg-s08-inventory-E6-20261024T162923
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.s08_real_name
  verified_at: 2026-10-24T09:29:23Z
  output: |
    ok   source_registry local có dòng S08 (nguồn tên thật để soát)
    ok   tập soát có migration 040 (8 tệp so origin/main)
    ok   tên thật S08 vắng trong mọi tệp thay đổi (0 tệp trúng)
    ok   đối chứng dương: cấy tên thật vào bản chép migration → bị bắt
    S08 REAL-NAME PASS

- eval: E7
  run_id: stg-s08-inventory-E7-20261024T162931
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.s08_reso
  verified_at: 2026-10-24T09:29:31Z
  output: |
    ok   mappings.yaml có mục sources.S08
    ok   sources.S08.staging = stg_s08_inventory
    ok   có dd-2.1.json để tra
    ok   mục S08 khai 9 field DD
    ok   mọi field DD khai có trong dd-2.1.json (thiếu: 0)
    ok   state → StandardStatus: Active và Closed là giá trị lookup StandardStatus trong DD
    ok   should-NOT-fire: early_payment_price không bị gán field DD bịa — khai «DD không có»
    S08 RESO PASS

## Known limits

- E4: lệnh suite đỏ một ca không liên quan tính năng (`pipeline/scripts/entrypoint-symlink.test.mjs` AC-1, dòng `agent/scripts/enrich-revert.ts` gọi `agent/node_modules/.bin/tsx`). Worktree này không có `agent/node_modules`, mà `.worktreeinclude` chỉ chép `.env`. Nhánh không chạm tệp test này hay `agent/`. Ca S08 trong suite (`FILL không chứa stg_s08_inventory`) chạy và xanh. Đây là lý do verdict BLOCKED, không phải REJECT.
- E1 chạy trên DB local đã có sẵn `stg_s08_inventory` với 0 dòng («dòng trước: 0»). Nhánh «DB chưa có bảng» của AC-1, tức lần áp đầu thật sự tạo bảng, không được thực thi trong vòng này. Phép «số dòng không giảm, 0 dòng trùng» trên bảng 0 dòng là phép đo rỗng. Ngoài ra mã băm schema của `check-idempotent.sh` chỉ phủ cột (`information_schema.columns`), không phủ ràng buộc hay chỉ mục.
- E6 chỉ soát nội dung các tệp A/M trong `origin/main...HEAD`. Nó không soát thông điệp commit, mô tả PR, hay tệp chưa commit (run-log, báo cáo này), dù repo công khai. Token «tên miền không đuôi» bị bỏ nếu ngắn hơn 4 ký tự. Bộ chấm không tự kiểm hai điểm này, để không đọc tên thật ra khỏi DB.
- E7 chỉ rút field đứng ngay sau `"→ `. Field phụ `BuildingName` (dòng `subdivision_name`) không được máy kiểm; tra tay thì `BuildingName` có trong DD 2.1 (resource Property, Building). Phép tra field không phân biệt resource: `ComplexName` chỉ có ở Building, khớp với khai `Building.ComplexName`.
- E5 kiểm leak gate bằng cloud giả, không truy vấn Supabase thật. Phạm vi này đúng như AC-3 viết.
- Cây làm việc có `docs/ROADMAP.md` bị sửa (chưa commit) trong lúc chấm. Lúc phiên bắt đầu cây còn sạch, và bộ chấm không sửa tệp này. Tệp nằm trong `docs/**` (t1_skip), không eval nào đọc tới.

## Ngoài hợp đồng

- Bất kỳ worktree mới nào thiếu `agent/node_modules` thì `executors.test.pipeline` (và mọi làn ghim lại có `executors.test.pipeline` trong `feature_loop.suite_keys`) sẽ đỏ ở `entrypoint-symlink.test.mjs`. Phụ thuộc này chưa được ghi ở chú thích lệnh trong `_acceptance/config.yaml`.
- `db/check-idempotent.selftest.sh` vẫn để sót tệp rỗng do `mktemp -t nonidem` tạo ra trong thư mục tạm của hệ sau mỗi lần chạy, vì trap chỉ xoá `X.sql`. Hồ sơ stg-zalo-media-files đã báo lỗi này. Vô hại.

## Analyst

Non-discriminating evals: không đo baseline trong vòng này. Theo bản chất, E2 là selftest của bộ kiểm, đã có trên main nên sẽ xanh cả hai phía. E4 là lệnh suite hồi quy. Sức phân biệt của AC-3 nằm ở E5 (M1 đỏ).

Baseline khong do:
- E1, E3, E5, E6, E7: `db/migrations/040_stg_s08_inventory.sql` và `pipeline/scripts/check-s08-inventory.mjs` chưa tồn tại trên diffBase (merge-base 91ac403). Đây là eval mới, chạy trên cây cũ không chứng minh gì.
- E2: script có trên diffBase nhưng là selftest của bộ kiểm, không phụ thuộc tính năng. Không đo.
- E4: không đo. Trên worktree này, baseline sẽ vướng cùng lỗi môi trường thiếu `agent/node_modules`.

## Variance

none — every multi-run eval is uniform (không eval nào khai runs > 1)

## Iterations

Round 1: E1, E2, E3, E5, E6, E7 đạt expected trên d00d67a. E4 BLOCKED vì môi trường: worktree thiếu `agent/node_modules`, nên một ca ngoài tính năng trong `pipeline npm test` đỏ, còn ca S08 xanh. Bước tiếp: cấp `agent/node_modules` cho worktree rồi chạy lại E4. Không cần sửa code.
