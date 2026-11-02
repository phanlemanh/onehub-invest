---
schema_version: 2
feature_slug: s08-lich-tuan
verdict: PASS
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 25127eacf0f06642239e9062bf246d6b5a10be25
human_signoff: Mạnh 2026-11-02
---

# Evidence Report: s08-lich-tuan

Vòng verify 2, cây `3839846d` (nhánh `feat/zcode-gop-0211`, merge-base `cfa59117` = origin/main lúc chấm). Phiên chấm không viết mã này, không sửa code hay probe. Mọi eval chạy lại từ đầu, không dùng kết quả vòng 1.

8/8 eval đạt. Hai vế của AC-4 và AC-5 không do probe đo mà do phiên chấm thử tay (mục Known limits). Mục Ngoài hợp đồng có một việc phải làm đúng thứ tự khi triển khai: tệp untracked ở checkout chính chặn `git pull --ff-only`.

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | script | PASS |
| E2 | AC-2 | script | PASS |
| E3 | AC-2 | script | PASS |
| E4 | AC-3 | script | PASS |
| E5 | AC-4 | script | PASS |
| E6 | AC-5 | script | PASS |
| E7 | AC-6 | script | PASS |
| E8 | AC-7 | script | PASS |

## Evidence

Mỗi eval chạy lệnh riêng một lần từ gốc worktree, có run_id riêng, xong trước trần công cụ (đặt 600 giây).

- eval: E1
  run_id: s08-lich-tuan-E1-r2-20261102T045615Z
  exit_code: 0
  baseline: red
  verifier: config:executors.script.s08l_do
  verified_at: 2026-11-02T04:56:15Z
  output: |
    ✔ GT-AC-4 S08 tuổi = SLO → fresh
    ✔ GT-AC-4 S08 tuổi = SLO+1 → stale
    ✔ GT-AC-4 ma trận biên đủ 12 ca
    ℹ tests 60
    ℹ pass 60
    ℹ fail 0

- eval: E2
  run_id: s08-lich-tuan-E2-r2-20261102T045627Z
  exit_code: 0
  baseline: red
  verifier: config:executors.script.s08l_do
  verified_at: 2026-11-02T04:56:27Z
  output: |
    ✔ ON22-AC-1 năm khối
    ℹ tests 60
    ℹ pass 60
    ℹ fail 0

- eval: E3
  run_id: s08-lich-tuan-E3-r2-20261102T045638Z
  exit_code: 0
  baseline: green
  verifier: config:executors.script.s08l_app
  verified_at: 2026-11-02T04:56:38Z
  output: |
    ✔ ON22-AC-9 đọc trên cloud qua route ingest thật
    ✔ AU6 slo-mot-nguon
    ℹ tests 20
    ℹ pass 20
    ℹ fail 0

- eval: E4
  run_id: s08-lich-tuan-E4-r2-20261102T045647Z
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.s08l_weekly
  verified_at: 2026-11-02T04:56:47Z
  output: |
    THIEU ENV OK

- eval: E5
  run_id: s08-lich-tuan-E5-r2-20261102T045648Z
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.s08l_weekly
  verified_at: 2026-11-02T04:56:48Z
  output: |
    CONG 3 OK
    CONG LOI OK

- eval: E6
  run_id: s08-lich-tuan-E6-r2-20261102T045648Z
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.s08l_weekly
  verified_at: 2026-11-02T04:56:48Z
  output: |
    THU LOI OK
    CHAY OK

- eval: E7
  run_id: s08-lich-tuan-E7-r2-20261102T045648Z
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.s08l_weekly
  verified_at: 2026-11-02T04:56:48Z
  output: |
    PLIST OK

- eval: E8
  run_id: s08-lich-tuan-E8-r2-20261102T045648Z
  exit_code: 0
  baseline: green
  verifier: config:executors.script.s08l_pii
  verified_at: 2026-11-02T04:56:48Z
  output: |
    ✔ FILL không chứa bảng staging stg_* nào
    ✔ FILL không chứa stg_s08_inventory (S08 chỉ dùng nội bộ — AGENTS.md luật 5, migration 040)
    ℹ tests 8
    ℹ pass 8
    ℹ fail 0

