---
schema_version: 2
feature_slug: app-test-chap-chon-e4b-sap
verdict: REJECT
failed_evals: ["E3"]
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: ff1f2b81e2b09627f2eead6112010de327552795
human_signoff:
---

# Evidence Report: app-test-chap-chon-e4b-sap

Round 2. Lệnh fail không gắn eval nào: không có. Lệnh fail gắn eval: `cd app && node --import tsx --test tests/can-gia-tot-doi-chieu.test.tsx` (E3).

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | test | PASS |
| E2 | AC-2 | test | PASS |
| E3 | AC-2 | test | FAIL |
| E4 | AC-2 | test | PASS |
| E5 | AC-3 | judgment | PASS (đề xuất của hội đồng, chờ người) |

## Evidence

- eval: E1
  run_id: minted-app-test-chap-chon-e4b-sap-E1-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.app_ui
  verified_at: 2026-11-11T01:00:02Z
  output: |
    cd app && npm test: 1 lần chạy, 1 đạt, không có phương sai.
    ℹ duration_ms 711477.798875

- eval: E2
  run_id: minted-app-test-chap-chon-e4b-sap-E2-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.tir_doi_chieu
  verified_at: 2026-11-11T01:00:02Z
  output: |
    cd app && node --import tsx --test tests/tin-rao-doi-chieu.test.tsx: 1 lần chạy, 1 đạt.
    ℹ duration_ms 174355.687834

- eval: E3
  run_id: minted-app-test-chap-chon-e4b-sap-E3-r2
  exit_code: 1
  baseline: n-a
  verifier: config:executors.test.can_gia_tot_doi_chieu
  verified_at: 2026-11-11T01:00:02Z
  output: |
    ✔ CGT-DC bộ đếm đo đủ mọi tin; đối chứng: lấy mẫu, tuần tự, không giới hạn đều đỏ (59.873792ms)
    CGT-DC đối chiếu 2106 tin trong 897 giây, giới hạn 5
    ✖ CGT-DC đối chiếu DB máy thu chỉ đọc (898758.542583ms)
    ℹ tests 2 · pass 1 · fail 1
    AssertionError: CGT-DC DB đổi sau đối chiếu
    DB đổi trong lúc chạy: m từ '538155' thành '538162' (o giữ '86645').

- eval: E4
  run_id: minted-app-test-chap-chon-e4b-sap-E4-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.app_ui
  verified_at: 2026-11-11T01:00:02Z
  output: |
    Cùng lệnh với E1 (cd app && npm test), 1 lần chạy, 1 đạt.
    ℹ duration_ms 711477.798875

- eval: E5
  judged_by: judge panel (fresh context) — đề xuất PASS, 3 phiếu
  verdict: PASS
  rationale: Đề xuất của hội đồng. Bảng thay lời chỉ đổi hai vế của AC-3 e4b-danh-sach-tin-nhanh, giữ 700 ms và bốn kiểu sắp, không đổi lời AC-7 của can-gia-tot-sua-ba-loi.
  human_override:  # chi nguoi ghi

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-app-test-chap-chon-e4b-sap-SUITE-npm_test__bb6271-r2
  exit_code: 0
  verified_at: 2026-11-11T01:00:02Z

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-app-test-chap-chon-e4b-sap-SUITE-lint-r2
  exit_code: 0
  verified_at: 2026-11-11T01:00:02Z

- cmd: cd pipeline && npm test
  run_id: minted-app-test-chap-chon-e4b-sap-SUITE-npm_test__13563d-r2
  exit_code: 0
  verified_at: 2026-11-11T01:00:02Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-app-test-chap-chon-e4b-sap-SUITE-test_lint_rules-r2
  exit_code: 0
  verified_at: 2026-11-11T01:00:02Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-app-test-chap-chon-e4b-sap-SUITE-node_scripts_check_portal_compliance_mjs-r2
  exit_code: 0
  verified_at: 2026-11-11T01:00:02Z

### Judge panel đề xuất cho E5

- domain-correctness: PASS — Bảng thay lời chỉ đổi đúng vế «trong suite app» ở When và «ở cả hai điều kiện» ở Then của AC-3 e4b-danh-sach-tin-nhanh. Trần 700 ms và cả bốn kiểu sắp được giữ. AC-7 của can-gia-tot-sua-ba-loi («một mình», trần 600 giây) giữ nguyên, không có câu nào khác nới trần, bỏ kiểu sắp hay đổi lời.
- operational-feasibility: PASS — Vế When bỏ «và trong suite app», chỉ còn chạy riêng trên DB máy thu (executor `tir_doi_chieu`). Vế Then bỏ «ở cả hai điều kiện», giữ «dưới 700 ms ở cả bốn kiểu sắp». Dòng AC-7 của can-gia-tot-sua-ba-loi ghi «không đổi lời» và lời thật đã là «chạy ca CGT-DC một mình» với trần 600 giây. Design doc cấm nới trần, nên không có câu nào nới trần, bỏ kiểu sắp hay đổi lời ngoài hai chỗ đó.
- spec-alignment: PASS — Lời cũ trong bảng khớp từng chữ với AC-3 của e4b-danh-sach-tin-nhanh. Lời mới chỉ bỏ vế suite và vế «ở cả hai điều kiện». Trần 700 ms và bốn kiểu sắp được giữ; AC-7 thật đúng là «chạy ca CGT-DC một mình» với trần máy 600 giây. Contract ghi rõ nới trần và đổi AC-7 là ngoài phạm vi.

human_override cho E5: để trống, người quyết ở Cổng 2.

## Known limits

## Ngoài hợp đồng

## Analyst

carried tu round 1 — baseline khong do lai round nay.

Không có eval không-phân-biệt được liệt kê. Lệnh suite xanh ở cả hai phía là regression-guard bình thường.

## Variance

none — mọi eval chạy một lần, không có eval nhiều lần với pass_rate hỗn hợp.

## Iterations

Round 2: E3 failed — ca 'CGT-DC đối chiếu DB máy thu chỉ đọc' chạy 897 giây trên 2106 tin P1 bán rồi đỏ vì DB máy thu đổi trong lúc chạy (đếm m từ 538155 thành 538162), tức DB sống bị ghi bởi tiến trình khác giữa hai lần đọc. Returned to implementation. Lịch sử round 1 giữ ở bản báo cáo cũ.
