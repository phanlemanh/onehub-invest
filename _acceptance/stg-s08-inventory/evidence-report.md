---
schema_version: 2
feature_slug: stg-s08-inventory
verdict: PASS
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: a42089e75a11fbcaeaea76b35c5bd5d8d668ae32
human_signoff:
---

# Evidence Report: stg-s08-inventory

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | script | PASS |
| E2 | AC-1 | script | PASS |
| E3 | AC-2 | script | PASS |
| E4 | AC-3 | test | PASS |
| E5 | AC-3 | script | PASS |
| E6 | AC-4 | script | PASS |
| E7 | AC-5 | script | PASS |

## Evidence

- eval: E1
  run_id: stg-s08-inventory-E1-20261024T163202
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.migration_040
  verified_at: 2026-10-24T09:32:02Z
  output: |
    áp 2 lần: ok · schema lần1=53479616e4f98e15f8ea4239b24fc333 lần2=53479616e4f98e15f8ea4239b24fc333 · bảng: stg_s08_inventory · dòng trước: 0 · sau lần1: 0 · sau lần2: 0 · dòng trùng: 0
    IDEMPOTENT PASS

- eval: E2
  run_id: stg-s08-inventory-E2-20261024T163202
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.idempotent_selftest
  verified_at: 2026-10-24T09:32:02Z
  output: |
    lần 2: áp /var/folders/.../nonidem.9Jz50x4VkK.sql lỗi (không idempotent)
    SELFTEST PASS: migration không idempotent bị bắt

- eval: E3
  run_id: stg-s08-inventory-E3-20261024T163203
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.s08_shape
  verified_at: 2026-10-24T09:32:03Z
  output: |
    ok   dòng hợp lệ (notSold) vào được
    ok   snapshot không tồn tại → FK từ chối (23503)
    ok   state ngoài {notSold, sold} → CHECK từ chối (23514)
    ok   trùng (source_id, snapshot_id) → khoá từ chối (23505)
    ok   cùng căn ở snapshot sau (sold) vào được — giữ vòng đời
    ok   xoá snapshot → dòng staging của nó xoá theo (ON DELETE CASCADE)
    S08 SHAPE PASS

- eval: E4
  run_id: stg-s08-inventory-E4-20261024T163208
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.pipeline
  verified_at: 2026-10-24T09:32:08Z
  output: |
    ✔ AC-1 mười hai lối vào chạy qua symlink (2287.917875ms)
    ✔ FILL không chứa bảng staging stg_* nào (0.668ms)
    ✔ FILL không chứa stg_s08_inventory (S08 chỉ dùng nội bộ — AGENTS.md luật 5, migration 040) (0.086125ms)
    ℹ tests 94
    ℹ pass 94
    ℹ fail 0
    ℹ cancelled 0
    ℹ skipped 0

- eval: E5
  run_id: stg-s08-inventory-E5-20261024T163220
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.s08_local_only
  verified_at: 2026-10-24T09:32:20Z
  output: |
    ok   M0 bản gốc: sync-pii.test xanh
    ok   M1 FILL += stg_s08_inventory: sync-pii.test đỏ, ca S08 đỏ
    ok   leak gate: cloud có 3 dòng → báo (stg_s08_inventory=3)
    ok   leak gate: cloud 0 dòng → im (0 vi phạm)
    S08 LOCAL-ONLY PASS

- eval: E6
  run_id: stg-s08-inventory-E6-20261024T163220
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.s08_real_name
  verified_at: 2026-10-24T09:32:20Z
  output: |
    ok   source_registry local có dòng S08 (nguồn tên thật để soát)
    ok   tập soát có migration 040 (11 tệp so origin/main)
    ok   tên thật S08 vắng trong mọi tệp thay đổi (0 tệp trúng)
    ok   đối chứng dương: cấy tên thật vào bản chép migration → bị bắt
    S08 REAL-NAME PASS

- eval: E7
  run_id: stg-s08-inventory-E7-20261024T163220
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.s08_reso
  verified_at: 2026-10-24T09:32:20Z
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

