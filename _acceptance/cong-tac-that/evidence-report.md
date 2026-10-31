---
schema_version: 2
feature_slug: cong-tac-that
verdict: REJECT
failed_evals: [E10]
reason: "E10 (bộ pipeline, AC-9) đỏ 1/307: entrypoint-symlink.test «AC-3 không còn khuôn cũ» bắt scripts/au3-nap-bao-loi/acceptance.mjs. Chính commit vòng 3 (59652aaf) gây ra lỗi này: vong-doi giả và pg bọc mới thêm hai dòng mã có process.argv[1], mà tệp đã có import.meta.url. Main 25ce701b xanh 299/299, nhánh vòng 2 xanh 307/307. Mọi lỗi vòng 2 đã sửa: E3 nay chạy chotot-daily.sh thật (thử chiều đỏ thì đỏ), au3_chotot xanh 11/11. Vòng 3 là vòng cuối, nên chuyển lên người."
verified_by: feature-loop:cham-lenh
enforcement_mode: strict
bypass_used: false
verified_commit: 59652aaf1b630ee483d0dd6dc3d131ccd6068c3e
human_signoff:
---

# Evidence Report: cong-tac-that

Vòng verify 3 chạy trên cây `59652aaf`, nhánh `claude/acceptance-cong-tac-that`. Phiên chấm không viết mã này, không sửa tệp
sản phẩm, test hay probe. Mỗi lệnh eval chạy một lần, timeout công cụ 600 giây, không lệnh nào bị công cụ ngắt. E1–E6 và E8
dùng chung một lượt `ctt_unit`. Đối chứng AC-9 chạy cùng lệnh trên worktree sạch của merge-base `25ce701b` (origin/main lúc
mở nhánh), mượn node_modules qua symlink. Phiên chấm thêm symlink `agent/node_modules` vào worktree đó, cho bằng môi trường
của nhánh.

Đã sửa so với vòng 2:
- **E3**: ca (c)+(d) nay chạy THẬT `scripts/chotot-daily.sh` trên cây tạm. Cây tạm có `vong-doi.mjs` thật, `pg` thật và DB tạm.
  Import giả ghi vùng của snapshot được nạp. Ca đòi danh sách nạp đúng `["hanoi","da-nang"]`. Thử chiều đỏ trên bản chép
  (`git archive` vào scratchpad, thay bước đọc vùng bằng `CITIES="hanoi hcmc"`) thì ca đỏ: thực tế `[hanoi, hcmc]`, mong đợi
  `[hanoi, da-nang]`. Eval phân biệt được.
- **AC-9, au3_chotot**: harness au3 chế độ chotot xanh 11/11 trên nhánh (CHOTOT PASS). Vòng 2 nhánh đỏ 8 mục; main hiện vẫn
  đỏ 2 mục vì thiếu bước giả `transform-media`. Nhánh sửa cả hai mục có sẵn đó.
- **Chữ expected của khoa-nap-s05-paused E5** đã đổi sang fail-closed, kèm dòng revisit `d-20261030T234514Z-1`.

Trượt mới ở vòng 3:
- **E10 (AC-9)**: `cd pipeline && npm test` thoát 1, pass 306/307. Ca đỏ là `pipeline/scripts/entrypoint-symlink.test.mjs` «AC-3
  không còn khuôn cũ». Bộ quét `scanEntrypoints` đánh dấu mọi tệp có `argv[1]` và `import.meta.url` (ngoài dòng chú thích) mà
  thiếu `realpathSync(process.argv[1])`. Commit vòng 3 thêm vào `scripts/au3-nap-bao-loi/acceptance.mjs` hai dòng mã sinh
  module giả có `process.argv[1]`: dòng 108 `process.argv[1]?.endsWith("vong-doi.mjs")` và dòng 115 `process.argv[1] ? … : { Client }`.
  Tệp đó vốn có `import.meta.url` ở dòng 24. Ở `7a3b19da` tệp có 0 dòng mã chứa `argv[1]`, ở `59652aaf` có 2. Chạy riêng tệp
  test trên nhánh cũng đỏ đúng ca này. Trên main `25ce701b`, ca AC-3 xanh, và cả bộ `pipeline` xanh 299/299.

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
| E10 | AC-9 | test | FAIL |
| E11 | AC-9 | script | PASS |

## Evidence

