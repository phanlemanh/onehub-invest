---
schema_version: 2
feature_slug: cong-tac-that
verdict: REJECT
failed_evals: [E3]
reason: "E3: nửa «được nạp» vẫn chứng bằng bản chép đoạn node, không chạy chuỗi nạp thật (lỗi vòng 1 chưa sửa). AC-9 (ngoài eval): nhánh thêm 6 mục đỏ cho harness au3 chế độ chotot của hồ sơ đã ký au3-nap-bao-loi (E1, E4, E6), cũng là lệnh của khoa-nap-s05-paused E8 và snapshot-nguyen-tu E7. Trên main harness này đỏ 2 mục, trên nhánh đỏ 8. kns_scope của khoa-nap-s05-paused đỏ vì diff nhánh. job-exit.test đã xanh 66/66."
verified_by: feature-loop:cham-lenh
enforcement_mode: strict
bypass_used: false
verified_commit: 9b1c4814187d3042e79fc22def1bfb065e075444
human_signoff:
---

# Evidence Report: cong-tac-that

Vòng verify 2 chạy trên cây `9b1c4814`, nhánh `claude/acceptance-cong-tac-that`. Phiên chấm không viết mã này, không sửa tệp
sản phẩm, test hay probe. Mỗi lệnh eval chạy đúng một lần. E1–E6 và E8 dùng chung một lượt `ctt_unit`. Cả 5 lệnh eval đều
thoát 0. Để đối chứng AC-9, phiên chấm chạy thêm cùng lệnh trên một worktree sạch của origin/main `25ce701b`, mượn node_modules
qua symlink.

Đã sửa so với vòng 1:
- **E1**: có ca nửa dương «S05 active + nhóm active». Nhà cung cấp giả nhận lời gọi; thân startRun có `nhom-a` và `nhom-b`,
  không có `nhom-c` (paused).
- **E8**: `cong-tac-that-v2` nay chép `scripts/chotot-daily.sh` THẬT vào cây tạm. Cổng 3 thì thoát 0 với dòng có lý do; cổng
  2 thì thoát 1 với dòng fail-closed; cổng 0 thì đi qua cổng.
- **job-exit.test**: 66/66 xanh trên nhánh (vòng 1 đỏ 11 ca). Toàn bộ `scripts/*.test.mjs` 268/268, bằng đúng main.
- Bộ test TV2b tự tạo và xoá DB tạm, dựng `source_groups` là VIEW trên `collection_units` như 048. Nó không còn cần DB
  `zcode_tv2b` dựng tay.
- Vùng S06 active thiếu `region_v2` nay in một dòng `params-hong`.

Vẫn trượt:
- **E3**: ca (c)+(d) chứng nửa «được thu» bằng `collect-chotot.mjs` thật. Nhưng nửa «được nạp» vẫn chạy một bản chép đoạn
  `node -e` của chotot-daily.sh. Hai lối chạy script thật thì đều bỏ qua bước đọc vùng: v2 (cổng 0) vá cứng `CITIES="hanoi"`,
  còn shim node của job-exit.test trả cứng `hanoi`. Vì vậy không ca nào cho thấy chuỗi nạp hằng ngày nạp vùng mới. Thí
  nghiệm riêng của phiên chấm (không phải eval) chạy chotot-daily.sh thật với vong-doi thật và DB tạm có 4 vùng
  (hanoi active, da-nang active mới, hcmc paused, hp retired): thoát 0, nạp đúng `hanoi` và `da-nang`. Sản phẩm đúng; chỉ
  thiếu ca test.
