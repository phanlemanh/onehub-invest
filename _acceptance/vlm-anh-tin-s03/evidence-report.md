---
schema_version: 2
feature_slug: vlm-anh-tin-s03
verdict: PASS
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 82d1723c9d040f257db00d428205a19e635747d4
human_signoff:
---

# Evidence Report: vlm-anh-tin-s03

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | test | PASS |
| E2 | AC-2 | test | PASS |
| E3 | AC-3 | test | PASS |
| E4 | AC-4 | test | PASS |
| E5 | AC-5 | test | PASS |
| E6 | AC-6 | test | PASS |
| E7 | AC-7 | test | PASS |
| E8 | AC-8 | test | PASS |
| E9 | AC-9 | judgment | PASS |
| E10 | AC-10 | test | PASS |
| E11 | AC-9 | script | PASS |

## Evidence

- eval: E1
  run_id: minted-vlm-anh-tin-s03-E1-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.vlm_pipeline
  verified_at: 2026-11-02T02:53:40Z
  output: |
    ℹ duration_ms 73.573292

- eval: E2
  run_id: minted-vlm-anh-tin-s03-E2-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.vlm_pipeline
  verified_at: 2026-11-02T02:53:40Z
  output: |
    ℹ duration_ms 73.573292

- eval: E3
  run_id: minted-vlm-anh-tin-s03-E3-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.vlm_agent
  verified_at: 2026-11-02T02:53:40Z
  output: |
    ℹ duration_ms 247.589542

- eval: E4
  run_id: minted-vlm-anh-tin-s03-E4-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.vlm_db
  verified_at: 2026-11-02T02:53:40Z
  output: |
    ℹ duration_ms 26760.493584

- eval: E5
  run_id: minted-vlm-anh-tin-s03-E5-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.vlm_db
  verified_at: 2026-11-02T02:53:40Z
  output: |
    ℹ duration_ms 26760.493584

- eval: E6
  run_id: minted-vlm-anh-tin-s03-E6-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.vlm_db
  verified_at: 2026-11-02T02:53:40Z
  output: |
    ℹ duration_ms 26760.493584

- eval: E7
  run_id: minted-vlm-anh-tin-s03-E7-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.vlm_db
  verified_at: 2026-11-02T02:53:40Z
  output: |
    ℹ duration_ms 26760.493584

- eval: E8
  run_id: minted-vlm-anh-tin-s03-E8-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.vlm_db
  verified_at: 2026-11-02T02:53:40Z
  output: |
    ℹ duration_ms 26760.493584

- eval: E9
  judged_by: judge panel de xuat (3 goc nhin, fresh context)
  verdict: PASS
  rationale: Ba góc nhìn đều thấy báo cáo đo đủ chín mục số, mỗi số có lệnh tái lập; nguồn chỉ gọi bằng mã S03 và không chép chữ bài.
  panel_votes:
    - domain-correctness: PASS — Báo cáo có đủ cả 11 mục hỏi. Bài có nhãn trước/sau là 0→100. JSON hỏng 0/54 (0%) và lo-url 0. Dòng có giá là 1, kèm bảng từng trường. Ảnh theo loại cộng đúng 53. Nhãn lộ nguồn là 3 ảnh dùng ở 7 bài. Ảnh khác nhau là 792 trên 3.278 lượt. Thời gian thật là 612 giây; ước hết tập đọc là 739×11,3 giây ≈ 2,3 giờ, tính đúng. Nguồn chỉ được gọi là S03 và báo cáo nói rõ không chép chữ bài. Các số khớp nhau (48+51+1+2306=2406; 792−739=53).
    - operational-feasibility: PASS — Báo cáo có đủ mọi mục được hỏi. Bài có nhãn trước/sau là 0 và 100. JSON hỏng là 0/54 (0%), lo-url 0, dòng có giá 1, và có bảng từng trường (Giá, Loại hình, Dự án, Diện tích, Phòng ngủ, Mã căn, Toà). Ảnh theo loại, 3 ảnh lộ nguồn dùng ở 7 bài, và 792 ảnh khác nhau trên 3.278 lượt đều có số. Thời gian thật 612 giây và ước hết tập đọc khoảng 2,3 giờ (739 × 11,3 giây, tính lại khớp) cũng có. Nguồn chỉ được gọi bằng mã S03, và báo cáo nói rõ tin rao chỉ nêu bằng số, không chép chữ bài.
    - spec-alignment: PASS — Báo cáo nêu đủ mọi mục được hỏi. Số bài có nhãn ảnh trước/sau là 0 và 100. JSON hỏng là 0/54 (0%) và lo-url là 0. Dòng có giá là 1, kèm bảng từng trường. Ảnh theo loại là 53 ảnh, các loại cộng đúng 53. Nhãn lộ nguồn là 3 ảnh, dùng ở 7 bài. Ảnh khác nhau là 792 trên 3.278 lượt. Thời gian thật là 612 giây, và ước hết tập đọc là khoảng 2,3 giờ, khớp với phép tính 739 × 11,3 giây. Nguồn chỉ được gọi bằng mã S03, và báo cáo nói rõ tin rao chỉ nêu bằng số, không có đoạn chữ nào của tin.
  human_override:  # chi nguoi ghi