- eval: E1
  run_id: cong-tac-that-E1-20261031T002343Z
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.ctt_unit
  verified_at: 2026-10-31T00:23:43Z
  output: |
    ✔ TV2b (a): S05 paused → 0 lời gọi, thoát 0, một dòng mã + lý_do (319.553ms)
    ✔ TV2b (nửa dương): S05 active + nhóm active → lời gọi tới nhà cung cấp giả đúng nhóm active (453.340375ms)
    ℹ tests 10
    ℹ pass 10
    ℹ fail 0
  note: Không đổi so với vòng 2. Ca (a) cho thoát 0, dòng cuối khớp «S05 … — bỏ qua thu», có `nguon-paused`, 0 lời gọi. Ca nửa
    dương cho lời gọi có `nhom-a` và `nhom-b`, không có `nhom-c` (paused).

- eval: E2
  run_id: cong-tac-that-E2-20261031T002343Z
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.ctt_unit
  verified_at: 2026-10-31T00:23:43Z
  output: |
    ✔ TV2b (b): S05 active nhưng 0 nhóm active → 0 lượt, KHÔNG fallback, thoát 0 (312.797916ms)
    ℹ pass 10
    ℹ fail 0
  note: Nhóm paused và retired cho `khong-con-nhom-active` và 0 lời gọi. E9 xác nhận không còn `FALLBACK_GROUPS`.

- eval: E3
  run_id: cong-tac-that-E3-20261031T002343Z
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.ctt_unit
  verified_at: 2026-10-31T00:23:43Z
  output: |
    ✔ TV2b (c)+(d): S06 — vùng active được thu (kể cả vùng MỚI), vùng paused/retired bị bỏ, nạp theo DB (818.006917ms)
    ℹ pass 10
    ℹ fail 0
  note: Nửa «được thu»: `collect-chotot.mjs` thật gọi region 12000 và vùng mới 4700, không gọi 13000 (paused) hay 5500 (retired).
    Nửa «được nạp» nay dùng `chotDailyThat()`. Hàm này chép `chotot-daily.sh`, `job-step.sh` và `vong-doi.mjs` thật vào cây tạm,
    symlink `pipeline/node_modules`, rồi chạy script bằng bash với DB tạm. Ca đòi thoát 0 và danh sách nạp đúng
    `["hanoi","da-nang"]`. Bước đọc vùng `node -e` của script vì vậy chạy thật. Chiều đỏ (bản chép, vùng cứng `hanoi hcmc`): ca
    đỏ với `[hanoi, hcmc]` khác `[hanoi, da-nang]`. `job-step.sh` không ghi ra ngoài cây tạm.

- eval: E4
  run_id: cong-tac-that-E4-20261031T002343Z
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.ctt_unit
  verified_at: 2026-10-31T00:23:43Z
  output: |
    ✔ TV2b (c)+(d): S06 — vùng active được thu (kể cả vùng MỚI), vùng paused/retired bị bỏ, nạp theo DB (818.006917ms)
    ✔ TV2b (nửa dương): S05 active + nhóm active → lời gọi tới nhà cung cấp giả đúng nhóm active (453.340375ms)
    ℹ pass 10
    ℹ fail 0
  note: Cả hai nửa nằm trong một lượt. Nửa nạp nay cũng đòi chỉ vùng active, qua script thật. Dữ liệu mẫu vẫn xếp đơn vị không
    active SAU đơn vị active, không xen giữa (xem Known limits).

- eval: E5
  run_id: cong-tac-that-E5-20261031T002343Z
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.ctt_unit
  verified_at: 2026-10-31T00:23:43Z
  output: |
    ✔ TV2b (e): DB lỗi → 0 lời gọi, thoát ≠0 (fail-closed) — cả S05 lẫn S06 (104.875917ms)
    ✔ v2: vong-doi trả 2 (DB lỗi) → script THOÁT 1 rõ ràng với dòng lỗi (144.672917ms)
    ℹ pass 10
    ℹ fail 0
  note: S05 và S06 với DB không tồn tại thì thoát khác 0, 0 lời gọi. S01, S02 và S06 qua script thì ở v2 cổng 2 và E7.

- eval: E6
  run_id: cong-tac-that-E6-20261031T002343Z
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.ctt_unit
  verified_at: 2026-10-31T00:23:43Z
  output: |
    ✔ TV2b (f): trạng thái lạ → chặn (fail-closed) — nguồn lẫn đơn vị (592.772708ms)
    ℹ pass 10
    ℹ fail 0
  note: Nguồn `bogus` cho `trang-thai-la:nguon`; đơn vị `weird` cho `khong-con-nhom-active`. Cả hai 0 lời gọi.

