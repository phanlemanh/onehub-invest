---
schema_version: 2
feature_slug: backfill-zalo-media-v3
verdict: PASS
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 54720c572ad7b75411e52a2a5949b8f2de34ef6e
human_signoff:
---

# Evidence Report: backfill-zalo-media-v3

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | test | PASS |
| E2 | AC-2 | script | PASS |
| E3 | AC-3 | script | PASS |
| E4 | AC-4 | test | PASS |
| E5 | AC-5 | script | PASS |
| E6 | AC-6 | script | PASS |

## Evidence

- eval: E1
  run_id: backfill-zalo-media-v3-E1-20261023T151751Z
  exit_code: 0
  baseline: red
  verifier: config:executors.test.pipeline
  verified_at: 2026-10-23T15:17:51Z
  output: |
    ✔ mediaSnapshots nhận v2 và v3, bỏ v1, mồ côi và nguồn khác (2.897875ms)
    ✔ postsWithMedia đọc được bài có ảnh trong snapshot v3 (có meta.kev) (2.012417ms)
    ✔ gọi qua symlink (như ~/dev/one-invest) main vẫn chạy — không thoát 0 im lặng (37.251084ms)
    ℹ tests 70
    ℹ pass 70
    ℹ fail 0
    ℹ cancelled 0
    ℹ skipped 0
    ℹ todo 0

- eval: E2
  run_id: backfill-zalo-media-v3-E2-20261023T151757Z
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.zalo_media_roundtrip
  verified_at: 2026-10-23T15:17:57Z
  output: |
    snapshot zalo-agent: 1 (v2+: 1) · bài có ảnh trong raw v2+: 1 · chưa nạp: 1 · stg_zalo_posts có media_files: 0
    ok: backfill --check đỏ khi còn 1 bài có ảnh chưa nạp
    backfill xong: import lại 1 snapshot v2+
    ok: sau backfill, --check xanh (chưa nạp: 0)
    ok: v2 ghi media_files đúng; bài không ảnh = NULL
    ok: nạp lại v2 không nhân đôi (2 dòng)
    ok: v1 nạp được (media_files NULL); bài lặp giữ media_files
    dọn: còn 0 dòng giả
    ROUNDTRIP PASS

- eval: E3
  run_id: backfill-zalo-media-v3-E3-20261023T151759Z
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.zalo_media_backfill
  verified_at: 2026-10-23T15:17:59Z
  output: |
    snapshot zalo-agent: 887 (v2+: 0) · bài có ảnh trong raw v2+: 0 · chưa nạp: 0 · stg_zalo_posts có media_files: 0

- eval: E4
  run_id: backfill-zalo-media-v3-E4-20261023T151800Z
  exit_code: 0
  baseline: red
  verifier: config:executors.test.pipeline
  verified_at: 2026-10-23T15:18:00Z
  output: |
    ✔ mediaSnapshots nhận v2 và v3, bỏ v1, mồ côi và nguồn khác (2.624083ms)
    ✔ postsWithMedia đọc được bài có ảnh trong snapshot v3 (có meta.kev) (1.82175ms)
    ✔ gọi qua symlink (như ~/dev/one-invest) main vẫn chạy — không thoát 0 im lặng (36.909583ms)
    ℹ tests 70
    ℹ pass 70
    ℹ fail 0
    ℹ skipped 0

- eval: E5
  run_id: backfill-zalo-media-v3-E5-20261023T151807Z
  exit_code: 0
  baseline: red
  verifier: config:executors.script.zalo_media_v3_check
  verified_at: 2026-10-23T15:18:07Z
  output: |
    snapshot zalo-agent: 1 (v2+: 1) · bài có ảnh trong raw v2+: 1 · chưa nạp: 1 · stg_zalo_posts có media_files: 0
    ok: v3 có ảnh chưa nạp → --check đỏ (chưa nạp: 1)
    snapshot zalo-agent: 1 (v2+: 1) · bài có ảnh trong raw v2+: 0 · chưa nạp: 0 · stg_zalo_posts có media_files: 0
    ok: v3 không ảnh → --check xanh (chưa nạp: 0)
    V3 CHECK PASS

- eval: E6
  run_id: backfill-zalo-media-v3-E6-20261023T151808Z
  exit_code: 0
  baseline: red
  verifier: config:executors.script.zalo_media_roundtrip
  verified_at: 2026-10-23T15:18:08Z
  output: |
    ok: v1 nạp được (media_files NULL); bài lặp giữ media_files
    snapshot zalo-agent: 3 (v2+: 2) · bài có ảnh trong raw v2+: 2 · chưa nạp: 1 · stg_zalo_posts có media_files: 1
    manifest ok: hanoi__zalo-agent__rt-n1-1792768688464-31919-v3 (2 file đã verify)
    đã nạp: 0 listings (+0 đêm), 0 discovery refs, 0 osm boundaries, 2 zalo posts (1 có media_files)
    backfill xong: import lại 1 snapshot v2+
    ok: v3 có ảnh → --check đỏ; backfill → --check xanh, media_files mang snapshotId v3
    dọn: còn 0 dòng giả
    ROUNDTRIP PASS

## Known limits

