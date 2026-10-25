---
schema_version: 2
feature_slug: test-anh-mau-co-manifest
verdict: PASS
failed_evals: []
reason:
verified_by: feature-loop:cham-lenh
enforcement_mode: strict
bypass_used: false
verified_commit: d00d0f2ff77e991644fe68f3bc59ac758f1d6294
human_signoff:
---

# Evidence Report: test-anh-mau-co-manifest

Vòng verify 1 trên cây `d00d0f2` (nhánh `fix/test-anh-mau-co-manifest`, merge-base = origin/main `1807624`). DB local
:5433 chạy (container `one-invest-db`). Phiên chấm không viết mã này.

Cả 3 eval đều đạt `expected`, kể cả các vế should-NOT-fire. Bộ `node --test scripts/*.test.mjs` xanh 178/178 và không ca
nào bị bỏ qua. Diff ba tệp test chỉ thêm dòng ghi manifest, không xoá hay sửa khẳng định nào. Nhánh chỉ đổi các tệp được
phép. «Ngoài hợp đồng» không có mục nào.

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | test | PASS |
| E2 | AC-2 | script | PASS |
| E3 | AC-3 | script | PASS |

## Evidence

E2 và E3 dùng chung một lượt `tam_khong_noi`. Mỗi eval có dòng run-log riêng.

- eval: E1
  run_id: test-anh-mau-co-manifest-E1-r1-20261025T121809Z
  exit_code: 0
  baseline: red
  verifier: config:executors.test.scripts
  verified_at: 2026-10-25T12:18:09Z
  output: |
    ✔ ZJ-AC-7 sổ vận hành: dòng zalo-import trong bảng job đêm, lệnh grep trỏ đúng log của plist
    ℹ tests 178
    ℹ suites 27
    ℹ pass 178
    ℹ fail 0
    ℹ cancelled 0
    ℹ skipped 0
    ℹ todo 0
  note: chạy hết 26 giây. Trên origin/main, bốn tệp liên quan có ca đỏ. nap-ts-order có «ℹ fail 4» và zalo-import-job có «ℹ fail 5». zalo-import-job-lan có «ℹ fail 1», là ZL-AC-2, ca chạy lại zalo-import-job. job-exit có «ℹ fail 5». Xem Analyst.

- eval: E2
  run_id: test-anh-mau-co-manifest-E2-r1-20261025T121841Z
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.tam_khong_noi
  verified_at: 2026-10-25T12:18:41Z
  output: |
    dòng assert bị xoá/sửa: 0
    dòng thêm: chỉ ghi manifest
    KHONG-NOI OK
  note: should-NOT-fire đạt: không có dòng assert nào bị xoá hay sửa, và output không có «DÒNG THÊM LẠ». Phiên chấm đọc tay toàn bộ diff ba tệp. Có ba dòng `mkdirSync` cũ được tách ra, cộng ba dòng `writeFileSync(…/manifest.json, "{}\n")` và ba dòng chú thích 2510-8. Không đổi `seq`, `expected` hay tên ca nào. Các ca từng đỏ, gồm thứ tự nạp theo mốc ×4, ZJ-AC-1..4 và dãy lời gọi apify-facebook-daily trong job-exit AC-2/AC-3, đều có dấu ✔ trong lượt E1.

- eval: E3
  run_id: test-anh-mau-co-manifest-E3-r1-20261025T121841Z
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.tam_khong_noi
  verified_at: 2026-10-25T12:18:41Z
  output: |
    ok  LO-TRINH.html
    ok  PRODUCT-MAP.md
    ok  _acceptance/config.yaml
    ok  _acceptance/test-anh-mau-co-manifest/contract.md
    ok  _acceptance/test-anh-mau-co-manifest/evals.yaml
    ok  _acceptance/test-anh-mau-co-manifest/probes/khong-noi.sh
    ok  scripts/job-exit.test.mjs
    ok  scripts/nap-ts-order.test.mjs
    ok  scripts/zalo-import-job.test.mjs
  note: should-NOT-fire đạt, không có dòng «NGOÀI PHẠM VI». Không có tệp bọc, importer hay tệp collector nào. Probe đo các commit `merge-base..HEAD`. Tệp duy nhất ngoài commit là run-log.jsonl mới của hồ sơ này.

