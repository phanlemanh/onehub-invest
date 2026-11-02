---
schema_version: 2
feature_slug: chotot-thieu-moc
verdict: PASS
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 25127eacf0f06642239e9062bf246d6b5a10be25
human_signoff:
---

# Evidence Report: chotot-thieu-moc

Vòng verify 2, cây `3839846d` (nhánh `feat/zcode-gop-0211`, merge-base `cfa59117` = origin/main lúc chấm). Nhánh được dựng lại sau vòng 1, nên mọi eval được chạy lại. Phiên chấm không viết mã này. DB local :5433 đang chạy. Không gọi nguồn thật: test nạp snapshot giả vào lược đồ tạm.

Cả 3 eval đều đạt `expected`. Điều người ký cần biết nằm ở E3: lệnh của nó chỉ đọc cấu trúc SQL, không nạp gì, nên không tự chứng minh được vế should-NOT-fire «không lùi nội dung». Phiên chấm đo lại bằng importer thật trên HEAD và cây thật không lùi. Nhưng khi đổi `OR` thành `OR TRUE` trong bản chép, E3 vẫn xanh 3/3 trong khi nội dung lùi thật (F1). Mục Known limits có nội dung, nên hồ sơ này không xanh-sạch và cần người đọc ở Cổng 2.

Tên slug và run_id giữ nguyên vì cổng đối chiếu theo chúng; phần còn lại gọi nguồn là S06. Trong trích dẫn, mã thoát kỳ vọng nêu trong tên ca được ghi thành `<mã khác 0>`.

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | script | PASS |
| E2 | AC-2 | script | PASS |
| E3 | AC-3 | script | PASS |

## Evidence

E1, E2 chạy cùng lệnh `ctm_unit`. Mỗi eval có một lượt chạy và một dòng run-log riêng. Mọi lệnh chạy từ gốc worktree.

- eval: E1
  run_id: chotot-thieu-moc-E1-r2-20261102T045609Z
  exit_code: 0
  baseline: red
  verifier: config:executors.script.ctm_unit
  verified_at: 2026-11-02T04:56:09Z
  output: |
    ✔ manifest THIẾU finishedAt → từ chối: <mã khác 0>, KHÔNG sinh dòng NULL, không ghi snapshot (87.041875ms)
    ℹ tests 2
    ℹ pass 2
    ℹ fail 0
  note: Baseline đỏ đúng lý do: importer cũ nhận manifest thiếu mốc và không từ chối. Ca này kiểm dòng log «thiếu finishedAt», 0 dòng NULL và 0 dòng ở bảng snapshot.

- eval: E2
  run_id: chotot-thieu-moc-E2-r2-20261102T045609Z
  exit_code: 0
  baseline: red
  verifier: config:executors.script.ctm_unit
  verified_at: 2026-11-02T04:56:09Z
  output: |
    ✔ dòng NULL CÓ SẴN vẫn cập nhật được bằng snapshot có mốc (không đóng băng ngược) (73.591583ms)
    ℹ tests 2
    ℹ pass 2
    ℹ fail 0
  note: Chạy cả tệp trên baseline, ca này đỏ vì lý do phụ: ca trước để lại dòng NULL nên lệnh gieo trùng khoá chính. Chạy riêng ca này trên baseline thì đỏ đúng lý do, ở phép kiểm «nội dung cập nhật».

- eval: E3
  run_id: chotot-thieu-moc-E3-r2-20261102T045609Z
  exit_code: 0
  baseline: green
  verifier: config:executors.script.ctm_lui
  verified_at: 2026-11-02T04:56:09Z
  output: |
    ✔ upsert có WHERE EXCLUDED.captured_at >= dòng hiện có, đặt SAU mọi SET (0.285917ms)
    ✔ các cột nội dung + snapshot_id + captured_at đặt THẲNG EXCLUDED (hết CASE của 2410-1 v2) (0.050917ms)
    ✔ should-NOT-fire: dấu bằng bị đổi thành > sẽ hổng 'nạp lại cùng snapshot' (0.067875ms)
    ℹ tests 3
    ℹ pass 3
    ℹ fail 0
  note: Lệnh này chỉ đọc chuỗi SQL. Vế should-NOT-fire được phiên chấm đo riêng bằng importer thật trên lược đồ tạm: nạp snapshot cũ hơn thì nội dung, giá, mốc và mã snapshot đều giữ bản mới. Xem Analyst và F1.