- **AC-9, hồi quy hồ sơ đã ký (ngoài eval)**: `node scripts/au3-nap-bao-loi/acceptance.mjs chotot` đỏ 2 mục trên main và 8
  mục trên nhánh. Sáu mục thêm là do nhánh gây ra. Sandbox của harness chép chotot-daily.sh mà không chép
  `pipeline/lib/vong-doi.mjs`, nên cổng S06 mới thoát 1 trước mọi bước nạp. Phiên chấm đã dựng lại đúng hình sandbox đó:
  `Cannot find module …/pipeline/lib/vong-doi.mjs` → «vong-doi S06 lỗi — dừng (fail-closed)». Lệnh này là `au3_chotot` của
  `au3-nap-bao-loi` (E1, E4, E6; PASS, Mạnh ký 25/10). Nó cũng nằm trong `kns_au3_regress` của `khoa-nap-s05-paused` (E8) và
  `snapshot-nguyen-tu` (E7). `au3-nap-bao-loi` chưa có dòng revisit, và `scripts/au3-nap-bao-loi/acceptance.mjs` nằm ngoài
  `scope.sh`. Đây đúng là lỗi mà job-exit.test vấp ở vòng 1 và đã được sửa; harness này thì chưa ai sửa.

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | test | PASS |
| E2 | AC-2 | test | PASS |
| E3 | AC-3 | test | FAIL |
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
  run_id: cong-tac-that-E1-20261030T233107Z
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.ctt_unit
  verified_at: 2026-10-30T23:31:07Z
  output: |
    ✔ TV2b (a): S05 paused → 0 lời gọi, thoát 0, một dòng mã + lý_do (294.620292ms)
    ✔ TV2b (nửa dương): S05 active + nhóm active → lời gọi tới nhà cung cấp giả đúng nhóm active (463.448875ms)
    ℹ tests 10
    ℹ pass 10
    ℹ fail 0
  note: Ca (a) có S05 paused và một nhóm active: thoát 0, dòng cuối khớp «S05 … — bỏ qua thu», có `nguon-paused`, 0 lời gọi.
    Ca nửa dương có S05 active với nhóm a/b active và c paused. Ca đòi `hits.length > 0` và có lời gọi startRun. Server giả nay
    ghi cả thân POST, nên ca đòi được `nhom-a` và `nhom-b` có mặt, `nhom-c` vắng. Ca này đồng thời chứng bộ đếm của nhà cung cấp
    giả đếm được, nên các ca «0 lời gọi» khác có nghĩa. Ca (a) không đòi đúng một dòng; đọc mã thì nhánh paused chỉ in một dòng.

- eval: E2
  run_id: cong-tac-that-E2-20261030T233107Z
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.ctt_unit
  verified_at: 2026-10-30T23:31:07Z
  output: |
    ✔ TV2b (b): S05 active nhưng 0 nhóm active → 0 lượt, KHÔNG fallback, thoát 0 (299.652375ms)
    ℹ pass 10
    ℹ fail 0
  note: Nhóm paused và retired thì thoát 0, có `khong-con-nhom-active`, 0 lời gọi. `FALLBACK_GROUPS` đã bị xoá, E9 xác nhận.

- eval: E3
  run_id: cong-tac-that-E3-20261030T233107Z
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.ctt_unit
  verified_at: 2026-10-30T23:31:07Z
  output: |
    ✔ TV2b (c)+(d): S06 — vùng active được thu (kể cả vùng MỚI), vùng paused/retired bị bỏ, nạp theo DB (490.981708ms)
    ℹ pass 10
    ℹ fail 0
  note: FAIL vì eval không chứng nửa «được nạp» của AC-3. Nửa «được thu» đạt: collector thật gọi region 12000 và vùng mới 4700,
    không gọi 13000 (paused) hay 5500 (retired). Nửa «được nạp» chạy `spawnSync node -e` với bản chép câu SQL và bộ lọc
    `isRunnable` của chotot-daily.sh, không chạy script. Hai lối chạy script thật thì đều bỏ qua bước đọc vùng (v2 cổng 0 vá
    `CITIES="hanoi"`, job-exit shim trả cứng `hanoi`). Nếu script đổi cách đọc vùng, bộ test vẫn xanh. Thí nghiệm của phiên chấm
    (scratchpad `r2/diag-e3`, không phải eval): chotot-daily.sh thật, vong-doi thật, DB tạm 4 vùng, import và transform giả.
    Kết quả: thoát 0, import đúng `hanoi__…` và `da-nang__…`, rồi đủ 4 bước sau. Hành vi đúng. Cách sửa: thêm vào v2 một ca chạy
    chotot-daily.sh thật với vong-doi thật và DB tạm (như thí nghiệm này), đòi vùng mới có trong danh sách nạp và vùng
    paused/retired vắng.

