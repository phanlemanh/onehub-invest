---
schema_version: 2
feature_slug: thu-danh-muc-ocp1
verdict: PASS
failed_evals: []
reason:
verified_by: feature-loop:cham-lenh
enforcement_mode: strict
bypass_used: false
verified_commit: f51c050fbfdb0ba5c119fd4c4b851203ef5cd59c
human_signoff: Mạnh 2026-10-26
---

# Evidence Report: thu-danh-muc-ocp1

Vòng verify 1 chạy trên cây `f51c050f`, nhánh `claude/acceptance-s08-danh-muc`, merge-base với origin/main là `8fc9603d`. Phiên chấm
không viết mã này và không sửa tệp sản phẩm hay harness. Mỗi lệnh chạy một lần. E1, E2 và E4 dùng chung một lượt
`collector_test_clean`.

Cả 9 eval đều đạt `expected`, kể cả các vế should-NOT-fire:
- Collector S08 chuyển trang giả thành `inventory_unit`, lọc khoá liên hệ ở chi tiết và danh mục, và ném lỗi khi API trả mã lỗi.
- Thiếu một trong năm cấu hình local thì collector ném lỗi với 0 lời gọi mạng; đủ cấu hình thì có lời gọi và có căn.
- Dòng thêm không chứa chuỗi nào trong bộ mẫu nguồn thật.
- Thước kev-nhan nhận v1–v4 và chặn v5.
- Snapshot S08 thật trên máy khớp sha256, có danh sách căn cao tầng của khu đích, và không có trường liên hệ nào.
- Collector và pipeline xanh trên build sạch, và nhánh chỉ đổi tệp được phép.

«Ngoài hợp đồng» có 4 mục (2 medium, 2 low); người quyết.

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | script | PASS |
| E2 | AC-2 | script | PASS |
| E3 | AC-3 | script | PASS |
| E4 | AC-4 | script | PASS |
| E5 | AC-5 | script | PASS |
| E6 | AC-6 | script | PASS |
| E7 | AC-7 | script | PASS |
| E8 | AC-8 | test | PASS |
| E9 | AC-9 | script | PASS |

## Evidence

- eval: E1
  run_id: thu-danh-muc-ocp1-E1-20261026T143031Z
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.collector_test_clean
  verified_at: 2026-10-26T14:30:31Z
  output: |
    ✔ toRawItems: inventory_unit đúng sourceId/meta/payload nguyên vẹn; bỏ bản ghi không mã căn
    ℹ tests 63
    ℹ pass 63
    ℹ fail 0
    ℹ cancelled 0
    ℹ skipped 0
  note: Lệnh `rm -rf dist` rồi `npm test` chạy khoảng 111 giây (14:28:40 → 14:30:31), dưới trần công cụ 600 giây. Không có dòng ✖ nào.

- eval: E2
  run_id: thu-danh-muc-ocp1-E2-20261026T143031Z
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.collector_test_clean
  verified_at: 2026-10-26T14:30:31Z
  output: |
    ✔ 2410-19: strip PII ĐỆ QUY — contact_data lồng mọi độ sâu bị bỏ; catalog item có mặt
    ℹ pass 63
    ℹ fail 0
  note: Cùng lượt chạy với E1. Ca test chạy `collect` với `S08_PROJECTS=all`, nên đi qua cả item danh mục (`project_catalog`) lẫn item chi
    tiết. Ca này cấy khoá liên hệ ở ba độ sâu và đòi JSON đầu ra không còn «contact», «phone» hay tên người, trong khi trường thường
    được giữ. AC-2 chỉ nói về chi tiết và danh mục. Payload danh sách căn không qua bộ lọc: xem «Ngoài hợp đồng», OOC-3.

