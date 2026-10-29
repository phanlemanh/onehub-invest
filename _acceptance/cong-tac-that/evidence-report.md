---
schema_version: 2
feature_slug: cong-tac-that
verdict: REJECT
failed_evals: [E1, E8]
reason: "E1 thiếu ca chứng nửa «S05 active có nhóm active thì có lời gọi». E8 không có ca nào chạy thật chotot-daily.sh. E3 UNCERTAIN: nửa «được nạp» chỉ chứng bằng bản chép đoạn node, không chạy script. Ngoài eval nhưng trong AC-9: nhánh làm đỏ 11 ca của scripts/job-exit.test.mjs (trên main các ca này xanh)."
verified_by: feature-loop:cham-lenh
enforcement_mode: strict
bypass_used: false
verified_commit: 7d257c0041c007347ab07bc5622685752dfb3595
human_signoff:
---

# Evidence Report: cong-tac-that

Vòng verify 1 chạy trên cây `7d257c00`, nhánh `claude/acceptance-cong-tac-that`. Phiên chấm không viết mã này, không sửa tệp
sản phẩm, test hay probe. Mỗi lệnh chạy một lần. E1–E6 và E8 dùng chung một lượt `ctt_unit`. Mọi lệnh eval đều thoát 0.

Phần chạy đúng:
- S05 tạm dừng: 0 lời gọi, in một dòng có lý do. S05 không còn nhóm active: 0 lượt, không rơi về danh sách cứng.
- S06 thu cả vùng mới active và bỏ vùng paused hay retired.
- DB lỗi thì S05 và S06 dừng, thoát khác 0, 0 lời gọi.
- Trạng thái lạ ở nguồn hay ở nhóm đều bị chặn.
- Ba script vào launchd (airdna-daily, weekly-with-jitter, smoke-daily): cổng trả 3 thì thoát 0 với một dòng có lý do; cổng trả 2 thì dừng.
- Không còn danh sách cứng hay chỗ đọc `enabled`. Pipeline 241/241 xanh. Nhánh chỉ đổi tệp được phép.

Vẫn trượt:
- **E1**: `expected` đòi chứng «nửa active có lời gọi», nhưng không ca nào trong `ctt_unit` cho S05 active với nhóm active rồi đòi
  có lời gọi. Phiên chấm tự thử bằng nhà cung cấp giả và DB tạm: hành vi đúng (gửi 2/4 nhóm, đúng hai nhóm active). Vậy đây là lỗ
  test, không phải lỗi sản phẩm.
- **E8**: `expected` gọi tên «ca chạy thật chotot-daily», nhưng cả hai tệp test và probe E7 đều không chạy `scripts/chotot-daily.sh`.
- **E3 (UNCERTAIN)**: nửa «được thu» chạy collector thật. Nửa «được nạp» chạy một bản chép của đoạn node trong chotot-daily.sh
  (bản chép thiếu try/catch), nên script đổi thì test không bắt được.
- **AC-9, ngoài mọi eval**: `node --test scripts/job-exit.test.mjs` có 11 ca đỏ trên nhánh, gồm AC-1 chotot-daily ×5, AC-3
  chotot-daily và airdna-daily «lành», AC-3 «đủ 10 ca», và AC-4 airdna-daily ×3. Chạy cùng tệp trên cây origin/main thì các ca
  này xanh. Lý do: ca chép script vào cây tạm, nên bước đọc vùng S06 gặp `cd …/pipeline` không tồn tại. Còn ở airdna-daily, ca
  gặp một lời gọi `vong-doi` mà dãy viết trước chưa có. CI chạy bộ `scripts/*.test.mjs`, và các ca này không nằm trong
  `scripts/ci-bo-qua.json`. Vì vậy PR sẽ đỏ.

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | test | FAIL |
| E2 | AC-2 | test | PASS |
| E3 | AC-3 | test | UNCERTAIN |
| E4 | AC-4 | test | PASS |
| E5 | AC-5 | test | PASS |
| E6 | AC-6 | test | PASS |
| E7 | AC-7 | script | PASS |
| E8 | AC-7 | test | FAIL |
| E9 | AC-8 | script | PASS |
| E10 | AC-9 | test | PASS |
| E11 | AC-9 | script | PASS |

## Evidence

