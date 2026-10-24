---
schema_version: 2
feature_slug: stg-s08-inventory
verdict: PASS
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: cf7ea2b3fc6365e2ee5a5290118afdc11ff2d762
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
  run_id: stg-s08-inventory-E1-20261024T163814
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.migration_040
  verified_at: 2026-10-24T09:38:14Z
  output: |
    áp 2 lần: ok · schema lần1=53479616e4f98e15f8ea4239b24fc333 lần2=53479616e4f98e15f8ea4239b24fc333 · bảng: stg_s08_inventory · dòng trước: 0 · sau lần1: 0 · sau lần2: 0 · dòng trùng: 0
    IDEMPOTENT PASS

- eval: E2
  run_id: stg-s08-inventory-E2-20261024T163814
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.idempotent_selftest
  verified_at: 2026-10-24T09:38:14Z
  output: |
    lần 2: áp /var/folders/.../nonidem.R1EzY81ii5.sql lỗi (không idempotent)
    SELFTEST PASS: migration không idempotent bị bắt

- eval: E3
  run_id: stg-s08-inventory-E3-20261024T163815
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.s08_shape
  verified_at: 2026-10-24T09:38:15Z
  output: |
    ok   dòng hợp lệ (notSold) vào được
    ok   snapshot không tồn tại → FK từ chối (23503)
    ok   state ngoài {notSold, sold} → CHECK từ chối (23514)
    ok   trùng (source_id, snapshot_id) → khoá từ chối (23505)
    ok   cùng căn ở snapshot sau (sold) vào được — giữ vòng đời
    ok   xoá snapshot → dòng staging của nó xoá theo (ON DELETE CASCADE)
    S08 SHAPE PASS

- eval: E4
  run_id: stg-s08-inventory-E4-20261024T163820
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.pipeline
  verified_at: 2026-10-24T09:38:20Z
  output: |
    ✔ AC-1 mười hai lối vào chạy qua symlink (1740.277958ms)
    ✔ FILL không chứa bảng staging stg_* nào (0.5925ms)
    ✔ FILL không chứa stg_s08_inventory (S08 chỉ dùng nội bộ — AGENTS.md luật 5, migration 040) (0.062584ms)
    ℹ tests 104
    ℹ pass 104
    ℹ fail 0
    ℹ cancelled 0
    ℹ skipped 0

- eval: E5
  run_id: stg-s08-inventory-E5-20261024T163832
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.s08_local_only
  verified_at: 2026-10-24T09:38:32Z
  output: |
    ok   M0 bản gốc: sync-pii.test xanh
    ok   M1 FILL += stg_s08_inventory: sync-pii.test đỏ, ca S08 đỏ
    ok   leak gate: cloud có 3 dòng → báo (stg_s08_inventory=3)
    ok   leak gate: cloud 0 dòng → im (0 vi phạm)
    S08 LOCAL-ONLY PASS

- eval: E6
  run_id: stg-s08-inventory-E6-20261024T163832
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.s08_real_name
  verified_at: 2026-10-24T09:38:32Z
  output: |
    ok   source_registry local có dòng S08 (nguồn tên thật để soát)
    ok   tập soát có migration 040 (16 tệp so origin/main)
    ok   tên thật S08 vắng trong mọi tệp thay đổi (0 tệp trúng)
    ok   đối chứng dương: cấy tên thật vào bản chép migration → bị bắt
    S08 REAL-NAME PASS

- eval: E7
  run_id: stg-s08-inventory-E7-20261024T163832
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.s08_reso
  verified_at: 2026-10-24T09:38:32Z
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

- E1 chạy trên DB local đã có sẵn `stg_s08_inventory` với 0 dòng («dòng trước: 0»). Nhánh «DB chưa có bảng» của AC-1 (lần áp đầu tạo bảng thật) không được thực thi. Phép «số dòng không giảm, 0 dòng trùng» trên bảng 0 dòng là phép đo rỗng. Mã băm schema của `check-idempotent.sh` chỉ phủ cột (`information_schema.columns`), không phủ ràng buộc hay chỉ mục.
- E5 kiểm leak gate bằng cloud giả, không truy vấn Supabase thật; phạm vi này đúng như AC-3 viết. Sau 07676fe, cloud giả trả rỗng cho truy vấn `information_schema.columns` của `piiColumnLeaks`. Nghĩa là trong E5, nhánh cột người bán luôn được dựng là «cloud sạch»: ca «0 dòng → im» chứng rằng bảng S08 rỗng không gây báo động, nhưng không đo nhánh cột của gate (nhánh đó thuộc hồ sơ soat-tang-a-moi-duong-len-cloud). Bộ chấm đã dò riêng (chẩn đoán, không phải eval): E5 KHÔNG hằng-đúng. Cùng cloud giả đó, bản `sync-cloud.mjs` bị cấy đột biến bỏ vòng nạp bảng `stg_*` trả 0 vi phạm khi có 3 dòng, nên ca «báo khi 3 dòng» sẽ đỏ. Bản gốc với cloud giả có cột lạ `sale_offers.cot_la` vẫn báo «cột ngoài danh sách cho phép», cho thấy trả rỗng là lựa chọn dữ liệu chứ không tắt nhánh. Ca M1 đòi đúng ca S08 đỏ (`not ok …stg_s08_inventory`), nên một lỗi nạp mô-đun làm đỏ cả tệp (như thiếu `lib/`) không thể làm M1 xanh giả.
- E6 soát nội dung 16 tệp thêm/sửa trong `origin/main...HEAD`, kể cả báo cáo và run-log các vòng trước đã commit. Phép soát không phủ thông điệp commit, mô tả PR, hay tệp chưa commit (run-log và báo cáo vòng 3 này), dù repo công khai. Token «tên miền không đuôi» bị bỏ khi ngắn hơn 4 ký tự. `scanSourceNames` nay đi qua `lib/tier-a-guard.mjs` (gập dấu, bản viết liền), và đối chứng dương vẫn bị bắt. Bộ chấm không tự kiểm commit message hay token ngắn, để không đọc tên thật ra khỏi DB.
- E7 chỉ rút field đứng ngay sau `"→ `. Field phụ `BuildingName` ở dòng `subdivision_name` không được máy kiểm; tra tay thì `BuildingName` có trong DD 2.1 (resource Property, Building). Phép tra field không phân biệt resource: `ComplexName` chỉ có ở Building, khớp với khai `Building.ComplexName`.