- eval: E4
  run_id: cong-tac-that-E4-20261030T233107Z
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.ctt_unit
  verified_at: 2026-10-30T23:31:07Z
  output: |
    ✔ TV2b (c)+(d): S06 — vùng active được thu (kể cả vùng MỚI), vùng paused/retired bị bỏ, nạp theo DB (490.981708ms)
    ✔ TV2b (nửa dương): S05 active + nhóm active → lời gọi tới nhà cung cấp giả đúng nhóm active (463.448875ms)
    ℹ pass 10
    ℹ fail 0
  note: Cả hai nửa nằm trong một lượt, cho S06 (2 active, 1 paused, 1 retired) và S05 (2 active, 1 paused). Dữ liệu mẫu xếp
    đơn vị không active SAU đơn vị active, không xen giữa. Đọc mã thì S05 dùng `.filter` và S06 dùng `continue`, nên thứ tự
    không đổi kết quả. Dù vậy ca test không loại được lỗi kiểu `break` ở đơn vị không active đầu tiên.

- eval: E5
  run_id: cong-tac-that-E5-20261030T233107Z
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.ctt_unit
  verified_at: 2026-10-30T23:31:07Z
  output: |
    ✔ TV2b (e): DB lỗi → 0 lời gọi, thoát ≠0 (fail-closed) — cả S05 lẫn S06 (85.746833ms)
    ✔ v2: vong-doi trả 2 (DB lỗi) → script THOÁT 1 rõ ràng với dòng lỗi (128.717375ms)
    ℹ pass 10
    ℹ fail 0
  note: S05 và S06 với DB không tồn tại: cả hai thoát khác 0, 0 lời gọi. S01 và S02 qua bốn script (v2 cổng 2, E7) thoát 1 với
    dòng fail-closed.

- eval: E6
  run_id: cong-tac-that-E6-20261030T233107Z
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.ctt_unit
  verified_at: 2026-10-30T23:31:07Z
  output: |
    ✔ TV2b (f): trạng thái lạ → chặn (fail-closed) — nguồn lẫn đơn vị (552.771709ms)
    ℹ pass 10
    ℹ fail 0
  note: Nguồn `bogus` thì có `trang-thai-la:nguon` và 0 lời gọi. Nhóm `weird` thì có `khong-con-nhom-active` và 0 lời gọi. Đơn
    vị lạ chỉ được thử ở S05; S06 đi qua cùng `isRunnable`.

- eval: E7
  run_id: cong-tac-that-E7-20261030T233121Z
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.ctt_cong_launchd
  verified_at: 2026-10-30T23:31:21Z
  output: |
    ok   scripts/airdna-daily.sh · cổng 3 → thoát 0, đúng một dòng có lý do
    ok   scripts/airdna-daily.sh · cổng 2 → thoát 1, dừng fail-closed
    ok   pipeline/scripts/weekly-with-jitter.sh · cổng 3 → thoát 0, đúng một dòng có lý do
    ok   pipeline/scripts/weekly-with-jitter.sh · cổng 2 → thoát 1, dừng fail-closed
    ok   scripts/smoke-daily.sh · cổng 3 → thoát 0, đúng một dòng có lý do
    ok   scripts/smoke-daily.sh · cổng 2 → thoát 1, dừng fail-closed
    CONG-LAUNCHD PASS
  note: Bản chép tạm không có collector/ hay nhà cung cấp, nên script đi quá cổng thì đỏ. Thoát 0 với đúng một dòng chứng nó
    dừng tại cổng.

- eval: E8
  run_id: cong-tac-that-E8-20261030T233107Z
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.ctt_unit
  verified_at: 2026-10-30T23:31:07Z
  output: |
    ✔ v2: vong-doi trả 3 → script in dòng bỏ-đi và THOÁT 0 (không còn chết ngầm mã 3) (127.280542ms)
    ✔ v2: vong-doi trả 2 (DB lỗi) → script THOÁT 1 rõ ràng với dòng lỗi (128.717375ms)
    ✔ v2: vong-doi trả 0 → script VƯỢT cổng sang bước kế (không chết ở thay thế lệnh) (254.358875ms)
    ℹ pass 10
    ℹ fail 0
  note: SCRIPTS nay có `scripts/chotot-daily.sh` chép thật. Cổng 3 thì thoát 0, có «bỏ qua lượt thu» và `nguon-paused`. Cổng 2
    thì thoát 1 với «vong-doi … lỗi — dừng (fail-closed)». Ca không đòi «0 nạp» bằng `runs.log`. Nhưng trong cây tạm, bước đọc
    vùng không có `pg` và import phải lỗi, nên script đi quá cổng không thể thoát 0. Exit 0 vì vậy gián tiếp chứng 0 nạp. Thí
    nghiệm riêng (scratchpad `r2/diag-e8`): cổng 3 in đúng 1 dòng, collect-chotot không được gọi. Nên thêm assert `runs.log` vắng
    và đếm một dòng cho rõ.

