---
schema_version: 2
feature_slug: kev-nhan-thuoc-sau-pl1
verdict: PASS
failed_evals: []
reason:
verified_by: feature-loop:cham-lenh
enforcement_mode: strict
bypass_used: false
verified_commit: d47524c434ebfaa03139b529d844ad73d2a1cd25
human_signoff: Mạnh 2026-10-26
---

# Evidence Report: kev-nhan-thuoc-sau-pl1

Vòng verify 1, cây `800eb77c` trên nhánh `fix/kev-nhan-ten-thu-muc-gia`, merge-base với origin/main là `432d7ca7`. Phiên chấm không viết
mã này và không sửa tệp sản phẩm hay harness. stg-roundtrip chạy trên DB local :5433 và tự dọn dữ liệu giả.

Cả 6 eval đều đạt `expected`, kể cả các vế should-NOT-fire. Với tên thư mục theo khuôn mốc PL1, v1–v3 qua kiểm phiên bản, còn v4 bị từ
chối bằng thông báo phiên bản chứ không rơi vào nhánh bỏ thư mục. Khi Kev chết, tin vẫn được đẩy với p = null, và log ghi chữ hiện
hành của ZC6. Bản harness cũ ở merge-base đỏ đúng hai gốc đã khai. Bốn mode còn lại, kiểm DATA-CONTRACT và bộ test collector trên
build sạch đều xanh. Nhánh chỉ đổi tệp được phép. «Ngoài hợp đồng» có 1 mục mức low; người quyết.

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | script | PASS |
| E2 | AC-2 | script | PASS |
| E3 | AC-3 | script | PASS |
| E4 | AC-4 | script | PASS |
| E5 | AC-4 | script | PASS |
| E6 | AC-5 | script | PASS |

## Evidence

- eval: E1
  run_id: kev-nhan-thuoc-sau-pl1-E1-20261026T123328Z
  exit_code: 0
  baseline: red
  verifier: config:executors.script.kev_import_versions
  verified_at: 2026-10-26T12:33:28Z
  output: |
    schemaVersion 1: … qua kiểm phiên bản + sha256, dừng ở bước nối DB (cổng chết)
    ok   v1 được nhận
    ok   v2 được nhận
    ok   v3 được nhận
    schemaVersion 4: … bị từ chối
    ok   should-NOT-fire: v4 bị từ chối trước khi đọc dữ liệu
    IMPORT-VERSIONS PASS
  note: Phần mã thoát của tiến trình importer con trong dòng «schemaVersion N» đã được lược. Importer con thoát lỗi là chủ ý, vì DB trỏ vào cổng chết. Tên thư mục `2026-10-23T000000-<v>` khớp `SNAPSHOT_TS_RE` nhờ nhánh hậu tố `(-[0-9]+)?`. Ca v4 đòi đủ ba điều kiện: có chữ «chưa hỗ trợ», không có «manifest ok:», mã thoát khác không. Bị bỏ vì sai khuôn thì không có chữ «chưa hỗ trợ», nên vế should-NOT-fire không thể xanh nhờ nhánh bỏ qua.

- eval: E2
  run_id: kev-nhan-thuoc-sau-pl1-E2-20261026T123353Z
  exit_code: 0
  baseline: red
  verifier: config:executors.script.kev_handler_label
  verified_at: 2026-10-26T12:33:53Z
  output: |
    ok   should-NOT-fire: tin rỗng không ảnh vẫn bị bỏ như cũ (không phải lọc theo p)
    ok   should-NOT-fire: kênh không phải zalouser không bị đẩy
    gate chết (cổng đóng): POST 1 · p = null
    ok   Kev không nghe → tin vẫn đẩy, p = null
    ok   log ghi Kev không trả lời (kev null / gate-down)
    HANDLER-LABEL PASS
  note: 11/11 vế ok. Chín vế của lượt gate sống giữ nguyên chữ và nguyên điều kiện so với bản ở merge-base. Regex chỉ áp lên log của lượt Kev chết. Trong handler, dòng duy nhất chứa «kev null» là dòng `if (p === null)`, nên handler im lặng về Kev hỏng thì vế này đỏ.

