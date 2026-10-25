---
schema_version: 2
feature_slug: lockdown-cloud-theo-facts
verdict: PENDING-JUDGMENT
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 3f7a6ee55e245c36c1781e92df9cf19e00a586cf
human_signoff:
---

# Evidence Report: lockdown-cloud-theo-facts

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | test | PASS |
| E2 | AC-2 | test | PASS |
| E3 | AC-3 | test | PASS |
| E4 | AC-4 | test | PASS |
| E5 | AC-5 | test | PASS |
| E6 | AC-6 | test | PASS |
| E7 | AC-7 | judgment | PASS |
| E8 | AC-8 | test | PASS |
| E8b | AC-8 | test | PASS |
| E9 | AC-9 | ui-check | PASS |

## Evidence

- eval: E1
  run_id: minted-lockdown-cloud-theo-facts-E1-r2
  exit_code: 0
  baseline: green
  verifier: config:executors.test.app_ui
  verified_at: 2026-10-25T01:58:33Z
  output: |
    cd app && npm test
    ℹ duration_ms 29816.595958

- eval: E2
  run_id: minted-lockdown-cloud-theo-facts-E2-r2
  exit_code: 0
  baseline: green
  verifier: config:executors.test.app_ui
  verified_at: 2026-10-25T01:58:33Z
  output: |
    cd app && npm test
    ℹ duration_ms 29816.595958

- eval: E3
  run_id: minted-lockdown-cloud-theo-facts-E3-r2
  exit_code: 0
  baseline: green
  verifier: config:executors.test.app_ui
  verified_at: 2026-10-25T01:58:33Z
  output: |
    cd app && npm test
    ℹ duration_ms 29816.595958

- eval: E4
  run_id: minted-lockdown-cloud-theo-facts-E4-r2
  exit_code: 0
  baseline: green
  verifier: config:executors.test.app_ui
  verified_at: 2026-10-25T01:58:33Z
  output: |
    cd app && npm test
    ℹ duration_ms 29816.595958

- eval: E5
  run_id: minted-lockdown-cloud-theo-facts-E5-r2
  exit_code: 0
  baseline: green
  verifier: config:executors.test.app_ui
  verified_at: 2026-10-25T01:58:33Z
  output: |
    cd app && npm test
    ℹ duration_ms 29816.595958

- eval: E6
  run_id: minted-lockdown-cloud-theo-facts-E6-r2
  exit_code: 0
  baseline: green
  verifier: config:executors.test.app_ui
  verified_at: 2026-10-25T01:58:33Z
  output: |
    cd app && npm test
    ℹ duration_ms 29816.595958

- eval: E8
  run_id: minted-lockdown-cloud-theo-facts-E8-r2
  exit_code: 0
  baseline: red
  verifier: config:executors.test.app
  verified_at: 2026-10-25T01:58:33Z
  output: |
    cd app && npx tsc --noEmit && npm run lint
    tsc sạch, lint sạch (không có dòng lỗi nào trong phần đuôi kết quả)

- eval: E8b
  run_id: minted-lockdown-cloud-theo-facts-E8b-r2
  exit_code: 0
  baseline: green
  verifier: config:executors.test.ui_lint_rules
  verified_at: 2026-10-25T01:58:33Z
  output: |
    cd app && npm run test:lint-rules
    ℹ duration_ms 235.986666

