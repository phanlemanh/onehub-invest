---
schema_version: 2
feature_slug: df0-chang-theo-ngay-diem-0
verdict: REJECT
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 89e98c7e601bf1ce3499ca4316fe893fa3aed133
human_signoff:
---

# Evidence Report: df0-chang-theo-ngay-diem-0

Round 1. Không eval nào của hợp đồng đỏ, nhưng có một lệnh suite hồi quy đỏ không gắn eval nào (`cd app && npm test`) nên tổng thể là REJECT. Chi tiết ở khối suite bên dưới và mục Iterations.

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | test | PASS |
| E2 | AC-2 | test | PASS |
| E3 | AC-3 | test | PASS |
| E4 | AC-4 | test | PASS |
| E5 | AC-5 | test | PASS |
| E6 | AC-6 | judgment | PASS |
| E7 | AC-7 | ui-check | PASS |
| E8 | AC-8 | test | PASS |

## Evidence

Sáu eval test E1, E2, E3, E4, E5, E8 cùng chạy chung một lệnh `cd app && node --import tsx --test tests/df0-chang-theo-ngay.test.tsx` (một lượt, một lần chạy, không phương sai).

- eval: E1
  run_id: minted-df0-chang-theo-ngay-diem-0-E1-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.chang_ngay
  verified_at: 2026-10-26T23:56:03Z
  output: |
    ℹ duration_ms 1724.45275

- eval: E2
  run_id: minted-df0-chang-theo-ngay-diem-0-E2-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.chang_ngay
  verified_at: 2026-10-26T23:56:03Z
  output: |
    ℹ duration_ms 1724.45275

- eval: E3
  run_id: minted-df0-chang-theo-ngay-diem-0-E3-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.chang_ngay
  verified_at: 2026-10-26T23:56:03Z
  output: |
    ℹ duration_ms 1724.45275

- eval: E4
  run_id: minted-df0-chang-theo-ngay-diem-0-E4-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.chang_ngay
  verified_at: 2026-10-26T23:56:03Z
  output: |
    ℹ duration_ms 1724.45275

- eval: E5
  run_id: minted-df0-chang-theo-ngay-diem-0-E5-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.chang_ngay
  verified_at: 2026-10-26T23:56:03Z
  output: |
    ℹ duration_ms 1724.45275

- eval: E6
  judged_by: judge-subagent (fresh context), đề xuất panel 3 góc nhìn
  verdict: PASS
  rationale: Cả ba góc nhìn cùng xác nhận chuỗi truyền một nguồn thời gian, từ page.tsx qua DataFlowView tới StageTrendChart, và biểu đồ dựng từ dailySeries mà không sort hay slice trên danh sách ngày có số.
  votes:
    - domain-correctness: PASS — page.tsx gọi `requestTime()` đúng một lần, gán vào `nowMs` (dòng 45), rồi truyền `{ now: nowMs }` cho `getDataFlow` (dòng 46) và `nowMs={nowMs}` cho `DataFlowView` (dòng 49). data-flow-view.tsx truyền `nowMs` nhận được sang `<StageTrendChart ... nowMs={nowMs} />` (dòng 73). stage-trend-chart.tsx dựng `series = dailySeries(days, nowMs, windowDays)` (dòng 49) rồi map ra `data` (dòng 50). File này không có sort hay slice trên danh sách các ngày có số.
    - operational-feasibility: PASS — page.tsx gọi requestTime() đúng một lần (`const nowMs = requestTime()`, dòng 45) rồi dùng cho cả `getDataFlow(window, { now: nowMs })` lẫn `<DataFlowView nowMs={nowMs} />`. data-flow-view.tsx truyền `nowMs={nowMs}` cho StageTrendChart (dòng 73). stage-trend-chart.tsx dựng dữ liệu bằng `dailySeries(days, nowMs, windowDays)` (dòng 49) và file không có sort hay slice nào trên danh sách ngày có số.
    - spec-alignment: PASS — page.tsx gọi requestTime() đúng một lần để gán `nowMs`, rồi dùng chính biến đó cho `getDataFlow(window, { now: nowMs })` và `<DataFlowView … nowMs={nowMs} />`. data-flow-view.tsx truyền prop `nowMs` của nó vào `<StageTrendChart … nowMs={nowMs} />`. stage-trend-chart.tsx dựng dữ liệu bằng `dailySeries(days, nowMs, windowDays)` rồi `.map`, không có sort/slice trên danh sách các ngày có số. Tôi không đọc thân hàm `dailySeries` vì nó nằm ngoài danh sách input, và câu hỏi chỉ hỏi chart có dựng từ hàm đó hay không.
  required_evidence:
    - (judge không nêu bằng-chứng-thiếu)
  human_override:  # chi nguoi ghi