## Ngoài hợp đồng

- `pipeline/scripts/sync-pii-mutation.mjs` (eval E5 của hồ sơ stg-zalo-media-files, `executors.script.sync_pii_mutation`) hiện ĐỎ trên main. Bộ chấm đã tự xác minh trên worktree tạm detached `origin/main` (eb81b1a), đã gỡ: kết quả «SAI M0 bản gốc: mong XANH → đỏ (pass 0 · fail 1)», MUTATION FAIL. Nguyên nhân: script chỉ chép `sync-cloud.mjs`, `sync-pii.test.mjs`, `import-airbnb.mjs` sang thư mục tạm, không chép `lib/`, mà `sync-cloud.mjs` từ PR #60 nhập `./lib/tier-a-guard.mjs`. Tái dựng tay cho thấy bản chép thiếu `lib/` ném `ERR_MODULE_NOT_FOUND` (tier-a-guard.mjs); thêm symlink `lib/` thì `sync-pii.test.mjs` xanh 7/7. Vì cả tệp test không nạp được, M1 và M2 «đỏ» là đỏ giả: chúng không còn chứng gì về đột biến FILL. Bản ghi re-pin của hồ sơ đó sẽ đỏ. Script này giống hệt giữa nhánh và main; nhánh không sửa nó.
- `executors.test.pipeline` phụ thuộc ngầm vào `agent/node_modules`: `pipeline/scripts/entrypoint-symlink.test.mjs` gọi `agent/node_modules/.bin/tsx`. Worktree mới không có thư mục này vì `.worktreeinclude` chỉ chép `.env`, và vòng 1 đã vấp đúng chỗ này. Chú thích lệnh trong `_acceptance/config.yaml` chưa ghi phụ thuộc.
- `db/check-idempotent.selftest.sh` vẫn để sót tệp rỗng do `mktemp -t nonidem` tạo ra trong thư mục tạm của hệ sau mỗi lần chạy, vì trap chỉ xoá `X.sql`. Hồ sơ stg-zalo-media-files đã báo lỗi này. Vô hại.

## Analyst

Non-discriminating evals: không đo baseline trong vòng này. Theo bản chất, E2 là selftest của bộ kiểm, đã có trên main nên sẽ xanh cả hai phía. E4 là lệnh suite hồi quy; ca S08 trùng ý với ca có sẵn «FILL không chứa bảng staging stg_* nào». Sức phân biệt của AC-3 nằm ở E5 (M1 đỏ; đầu dò đột biến leak gate ở Known limits).

Baseline khong do:
- E1, E3, E5, E6, E7: `db/migrations/040_stg_s08_inventory.sql` và `pipeline/scripts/check-s08-inventory.mjs` chưa tồn tại trên diffBase origin/main (eb81b1a). Đây là eval mới, chạy trên cây cũ không chứng minh gì.
- E2: script có trên diffBase nhưng là selftest của bộ kiểm, không phụ thuộc tính năng. Không đo.
- E4: không đo trong vòng này.

## Variance

none — every multi-run eval is uniform (không eval nào khai runs > 1)

## Iterations

Round 1 (d00d67a): BLOCKED vì môi trường. Worktree thiếu `agent/node_modules`, nên một ca ngoài tính năng trong `pipeline npm test` đỏ; ca S08 xanh, và E1–E3, E5–E7 đạt. Bên điều phối chạy `npm ci` trong `agent/`.
Round 2 (a42089e): PASS, 7/7 eval đạt; E4 xanh 94/94.
Round 3 (cf7ea2b), sau khi merge origin/main (PR #60: `lib/tier-a-guard.mjs`, `piiColumnLeaks` trong leakGate) và sửa `check-s08-inventory.mjs` (07676fe: symlink `lib/` cho bản chép, cloud giả trả rỗng cho truy vấn cột): 7/7 eval đạt; E4 xanh 104/104. Đầu dò xác nhận E5 không hằng-đúng.