- eval: E9
  run_id: minted-lockdown-cloud-theo-facts-E9-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.design.ui_check
  verified_at: 2026-10-25T01:58:33Z
  screenshot: evidence/E9-ST-lockdown-none.png
  observed: |
    none (E9-ST-lockdown-none.png): vung 'Khoa an toan & ha tang thu', phu de 'Chua co so tu may thu', tab Tat ca 8 va 'Chi kiem o may thu' 8, 8 dong L1..Cong nhan tin :9210 deu nhan vang 'Chi kiem o may thu'; the Suc khoe nguon trong 'Chua co du lieu'; khung dung ten none, khop. fresh (E9-ST-lockdown-fresh.png): o 'Khoa an toan' 3/8 voi thanh xanh/do/xam va On 3, Hong 1, Chua kiem duoc 4, ngay duoi la luoi #lockdown 8 dong (L4 Hong do, 3 dong ha tang On xanh, 4 dong Chua kiem duoc), tab Tat ca 8 / Hong 1 / Chua kiem duoc 4 / On 3, khong banner; khop. mixed (E9-ST-lockdown-mixed.png): o 4/8, On 4, Hong 2, Chua kiem duoc 2; luoi co du ba nhan (On: L1,L3,L4,Kev; Chua kiem duoc: L2,OpenClaw; Hong: L4b, Cong nhan tin) va ba so tren tab (Hong 2, Chua kiem duoc 2, On 4); khop. stale (E9-ST-lockdown-stale.png): banner vang 'May thu khong day so tu 2026-10-25 08:14 (GMT+7)', cac o KPI va chip xam (Dat 4 xam, On xam), 'Hong' van do, luoi 8 dong; khop. dark (E9-dark-ST-lockdown-stale.png): nen toi, cung trang thai stale (banner vang toi, chip xam, Hong do), chu doc ro; khop. narrow-none (E9-narrow-ST-lockdown-none.png, 390px): cot don, banner tim 'Chi do o may thu', 4 the KPI '—', vung Khoa an toan 8 dong nhan 'Chi kiem o may thu' voi bang cuon ngang trong khung, khong tran trang; khop. narrow-fresh (E9-narrow-ST-lockdown-fresh.png, 390px): the 'Khoa an toan' 3/8 (On 3, Hong 1, Chua kiem duoc 4), luoi Hong 1 / Chua kiem duoc / tab, khong tran ngang; khop. Khong co frame nao mau thuan Expected.
    Luu y cho nguoi duyet: khung stale va dark-stale chup truoc ban sua ec3d89e (cham tab «Song» cua luoi May moc). Phan nhin thay cua khung stale (den het luoi Khoa an toan) khop expected; luoi May moc nam duoi phan do nen khung nay khong chung minh duoc cham tab «Song» da xam. Xem review-findings.md.
  network_observed: no-app-traffic

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-lockdown-cloud-theo-facts-SUITE-npm_test__bb6271-r2
  exit_code: 0
  verified_at: 2026-10-25T01:58:33Z

- cmd: cd pipeline && npm test
  run_id: minted-lockdown-cloud-theo-facts-SUITE-npm_test__13563d-r2
  exit_code: 0
  verified_at: 2026-10-25T01:58:33Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-lockdown-cloud-theo-facts-SUITE-node_scripts_check_portal_compliance_mjs-r2
  exit_code: 0
  verified_at: 2026-10-25T01:58:33Z

### Judgment

- eval: E7
  judged_by: judge panel (3 lens, fresh context) — đề xuất của panel: PASS, cả ba phiếu đều PASS
  verdict: PASS
  rationale: Cả ba lens cho PASS: chữ hiển thị khớp bảng ST-lockdown-*, ADR-0014 và CONTEXT.md, không lớp nào xanh khi không kiểm. Đây chỉ là đề xuất của máy; người ký quyết ở Cổng 2.
  human_override:  # chi nguoi ghi

Phiếu của từng lens (đề xuất, đầy đủ):

