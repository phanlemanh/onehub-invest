---
schema_version: 2
feature_slug: backfill-zalo-media-v3
verdict: PASS
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: e52c31ded452b12d5c36e035652a94f67de40e97
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

## Evidence

- eval: E1
  run_id: backfill-zalo-media-v3-E1-20261023T102600Z
  exit_code: 0
  baseline: red
  verifier: config:executors.test.pipeline
  verified_at: 2026-10-23T10:26:00Z
  output: |
    ✔ mediaSnapshots nhận v2 và v3, bỏ v1, mồ côi và nguồn khác (2.287459ms)
    ✔ postsWithMedia đọc được bài có ảnh trong snapshot v3 (có meta.kev) (1.755875ms)
    ✔ gọi qua symlink (như ~/dev/one-invest) main vẫn chạy — không thoát 0 im lặng (35.668334ms)
    ℹ tests 55
    ℹ pass 55
    ℹ fail 0
    ℹ cancelled 0
    ℹ skipped 0
    ℹ todo 0

- eval: E2
  run_id: backfill-zalo-media-v3-E2-20261023T102601Z
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.zalo_media_roundtrip
  verified_at: 2026-10-23T10:26:01Z
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
  run_id: backfill-zalo-media-v3-E3-20261023T102603Z
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.zalo_media_backfill
  verified_at: 2026-10-23T10:26:03Z
  output: |
    snapshot zalo-agent: 721 (v2+: 0) · bài có ảnh trong raw v2+: 0 · chưa nạp: 0 · stg_zalo_posts có media_files: 0

- eval: E4
  run_id: backfill-zalo-media-v3-E4-20261023T102604Z
  exit_code: 0
  baseline: red
  verifier: config:executors.test.pipeline
  verified_at: 2026-10-23T10:26:04Z
  output: |
    ✔ mediaSnapshots nhận v2 và v3, bỏ v1, mồ côi và nguồn khác (2.640959ms)
    ✔ postsWithMedia đọc được bài có ảnh trong snapshot v3 (có meta.kev) (1.655209ms)
    ✔ gọi qua symlink (như ~/dev/one-invest) main vẫn chạy — không thoát 0 im lặng (34.608875ms)
    ℹ tests 55
    ℹ pass 55
    ℹ fail 0
    ℹ skipped 0

- eval: E5
  run_id: backfill-zalo-media-v3-E5-20261023T102605Z
  exit_code: 0
  baseline: red
  verifier: config:executors.script.zalo_media_v3_check
  verified_at: 2026-10-23T10:26:05Z
  output: |
    snapshot zalo-agent: 1 (v2+: 1) · bài có ảnh trong raw v2+: 1 · chưa nạp: 1 · stg_zalo_posts có media_files: 0
    ok: v3 có ảnh chưa nạp → --check đỏ (chưa nạp: 1)
    snapshot zalo-agent: 1 (v2+: 1) · bài có ảnh trong raw v2+: 0 · chưa nạp: 0 · stg_zalo_posts có media_files: 0
    ok: v3 không ảnh → --check xanh (chưa nạp: 0)
    V3 CHECK PASS

## Known limits

- E3 chạy trên snapshot thật nhưng toàn bộ snapshot `zalo-agent` hiện có vẫn là schemaVersion 1 (vòng 1 đếm độc lập 717 manifest, tất cả v1; lúc E3 vòng 3 chạy là 721, vẫn `v2+: 0`). Dòng báo cáo đúng định dạng `expected` và lệnh thoát mã 0, nhưng AC-3 trên dữ liệu thật chỉ chứng minh lệnh chạy và in đúng dòng, chưa xét được snapshot v2/v3 thật nào. Phần phân biệt v2/v3 do E1 (thư mục tạm) và E5 (snapshot v3 cấy, `--check` thật trên DB local) gánh. Nửa sau PL32 (backfill thật một snapshot v3 rồi `--check` xanh) đã khai Out of scope, chờ PL4.

