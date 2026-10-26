---
schema_version: 2
feature_slug: uc-ta-5-tmp-rieng
verdict: REJECT
failed_evals: [E1]
reason:
verified_by: feature-loop:cham-lenh
enforcement_mode: strict
bypass_used: false
verified_commit: 0097b9876b4f25bc20c8a3263095a7b42d49b168
human_signoff:
---

# Evidence Report: uc-ta-5-tmp-rieng

Vòng verify 1 trên cây `0097b98` (nhánh `fix/uc-ta-5-tmp-rieng`, merge-base = origin/main `6045cea`). DB local :5433
đang chạy (container `one-invest-db`). Phiên chấm không viết mã này.

E2 và E3 đạt `expected`. E1 không đạt. Probe năm lượt đỏ 4/5 lượt, cả bốn lần đều ở `UC-BR-6`, một ca trong
`scripts/ui-capture-browser.test.mjs`. Đó là ca chụp trên trình duyệt thật, ngoài tệp mà nhánh sửa. UC-TA-5 xanh ở
9/9 lượt trên HEAD, còn trên baseline nó đỏ 1/4. Như vậy phần sửa đúng mục tiêu, nhưng AC-1 đòi cả bộ không có ca đỏ,
và ca chập chờn còn lại thuộc tệp hợp đồng đã xếp vào «Out of scope». Xem «Ngoài hợp đồng» trong review-findings.md.

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | script | FAIL |
| E2 | AC-2 | script | PASS |
| E3 | AC-3 | script | PASS |

## Evidence

- eval: E1
  run_id: uc-ta-5-tmp-rieng-E1-r1-20261026T043304Z
  exit_code: 1
  baseline: red
  verifier: config:executors.script.uct_nam_luot
  verified_at: 2026-10-26T04:33:04Z
  output: |
    lượt 1: ℹ pass 179 · ℹ fail 1 · ℹ skipped 0
    ✖ UC-BR-6 tên lộ trong chữ hay thuộc tính → mã 5, không ảnh, đầu ra không có tên (25639.032791ms)
    lượt 2: ℹ pass 179 · ℹ fail 1 · ℹ skipped 0
    ✖ UC-BR-6 tên lộ trong chữ hay thuộc tính → mã 5, không ảnh, đầu ra không có tên (22631.418958ms)
    lượt 3: ℹ pass 179 · ℹ fail 1 · ℹ skipped 0
    ✖ UC-BR-6 … (15130.900875ms)
    lượt 4: ℹ pass 179 · ℹ fail 1 · ℹ skipped 0
    ✖ UC-BR-6 … (9551.272125ms)
    lượt 5: ℹ pass 180 · ℹ fail 0 · ℹ skipped 0
  note: lệnh chạy hết 246 giây, không bị công cụ ngắt (timeout 600 s), và không in «NAM-LUOT OK». Phiên chấm chạy
    thêm 4 lượt `node --test scripts/*.test.mjs` để lấy thông điệp lỗi (các lượt này ngoài eval nên không ghi run-log).
    Kết quả 3 lượt xanh, 1 lượt đỏ ở `UC-BR-3`. Thông điệp của UC-BR-3 và UC-BR-6 giống nhau: «không đăng nhập được: GET
    http://127.0.0.1:<cổng>/login không trả 200», tức `capture()` trả mã 6 vì `fetch` tới máy chủ giả thất bại.
    UC-TA-5 có dấu ✔ ở cả 9 lượt.

- eval: E2
  run_id: uc-ta-5-tmp-rieng-E2-r1-20261026T044233Z
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.uct_dot_bien
  verified_at: 2026-10-26T04:42:33Z
  output: |
    ok   bản thật: UC-TA-5 xanh
    ok   đột biến bỏ dọn thư mục tạm → UC-TA-5 đỏ
    DOT-BIEN OK
  note: should-fire đạt. Đột biến `rmSync(tmp,` → `void (tmp,` chạy trên bản chép trong `mktemp -d` (đã tự xoá khi xong).
    Phiên chấm xác nhận thêm rằng `os.tmpdir()` đọc lại TMPDIR mỗi lần gọi, nên thư mục tạm của `capture()` nằm đúng
    trong thư mục riêng mà `demTmp()` đếm.

