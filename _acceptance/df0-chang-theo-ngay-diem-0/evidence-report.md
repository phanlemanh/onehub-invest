---
schema_version: 2
feature_slug: df0-chang-theo-ngay-diem-0
verdict: REJECT
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 535dfddeb7ad99acdec645d2894ef36ae9fc7ec1
human_signoff:
---

# Evidence Report: df0-chang-theo-ngay-diem-0

Round 2. Không eval nào của hợp đồng đỏ, nhưng lệnh suite hồi quy `cd app && npm test` vẫn đỏ ở một ca không gắn eval nào (GV-AC-3 trong `tests/gio-ops-gio-vn.test.tsx`), nên tổng thể là REJECT. Bảy eval máy (E1, E2, E3, E4, E5, E7, E8) mang sang từ round 1 vì delta không chạm paths của chúng; E6 là đề xuất của hội đồng judge. Chi tiết ở khối suite bên dưới và mục Iterations.

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

Sáu eval test E1, E2, E3, E4, E5, E8 và eval ui-check E7 được mang sang nguyên trạng từ round 1 (cùng run_id, cùng verified_at); round này không chạy lại chúng.

- eval: E1
  run_id: minted-df0-chang-theo-ngay-diem-0-E1-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.chang_ngay
  verified_at: 2026-10-26T23:56:03Z
  carried_from_round: 1
  note: carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E2
  run_id: minted-df0-chang-theo-ngay-diem-0-E2-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.chang_ngay
  verified_at: 2026-10-26T23:56:03Z
  carried_from_round: 1
  note: carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E3
  run_id: minted-df0-chang-theo-ngay-diem-0-E3-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.chang_ngay
  verified_at: 2026-10-26T23:56:03Z
  carried_from_round: 1
  note: carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E4
  run_id: minted-df0-chang-theo-ngay-diem-0-E4-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.chang_ngay
  verified_at: 2026-10-26T23:56:03Z
  carried_from_round: 1
  note: carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E5
  run_id: minted-df0-chang-theo-ngay-diem-0-E5-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.chang_ngay
  verified_at: 2026-10-26T23:56:03Z
  carried_from_round: 1
  note: carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E6
  judged_by: judge-subagent (fresh context), đề xuất panel 3 góc nhìn
  verdict: PASS
  rationale: Cả ba góc nhìn cùng xác nhận chuỗi truyền một nguồn thời gian, từ page.tsx qua DataFlowView tới StageTrendChart, và biểu đồ dựng từ dailySeries mà không sort hay slice trên danh sách ngày có số.
  votes:
    - domain-correctness: PASS — page.tsx tạo đúng một biến `nowMs = requestTime()` (dòng 45) và dùng nó cho `getDataFlow(window, { now: nowMs })` lẫn `<DataFlowView nowMs={nowMs} />`. data-flow-view.tsx chuyển nguyên `nowMs` vào `<StageTrendChart nowMs={nowMs} …/>`. stage-trend-chart.tsx dựng `series = dailySeries(days, nowMs, windowDays)` rồi `data = series.map(...)`, không có bước sort hay slice trên danh sách ngày có số.
    - operational-feasibility: PASS — page.tsx gọi requestTime() đúng một lần (`const nowMs`) và dùng chính biến đó cho `getDataFlow(window, { now: nowMs })` lẫn `<DataFlowView nowMs={nowMs} />`. data-flow-view.tsx chuyển nguyên `nowMs` sang `<StageTrendChart nowMs={nowMs} …>`. stage-trend-chart.tsx dựng `data` từ `dailySeries(days, nowMs, windowDays)` và không có sort/slice nào trên danh sách ngày có số. Tôi không đọc ruột `dailySeries` vì nó nằm ngoài danh sách input, và câu hỏi chỉ hỏi chart có dựng từ hàm đó hay không.
    - spec-alignment: PASS — page.tsx gọi requestTime() đúng một lần (`const nowMs`), rồi dùng nó cho `getDataFlow(window, { now: nowMs })` và prop `nowMs={nowMs}` của DataFlowView. data-flow-view.tsx truyền nguyên `nowMs` đó vào `<StageTrendChart ... nowMs={nowMs} />`. stage-trend-chart.tsx dựng dữ liệu bằng `dailySeries(days, nowMs, windowDays)` rồi map sang `data`, và file này không có bước sort rồi slice danh sách các ngày có số.
  required_evidence:
    - (judge không nêu bằng-chứng-thiếu)
  human_override:  # chi nguoi ghi