Network truth: không có eval `ui-check` nào. Ba eval là `test`/`script`, không có đường mạng: n-a (driver).

Kho sạch sau các lượt chạy: `git status` chỉ có run-log.jsonl mới của hồ sơ này. Baseline chạy trong scratchpad, và
worktree tạm đã được gỡ và prune.

## Known limits

## Ngoài hợp đồng

## Analyst

Non-discriminating evals: none — E1 đỏ trên baseline. E2 và E3 không đo baseline, lý do ở dưới.

Baseline khong do:
- E2, E3 (`tam_khong_noi`): probe đo diff `merge-base..HEAD` của nhánh. Trên cây diffBase không có commit nào của nhánh,
  nên phép đo rỗng và in OK suông, không chứng minh gì.

Cách đo baseline E1, theo hai cách:
- Bản chép theo lời giao: rsync `pipeline/` (không node_modules) và `scripts/` của HEAD sang scratchpad, symlink
  `pipeline/node_modules` và `app` về kho, rồi ghi đè ba tệp test bằng `git show origin/main:scripts/<tệp>`. Kết quả:
  nap-ts-order đỏ 4/7, zalo-import-job đỏ 6/7, zalo-import-job-lan đỏ 5/5, job-exit đỏ 5/57. Bản chép không có `.git`,
  nên ZJ-AC-4, ZJ-AC-5 và cả tệp `-lan` đỏ vì «thiếu lịch sử git» hoặc lỗi git worktree. Với ZJ-AC-4, lý do git che mất lý do manifest. Các ca này không đo được trục manifest.
- Để tách bạch, phiên chấm dựng thêm một worktree tách rời tạm tại origin/main `1807624`, có lịch sử git và symlink
  node_modules. Kết quả: nap-ts-order đỏ 4/7, zalo-import-job đỏ 5/7, zalo-import-job-lan đỏ 1/4, job-exit đỏ 5/57.
  Tổng là 15 ca lá đỏ, đều liên quan manifest. 12 ca đỏ trực tiếp, khớp con số 12 của hợp đồng. Bốn ca nap-ts-order
  có thông điệp «script phải xanh», tệp bọc thoát khác 0. ZJ-AC-1, ZJ-AC-2, ZJ-AC-3 và ZJ-AC-4 có lời gọi `[]` hoặc mã
  sai. Ba ca job-exit AC-2 apify-facebook-daily và AC-3 «apify-facebook-daily · lành» cũng đỏ. 3 ca còn lại là ca canh
  phụ thuộc: ZJ-AC-6 «các ca chạy phải đi trước», ZL-AC-2 chạy lại zalo-import-job, và job-exit «ma trận đủ 10 ca»
  với 9/10. Cây HEAD chỉ khác main ở ba dòng ghi manifest, nên chính các dòng đó làm 15 ca này xanh lại.

Kiểm thêm, không phải eval:
- Cổng manifest vẫn có ca canh, chỉ là ở ngoài ba bộ này: `node scripts/au3-nap-bao-loi/acceptance.mjs mo-coi` (khoá
  `snt_mo_coi`) chạy trên HEAD cho `MO-COI PASS`, với ca trẻ dừng chuỗi, ca già đi tiếp và `.partial` vô hình ở cả hai
  tệp bọc. Ba bộ đã sửa vốn không canh cổng, nên thêm manifest không làm mất ca canh nào.
- Manifest `'{}'` đủ cho cổng: tệp bọc chỉ kiểm `-f`. Nếu sau này cổng đọc nội dung manifest, ví dụ `files`/`sha256`,
  ba bộ này sẽ đỏ lại và báo đúng chỗ.
- Bộ lọc «dòng thêm» của probe `khong-noi.sh` khá rộng: nó cho qua mọi dòng chứa `manifest`, `mkdirSync` hoặc
  `const d = `. Vì thế phiên chấm đọc tay diff để xác nhận vế không nới, xem ghi chú E2.

## Variance

none — 3 eval tất định, mỗi lệnh chạy một lần trên HEAD. E2 và E3 dùng chung một output.

## Iterations

Round 1: 3/3 eval đạt trên `d00d0f2`. E1 đỏ trên baseline: 15 ca lá đỏ, trong đó 12 ca trực tiếp, đều do thiếu
manifest. E2 và E3 không đo baseline. «Ngoài hợp đồng» không có mục nào. PASS.
