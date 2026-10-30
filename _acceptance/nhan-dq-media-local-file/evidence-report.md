---
schema_version: 2
feature_slug: nhan-dq-media-local-file
verdict: PASS
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: db00491027b41eb5967cbd3bb6a95a263b90b189
human_signoff: Mạnh 2026-10-30
---

# Evidence Report: nhan-dq-media-local-file

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | test | PASS |
| E2 | AC-2 | test | PASS |
| E3 | AC-3 | test | PASS |
| E4 | AC-4 | test | PASS |
| E5 | AC-5 | test | PASS |
| E6 | AC-5 | test | PASS |
| E7 | AC-5 | judgment | PASS |

## Evidence

- eval: E1
  run_id: minted-nhan-dq-media-local-file-E1-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.app_ui
  verified_at: 2026-10-30T04:58:21Z
  output: |
    cd app && npm test (1 lần chạy, 1 lần đạt, không phương sai)
    ca 'media:local-file có tên kiểm, đối tượng và chi tiết tiếng Việt' xanh
    ℹ duration_ms 52767.156708

- eval: E2
  run_id: minted-nhan-dq-media-local-file-E2-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.app_ui
  verified_at: 2026-10-30T04:58:21Z
  output: |
    cd app && npm test (cùng lần chạy với E1)
    ca khuôn lệch của media:local-file vẫn rơi về «chưa diễn giải» xanh
    ℹ duration_ms 52767.156708

- eval: E3
  run_id: minted-nhan-dq-media-local-file-E3-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.app_ui
  verified_at: 2026-10-30T04:58:21Z
  output: |
    cd app && npm test (cùng lần chạy với E1)
    dqDetail('media:local-file', ...) trả '182.852 ảnh · 0 đã tải · 27.702 tin có ảnh', chiều đỏ khuôn lạ xanh
    ℹ duration_ms 52767.156708

- eval: E4
  run_id: minted-nhan-dq-media-local-file-E4-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.ops_nhan
  verified_at: 2026-10-30T04:58:21Z
  output: |
    cd app && node --import tsx --test tests/ops-nhan-theo-context.test.tsx
    ca 'ON12-AC-5 bảng kiểm chất lượng trên DB local diễn giải đủ' xanh
    ℹ duration_ms 11669.099667

- eval: E5
  run_id: minted-nhan-dq-media-local-file-E5-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.app_ui
  verified_at: 2026-10-30T04:58:21Z
  output: |
    cd app && npm test toàn bộ xanh
    ℹ duration_ms 52767.156708

- eval: E6
  run_id: minted-nhan-dq-media-local-file-E6-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.app
  verified_at: 2026-10-30T04:58:21Z
  output: |
    cd app && npx tsc --noEmit && npm run lint
    typecheck và lint không lỗi

- eval: E7
  judged_by: judge panel đề xuất (3 thấu kính, fresh context)
  verdict: PASS
  rationale: CONTEXT.md có khối «Ảnh tin» với dòng Code nêu kiểm media:local-file; dq-labels.ts ánh xạ media:local-file thành «Ảnh tin đã tải», dùng đúng thuật ngữ và không chứa tên nào ở dòng _Avoid_.
  human_override:  # chi nguoi ghi

### Panel judge đề xuất cho E7

Đề xuất panel: PASS. Người quyết ở Cổng 2 điền human_override nếu đồng ý.

- domain-correctness: PASS — CONTEXT.md dòng 541-544 có khối in đậm **Ảnh tin**, dòng Code nêu kiểm `media:local-file`, và đoạn mô tả nhắc «Ảnh tin đã tải». Dòng _Avoid_ của khối chỉ liệt kê «media canonical» và «ảnh khu vực». Nhãn trong dq-labels.ts dòng 23 là "media:local-file": "Ảnh tin đã tải", dùng đúng thuật ngữ «Ảnh tin» và không chứa tên nào trong dòng _Avoid_.
- operational-feasibility: PASS — CONTEXT.md dòng 541-544 có khối in đậm **Ảnh tin**. Dòng Code của khối ghi `media` (`transform-media.mjs`, `loadOfferMedia`), kiểm `media:local-file`. dq-labels.ts dòng 23 ánh xạ "media:local-file" thành "Ảnh tin đã tải", tức dùng đúng thuật ngữ «Ảnh tin». Nhãn không chứa «media canonical» hay «ảnh khu vực» ở dòng _Avoid_.
- spec-alignment: PASS — CONTEXT.md có khối in đậm «**Ảnh tin**» với dòng Code ghi kiểm `media:local-file`, và dòng _Avoid_ chỉ liệt kê «media canonical» và «ảnh khu vực». dq-labels.ts ánh xạ `media:local-file` thành «Ảnh tin đã tải», khớp thuật ngữ «Ảnh tin» và không dùng tên nào ở dòng _Avoid_.

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-nhan-dq-media-local-file-SUITE-npm_test__bb6271-r1
  exit_code: 0
  verified_at: 2026-10-30T04:58:21Z

- cmd: cd pipeline && npm test
  run_id: minted-nhan-dq-media-local-file-SUITE-npm_test__13563d-r1
  exit_code: 0
  verified_at: 2026-10-30T04:58:21Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-nhan-dq-media-local-file-SUITE-test_lint_rules-r1
  exit_code: 0
  verified_at: 2026-10-30T04:58:21Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-nhan-dq-media-local-file-SUITE-node_scripts_check_portal_compliance_mjs-r1
  exit_code: 0
  verified_at: 2026-10-30T04:58:21Z

## Known limits

## Ngoài hợp đồng

## Analyst

baseline: BLOCKED ha tang — lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.»

Danh sách eval không-phân-biệt (xanh cả trên HEAD lẫn baseline) không đo được ở round này vì baseline bị chặn; mọi field baseline ghi n-a.

Baseline khong do

- cd app && npm test: BLOCKED ha tang baseline: lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.»
- cd app && node --import tsx --test tests/ops-nhan-theo-context.test.tsx: BLOCKED ha tang baseline: lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.»
- cd app && npx tsc --noEmit && npm run lint: BLOCKED ha tang baseline: lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.»

## Variance

none — mọi eval chạy một lần, xác định, không có phương sai

## Iterations

Round 1: mọi eval máy đạt (E1-E6), E7 do panel đề xuất PASS; không eval nào hỏng. Baseline bị chặn hạ tầng nên không đo được tính phân biệt.