- eval: E7
  run_id: cong-tac-that-E7-20261031T002402Z
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.ctt_cong_launchd
  verified_at: 2026-10-31T00:24:02Z
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
  run_id: cong-tac-that-E8-20261031T002343Z
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.ctt_unit
  verified_at: 2026-10-31T00:23:43Z
  output: |
    ✔ v2: vong-doi trả 3 → script in dòng bỏ-đi và THOÁT 0 (không còn chết ngầm mã 3) (135.193667ms)
    ✔ v2: vong-doi trả 2 (DB lỗi) → script THOÁT 1 rõ ràng với dòng lỗi (144.672917ms)
    ✔ v2: vong-doi trả 0 → script VƯỢT cổng sang bước kế (không chết ở thay thế lệnh) (274.360208ms)
    ℹ pass 10
    ℹ fail 0
  note: Test v2 không đổi từ vòng 2. Ca vẫn chứng «0 nạp» gián tiếp qua thoát 0 (xem Known limits).

- eval: E9
  run_id: cong-tac-that-E9-20261031T002402Z
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.ctt_khong_cung
  verified_at: 2026-10-31T00:24:02Z
  output: |
    chỗ còn danh sách cứng: 0
    chỗ đọc enabled trong đường thu: 0
    ok   scripts/chotot-daily.sh gọi cổng vòng đời
    ok   pipeline/scripts/weekly-with-jitter.sh gọi cổng vòng đời
    KHONG-CUNG PASS
  note: Sáu tệp đều gọi cổng. Các đường thu ngoài danh sách nằm ở OOC-1 và OOC-2.

- eval: E10
  run_id: cong-tac-that-E10-20261031T002411Z
  exit_code: 1
  baseline: green
  verifier: config:executors.test.pipeline
  verified_at: 2026-10-31T00:24:11Z
  output: |
    ✖ AC-3 không còn khuôn cũ (35.171709ms)
    actual: [ 'AC-3 còn lối vào khuôn cũ: scripts/au3-nap-bao-loi/acceptance.mjs' ],
    expected: [],
    ℹ tests 307
    ℹ pass 306
    ℹ fail 1
  note: FAIL. Đây là hồi quy do nhánh gây ra ở commit vòng 3, không phải ca chập chờn. Bộ quét là tĩnh, và chạy riêng
    `node --test pipeline/scripts/entrypoint-symlink.test.mjs` cũng đỏ đúng ca này. Trên main `25ce701b`, ca này xanh và cả
    bộ xanh 299/299; vòng 2 nhánh xanh 307/307. Mã của hai dòng gây đỏ được trích ở phần tóm tắt. Cách sửa và lựa chọn nằm
    ở `review-findings.md` IC-1.

- eval: E11
  run_id: cong-tac-that-E11-20261031T002402Z
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.ctt_scope
  verified_at: 2026-10-31T00:24:02Z
  output: |
    ok  scripts/au3-nap-bao-loi/acceptance.mjs
    ok  scripts/chotot-daily.sh
    ok  scripts/job-exit.test.mjs
    ok  scripts/smoke-daily.sh
    SCOPE OK
  note: Có 28 tệp, không dòng «NGOÀI PHẠM VI» nào. `scripts/au3-nap-bao-loi/acceptance.mjs` và `khoa-nap-s05-paused/evals.yaml`
    vào phạm vi ở vòng 3. Hai dòng revisit mới ghi ở hồ sơ đích (`au3-nap-bao-loi` `d-20261030T234514Z-2`, `khoa-nap-s05-paused`
    `d-20261030T234514Z-1`). `cong-tac-that/decisions.jsonl` thì không có dòng nào cho lần mở rộng scope.sh vòng 3 này.

## Known limits

