---
schema_version: 2
feature_slug: deals-loai-tin-phi-ly
verdict: PASS
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: d400714c56e9347eadd3fb6552bd2f37978b385e
human_signoff:
---

# Evidence Report: deals-loai-tin-phi-ly

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | test | PASS |
| E2 | AC-2 | test | PASS |
| E3 | AC-3 | test | PASS |
| E4 | AC-4 | test | PASS |
| E5 | AC-5 | test | PASS |
| E6 | AC-6 | test | PASS |
| E7 | AC-7 | script | PASS |
| E8 | AC-8 | judgment | PASS |

## Evidence

- eval: E1
  run_id: minted-deals-loai-tin-phi-ly-E1-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.test.pipeline
  verified_at: 2026-10-24T12:12:04Z
  output: |
    cd pipeline && npm test
    ca "DP-AC-1 ma trận lý do" đạt đủ 13 assert
    ℹ duration_ms 7656.369042

- eval: E2
  run_id: minted-deals-loai-tin-phi-ly-E2-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.test.pipeline
  verified_at: 2026-10-24T12:12:04Z
  output: |
    cd pipeline && npm test
    ca "DP-AC-2 loaiTinPhiLy" và "DP-AC-2 refreshBaitGap giữ registry người bán" đạt
    ℹ duration_ms 7656.369042

- eval: E3
  run_id: minted-deals-loai-tin-phi-ly-E3-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.test.app_ui
  verified_at: 2026-10-24T12:12:04Z
  output: |
    cd app && npm test
    ca "DP-AC-3 trang đọc bait_gap_pct" đạt
    ℹ duration_ms 10205.41275

- eval: E4
  run_id: minted-deals-loai-tin-phi-ly-E4-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.test.app_ui
  verified_at: 2026-10-24T12:12:04Z
  output: |
    cd app && npm test
    ca "DP-AC-4 tin sát trần đứng sau" và "DP-AC-4 sắp trước khi cắt" đạt
    ℹ duration_ms 10205.41275

- eval: E5
  run_id: minted-deals-loai-tin-phi-ly-E5-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.test.app_ui
  verified_at: 2026-10-24T12:12:04Z
  output: |
    cd app && npm test
    ca "DP-AC-5 bản cloud" đạt
    ℹ duration_ms 10205.41275

- eval: E6
  run_id: minted-deals-loai-tin-phi-ly-E6-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.test.app_ui
  verified_at: 2026-10-24T12:12:04Z
  output: |
    cd app && npm test
    ca "DP-AC-6 thẻ" đạt
    ℹ duration_ms 10205.41275

- eval: E7
  run_id: minted-deals-loai-tin-phi-ly-E7-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.deals_phi_ly_do
  verified_at: 2026-10-24T12:12:04Z
  output: |
    cd app && node --import tsx ../scripts/deals-phi-ly-do.mjs
    deals-phi-ly-do: ĐẠT

- eval: E8
  judged_by: judge-subagent (fresh context)
  verdict: PASS
  rationale: Đề xuất panel ba lăng kính (domain-correctness, operational-feasibility, spec-alignment), cả ba cùng PASS. CONTEXT.md có mục «Tin cần xác minh» đủ bốn phần (nhãn, tên trong code `suspect` và `NGHI_NGO_PCT = 35`, định nghĩa, từ tránh dùng), không mâu thuẫn với mục «Căn giá tốt».
  votes:
    - domain-correctness: PASS — CONTEXT.md có mục «Tin cần xác minh» đủ bốn phần. Nhãn là «Tin cần xác minh». Tên trong code là `suspect` và `NGHI_NGO_PCT = 35` (`app/src/lib/deals.ts`). Định nghĩa nói căn rẻ hơn thước quá 35% vẫn hiện nhưng đứng sau các căn giảm đến 35%. Từ tránh dùng là «tin nghi ngờ, tin ảo, mới». Mục «Căn giá tốt» chỉ định nghĩa giá/m² thấp hơn thước và không nêu điều gì trái với mục kia.
    - operational-feasibility: PASS — CONTEXT.md dòng 88-91 có mục «Tin cần xác minh» đủ cả bốn phần. Nhãn là «Tin cần xác minh». Tên trong code là `suspect` và `NGHI_NGO_PCT = 35`. Định nghĩa nói rẻ hơn thước quá 35%, vẫn hiện nhưng đứng sau mọi căn giảm đến 35%. Dòng `_Avoid_` có «tin nghi ngờ, tin ảo». Mục «Căn giá tốt» (dòng 83-86) chỉ định nghĩa giá/m² thấp hơn thước theo phường và loại hình, không nói gì trái với mục này.
    - spec-alignment: PASS — CONTEXT.md dòng 88-91 có mục «Tin cần xác minh» đủ bốn phần. Nhãn là «Tin cần xác minh». Tên trong code là `suspect` và `NGHI_NGO_PCT = 35` ở `app/src/lib/deals.ts`. Định nghĩa nêu căn rẻ hơn thước giá quá 35%, vẫn hiện nhưng đứng sau mọi căn giảm đến 35%. Từ tránh dùng là «tin nghi ngờ, tin ảo, "mới"». Mục «Căn giá tốt» (dòng 83-86) chỉ nói giá/m² thấp hơn thước giá cùng phường và loại hình, không mâu thuẫn với mục kia. Mục «Thước giá» cũng khớp.
  human_override:  # chi nguoi ghi

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-deals-loai-tin-phi-ly-SUITE-npm_test-r1
  exit_code: 0
  verified_at: 2026-10-24T12:12:04Z

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-deals-loai-tin-phi-ly-SUITE-lint-r1
  exit_code: 0
  verified_at: 2026-10-24T12:12:04Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-deals-loai-tin-phi-ly-SUITE-test_lint_rules-r1
  exit_code: 0
  verified_at: 2026-10-24T12:12:04Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-deals-loai-tin-phi-ly-SUITE-node_scripts_check_portal_compliance_mjs-r1
  exit_code: 0
  verified_at: 2026-10-24T12:12:04Z

## Known limits

## Ngoài hợp đồng

## Analyst

Eval không-phân-biệt (xanh ở cả code mới lẫn baseline):
- cd pipeline && npm test: E1, E2
- cd app && npm test: E3, E4, E5, E6

Baseline khong do
- cd app && node --import tsx ../scripts/deals-phi-ly-do.mjs: bo qua baseline: tep scripts/deals-phi-ly-do.mjs co o cay dang kiem nhung chua co o merge-base fcc26947a4f1798d9ad5d20778fd4707de00d28f — eval moi, chay tren code cu khong phan biet gi

## Variance

none — every multi-run eval is uniform

## Iterations

Round 1: mọi eval máy (E1–E7) đạt, E8 do hội đồng đề xuất PASS (chờ người chốt ở human_override); không eval nào hỏng.