- eval: E1
  run_id: cong-tac-that-E1-20261029T043556Z
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.ctt_unit
  verified_at: 2026-10-29T04:35:56Z
  output: |
    ✔ TV2b (a): S05 paused → 0 lời gọi, thoát 0, một dòng mã + lý_do (302.353417ms)
    ℹ tests 9
    ℹ pass 9
    ℹ fail 0
  note: Ca (a) chứng nửa paused: thoát 0, dòng cuối khớp «S05 … — bỏ qua thu», có `nguon-paused`, 0 lời gọi. Ca này đòi dòng
    cuối khớp mẫu, không đòi đúng một dòng. Đọc mã thì nhánh paused chỉ in một dòng. Nửa «nguồn active và có nhóm active thì có
    lời gọi» KHÔNG có ca nào trong lệnh này. (b) và (f) đều đòi 0 lời gọi, còn (c) là S06. Thiếu ca đối chứng dương thì bộ đếm của
    nhà cung cấp giả cho S05 cũng chưa được chứng là đếm được. Thí nghiệm riêng của phiên chấm (scratchpad, DB tạm `zcode_tv2b`, nhà
    cung cấp giả, không phải eval) cho S05 active với 4 nhóm active/paused/active/retired: thoát 0, 3 lời gọi, `startUrls` gồm đúng
    hai nhóm active. Hành vi đúng, nhưng thiếu ca test. Cách sửa: thêm ca S05 active + nhóm active và đòi `hits.length > 0`.

- eval: E2
  run_id: cong-tac-that-E2-20261029T043556Z
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.ctt_unit
  verified_at: 2026-10-29T04:35:56Z
  output: |
    ✔ TV2b (b): S05 active nhưng 0 nhóm active → 0 lượt, KHÔNG fallback, thoát 0 (333.761208ms)
    ℹ pass 9
    ℹ fail 0
  note: Nhóm paused và retired thì thoát 0, có `khong-con-nhom-active`, 0 lời gọi. `FALLBACK_GROUPS` đã bị xoá khỏi mã, và E9 xác
    nhận không còn chỗ nào.

- eval: E3
  run_id: cong-tac-that-E3-20261029T043556Z
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.ctt_unit
  verified_at: 2026-10-29T04:35:56Z
  output: |
    ✔ TV2b (c)+(d): S06 — vùng active được thu (kể cả vùng MỚI), vùng paused/retired bị bỏ, nạp theo DB (517.404333ms)
    ℹ pass 9
    ℹ fail 0
  note: Nửa thu chạy `collect-chotot.mjs` thật. Lời gọi có vùng 12000 và vùng mới 4700. Vùng 13000 (paused) và 5500 (retired)
    không bị gọi: vế should-NOT-fire đạt. Nửa nạp chạy một bản chép của đoạn node đọc vùng (dòng 34–45 của chotot-daily.sh), nên
    vòng `for CITY` và `import_one` không chạy. Phiên chấm so hai đoạn: khác đúng phần try/catch. Thí nghiệm riêng (chép
    chotot-daily.sh thật, các bước sau giả, không phải eval) nạp `hanoi` active và bỏ `hcmc` paused. Hành vi hiện tại đúng, nhưng
    test không bắt được khi script trôi khỏi bản chép. Chọn UNCERTAIN: người quyết bản chép có đủ chứng «được nạp» không.

- eval: E4
  run_id: cong-tac-that-E4-20261029T043556Z
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.ctt_unit
  verified_at: 2026-10-29T04:35:56Z
  output: |
    ✔ TV2b (c)+(d): S06 — vùng active được thu (kể cả vùng MỚI), vùng paused/retired bị bỏ, nạp theo DB (517.404333ms)
    ℹ pass 9
    ℹ fail 0
  note: Một lượt có cả hai nửa: active được bắn, paused/retired không. Bộ mẫu xếp active, active, paused, retired nên chưa thật
    sự «xen giữa». Đọc mã thì cả hai collector lọc bằng `filter`, không dừng ở đơn vị đầu tiên bị chặn. Thí nghiệm riêng ở E1 có
    nhóm S05 xen giữa (active/paused/active/retired) và chỉ nhóm active được gửi. Nên đảo thứ tự mẫu để paused nằm giữa hai active.

- eval: E5
  run_id: cong-tac-that-E5-20261029T043556Z
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.ctt_unit
  verified_at: 2026-10-29T04:35:56Z
  output: |
    ✔ TV2b (e): DB lỗi → 0 lời gọi, thoát ≠0 (fail-closed) — cả S05 lẫn S06 (86.533291ms)
    ✔ v2: vong-doi trả 2 (DB lỗi) → script THOÁT 1 rõ ràng với dòng lỗi (97.359791ms)
    ℹ pass 9
    ℹ fail 0
  note: Ca (e) trỏ vào một DB không tồn tại. S05 và S06 đều thoát khác 0, và 0 lời gọi. Với S01 và S02, ca v2 chép ba script bash
    thật cùng một vong-doi giả trả 2: cả ba thoát 1 với dòng «fail-closed». Bản chép không có collector, nên 0 lời gọi. Ở chotot-daily,
    DB lỗi được xử lý qua `collect-chotot … || exit 1`. Thí nghiệm riêng: thoát 1.