- eval: E3
  run_id: thu-danh-muc-ocp1-E3-20261026T143042Z
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.s08_thieu_env
  verified_at: 2026-10-26T14:30:42Z
  output: |
    ok   should-NOT-fire: thiếu S08_API_BASE → ném lỗi, 0 lời gọi mạng
    ok   should-NOT-fire: thiếu S08_EP_UNITS → ném lỗi, 0 lời gọi mạng
    ok   should-NOT-fire: thiếu S08_EP_CATALOG → ném lỗi, 0 lời gọi mạng
    ok   should-NOT-fire: thiếu S08_EP_DETAIL → ném lỗi, 0 lời gọi mạng
    ok   should-NOT-fire: thiếu S08_PROJECTS → ném lỗi, 0 lời gọi mạng
    đủ cấu hình: 4 lời gọi · 8 item
    ok   đủ cấu hình → có lời gọi và có căn (bộ đếm sống)
    THIEU-ENV PASS
  note: `collector/dist` được xoá rồi build lại. Mỗi ca chỉ khác ca đủ cấu hình đúng một khoá, và ca đủ cấu hình không ném. Vì vậy lỗi
    ném trong từng ca là do thiếu đúng khoá đó. Bộ kiểm không so chữ của lỗi. Đọc mã `collect()` thì cả năm thông báo đều gọi tên khoá
    thiếu. Thứ tự trong `collect()` là: gốc API, ba endpoint, đọc tệp token local, `S08_PROJECTS`, rồi mới tới `fetch` đầu tiên. Không
    có lời gọi mạng nào trước khi đủ cấu hình.

- eval: E4
  run_id: thu-danh-muc-ocp1-E4-20261026T143031Z
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.collector_test_clean
  verified_at: 2026-10-26T14:30:31Z
  output: |
    ✔ fetchPage/fetchProjectDetail: gọi đúng URL + Bearer; phân biệt state; lỗi code≠1 ném rõ
    ℹ pass 63
    ℹ fail 0
  note: Cùng lượt chạy với E1. Ca này cho API trả HTTP 200 với thân `code: 401` và đòi `fetchPage` ném lỗi khớp /401/. Nhánh HTTP 401
    (`!r.ok`) không có ca riêng; đọc mã thì nhánh này ném «S08 API <status>». `fetchProjectCatalog` không ném khi gặp mã lỗi: xem OOC-1.

- eval: E5
  run_id: thu-danh-muc-ocp1-E5-20261026T143052Z
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.s08_khong_lo_nguon
  verified_at: 2026-10-26T14:30:52Z
  output: |
    bộ mẫu: 18858 chuỗi · dòng thêm so với main: 1232
    ok   bộ mẫu đủ lớn để có nghĩa
    ok   bộ dò bắt được chuỗi nguồn thật khi cấy vào
    chuỗi nguồn thật khớp trong dòng thêm: 0
    ok   should-NOT-fire: không chuỗi nào của nguồn thật (tên/mã dự án, mã căn, đường dẫn API) trong dòng thêm
    dòng thêm có URL ngoài máy: 0
    ok   should-NOT-fire: không URL tên miền ngoài trong dòng thêm
    ok   project_id trong fixture đều là id giả ≥ 900000 (5 chỗ)
    KHONG-LO-NGUON PASS
  note: Bộ dò bỏ mẫu ngắn hơn 6 ký tự và loại hai tệp máy sinh (LO-TRINH.html, PRODUCT-MAP.md) khỏi diff. Nó chỉ quét dòng đã commit,
    nên các tệp phiên chấm ghi (run-log, báo cáo, findings) chưa được quét. Phiên chấm đã tự soát mấy tệp đó bằng cùng bộ mẫu, chỉ in
    số đếm: 0 khớp.