- eval: E3
  run_id: kev-nhan-thuoc-sau-pl1-E3-20261026T123400Z
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.ktp_doi_chung
  verified_at: 2026-10-26T12:34:00Z
  output: |
    đỏ đúng gốc: import-versions — thư mục giả sai khuôn PL1
    đỏ đúng gốc: handler-label — chữ log ZC6 đổi
    DOI-CHUNG OK
  note: Probe chạy bản `acceptance.mjs` ở merge-base `432d7ca7` trên cây hiện hành. Mã sản phẩm của cây này giống hệt merge-base (diff `collector/` và `pipeline/` rỗng). Bản cũ phải in đủ cả hai: «bỏ qua thư mục không đúng khuôn» kèm «IMPORT-VERSIONS FAIL», và «FAIL log ghi gate-down» kèm «HANDLER-LABEL FAIL (1 mục)». Vế «1 mục» chứng rằng mode cũ chỉ đỏ đúng một vế. Sau lượt chạy, tệp tạm `.cu-*.mjs` đã bị xoá: `scripts/kev-nhan/` chỉ còn `acceptance.mjs`.

- eval: E4
  run_id: kev-nhan-thuoc-sau-pl1-E4-20261026T123428Z
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.ktp_cac_mode_khac
  verified_at: 2026-10-26T12:34:28Z
  output: |
    MANIFEST-V3 PASS
    WATCHDOG-L1 PASS
    SOURCEID PASS
    ok   import-airbnb nạp snapshot v3 không lỗi
    ok   → hai dòng stg_zalo_posts khác post_id
    ok   dọn sạch dữ liệu giả
    STG-ROUNDTRIP PASS
    CONTRACT-DOC OK
  note: `collector/dist` được xoá rồi build lại bằng `tsc` (31 tệp mới, mốc 19:34 giờ máy). Mọi vế should-NOT-fire của ba mode đầu đều ok. Sau lượt chạy không còn dòng stg nào của snapshot giả.

- eval: E5
  run_id: kev-nhan-thuoc-sau-pl1-E5-20261026T123634Z
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.collector_test_clean
  verified_at: 2026-10-26T12:36:34Z
  output: |
    ✔ 2510-32: lượt chạy THẬT vẫn ghi snapshot trọn vẹn (writer dời chỗ không gãy luồng)
    ℹ tests 60
    ℹ pass 60
    ℹ fail 0
    ℹ cancelled 0
    ℹ skipped 0
  note: `rm -rf dist` rồi `npm test` chạy trong khoảng 111 giây, dưới trần công cụ 600 giây. Không có dòng ✖ nào.

- eval: E6
  run_id: kev-nhan-thuoc-sau-pl1-E6-20261026T123640Z
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.ktp_scope
  verified_at: 2026-10-26T12:36:40Z
  output: |
    ok  _acceptance/config.yaml
    ok  _acceptance/kev-nhan-thuoc-sau-pl1/probes/doi-chung.sh
    ok  _acceptance/kev-nhan-thuoc-sau-pl1/probes/scope.sh
    ok  _acceptance/kev-thanh-nhan/decisions.jsonl
    ok  scripts/kev-nhan/acceptance.mjs
    SCOPE OK
  note: should-NOT-fire đạt, không có dòng «NGOÀI PHẠM VI». Cả 9 tệp đều ok, gồm thêm LO-TRINH.html, PRODUCT-MAP.md, contract.md và evals.yaml. Diff `config.yaml` chỉ thêm ba khoá `ktp_*`. Diff `decisions.jsonl` chỉ thêm một dòng `revisit` (post-signoff).

Network truth: không có eval `ui-check` nào. Cả 6 eval là `script`, không có đường mạng: n-a (driver).

Kho sạch sau các lượt chạy: `git status` chỉ còn run-log.jsonl, evidence-report.md và review-findings.md của hồ sơ này.
`collector/dist` (gitignored) được build lại từ HEAD.

## Known limits

## Ngoài hợp đồng