- eval: E3
  run_id: uc-ta-5-tmp-rieng-E3-r1-20261026T044234Z
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.uct_scope
  verified_at: 2026-10-26T04:42:34Z
  output: |
    ok  _acceptance/uc-ta-5-tmp-rieng/probes/dot-bien.sh
    ok  _acceptance/uc-ta-5-tmp-rieng/probes/nam-luot.sh
    ok  _acceptance/uc-ta-5-tmp-rieng/probes/scope.sh
    ok  scripts/ui-capture-login.test.mjs
    SCOPE OK
  note: should-NOT-fire đạt, không có dòng «NGOÀI PHẠM VI». Probe liệt kê 9 tệp: thêm LO-TRINH.html, PRODUCT-MAP.md,
    _acceptance/config.yaml, contract.md và evals.yaml.

Network truth: không có eval `ui-check` nào. Cả ba eval đều là `script`, không có đường mạng: n-a (driver).

Kho sạch sau các lượt chạy. `git status` chỉ còn các tệp hồ sơ này (run-log.jsonl, review-findings.md,
evidence-report.md). Tệp test đã ghi đè cho baseline được trả về bằng `git checkout --`. Bản chép chẩn đoán trong
scratchpad đã xoá. Thư mục tạm của hệ thống không còn `uc-ta-5-*` nào.

## Known limits

Xem `review-findings.md` mục «Known limits». Gốc lỗi UC-BR chưa tái hiện được khi có công cụ đo. Baseline E1 chỉ có 4 lượt.
Tải máy lúc chấm cao (load average 13–25).

## Ngoài hợp đồng

- **Ca UC-BR-6 / UC-BR-3 (trình duyệt thật) đỏ chập chờn khi cả bộ chạy song song** — `scripts/ui-capture-browser.test.mjs`,
  severity: medium. Lỗi có sẵn trên main (baseline lượt 1 cũng đỏ ở UC-BR-6). Chi tiết theo khuôn OOC ở `review-findings.md`.

## Analyst

Non-discriminating evals: none — E1 đỏ trên baseline. E2 và E3 không đo baseline, lý do ở dưới.

Baseline khong do:
- E2 (`uct_dot_bien`): probe mới, và trên tệp test của main nó cũng cho cùng kết quả (bản thật xanh khi chạy riêng tệp, đột
  biến đỏ). Ca UC-TA-5 cũ chỉ đua khi chạy song song với tệp khác, nên chạy probe này trên baseline không phân biệt được
  gì về phần sửa.
- E3 (`uct_scope`): probe đo diff `merge-base..HEAD` của nhánh. Trên cây diffBase phép đo rỗng.

Cách đo baseline E1: ghi đè tạm `scripts/ui-capture-login.test.mjs` bằng `git show origin/main:…`, chạy `node --test
scripts/*.test.mjs` 4 lượt, rồi khôi phục bằng `git checkout -- scripts/ui-capture-login.test.mjs` (không commit). Kết quả:
- lượt 1 đỏ, `ℹ fail 2`: UC-TA-5 «lệnh con lỗi: thư mục tạm còn» (đúng kiểu đua đếm `ui-capture-*`), cùng với UC-BR-6 (mã 6).
- lượt 2–4 xanh 180/180.
UC-TA-5 đỏ thật ở 1/4 lượt baseline, thấp hơn mức 3/4 hợp đồng ghi. Tỉ lệ này phụ thuộc thời điểm các tệp chạy song song
và tải máy. Trên HEAD, UC-TA-5 đỏ 0/9. Phần sửa có tác dụng với UC-TA-5. Còn UC-BR-6 đỏ ở cả baseline lẫn HEAD, không
liên quan tới diff.

## Variance

flaky — E1 là eval tất định nhưng cho kết quả khác nhau giữa các lượt (xanh 1/5 lượt trong probe). Gốc không nằm ở
UC-TA-5 mà ở UC-BR-6/UC-BR-3 trong `ui-capture-browser.test.mjs`: `fetch` tới máy chủ giả thất bại theo kiểu chập chờn.
Phiên chấm chưa tìm được gốc. Có giả thuyết về keep-alive, ghi ở review-findings.

## Iterations

Round 1: E1 failed — bộ `scripts/` đỏ 4/5 lượt ở UC-BR-6 (`ui-capture-browser.test.mjs`, ca chập chờn có sẵn trên main,
nằm ngoài phạm vi hợp đồng). UC-TA-5 xanh 9/9 trên HEAD, đỏ 1/4 trên baseline. E2 và E3 đạt. Trả về để người ký chọn:
mở rộng phạm vi để sửa ca UC-BR, hoặc viết lại AC-1. Trả về như vậy vì phần sửa của nhánh không gây ra lỗi này.
