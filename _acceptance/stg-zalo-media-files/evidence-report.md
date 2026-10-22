---
schema_version: 2
feature_slug: stg-zalo-media-files
verdict: PASS
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: df529723aa72d1057d1a0f4c4277800e961e6f0e
human_signoff: Mạnh 2026-10-23
---

# Evidence Report: stg-zalo-media-files

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | script | PASS |
| E2 | AC-1 | script | PASS |
| E3 | AC-2 | script | PASS |
| E4 | AC-3 | test | PASS |
| E5 | AC-3 | script | PASS |
| E6 | AC-4 | script | PASS |

## Evidence

- eval: E1
  run_id: stg-zalo-media-files-E1-20261023T060433
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.migration_035
  verified_at: 2026-10-22T23:04:33Z
  output: |
    áp 2 lần: ok · schema lần1=e4a57104e3f8c11aa90b297a2250480d lần2=e4a57104e3f8c11aa90b297a2250480d · bảng: stg_zalo_posts · dòng trước: 1876 · sau lần1: 1876 · sau lần2: 1876 · dòng trùng: 0
    IDEMPOTENT PASS

- eval: E2
  run_id: stg-zalo-media-files-E2-20261023T060441
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.idempotent_selftest
  verified_at: 2026-10-22T23:04:41Z
  output: |
    lần 2: áp /var/folders/.../nonidem.w3fANdSM8a.sql lỗi (không idempotent)
    SELFTEST PASS: migration không idempotent bị bắt
    (kiểm thêm sau lần chạy: 0 bảng acc_nonidem_* còn lại trong DB local)

- eval: E3
  run_id: stg-zalo-media-files-E3-20261023T060448
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.zalo_media_roundtrip
  verified_at: 2026-10-22T23:04:48Z
  output: |
    ok: backfill --check đỏ khi còn 1 bài có ảnh chưa nạp
    đã nạp: 0 listings (+0 đêm), 0 discovery refs, 0 osm boundaries, 2 zalo posts (1 có media_files)
    backfill xong: import lại 1 snapshot v2
    ok: sau backfill, --check xanh (chưa nạp: 0)
    ok: v2 ghi media_files đúng; bài không ảnh = NULL
    ok: nạp lại v2 không nhân đôi (2 dòng)
    ok: v1 nạp được (media_files NULL); bài lặp giữ media_files
    dọn: còn 0 dòng giả
    ROUNDTRIP PASS

- eval: E4
  run_id: stg-zalo-media-files-E4-20261023T060455
  exit_code: 0
  baseline: green
  verifier: config:executors.test.pipeline
  verified_at: 2026-10-22T23:04:55Z
  output: |
    ✔ không bảng nào trong FILL có cột ảnh media/media_files (schema DB local) (32.0185ms)
    ✔ mediaFilesOf: gắn snapshotId vào từng phần tử, giữ nguyên field hợp đồng (0.188834ms)
    ✔ mediaFilesOf: v1 / không ảnh / mảng rỗng → null (SQL NULL, COALESCE giữ bản cũ) (0.091125ms)
    ℹ tests 23
    ℹ pass 23
    ℹ fail 0
    ℹ cancelled 0
    ℹ skipped 0

- eval: E5
  run_id: stg-zalo-media-files-E5-20261023T060501
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.sync_pii_mutation
  verified_at: 2026-10-22T23:05:01Z
  output: |
    ok   M0 bản gốc: mong XANH → xanh (ℹ pass 6 · ℹ fail 0 · ℹ skipped 0)
    ok   M1 FILL += stg_zalo_posts: mong ĐỎ → đỏ (ℹ pass 3 · ℹ fail 3 · ℹ skipped 0)
    ok   M2 FILL += stg_zalo_posts, chỉ ca schema DB: mong ĐỎ → đỏ (ℹ pass 0 · ℹ fail 1 · ℹ skipped 0)
    MUTATION PASS