- E1 chạy trên DB local đã có sẵn `stg_s08_inventory` với 0 dòng («dòng trước: 0»). Nhánh «DB chưa có bảng» của AC-1 (lần áp đầu tạo bảng thật) không được thực thi trong vòng này. Phép «số dòng không giảm, 0 dòng trùng» trên bảng 0 dòng là phép đo rỗng. Ngoài ra mã băm schema của `check-idempotent.sh` chỉ phủ cột (`information_schema.columns`), không phủ ràng buộc hay chỉ mục.
- E6 soát nội dung 11 tệp thêm/sửa trong `origin/main...HEAD`, kể cả báo cáo và run-log vòng 1 đã commit. Phép soát không phủ thông điệp commit, mô tả PR, hay tệp chưa commit (run-log và báo cáo vòng 2 này), dù repo công khai. Token «tên miền không đuôi» bị bỏ khi ngắn hơn 4 ký tự. Bộ chấm không tự kiểm hai điểm này, để không đọc tên thật ra khỏi DB.
- E7 chỉ rút field đứng ngay sau `"→ `. Field phụ `BuildingName` ở dòng `subdivision_name` không được máy kiểm; tra tay thì `BuildingName` có trong DD 2.1 (resource Property, Building). Phép tra field không phân biệt resource: `ComplexName` chỉ có ở Building, khớp với khai `Building.ComplexName`.
- E5 kiểm leak gate bằng cloud giả, không truy vấn Supabase thật. Phạm vi này đúng như AC-3 viết.

## Ngoài hợp đồng

- `executors.test.pipeline` phụ thuộc ngầm vào `agent/node_modules`: `pipeline/scripts/entrypoint-symlink.test.mjs` gọi `agent/node_modules/.bin/tsx`. Worktree mới không có thư mục này vì `.worktreeinclude` chỉ chép `.env`, và vòng 1 đã vấp đúng chỗ này. Chú thích lệnh trong `_acceptance/config.yaml` chưa ghi phụ thuộc. Mọi làn ghim lại có `executors.test.pipeline` trong `feature_loop.suite_keys` sẽ gặp lại lỗi này trên worktree mới.
- `db/check-idempotent.selftest.sh` vẫn để sót tệp rỗng do `mktemp -t nonidem` tạo ra trong thư mục tạm của hệ sau mỗi lần chạy, vì trap chỉ xoá `X.sql`. Hồ sơ stg-zalo-media-files đã báo lỗi này. Vô hại.

## Analyst

Non-discriminating evals: không đo baseline trong vòng này. Theo bản chất, E2 là selftest của bộ kiểm, đã có trên main nên sẽ xanh cả hai phía. E4 là lệnh suite hồi quy; ca S08 trùng ý với ca có sẵn «FILL không chứa bảng staging stg_* nào». Sức phân biệt của AC-3 nằm ở E5 (M1 đỏ).

Baseline khong do:
- E1, E3, E5, E6, E7: `db/migrations/040_stg_s08_inventory.sql` và `pipeline/scripts/check-s08-inventory.mjs` chưa tồn tại trên diffBase (merge-base 91ac403). Đây là eval mới, chạy trên cây cũ không chứng minh gì.
- E2: script có trên diffBase nhưng là selftest của bộ kiểm, không phụ thuộc tính năng. Không đo.
- E4: không đo trong vòng này.

## Variance

none — every multi-run eval is uniform (không eval nào khai runs > 1)

## Iterations

Round 1 (d00d67a): BLOCKED vì môi trường. Worktree thiếu `agent/node_modules`, nên một ca ngoài tính năng trong `pipeline npm test` đỏ (`entrypoint-symlink.test.mjs` AC-1, dòng tsx); ca S08 xanh, và E1–E3, E5–E7 đạt. Bên điều phối đã chạy `npm ci` trong `agent/`, không sửa code.
Round 2 (a42089e): cả 7 eval đạt expected; E4 xanh 94/94.
