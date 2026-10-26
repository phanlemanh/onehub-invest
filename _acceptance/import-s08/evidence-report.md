---
schema_version: 2
feature_slug: import-s08
verdict: PASS
failed_evals: []
reason:
verified_by: feature-loop:cham-lenh
enforcement_mode: strict
bypass_used: false
verified_commit: f51c050fbfdb0ba5c119fd4c4b851203ef5cd59c
human_signoff:
---

# Evidence Report: import-s08

Vòng verify 1 chạy trên cây `f51c050f`, nhánh `claude/acceptance-s08-danh-muc`, merge-base với origin/main là `8fc9603d`. Phiên chấm
không viết mã này và không sửa tệp sản phẩm hay harness. `nap-hai-lan` chạy một lần trên DB local :5433 dưới mốc giả và tự dọn. Năm
eval E1–E4 và E7 dùng chung lượt chạy đó.

Cả 7 eval đều đạt `expected`, kể cả các vế should-NOT-fire:
- Snapshot giả 5 item vào DB thành đúng 3 dòng; item detail và item mang state lạ bị bỏ.
- Chuỗi số hợp lệ được đổi thành số; 'S', '', '2PN' và giá rác về NULL.
- Nạp lại cùng snapshot thì số dòng giữ nguyên 3 → 3, và log báo 0 căn mới.
- Snapshot thử không sinh dòng nào.
- Nhánh S08 chỉ dựng dòng qua `s08RowOf`, và test của hàm này xanh.
- Sau lượt kiểm còn 0 dòng giả.

«Ngoài hợp đồng» có 2 mục mức low; người quyết.

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | script | PASS |
| E2 | AC-2 | script | PASS |
| E3 | AC-3 | script | PASS |
| E4 | AC-4 | script | PASS |
| E5 | AC-5 | script | PASS |
| E6 | AC-5 | test | PASS |
| E7 | AC-6 | script | PASS |

## Evidence

- eval: E1
  run_id: import-s08-E1-20261026T143146Z
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.s08_nap_hai_lan
  verified_at: 2026-10-26T14:31:46Z
  output: |
    ok   mốc giả chưa có trong DB (không đè dữ liệu thật)
    lượt 1: exit 0 · 3 S08 căn (+1 detail bỏ)
    ok   lượt 1 thoát 0
    ok   lượt 1: đúng 3 dòng căn (bỏ detail và state lạ) — được 3
    ok   log lượt 1 đếm căn và 1 detail bỏ
    NAP-HAI-LAN PASS
  note: Regex «log đếm căn» của bộ kiểm (`/0 S08 căn|S08 căn/`) không ràng số căn. Dòng tổng thật in «3 S08 căn (+1 detail bỏ)», khớp 3
    dòng đếm trong DB.

- eval: E2
  run_id: import-s08-E2-20261026T143146Z
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.s08_nap_hai_lan
  verified_at: 2026-10-26T14:31:46Z
  output: |
    ok   chuỗi số hợp lệ đổi được ('100,5' → 100.5, '2' → 2)
    ok   should-NOT-fire: 'S' và '' về NULL, không thành số
    ok   should-NOT-fire: '2PN' và giá rác về NULL
  note: Cùng lượt chạy với E1. Giá trị đọc lại từ cột `stg_s08_inventory` trong DB, không đọc từ hàm pure. Ngoài các ca đã khai,
    `s08Num` còn đổi vài dạng chuỗi rác thành số: xem «Ngoài hợp đồng», OOC-2.

- eval: E3
  run_id: import-s08-E3-20261026T143146Z
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.s08_nap_hai_lan
  verified_at: 2026-10-26T14:31:46Z
  output: |
    lượt 2: exit 0 · 0 S08 căn
    ok   lượt 2 thoát 0
    ok   nạp lại cùng snapshot: số dòng không đổi (3 → 3)
    ok   lượt 2 log đúng 0 căn mới (bộ đếm theo dòng thật sự ghi)
  note: Phép đo chứng đúng «không nhân dòng». Importer không có lối tắt bỏ cả snapshot đã nạp: `airbnb_snapshots` được upsert, và mỗi căn
    đi lại qua `INSERT … ON CONFLICT (source_id, snapshot_id) DO NOTHING`. Số dòng đếm trực tiếp trong DB theo `snapshot_id` trước và sau
    lượt 2. Bộ đếm log tính theo `rowCount === 1`, và regex `\b0 S08 căn` không khớp «10 S08 căn».

- eval: E4
  run_id: import-s08-E4-20261026T143146Z
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.s08_nap_hai_lan
  verified_at: 2026-10-26T14:31:46Z
  output: |
    snapshot thử: exit 0
    ok   should-NOT-fire: snapshot thử (tên sai khuôn mốc) không sinh dòng nào
  note: Thư mục thử mang segment nguồn hợp lệ, nhưng phần mốc không đúng khuôn. Importer thoát sạch và không ghi dòng nào. Bộ kiểm không
    so chữ log của nhánh bỏ, nên nếu importer chết sớm vì lý do khác thì vế 0 dòng cũng xanh. Ở lượt này importer thoát sạch.

