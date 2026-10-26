---
schema_version: 2
feature_slug: uc-ta-5-tmp-rieng
verdict: PASS
failed_evals: []
reason:
verified_by: feature-loop:cham-lenh
enforcement_mode: strict
bypass_used: false
verified_commit: 99d20de75d05f5b69ba0bed0c16662c51e0c5c79
human_signoff:
---

# Evidence Report: uc-ta-5-tmp-rieng

Vòng verify 2 chạy trên cây `99d20de` (nhánh `fix/uc-ta-5-tmp-rieng`, merge-base = origin/main `6045cea`). DB local
:5433 đang chạy (container `one-invest-db`). Node v24.21.0. Phiên chấm không viết mã này. Cả bốn eval đạt `expected`.
Bộ `scripts/` xanh 5/5 lượt. Bằng chứng cho lối sửa keep-alive: khi kéo dài thời gian chặn nhân tạo, máy chủ giả bản
main hỏng với `ECONNRESET`, còn bản HEAD thì xanh.

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | script | PASS |
| E2 | AC-2 | script | PASS |
| E3 | AC-3 | script | PASS |
| E4 | AC-4 | script | PASS |

## Evidence

- eval: E1
  run_id: uc-ta-5-tmp-rieng-E1-r2-20261026T050118Z
  exit_code: 0
  baseline: red
  verifier: config:executors.script.uct_nam_luot
  verified_at: 2026-10-26T05:01:18Z
  output: |
    lượt 1: ℹ pass 180 · ℹ fail 0 · ℹ skipped 0
    lượt 2: ℹ pass 180 · ℹ fail 0 · ℹ skipped 0
    lượt 3: ℹ pass 180 · ℹ fail 0 · ℹ skipped 0
    lượt 4: ℹ pass 180 · ℹ fail 0 · ℹ skipped 0
    lượt 5: ℹ pass 180 · ℹ fail 0 · ℹ skipped 0
    NAM-LUOT OK
  note: lệnh chạy hết 139 giây với timeout công cụ 600 s, không bị ngắt. Load average 7,14 lúc bắt đầu và 10,63 lúc kết
    thúc. Vòng 1 chấm ở tải 13–25, cao hơn (xem Known limits).

- eval: E2
  run_id: uc-ta-5-tmp-rieng-E2-r2-20261026T050344Z
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.uct_dot_bien
  verified_at: 2026-10-26T05:03:44Z
  output: |
    ok   bản thật: UC-TA-5 xanh
    ok   đột biến bỏ dọn thư mục tạm → UC-TA-5 đỏ
    DOT-BIEN OK
  note: should-fire đạt. Bản chép dùng cho đột biến nằm trong `mktemp -d` và đã tự xoá.

- eval: E3
  run_id: uc-ta-5-tmp-rieng-E3-r2-20261026T050344Z
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.uct_scope
  verified_at: 2026-10-26T05:03:44Z
  output: |
    ok  LO-TRINH.html
    ok  PRODUCT-MAP.md
    ok  _acceptance/config.yaml
    ok  _acceptance/uc-ta-5-tmp-rieng/… (10 tệp hồ sơ)
    ok  scripts/ui-capture-browser.test.mjs
    ok  scripts/ui-capture-login.test.mjs
    SCOPE OK
  note: should-NOT-fire đạt, không có dòng «NGOÀI PHẠM VI». Diff có 15 tệp, chỉ hai tệp mã như AC-3 cho phép.

- eval: E4
  run_id: uc-ta-5-tmp-rieng-E4-r2-20261026T050344Z
  exit_code: 0
  baseline: red
  verifier: config:executors.script.uct_keepalive
  verified_at: 2026-10-26T05:03:44Z
  output: |
    keepAliveTimeout = 120000
    dòng assert đổi: 0
    KEEPALIVE OK
  note: should-NOT-fire đạt, 0 dòng assert đổi. Trên baseline (tệp ghi đè tạm bằng bản origin/main) probe báo
    «keepAliveTimeout = không có» và không in KEEPALIVE OK. Phiên chấm còn đo phần hành vi bằng tay. Ở tải khoảng 9,
    khoảng cách giữa hai fetch là 3,2–4,1 giây, sát ngưỡng 5 giây mặc định. Khi cho mỗi lệnh `playwright-cli` ngủ
    thêm 1 giây, khoảng cách lên 10–12,9 giây: máy chủ giả bản main làm `UC-BR-6` đỏ với lỗi `ECONNRESET` (2/2 lượt
    đọc được), còn bản HEAD xanh 3/3 (2/2 lượt). Chi tiết ở review-findings.md.