- eval: E9
  run_id: cong-tac-that-E9-20261030T233122Z
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.ctt_khong_cung
  verified_at: 2026-10-30T23:31:22Z
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
  note: Đọc diff thì mọi chỗ đọc `status` đều đưa cho `isRunnable` hay `docTrangThai`. Probe chỉ soát sáu tệp; các đường thu
    ngoài danh sách nằm ở OOC-1 và OOC-2.

- eval: E10
  run_id: cong-tac-that-E10-20261030T233127Z
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.pipeline
  verified_at: 2026-10-30T23:31:27Z
  output: |
    ✔ mediaFilesOf: v1 / không ảnh / mảng rỗng → null (SQL NULL, COALESCE giữ bản cũ) (0.080833ms)
    ℹ tests 307
    ℹ suites 14
    ℹ pass 307
    ℹ fail 0
    ℹ cancelled 0
    ℹ skipped 0
  note: Mất khoảng 57 giây, gồm 10 ca TV2b. AC-9 còn đòi bộ `scripts/` và việc ghim lại hồ sơ đã ký, xem phần tóm tắt và Known
    limits.

- eval: E11
  run_id: cong-tac-that-E11-20261030T233122Z
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.ctt_scope
  verified_at: 2026-10-30T23:31:22Z
  output: |
    ok  pipeline/scripts/weekly-with-jitter.sh
    ok  scripts/airdna-daily.sh
    ok  scripts/chotot-daily.sh
    ok  scripts/job-exit.test.mjs
    ok  scripts/smoke-daily.sh
    SCOPE OK
  note: Có 26 tệp, không dòng «NGOÀI PHẠM VI» nào. `job-exit.test.mjs` vào phạm vi theo revisit `d-20261030T232128-sc`. Muốn
    sửa harness au3 thì phải mở thêm `scripts/au3-nap-bao-loi/acceptance.mjs`, hoặc có quyết định khác.

## Known limits

- **AC-9, ghim lại hồ sơ đã ký**. Phiên chấm chạy từng lệnh, một lần trên nhánh và một lần trên main `25ce701b`:

  | Lệnh (hồ sơ · eval) | Nhánh | Main | Phán |
  |---|---|---|---|
  | `node --test scripts/job-exit.test.mjs` | 66/66 xanh | 66/66 xanh | đã sửa (vòng 1 đỏ 11) |
  | `node --test scripts/*.test.mjs` (CI; kns E9) | 268/268 xanh | 268/268 xanh | xanh |
  | `au3_chotot` (au3-nap-bao-loi E1/E4/E6; trong kns E8, snapshot-nguyen-tu E7) | đỏ 8 mục | đỏ 2 mục | **nhánh thêm 6** |
  | `au3_lock` (kns E1–E3; au3 E11) | đỏ 2 mục (zalo-import-daily) | đỏ đúng 2 mục đó | có sẵn trên main |
  | `au3_apify` (kns E7; au3 E2/E3/E5/E7) | đỏ 1 mục ((a) DB chết thật) | đỏ đúng 1 mục đó | có sẵn trên main |
  | `kns_au3_regress` (kns E8) | đỏ, dừng ở APIFY | đỏ, dừng ở APIFY | có sẵn; CHOTOT phía sau thì nhánh làm đỏ thêm |
  | `kns_scope` (kns E10) | đỏ, 16 tệp «NGOÀI PHẠM VI» | xanh (diff rỗng) | do nhánh, theo cấu trúc |
  | `kns_s05_gate` (kns E4/E5) | xanh | đỏ 2 mục ((b)) | nhánh sửa |
  | `kns_s05_unit` (kns E6) | xanh 7/7 (cong-tac-that.test) | xanh 2/2 (s05-paused.test) | xanh |
  | `kns_lich_s05`, `kns_lich_unit` (kns E11–E13) | xanh | xanh | xanh |
  | `au3_syntax`, `zc3_syntax` | SYNTAX OK | — | xanh |

  Hai mục đỏ có sẵn của `au3_chotot` trên main là «ECONNREFUSED 2 lần rồi lên» và «(d) DB sống → exit 0». Sandbox không giả
  `transform-media` (bước NH1 thêm sau), nên chuỗi thoát 1. Sáu mục nhánh thêm là (a) ×2, (c), (d) ×3: script dừng ở cổng
  vong-doi vì sandbox thiếu `pipeline/lib/vong-doi.mjs`. `kns_scope` đo diff `merge-base..HEAD` của chính PR cũ, nên chạy trên
  nhánh nào khác cũng đỏ. Người quyết: ghi revisit «thước phạm vi không ghim lại được», hoặc ghim nó trên cây đã merge.