- eval: E6
  run_id: stg-zalo-media-files-E6-20261023T060509
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.zalo_media_backfill
  verified_at: 2026-10-22T23:05:09Z
  output: |
    snapshot zalo-agent: 301 (v2: 0) · bài có ảnh trong raw v2: 0 · chưa nạp: 0 · stg_zalo_posts có media_files: 0

## Known limits

- AC-4 trên dữ liệu thật là phép đo rỗng: 301 snapshot zalo-agent, 0 snapshot v2, 0 bài có ảnh, 0 dòng mang media_files. E6 chứng được báo cáo in đủ các số và `--check` xanh, nhưng không chứng được backfill nạp đúng ảnh thật. Nửa dương (backfill ghi, `--check` xanh sau nạp) và nửa âm (`--check` đỏ khi còn bài chưa nạp) chỉ được chứng trên snapshot giả ở E3.
- E6 chỉ chạy `backfill-zalo-media.mjs --check`, không chạy lượt backfill ghi trước đó như AC-4 mô tả («chạy backfill rồi --check»). Với 0 snapshot v2 thì lượt ghi không có việc gì để làm, nên kết quả hiện tại không đổi; khi có snapshot v2 thật thì eval này chỉ đo, không nạp.
- AC-1 nhánh «DB chưa có cột media_files»: E1 chạy trên DB local đã có cột (lần áp 1 không đổi schema). Nhánh ADD COLUMN thật trên DB chưa có cột không được thực thi trong vòng này; lệnh dùng `ADD COLUMN IF NOT EXISTS` nên rủi ro thấp, nhưng bằng chứng máy chỉ phủ nhánh «đã có».
- DB local :5433 dùng chung với ống thu. Lúc chạy, stg_zalo_posts giữ nguyên 1876 dòng trước và sau E1, nên không có ghi chen; các eval khác dùng tiền tố riêng và E3 báo dọn còn 0 dòng giả.
- E4 xanh cả trên main (baseline green): bản thân lệnh suite không phân biệt tính năng. Sức phân biệt của AC-3 nằm ở E5 (đột biến M1/M2 đỏ).

## Ngoài hợp đồng

- `db/check-idempotent.selftest.sh`: `mktemp -t nonidem` tạo tệp X rồi script ghi vào `X.sql`; trap chỉ xoá `X.sql`, tệp X rỗng còn sót lại trong thư mục tạm của hệ mỗi lần chạy. Vô hại, chỉ báo.

## Analyst

Non-discriminating evals: E4 — green trên main (17/17) vì `npm test` của main chưa chứa `sync-pii.test.mjs`; đây là lệnh suite hồi quy, ca mới chỉ có trên nhánh. AC-3 được phân biệt bằng E5 (M0 xanh, M1 và M2 đỏ).

Baseline khong do:
- E1, E2: `db/check-idempotent.sh`, `db/check-idempotent.selftest.sh` và `db/migrations/035_stg_zalo_media_files.sql` chưa tồn tại trên diffBase main (605a837) — eval mới, chạy trên cây cũ không chứng minh gì.
- E3: `pipeline/scripts/media-files-roundtrip.mjs` và `pipeline/backfill-zalo-media.mjs` chưa tồn tại trên main.
- E5: `pipeline/scripts/sync-pii-mutation.mjs` và `pipeline/sync-pii.test.mjs` chưa tồn tại trên main.
- E6: `pipeline/backfill-zalo-media.mjs` chưa tồn tại trên main.
- E4 đo được: worktree tạm của main (detached 605a837) ngoài repo, symlink `pipeline/node_modules`, chạy `npm test` → green; worktree đã gỡ bằng `git worktree remove --force`.

## Variance

none — every multi-run eval is uniform (không eval nào khai runs > 1)

## Iterations

Round 1: E1–E6 đều đạt expected trên df52972; không eval nào trượt.