- eval: E10
  run_id: minted-vlm-anh-tin-s03-E10-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.vlm_db
  verified_at: 2026-11-02T02:53:40Z
  output: |
    ℹ duration_ms 26760.493584

- eval: E11
  run_id: minted-vlm-anh-tin-s03-E11-r1
  exit_code: 0
  baseline: n-a
  verifier: pipeline/vlm-anh-s03.mjs
  verified_at: 2026-11-02T02:53:40Z
  output: |
    lô thật đạt

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-vlm-anh-tin-s03-SUITE-npm_test__bb6271-r1
  exit_code: 0
  verified_at: 2026-11-02T02:53:40Z

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-vlm-anh-tin-s03-SUITE-lint-r1
  exit_code: 0
  verified_at: 2026-11-02T02:53:40Z

- cmd: cd app && npm test
  run_id: minted-vlm-anh-tin-s03-SUITE-npm_test__bd9a35-r1
  exit_code: 0
  verified_at: 2026-11-02T02:53:40Z

- cmd: cd pipeline && npm test
  run_id: minted-vlm-anh-tin-s03-SUITE-npm_test__13563d-r1
  exit_code: 0
  verified_at: 2026-11-02T02:53:40Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-vlm-anh-tin-s03-SUITE-test_lint_rules-r1
  exit_code: 0
  verified_at: 2026-11-02T02:53:40Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-vlm-anh-tin-s03-SUITE-node_scripts_check_portal_compliance_mjs-r1
  exit_code: 0
  verified_at: 2026-11-02T02:53:40Z

## Known limits

## Ngoài hợp đồng

## Analyst

none — không có eval nào được phát hiện là xanh ở cả hai phía; cả bốn lệnh feature đều là eval mới nên baseline không đo (n-a), xem mục dưới.

Baseline khong do:
- node --test pipeline/tests/vlm-anh.test.mjs: bo qua baseline: tep pipeline/tests/vlm-anh.test.mjs co o cay dang kiem nhung chua co o merge-base e6543f3a65e6e0a1483333a8be93fc66777e7640 — eval moi, chay tren code cu khong phan biet gi
- cd agent && node --import tsx --test tests/vlm-anh-s03.test.ts: bo qua baseline: tep agent/tests/vlm-anh-s03.test.ts co o cay dang kiem nhung chua co o merge-base e6543f3a65e6e0a1483333a8be93fc66777e7640 — eval moi, chay tren code cu khong phan biet gi
- cd agent && node --import tsx --test tests/vlm-anh-s03-db.itest.ts: bo qua baseline: tep agent/tests/vlm-anh-s03-db.itest.ts co o cay dang kiem nhung chua co o merge-base e6543f3a65e6e0a1483333a8be93fc66777e7640 — eval moi, chay tren code cu khong phan biet gi
- "node pipeline/vlm-anh-s03.mjs --dem --kiem-lo-that": bo qua baseline: tep pipeline/vlm-anh-s03.mjs co o cay dang kiem nhung chua co o merge-base e6543f3a65e6e0a1483333a8be93fc66777e7640 — eval moi, chay tren code cu khong phan biet gi

## Variance

none — every multi-run eval is uniform (mọi eval chạy một lần, xác định, không eval nào có phương sai).

## Iterations

Round 1: toàn bộ eval máy xanh, E9 do hội đồng đề xuất PASS (human_override để trống cho người quyết ở Cổng 2).