- eval: E6
  run_id: cong-tac-that-E6-20261029T043556Z
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.ctt_unit
  verified_at: 2026-10-29T04:35:56Z
  output: |
    ✔ TV2b (f): trạng thái lạ → chặn (fail-closed) — nguồn lẫn đơn vị (636.27575ms)
    ℹ pass 9
    ℹ fail 0
  note: Nguồn `bogus` cho `trang-thai-la:nguon` với 0 lời gọi. Nhóm `weird` bị lọc, cho `khong-con-nhom-active` với 0 lời gọi.
    Ca chỉ kiểm trên S05; S06 dùng cùng `isRunnable`.

- eval: E7
  run_id: cong-tac-that-E7-20261029T043606Z
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.ctt_cong_launchd
  verified_at: 2026-10-29T04:36:06Z
  output: |
    ok   scripts/airdna-daily.sh · cổng 3 → thoát 0, đúng một dòng có lý do
    ok   scripts/airdna-daily.sh · cổng 2 → thoát 1, dừng fail-closed
    ok   pipeline/scripts/weekly-with-jitter.sh · cổng 3 → thoát 0, đúng một dòng có lý do
    ok   pipeline/scripts/weekly-with-jitter.sh · cổng 2 → thoát 1, dừng fail-closed
    ok   scripts/smoke-daily.sh · cổng 3 → thoát 0, đúng một dòng có lý do
    ok   scripts/smoke-daily.sh · cổng 2 → thoát 1, dừng fail-closed
    CONG-LAUNCHD PASS
  note: Đạt cả vế should-NOT-fire (cổng 2 thì thoát khác 0). Bản chép không có collector/, nên script nào đi quá cổng sẽ đỏ ở bước
    kế. Ca v2 «vong-doi trả 0 → VƯỢT cổng» chứng chiều ngược lại: cổng không chặn nhầm khi được phép chạy.

- eval: E8
  run_id: cong-tac-that-E8-20261029T043556Z
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.ctt_unit
  verified_at: 2026-10-29T04:35:56Z
  output: |
    ✔ v2: vong-doi trả 3 → script in dòng bỏ-đi và THOÁT 0 (không còn chết ngầm mã 3) (92.959917ms)
    ✔ v2: vong-doi trả 2 (DB lỗi) → script THOÁT 1 rõ ràng với dòng lỗi (97.359791ms)
    ℹ tests 9
    ℹ pass 9
    ℹ fail 0
  note: Lệnh thoát 0, nhưng KHÔNG có ca nào chạy `scripts/chotot-daily.sh`. Danh sách SCRIPTS của v2 chỉ có smoke-daily,
    airdna-daily và weekly-with-jitter. Ca (c) chỉ chép đoạn node. Probe E7 cũng bỏ chotot-daily. Không có ca, nên `expected`
    không được chứng: FAIL. Thí nghiệm riêng của phiên chấm (chép chotot-daily.sh thật vào cây tạm, collect/import/transform giả,
    DB tạm): S06 paused thì thoát 0 và 0 lượt nạp; DB chết thì thoát 1. Nhưng khi S06 paused, script vẫn chạy transform-chotot,
    refresh-bait-gap và resolve-properties, và in 4 dòng. AC-7 đòi «thoát 0 kèm một dòng mã + lý do». Người quyết đây là lệch AC-7
    hay chấp nhận (các bước liên nguồn không gọi nhà cung cấp). Cách sửa: thêm vào cong-tac-that-v2 một ca chép chotot-daily.sh
    thật với các bước sau giả, hoặc thêm chotot-daily vào probe E7.

- eval: E9
  run_id: cong-tac-that-E9-20261029T043612Z
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.ctt_khong_cung
  verified_at: 2026-10-29T04:36:12Z
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
  note: Đọc diff thì ba chỗ đọc `status` (S05 loadGroups, S06 loadRegions, đoạn node của chotot-daily) đều đưa cho `isRunnable`
    quyết, không tự so chuỗi. Cổng nguồn dùng `docTrangThai`. Ba chỗ chép cùng một câu SQL đọc nhóm. Probe chỉ soát sáu tệp; đường
    thu ngoài danh sách nằm ở OOC-1 và OOC-2. Tệp log không in group_key S05. S06 in group_key, nhưng đó là slug thành phố, không
    phải tầng A. CLI vong-doi chỉ in `code`, `run` và `ly_do`.