- domain-correctness: PASS — Bảng ST-lockdown-* khớp chữ thật trong code. Không khối thì lưới ghi 8 hàng «Chỉ kiểm ở máy thu» (vàng `warning-light`) và ô Khoá an toàn là «—» kèm «Chưa kiểm được trên máy chủ». `ok: null` hiện «Chưa kiểm được» (`outline`), và khi số cũ thì «Ổn» (lưới Khoá an toàn, ô, tab) và «Sống» (lưới Máy móc) đều thôi xanh. Không chữ «máy local», «cloud» hay «lockdown» nào nằm trong chuỗi hiển thị (chỉ còn ở comment). Từ vựng khớp mục «Máy thu», «Máy chủ», «Khoá an toàn» trong CONTEXT.md, và ADR-0014 §Ngưỡng trễ được giữ. Chưa có chỗ nào vẽ xanh khi không kiểm.
- operational-feasibility: PASS — Chữ thật khớp bốn trạng thái ST-lockdown-*. Không có khối, lưới khoá an toàn dựng đủ lớp với nhãn «Chỉ kiểm ở máy thu» (`warning-light`, chấm tab vàng), ô «Khoá an toàn» là «—» kèm «Chưa kiểm được trên máy chủ». Lớp `ok:null` hiện «Chưa kiểm được» ở `outline`, Kev gate và collector API có trạng thái `unchecked` cũng «Chưa kiểm được» ở `outline`. Khối cũ thì «Ổn» và «Sống» chuyển `outline`, chấm tab và thanh phân đoạn mất màu xanh. Chữ hiển thị chỉ dùng «máy thu», «máy chủ», «Khoá an toàn», đúng CONTEXT.md; «lockdown» và «cloud» chỉ nằm trong comment, id neo và tên code. Tôi chưa xác minh được hai việc nằm ngoài danh sách input: hàm ánh xạ lớp «Cổng Kev :8009» và «Cổng nhận tin :9210» sang hàng Máy móc, và `FactsStaleAlert`.
- spec-alignment: PASS — Bốn tệp giao diện khớp bảng ST-lockdown-*. Không có khối khoá an toàn thì cả 8 hàng ghi «Chỉ kiểm ở máy thu» (vàng) và ô Khoá an toàn là «—» kèm «Chưa kiểm được trên máy chủ». Lớp `ok: null` ghi «Chưa kiểm được» viền xám. Khi số cũ, «Ổn» và «Sống» chuyển sang `outline` và chấm tab chuyển xám. Chuỗi hiển thị chỉ dùng «máy thu», «máy chủ», «Khoá an toàn» đúng CONTEXT.md. «máy local», «cloud», «lockdown» chỉ nằm trong comment và tên mã, không có trên giao diện. Giới hạn: phần ánh xạ Kev gate và collector API sang lớp «Hạ tầng» nằm ở `ops-cloud.ts`, không nằm trong danh sách input nên tôi không kiểm; `JobsGrid` chỉ cho thấy nó có trạng thái «Chưa kiểm được» và xử lý cờ số cũ.

Ghi chú máy cho người đọc: hợp đồng này là T3 nên E7 cần người ký xác nhận trực tiếp, dù cả ba phiếu đều PASS. Ba lens đều nêu cùng một giới hạn: phần ánh xạ Kev gate và collector API nằm ngoài danh sách input của eval nên chưa được hội đồng đối chiếu. Phần này được các ca ON23-AC-5 của E5 kiểm bằng máy.

## Known limits

## Ngoài hợp đồng

## Analyst

Eval không phân biệt (xanh ở cả code mới lẫn baseline — chứng minh harness hơn là tính năng; viết lại để assert hành vi mới hoặc xác nhận là regression-guard có chủ ý):
- `cd app && npm test` — E1, E2, E3, E4, E5, E6
- `cd app && npm run test:lint-rules` — E8b

Baseline không đo: E9 (ui-check) — máy ghi n-a; máy không nêu lý do chi tiết.

## Variance

none — every multi-run eval is uniform

## Iterations

Round 1: mọi eval máy xanh (E1-E6, E8, E8b, E9); verdict PENDING-JUDGMENT vì E7 còn một phiếu bất đồng (spec-alignment, chấm tab «Sống» ở jobs-grid khi số cũ) và E9 có lưu ý thanh cuộn ngang bên trong khung bảng ở 390px. Mạnh trả lại ở Cổng Bằng chứng lượt 1: E7 chưa đạt vì chấm tab «Sống» của lưới Máy móc vẫn xanh khi số cũ. Quay lại triển khai, sửa ở ec3d89e.
Round 2: mọi eval máy xanh (E1-E6, E8, E8b, E9) trên 3f7a6ee; ba phiếu E7 đều PASS sau bản sửa. Verdict PENDING-JUDGMENT vì E7 (T3) cần người ký trực tiếp; ảnh E9 stale và dark-stale chụp trước bản sửa ec3d89e nên người duyệt cần xem (xem review-findings.md).