Chi tiết và căn cứ ở `review-findings.md`. Mục này chưa qua bác bỏ đối kháng; người quyết.
- OOC-1 (low): từ ZC6, handler ghi cùng một dòng «kev null (timeout/gate)» cho mọi p = null (Kev chết, Kev trả 500, thiếu `noul`)
  và không kèm thông điệp lỗi. Vì vậy E2 chỉ chứng được «log ghi Kev không cho điểm». Đây là hành vi của handler (Out of scope, T3),
  không phải do thước nới. Đề xuất known-limits.

## Analyst

Non-discriminating evals:
none — hai eval của tính năng (E1, E2) đều đỏ trên baseline. E4 và E5 là rào hồi quy theo AC-4, chủ ý xanh độc lập với bản sửa.

Baseline khong do:
- E3 (`ktp_doi_chung`): probe chưa có trên cây diffBase. Chính probe này là phép đo baseline của E1 và E2.
- E4 (`ktp_cac_mode_khac`): không chạy riêng. Mã bốn mode, `collector/`, `pipeline/` và `collector/docs/DATA-CONTRACT.md` giống hệt
  merge-base: `fixtureSnapshot` chỉ có `modeImportVersions` gọi, `runHandler(kevDown)` chỉ có `modeHandlerLabel` gọi. Chạy trên cây
  cũ không chứng thêm điều gì.
- E5 (`collector_test_clean`): diff `collector/` so với merge-base rỗng; cùng lý do.
- E6 (`ktp_scope`): probe đo danh sách tệp đổi `merge-base..HEAD`. Trên cây diffBase không có commit nào của nhánh.

Cách đo baseline:
- E1/E2: lấy từ lượt E3. Bản `acceptance.mjs` ở `432d7ca7` chạy trên mã sản phẩm giống hệt merge-base, tức đúng cây diffBase.
  import-versions FAIL vì cả bốn thư mục giả rơi vào nhánh «bỏ qua thư mục không đúng khuôn». handler-label FAIL đúng 1 mục là
  «log ghi gate-down».

Soi phản biện bản sửa (`git diff origin/main...HEAD -- scripts/kev-nhan/acceptance.mjs`):
- Tên thư mục mới không làm mất ca should-NOT-fire v4: v4 tới được bước kiểm phiên bản và bị từ chối bằng thông báo phiên bản.
- Regex log không khớp khi handler im lặng về Kev hỏng. Vế `gate-down` còn giữ là nhánh chết, vì handler hiện hành không còn chuỗi
  này; nó vô hại nhưng có thể bỏ ở lần sửa sau.
- Tiền đề phụ của kiểm DATA-CONTRACT (`schemaVersion: 3`, `{1,2,3}`) sẽ đỏ khi S08 nâng lên schemaVersion 4. Hợp đồng đã khai
  việc này trong Out of scope (làm ở PL10).

## Variance

none — 6 eval tất định, mỗi lệnh chạy một lần trên HEAD.

## Iterations

Round 1: 6/6 eval đạt trên `800eb77c`. Baseline đỏ ở E1, E2; E4, E5 là rào hồi quy; E3, E6 không đo baseline. «Ngoài hợp đồng» có 1
mục mức low (log handler không phân biệt nguyên nhân Kev hỏng); người quyết. PASS.

### Re-pin lần 1 — 2026-10-26, do ghim lại sau sửa thước kev-nhan (PR #135) và gộp main 441e0405
run_id: repin-20261026T131455Z-88598
sha: f5411aa8349eca5be7328f8de4a253a8e65e53b1 · suites: 6 lệnh exit 0 · evals: 6/6 eval máy đạt kỳ vọng

### Re-pin lần 2 — 2026-10-26, do ghim lại sau thước v4 S08 + probe neo lịch sử cố định
run_id: repin-20261026T154035Z-80472
sha: 32e602d5b14d3fc82b887289ad14d38a3000338c · suites: 6 lệnh exit 0 · evals: 6/6 eval máy đạt kỳ vọng

### Re-pin lần 3 — 2026-10-26, do ghim lại sau gộp main 742cf930
run_id: repin-20261026T161405Z-65322
sha: d47524c434ebfaa03139b529d844ad73d2a1cd25 · suites: 6 lệnh exit 0 · evals: 6/6 eval máy đạt kỳ vọng