Network truth: không có eval `ui-check` nào. Cả 3 eval là `script`: n-a (driver).

Dọn dẹp: `ctm_unit` dùng lược đồ tạm do chính test tạo rồi xoá. Sau các lượt chạy, đọc `pg_namespace` không thấy lược đồ `zcode_` hay `acc_` nào còn sót. Không ghi vào bảng thật nào.

## Known limits

- E3 chỉ kiểm cấu trúc SQL, không kiểm ngữ nghĩa. Nó không bắt được một mệnh đề `OR` làm hỏng luật không lùi, là đúng rủi ro mà AC-3 nêu ra. Kết luận AC-3 đúng trên cây này dựa vào phép đo riêng của phiên chấm, chưa có test nào trong kho giữ nó về sau (F1).
- Hai ca của `ctm_unit` phụ thuộc thứ tự: ca sau gieo cùng khoá chính với dòng ca trước có thể để lại. Trên HEAD không gây vấn đề vì ca trước không ghi gì; nếu ca từ chối hỏng thì ca sau đỏ theo với lỗi trùng khoá, dễ đọc nhầm (F2).

## Ngoài hợp đồng

## Analyst

Non-discriminating evals: E3 xanh trên cả nhánh lẫn baseline, vì mệnh đề WHERE gốc vẫn còn và test chỉ kiểm mệnh đề đó. Đây là làn hồi quy, nhưng yếu hơn tên gọi (F1). E1 và E2 đỏ trên baseline, nên phân biệt được.

Cách đo baseline: `git archive cfa59117` trong scratchpad, chép test mới vào. `ctm_unit`: pass 0, fail 2. Chạy riêng ca dòng NULL: fail 1, ở phép kiểm «nội dung cập nhật». `ctm_lui`: pass 3, fail 0.

Phép đo thêm của phiên chấm, chạy importer thật trên lược đồ tạm, cùng một khoá tin, không thay eval:
- Nạp snapshot mới: dòng mang nội dung mới và mốc mới.
- Nạp snapshot cũ hơn: lệnh thoát 0, dòng không đổi ở cả bốn trường (nội dung, giá, mốc, mã snapshot). Đúng AC-3.
- Nạp snapshot bằng mốc: nội dung cập nhật, đúng tính idempotent của luật cũ.
- `finishedAt` vắng, rỗng và rác: từ chối với dòng log «thiếu finishedAt», dòng không đổi, không thêm dòng snapshot.
- Đột biến trong bản chép, đổi `OR ... IS NULL` thành `OR TRUE`: E3 vẫn pass 3, fail 0; nạp snapshot cũ hơn thì nội dung, giá và mốc lùi về bản cũ.

Đọc thêm, chỉ đọc: bảng stg S06 trong DB local có 0 dòng `captured_at` NULL, và 37/37 manifest S06 trong kho snapshot của checkout chính đều có mốc hợp lệ. Vậy chốt chặn mới không làm kẹt chuỗi hằng ngày với dữ liệu hiện có.

## Variance

none — 3 eval tất định; hai lượt `ctm_unit` cho cùng kết quả.

## Iterations

Round 1: 3/3 eval đạt trên cây `ba9601af`, PASS kèm F1, F2 không chặn.
Round 2: nhánh dựng lại (bỏ một nhánh khác, gộp main mới), 3/3 eval đạt trên `3839846d`. Mã importer và hai tệp test không đổi so với vòng 1. F1, F2 còn; không có finding mới. PASS, kèm Known limits cho người đọc ở Cổng 2.

### Re-pin lần 1 — 2026-11-02, do gộp main, siết bộ dò khong-lo-nguon, sửa fixture AU12 sau vòng chấm
run_id: repin-20261102T053124Z-55269
sha: 25127eacf0f06642239e9062bf246d6b5a10be25 · suites: 6 lệnh exit 0 · evals: 3/3 eval máy đạt kỳ vọng
