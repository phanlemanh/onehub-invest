---
schema_version: 2
feature_slug: cong-tac-that
verdict: PASS
failed_evals: []
reason:
verified_by: feature-loop:cham-lenh
enforcement_mode: strict
bypass_used: false
verified_commit: 4819c9ceb992643c00d90dad5df0f834daf688bc
human_signoff: Mạnh 2026-10-31
---

# Evidence Report: cong-tac-that

Vòng verify 4 chạy trên cây `fcbdb1af`, nhánh `claude/acceptance-cong-tac-that`. Mạnh đồng ý mở vòng này sau ba vòng REJECT
(dòng revisit `d-20261031T012039Z-1`). Phiên chấm không viết mã này và không sửa tệp sản phẩm, test hay probe. Mỗi lệnh eval
chạy một lần với timeout công cụ 600 giây, và không lệnh nào bị công cụ ngắt. E1–E6 và E8 dùng chung một lượt `ctt_unit`.
Đối chứng AC-9 chạy cùng lệnh trên worktree sạch ở merge-base mới `993d7394`, mượn node_modules qua symlink.

Đã sửa so với vòng 3:
- **E10 (AC-9)**: `cd pipeline && npm test` xanh 307/307. Ca «AC-3 không còn khuôn cũ» của `entrypoint-symlink.test` xanh. Ở
  `scripts/au3-nap-bao-loi/acceptance.mjs`, hai module giả nay nhận diện CLI bằng `process.argv.length`, không còn khuôn
  `process.argv[1]`. Các dòng còn lại có `argv` chỉ là `argv[2]` hoặc chú thích. Main `993d7394` xanh 299/299. Phần nhánh thêm
  là 8 ca: mười ca TV2b trừ hai ca của `s05-paused.test.mjs` đã xoá.
- Harness au3 vẫn đúng hành vi: `au3_chotot` xanh 11/11 (CHOTOT PASS). Vong-doi giả chỉ in-và-thoát khi chạy như CLI
  (`node vong-doi.mjs S06`, có ba phần tử argv). Bước `node --input-type=module -e` của chotot-daily import nó với một phần tử
  argv nên không vào nhánh đó.
- Chữ `expected` của `khoa-nap-s05-paused` E4 đã đổi sang «S05 nguon-paused — bỏ qua thu». Chữ này khớp với dòng probe đang in.

Từ vòng 3 tới nay, delta của nhánh trên merge-base không đổi ngoài bốn chỗ sau: hai dòng argv và hai dòng chú thích của chúng,
chữ E4 của kns, và một dòng revisit kns. Phiên chấm so diff `25ce701b..59652aaf` với diff `993d7394..HEAD` (bỏ hồ sơ cong-tac-that
và hai tệp máy sinh). Commit gộp `1feeb90a` không đưa thay đổi nào khác vào tệp nhánh.

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | test | PASS |
| E2 | AC-2 | test | PASS |
| E3 | AC-3 | test | PASS |
| E4 | AC-4 | test | PASS |
| E5 | AC-5 | test | PASS |
| E6 | AC-6 | test | PASS |
| E7 | AC-7 | script | PASS |
| E8 | AC-7 | test | PASS |
| E9 | AC-8 | script | PASS |
| E10 | AC-9 | test | PASS |
| E11 | AC-9 | script | PASS |

## Evidence

- eval: E1
  run_id: cong-tac-that-E1-20261031T015039Z
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.ctt_unit
  verified_at: 2026-10-31T01:50:39Z
  output: |
    ✔ TV2b (a): S05 paused → 0 lời gọi, thoát 0, một dòng mã + lý_do (388.751375ms)
    ✔ TV2b (nửa dương): S05 active + nhóm active → lời gọi tới nhà cung cấp giả đúng nhóm active (485.339791ms)
    ℹ tests 10
    ℹ pass 10
    ℹ fail 0
  note: Không đổi từ vòng 2. Ca (a) thoát 0, có một dòng «S05 … — bỏ qua thu» với `nguon-paused`, và 0 lời gọi. Nửa dương có lời
    gọi cho nhóm active và không có lời gọi cho nhóm paused.

- eval: E2
  run_id: cong-tac-that-E2-20261031T015039Z
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.ctt_unit
  verified_at: 2026-10-31T01:50:39Z
  output: |
    ✔ TV2b (b): S05 active nhưng 0 nhóm active → 0 lượt, KHÔNG fallback, thoát 0 (380.326167ms)
    ℹ pass 10
    ℹ fail 0
  note: E9 xác nhận không còn danh sách dự phòng.