Network truth: không có eval `ui-check` nào. Cả bốn eval đều là `script`, không có đường mạng: n-a (driver).

Kho sạch sau các lượt chạy. `git status` chỉ còn các tệp hồ sơ: run-log.jsonl, review-findings.md, evidence-report.md
và contract.md. Tệp test đã ghi đè cho baseline được trả về bằng `git checkout --`. Bản chép đo đạc trong scratchpad đã
xoá. Thư mục tạm của hệ thống không còn `uc-ta-5-*`, `ui-capture-*` hay `uc-browser-*` nào.

## Known limits

Chi tiết ở `review-findings.md`, mục «Known limits». Baseline E4 không tự tái hiện ở tải 8–11: 9 lần chạy tệp bản main
đều xanh. Lỗi chỉ tái hiện được khi kéo dài thời gian chặn nhân tạo. E1 vòng 2 chạy ở tải thấp hơn vòng 1. E4 là phép
kiểm tĩnh, phần hành vi dựa trên phép tái hiện thủ công. Vai trò của headersTimeout chưa đo được bằng thực nghiệm.

## Ngoài hợp đồng

## Analyst

Non-discriminating evals: none — E1 và E4 đỏ trên baseline. E2 và E3 không đo baseline, lý do ở dưới.

Baseline khong do:
- E2 (`uct_dot_bien`): cùng lý do như vòng 1. Ca UC-TA-5 cũ chỉ đua khi chạy song song với tệp khác, nên chạy probe
  đột biến riêng tệp trên baseline không phân biệt được gì về phần sửa.
- E3 (`uct_scope`): probe đo diff `merge-base..HEAD` của nhánh. Trên cây diffBase phép đo rỗng.

Baseline E1 giữ như vòng 1: tệp test ghi đè tạm bằng bản origin/main, chạy 4 lượt, lượt 1 đỏ ở UC-TA-5 và UC-BR-6.
Baseline E4: ghi đè tạm `scripts/ui-capture-browser.test.mjs` bằng bản origin/main (khôi phục bằng `git checkout --`,
không commit). Probe E4 đỏ trên baseline. Phiên chấm còn chạy 3 vòng, mỗi vòng gồm 1 lượt cả bộ và 2 lượt riêng tệp
song song, ở tải 8–11: tất cả xanh (0/9 lần UC-BR đỏ). Lỗi UC-BR không tự tái hiện ở tải đó. Nó chỉ tái hiện khi kéo
dài thời gian chặn nhân tạo.

## Variance

none — mọi eval cho kết quả đồng nhất ở vòng này, E1 xanh 5/5 lượt. Vòng 1 E1 chập chờn (xanh 1/5) do UC-BR. Gốc lỗi đã
tìm ra: kết nối giữ sống của máy chủ giả bị đóng sau 5 giây trong lúc tiến trình test bị `execFileSync` chặn. Phần
sửa của AC-4 xử lý đúng gốc này.

## Iterations

Round 1: E1 failed — bộ `scripts/` đỏ 4/5 lượt ở UC-BR-6/UC-BR-3 (`ui-capture-browser.test.mjs`, chập chờn có sẵn trên
main, nằm ngoài phạm vi lúc đó). REJECT. Mạnh quyết `d-20261026T050030Z-1`: gộp phần sửa máy chủ giả vào hồ sơ (AC-4/E4).
Round 2: E1–E4 đều đạt trên `99d20de`. E1 xanh 5/5. Phép tái hiện có độ trễ nhân tạo xác nhận gốc keep-alive. PASS.