- eval: E6
  run_id: thu-danh-muc-ocp1-E6-20261026T143059Z
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.s08_kev_v4
  verified_at: 2026-10-26T14:30:59Z
  output: |
    manifest schemaVersion 4 · 2 item
    ok   manifest khai schemaVersion ≥ 3
    ok   tin có kev: meta.kev nguyên vẹn trong raw
    ok   should-NOT-fire: tin không kev không bị gắn meta.kev giả
    MANIFEST-V3 PASS
    ok   v1 được nhận
    ok   v2 được nhận
    ok   v3 được nhận
    ok   v4 được nhận
    ok   should-NOT-fire: v5 bị từ chối trước khi đọc dữ liệu
    IMPORT-VERSIONS PASS
    CONTRACT-DOC OK
  note: Đã lược mã thoát của tiến trình importer con trong các dòng «schemaVersion N: … qua kiểm phiên bản + sha256, dừng ở bước nối DB
    (cổng chết)» và «schemaVersion 5: … bị từ chối». Importer con thoát lỗi là chủ ý, vì DB trỏ vào cổng chết. DATA-CONTRACT ghi
    `"schemaVersion": 4` ở khối manifest, và mục lịch sử v4 ghi «chấp nhận `{1,2,3,4}`». Vế grep `[3-9]` lỏng, nhưng giá trị thực
    trong tài liệu đúng là 4.

- eval: E7
  run_id: thu-danh-muc-ocp1-E7-20261026T143112Z
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.s08_snapshot_that
  verified_at: 2026-10-26T14:31:12Z
  output: |
    snapshot S08 thật: schemaVersion 4 · 20011 item
    ok   sha256 mọi tệp khớp manifest
    dự án có căn: 148 · khớp Ocean Park: 3 (cao tầng 1, thấp tầng 2) · căn Ocean Park: 922
    ok   có danh sách căn cho ít nhất một dự án cao tầng Ocean Park
    ok   mỗi căn Ocean Park có mã căn riêng, không trùng trong dự án
    ok   sourceId không trùng giữa 19669 căn
    trường liên hệ còn trong payload: 0
    ok   should-NOT-fire: không trường liên hệ nào ở mọi độ sâu payload
    SNAPSHOT-THAT PASS
  note: Bộ kiểm chỉ in số đếm. Phiên chấm không mở snapshot bằng tay. Bộ đếm liên hệ khớp đúng một danh sách tên khoá cố định; collector
    lọc theo regex rộng hơn. Xem OOC-3.

- eval: E8
  run_id: thu-danh-muc-ocp1-E8-20261026T143134Z
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.pipeline
  verified_at: 2026-10-26T14:31:34Z
  output: |
    ✔ s08RowOf: mapping đủ cột từ payload/meta, giữ đơn vị nguồn
    ✔ s08Num/s08Int: chuỗi số hợp lệ đổi được; '', 'S', '2PN', thiếu → null
    ℹ tests 224
    ℹ pass 224
    ℹ fail 0
    ℹ cancelled 0
    ℹ skipped 0
  note: Chạy khoảng 15 giây. Không có dòng ✖ nào. Bộ collector của AC-8 nằm ở lượt E1 (63/63 trên build sạch).

- eval: E9
  run_id: thu-danh-muc-ocp1-E9-20261026T143139Z
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.s08_scope
  verified_at: 2026-10-26T14:31:39Z
  output: |
    ok  collector/src/collectors/s08-danh-muc.ts
    ok  pipeline/import-airbnb.mjs
    ok  pipeline/import-s08-row.mjs
    ok  scripts/kev-nhan/acceptance.mjs
    ok  scripts/s08-danh-muc/acceptance.mjs
    SCOPE OK
  note: Cả 27 tệp đổi đều ok. should-NOT-fire đạt: không có dòng «NGOÀI PHẠM VI».

Network truth: không có eval `ui-check` nào. Cả 9 eval là `script`/`test`, không có đường mạng: n-a (driver).

Sau các lượt chạy, `git status` chỉ còn các tệp phiên chấm ghi trong `_acceptance/thu-danh-muc-ocp1/` và `_acceptance/import-s08/`.
`collector/dist` (gitignored) được build lại từ HEAD.

## Known limits

## Ngoài hợp đồng

Chi tiết và căn cứ ở `review-findings.md`. Các mục chưa qua bác bỏ đối kháng; người quyết.
- OOC-1 (medium): `fetchProjectCatalog` gặp mã lỗi thì dừng im lặng. Với `S08_PROJECTS=all` và token hết hạn, lượt thu ra 0 dự án và
  0 item mà không ném lỗi. Đề xuất: sửa trong vòng này (trang đầu `code≠1` thì ném, như `fetchPage`), kèm một ca test.