- eval: E3
  run_id: cong-tac-that-E3-20261031T015039Z
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.ctt_unit
  verified_at: 2026-10-31T01:50:39Z
  output: |
    ✔ TV2b (c)+(d): S06 — vùng active được thu (kể cả vùng MỚI), vùng paused/retired bị bỏ, nạp theo DB (983.8115ms)
    ℹ pass 10
    ℹ fail 0
  note: Test không đổi từ vòng 3. Nửa «được nạp» chạy `chotot-daily.sh` thật trên cây tạm, có `vong-doi.mjs` thật và DB tạm, và
    đòi danh sách nạp đúng `["hanoi","da-nang"]`. Vòng 3 đã thử chiều đỏ và ca đỏ.

- eval: E4
  run_id: cong-tac-that-E4-20261031T015039Z
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.ctt_unit
  verified_at: 2026-10-31T01:50:39Z
  output: |
    ✔ TV2b (c)+(d): S06 — vùng active được thu (kể cả vùng MỚI), vùng paused/retired bị bỏ, nạp theo DB (983.8115ms)
    ✔ TV2b (nửa dương): S05 active + nhóm active → lời gọi tới nhà cung cấp giả đúng nhóm active (485.339791ms)
    ℹ pass 10
    ℹ fail 0
  note: Cả hai nửa nằm trong một lượt. Xem Known limits về thứ tự dữ liệu mẫu.

- eval: E5
  run_id: cong-tac-that-E5-20261031T015039Z
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.ctt_unit
  verified_at: 2026-10-31T01:50:39Z
  output: |
    ✔ TV2b (e): DB lỗi → 0 lời gọi, thoát ≠0 (fail-closed) — cả S05 lẫn S06 (113.70875ms)
    ✔ v2: vong-doi trả 2 (DB lỗi) → script THOÁT 1 rõ ràng với dòng lỗi (189.574583ms)
    ℹ pass 10
    ℹ fail 0
  note: S01, S02 và chuỗi S06 qua script được phủ ở v2 (cổng 2) và E7.

- eval: E6
  run_id: cong-tac-that-E6-20261031T015039Z
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.ctt_unit
  verified_at: 2026-10-31T01:50:39Z
  output: |
    ✔ TV2b (f): trạng thái lạ → chặn (fail-closed) — nguồn lẫn đơn vị (580.82625ms)
    ℹ pass 10
    ℹ fail 0

- eval: E7
  run_id: cong-tac-that-E7-20261031T015054Z
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.ctt_cong_launchd
  verified_at: 2026-10-31T01:50:54Z
  output: |
    ok   scripts/airdna-daily.sh · cổng 3 → thoát 0, đúng một dòng có lý do
    ok   scripts/airdna-daily.sh · cổng 2 → thoát 1, dừng fail-closed
    ok   pipeline/scripts/weekly-with-jitter.sh · cổng 3 → thoát 0, đúng một dòng có lý do
    ok   pipeline/scripts/weekly-with-jitter.sh · cổng 2 → thoát 1, dừng fail-closed
    ok   scripts/smoke-daily.sh · cổng 3 → thoát 0, đúng một dòng có lý do
    ok   scripts/smoke-daily.sh · cổng 2 → thoát 1, dừng fail-closed
    CONG-LAUNCHD PASS
  note: Sáu ô đều ok. chotot-daily.sh được đo ở E8.

- eval: E8
  run_id: cong-tac-that-E8-20261031T015039Z
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.ctt_unit
  verified_at: 2026-10-31T01:50:39Z
  output: |
    ✔ v2: vong-doi trả 3 → script in dòng bỏ-đi và THOÁT 0 (không còn chết ngầm mã 3) (189.6855ms)
    ✔ v2: vong-doi trả 2 (DB lỗi) → script THOÁT 1 rõ ràng với dòng lỗi (189.574583ms)
    ✔ v2: vong-doi trả 0 → script VƯỢT cổng sang bước kế (không chết ở thay thế lệnh) (354.184875ms)
    ℹ pass 10
    ℹ fail 0