- `khoa-nap-s05-paused/evals.yaml` có dòng revisit `d-20261029T040511Z-1`, nhưng `expected` của E4/E5 vẫn ghi chữ cũ: «log
  'S05 paused — bỏ qua thu'» và «(c) DB không tới → log 'coi như active'». Probe thì đã đo fail-closed. Văn bản thước mâu thuẫn
  với thước.
- Hai lối chạy script thật (v2 cổng 0, job-exit) đều thay bước đọc vùng S06 bằng giá trị cứng, nên bước `node -e` đọc
  `source_groups` trong chotot-daily.sh không có ca nào chạy thật (xem E3).
- Thí nghiệm của phiên chấm (diag-e3, diag-e8, dựng lại sandbox au3) chỉ để chẩn đoán, không thay eval, không ghi run-log. Tệp
  nằm ở scratchpad của phiên. Worktree main có thêm symlink `node_modules` (không theo dõi bởi git) để chạy được.

## Ngoài hợp đồng

Năm mục, đều low trừ OOC-1 (medium). Chi tiết ở `review-findings.md`:
- OOC-1: lệnh cài launchd cũ trỏ thẳng vào lượt thu S01, không qua cổng (medium, còn nguyên).
- OOC-2: các đường chạy tay của S01 và S02 không qua cổng (low, còn nguyên).
- OOC-3: vùng S06 thiếu `cityCode` vẫn bị nhận lặng lẽ (low, đã thu hẹp: thiếu `region_v2` nay có dòng `params-hong`).
- OOC-4: dữ liệu mẫu của test vẫn có thể chèn hỏng lặng lẽ; lược đồ tối giản thiếu CHECK của 047 (low, đã thu hẹp).
- OOC-5: cổng S01 của weekly-with-jitter hỏi trước khi ngủ tới 30 phút (low, mới).

## Analyst

Non-discriminating evals: không đo. Baseline khong do: phiên chấm không chạy lane baseline cho eval. `ctt_unit` và ba probe
(`cong-launchd.sh`, `khong-cung.sh`, `scope.sh`) chưa có trên diffBase, nên chạy trên mã cũ không chứng được gì. `pipeline`
(E10) có trên diffBase nhưng không được chạy lại trên cây cũ. Lượt chạy trên main ở trên dành cho hồi quy AC-9, không phải baseline
của eval.

## Variance

none — không eval nào khai `runs` > 1.

## Iterations

Round 1 (`7d257c00`): E1 và E8 FAIL, E3 UNCERTAIN, vì thiếu ca chứng (S05 active có lời gọi; chotot-daily chạy thật) và vì nửa
nạp chứng bằng bản chép. Ngoài eval: hồi quy 11 ca `scripts/job-exit.test.mjs` (AC-9). Trả về làm tiếp.
Round 2 (`9b1c4814`): E1 và E8 đã sửa, job-exit 66/66. E3 FAIL vì nửa nạp vẫn chứng bằng bản chép. AC-9: harness au3 chế độ chotot
của hồ sơ đã ký au3-nap-bao-loi đỏ thêm 6 mục do cổng vong-doi mới (sandbox thiếu vong-doi.mjs), và kns_scope đỏ theo cấu trúc.
Trả về làm tiếp; vòng 3 là vòng cuối trước khi đưa lên người.