- eval: E7
  run_id: minted-df0-chang-theo-ngay-diem-0-E7-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.design.ui_check
  verified_at: 2026-10-26T23:56:03Z
  screenshot: evidence/E7-step1.png
  observed: |
    E7-step1.png: trang Ops «Dòng chảy dữ liệu», khung «Chặng theo ngày» (cua so 30 ngay) cuon vao giua; 4 KPI Bai nhan 34.590, Doc duoc 24.292, Tin rao moi 21.248, Gan can 20.893; truc X co nhan 28/9, 1/10, 3/10, 5/10, 7/10, 9/10, 12/10, 15/10, 18/10, 21/10, 24/10, 27/10 → dau 28/9, cuoi 27/10 dung Expected; duong dien tich bat dau sat truc o 28/9 va cham truc o cuoi. E7-step2.png: ro chuot vao diem dau; tooltip «28/9» Bai nhan 29, Doc duoc 28, Tin rao moi 28, Gan can 28, cham xanh o diem dau tren truc; khong co ngay 0 o ca bon chang trong 30 tooltip da doc (ghi ro «không có ngày im trong cửa sổ»). E7-step3.png: cua so 7 ngay, KPI 30.014/20.850/17.813/17.496; dung 7 nhan 21/10 22/10 23/10 24/10 25/10 26/10 27/10, ngay cuoi 27/10 = hom nay gio VN; duong dien tich ve du 7 diem toi 27/10.
  network_observed: no-app-traffic

- eval: E8
  run_id: minted-df0-chang-theo-ngay-diem-0-E8-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.chang_ngay
  verified_at: 2026-10-26T23:56:03Z
  output: |
    ℹ duration_ms 1724.45275

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-df0-chang-theo-ngay-diem-0-SUITE-npm_test__bb6271-r1
  exit_code: 0
  verified_at: 2026-10-26T23:56:03Z

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-df0-chang-theo-ngay-diem-0-SUITE-lint-r1
  exit_code: 0
  verified_at: 2026-10-26T23:56:03Z

- cmd: cd app && npm test
  run_id: minted-df0-chang-theo-ngay-diem-0-SUITE-npm_test__bd9a35-r1
  exit_code: 1
  verified_at: 2026-10-26T23:56:03Z
  output: |
    ✖ ON12-AC-1 danh sách tệp quét thiếu một tệp → đỏ nêu tệp
      AssertionError: Expected values to be strictly deep-equal
      actual:   [ 'src/components/ops/data-flow/stage-trend-data.ts', 'src/components/ops/review-content.tsx' ]
      expected: [ 'src/components/ops/review-content.tsx' ]
      test at tests/ops-nhan-theo-context.test.tsx:68:10

- cmd: cd pipeline && npm test
  run_id: minted-df0-chang-theo-ngay-diem-0-SUITE-npm_test__13563d-r1
  exit_code: 0
  verified_at: 2026-10-26T23:56:03Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-df0-chang-theo-ngay-diem-0-SUITE-test_lint_rules-r1
  exit_code: 0
  verified_at: 2026-10-26T23:56:03Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-df0-chang-theo-ngay-diem-0-SUITE-node_scripts_check_portal_compliance_mjs-r1
  exit_code: 0
  verified_at: 2026-10-26T23:56:03Z

## Known limits

## Ngoài hợp đồng

## Analyst

baseline: BLOCKED ha tang — lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «<\tool_use_error>Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.<\/tool_use_error>»

Baseline khong do:
- cd app && node --import tsx --test tests/df0-chang-theo-ngay.test.tsx: BLOCKED ha tang baseline: lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «<\tool_use_error>Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.<\/tool_use_error>»

Eval không-phân-biệt: none — nhưng baseline không đo được ở round này (BLOCKED hạ tầng), nên chưa có căn cứ khẳng định eval nào có phân biệt hay không; mọi field baseline đều là n-a.

Lệnh suite đỏ không gắn eval: `cd app && npm test` — ca ON12-AC-1 trong `tests/ops-nhan-theo-context.test.tsx` thấy danh sách tệp quét có thêm `src/components/ops/data-flow/stage-trend-data.ts` so với danh sách mong đợi chỉ có `src/components/ops/review-content.tsx`.

## Variance

none — mọi eval nhiều lần chạy đều đồng nhất (mọi eval chạy một lần, không có phương sai).

## Iterations

Round 1: không eval nào của hợp đồng đỏ; lệnh suite `cd app && npm test` đỏ ở ca ON12-AC-1 (tests/ops-nhan-theo-context.test.tsx) vì danh sách tệp quét có thêm stage-trend-data.ts, không gắn eval nào. Returned to implementation.
