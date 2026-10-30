---
schema_version: 2
feature_slug: s03-null-byte
verdict: PASS
failed_evals: []
reason:
verified_by: feature-loop:cham-lenh
enforcement_mode: strict
bypass_used: false
verified_commit: 339079cdf9c8b8a8ad746a0aaa60343027f09ae1
human_signoff:
---

# Evidence Report: s03-null-byte

Vòng verify 1, cây `339079cd` (nhánh `fix/s03-null-byte`, đã gộp origin/main; merge-base `3c928be7` = origin/main lúc
chấm). DB local :5433 (container `one-invest-db`) đang chạy. Phiên chấm không viết mã này. Khoá s4 do dãy N1 giữ.

Cả 6 eval đều đạt `expected`, kể cả các vế should-NOT-fire. Hàm lọc đúng, gồm cả đệ quy và khoá (E1). Snapshot giả nạp
xanh, ra đúng một dòng, các giá trị là bản gốc bỏ U+0000 (E2). Importer cũ đỏ đúng lỗi 0x00 (E3). Snapshot thật gây
kẹt đã có dòng, và các snapshot sau cũng có (E4). Nạp lại không nhân dòng (E5). Nhánh chỉ đổi các tệp được phép (E6).
Review có một finding thấp về độ lỏng của `scope.sh` với dòng thêm (F1 trong `review-findings.md`). Phiên chấm đã đối
chiếu tay 22 dòng thêm và AC-6 vẫn đúng trên cây thật, nên F1 không chặn. «Ngoài hợp đồng» không có mục nào.

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | script | PASS |
| E2 | AC-2 | script | PASS |
| E3 | AC-3 | script | PASS |
| E4 | AC-4 | script | PASS |
| E5 | AC-5 | script | PASS |
| E6 | AC-6 | script | PASS |

## Evidence

E2 và E5 dùng chung một lượt `s03nb_fix`, mỗi eval có dòng run-log riêng. Mọi lệnh chạy từ gốc worktree. Run-log được
append ngay sau mỗi lệnh, bằng một bọc nhỏ trong scratchpad.

- eval: E1
  run_id: s03-null-byte-E1-r1-20261030T104313Z
  exit_code: 0
  baseline: red
  verifier: config:executors.script.s03nb_unit
  verified_at: 2026-10-30T10:43:13Z
  output: |
    ✔ stripNullBytes: chuỗi có \0 → lọc sạch; mảng/đối tượng đệ quy; phần khác giữ nguyên (0.600375ms)
    ℹ tests 1
    ℹ pass 1
    ℹ fail 0
  note: Baseline dùng `git archive 3c928be7 pipeline` vào scratchpad (`node_modules` là symlink), chép test mới vào và chạy. Kết quả `SyntaxError: The requested module '../import-airbnb.mjs' does not provide an export named 'stripNullBytes'`, `pass 0 / fail 1`, lệnh thoát khác 0. Thay importer bằng bản HEAD trong cùng chỗ đó thì `pass 1 / fail 0`.

- eval: E2
  run_id: s03-null-byte-E2-r1-20261030T104318Z
  exit_code: 0
  baseline: red
  verifier: config:executors.script.s03nb_fix
  verified_at: 2026-10-30T10:43:18Z
  output: |
    lượt 1 exit 0: manifest ok: hanoi__zalo-agent__2026-10-30T000000000 (2 file đã verify) đã nạp: 0 listings (+0 đêm), 0 discovery refs, 0 osm boundaries, 1 zalo posts (1 có media_files), 0 S08 căn (+0 detail bỏ)
    lỗi lượt 1: không
    số dòng: 1
    dòng: bán cănhộ 2PN|NgườiBán|nhómA|http://x.test/ab.jpg|chúthích|n|hanoi__zalo-agent__2026-10-30T000000000
    FIXTURE OK
  note: Dòng đã lọc khớp kỳ vọng ở cả 7 trường, gồm media lồng hai tầng và `media_files[0].snapshotId`. Baseline chạy `fixture.sh` với importer merge-base trong scratchpad: lỗi Postgres `invalid byte sequence for encoding "UTF8": 0x00`, «số dòng: 0», «NẠP ĐỎ», probe thoát khác 0. DB tạm `s03nb_<pid>` đã được trap xoá (`pg_database` không còn `s03nb%`).

- eval: E3
  run_id: s03-null-byte-E3-r1-20261030T104323Z
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.s03nb_base
  verified_at: 2026-10-30T10:43:23Z
  output: |
    lỗi lượt 1: error: invalid byte sequence for encoding "UTF8": 0x00
    số dòng: 0
    dòng:
    NẠP ĐỎ
    BASE OK
  note: Đối chứng âm, và should-NOT-fire trên baseline đạt: importer merge-base đỏ đúng lỗi 0x00. Hai dòng ghi mã thoát của lượt nạp và của fixture được cắt khỏi trích; cả hai mã đều khác 0, đúng ý probe. Bản chép tạm `pipeline/.import-airbnb-base-*.mjs` đã được trap xoá.

- eval: E4
  run_id: s03-null-byte-E4-r1-20261030T104326Z
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.s03nb_real
  verified_at: 2026-10-30T10:43:26Z
  output: |
    snapshot ghi nhận: 1 · dòng của snapshot lỗi: 4 · dòng snapshot sau: 19
    REAL OK
  note: Chỉ đọc DB local. Phiên chấm soát thêm, cũng chỉ đọc. Snapshot `…042737822` trên đĩa có 4 item, U+0000 chỉ ở `payload.text` của 1 item. md5 của `text` trong DB khớp md5 của text gốc bỏ U+0000 ở 4/4 `post_id`. 19 dòng sau mốc thuộc 5 snapshot kế tiếp (`…042837824` → `…043237828`).