- E3 chạy trên snapshot thật nhưng toàn bộ snapshot `zalo-agent` hiện có vẫn là schemaVersion 1 (đếm độc lập vòng 4: 887 manifest, tất cả v1). PL4 đã vào main (importer nhận v3) nhưng collector thật chưa sinh snapshot v2/v3 — việc triển khai PL4, ngoài hợp đồng này. Dòng báo cáo của E3 đúng định dạng `expected` và lệnh thoát mã 0, nhưng AC-3 trên dữ liệu thật chỉ chứng minh lệnh chạy và in đúng dòng, chưa xét được snapshot v2/v3 thật nào. Hành vi v3 được chứng minh trên snapshot dựng giả: E1 (thư mục tạm), E5 (`--check` thật trên DB local), E6 (đầu-cuối qua importer thật). Nên chạy lại `config:executors.script.zalo_media_backfill` sau khi collector :9210 sinh snapshot v3 thật.

## Ngoài hợp đồng

## Analyst

Non-discriminating evals: none — E1, E4, E5, E6 (các eval của tính năng) đều red trên baseline đột biến. E2, E3 không đo baseline (xem dưới); chúng là guard hồi quy/khói, không phải eval phân biệt.

Mọi đột biến vòng 4 làm TẠI CHỖ trên `pipeline/backfill-zalo-media.mjs` của HEAD `54720c5`, mỗi lần khôi phục bằng `cp` từ bản sao lấy trước đột biến; `cmp` khớp từng byte, `git diff --quiet -- pipeline/` sạch, `git status --short` chỉ còn `run-log.jsonl` (tệp hồ sơ, đang append).

- Baseline E6: đổi `>= MEDIA_SCHEMA_MIN` thành `=== 2`, chạy `cd pipeline && node scripts/media-files-roundtrip.mjs` → các bước v2/v1 vẫn qua; ở bước (4) dòng `--check` in `(v2+: 1) · … · chưa nạp: 0` (snapshot v3 bị bỏ qua) và khẳng định «backfill --check phải đỏ khi snapshot v3 còn bài có ảnh chưa nạp» trượt (AssertionError, lệnh thoát khác 0, không in `ROUNDTRIP PASS`). Khối `finally` vẫn dọn: in `dọn: còn 0 dòng giả`; truy vấn độc lập sau đó đếm 0 dòng `stg_zalo_posts`/`airbnb_snapshots` mang tiền tố `rt-n1`/`pl32`.
- Baseline E1 và E5 (cùng đột biến `=== 2`): test `backfill-zalo-media.test.mjs` → hai ca v2/v3 đỏ, ca symlink xanh (pass 1, fail 2); `backfill-v3-check.mjs` thoát khác 0.
- Baseline E4: đổi điều kiện chạy `main` về so chuỗi thô `import.meta.url === pathToFileURL(process.argv[1]).href` → chỉ ca symlink đỏ (pass 2, fail 1).
- Trên diffBase gốc `1682fb5` (đo vòng 1–3) tệp test đỏ cấu trúc vì thiếu export.

Baseline khong do:
- E2: guard hồi quy hành vi v2/v1 (AC-2 nói «giữ như hồ sơ stg-zalo-media-files»); các bước (0)–(3) của roundtrip vẫn qua dưới đột biến `=== 2` như kỳ vọng thiết kế; không đo riêng.
- E3: chạy trên snapshot thật toàn v1; bản cũ in cùng số liệu (`v2+: 0`) nên không phân biệt được gì; không đo.

Rà diff: nhánh rebase lên main `eb61e9d` (là tổ tiên của HEAD). So với main, phần code nhánh chỉ gồm `pipeline/backfill-zalo-media.mjs`, `pipeline/scripts/backfill-zalo-media.test.mjs`, `pipeline/scripts/backfill-v3-check.mjs`, `pipeline/scripts/media-files-roundtrip.mjs`; ba tệp đầu giống hệt vòng 3 (`git diff --quiet e52c31d HEAD` trên ba tệp). Bước (4) mới của roundtrip dựng snapshot v3 (`meta.kev` + `meta.mediaFiles`, bài không ảnh `kev.p = null`) trong cùng thư mục tạm có tiền tố riêng, khẳng định `--check` đỏ với `chưa nạp: 1`, chạy backfill thật qua importer, `--check` xanh với `chưa nạp: 0`, `media_files` của bài có ảnh mang `snapshotId` của snapshot v3 và bài không ảnh NULL — khớp AC-6; dọn qua khối `finally` có sẵn. Không thấy lỗi trong phạm vi hợp đồng, không thấy điều mới ngoài hợp đồng.

## Variance

none — every multi-run eval is uniform

## Iterations

Round 1: E1, E2, E3 xanh nhưng phát hiện chốt «chỉ chạy main khi gọi trực tiếp» so chuỗi thô nên gọi qua symlink thì `--check` thoát 0 im lặng (xanh giả). Trả về thi công.
Round 2: thi công sửa bằng so realpath, thêm AC-4/E4; E1–E4 xanh; E1, E4 red trên baseline đột biến; kiểm tay đường symlink xác nhận đã sửa.
Round 3: thêm AC-5/E5 (nửa đầu PL32, không đổi code backfill); E1–E5 xanh; E5 red trên baseline đột biến `=== 2`.
Round 4: rebase lên main `eb61e9d` (PL4 đã vào: importer nhận v3), thêm AC-6/E6 (nửa sau PL32, ca v3 đầu-cuối trong roundtrip); E1–E6 xanh; E1, E4, E5, E6 red trên baseline đột biến; tệp khôi phục sạch, DB không còn dữ liệu giả.