- eval: E9
  run_id: cong-tac-that-E9-20261031T015054Z
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.ctt_khong_cung
  verified_at: 2026-10-31T01:50:54Z
  output: |
    chỗ còn danh sách cứng: 0
    chỗ đọc enabled trong đường thu: 0
    ok   pipeline/apify-facebook-collector.mjs gọi cổng vòng đời
    ok   pipeline/collect-chotot.mjs gọi cổng vòng đời
    ok   scripts/chotot-daily.sh gọi cổng vòng đời
    ok   scripts/airdna-daily.sh gọi cổng vòng đời
    ok   scripts/smoke-daily.sh gọi cổng vòng đời
    ok   pipeline/scripts/weekly-with-jitter.sh gọi cổng vòng đời
    KHONG-CUNG PASS
  note: Các đường thu ngoài danh sách sáu tệp ghi ở OOC-1 và OOC-2.

- eval: E10
  run_id: cong-tac-that-E10-20261031T015101Z
  exit_code: 0
  baseline: green
  verifier: config:executors.test.pipeline
  verified_at: 2026-10-31T01:51:01Z
  output: |
    ✔ AC-3 không còn khuôn cũ (40.881792ms)
    ℹ tests 307
    ℹ suites 14
    ℹ pass 307
    ℹ fail 0
  note: Lỗi IC-1 của vòng 3 đã đóng. Main `993d7394` cho 299/299. E10 là suite canh hồi quy, nên xanh trên cả hai cây là đúng ý
    của nó.

- eval: E11
  run_id: cong-tac-that-E11-20261031T015054Z
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.ctt_scope
  verified_at: 2026-10-31T01:50:54Z
  output: |
    ok  scripts/au3-nap-bao-loi/acceptance.mjs
    ok  scripts/chotot-daily.sh
    ok  scripts/job-exit.test.mjs
    ok  scripts/smoke-daily.sh
    SCOPE OK
  note: Diff `993d7394..HEAD` có 28 tệp, không tệp nào ngoài phạm vi. Hai tệp máy sinh (`LO-TRINH.html`, `PRODUCT-MAP.md`) nay vào
    diff vì hàng cong-tac-that chuyển sang «Đang làm», và cả hai nằm trong danh sách cho phép.

### Lệnh suite (hồi quy)

- cmd: node --test scripts/job-exit.test.mjs
  run_id: cong-tac-that-SUITE-job-exit-20261031T020326Z
  exit_code: 0
  verified_at: 2026-10-31T02:03:26Z