- eval: E5
  run_id: import-s08-E5-20261026T143153Z
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.s08_nguon_duy_nhat
  verified_at: 2026-10-26T14:31:53Z
  output: |
    ok   import-airbnb nhập s08RowOf từ import-s08-row.mjs
    ok   có nhánh nạp S08 trong importer
    ok   nhánh S08 gọi s08RowOf để dựng dòng
    ok   should-NOT-fire: nhánh S08 không tự đọc it.payload (không có bản dựng dòng thứ hai)
    NGUON-DUY-NHAT PASS
  note: Regex của bộ kiểm chỉ bắt dạng `it.payload?.`. Phiên chấm đã đọc nhánh S08 trong diff: nhánh chỉ đọc `it.meta?.state` và
    `it.meta?.productCode` (trong log cảnh báo), không đọc `it.payload` ở dạng nào. 21 tham số INSERT đều lấy từ `row` do `s08RowOf`
    trả về.

- eval: E6
  run_id: import-s08-E6-20261026T143154Z
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.s08_row_unit
  verified_at: 2026-10-26T14:31:54Z
  output: |
    ✔ s08RowOf: mapping đủ cột từ payload/meta, giữ đơn vị nguồn
    ✔ s08RowOf: state detail/lạ → null (bỏ, không ghi stg)
    ✔ s08Num/s08Int: chuỗi số hợp lệ đổi được; '', 'S', '2PN', thiếu → null
    ✔ s08RowOf: cột số qua s08Num/s08Int — 'S', '', chuỗi phẩy đổi đúng
    ℹ tests 4
    ℹ pass 4
    ℹ fail 0

- eval: E7
  run_id: import-s08-E7-20261026T143146Z
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.s08_nap_hai_lan
  verified_at: 2026-10-26T14:31:46Z
  output: |
    dọn: xoá 1 snapshot giả · còn 0 dòng giả
    ok   dọn sạch dữ liệu giả
    NAP-HAI-LAN PASS
  note: Việc dọn nằm trong `finally`, nên chạy cả khi có vế đỏ. Dòng `stg_s08_inventory` bị xoá theo cascade từ `airbnb_snapshots`. Bộ
    kiểm đếm lại cả mốc chính lẫn mốc thử qua nonce của lượt: còn 0.

Network truth: không có eval `ui-check` nào. Cả 7 eval là `script`/`test`, không có đường mạng: n-a (driver).

Sau lượt chạy, `git status` chỉ còn các tệp phiên chấm ghi trong `_acceptance/import-s08/` và `_acceptance/thu-danh-muc-ocp1/`.

## Known limits

## Ngoài hợp đồng

Chi tiết và căn cứ ở `review-findings.md`. Các mục chưa qua bác bỏ đối kháng; người quyết.
- OOC-1 (low): importer không có nhánh cho item `project_catalog`. Mỗi item danh mục sinh một dòng cảnh báo «state lạ» khi nạp snapshot
  thật và không vào dòng tổng. Đề xuất: sửa trong vòng này hoặc PL11 (bỏ im lặng có đếm như detail).
- OOC-2 (low): `s08Num` đổi chuỗi chỉ có khoảng trắng thành 0, «1,500» thành 1.5, và nhận dạng hex hay số mũ. Đề xuất: known-limits,
  hoặc siết bằng `trim` và regex số thập phân.

## Analyst

Non-discriminating evals:
none đo được. Không eval nào được chạy trên cây diffBase; lý do ở mục dưới.

Baseline khong do:
- E1–E5, E7: lệnh trỏ tới `scripts/s08-danh-muc/acceptance.mjs`, tệp chưa có trên merge-base `8fc9603d`. Trên cây cũ, nguồn
  `s08-danh-muc` cũng không có trong allowlist của importer.
- E6: `pipeline/scripts/import-s08-row.test.mjs` và `pipeline/import-s08-row.mjs` chưa có trên merge-base.

Soi phản biện bộ kiểm:
- «Không nhân dòng» được chứng bằng số đếm DB theo `snapshot_id` trước và sau lượt 2, không chỉ dựa vào log. Importer không có lối tắt
  cấp snapshot, nên lượt 2 thật sự chạy qua `ON CONFLICT`.
- Vế log lượt 1 (`/0 S08 căn|S08 căn/`) lỏng. Giá trị thật in ra là 3, đã đối chiếu ở E1.
- `nguon-duy-nhat` chỉ bắt `it.payload?.`. Đã bù bằng cách đọc diff (E5).
- Snapshot giả của `nap-hai-lan` không có item `project_catalog`, nên đường đó chưa được đo (OOC-1).

## Variance

none — 7 eval tất định, mỗi lệnh chạy một lần trên HEAD.

## Iterations

Round 1: 7/7 eval đạt trên `f51c050f`. «Ngoài hợp đồng» có 2 mục mức low (cảnh báo dồn cho item danh mục, `s08Num` nhận vài dạng rác);
người quyết. PASS.