- eval: E7
  run_id: minted-df0-chang-theo-ngay-diem-0-E7-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.design.ui_check
  verified_at: 2026-10-26T23:56:03Z
  carried_from_round: 1
  note: carry-forward tu round 1 — delta khong cham paths cua eval
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
  carried_from_round: 1
  note: carry-forward tu round 1 — delta khong cham paths cua eval

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-df0-chang-theo-ngay-diem-0-SUITE-npm_test__bb6271-r2
  exit_code: 0
  verified_at: 2026-10-27T00:01:56Z

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-df0-chang-theo-ngay-diem-0-SUITE-lint-r2
  exit_code: 0
  verified_at: 2026-10-27T00:01:56Z

- cmd: cd app && npm test
  run_id: minted-df0-chang-theo-ngay-diem-0-SUITE-npm_test__bd9a35-r2
  exit_code: 1
  verified_at: 2026-10-27T00:01:56Z
  output: |
    ℹ tests 526 / pass 525 / fail 1
    ✖ GV-AC-3 không còn mốc cắt chuỗi hay ngày theo múi máy ngoài danh sách miễn
      tests/gio-ops-gio-vn.test.tsx (dòng 322): danh sách vi phạm thực tế có hai mục, danh sách mong đợi rỗng
      - src/components/ops/data-flow/stage-trend-data.ts, mẫu «cắt chuỗi mốc»
      - src/components/ops/data-flow/stage-trend-data.ts, mẫu «toISOString cắt»

- cmd: cd pipeline && npm test
  run_id: minted-df0-chang-theo-ngay-diem-0-SUITE-npm_test__13563d-r2
  exit_code: 0
  verified_at: 2026-10-27T00:01:56Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-df0-chang-theo-ngay-diem-0-SUITE-test_lint_rules-r2
  exit_code: 0
  verified_at: 2026-10-27T00:01:56Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-df0-chang-theo-ngay-diem-0-SUITE-node_scripts_check_portal_compliance_mjs-r2
  exit_code: 0
  verified_at: 2026-10-27T00:01:56Z

## Known limits

## Ngoài hợp đồng

## Analyst

none — nhưng baseline là n-a cho mọi eval mang sang từ round 1 (round này không chạy lại chúng, nên không đo baseline), vì vậy chưa có căn cứ khẳng định eval nào có phân biệt hay không.

Lệnh suite đỏ không gắn eval: `cd app && npm test` — ca GV-AC-3 trong `tests/gio-ops-gio-vn.test.tsx` thấy tệp `src/components/ops/data-flow/stage-trend-data.ts` khớp hai mẫu cấm («cắt chuỗi mốc» và «toISOString cắt») trong khi danh sách miễn của ca không có tệp này. Đây là hồi quy do round 1 kê tệp vào danh sách quét của ca khác (commit f3eefddc); nó không thuộc AC nào của hợp đồng.

## Variance

none — mọi eval nhiều lần chạy đều đồng nhất (mọi eval chạy một lần, không có phương sai).

## Iterations

Round 1: không eval nào của hợp đồng đỏ; lệnh suite `cd app && npm test` đỏ ở ca ON12-AC-1 (tests/ops-nhan-theo-context.test.tsx) vì danh sách tệp quét có thêm stage-trend-data.ts, không gắn eval nào. Returned to implementation.

Round 2: không eval nào của hợp đồng đỏ (bảy eval máy mang sang từ round 1, E6 đề xuất PASS); lệnh suite `cd app && npm test` vẫn đỏ, lần này ở ca GV-AC-3 (tests/gio-ops-gio-vn.test.tsx) vì stage-trend-data.ts khớp hai mẫu cắt chuỗi mốc / toISOString cắt ngoài danh sách miễn, không gắn eval nào. Returned to implementation.