## Known limits

- Probe `weekly.sh` không kiểm vế «in dòng bỏ qua» của AC-4: nó chỉ so mã thoát và số lần gọi bộ thu. Phiên chấm chạy tay `s08-weekly.sh` của HEAD trong cây giả ở scratchpad, cổng trả 3: thấy dòng «— bỏ qua lượt thu S08», script kết thúc sạch.
- Probe không kiểm vế «snapshot mới nhất» của AC-5, vì cây giả của nó chỉ có một snapshot và không xem tên snapshot được nạp. Phiên chấm thử với hai snapshot lệch giờ: importer giả nhận đúng bản mới.
- Toàn bộ đường chạy của script chỉ được đo với bộ thu, cổng và importer giả, đúng Out of scope của hợp đồng. Lượt thật đầu tiên là 08/11 06:30.
- Baseline của E2 không tách riêng được vế ops-facts: lệnh chung đỏ vì các ca SLO của S08, còn riêng tệp ops-facts trên cây tạm cho 14/15 xanh, ca `ON22-AC-10 máy thu thật` đỏ. Cây tạm chỉ chép một phần kho nên chưa rõ ca đó đỏ do cây tạm hay do code cũ.

## Ngoài hợp đồng

- Checkout chính vẫn có `scripts/s08-danh-muc/s08-weekly.sh` untracked, giống hệt bản trong nhánh, và nhánh thêm đúng đường dẫn đó. Vòng 1 đã mô phỏng: `git pull --ff-only origin main` sau merge dừng với lỗi «untracked working tree files would be overwritten», kể cả khi tệp giống hệt. Vòng này xác nhận lại trạng thái tệp, không chạy lại mô phỏng. Làn merge phải chuyển tệp trước khi pull, nếu không checkout chính đứng lại ở bản cũ. Hợp đồng xếp việc này vào bước triển khai. Xem `review-findings.md` F3.
- Khi bộ thu thoát sạch mà không tạo snapshot mới, script nạp lại snapshot cũ và vẫn in «✅ S08 tuần: thu + nạp xong». Vòng này đã thử lại với bộ thu giả. Theo đọc mã vòng 1, ca này xảy ra khi vượt cap ngày, tức chạy lần hai trong cùng ngày; lịch tuần không tự rơi vào. Xem `review-findings.md` F1.

## Analyst

Non-discriminating evals: E3 và E8 xanh trên baseline.
- E3: xanh trên cây merge-base với test và fixture ops-facts của HEAD. Đây là hàng rào hồi quy cho một định nghĩa độ tươi, không chứng minh riêng tính năng này.
- E8: hàng rào hồi quy cố ý. AC-7 giữ một điều đã đúng từ trước.

Baseline khong do:
- E4 đến E7: `scripts/s08-danh-muc/s08-weekly.sh` và plist chưa có trên cây merge-base (đã kiểm), chạy probe trên code cũ không chứng minh gì.

Cách đo baseline: `git archive` merge-base vào scratchpad, chép đè các tệp test của HEAD. E1 và E2 đỏ vì ca SLO của S08 không có trên code cũ.

## Variance

none — không có eval nhiều lượt; lệnh chạy lại trong vòng này (E1/E2, E4 đến E7) cho kết quả giống nhau.

## Iterations

Round 1: 8/8 đạt trên cây `ba9601af`.
Round 2: 8/8 đạt trên cây `3839846d`, chấm lại sau khi nhánh được dựng lại (bỏ một nhánh khác, gộp main mới). Probe của hồ sơ này không đổi.

### Re-pin lần 1 — 2026-11-02, do gộp main, siết bộ dò khong-lo-nguon, sửa fixture AU12 sau vòng chấm
run_id: repin-20261102T053124Z-55269
sha: 25127eacf0f06642239e9062bf246d6b5a10be25 · suites: 6 lệnh exit 0 · evals: 8/8 eval máy đạt kỳ vọng
