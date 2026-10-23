---
schema_version: 2
feature_slug: so-be-mat-api
verdict: PASS
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 7a7841ebfb1a338ac48c55e68873312bcaae876d
human_signoff:
---

# Evidence Report: so-be-mat-api

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | script | PASS |
| E2 | AC-1 | script | PASS |
| E3 | AC-2 | script | PASS |
| E4 | AC-3 | script | PASS |
| E5 | AC-4 | script | PASS |
| E6 | AC-4 | judgment | PASS |
| E7 | AC-5 | script | PASS |
| E8 | AC-6 | test | PASS |
| E9 | AC-6 | script | PASS |
| E10 | AC-7 | script | PASS |
| E11 | AC-8 | judgment | PASS |

## Evidence

- eval: E1
  run_id: minted-so-be-mat-api-E1-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.script.portal_static
  verified_at: 2026-10-23T11:44:00Z
  output: |
    portal-compliance: ĐẠT

- eval: E2
  run_id: minted-so-be-mat-api-E2-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.api_surface_mutation
  verified_at: 2026-10-23T11:44:00Z
  output: |
    api-surface mutation: ĐẠT

- eval: E3
  run_id: minted-so-be-mat-api-E3-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.api_surface_mutation
  verified_at: 2026-10-23T11:44:00Z
  output: |
    api-surface mutation: ĐẠT

- eval: E4
  run_id: minted-so-be-mat-api-E4-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.api_surface_mutation
  verified_at: 2026-10-23T11:44:00Z
  output: |
    api-surface mutation: ĐẠT

- eval: E5
  run_id: minted-so-be-mat-api-E5-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.api_surface_smoke
  verified_at: 2026-10-23T11:44:00Z
  output: |
    api-surface-smoke: ĐẠT

- eval: E6
  judged_by: judge panel (domain-correctness, operational-feasibility, spec-alignment), đề xuất PASS
  verdict: PASS
  rationale: |
    - domain-correctness: PASS — scripts/audit-all.sh dòng 109-114: offers không token chỉ tính pass khi 401, kèm Bearer $CTOKEN chỉ tính pass khi 200; offers không còn được kỳ vọng 200 như API công khai, chỉ asset-stats còn kiểm kiểu công khai. Tiêu đề mục E vẫn ghi PUBLIC APIs nhưng chỉ là nhãn, không đổi cách đo.
    - operational-feasibility: PASS — cùng vòng lặp dòng 109-114 với hai kỳ vọng 401 và 200; chú thích dòng 108 và nhãn "(tạm đóng)" coi offers là bề mặt ops đang đóng. Điểm lấn cấn: vòng lặp vẫn nằm dưới tiêu đề "E. PUBLIC APIs", nhưng kỳ vọng và nhãn đã đổi.
    - spec-alignment: PASS — cả hai lời gọi có mặt với đúng mã mong đợi, offers không bị kiểm như API công khai; phần còn sót chỉ là nhãn tiêu đề mục E ở dòng 105.
  human_override:  # chi nguoi ghi

- eval: E7
  run_id: minted-so-be-mat-api-E7-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.api_surface_smoke
  verified_at: 2026-10-23T11:44:00Z
  output: |
    api-surface-smoke: ĐẠT

- eval: E8
  run_id: minted-so-be-mat-api-E8-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.test.app_ui
  verified_at: 2026-10-23T11:44:00Z
  output: |
    ℹ duration_ms 773.04675

- eval: E9
  run_id: minted-so-be-mat-api-E9-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.api_surface_smoke
  verified_at: 2026-10-23T11:44:00Z
  output: |
    api-surface-smoke: ĐẠT

- eval: E10
  run_id: minted-so-be-mat-api-E10-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.deals_smoke_local_guard
  verified_at: 2026-10-23T11:44:00Z
  output: |
    smoke-guard: ĐẠT

- eval: E11
  judged_by: judge panel (domain-correctness, operational-feasibility, spec-alignment), đề xuất PASS
  verdict: PASS
  rationale: |
    - domain-correctness: PASS — quy định 10 trong portals.md nêu sổ ở app/src/lib/api-surface.ts, mỗi route một dòng (đường, phương thức, chế độ) thêm cùng commit, CI báo đỏ khi sai; bảng năm chế độ nêu ai gọi được và cổng trong mã; chế độ public cấm đọc sale_offers kể cả gián tiếp; có luật "chưa chắc thì chọn chặt hơn" và ví dụ /api/v1/offers, /api/v1/deals ở chế độ ops.
    - operational-feasibility: PASS — portals.md dòng 225-239 giải thích năm chế độ trong một bảng, nêu luật public không đọc sale_offers, nêu việc thêm route phải thêm một dòng sổ cùng commit; người thêm route mới làm đúng được.
    - spec-alignment: PASS — có đủ ba ý: sổ nằm ở đâu kèm rào CI, bảng năm chế độ, luật public không đọc sale_offers kèm quy tắc chọn chặt hơn; đọc được không cần mở mã.
  human_override:  # chi nguoi ghi

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-so-be-mat-api-SUITE-npm_test__bb6271-r1
  exit_code: 0
  verified_at: 2026-10-23T11:44:00Z

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-so-be-mat-api-SUITE-lint-r1
  exit_code: 0
  verified_at: 2026-10-23T11:44:00Z

- cmd: cd pipeline && npm test
  run_id: minted-so-be-mat-api-SUITE-npm_test__13563d-r1
  exit_code: 0
  verified_at: 2026-10-23T11:44:00Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-so-be-mat-api-SUITE-test_lint_rules-r1
  exit_code: 0
  verified_at: 2026-10-23T11:44:00Z

## Known limits

## Ngoài hợp đồng

## Analyst

Eval không phân biệt (xanh ở cả HEAD lẫn baseline, chứng minh harness chứ không phải feature; viết lại để assert hành vi mới hoặc xác nhận là regression-guard có chủ ý):

- E1 (node scripts/check-portal-compliance.mjs)
- E8 (cd app && npm test)

Baseline khong do:

- node scripts/check-api-surface.mjs mutation: bo qua baseline: tep scripts/check-api-surface.mjs co o cay dang kiem nhung chua co o merge-base 40b18d5b92046a4f5e3e1d905bffbe4e9bde02f5 — eval moi, chay tren code cu khong phan biet gi
- BASE_URL=${BASE_URL:-http://localhost:3456} node scripts/smoke-api-surface.mjs: bo qua baseline: tep scripts/smoke-api-surface.mjs co o cay dang kiem nhung chua co o merge-base 40b18d5b92046a4f5e3e1d905bffbe4e9bde02f5 — eval moi, chay tren code cu khong phan biet gi
- node scripts/check-smoke-guard.mjs: bo qua baseline: tep scripts/check-smoke-guard.mjs co o cay dang kiem nhung chua co o merge-base 40b18d5b92046a4f5e3e1d905bffbe4e9bde02f5 — eval moi, chay tren code cu khong phan biet gi

## Variance

none — every multi-run eval is uniform

## Iterations

Round 1: mọi eval máy đạt (E1-E5, E7-E10) và hai judgment đề xuất PASS (E6, E11) — không cần quay lại implementation.