- **AC-9, ghim lại hồ sơ đã ký (ngoài eval)**. Phiên chấm chạy từng lệnh trên nhánh `59652aaf` và trên main `25ce701b`:

  | Lệnh (hồ sơ · eval) | Nhánh | Main | Phán |
  |---|---|---|---|
  | `node --test scripts/job-exit.test.mjs` | 66/66 xanh | 66/66 xanh | xanh |
  | `node --test scripts/*.test.mjs` (CI; kns E9) | lần 1 đỏ 5/268, chạy lại một mình 268/268 xanh | (vòng 2: 268/268) | chập chờn, xem Variance |
  | `cd pipeline && npm test` (E10) | 306/307 | 299/299 | **nhánh đỏ thêm 1** (IC-1) |
  | `au3_chotot` (au3 E1/E4/E6; trong kns E8, snt E7) | CHOTOT PASS 11/11 | đỏ 2 mục | nhánh sửa (vòng 2 nhánh đỏ 8) |
  | `au3_apify` (kns E7; au3 E2/E3/E5/E7) | đỏ 1 mục ((a) DB chết thật) | đỏ đúng mục đó | có sẵn trên main |
  | `au3_lock` (kns E1–E3; au3 E11) | đỏ 2 mục (zalo-import-daily) | đỏ đúng 2 mục đó | có sẵn trên main |
  | `au3_r1_probe` (au3 E9) | «R1: hcmc T07 KHÔNG BAO GIỜ được nạp lại» | giống hệt | có sẵn trên main (vòng 2 chưa nêu) |
  | `snt_mo_coi` (snt E5/E6) | đỏ 2 mục (zalo-import-daily (b), (c)) | đỏ đúng 2 mục đó | có sẵn trên main (vòng 2 chưa nêu) |
  | `kns_au3_regress` (kns E8, snt E7) | dừng ở APIFY | dừng ở APIFY | có sẵn; phần CHOTOT phía sau nay xanh |
  | `kns_scope` (kns E10) | 18 dòng «NGOÀI PHẠM VI» | SCOPE OK (diff rỗng) | đặc tính của thước, không phải hồi quy |
  | `kns_s05_gate` (kns E4/E5) | S05-GATE PASS | đỏ 2 mục ((b)) | nhánh sửa |
  | `kns_s05_unit` (kns E6) | 10/10 xanh (cong-tac-that.test) | xanh (s05-paused.test) | xanh |
  | `kns_lich_s05`, `kns_lich_unit` (kns E11–E13) | xanh | xanh | xanh |
  | `au3_ts_format`, `au3_syntax` | xanh | xanh | xanh |
  | `snt_dang_ghi`, `snt_trung_ms`, `snt_ten_that_co_san` (snt E1–E4) | PASS cả ba | không chạy (nhánh không chạm collector) | xanh |
  | `collector_test_clean` (snt E8) | 63/63 xanh | không chạy | xanh |

  Phán xử `kns_scope`: không phải hồi quy hành vi. Probe `khoa-nap-s05-paused/probes/scope.sh` có danh sách cho phép cố định gồm
  tệp của ba lời giao 2510-4/2510-9/2510-14, và đo `git diff merge-base(origin/main, HEAD)..HEAD`. Trên main sau khi gộp, diff
  rỗng nên thước luôn xanh. Trên bất kỳ nhánh nào chạm tệp khác, thước đỏ dù hành vi không đổi. Mười tám dòng «NGOÀI PHẠM VI»
  đúng là tệp của cong-tac-that (collect-chotot, hai test TV2b, bốn script vào, job-exit.test, hồ sơ cong-tac-that…). Thước đo
  phạm vi của PR cũ, nên chỉ có nghĩa trên nhánh của chính PR đó. Dòng revisit `d-20261030T234514Z-1` đã ghi «chờ Mạnh quyết ở
  Cổng 2». Người quyết: ghi thước này là «chỉ đo trên nhánh gốc, không ghim lại».
- Đỏ có sẵn trên main chặn câu «ghim lại tất cả xanh» của AC-9, nhưng không do nhánh: au3_apify 1 mục, au3_lock 2 mục,
  au3_r1_probe, snt_mo_coi 2 mục. Ba thước sau đều đỏ ở cùng nhánh mã `zalo-import-daily.sh`/`apify-facebook-daily.sh`, là các
  tệp nhánh này không chạm. Người quyết như vòng 2 (IC-2 trong review-findings).
- `khoa-nap-s05-paused` E4 `expected` vẫn ghi «log 'S05 paused — bỏ qua thu'», trong khi probe nay in «S05 nguon-paused — bỏ qua
  thu». Dòng revisit `d-20261029T040511Z-1` đã khai đổi chữ log của (a)(d). Lệch chữ nhỏ, không làm đổi kết quả thước.