## Ngoài hợp đồng

## Analyst

Non-discriminating evals: none — E1, E4, E5 (các eval của tính năng) đều red trên baseline. E2, E3 không đo baseline (xem dưới); chúng là guard hồi quy/khói, không phải eval phân biệt.

Baseline E1 (diffBase `1682fb5`): test mới chạy trên bản cũ đỏ vì bản cũ không export `MEDIA_SCHEMA_MIN`/`mediaSnapshots`/`postsWithMedia` (đỏ cấu trúc, đo ở vòng 1–2). Đột biến hành vi trên bản HEAD, đo lại vòng 3 trong thư mục tạm — đổi lọc về `schemaVersion === 2` → hai ca v2/v3 đỏ, ca symlink xanh (pass 1, fail 2).

Baseline E4: đột biến trên bản HEAD, đo lại vòng 3 trong thư mục tạm — đổi điều kiện «chạy khi gọi trực tiếp» về so chuỗi thô `import.meta.url === pathToFileURL(process.argv[1]).href` (bản c1da5df) → chỉ ca symlink đỏ (pass 2, fail 1).

Baseline E5: đột biến TẠI CHỖ `pipeline/backfill-zalo-media.mjs` — `>= MEDIA_SCHEMA_MIN` thành `=== 2` — rồi chạy `cd pipeline && node scripts/backfill-v3-check.mjs`: dòng `--check` của snapshot v3 có ảnh in `(v2+: 0) · … · chưa nạp: 0` và khẳng định «--check phải đỏ» trượt (AssertionError, lệnh thoát khác 0, không in `V3 CHECK PASS`). Sau đó khôi phục bằng `git checkout -- pipeline/backfill-zalo-media.mjs`; `cmp` với bản sao trước đột biến khớp từng byte, `git status --short` chỉ còn hai tệp chưa track của hồ sơ (`evidence-report.md`, `run-log.jsonl`) — phần code sạch. Mọi thư mục tạm đã dọn.

Baseline khong do:
- E2: guard hồi quy hành vi v2/v1 (AC-2 nói «giữ như hồ sơ stg-zalo-media-files»), ghi dữ liệu giả vào DB local; trên bản cũ nó được kỳ vọng xanh theo thiết kế nên không đo.
- E3: chạy trên snapshot thật toàn v1; bản cũ sẽ in cùng số liệu (v2: 0) nên không phân biệt được gì; không đo.

Rà diff `66ef3cb..HEAD`: `pipeline/backfill-zalo-media.mjs` không đổi; `pipeline/scripts/backfill-v3-check.mjs` mới cấy hai snapshot v3 (có `meta.kev`, manifest đủ sha) vào thư mục tạm có tiền tố riêng mỗi lần chạy, gọi `backfill-zalo-media.mjs --check` thật, chỉ đọc DB, luôn dọn thư mục tạm trong `finally`. Khẳng định khớp `expected` của E5 (cả ca should-NOT-fire). Không thấy lỗi trong phạm vi hợp đồng, không thấy điều mới ngoài hợp đồng.

## Variance

none — every multi-run eval is uniform

## Iterations

Round 1: E1, E2, E3 xanh nhưng phát hiện chốt «chỉ chạy main khi gọi trực tiếp» so chuỗi thô nên gọi qua symlink thì `--check` thoát 0 im lặng (xanh giả). Trả về thi công.
Round 2: thi công sửa bằng so realpath (66ef3cb), thêm AC-4/E4; E1–E4 xanh; E1, E4 red trên baseline đột biến; kiểm tay đường symlink xác nhận đã sửa.
Round 3: thêm AC-5/E5 (nửa đầu PL32, e52c31d, không đổi code backfill); E1–E5 xanh; E5 red trên baseline đột biến `=== 2`, tệp khôi phục sạch.