- OOC-2 (medium): kind `project_catalog` (state `catalog`) chưa khai trong mục v4 của DATA-CONTRACT. Item danh mục và item chi tiết của
  cùng một dự án mang cùng sourceId. Đề xuất: bổ sung mục v4 trước khi merge (v4 chưa lên main, nên không cần v5).
- OOC-3 (low): payload danh sách căn ghi nguyên văn, không qua bộ lọc khoá liên hệ; collector dựa vào việc endpoint không trả các khoá
  đó. Đề xuất: known-limits, hoặc lọc cả ở `toRawItems` và nói rõ trong AC-1.
- OOC-4 (low): chú thích đầu `collector/src/test/s08-danh-muc.test.ts` vẫn ghi «Fixture = dữ liệu API thật», trái với bản v2 (fixture
  giả). Đề xuất: sửa chú thích.

## Analyst

Non-discriminating evals:
none đo được. Không eval nào được chạy trên cây diffBase; lý do ở mục dưới.

Baseline khong do:
- E3, E5, E7: lệnh trỏ tới `scripts/s08-danh-muc/acceptance.mjs`, tệp chưa có trên merge-base `8fc9603d`.
- E1, E2, E4: `expected` gọi tên các ca trong `collector/src/test/s08-danh-muc.test.ts`, tệp chưa có trên merge-base. Collector S08
  cũng chưa có.
- E6: thước kev-nhan trên merge-base vẫn đòi v4 bị từ chối, nên trên cây cũ ca «v4 được nhận» không thể xanh. Không chạy lại riêng.
- E8: rào hồi quy của bộ pipeline; tệp test S08 chưa có trên merge-base.
- E9: probe đo danh sách tệp đổi `merge-base..HEAD`; trên cây diffBase không có commit nào của nhánh.

Soi phản biện bộ kiểm (`git diff origin/main...HEAD -- collector pipeline scripts/s08-danh-muc`):
- thieu-env: bộ kiểm chỉ đòi «có ném và 0 lời gọi», không so chữ của lỗi. Ca đủ cấu hình (4 lời gọi, có căn) là đối chứng, nên mỗi ca
  thiếu chỉ có thể ném vì thiếu đúng khoá đó. Bộ kiểm không xanh nhờ lý do khác. Tệp token giả được đặt trước, nên ca nào cũng không
  ném vì thiếu token.
- Lời gọi mạng trước khi đủ cấu hình: không có. Lỗi lấy chi tiết dự án bị nuốt, có ghi log, rồi vẫn thu danh sách căn. Hành vi này là
  chủ ý, ngoài AC.
- khong-lo-nguon: tự kiểm bằng cách cấy một mẫu vào dòng thêm và thấy bộ dò bắt được. Bộ dò bỏ mẫu ngắn hơn 6 ký tự và hai tệp máy
  sinh. Hai điểm này làm thước hẹp hơn, không làm nó xanh sai.
- `cp -R` trong `collector/package.json`: không còn nuốt lỗi. Lệnh nối bằng `&&`, không có `|| true` hay chuyển hướng lỗi, nên `cp`
  hỏng thì build và test hỏng theo. Ca test S08 đọc fixture thẳng từ `src/test/fixtures`, nên bản chép sang `dist` hiện không cần cho
  ca nào.
- DATA-CONTRACT: kind `inventory_unit` đã khai, kind `project_catalog` chưa khai (OOC-2).

## Variance

none — 9 eval tất định, mỗi lệnh chạy một lần trên HEAD.

## Iterations

Round 1: 9/9 eval đạt trên `f51c050f`. «Ngoài hợp đồng» có 4 mục (catalog im lặng khi lỗi, DATA-CONTRACT thiếu kind `project_catalog`,
danh sách căn không lọc liên hệ, chú thích fixture cũ); người quyết. PASS.