- E4: dữ liệu mẫu chưa xen đơn vị không active GIỮA hai đơn vị active, nên lỗi kiểu `break` chưa bị loại bằng test. Đọc mã
  (`continue` ở collect-chotot, `.filter` ở chotot-daily và S05) thì không có lỗi đó.
- E8: v2 vẫn chứng «0 nạp» khi cổng 3 bằng thoát 0, chưa assert vắng `runs.log`.
- origin/main nay ở `d9fa5851`, đi trước merge-base 30 commit, có chạm `scripts/job-exit.test.mjs` và `_acceptance/config.yaml`.
  Gộp thử bằng `git merge-tree` thì chỉ `LO-TRINH.html` (tệp máy sinh) xung đột. Sau khi gộp main phải chạy lại job-exit và E10.
  Ref `origin/main` được cập nhật vì phiên chấm chạy `git fetch` trong worktree main; merge-base vẫn là `25ce701b`.
- Thí nghiệm của phiên chấm (thử chiều đỏ E3, chạy lại riêng các tệp test, lượt trên main) chỉ để chẩn đoán, không thay eval,
  không ghi run-log. Output nằm ở scratchpad phiên, thư mục `r3/`.

## Ngoài hợp đồng

Năm mục của vòng 2 vẫn còn nguyên, vì vòng 3 không chạm các tệp liên quan. Không có mục mới. Chi tiết ở `review-findings.md`:
- OOC-1: lệnh cài launchd cũ trỏ thẳng vào lượt thu S01, không qua cổng (medium).
- OOC-2: các đường chạy tay của S01 và S02 không qua cổng (low).
- OOC-3: vùng S06 thiếu `cityCode` vẫn bị nhận lặng lẽ (low).
- OOC-4: `seed()` của test bỏ qua lỗi INSERT; lược đồ tối giản thiếu CHECK của 047 (low).
- OOC-5: cổng S01 của weekly-with-jitter hỏi trước khi ngủ tới 30 phút (low).

## Analyst

Non-discriminating evals: không đo cho eval mới. Baseline khong do: `ctt_unit` và ba probe (`cong-launchd.sh`, `khong-cung.sh`,
`scope.sh`) chưa có trên diffBase, nên chạy trên mã cũ không chứng được gì. E10 có trên diffBase và xanh ở đó: đây là bộ suite
canh hồi quy, và nhánh làm nó đỏ. Riêng E3 có thử chiều đỏ bằng tay trên bản chép (đã nêu ở E3).

## Variance

E1–E11 không eval nào khai `runs` > 1. Lệnh suite AC-9 `node --test scripts/*.test.mjs` (không phải eval) chập chờn 1/2. Lần
đầu đỏ 5 ca ở `scripts/ci-test-module.test.mjs` (AU11-AC-3 ci-db-init) với «Connection terminated unexpectedly» từ pg. Chạy
riêng tệp đó thì 9/9 xanh; chạy lại cả bộ một mình thì 268/268 xanh. Nhánh không chạm tệp này hay `ci-db-init`. Nghi do tải DB
:5433 dùng chung lúc chạy song song; chưa tìm ra gốc.

## Iterations

Round 1 (`7d257c00`): E1 và E8 FAIL, E3 UNCERTAIN, vì thiếu ca chứng (S05 active có lời gọi; chotot-daily chạy thật) và vì nửa
nạp chứng bằng bản chép. Ngoài eval: hồi quy 11 ca `scripts/job-exit.test.mjs` (AC-9). Trả về làm tiếp.
Round 2 (`9b1c4814`): E1 và E8 đã sửa, job-exit 66/66. E3 FAIL vì nửa nạp vẫn chứng bằng bản chép. AC-9: harness au3 chế độ
chotot của hồ sơ đã ký đỏ thêm 6 mục do sandbox thiếu vong-doi.mjs; kns_scope đỏ theo cấu trúc. Trả về làm tiếp.
Round 3 (`59652aaf`): E3 đã sửa (chotot-daily.sh chạy thật, thử chiều đỏ thì đỏ), au3_chotot xanh 11/11. E10 FAIL: chính bản sửa
harness au3 thêm `process.argv[1]` vào tệp có `import.meta.url`, làm đỏ entrypoint-symlink AC-3 (pipeline 306/307; main
299/299). Hết ba vòng, chuyển lên người với verdict REJECT.