- eval: E10
  run_id: cong-tac-that-E10-20261029T043643Z
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.pipeline
  verified_at: 2026-10-29T04:36:43Z
  output: |
    ✔ mediaFilesOf: v1 / không ảnh / mảng rỗng → null (SQL NULL, COALESCE giữ bản cũ) (0.072667ms)
    ℹ tests 241
    ℹ suites 13
    ℹ pass 241
    ℹ fail 0
    ℹ cancelled 0
    ℹ skipped 0
  note: Chạy khoảng 26 giây, đạt `expected` của E10. Bộ này gồm 9 ca TV2b. Nhưng AC-9 đòi cả bộ test của `scripts/`, mà không eval
    nào chạy. Lượt chạy riêng `node --test scripts/job-exit.test.mjs` (không phải eval) có 11 ca đỏ trên nhánh; trên cây origin/main
    các ca này xanh. Xem phần tóm tắt và Known limits.

- eval: E11
  run_id: cong-tac-that-E11-20261029T043650Z
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.ctt_scope
  verified_at: 2026-10-29T04:36:50Z
  output: |
    ok  pipeline/scripts/s05-paused.test.mjs
    ok  pipeline/scripts/weekly-with-jitter.sh
    ok  scripts/airdna-daily.sh
    ok  scripts/chotot-daily.sh
    ok  scripts/smoke-daily.sh
    SCOPE OK
  note: Có 22 tệp, không dòng «NGOÀI PHẠM VI» nào. Hồ sơ đã ký `khoa-nap-s05-paused` có thước bị đổi theo hành vi mới (AC-5
    fail-open đảo thành fail-closed), và mang dòng revisit `d-20261029T040511Z-1`. Hồ sơ có `job-exit.test.mjs` (đang đỏ) thì chưa
    được ghim lại.

## Known limits

- Hồi quy `scripts/job-exit.test.mjs` (AC-9, không eval nào đo): 11 ca đỏ trên nhánh, xanh trên origin/main. Ca chép
  chotot-daily.sh vào cây tạm không có `pipeline/`, nên bước đọc vùng S06 thoát 1. Dãy lời gọi của airdna-daily có thêm
  `vong-doi`. CI có bước `node --test scripts/*.test.mjs` và không bỏ qua các ca này.
- Ca TV2b của `pipeline` cần container `one-invest-db` và DB `zcode_tv2b` có sẵn: test không tự tạo DB. Job pipeline trên CI dùng
  service postgres, không có container này, và các ca TV2b không nằm trong `scripts/ci-bo-qua.json`. Phiên chấm không mở PR nên
  chưa thấy CI. Đọc mã thì job pipeline nhiều khả năng đỏ (AC-9).
- Bộ test dựng `source_groups` thành bảng thường, không theo lược đồ thật. Phiên chấm chỉ đọc DB :5433: `source_groups` thật là
  VIEW, có đủ `group_key`, `status` và `params`. Câu truy vấn của nhánh chạy được trên lược đồ thật.
- Ba thí nghiệm của phiên chấm (S05 active, chotot-daily chạy thật trên cây tạm, và job-exit trên cây main) chỉ để chẩn đoán,
  không thay cho eval, và không có trong run-log.

## Ngoài hợp đồng

Bốn mục (1 medium, 3 low), chi tiết ở `review-findings.md`:
- OOC-1: lệnh cài launchd cũ trỏ thẳng vào lượt thu S01 không qua cổng (medium).
- OOC-2: các đường chạy tay của S01 và S02 không qua cổng (low).
- OOC-3: vùng S06 active có tham số hỏng bị bỏ lặng lẽ (low).
- OOC-4: dữ liệu mẫu của test hỏng lặng lẽ, và lược đồ tối giản khác lược đồ thật (low).

## Analyst

Non-discriminating evals: không đo. Baseline khong do: phiên chấm chạy độc lập, không có lane baseline. `ctt_unit` và ba probe
(`cong-launchd.sh`, `khong-cung.sh`, `scope.sh`) chưa có trên diffBase, nên chạy trên mã cũ không chứng được gì. `pipeline`
(E10) có trên diffBase nhưng không được chạy lại trên cây cũ.

## Variance

none — không eval nào khai `runs` > 1.

## Iterations

Round 1: E1 và E8 FAIL, E3 UNCERTAIN, vì thiếu ca chứng (S05 active có lời gọi; chotot-daily chạy thật) và vì nửa nạp chứng bằng
bản chép. Ngoài eval: hồi quy 11 ca `scripts/job-exit.test.mjs` (AC-9). Trả về làm tiếp.