- cmd: node --test scripts/*.test.mjs
  run_id: cong-tac-that-SUITE-scripts-20261031T020330Z
  exit_code: 0
  verified_at: 2026-10-31T02:03:30Z

## Known limits

- **AC-9, ghim lại hồ sơ đã ký (ngoài eval)**. Phiên chấm chạy từng lệnh của `khoa-nap-s05-paused`, `au3-nap-bao-loi` và
  `snapshot-nguyen-tu` trên nhánh `fcbdb1af` và trên main `993d7394`. Rồi so output sau khi chuẩn hoá PID, đường tạm và mốc giờ:

  | Lệnh (hồ sơ · eval) | Nhánh | Main | Phán |
  |---|---|---|---|
  | `node --test scripts/job-exit.test.mjs` | 68/68 xanh | 68/68 xanh | xanh |
  | `node --test scripts/*.test.mjs` (CI; kns E9) | 270/270 xanh (chạy hai lần) | 270/270 xanh | xanh, lần này không chập chờn |
  | `cd pipeline && npm test` (E10) | 307/307 | 299/299 | xanh |
  | `au3_chotot` (au3 E1/E4/E6) | CHOTOT PASS 11/11 | đỏ 2 mục | nhánh sửa |
  | `kns_s05_gate` (kns E4/E5) | S05-GATE PASS | đỏ 2 mục ((b)) | nhánh sửa |
  | `kns_s05_unit` (kns E6) | 7/7 xanh (cong-tac-that.test) | 2/2 xanh (s05-paused.test) | xanh |
  | `kns_lich_s05`, `kns_lich_unit` (kns E11–E13) | xanh | xanh | xanh |
  | `au3_syntax`, `au3_ts_format` (au3 E8/E10) | xanh | xanh | xanh |
  | `snt_dang_ghi`, `snt_trung_ms`, `snt_ten_that_co_san` (snt E1–E4) | PASS cả ba | PASS cả ba | xanh |
  | `collector_test_clean` (snt E8) | 63/63 xanh | 63/63 xanh | xanh |
  | `au3_apify` (kns E7; au3 E2/E3/E5/E7) | đỏ 1 mục ((a) DB chết thật) | output giống hệt | có sẵn trên main |
  | `kns_au3_regress` (kns E8, snt E7) | dừng ở APIFY, cùng mục (a) | output giống hệt | có sẵn trên main |
  | `au3_lock` (kns E1–E3; au3 E11) | đỏ 2 mục (zalo-import-daily: PID chết, khoá >2h) | giống sau chuẩn hoá PID | có sẵn trên main |
  | `au3_r1_probe` (au3 E9) | «R1: hcmc T07 KHÔNG BAO GIỜ được nạp lại» | giống sau chuẩn hoá đường tạm | có sẵn trên main |
  | `snt_mo_coi` (snt E5/E6) | đỏ 2 mục (zalo-import-daily (b), (c)) | output giống hệt | có sẵn trên main |
  | `kns_scope` (kns E10) | 18 dòng «NGOÀI PHẠM VI», toàn tệp cong-tac-that | SCOPE OK | không tính ở nhánh khác (revisit kns `d-20261031T012039Z-2`) |

  Đếm theo cách đọc AC-9 đã ghi sổ («không thêm đỏ so với main»): nhánh thêm **0** đỏ và sửa **2** thước đỏ có sẵn
  (`au3_chotot` 2 mục, `kns_s05_gate` 2 mục). Đỏ có sẵn giống hệt trên cả hai cây là năm thước: `au3_apify` 1 mục,
  `kns_au3_regress` (cùng mục đó), `au3_lock` 2 mục, `au3_r1_probe`, `snt_mo_coi` 2 mục. Danh sách này khớp danh sách trong dòng
  revisit `d-20261031T012039Z-1`; `kns_au3_regress` là thước gộp, đỏ cùng mục với `au3_apify`. Mọi đỏ có sẵn đều nằm ở nhánh mã
  `zalo-import-daily.sh`/`apify-facebook-daily.sh`, và nhánh này không chạm hai tệp đó.
- **Cách đọc AC-9 chưa có chữ ký trực tiếp của người.** Chữ AC-9 trong hợp đồng là «tất cả xanh». Câu «không thêm đỏ so với
  main» nằm ở dòng revisit `d-20261031T012039Z-1`. Dòng đó ghi `decided_by` là «Mạnh (vòng 4); cách đọc AC-9 theo khuyến nghị
  claudedp, Mạnh xác nhận ở Cổng 2». Nghĩa là Mạnh mới duyệt mở vòng 4, còn cách đọc thì chờ Mạnh xác nhận tại Cổng 2. Ký
  `human_signoff` hồ sơ này cũng là xác nhận cách đọc đó. Nếu Mạnh muốn AC-9 xanh tuyệt đối thì đỏ có sẵn phải sửa trước.
  Dòng revisit đã nêu giá phải trả cho lựa chọn đó.
- Nếu `kns_scope` chạy từ nhánh khác thì không tính (revisit `d-20261031T012039Z-2`, ghi bởi claudedp). Lý do: thước giữ danh sách
  tệp cố định của PR 2510-4/9/14 và đo diff `merge-base..HEAD`. Trên main thước xanh.
- E4: dữ liệu mẫu vẫn xếp đơn vị không active SAU các đơn vị active, chưa xen giữa. Vì vậy test chưa loại lỗi kiểu `break`. Đọc
  mã thì không có lỗi đó: collect-chotot dùng `continue`, chotot-daily và S05 dùng `.filter`.
- E8: v2 chứng «0 nạp» khi cổng trả 3 bằng thoát 0, chưa assert là `runs.log` vắng.
- Harness au3 phân biệt «CLI hay import» bằng độ dài argv. Nếu sau này có tệp được chạy với tham số mà import `lib/vong-doi.mjs`,
  vong-doi giả sẽ in rồi thoát giữa chừng. Hiện chỉ `collect-chotot.mjs` và `apify-facebook-collector.mjs` import nó, và trong
  sandbox chotot cả hai đều là bản giả.
- `cong-tac-that/decisions.jsonl` vẫn chưa có dòng revisit cho lần mở rộng `probes/scope.sh` ở vòng 3 (thêm
  `scripts/au3-nap-bao-loi/acceptance.mjs` và `khoa-nap-s05-paused/evals.yaml`). Hai hồ sơ đích đã có dòng revisit riêng. Danh sách
  cho phép có glob rộng `_acceptance/*/probes/*`.
- origin/main nay ở `4307a0b8`, đi trước merge-base 49 commit. `git fetch` của phiên chấm cập nhật ref này. Ba tệp chạm chung là
  `LO-TRINH.html`, `PRODUCT-MAP.md` và `_acceptance/config.yaml`. `git merge-tree` cho thấy chỉ `LO-TRINH.html` (tệp máy sinh)
  xung đột. Gộp main trước khi merge sẽ đổi tệp ngoài cổng sau `verified_commit`, nên phải ghim lại E10 và job-exit theo nếp
  repin.
- Các lượt trên main và lượt so output chỉ để đối chứng, không thay eval. Output nằm ở thư mục scratchpad phiên,
  `/private/tmp/claude-503/-Users-manhphan-dev-onehub-invest--claude-worktrees-quirky-archimedes-75aa8c/6da7bb6c-5ffa-4c0a-a350-8745636735e0/scratchpad/r4`.

## Ngoài hợp đồng

Năm mục của vòng 3 vẫn còn nguyên, vì vòng 4 không chạm các tệp liên quan. Không có mục mới. Chi tiết ở `review-findings.md`:
- OOC-1: lệnh cài launchd cũ trỏ thẳng vào lượt thu S01, không qua cổng (medium).
- OOC-2: các đường chạy tay của S01 và S02 không qua cổng (low).
- OOC-3: vùng S06 thiếu `cityCode` vẫn bị nhận lặng lẽ (low).
- OOC-4: `seed()` của test bỏ qua lỗi INSERT; lược đồ tối giản thiếu CHECK của 047 (low).
- OOC-5: cổng S01 của weekly-with-jitter hỏi trước khi ngủ tới 30 phút (low).

## Analyst

Non-discriminating evals: không có eval tính năng nào đo được trên baseline. Baseline khong do: `ctt_unit` (E1–E6, E8) và ba
probe `cong-launchd.sh` (E7), `khong-cung.sh` (E9), `scope.sh` (E11) chưa có trên diffBase `993d7394`, nên chạy trên mã cũ không
chứng được gì. E10 có trên diffBase và xanh ở đó. Đây là suite canh hồi quy, xanh cả hai phía là đúng ý của nó. Vòng 3 đã thử
chiều đỏ cho E3 bằng tay trên bản chép, và eval phân biệt được.

## Variance

Không eval nào khai `runs` > 1. Vòng 3 thấy `node --test scripts/*.test.mjs` chập chờn ở `ci-test-module.test.mjs`. Vòng này
lệnh đó xanh 270/270 cả hai lần trên nhánh và một lần trên main. Gốc lỗi pg «Connection terminated» của vòng 3 chưa tìm ra.

## Iterations

Round 1 (`7d257c00`): E1 và E8 FAIL, E3 thiếu ca chứng. Nửa nạp chứng bằng bản chép, và job-exit hồi quy 11 ca. Trả về làm tiếp.
Round 2 (`9b1c4814`): E3 FAIL vì nửa nạp vẫn chứng bằng bản chép. Sandbox au3 chotot đỏ thêm 6 mục. Trả về làm tiếp.
Round 3 (`59652aaf`): E3 và au3_chotot đã sửa. E10 FAIL vì harness au3 thêm khuôn `process.argv[1]` vào tệp có
`import.meta.url`. Hết ba vòng, chuyển lên người.
Round 4 (`fcbdb1af`, Mạnh đồng ý mở): harness au3 nhận diện CLI bằng độ dài argv, nên E10 xanh 307/307. 11/11 eval PASS. AC-9
theo cách đọc đã ghi sổ: nhánh thêm 0 đỏ so với main và sửa 2 thước đỏ có sẵn. Còn năm thước đỏ có sẵn giống hệt main, chờ
người xác nhận ở Cổng 2.

### Re-pin lần 1 — 2026-10-31, do ghim lại sau Cổng 2 cong-tac-that: harness au3 bắt kịp main + revisit hồ sơ đã ký
run_id: repin-20261031T031750Z-45355
sha: 4819c9ceb992643c00d90dad5df0f834daf688bc · suites: 6 lệnh exit 0 · evals: 11/11 eval máy đạt kỳ vọng