- eval: E5
  run_id: s03-null-byte-E5-r1-20261030T104318Z
  exit_code: 0
  baseline: red
  verifier: config:executors.script.s03nb_fix
  verified_at: 2026-10-30T10:43:18Z
  output: |
    lượt 2 exit 0: đã nạp: 0 listings (+0 đêm), 0 discovery refs, 0 osm boundaries, 1 zalo posts (1 có media_files), 0 S08 căn (+0 detail bỏ)
    số dòng: 1
    FIXTURE OK
  note: should-NOT-fire đạt, không có «nạp lại nhân dòng». Importer không có nhánh bỏ qua snapshot đã nạp, nên lượt 2 thật sự đi qua `ON CONFLICT (post_id) DO UPDATE`. Baseline cùng lượt với E2: importer cũ đỏ ở cả hai lượt, «số dòng: 0».

- eval: E6
  run_id: s03-null-byte-E6-r1-20261030T104328Z
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.s03nb_scope
  verified_at: 2026-10-30T10:43:28Z
  output: |
    LO-TRINH.html
    PRODUCT-MAP.md
    _acceptance/config.yaml
    _acceptance/s03-null-byte/contract.md
    _acceptance/s03-null-byte/evals.yaml
    _acceptance/s03-null-byte/probes/baseline.sh
    _acceptance/s03-null-byte/probes/fixture.sh
    _acceptance/s03-null-byte/probes/real.sh
    _acceptance/s03-null-byte/probes/scope.sh
    _acceptance/s03-null-byte/run-log.jsonl
    pipeline/import-airbnb.mjs
    pipeline/scripts/s03-null-byte.test.mjs
    dòng xoá: 9 · dòng thêm: 22
    SCOPE OK
  note: should-NOT-fire đạt: không có «tệp ngoài phạm vi», «dòng xoá ngoài đường S03» hay «chạm nhánh khác». Probe không ràng buộc dòng thêm (F1), nên phiên chấm đã đối chiếu tay. 13 dòng thêm là khối `stripNullBytes`, đặt sau `DB_URL` và ngoài mọi nhánh nguồn. 9 dòng còn lại thay đúng 9 tham số INSERT `stg_zalo_posts`.

Network truth: không có eval `ui-check` nào. Cả 6 eval là `script`, không có đường mạng: n-a (driver).

Kho sạch sau các lượt chạy. `git status` chỉ có run-log.jsonl của hồ sơ này cho tới khi phiên chấm ghi hồ sơ. Không còn
DB tạm `s03nb%` và không còn tệp `pipeline/.import-airbnb-base-*`.

## Known limits

## Ngoài hợp đồng

## Analyst

Non-discriminating evals: none. E1, E2 và E5 đỏ trên baseline. E3, E4 và E6 không đo baseline (lý do dưới).

Baseline khong do:
- E3 (`s03nb_base`): eval này tự là đối chứng âm, chạy importer merge-base. Phép đo baseline của nó trùng chính nó.
- E4 (`s03nb_real`): probe đọc trạng thái DB local sau lượt ZCode chạy thật, không phụ thuộc cây. Phiên chấm thay bằng
  lập luận và đối chiếu: E3 cho thấy importer cũ không nạp nổi chuỗi có `\0`. Snapshot thật có `\0` ở `payload.text`, mà
  DB có đủ 4 dòng với text khớp bản gốc đã bỏ U+0000. Vậy các dòng này chỉ có thể đến từ importer đã lọc.
- E6 (`s03nb_scope`): probe đo danh sách tệp đổi từ merge-base tới HEAD. Trên cây diffBase, phép đo đó rỗng.

Cách đo baseline E1/E2/E5: `git archive 3c928be7 pipeline` vào scratchpad, `node_modules` là symlink về checkout chính,
chép test mới vào. Bản merge-base: test đỏ vì thiếu export, còn fixture đỏ với lỗi 0x00. Thay importer bằng bản `339079cd`
ngay chỗ đó: test xanh và có «FIXTURE OK». Không sửa cây worktree.

Soát độ nới của AC-6 (chi tiết ở F1). Trên clone scratchpad, các đột biến thay dòng ở nhánh Airbnb hay `airbnb_snapshots`,
thêm tệp lạ và sửa tệp sản phẩm khác đều bị bắt. Riêng dòng thêm thuần thì lọt. Cây thật không có dòng thêm nào ngoài
khối hàm và 9 tham số.

Nạp bù sau gộp: quét chỉ đọc 1.368 snapshot S03 từ mốc kẹt cho thấy 11 snapshot có U+0000, tất cả ở `payload.text`. Đó
là trường bản sửa đã lọc. Không ca nào ở `sourceId`, `fetchedAt` hay manifest, nên lượt `zalo-import-daily` sau gộp không
vấp lại kiểu lỗi này ở dữ liệu hiện có.

Phiên chấm không ghi DB dùng chung. Fixture và baseline chỉ ghi DB tạm, còn E4 chỉ đọc.

## Variance

none. 6 eval tất định, mỗi lệnh chạy một lần trên HEAD. E2 và E5 dùng chung một output.

## Iterations

Round 1: 6/6 eval đạt trên `339079cd`. Baseline đỏ ở E1, E2 và E5; E3 là đối chứng âm; E4 và E6 không đo baseline. Một
finding thấp, không chặn: F1, `scope.sh` không ràng buộc dòng thêm; cây thật đã đối chiếu tay. «Ngoài hợp đồng» không có
mục nào. PASS.
