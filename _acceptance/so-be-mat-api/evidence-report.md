---
schema_version: 2
feature_slug: so-be-mat-api
verdict: PASS
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 97a75ec3f0dd1d16d68073a59c08d2756253eab1
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
  run_id: minted-so-be-mat-api-E1-r2
  exit_code: 0
  baseline: green
  verifier: config:executors.script.portal_static
  verified_at: 2026-10-23T11:51:34Z
  output: |
    portal-compliance: ĐẠT

- eval: E2
  run_id: minted-so-be-mat-api-E2-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.api_surface_mutation
  verified_at: 2026-10-23T11:51:34Z
  output: |
    api-surface mutation: ĐẠT

- eval: E3
  run_id: minted-so-be-mat-api-E3-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.api_surface_mutation
  verified_at: 2026-10-23T11:51:34Z
  output: |
    api-surface mutation: ĐẠT

- eval: E4
  run_id: minted-so-be-mat-api-E4-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.api_surface_mutation
  verified_at: 2026-10-23T11:51:34Z
  output: |
    api-surface mutation: ĐẠT

- eval: E5
  run_id: minted-so-be-mat-api-E5-r1
  exit_code: 0
  verifier: config:executors.script.api_surface_smoke
  verified_at: 2026-10-23T11:44:00Z
  carried_from_round: 1
  # carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E6
  judged_by: judge panel (domain-correctness, operational-feasibility, spec-alignment), đề xuất PASS
  verdict: PASS
  rationale: |
    - domain-correctness: PASS — scripts/audit-all.sh dòng 108-114: offers gọi không token chỉ tính ĐẠT khi trả 401, gọi kèm bearer CTOKEN chỉ tính ĐẠT khi trả 200. Offers không còn được kiểm như API công khai (chú thích và thông báo ghi «tạm đóng»), kiểm công khai chỉ còn asset-stats. Tiêu đề mục «E. PUBLIC APIs» chưa đổi nhưng chỉ là nhãn hiển thị.
    - operational-feasibility: PASS — vòng lặp offers?kind=sale&limit=5 ở dòng 109-114 gọi hai lần với hai kỳ vọng 401 và 200; kiểm công khai thật là asset-stats ở dòng 106-107. Tiêu đề mục E vẫn ghi "PUBLIC APIs" nhưng không phải điều kiện kiểm.
    - spec-alignment: PASS — hai lời gọi có mặt với đúng mã mong đợi; chú thích dòng 108 và nhãn «(tạm đóng)» ghi rõ offers đang đóng; chỉ asset-stats còn bị đòi 200 khi gọi khách. Phần còn sót chỉ là nhãn tiêu đề mục E.
  human_override:  # chi nguoi ghi

- eval: E7
  run_id: minted-so-be-mat-api-E7-r1
  exit_code: 0
  verifier: config:executors.script.api_surface_smoke
  verified_at: 2026-10-23T11:44:00Z
  carried_from_round: 1
  # carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E8
  run_id: minted-so-be-mat-api-E8-r1
  exit_code: 0
  verifier: config:executors.test.app_ui
  verified_at: 2026-10-23T11:44:00Z
  carried_from_round: 1
  # carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E9
  run_id: minted-so-be-mat-api-E9-r1
  exit_code: 0
  verifier: config:executors.script.api_surface_smoke
  verified_at: 2026-10-23T11:44:00Z
  carried_from_round: 1
  # carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E10
  run_id: minted-so-be-mat-api-E10-r1
  exit_code: 0
  verifier: config:executors.script.deals_smoke_local_guard
  verified_at: 2026-10-23T11:44:00Z
  carried_from_round: 1
  # carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E11
  judged_by: judge panel (domain-correctness, operational-feasibility, spec-alignment), đề xuất PASS
  verdict: PASS
  rationale: |
    - domain-correctness: PASS — quy định 10 trong portals.md nêu sổ ở app/src/lib/api-surface.ts, mỗi dòng gồm đường, phương thức, chế độ (có note); bảng năm chế độ ghi ai gọi được và cổng trong mã; chế độ public cấm đọc sale_offers kể cả gián tiếp qua thư viện, ví dụ /api/v1/offers và /api/v1/deals ở chế độ ops minh hoạ đúng luật; nêu check-api-surface.mjs trong CI và nguyên tắc sổ không được hẹp hơn mã.
    - operational-feasibility: PASS — portals.md dòng 225-240 nêu vị trí sổ, thêm route thì thêm dòng cùng commit, bảng năm chế độ kèm cổng trong mã, CI đỏ khi sai; người thêm route làm đúng được.
    - spec-alignment: PASS — đủ ba ý: sổ nằm ở đâu kèm rào CI, bảng năm chế độ, luật public không đọc sale_offers kể cả gián tiếp; đủ để người thêm route mới chọn chế độ và đặt cổng đúng.
  human_override:  # chi nguoi ghi

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-so-be-mat-api-SUITE-npm_test__bb6271-r2
  exit_code: 0
  verified_at: 2026-10-23T11:51:34Z

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-so-be-mat-api-SUITE-lint-r2
  exit_code: 0
  verified_at: 2026-10-23T11:51:34Z

- cmd: cd app && npm test
  run_id: minted-so-be-mat-api-SUITE-npm_test__bd9a35-r2
  exit_code: 0
  verified_at: 2026-10-23T11:51:34Z

- cmd: cd pipeline && npm test
  run_id: minted-so-be-mat-api-SUITE-npm_test__13563d-r2
  exit_code: 0
  verified_at: 2026-10-23T11:51:34Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-so-be-mat-api-SUITE-test_lint_rules-r2
  exit_code: 0
  verified_at: 2026-10-23T11:51:34Z

## Known limits

## Ngoài hợp đồng

## Analyst

Eval không phân biệt (xanh ở cả HEAD lẫn baseline, chứng minh harness chứ không phải feature; viết lại để assert hành vi mới hoặc xác nhận là regression-guard có chủ ý):

- E1 (node scripts/check-portal-compliance.mjs)

Baseline khong do:

- node scripts/check-api-surface.mjs mutation: bo qua baseline: tep scripts/check-api-surface.mjs co o cay dang kiem nhung chua co o merge-base 40b18d5b92046a4f5e3e1d905bffbe4e9bde02f5 — eval moi, chay tren code cu khong phan biet gi

## Variance

none — every multi-run eval is uniform

## Iterations

Round 1: mọi eval máy đạt (E1-E5, E7-E10) và hai judgment đề xuất PASS (E6, E11) — không cần quay lại implementation.
Round 2: sau bản fix S4-r1 (chế độ chỉ-phiên cấm nhánh bearer, khai lại 6 route ops), chạy lại E1-E4 cùng các lệnh suite, tất cả đạt; E5, E7-E10 mang sang từ round 1 vì delta không chạm paths của chúng; hai judgment E6, E11 chấm lại và vẫn đề xuất PASS.
